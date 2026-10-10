import express from 'express';
import { z } from 'zod';
import { sendSuccess } from '../errors.js';

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  userId: z.string().max(100).optional(),
  module: z.string().max(80).optional(),
  action: z.string().max(80).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
}).strict();

export function createAuditRouter(database, middleware) {
  const router = express.Router();

  router.get('/', middleware.requireAuth, middleware.requirePasswordChanged, middleware.requirePermission('audit_log', 'read'), (request, response, next) => {
    try {
      const query = querySchema.parse(request.query);
      const filters = [];
      const values = [];
      if (query.userId) { filters.push('actor_user_id = ?'); values.push(query.userId); }
      if (query.module) { filters.push('module = ?'); values.push(query.module); }
      if (query.action) { filters.push('action = ?'); values.push(query.action); }
      if (query.from) { filters.push('created_at >= ?'); values.push(query.from); }
      if (query.to) { filters.push('created_at <= ?'); values.push(query.to); }
      const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
      const total = database.prepare(`SELECT COUNT(*) AS count FROM audit_log ${where}`).get(...values).count;
      const rows = database.prepare(`
        SELECT id, actor_user_id AS actorUserId, actor_email AS actorEmail,
          action, module, record_id AS recordId, summary, ip_address AS ipAddress,
          before_json AS beforeJson, after_json AS afterJson, created_at AS createdAt
        FROM audit_log ${where}
        ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?
      `).all(...values, query.pageSize, (query.page - 1) * query.pageSize);

      return sendSuccess(response, {
        items: rows.map(row => ({
          ...row,
          before: row.beforeJson ? JSON.parse(row.beforeJson) : null,
          after: row.afterJson ? JSON.parse(row.afterJson) : null,
          beforeJson: undefined,
          afterJson: undefined,
        })),
        pagination: { page: query.page, pageSize: query.pageSize, total, pageCount: Math.ceil(total / query.pageSize) },
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get('/export.csv', middleware.requireAuth, middleware.requirePasswordChanged, middleware.requirePermission('audit_log', 'read'), (_request, response, next) => {
    try {
      const rows = database.prepare(`
        SELECT id, actor_user_id AS actorUserId, actor_email AS actorEmail,
          action, module, record_id AS recordId, summary, ip_address AS ipAddress,
          created_at AS createdAt
        FROM audit_log
        ORDER BY created_at DESC, id DESC
      `).all();
      const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
      const lines = ['id,actorUserId,actorEmail,action,module,recordId,summary,ipAddress,createdAt'];
      for (const r of rows) {
        lines.push([r.id, r.actorUserId, r.actorEmail, r.action, r.module, r.recordId, r.summary, r.ipAddress, r.createdAt].map(quote).join(','));
      }
      response.type('text/csv').attachment('audit-log.csv').send(lines.join('\r\n'));
    } catch (error) {
      return next(error);
    }
  });

  return router;
}