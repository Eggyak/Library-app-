import express from 'express';
import { sendSuccess } from '../errors.js';
import { MODULES } from '../db/seed.js';

export function createNotificationsRouter(database, middleware) {
  const router = express.Router();

  router.get('/', middleware.requireAuth, middleware.requirePasswordChanged, (request, response, next) => {
    try {
      let modules;
      if (request.auth.system_key === 'super_admin') {
        modules = [];
      } else if (request.auth.system_key === 'local_development') {
        modules = MODULES;
      } else {
        modules = database.prepare(`
          SELECT module FROM role_permissions
          WHERE role_id = ? AND action = 'read' AND allowed = 1
        `).all(request.auth.role_id).map(row => row.module);
      }

      const has = module => modules.includes(module);
      const filters = [];
      if (has('discussion_rooms')) filters.push("(module = 'discussion_rooms' AND action = 'create' AND summary LIKE '% requested %')");
      if (has('book_requests')) filters.push("(module = 'book_requests' AND action = 'create')");
      if (has('dashboard') || has('audit_log')) filters.push("(module = 'feedback' AND action = 'create')");
      if (!filters.length) return sendSuccess(response, { items: [] });
      const items = database.prepare(`
        SELECT id, actor_email AS actor, action, module, summary, created_at AS createdAt
        FROM audit_log
        WHERE ${filters.join(' OR ')}
        ORDER BY created_at DESC, id DESC
        LIMIT 30
      `).all();
      return sendSuccess(response, { items });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
