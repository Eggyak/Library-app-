import { randomUUID } from 'node:crypto';
import express from 'express';
import fs from 'node:fs';
import multer from 'multer';
import { z } from 'zod';
import { recordAudit } from '../audit.js';
import { HttpError, sendSuccess } from '../errors.js';
import { removeUploadedFile, saveUploadedFile, validateUploadedFile } from '../uploads.js';

const pageSchema = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(25) }).passthrough();
const isoDate = z.iso.date();
const clippingMetadata = z.object({
  title: z.string().trim().max(240).optional().or(z.literal('')),
  date: isoDate,
  topic: z.string().trim().min(1).max(120),
  newspaperName: z.string().trim().min(1).max(160),
  notes: z.string().max(3000).optional().or(z.literal('')),
  sourceUrl: z.union([z.string().url().max(2000).refine(value => ['http:', 'https:'].includes(new URL(value).protocol), 'Source link must use HTTP or HTTPS.'), z.literal(''), z.null()]).optional(),
}).strict();
const clippingUpdate = clippingMetadata.extend({ version: z.number().int().min(1).optional() }).strict();
const infoSchema = z.object({
  rulesMarkdown: z.string().max(20000),
  timings: z.array(z.object({
    weekday: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
    opening: z.string().max(40),
    closing: z.string().max(40),
    notes: z.string().max(300).optional(),
  }).strict()).max(7),
  contact: z.object({
    email: z.string().max(254).optional(),
    phone: z.string().max(40).optional(),
    address: z.string().max(500).optional(),
  }).strict(),
  version: z.number().int().min(0),
}).strict();
const holidaySchema = z.object({
  date: isoDate,
  name: z.string().trim().min(1).max(160),
  isClosed: z.boolean(),
  specialOpening: z.string().max(40).nullable().optional(),
  specialClosing: z.string().max(40).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
});
const eResourceCategorySchema = z.object({ name: z.string().trim().min(1).max(100) }).strict();
const eResourceSchema = z.object({
  title: z.string().trim().min(1).max(240),
  description: z.string().max(3000).nullable().optional(),
  url: z.string().url().max(2000).refine(value => ['http:', 'https:'].includes(new URL(value).protocol), 'URL must use HTTP or HTTPS.'),
  categoryId: z.string().max(100).nullable().optional(),
  requiresCampusNetwork: z.boolean().default(false),
});
const eResourceUpdateSchema = eResourceSchema.extend({ version: z.number().int().min(1) });
const announcementSchema = z.object({
  title: z.string().trim().min(1).max(240),
  body: z.string().trim().min(1).max(10000),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
  isPublished: z.boolean().default(false),
});
const announcementUpdateSchema = announcementSchema.extend({ version: z.number().int().min(1) });
const clippingUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024, files: 1 } });
const parseClippingUpload = (request, response, next) => clippingUpload.array('files', 1)(request, response, error => {
  if (!error) return next();
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') return next(new HttpError(413, 'CLIPPING_FILE_TOO_LARGE', 'PDF clippings must be 50 MB or smaller.'));
    return next(new HttpError(400, 'CLIPPING_UPLOAD_INVALID', 'Upload one PDF clipping at a time.'));
  }
  return next(error);
});

function addPermissionAudit(database, request, action, recordId, summary, before = null, after = null) {
  recordAudit(database, {
    actorUserId: request.auth.id,
    actorEmail: request.auth.email,
    action,
    module: action.startsWith('clipping') ? 'clippings' : action.startsWith('resource') ? 'e_resources' : 'general_info',
    recordId,
    summary,
    ipAddress: request.ip,
    before,
    after,
  });
}

