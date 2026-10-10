import { randomUUID } from 'node:crypto';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { recordAudit } from '../audit.js';
import { HttpError, sendSuccess } from '../errors.js';

const dateSchema = z.iso.date();
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use 24-hour HH:MM time.');
const roomSchema = z.object({ name: z.string().trim().min(1).max(120), capacity: z.number().int().min(1).max(1000), isActive: z.boolean().default(true) }).strict();
const roomRequestSchema = z.object({
  roomId: z.string().min(1).max(100),
  date: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  purpose: z.string().trim().min(1).max(1000),
  groupSize: z.number().int().min(1).max(1000),
  studentName: z.string().trim().min(1).max(120),
  studentEmail: z.string().trim().email().max(254),
  enrollmentNo: z.string().trim().min(1).max(60),
  studentPhone: z.string().trim().regex(/^\+?[0-9() .-]{7,24}$/),
}).strict().refine(item => item.startTime < item.endTime, { path: ['endTime'], message: 'End time must be after start time.' });
const requestListSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  status: z.string().max(20).optional(),
  roomId: z.string().max(100).optional(),
  date: dateSchema.optional(),
  query: z.string().trim().max(160).optional(),
}).strict();
const decisionSchema = z.object({
  status: z.enum(['approved', 'denied']),
  remarks: z.string().max(2000).optional().default(''),
  overrideReason: z.string().trim().max(1000).optional(),
  version: z.number().int().min(1),
}).strict();
const bookRequestSchema = z.object({
  title: z.string().trim().min(1).max(300),
  author: z.string().trim().max(240).optional(),
  publisher: z.string().trim().max(200).optional(),
  edition: z.string().trim().max(100).optional(),
  isbn: z.string().trim().max(32).optional(),
  reason: z.string().trim().min(1).max(2000),
  catalogBookId: z.string().max(100).optional(),
  studentName: z.string().trim().min(1).max(120),
  studentEmail: z.string().trim().email().max(254),
  enrollmentNo: z.string().trim().min(1).max(60),
  studentPhone: z.string().trim().regex(/^\+?[0-9() .-]{7,24}$/),
}).strict();
const bookDecisionSchema = z.object({
  status: z.enum(['done', 'rejected']),
  remarks: z.string().max(2000).optional().default(''),
  version: z.number().int().min(1),
}).strict();

const publicSubmissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, data: null, error: { code: 'SUBMISSION_RATE_LIMITED', message: 'Submission limit reached. Try again in an hour.' } },
});

function actorIdentity(request, input) {
  const deviceId = request.get('x-device-id') || '';
  if (!/^[A-Za-z0-9_-]{16,100}$/.test(deviceId)) throw new HttpError(400, 'DEVICE_ID_REQUIRED', 'A valid app device ID is required.');
  return {
    studentId: null,
    studentName: input.studentName,
    studentEmail: input.studentEmail.toLowerCase(),
    enrollmentNo: input.enrollmentNo,
    studentPhone: input.studentPhone,
    deviceId,
  };
}

function enforceDeviceSubmissionLimit(database, identity) {
  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const roomCount = database.prepare('SELECT COUNT(*) AS count FROM room_requests WHERE device_id = ? AND created_at >= ?').get(identity.deviceId, cutoff).count;
  const bookCount = database.prepare('SELECT COUNT(*) AS count FROM book_requests WHERE device_id = ? AND created_at >= ?').get(identity.deviceId, cutoff).count;
  if (roomCount + bookCount >= 5) throw new HttpError(429, 'DEVICE_SUBMISSION_RATE_LIMITED', 'This device has reached the five-submission hourly limit.');
}

