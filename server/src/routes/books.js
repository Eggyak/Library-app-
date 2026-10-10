import { randomUUID } from 'node:crypto';
import express from 'express';
import multer from 'multer';
import { parse as parseCsv } from 'csv-parse/sync';
import { z } from 'zod';
import { recordAudit } from '../audit.js';
import { HttpError, sendSuccess } from '../errors.js';
import { removeUploadedFile, saveUploadedFile, validateUploadedFile } from '../uploads.js';

const bookFields = {
  title: z.string().trim().min(1).max(300),
  author: z.string().trim().min(1).max(240),
  isbn: z.string().trim().max(32).nullable().optional(),
  publisher: z.string().trim().max(200).nullable().optional(),
  publicationYear: z.number().int().min(1000).max(9999).nullable().optional(),
  description: z.string().max(5000).nullable().optional(),
  categoryId: z.string().max(100).nullable().optional(),
  shelfLocation: z.string().trim().max(200).nullable().optional(),
  quantityTotal: z.number().int().min(0).max(1_000_000),
  quantityAvailable: z.number().int().min(0).max(1_000_000),
};
const newArrivalSchema = z.object({
  ...bookFields,
  arrivalDate: z.iso.date().optional(),
}).strict().refine(book => book.quantityAvailable <= book.quantityTotal, {
  path: ['quantityAvailable'], message: 'Available quantity cannot exceed total quantity.',
});

const bookCreateSchema = z.object(bookFields).strict().refine(book => book.quantityAvailable <= book.quantityTotal, {
  path: ['quantityAvailable'], message: 'Available quantity cannot exceed total quantity.',
});
const bookUpdateSchema = z.object({ ...bookFields, version: z.number().int().min(1) }).strict()
  .refine(book => book.quantityAvailable <= book.quantityTotal, {
    path: ['quantityAvailable'], message: 'Available quantity cannot exceed total quantity.',
  });
const newArrivalUpdateSchema = z.object({
  ...bookFields,
  arrivalDate: z.iso.date().optional(),
  version: z.number().int().min(1),
}).strict().refine(book => book.quantityAvailable <= book.quantityTotal, {
  path: ['quantityAvailable'], message: 'Available quantity cannot exceed total quantity.',
});
const categorySchema = z.object({ name: z.string().trim().min(1).max(100) }).strict();
const querySchema = z.object({
  query: z.string().trim().max(200).default(''),
  category: z.string().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
}).strict();
const coverUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024, files: 1 } });
const parseCoverUpload = (request, response, next) => coverUpload.single('cover')(request, response, error => {
  if (!error) return next();
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') return next(new HttpError(413, 'COVER_TOO_LARGE', 'Cover images must be 20 MB or smaller.'));
    return next(new HttpError(400, 'COVER_UPLOAD_INVALID', 'Select one JPG, PNG, or WebP cover image and try again.'));
  }
  return next(error);
});