function createClipRecord(database, request, files) {
  const input = clippingMetadata.parse(request.body);
  if (!files?.length && !input.sourceUrl) throw new HttpError(400, 'CLIPPING_CONTENT_REQUIRED', 'Choose a PDF or provide a source link.');
  for (const file of files) validateUploadedFile(file, ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

  const id = `clip_${randomUUID()}`;
  const now = new Date().toISOString();
  const stored = [];
  try {
    const insert = database.transaction(() => {
      database.prepare(`INSERT INTO clippings (id, title, clipping_date, topic, newspaper_name, notes, source_url, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, input.title || null, input.date, input.topic, input.newspaperName, input.notes || null, input.sourceUrl || null, now, now);
      const insertFile = database.prepare(`INSERT INTO clipping_files
        (id, clipping_id, original_name, stored_name, mime_type, byte_size, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`);
      for (const file of files) {
        const storedName = saveUploadedFile(file);
        stored.push(storedName);
        insertFile.run(`clipfile_${randomUUID()}`, id, file.originalname.slice(0, 255), storedName, file.mimetype, file.size, now);
      }
      addPermissionAudit(database, request, 'clipping_create', id, `Uploaded newspaper clipping '${input.title || input.topic}'.`, null, { ...input, fileCount: files.length });
    });
    insert();
  } catch (error) {
    stored.forEach(removeUploadedFile);
    throw error;
  }
  return getClipping(database, id);
}

function getClipping(database, id) {
  const clipping = database.prepare(`SELECT id, title, clipping_date AS date, topic, newspaper_name AS newspaperName,
    notes, source_url AS sourceUrl, version, created_at AS createdAt, updated_at AS updatedAt FROM clippings WHERE id = ?`).get(id);
  if (!clipping) return null;
  clipping.files = getClippingFiles(database, id);
  return clipping;
}

function getClippingFiles(database, clippingId) {
  return database.prepare(`SELECT id, original_name AS originalName, stored_name AS storedName,
    mime_type AS mimeType, byte_size AS byteSize FROM clipping_files WHERE clipping_id = ? ORDER BY created_at`).all(clippingId)
    .map(file => ({ id: file.id, originalName: file.originalName, mimeType: file.mimeType,
      byteSize: file.byteSize, url: `/files/${encodeURIComponent(file.storedName)}` }));
}

function appendClippingFiles(database, request, clippingId, files) {
  if (!files?.length) throw new HttpError(400, 'CLIPPING_FILE_REQUIRED', 'Choose at least one PDF file to upload.');
  const clipping = database.prepare('SELECT id, title, topic FROM clippings WHERE id = ?').get(clippingId);
  if (!clipping) throw new HttpError(404, 'CLIPPING_NOT_FOUND', 'Clipping not found.');
  for (const file of files) validateUploadedFile(file, ['application/pdf']);
  const stored = [];
  const now = new Date().toISOString();
  try {
    database.transaction(() => {
      const insertFile = database.prepare(`INSERT INTO clipping_files
        (id, clipping_id, original_name, stored_name, mime_type, byte_size, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)`);
      for (const file of files) {
        const storedName = saveUploadedFile(file);
        stored.push(storedName);
        insertFile.run(`clipfile_${randomUUID()}`, clippingId, file.originalname.slice(0, 255), storedName, file.mimetype, file.size, now);
      }
      addPermissionAudit(database, request, 'clipping_files_added', clippingId,
        `Added ${files.length} PDF file${files.length === 1 ? '' : 's'} to newspaper clipping '${clipping.title || clipping.topic}'.`, null,
        { files: files.map(file => file.originalname) });
    })();
  } catch (error) {
    stored.forEach(removeUploadedFile);
    throw error;
  }
  return getClipping(database, clippingId);
}

export function createClippingsRouter(database, middleware) {
  const router = express.Router();
  router.get('/', (request, response, next) => {
    try {
      const query = pageSchema.extend({ date: isoDate.optional(), topic: z.string().max(120).optional(), from: isoDate.optional(), to: isoDate.optional() }).parse(request.query);
      const clauses = [];
      const values = [];
      if (query.date) { clauses.push('clipping_date = ?'); values.push(query.date); }
      if (query.topic) { clauses.push('topic LIKE ? COLLATE NOCASE'); values.push(`%${query.topic}%`); }
      if (query.from) { clauses.push('clipping_date >= ?'); values.push(query.from); }
      if (query.to) { clauses.push('clipping_date <= ?'); values.push(query.to); }
      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
      const total = database.prepare(`SELECT COUNT(*) AS count FROM clippings ${where}`).get(...values).count;
      const items = database.prepare(`SELECT clippings.id, clippings.title, clippings.clipping_date AS date,
        clippings.topic, clippings.newspaper_name AS newspaperName, clippings.notes, clippings.source_url AS sourceUrl, clippings.version,
        clippings.created_at AS createdAt, COUNT(clipping_files.id) AS fileCount
        FROM clippings LEFT JOIN clipping_files ON clipping_files.clipping_id = clippings.id ${where}
        GROUP BY clippings.id ORDER BY clippings.clipping_date DESC, clippings.created_at DESC LIMIT ? OFFSET ?`)
        .all(...values, query.pageSize, (query.page - 1) * query.pageSize)
        .map(item => ({ ...item, files: getClippingFiles(database, item.id) }));
      return sendSuccess(response, { items, pagination: { page: query.page, pageSize: query.pageSize, total, pageCount: Math.ceil(total / query.pageSize) } });
    } catch (error) { return next(error); }
  });

  router.get('/:clippingId', (request, response) => {
    const clipping = getClipping(database, request.params.clippingId);
    if (!clipping) throw new HttpError(404, 'CLIPPING_NOT_FOUND', 'Clipping not found.');
    return sendSuccess(response, clipping);
  });

  router.post('/:clippingId/files', middleware.requireAuth, middleware.requirePasswordChanged,
    middleware.requirePermission('clippings', 'update'), parseClippingUpload, (request, response, next) => {
      try { return sendSuccess(response, appendClippingFiles(database, request, request.params.clippingId, request.files)); }
      catch (error) { return next(error); }
    });

  router.post('/', middleware.requireAuth, middleware.requirePasswordChanged, middleware.requirePermission('clippings', 'write'), parseClippingUpload, (request, response, next) => {
    try { return sendSuccess(response, createClipRecord(database, request, request.files), 201); }
    catch (error) { return next(error); }
  });

  router.put('/:clippingId', middleware.requireAuth, middleware.requirePasswordChanged, middleware.requirePermission('clippings', 'update'), (request, response, next) => {
    try {
      const input = clippingUpdate.parse(request.body);
      const before = getClipping(database, request.params.clippingId);
      if (!before) throw new HttpError(404, 'CLIPPING_NOT_FOUND', 'Clipping not found.');
      if (input.version !== undefined && input.version !== before.version) throw new HttpError(409, 'VERSION_CONFLICT', 'This clipping changed. Reload before saving.');
      const now = new Date().toISOString();
      const result = database.prepare(`UPDATE clippings SET title = ?, clipping_date = ?, topic = ?, newspaper_name = ?, notes = ?, source_url = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ?`)
        .run(input.title || null, input.date, input.topic, input.newspaperName, input.notes || null, input.sourceUrl || null, now, before.id, before.version);
      if (!result.changes) throw new HttpError(409, 'VERSION_CONFLICT', 'This clipping changed. Reload before saving.');
      const after = getClipping(database, before.id);
      addPermissionAudit(database, request, 'clipping_update', before.id, `Updated newspaper clipping '${input.title || input.topic}'.`, before, after);
      return sendSuccess(response, after);
    } catch (error) { return next(error); }
  });

  router.delete('/:clippingId', middleware.requireAuth, middleware.requirePasswordChanged, middleware.requirePermission('clippings', 'delete'), (request, response) => {
    const before = getClipping(database, request.params.clippingId);
    if (!before) throw new HttpError(404, 'CLIPPING_NOT_FOUND', 'Clipping not found.');
    const storedNames = database.prepare('SELECT stored_name FROM clipping_files WHERE clipping_id = ?').all(before.id).map(row => row.stored_name);
    database.transaction(() => {
      database.prepare('DELETE FROM clippings WHERE id = ?').run(before.id);
      addPermissionAudit(database, request, 'clipping_delete', before.id, `Deleted newspaper clipping '${before.title || before.topic}'.`, before);
    })();
    storedNames.forEach(removeUploadedFile);
    return sendSuccess(response, { deleted: true });
  });
  return router;
}

export function createGeneralInfoRouter(database, middleware) {
  const router = express.Router();
  router.get('/', (_request, response) => {
    const row = database.prepare('SELECT rules_markdown AS rulesMarkdown, timings_json AS timingsJson, contact_json AS contactJson, version, updated_at AS updatedAt FROM library_info WHERE id = 1').get();
    return sendSuccess(response, row ? {
      rulesMarkdown: row.rulesMarkdown,
      timings: JSON.parse(row.timingsJson),
      contact: JSON.parse(row.contactJson),
      version: row.version,
      updatedAt: row.updatedAt,
    } : { rulesMarkdown: '', timings: [], contact: {}, version: 0, updatedAt: null });
  });

  router.put('/', middleware.requireAuth, middleware.requirePasswordChanged, middleware.requirePermission('general_info', 'update'), (request, response, next) => {
    try {
      const input = infoSchema.parse(request.body);
      const beforeRow = database.prepare('SELECT rules_markdown AS rulesMarkdown, timings_json AS timingsJson, contact_json AS contactJson, version FROM library_info WHERE id = 1').get();
      if ((beforeRow?.version || 0) !== input.version) throw new HttpError(409, 'VERSION_CONFLICT', 'General information changed. Reload before saving.');
      const nextVersion = input.version + 1;
      const now = new Date().toISOString();
      database.transaction(() => {
        database.prepare(`INSERT INTO library_info (id, rules_markdown, timings_json, contact_json, version, updated_at)
          VALUES (1, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET rules_markdown = excluded.rules_markdown,
          timings_json = excluded.timings_json, contact_json = excluded.contact_json, version = excluded.version, updated_at = excluded.updated_at`)
          .run(input.rulesMarkdown, JSON.stringify(input.timings), JSON.stringify(input.contact), nextVersion, now);
        addPermissionAudit(database, request, 'update', 'library-info', 'Updated library rules, timings, and contact information.',
          beforeRow ? { rulesMarkdown: beforeRow.rulesMarkdown, timings: JSON.parse(beforeRow.timingsJson), contact: JSON.parse(beforeRow.contactJson), version: beforeRow.version } : null,
          { ...input, version: nextVersion });
      })();
      return sendSuccess(response, { ...input, version: nextVersion, updatedAt: now });
    } catch (error) { return next(error); }
  });
  return router;
}

export function createHolidaysRouter(database, middleware) {
  const router = express.Router();
  router.get('/', (request, response, next) => {
    try {
      const query = pageSchema.extend({ from: isoDate.optional(), to: isoDate.optional() }).parse(request.query);
      const clauses = [];
      const values = [];
      if (query.from) { clauses.push('holiday_date >= ?'); values.push(query.from); }
      if (query.to) { clauses.push('holiday_date <= ?'); values.push(query.to); }
      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
      const total = database.prepare(`SELECT COUNT(*) AS count FROM holidays ${where}`).get(...values).count;
      const items = database.prepare(`SELECT id, holiday_date AS date, name, is_closed AS isClosed, special_opening AS specialOpening,
        special_closing AS specialClosing, notes, version FROM holidays ${where} ORDER BY holiday_date LIMIT ? OFFSET ?`)
        .all(...values, query.pageSize, (query.page - 1) * query.pageSize).map(item => ({ ...item, isClosed: Boolean(item.isClosed) }));
      return sendSuccess(response, { items, pagination: { page: query.page, pageSize: query.pageSize, total, pageCount: Math.ceil(total / query.pageSize) } });
    } catch (error) { return next(error); }
  });
  router.post('/', middleware.requireAuth, middleware.requirePasswordChanged, middleware.requirePermission('general_info', 'write'), (request, response, next) => {
    try {
      const input = holidaySchema.parse(request.body);
      const id = `holiday_${randomUUID()}`;
      const now = new Date().toISOString();
      database.prepare(`INSERT INTO holidays (id, holiday_date, name, is_closed, special_opening, special_closing, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, input.date, input.name, Number(input.isClosed), input.specialOpening || null, input.specialClosing || null, input.notes || null, now, now);
      const after = { id, ...input, version: 1 };
      addPermissionAudit(database, request, 'create', id, `Added holiday '${input.name}'.`, null, after);
      return sendSuccess(response, after, 201);
    } catch (error) { return next(error); }
  });
  router.put('/:holidayId', middleware.requireAuth, middleware.requirePasswordChanged, middleware.requirePermission('general_info', 'update'), (request, response, next) => {
    try {
      const input = holidaySchema.extend({ version: z.number().int().min(1) }).strict().parse(request.body);
      const before = database.prepare('SELECT id, version FROM holidays WHERE id = ?').get(request.params.holidayId);
      if (!before) throw new HttpError(404, 'HOLIDAY_NOT_FOUND', 'Holiday not found.');
      if (input.version !== before.version) throw new HttpError(409, 'VERSION_CONFLICT', 'Holiday changed. Reload before saving.');
      const now = new Date().toISOString();
      const result = database.prepare(`UPDATE holidays SET holiday_date = ?, name = ?, is_closed = ?, special_opening = ?, special_closing = ?, notes = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ?`)
        .run(input.date, input.name, Number(input.isClosed), input.specialOpening || null, input.specialClosing || null, input.notes || null, now, before.id, input.version);
      if (!result.changes) throw new HttpError(409, 'VERSION_CONFLICT', 'Holiday changed. Reload before saving.');
      const after = { id: before.id, ...input, version: input.version + 1 };
      addPermissionAudit(database, request, 'update', before.id, `Updated holiday '${input.name}'.`, before, after);
      return sendSuccess(response, after);
    } catch (error) { return next(error); }
  });
  router.delete('/:holidayId', middleware.requireAuth, middleware.requirePasswordChanged, middleware.requirePermission('general_info', 'delete'), (request, response) => {
    const before = database.prepare('SELECT id, holiday_date AS date, name FROM holidays WHERE id = ?').get(request.params.holidayId);
    if (!before) throw new HttpError(404, 'HOLIDAY_NOT_FOUND', 'Holiday not found.');
    database.transaction(() => {
      database.prepare('DELETE FROM holidays WHERE id = ?').run(before.id);
      addPermissionAudit(database, request, 'delete', before.id, `Deleted holiday '${before.name}'.`, before);
    })();
    return sendSuccess(response, { deleted: true });
  });
  return router;
}

export function createEResourcesRouter(database, middleware) {
  const router = express.Router();
  const auth = middleware.requireAuth;
  const passwordChanged = middleware.requirePasswordChanged;

  router.get('/categories', (_request, response) => {
    const items = database.prepare('SELECT id, name FROM e_resource_categories ORDER BY name COLLATE NOCASE').all();
    return sendSuccess(response, { items, pagination: { page: 1, pageSize: items.length || 1, total: items.length, pageCount: items.length ? 1 : 0 } });
  });
  router.post('/categories', auth, passwordChanged, middleware.requirePermission('e_resources', 'write'), (request, response, next) => {
    try {
      const { name } = eResourceCategorySchema.parse(request.body);
      const id = `ercat_${randomUUID()}`;
      const now = new Date().toISOString();
      database.prepare('INSERT INTO e_resource_categories (id, name, created_at, updated_at) VALUES (?, ?, ?, ?)').run(id, name, now, now);
      recordAudit(database, { actorUserId: request.auth.id, actorEmail: request.auth.email, action: 'create', module: 'e_resources', recordId: id, summary: `Created e-resource category '${name}'.`, ipAddress: request.ip, after: { id, name } });
      return sendSuccess(response, { id, name }, 201);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return next(new HttpError(409, 'CATEGORY_EXISTS', 'That category already exists.'));
      return next(error);
    }
  });
  router.put('/categories/:categoryId', auth, passwordChanged, middleware.requirePermission('e_resources', 'update'), (request, response, next) => {
    try {
      const { name } = eResourceCategorySchema.parse(request.body);
      const before = database.prepare('SELECT id, name FROM e_resource_categories WHERE id = ?').get(request.params.categoryId);
      if (!before) throw new HttpError(404, 'CATEGORY_NOT_FOUND', 'Category not found.');
      database.prepare('UPDATE e_resource_categories SET name = ?, updated_at = ? WHERE id = ?').run(name, new Date().toISOString(), before.id);
      recordAudit(database, { actorUserId: request.auth.id, actorEmail: request.auth.email, action: 'update', module: 'e_resources', recordId: before.id, summary: `Renamed e-resource category '${before.name}' to '${name}'.`, ipAddress: request.ip, before, after: { id: before.id, name } });
      return sendSuccess(response, { id: before.id, name });
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return next(new HttpError(409, 'CATEGORY_EXISTS', 'That category already exists.'));
      return next(error);
    }
  });
  router.delete('/categories/:categoryId', auth, passwordChanged, middleware.requirePermission('e_resources', 'delete'), (request, response) => {
    const before = database.prepare('SELECT id, name FROM e_resource_categories WHERE id = ?').get(request.params.categoryId);
    if (!before) throw new HttpError(404, 'CATEGORY_NOT_FOUND', 'Category not found.');
    database.transaction(() => {
      database.prepare('DELETE FROM e_resource_categories WHERE id = ?').run(before.id);
      recordAudit(database, { actorUserId: request.auth.id, actorEmail: request.auth.email, action: 'delete', module: 'e_resources', recordId: before.id, summary: `Deleted e-resource category '${before.name}'.`, ipAddress: request.ip, before });
    })();
    return sendSuccess(response, { deleted: true });
  });

  router.get('/', (request, response, next) => {
    try {
      const query = pageSchema.extend({ category: z.string().max(100).optional() }).parse(request.query);
      const where = query.category ? 'WHERE e_resource_categories.id = ? OR e_resource_categories.name = ? COLLATE NOCASE' : '';
      const values = query.category ? [query.category, query.category] : [];
      const total = database.prepare(`SELECT COUNT(*) AS count FROM e_resources LEFT JOIN e_resource_categories ON e_resource_categories.id = e_resources.category_id ${where}`).get(...values).count;
      const items = database.prepare(`SELECT e_resources.id, title, description, url, category_id AS categoryId,
        e_resource_categories.name AS category, e_resources.requires_campus_network AS requiresCampusNetwork, e_resources.version,
        e_resources.created_at AS createdAt, e_resources.updated_at AS updatedAt FROM e_resources
        LEFT JOIN e_resource_categories ON e_resource_categories.id = e_resources.category_id ${where}
        ORDER BY title COLLATE NOCASE LIMIT ? OFFSET ?`).all(...values, query.pageSize, (query.page - 1) * query.pageSize)
        .map(item => ({ ...item, requiresCampusNetwork: Boolean(item.requiresCampusNetwork) }));
      return sendSuccess(response, { items, pagination: { page: query.page, pageSize: query.pageSize, total, pageCount: Math.ceil(total / query.pageSize) } });
    } catch (error) { return next(error); }
  });
  router.post('/', auth, passwordChanged, middleware.requirePermission('e_resources', 'write'), (request, response, next) => {
    try {
      const input = eResourceSchema.parse(request.body);
      if (input.categoryId && !database.prepare('SELECT 1 FROM e_resource_categories WHERE id = ?').get(input.categoryId)) throw new HttpError(400, 'CATEGORY_NOT_FOUND', 'Selected category does not exist.');
      const id = `resource_${randomUUID()}`;
      const now = new Date().toISOString();
      database.prepare(`INSERT INTO e_resources (id, title, description, url, category_id, requires_campus_network, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, input.title, input.description || null, input.url, input.categoryId || null, Number(input.requiresCampusNetwork), now, now);
      recordAudit(database, { actorUserId: request.auth.id, actorEmail: request.auth.email, action: 'create', module: 'e_resources', recordId: id, summary: `Added e-resource '${input.title}'.`, ipAddress: request.ip, after: { ...input, id } });
      return sendSuccess(response, { ...input, id, version: 1, createdAt: now, updatedAt: now }, 201);
    } catch (error) { return next(error); }
  });
  router.put('/:resourceId', auth, passwordChanged, middleware.requirePermission('e_resources', 'update'), (request, response, next) => {
    try {
      const input = eResourceUpdateSchema.parse(request.body);
      const before = database.prepare('SELECT id, title, description, url, category_id AS categoryId, requires_campus_network AS requiresCampusNetwork, version FROM e_resources WHERE id = ?').get(request.params.resourceId);
      if (!before) throw new HttpError(404, 'RESOURCE_NOT_FOUND', 'e-Resource not found.');
      if (input.version !== before.version) throw new HttpError(409, 'VERSION_CONFLICT', 'e-Resource changed. Reload before saving.');
      if (input.categoryId && !database.prepare('SELECT 1 FROM e_resource_categories WHERE id = ?').get(input.categoryId)) throw new HttpError(400, 'CATEGORY_NOT_FOUND', 'Selected category does not exist.');
      const now = new Date().toISOString();
      const result = database.prepare(`UPDATE e_resources SET title = ?, description = ?, url = ?, category_id = ?, requires_campus_network = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ?`)
        .run(input.title, input.description || null, input.url, input.categoryId || null, Number(input.requiresCampusNetwork), now, before.id, input.version);
      if (!result.changes) throw new HttpError(409, 'VERSION_CONFLICT', 'e-Resource changed. Reload before saving.');
      const after = { ...input, version: input.version + 1, updatedAt: now };
      recordAudit(database, { actorUserId: request.auth.id, actorEmail: request.auth.email, action: 'update', module: 'e_resources', recordId: before.id, summary: `Updated e-resource '${input.title}'.`, ipAddress: request.ip, before, after });
      return sendSuccess(response, after);
    } catch (error) { return next(error); }
  });
  router.delete('/:resourceId', auth, passwordChanged, middleware.requirePermission('e_resources', 'delete'), (request, response) => {
    const before = database.prepare('SELECT id, title FROM e_resources WHERE id = ?').get(request.params.resourceId);
    if (!before) throw new HttpError(404, 'RESOURCE_NOT_FOUND', 'e-Resource not found.');
    database.transaction(() => {
      database.prepare('DELETE FROM e_resources WHERE id = ?').run(before.id);
      recordAudit(database, { actorUserId: request.auth.id, actorEmail: request.auth.email, action: 'delete', module: 'e_resources', recordId: before.id, summary: `Deleted e-resource '${before.title}'.`, ipAddress: request.ip, before });
    })();
    return sendSuccess(response, { deleted: true });
  });
  return router;
}

export function createAnnouncementsRouter(database, middleware) {
  const router = express.Router();
  const auth = middleware.requireAuth;
  const changed = middleware.requirePasswordChanged;
  router.get('/', (request, response, next) => {
    try {
      const query = pageSchema.parse(request.query);
      const now = new Date().toISOString();
      const where = 'WHERE is_published = 1 AND (starts_at IS NULL OR starts_at <= ?) AND (ends_at IS NULL OR ends_at > ?)';
      const values = [now, now];
      const total = database.prepare(`SELECT COUNT(*) AS count FROM announcements ${where}`).get(...values).count;
      const items = database.prepare(`SELECT id, title, body, starts_at AS startsAt, ends_at AS endsAt,
        is_published AS isPublished, version, created_at AS createdAt, updated_at AS updatedAt
        FROM announcements ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
        .all(...values, query.pageSize, (query.page - 1) * query.pageSize).map(item => ({ ...item, isPublished: Boolean(item.isPublished) }));
      return sendSuccess(response, { items, pagination: { page: query.page, pageSize: query.pageSize, total, pageCount: Math.ceil(total / query.pageSize) } });
    } catch (error) { return next(error); }
  });
  router.post('/', auth, changed, middleware.requirePermission('general_info', 'write'), (request, response, next) => {
    try {
      const input = announcementSchema.parse(request.body);
      if (input.startsAt && input.endsAt && Date.parse(input.endsAt) <= Date.parse(input.startsAt)) throw new HttpError(400, 'INVALID_ANNOUNCEMENT_WINDOW', 'End time must be after start time.');
      const id = `announcement_${randomUUID()}`;
      const now = new Date().toISOString();
      database.prepare(`INSERT INTO announcements (id, title, body, starts_at, ends_at, is_published, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(id, input.title, input.body, input.startsAt || null, input.endsAt || null, Number(input.isPublished), now, now);
      recordAudit(database, { actorUserId: request.auth.id, actorEmail: request.auth.email, action: 'create', module: 'general_info', recordId: id, summary: `Created announcement '${input.title}'.`, ipAddress: request.ip, after: input });
      return sendSuccess(response, { ...input, id, version: 1, createdAt: now, updatedAt: now }, 201);
    } catch (error) { return next(error); }
  });
  router.put('/:announcementId', auth, changed, middleware.requirePermission('general_info', 'update'), (request, response, next) => {
    try {
      const input = announcementUpdateSchema.parse(request.body);
      const before = database.prepare('SELECT id, title, version FROM announcements WHERE id = ?').get(request.params.announcementId);
      if (!before) throw new HttpError(404, 'ANNOUNCEMENT_NOT_FOUND', 'Announcement not found.');
      if (input.version !== before.version) throw new HttpError(409, 'VERSION_CONFLICT', 'Announcement changed. Reload before saving.');
      if (input.startsAt && input.endsAt && Date.parse(input.endsAt) <= Date.parse(input.startsAt)) throw new HttpError(400, 'INVALID_ANNOUNCEMENT_WINDOW', 'End time must be after start time.');
      const now = new Date().toISOString();
      database.prepare(`UPDATE announcements SET title = ?, body = ?, starts_at = ?, ends_at = ?, is_published = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ?`)
        .run(input.title, input.body, input.startsAt || null, input.endsAt || null, Number(input.isPublished), now, before.id, input.version);
      recordAudit(database, { actorUserId: request.auth.id, actorEmail: request.auth.email, action: 'update', module: 'general_info', recordId: before.id, summary: `Updated announcement '${input.title}'.`, ipAddress: request.ip, before, after: input });
      return sendSuccess(response, { ...input, version: input.version + 1, updatedAt: now });
    } catch (error) { return next(error); }
  });
  router.delete('/:announcementId', auth, changed, middleware.requirePermission('general_info', 'delete'), (request, response) => {
    const before = database.prepare('SELECT id, title FROM announcements WHERE id = ?').get(request.params.announcementId);
    if (!before) throw new HttpError(404, 'ANNOUNCEMENT_NOT_FOUND', 'Announcement not found.');
    database.transaction(() => {
      database.prepare('DELETE FROM announcements WHERE id = ?').run(before.id);
      recordAudit(database, { actorUserId: request.auth.id, actorEmail: request.auth.email, action: 'delete', module: 'general_info', recordId: before.id, summary: `Deleted announcement '${before.title}'.`, ipAddress: request.ip, before });
    })();
    return sendSuccess(response, { deleted: true });
  });
  return router;
}
