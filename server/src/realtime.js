import express from 'express';
import { z } from 'zod';
import { recordAudit } from './audit.js';
import { HttpError, sendSuccess } from './errors.js';

const clients = new Set();
const syncModuleSchema = z.enum(['books', 'new_arrivals', 'clippings', 'general_info', 'e_resources', 'discussion_rooms', 'book_requests']);

let heartbeatTimer = null;

function ensureHeartbeat() {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(() => {
    for (const client of clients) {
      try {
        client.write(': heartbeat\n\n');
      } catch {
        clients.delete(client);
      }
    }
    if (clients.size === 0 && heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }, 25000);
}

export function broadcastChange(change) {
  const publicModules = new Set(['books', 'new_arrivals', 'clippings', 'general_info', 'e_resources', 'discussion_rooms', 'book_requests']);
  if (!publicModules.has(change.module)) return;
  const payload = {
    module: change.module,
    action: change.action,
    recordId: change.recordId,
    timestamp: change.timestamp || new Date().toISOString(),
  };
  const message = `event: change\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const client of clients) {
    try {
      client.write(message);
    } catch {
      clients.delete(client);
    }
  }
}

export function createRealtimeRouter(database, middleware) {
  const router = express.Router();

  router.post('/sync/publish', middleware.requireAuth, middleware.requirePasswordChanged, (request, response, next) => {
    try {
      const input = z.object({ modules: z.array(syncModuleSchema).min(1).max(7) }).strict().parse(request.body);
      const modules = [...new Set(input.modules)];
      const canPublish = database.prepare(`SELECT 1 FROM role_permissions
        WHERE role_id = ? AND module = ? AND action IN ('write', 'update', 'delete') AND allowed = 1 LIMIT 1`);
      for (const module of modules) {
        if (!canPublish.get(request.auth.role_id, module)) {
          throw new HttpError(403, 'PERMISSION_DENIED', `Write, update, or delete access is required to sync ${module} with the app.`);
        }
      }
      const syncedAt = new Date().toISOString();
      database.transaction(() => {
        for (const module of modules) {
          recordAudit(database, {
            actorUserId: request.auth.id,
            actorEmail: request.auth.email,
            action: 'sync',
            module,
            summary: `Requested an app refresh for ${module.replaceAll('_', ' ')}.`,
            ipAddress: request.ip,
            after: { syncRequestedAt: syncedAt },
          });
        }
      })();
      return sendSuccess(response, { modules, syncedAt });
    } catch (error) { return next(error); }
  });

  // SSE Stream endpoint
  router.get('/updates/stream', (request, response) => {
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    response.write(`data: ${JSON.stringify({ type: 'connected', timestamp: new Date().toISOString() })}\n\n`);
    clients.add(response);
    ensureHeartbeat();

    request.on('close', () => {
      clients.delete(response);
    });
  });

  // Delta Sync endpoint
  router.get('/sync', (request, response, next) => {
    try {
      const since = typeof request.query.since === 'string' && request.query.since
        ? request.query.since
        : new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const changes = database.prepare(`
        SELECT module, action, record_id AS recordId, created_at AS createdAt
        FROM audit_log
        WHERE created_at > ? AND module IN ('books', 'new_arrivals', 'clippings', 'general_info', 'e_resources', 'discussion_rooms', 'book_requests')
        ORDER BY created_at ASC
        LIMIT 500
      `).all(since);

      const affectedModules = [...new Set(changes.map(item => item.module))];

      return sendSuccess(response, {
        serverTime: new Date().toISOString(),
        since,
        changesCount: changes.length,
        affectedModules,
        changes,
      });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