function serializeBook(row) {
  return {
    id: row.id,
    title: row.title,
    author: row.author,
    isbn: row.isbn,
    publisher: row.publisher,
    publicationYear: row.publicationYear,
    description: row.description,
    coverUrl: row.coverPath ? `/files/${encodeURIComponent(row.coverPath)}` : null,
    categoryId: row.categoryId,
    category: row.category,
    shelfLocation: row.shelfLocation,
    quantityTotal: row.quantityTotal,
    quantityAvailable: row.quantityAvailable,
    isNewArrival: Boolean(row.isNewArrival),
    arrivalDate: row.arrivalDate,
    version: row.version,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

const bookSelect = `
  SELECT books.id, books.title, books.author, books.isbn, books.publisher,
    books.publication_year AS publicationYear, books.description, books.cover_path AS coverPath,
    books.category_id AS categoryId, categories.name AS category,
    books.shelf_location AS shelfLocation, books.quantity_total AS quantityTotal,
    books.quantity_available AS quantityAvailable, books.is_new_arrival AS isNewArrival,
    books.arrival_date AS arrivalDate, books.version,
    books.created_at AS createdAt, books.updated_at AS updatedAt
  FROM books LEFT JOIN categories ON categories.id = books.category_id
`;

function insertBook(database, input, actor, ipAddress, arrivalDate = null, auditModule = 'books') {
  const normalizedIsbn = input.isbn?.trim() || null;
  const duplicate = database.prepare(`
    SELECT id FROM books WHERE lower(title) = lower(?) AND lower(author) = lower(?)
      AND COALESCE(isbn, '') = COALESCE(?, '') LIMIT 1
  `).get(input.title, input.author, normalizedIsbn);
  if (duplicate) throw new HttpError(409, 'DUPLICATE_BOOK', 'A book with the same title, author, and ISBN already exists.');
  if (input.categoryId && !database.prepare('SELECT 1 FROM categories WHERE id = ?').get(input.categoryId)) {
    throw new HttpError(400, 'CATEGORY_NOT_FOUND', 'Selected category does not exist.');
  }

  const id = `book_${randomUUID()}`;
  const now = new Date().toISOString();
  database.prepare(`
    INSERT INTO books (
      id, title, author, isbn, publisher, publication_year, description, category_id,
      shelf_location, quantity_total, quantity_available, is_new_arrival, arrival_date, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, input.title, input.author, normalizedIsbn, input.publisher || null,
    input.publicationYear ?? null, input.description || null, input.categoryId || null,
    input.shelfLocation || null, input.quantityTotal, input.quantityAvailable, Number(Boolean(arrivalDate)), arrivalDate, now, now);
  const book = serializeBook(database.prepare(`${bookSelect} WHERE books.id = ?`).get(id));
  recordAudit(database, {
    actorUserId: actor.id,
    actorEmail: actor.email,
    action: 'create',
    module: auditModule,
    recordId: id,
    summary: `Added book '${book.title}'.`,
    ipAddress,
    after: book,
  });
  return book;
}

function updateBookCover(database, request, bookId, arrivalsOnly = false) {
  if (!request.file) throw new HttpError(400, 'COVER_REQUIRED', 'Select a cover image.');
  validateUploadedFile(request.file, ['image/jpeg', 'image/png', 'image/webp']);
  const row = database.prepare(`SELECT id, cover_path AS coverPath, is_new_arrival AS isNewArrival
    FROM books WHERE id = ?`).get(bookId);
  if (!row || (arrivalsOnly && !row.isNewArrival)) throw new HttpError(404, 'BOOK_NOT_FOUND', 'Book not found.');
  if (row.coverPath && request.auth.system_key !== 'local_development') {
    const module = arrivalsOnly ? 'new_arrivals' : 'books';
    const canReplace = database.prepare(`SELECT 1 FROM role_permissions
      WHERE role_id = ? AND module = ? AND action = 'update' AND allowed = 1`).get(request.auth.role_id, module);
    if (!canReplace) throw new HttpError(403, 'PERMISSION_DENIED', 'Update access is required to replace an existing book cover.');
  }
  const storedName = saveUploadedFile(request.file);
  try {
    const now = new Date().toISOString();
    database.prepare('UPDATE books SET cover_path = ?, version = version + 1, updated_at = ? WHERE id = ?').run(storedName, now, row.id);
    if (row.coverPath) removeUploadedFile(row.coverPath);
  } catch (error) {
    removeUploadedFile(storedName);
    throw error;
  }
  const book = serializeBook(database.prepare(`${bookSelect} WHERE books.id = ?`).get(row.id));
  recordAudit(database, { actorUserId: request.auth.id, actorEmail: request.auth.email, action: 'update_cover', module: arrivalsOnly ? 'new_arrivals' : 'books', recordId: row.id, summary: `Updated cover for '${book.title}'.`, ipAddress: request.ip, before: { coverUrl: row.coverPath }, after: { coverUrl: book.coverUrl } });
  return book;
}

export function createBooksRouter(database, middleware) {
  const router = express.Router();
  const requireBook = middleware.requireAuth;
  const requireRead = middleware.requirePermission('books', 'read');
  const requireWrite = middleware.requirePermission('books', 'write');
  const requireUpdate = middleware.requirePermission('books', 'update');
  const requireDelete = middleware.requirePermission('books', 'delete');
  const requireBookCover = middleware.requireAnyPermission([{ module: 'books', action: 'update' }, { module: 'books', action: 'write' }]);
  const requireArrivalCover = middleware.requireAnyPermission([{ module: 'new_arrivals', action: 'update' }, { module: 'new_arrivals', action: 'write' }]);
  const ready = middleware.requirePasswordChanged;

  router.get('/new-arrivals', (request, response, next) => {
    try {
      const query = querySchema.parse(request.query);
      const total = database.prepare('SELECT COUNT(*) AS count FROM books WHERE is_new_arrival = 1').get().count;
      const items = database.prepare(`${bookSelect} WHERE books.is_new_arrival = 1
        ORDER BY books.arrival_date DESC, books.created_at DESC LIMIT ? OFFSET ?`)
        .all(query.pageSize, (query.page - 1) * query.pageSize).map(serializeBook);
      return sendSuccess(response, { items, pagination: { page: query.page, pageSize: query.pageSize, total, pageCount: Math.ceil(total / query.pageSize) } });
    } catch (error) { return next(error); }
  });

  router.post('/new-arrivals', requireBook, ready, middleware.requirePermission('new_arrivals', 'write'), (request, response, next) => {
    try {
      const input = newArrivalSchema.parse(request.body);
      const book = insertBook(database, input, request.auth, request.ip, input.arrivalDate || new Date().toISOString().slice(0, 10), 'new_arrivals');
      return sendSuccess(response, book, 201);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return next(new HttpError(409, 'DUPLICATE_ISBN', 'A book with this ISBN already exists.'));
      return next(error);
    }
  });

  router.post('/new-arrivals/:bookId/cover', requireBook, ready, requireArrivalCover, parseCoverUpload, (request, response, next) => {
    try { return sendSuccess(response, updateBookCover(database, request, request.params.bookId, true)); }
    catch (error) { return next(error); }
  });

  router.put('/new-arrivals/:bookId', requireBook, ready, middleware.requirePermission('new_arrivals', 'update'), (request, response, next) => {
    try {
      const input = newArrivalUpdateSchema.parse(request.body);
      const row = database.prepare(`${bookSelect} WHERE books.id = ? AND books.is_new_arrival = 1`).get(request.params.bookId);
      if (!row) throw new HttpError(404, 'NEW_ARRIVAL_NOT_FOUND', 'New arrival not found.');
      const before = serializeBook(row);
      if (input.version !== before.version) throw new HttpError(409, 'VERSION_CONFLICT', 'This new arrival was changed by someone else. Reload before saving.');
      if (input.categoryId && !database.prepare('SELECT 1 FROM categories WHERE id = ?').get(input.categoryId)) throw new HttpError(400, 'CATEGORY_NOT_FOUND', 'Selected category does not exist.');
      const now = new Date().toISOString();
      const updated = database.prepare(`UPDATE books SET title = ?, author = ?, isbn = ?, publisher = ?, publication_year = ?, description = ?, category_id = ?, shelf_location = ?, quantity_total = ?, quantity_available = ?, arrival_date = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ? AND is_new_arrival = 1`)
        .run(input.title, input.author, input.isbn?.trim() || null, input.publisher || null, input.publicationYear ?? null, input.description || null, input.categoryId || null, input.shelfLocation || null, input.quantityTotal, input.quantityAvailable, input.arrivalDate || before.arrivalDate, now, before.id, input.version);
      if (updated.changes !== 1) throw new HttpError(409, 'VERSION_CONFLICT', 'This new arrival was changed by someone else. Reload before saving.');
      const after = serializeBook(database.prepare(`${bookSelect} WHERE books.id = ?`).get(before.id));
      recordAudit(database, { actorUserId: request.auth.id, actorEmail: request.auth.email, action: 'update', module: 'new_arrivals', recordId: before.id, summary: `Updated new arrival '${after.title}'.`, ipAddress: request.ip, before, after });
      return sendSuccess(response, after);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return next(new HttpError(409, 'DUPLICATE_ISBN', 'A book with this ISBN already exists.'));
      return next(error);
    }
  });

  router.delete('/new-arrivals/:bookId', requireBook, ready, middleware.requirePermission('new_arrivals', 'delete'), (request, response) => {
    const row = database.prepare(`${bookSelect} WHERE books.id = ? AND books.is_new_arrival = 1`).get(request.params.bookId);
    if (!row) throw new HttpError(404, 'NEW_ARRIVAL_NOT_FOUND', 'New arrival not found.');
    const before = serializeBook(row);
    const now = new Date().toISOString();
    database.prepare('UPDATE books SET is_new_arrival = 0, arrival_date = NULL, version = version + 1, updated_at = ? WHERE id = ? AND is_new_arrival = 1').run(now, before.id);
    recordAudit(database, { actorUserId: request.auth.id, actorEmail: request.auth.email, action: 'delete', module: 'new_arrivals', recordId: before.id, summary: `Removed '${before.title}' from new arrivals.`, ipAddress: request.ip, before, after: { ...before, isNewArrival: false, arrivalDate: null, version: before.version + 1, updatedAt: now } });
    return sendSuccess(response, { removed: true });
  });

  router.get('/categories', (_request, response) => {
    const categories = database.prepare('SELECT id, name, created_at AS createdAt, updated_at AS updatedAt FROM categories ORDER BY name COLLATE NOCASE').all();
    return sendSuccess(response, { items: categories, pagination: { page: 1, pageSize: categories.length || 1, total: categories.length, pageCount: categories.length ? 1 : 0 } });
  });

  router.post('/categories', requireBook, ready, middleware.requirePermission('books', 'write'), (request, response, next) => {
    try {
      const { name } = categorySchema.parse(request.body);
      const now = new Date().toISOString();
      const id = `cat_${randomUUID()}`;
      database.prepare('INSERT INTO categories (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)').run(id, name, now, now);
      recordAudit(database, { actorUserId: request.auth.id, actorEmail: request.auth.email, action: 'create', module: 'books', recordId: id, summary: `Created book category '${name}'.`, ipAddress: request.ip, after: { id, name } });
      return sendSuccess(response, { id, name, createdAt: now, updatedAt: now }, 201);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return next(new HttpError(409, 'CATEGORY_EXISTS', 'That category already exists.'));
      return next(error);
    }
  });

  router.put('/categories/:categoryId', requireBook, ready, middleware.requirePermission('books', 'update'), (request, response, next) => {
    try {
      const { name } = categorySchema.parse(request.body);
      const before = database.prepare('SELECT id, name FROM categories WHERE id = ?').get(request.params.categoryId);
      if (!before) throw new HttpError(404, 'CATEGORY_NOT_FOUND', 'Category not found.');
      const now = new Date().toISOString();
      database.prepare('UPDATE categories SET name = ?, updated_at = ? WHERE id = ?').run(name, now, before.id);
      recordAudit(database, { actorUserId: request.auth.id, actorEmail: request.auth.email, action: 'update', module: 'books', recordId: before.id, summary: `Renamed category '${before.name}' to '${name}'.`, ipAddress: request.ip, before, after: { id: before.id, name } });
      return sendSuccess(response, { id: before.id, name, updatedAt: now });
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return next(new HttpError(409, 'CATEGORY_EXISTS', 'That category already exists.'));
      return next(error);
    }
  });

  router.delete('/categories/:categoryId', requireBook, ready, middleware.requirePermission('books', 'delete'), (request, response, next) => {
    try {
      const before = database.prepare('SELECT id, name FROM categories WHERE id = ?').get(request.params.categoryId);
      if (!before) throw new HttpError(404, 'CATEGORY_NOT_FOUND', 'Category not found.');
      database.transaction(() => {
        database.prepare('DELETE FROM categories WHERE id = ?').run(before.id);
        recordAudit(database, { actorUserId: request.auth.id, actorEmail: request.auth.email, action: 'delete', module: 'books', recordId: before.id, summary: `Deleted book category '${before.name}'.`, ipAddress: request.ip, before });
      })();
      return sendSuccess(response, { deleted: true });
    } catch (error) { return next(error); }
  });

  router.get('/', (request, response, next) => {
    try {
      const query = querySchema.parse(request.query);
      const clauses = [];
      const values = [];
      if (query.query) {
        clauses.push(`(books.title LIKE ? COLLATE NOCASE OR books.author LIKE ? COLLATE NOCASE
          OR books.isbn LIKE ? OR categories.name LIKE ? COLLATE NOCASE)`);
        const term = `%${query.query}%`;
        values.push(term, term, term, term);
      }
      if (query.category) { clauses.push('(categories.id = ? OR categories.name = ? COLLATE NOCASE)'); values.push(query.category, query.category); }
      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
      const total = database.prepare(`SELECT COUNT(*) AS count FROM books LEFT JOIN categories ON categories.id = books.category_id ${where}`).get(...values).count;
      const ranking = query.query ? `CASE WHEN books.title = ? COLLATE NOCASE THEN 0 WHEN books.title LIKE ? COLLATE NOCASE THEN 1 WHEN books.author LIKE ? COLLATE NOCASE THEN 2 ELSE 3 END,` : '';
      const rankingValues = query.query ? [query.query, `${query.query}%`, `${query.query}%`] : [];
      const rows = database.prepare(`${bookSelect} ${where} ORDER BY ${ranking} books.title COLLATE NOCASE LIMIT ? OFFSET ?`)
        .all(...values, ...rankingValues, query.pageSize, (query.page - 1) * query.pageSize).map(serializeBook);
      return sendSuccess(response, { items: rows, pagination: { page: query.page, pageSize: query.pageSize, total, pageCount: Math.ceil(total / query.pageSize) } });
    } catch (error) { return next(error); }
  });

  router.get('/export.csv', (_request, response) => {
    const rows = database.prepare(`${bookSelect} ORDER BY books.title COLLATE NOCASE`).all();
    const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
    const lines = ['title,author,isbn,publisher,publicationYear,category,shelfLocation,quantityTotal,quantityAvailable,description'];
    for (const row of rows) {
      const book = serializeBook(row);
      lines.push([book.title, book.author, book.isbn, book.publisher, book.publicationYear, book.category, book.shelfLocation, book.quantityTotal, book.quantityAvailable, book.description].map(quote).join(','));
    }
    response.type('text/csv').attachment('nu-lirc-books.csv').send(lines.join('\r\n'));
  });

  router.get('/:bookId', (request, response) => {
    const book = database.prepare(`${bookSelect} WHERE books.id = ?`).get(request.params.bookId);
    if (!book) throw new HttpError(404, 'BOOK_NOT_FOUND', 'Book not found.');
    return sendSuccess(response, serializeBook(book));
  });

  router.post('/', requireBook, ready, requireWrite, (request, response, next) => {
    try {
      const input = bookCreateSchema.parse(request.body);
      return sendSuccess(response, insertBook(database, input, request.auth, request.ip), 201);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return next(new HttpError(409, 'DUPLICATE_ISBN', 'A book with this ISBN already exists.'));
      return next(error);
    }
  });

  router.put('/:bookId', requireBook, ready, requireUpdate, (request, response, next) => {
    try {
      const input = bookUpdateSchema.parse(request.body);
      const beforeRow = database.prepare(`${bookSelect} WHERE books.id = ?`).get(request.params.bookId);
      if (!beforeRow) throw new HttpError(404, 'BOOK_NOT_FOUND', 'Book not found.');
      const before = serializeBook(beforeRow);
      if (input.version !== before.version) throw new HttpError(409, 'VERSION_CONFLICT', 'This book was changed by someone else. Reload before saving.');
      if (input.categoryId && !database.prepare('SELECT 1 FROM categories WHERE id = ?').get(input.categoryId)) {
        throw new HttpError(400, 'CATEGORY_NOT_FOUND', 'Selected category does not exist.');
      }
      const now = new Date().toISOString();
      const updated = database.prepare(`
        UPDATE books SET title = ?, author = ?, isbn = ?, publisher = ?, publication_year = ?,
          description = ?, category_id = ?, shelf_location = ?, quantity_total = ?,
          quantity_available = ?, version = version + 1, updated_at = ?
        WHERE id = ? AND version = ?
      `).run(input.title, input.author, input.isbn?.trim() || null, input.publisher || null,
        input.publicationYear ?? null, input.description || null, input.categoryId || null,
        input.shelfLocation || null, input.quantityTotal, input.quantityAvailable, now,
        before.id, input.version);
      if (updated.changes !== 1) throw new HttpError(409, 'VERSION_CONFLICT', 'This book was changed by someone else. Reload before saving.');
      const after = serializeBook(database.prepare(`${bookSelect} WHERE books.id = ?`).get(before.id));
      recordAudit(database, { actorUserId: request.auth.id, actorEmail: request.auth.email, action: 'update', module: 'books', recordId: before.id, summary: `Updated book '${after.title}'.`, ipAddress: request.ip, before, after });
      return sendSuccess(response, after);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return next(new HttpError(409, 'DUPLICATE_ISBN', 'A book with this ISBN already exists.'));
      return next(error);
    }
  });

  router.delete('/:bookId', requireBook, ready, requireDelete, (request, response) => {
    const row = database.prepare(`${bookSelect} WHERE books.id = ?`).get(request.params.bookId);
    if (!row) throw new HttpError(404, 'BOOK_NOT_FOUND', 'Book not found.');
    const before = serializeBook(row);
    database.transaction(() => {
      database.prepare('DELETE FROM books WHERE id = ?').run(before.id);
      recordAudit(database, { actorUserId: request.auth.id, actorEmail: request.auth.email, action: 'delete', module: 'books', recordId: before.id, summary: `Deleted book '${before.title}'.`, ipAddress: request.ip, before });
    })();
    if (row.coverPath) removeUploadedFile(row.coverPath);
    return sendSuccess(response, { deleted: true });
  });

  router.post('/:bookId/cover', requireBook, ready, requireBookCover, parseCoverUpload, (request, response, next) => {
    try { return sendSuccess(response, updateBookCover(database, request, request.params.bookId)); }
    catch (error) { return next(error); }
  });

  router.post('/import.csv', requireBook, ready, requireWrite, express.text({ type: ['text/csv', 'text/plain'], limit: '2mb' }), (request, response, next) => {
    try {
      if (typeof request.body !== 'string' || request.body.length === 0) throw new HttpError(400, 'CSV_REQUIRED', 'Provide a non-empty CSV body.');
      const records = parseCsv(request.body, { columns: true, skip_empty_lines: true, trim: true, bom: true });
      if (records.length > 5000) throw new HttpError(413, 'CSV_TOO_LARGE', 'Import up to 5,000 rows at a time.');
      const errors = [];
      const added = [];
      const importRows = database.transaction(() => {
        records.forEach((row, index) => {
          try {
            const categoryName = row.category?.trim();
            let categoryId = null;
            if (categoryName) {
              categoryId = database.prepare('SELECT id FROM categories WHERE name = ? COLLATE NOCASE').get(categoryName)?.id || null;
              if (!categoryId) throw new HttpError(400, 'CATEGORY_NOT_FOUND', `Category '${categoryName}' must exist before import.`);
            }
            const input = bookCreateSchema.parse({
              title: row.title,
              author: row.author,
              isbn: row.isbn || null,
              publisher: row.publisher || null,
              publicationYear: row.publicationYear ? Number(row.publicationYear) : null,
              description: row.description || null,
              categoryId,
              shelfLocation: row.shelfLocation || null,
              quantityTotal: Number(row.quantityTotal || 0),
              quantityAvailable: Number(row.quantityAvailable || row.quantityTotal || 0),
            });
            added.push(insertBook(database, input, request.auth, request.ip));
          } catch (error) {
            if (error.code === 'DUPLICATE_BOOK') errors.push({ row: index + 2, message: error.message });
            else errors.push({ row: index + 2, message: error.message || 'Invalid row.' });
          }
        });
      });
      importRows();
      return sendSuccess(response, { imported: added.length, errors });
    } catch (error) { return next(error); }
  });

  return router;
}