function paginated(database, baseQuery, clauses, values, page, pageSize, orderBy = 'created_at DESC') {
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const total = database.prepare(`SELECT COUNT(*) AS count FROM (${baseQuery}) AS records ${where}`).get(...values).count;
  const items = database.prepare(`SELECT * FROM (${baseQuery}) AS records ${where} ORDER BY ${orderBy} LIMIT ? OFFSET ?`)
    .all(...values, pageSize, (page - 1) * pageSize);
  return { items, pagination: { page, pageSize, total, pageCount: Math.ceil(total / pageSize) } };
}

export function createRoomsRouter(database, middleware) {
  const router = express.Router();
  const auth = middleware.requireAuth;
  const ready = middleware.requirePasswordChanged;

  router.get('/', (request, response, next) => {
    try {
      const includeInactive = Boolean(request.get('authorization')) && request.query.includeInactive === 'true';
      const rows = database.prepare(`SELECT id, name, capacity, is_active AS isActive, version FROM rooms ${includeInactive ? '' : 'WHERE is_active = 1'} ORDER BY name COLLATE NOCASE`)
        .all().map(room => ({ ...room, isActive: Boolean(room.isActive) }));
      return sendSuccess(response, { items: rows, pagination: { page: 1, pageSize: rows.length || 1, total: rows.length, pageCount: rows.length ? 1 : 0 } });
    } catch (error) { return next(error); }
  });

  router.post('/', auth, ready, middleware.requirePermission('discussion_rooms', 'write'), (request, response, next) => {
    try {
      const input = roomSchema.parse(request.body);
      const id = `room_${randomUUID()}`;
      const now = new Date().toISOString();
      database.prepare('INSERT INTO rooms (id, name, capacity, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id, input.name, input.capacity, Number(input.isActive), now, now);
      const room = { id, ...input, version: 1, createdAt: now, updatedAt: now };
      recordAudit(database, { actorUserId: request.auth.id, actorEmail: request.auth.email, action: 'create', module: 'discussion_rooms', recordId: id, summary: `Created discussion room '${input.name}'.`, ipAddress: request.ip, after: room });
      return sendSuccess(response, room, 201);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return next(new HttpError(409, 'ROOM_NAME_EXISTS', 'A room with this name already exists.'));
      return next(error);
    }
  });

  router.get('/availability', (request, response, next) => {
    try {
      const query = z.object({ roomId: z.string().min(1), date: dateSchema }).strict().parse(request.query);
      const room = database.prepare('SELECT id, name, capacity FROM rooms WHERE id = ? AND is_active = 1').get(query.roomId);
      if (!room) throw new HttpError(404, 'ROOM_NOT_FOUND', 'Active room not found.');
      const bookings = database.prepare(`SELECT id, start_time AS startTime, end_time AS endTime, status FROM room_requests
        WHERE room_id = ? AND request_date = ? AND status = 'approved' ORDER BY start_time`)
        .all(room.id, query.date);
      return sendSuccess(response, { room, date: query.date, bookings });
    } catch (error) { return next(error); }
  });

  router.put('/:roomId', auth, ready, middleware.requirePermission('discussion_rooms', 'update'), (request, response, next) => {
    try {
      const input = roomSchema.extend({ version: z.number().int().min(1) }).strict().parse(request.body);
      const before = database.prepare('SELECT id, name, capacity, is_active AS isActive, version FROM rooms WHERE id = ?').get(request.params.roomId);
      if (!before) throw new HttpError(404, 'ROOM_NOT_FOUND', 'Room not found.');
      if (before.version !== input.version) throw new HttpError(409, 'VERSION_CONFLICT', 'Room changed. Reload before saving.');
      const now = new Date().toISOString();
      const result = database.prepare('UPDATE rooms SET name = ?, capacity = ?, is_active = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ?')
        .run(input.name, input.capacity, Number(input.isActive), now, before.id, input.version);
      if (!result.changes) throw new HttpError(409, 'VERSION_CONFLICT', 'Room changed. Reload before saving.');
      const after = { id: before.id, ...input, version: input.version + 1, updatedAt: now };
      recordAudit(database, { actorUserId: request.auth.id, actorEmail: request.auth.email, action: 'update', module: 'discussion_rooms', recordId: before.id, summary: `Updated discussion room '${input.name}'.`, ipAddress: request.ip, before, after });
      return sendSuccess(response, after);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return next(new HttpError(409, 'ROOM_NAME_EXISTS', 'A room with this name already exists.'));
      return next(error);
    }
  });

  router.delete('/:roomId', auth, ready, middleware.requirePermission('discussion_rooms', 'delete'), (request, response, next) => {
    try {
      const before = database.prepare('SELECT id, name, capacity, is_active AS isActive, version FROM rooms WHERE id = ?').get(request.params.roomId);
      if (!before) throw new HttpError(404, 'ROOM_NOT_FOUND', 'Room not found.');
      const hasRequests = database.prepare('SELECT COUNT(*) AS count FROM room_requests WHERE room_id = ?').get(before.id).count;
      if (hasRequests > 0) {
        throw new HttpError(409, 'ROOM_HAS_BOOKINGS', 'Cannot delete a room with existing requests. Deactivate it instead.');
      }
      database.prepare('DELETE FROM rooms WHERE id = ?').run(before.id);
      recordAudit(database, { actorUserId: request.auth.id, actorEmail: request.auth.email, action: 'delete', module: 'discussion_rooms', recordId: before.id, summary: `Deleted discussion room '${before.name}'.`, ipAddress: request.ip, before });
      return sendSuccess(response, { deleted: true });
    } catch (error) { return next(error); }
  });
  return router;
}

export function createRoomRequestsRouter(database, middleware) {
  const router = express.Router();
  const auth = middleware.requireAuth;
  const ready = middleware.requirePasswordChanged;
  const optionalAuth = (request, response, next) => request.get('authorization') ? auth(request, response, next) : next();

  router.post('/', publicSubmissionLimiter, (request, response, next) => {
    try {
      const input = roomRequestSchema.parse(request.body);
      const idempotencyKey = request.get('idempotency-key') || request.body.idempotencyKey;
      if (!idempotencyKey || !/^[A-Za-z0-9_-]{8,128}$/.test(idempotencyKey)) throw new HttpError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Send an Idempotency-Key header (8 to 128 letters, digits, underscores, or hyphens).');
      const identity = actorIdentity(request, input);
      const room = database.prepare('SELECT id, name, capacity FROM rooms WHERE id = ? AND is_active = 1').get(input.roomId);
      if (!room) throw new HttpError(404, 'ROOM_NOT_FOUND', 'Active room not found.');
      if (input.groupSize > room.capacity) throw new HttpError(400, 'ROOM_CAPACITY_EXCEEDED', 'The requested group is larger than this room capacity.');
      const findExisting = identity.studentId
        ? database.prepare('SELECT * FROM room_requests WHERE student_id = ? AND idempotency_key = ?')
        : database.prepare('SELECT * FROM room_requests WHERE student_email = ? AND idempotency_key = ?');
      const keyValues = identity.studentId ? [identity.studentId, idempotencyKey] : [identity.studentEmail, idempotencyKey];
      const existing = findExisting.get(...keyValues);
      if (existing) return sendSuccess(response, { ...existing, duplicateSubmission: true }, 200);

      const id = `roomreq_${randomUUID()}`;
      const now = new Date().toISOString();
      const create = database.transaction(() => {
        const raced = findExisting.get(...keyValues);
        if (raced) return raced;
        enforceDeviceSubmissionLimit(database, identity);
        database.prepare(`INSERT INTO room_requests (
          id, idempotency_key, student_id, student_email, student_name, enrollment_no, student_phone, device_id,
          room_id, request_date, start_time, end_time, purpose, group_size, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .run(id, idempotencyKey, identity.studentId, identity.studentEmail, identity.studentName,
            identity.enrollmentNo, identity.studentPhone, identity.deviceId, room.id, input.date, input.startTime, input.endTime,
            input.purpose, input.groupSize, now, now);
        recordAudit(database, { actorUserId: identity.studentId, actorEmail: identity.studentEmail, action: 'create', module: 'discussion_rooms', recordId: id, summary: `${identity.studentName} requested ${room.name} on ${input.date}.`, ipAddress: request.ip, after: { ...input, roomName: room.name } });
        return database.prepare(`SELECT room_requests.*, rooms.name AS room_name FROM room_requests JOIN rooms ON rooms.id = room_requests.room_id WHERE room_requests.id = ?`).get(id);
      });
      const created = create.immediate();
      return sendSuccess(response, { ...created, duplicateSubmission: created.id !== id }, created.id === id ? 201 : 200);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        const key = request.get('idempotency-key') || request.body.idempotencyKey;
        const identity = actorIdentity(request, request.body);
        const existing = identity.studentId
          ? database.prepare('SELECT * FROM room_requests WHERE student_id = ? AND idempotency_key = ?').get(identity.studentId, key)
          : database.prepare('SELECT * FROM room_requests WHERE student_email = ? AND idempotency_key = ?').get(identity.studentEmail, key);
        if (existing) return sendSuccess(response, { ...existing, duplicateSubmission: true });
      }
      return next(error);
    }
  });

  router.get('/mine', (request, response, next) => {
    try {
      const query = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(25) }).strict().parse(request.query);
      const identity = actorIdentity(request, { studentName: 'Request owner', studentEmail: 'owner@example.invalid', enrollmentNo: 'owner', studentPhone: '0000000' });
      const clauses = ['device_id = ?'];
      const values = [identity.deviceId];
      const result = paginated(database, `SELECT room_requests.id, room_requests.student_id AS studentId, room_requests.student_email AS studentEmail,
        room_requests.student_name AS studentName, room_requests.enrollment_no AS enrollmentNo, room_requests.student_phone AS studentPhone, room_requests.room_id AS roomId, rooms.name AS roomName,
        room_requests.request_date AS date, room_requests.start_time AS startTime, room_requests.end_time AS endTime, room_requests.purpose, room_requests.group_size AS groupSize,
        room_requests.status, room_requests.remarks, room_requests.version AS version, room_requests.created_at AS createdAt, room_requests.updated_at AS updatedAt
        FROM room_requests JOIN rooms ON rooms.id = room_requests.room_id`, clauses, values, query.page, query.pageSize);
      return sendSuccess(response, result);
    } catch (error) { return next(error); }
  });

  router.patch('/:requestId/cancel', optionalAuth, (request, response, next) => {
    try {
      const current = database.prepare('SELECT * FROM room_requests WHERE id = ?').get(request.params.requestId);
      if (!current) throw new HttpError(404, 'ROOM_REQUEST_NOT_FOUND', 'Room request not found.');
      const deviceId = request.get('x-device-id') || '';
      const owns = current.device_id === deviceId;
      if (request.auth?.must_change_password) throw new HttpError(403, 'PASSWORD_CHANGE_REQUIRED', 'Change the initial password before continuing.');
      if (request.auth) {
        let permissionError = null;
        middleware.requirePermission('discussion_rooms', 'update')(request, response, error => { permissionError = error || null; });
        if (permissionError) throw permissionError;
      } else if (!owns) throw new HttpError(403, 'REQUEST_NOT_OWNED', 'You can only cancel your own requests.');
      if (!['pending', 'approved'].includes(current.status)) throw new HttpError(409, 'REQUEST_NOT_CANCELLABLE', 'Only pending or approved requests can be cancelled.');
      const now = new Date().toISOString();
      const cancel = database.transaction(() => {
        const result = database.prepare(`UPDATE room_requests SET status = 'cancelled', version = version + 1, updated_at = ? WHERE id = ? AND version = ? AND status IN ('pending', 'approved')`)
          .run(now, current.id, current.version);
        if (!result.changes) throw new HttpError(409, 'VERSION_CONFLICT', 'Request changed. Reload before cancelling.');
        recordAudit(database, { actorUserId: current.student_id, actorEmail: current.student_email, action: 'cancel', module: 'discussion_rooms', recordId: current.id, summary: `${current.student_name} cancelled a room request.`, ipAddress: request.ip, before: current, after: { status: 'cancelled' } });
      });
      cancel.immediate();
      return sendSuccess(response, { id: current.id, status: 'cancelled', version: current.version + 1, updatedAt: now });
    } catch (error) { return next(error); }
  });

  router.get('/export.csv', auth, ready, middleware.requirePermission('discussion_rooms', 'read'), (_request, response, next) => {
    try {
      const rows = database.prepare(`
        SELECT room_requests.id, room_requests.student_name, room_requests.student_email,
          room_requests.enrollment_no, rooms.name AS room_name, room_requests.request_date,
          room_requests.start_time, room_requests.end_time, room_requests.group_size,
          room_requests.purpose, room_requests.status, room_requests.remarks,
          room_requests.override_reason, room_requests.created_at
        FROM room_requests
        JOIN rooms ON rooms.id = room_requests.room_id
        ORDER BY room_requests.request_date DESC, room_requests.start_time ASC
      `).all();
      const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
      const lines = ['id,studentName,studentEmail,enrollmentNo,roomName,requestDate,startTime,endTime,groupSize,purpose,status,remarks,overrideReason,createdAt'];
      for (const r of rows) {
        lines.push([r.id, r.student_name, r.student_email, r.enrollment_no, r.room_name, r.request_date, r.start_time, r.end_time, r.group_size, r.purpose, r.status, r.remarks, r.override_reason, r.created_at].map(quote).join(','));
      }
      response.type('text/csv').attachment('room-requests.csv').send(lines.join('\r\n'));
    } catch (error) { return next(error); }
  });

  router.get('/', auth, ready, middleware.requirePermission('discussion_rooms', 'read'), (request, response, next) => {
    try {
      const query = requestListSchema.parse(request.query);
      const clauses = [];
      const values = [];
      if (query.status) { clauses.push('status = ?'); values.push(query.status); }
      if (query.roomId) { clauses.push('room_id = ?'); values.push(query.roomId); }
      if (query.date) { clauses.push('request_date = ?'); values.push(query.date); }
      if (query.query) { clauses.push('(student_name LIKE ? OR student_email LIKE ?)'); values.push(`%${query.query}%`, `%${query.query}%`); }
      const result = paginated(database, `SELECT room_requests.id, room_requests.student_id AS studentId, room_requests.student_email AS studentEmail,
        room_requests.student_name AS studentName, room_requests.enrollment_no AS enrollmentNo, room_requests.student_phone AS studentPhone, room_requests.room_id AS roomId, rooms.name AS roomName,
        room_requests.request_date AS date, room_requests.start_time AS startTime, room_requests.end_time AS endTime, room_requests.purpose, room_requests.group_size AS groupSize,
        room_requests.status, room_requests.remarks, room_requests.override_reason AS overrideReason, room_requests.version AS version, room_requests.created_at AS createdAt, room_requests.updated_at AS updatedAt
        FROM room_requests JOIN rooms ON rooms.id = room_requests.room_id`, clauses, values, query.page, query.pageSize, 'date DESC, startTime');
      for (const item of result.items) {
        item.conflicts = item.status === 'approved' ? [] : database.prepare(`SELECT id, student_name AS studentName,
          start_time AS startTime, end_time AS endTime FROM room_requests WHERE room_id = ? AND request_date = ?
          AND status = 'approved' AND start_time < ? AND end_time > ?`)
          .all(item.roomId, item.date, item.endTime, item.startTime);
      }
      return sendSuccess(response, result);
    } catch (error) { return next(error); }
  });

  router.patch('/:requestId/decision', auth, ready, middleware.requirePermission('discussion_rooms', 'update'), (request, response, next) => {
    try {
      const input = decisionSchema.parse(request.body);
      const before = database.prepare('SELECT room_requests.*, rooms.name AS room_name FROM room_requests JOIN rooms ON rooms.id = room_requests.room_id WHERE room_requests.id = ?').get(request.params.requestId);
      if (!before) throw new HttpError(404, 'ROOM_REQUEST_NOT_FOUND', 'Room request not found.');
      if (before.version !== input.version) throw new HttpError(409, 'VERSION_CONFLICT', 'Request changed. Reload before deciding.');
      if (before.status !== 'pending') throw new HttpError(409, 'REQUEST_ALREADY_DECIDED', 'Only pending requests can be decided.');
      const now = new Date().toISOString();
      const decide = database.transaction(() => {
        const current = database.prepare('SELECT * FROM room_requests WHERE id = ?').get(before.id);
        if (current.version !== input.version || current.status !== 'pending') throw new HttpError(409, 'VERSION_CONFLICT', 'Request changed. Reload before deciding.');
        let conflicts = [];
        if (input.status === 'approved') {
          conflicts = database.prepare(`SELECT id, student_name AS studentName, start_time AS startTime, end_time AS endTime
            FROM room_requests WHERE room_id = ? AND request_date = ? AND status = 'approved'
            AND start_time < ? AND end_time > ?`)
            .all(current.room_id, current.request_date, current.end_time, current.start_time);
          if (conflicts.length && !input.overrideReason?.trim()) {
            throw new HttpError(409, 'ROOM_CONFLICT', 'This room/time overlaps an approved booking. Provide an overrideReason to explicitly override.', { conflicts });
          }
        }
        const result = database.prepare(`UPDATE room_requests SET status = ?, remarks = ?, override_reason = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ? AND status = 'pending'`)
          .run(input.status, input.remarks || null, conflicts.length ? input.overrideReason.trim() : null, now, current.id, input.version);
        if (!result.changes) throw new HttpError(409, 'VERSION_CONFLICT', 'Request changed. Reload before deciding.');
        recordAudit(database, { actorUserId: request.auth.id, actorEmail: request.auth.email, action: input.status, module: 'discussion_rooms', recordId: current.id, summary: `${input.status === 'approved' ? 'Approved' : 'Denied'} room request from ${current.student_name}.${conflicts.length ? ` Conflict override: ${input.overrideReason.trim()}` : ''}`, ipAddress: request.ip, before, after: { status: input.status, remarks: input.remarks || null, overrideReason: conflicts.length ? input.overrideReason.trim() : null } });
        return conflicts;
      });
      const conflicts = decide.immediate();
      return sendSuccess(response, { id: before.id, status: input.status, remarks: input.remarks || null, overrideReason: conflicts.length ? input.overrideReason.trim() : null, conflicts, version: input.version + 1, updatedAt: now });
    } catch (error) {
      if (error.code === 'ROOM_CONFLICT') error.details = error.details || undefined;
      return next(error);
    }
  });
  return router;
}

export function createBookRequestsRouter(database, middleware) {
  const router = express.Router();
  const auth = middleware.requireAuth;
  const ready = middleware.requirePasswordChanged;
  router.post('/', publicSubmissionLimiter, (request, response, next) => {
    try {
      const input = bookRequestSchema.parse(request.body);
      const idempotencyKey = request.get('idempotency-key') || request.body.idempotencyKey;
      if (!idempotencyKey || !/^[A-Za-z0-9_-]{8,128}$/.test(idempotencyKey)) throw new HttpError(400, 'IDEMPOTENCY_KEY_REQUIRED', 'Send an Idempotency-Key header (8 to 128 letters, digits, underscores, or hyphens).');
      const identity = actorIdentity(request, input);
      const existing = identity.studentId
        ? database.prepare('SELECT * FROM book_requests WHERE student_id = ? AND idempotency_key = ?').get(identity.studentId, idempotencyKey)
        : database.prepare('SELECT * FROM book_requests WHERE student_email = ? AND idempotency_key = ?').get(identity.studentEmail, idempotencyKey);
      if (existing) return sendSuccess(response, { ...existing, duplicateSubmission: true });
      if (input.catalogBookId && !database.prepare('SELECT id FROM books WHERE id = ?').get(input.catalogBookId)) throw new HttpError(400, 'BOOK_NOT_FOUND', 'Selected catalog book does not exist.');
      const id = `bookreq_${randomUUID()}`;
      const now = new Date().toISOString();
      const create = database.transaction(() => {
        const raced = identity.studentId
          ? database.prepare('SELECT * FROM book_requests WHERE student_id = ? AND idempotency_key = ?').get(identity.studentId, idempotencyKey)
          : database.prepare('SELECT * FROM book_requests WHERE student_email = ? AND idempotency_key = ?').get(identity.studentEmail, idempotencyKey);
        if (raced) return raced;
        enforceDeviceSubmissionLimit(database, identity);
        database.prepare(`INSERT INTO book_requests (id, idempotency_key, student_id, student_email, student_name, enrollment_no, student_phone, device_id,
          title, author, publisher, edition, isbn, reason, catalog_book_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .run(id, idempotencyKey, identity.studentId, identity.studentEmail, identity.studentName, identity.enrollmentNo, identity.studentPhone, identity.deviceId,
            input.title, input.author || null, input.publisher || null, input.edition || null, input.isbn || null, input.reason, input.catalogBookId || null, now, now);
        recordAudit(database, { actorUserId: identity.studentId, actorEmail: identity.studentEmail, action: 'create', module: 'book_requests', recordId: id, summary: `${identity.studentName} requested '${input.title}'.`, ipAddress: request.ip, after: input });
        return database.prepare('SELECT * FROM book_requests WHERE id = ?').get(id);
      });
      const created = create.immediate();
      return sendSuccess(response, { ...created, duplicateSubmission: created.id !== id }, created.id === id ? 201 : 200);
    } catch (error) { return next(error); }
  });

  router.get('/mine', (request, response, next) => {
    try {
      const query = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(25) }).strict().parse(request.query);
      const identity = actorIdentity(request, { studentName: 'Request owner', studentEmail: 'owner@example.invalid', enrollmentNo: 'owner', studentPhone: '0000000' });
      return sendSuccess(response, paginated(database, `SELECT id, student_id AS studentId, student_email AS studentEmail, student_name AS studentName,
        enrollment_no AS enrollmentNo, student_phone AS studentPhone,
        title, author, publisher, edition, isbn, reason, catalog_book_id AS catalogBookId, status, remarks, version,
        created_at AS createdAt, updated_at AS updatedAt FROM book_requests`, ['device_id = ?'], [identity.deviceId], query.page, query.pageSize));
    } catch (error) { return next(error); }
  });

  router.get('/export.csv', auth, ready, middleware.requirePermission('book_requests', 'read'), (_request, response, next) => {
    try {
      const rows = database.prepare(`
        SELECT book_requests.id, book_requests.student_name, book_requests.student_email,
          book_requests.enrollment_no, book_requests.title, book_requests.author,
          book_requests.publisher, book_requests.edition, book_requests.isbn, book_requests.reason,
          books.title AS catalog_book_title, book_requests.status, book_requests.remarks,
          book_requests.created_at
        FROM book_requests
        LEFT JOIN books ON books.id = book_requests.catalog_book_id
        ORDER BY book_requests.created_at DESC
      `).all();
      const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
      const lines = ['id,studentName,studentEmail,enrollmentNo,title,author,publisher,edition,isbn,reason,catalogBookTitle,status,remarks,createdAt'];
      for (const r of rows) {
        lines.push([r.id, r.student_name, r.student_email, r.enrollment_no, r.title, r.author, r.publisher, r.edition, r.isbn, r.reason, r.catalog_book_title, r.status, r.remarks, r.created_at].map(quote).join(','));
      }
      response.type('text/csv').attachment('book-requests.csv').send(lines.join('\r\n'));
    } catch (error) { return next(error); }
  });

  router.get('/', auth, ready, middleware.requirePermission('book_requests', 'read'), (request, response, next) => {
    try {
      const query = requestListSchema.parse(request.query);
      const clauses = [];
      const values = [];
      if (query.status) { clauses.push('status = ?'); values.push(query.status); }
      if (query.query) { clauses.push('(student_name LIKE ? OR student_email LIKE ? OR title LIKE ?)'); values.push(`%${query.query}%`, `%${query.query}%`, `%${query.query}%`); }
      return sendSuccess(response, paginated(database, `SELECT id, student_id AS studentId, student_email AS studentEmail, student_name AS studentName,
        enrollment_no AS enrollmentNo, student_phone AS studentPhone, title, author, publisher, edition, isbn, reason, catalog_book_id AS catalogBookId,
        status, remarks, version, created_at AS createdAt, updated_at AS updatedAt FROM book_requests`, clauses, values,
        query.page, query.pageSize));
    } catch (error) { return next(error); }
  });

  router.patch('/:requestId/decision', auth, ready, middleware.requirePermission('book_requests', 'update'), (request, response, next) => {
    try {
      const input = bookDecisionSchema.parse(request.body);
      const before = database.prepare('SELECT * FROM book_requests WHERE id = ?').get(request.params.requestId);
      if (!before) throw new HttpError(404, 'BOOK_REQUEST_NOT_FOUND', 'Book request not found.');
      if (before.version !== input.version) throw new HttpError(409, 'VERSION_CONFLICT', 'Request changed. Reload before deciding.');
      if (before.status !== 'pending') throw new HttpError(409, 'REQUEST_ALREADY_DECIDED', 'Only pending book requests can be decided.');
      const now = new Date().toISOString();
      const decide = database.transaction(() => {
        const current = database.prepare('SELECT * FROM book_requests WHERE id = ?').get(before.id);
        if (current.version !== input.version || current.status !== 'pending') throw new HttpError(409, 'VERSION_CONFLICT', 'Request changed. Reload before deciding.');
        if (input.status === 'done' && current.catalog_book_id) {
          const stock = database.prepare('UPDATE books SET quantity_available = quantity_available - 1, version = version + 1, updated_at = ? WHERE id = ? AND quantity_available > 0')
            .run(now, current.catalog_book_id);
          if (stock.changes !== 1) throw new HttpError(409, 'BOOK_UNAVAILABLE', 'The linked catalog book has no available copies.');
        }
        const result = database.prepare(`UPDATE book_requests SET status = ?, remarks = ?, version = version + 1, updated_at = ? WHERE id = ? AND version = ? AND status = 'pending'`)
          .run(input.status, input.remarks || null, now, current.id, input.version);
        if (!result.changes) throw new HttpError(409, 'VERSION_CONFLICT', 'Request changed. Reload before deciding.');
        recordAudit(database, { actorUserId: request.auth.id, actorEmail: request.auth.email, action: input.status, module: 'book_requests', recordId: current.id, summary: `${input.status === 'done' ? 'Completed' : 'Rejected'} book request '${current.title}' from ${current.student_name}.`, ipAddress: request.ip, before, after: { status: input.status, remarks: input.remarks || null } });
      });
      decide.immediate();
      return sendSuccess(response, { id: before.id, status: input.status, remarks: input.remarks || null, version: input.version + 1, updatedAt: now });
    } catch (error) { return next(error); }
  });
  return router;
}
