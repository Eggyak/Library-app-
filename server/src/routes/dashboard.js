import express from 'express';
import { sendSuccess } from '../errors.js';

export function createDashboardRouter(database, middleware) {
  const router = express.Router();
  const auth = middleware.requireAuth;
  const ready = middleware.requirePasswordChanged;

  router.get('/stats', auth, ready, middleware.requirePermission('dashboard', 'read'), (request, response, next) => {
    try {
      const booksCount = database.prepare('SELECT COUNT(*) AS count FROM books').get().count;
      const copiesTotal = database.prepare('SELECT COALESCE(SUM(quantity_total), 0) AS total FROM books').get().total;
      const copiesAvailable = database.prepare('SELECT COALESCE(SUM(quantity_available), 0) AS available FROM books').get().available;
      const categoriesCount = database.prepare('SELECT COUNT(*) AS count FROM categories').get().count;

      const roomsActive = database.prepare('SELECT COUNT(*) AS count FROM rooms WHERE is_active = 1').get().count;
      const roomRequestsPending = database.prepare("SELECT COUNT(*) AS count FROM room_requests WHERE status = 'pending'").get().count;
      const roomBookingsToday = database.prepare("SELECT COUNT(*) AS count FROM room_requests WHERE status = 'approved' AND request_date = date('now', 'localtime')").get().count;
      const roomRequestsTotal = database.prepare('SELECT COUNT(*) AS count FROM room_requests').get().count;

      const bookRequestsPending = database.prepare("SELECT COUNT(*) AS count FROM book_requests WHERE status = 'pending'").get().count;
      const bookRequestsTotal = database.prepare('SELECT COUNT(*) AS count FROM book_requests').get().count;

      const clippingsCount = database.prepare('SELECT COUNT(*) AS count FROM clippings').get().count;
      const resourcesCount = database.prepare('SELECT COUNT(*) AS count FROM e_resources').get().count;
      const announcementsCount = database.prepare('SELECT COUNT(*) AS count FROM announcements WHERE is_published = 1').get().count;

      const recentActivity = database.prepare(`
        SELECT id, actor_user_id AS actorUserId, actor_email AS actorEmail,
          action, module, record_id AS recordId, summary, created_at AS createdAt
        FROM audit_log
        ORDER BY created_at DESC, id DESC
        LIMIT 10
      `).all();

      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d.toISOString().slice(0, 10));
      }

      const roomCountsByDay = database.prepare(`
        SELECT request_date AS day, COUNT(*) AS count
        FROM room_requests
        WHERE request_date >= ?
        GROUP BY request_date
      `).all(days[0]);

      const roomDayMap = new Map(roomCountsByDay.map(row => [row.day, row.count]));

      const weeklyActivity = days.map(day => ({
        day,
        label: new Date(day + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'short', timeZone: 'UTC' }),
        roomRequests: roomDayMap.get(day) || 0,
      }));

      return sendSuccess(response, {
        inventory: {
          totalBooks: booksCount,
          totalCopies: copiesTotal,
          availableCopies: copiesAvailable,
          categories: categoriesCount,
        },
        rooms: {
          activeRooms: roomsActive,
          approvedToday: roomBookingsToday,
          pendingRequests: roomRequestsPending,
          totalRequests: roomRequestsTotal,
        },
        bookRequests: {
          pendingRequests: bookRequestsPending,
          totalRequests: bookRequestsTotal,
        },
        content: {
          clippings: clippingsCount,
          resources: resourcesCount,
          announcements: announcementsCount,
        },
        weeklyActivity,
        recentActivity,
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get('/activity.csv', auth, ready, middleware.requirePermission('dashboard', 'read'), (_request, response, next) => {
    try {
      const rows = database.prepare(`
        SELECT id, actor_user_id AS actorUserId, actor_email AS actorEmail,
          action, module, record_id AS recordId, summary, ip_address AS ipAddress,
          created_at AS createdAt
        FROM audit_log ORDER BY created_at DESC, id DESC
      `).all();
      const quote = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
      const lines = ['id,actorUserId,actorEmail,action,module,recordId,summary,ipAddress,createdAt',
        ...rows.map(row => [row.id, row.actorUserId, row.actorEmail, row.action, row.module, row.recordId, row.summary, row.ipAddress, row.createdAt].map(quote).join(','))];
      response.type('text/csv').attachment('activity-feed.csv').send(lines.join('\r\n'));
    } catch (error) { return next(error); }
  });

  return router;
}
