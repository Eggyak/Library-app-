import express from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { sendSuccess } from '../errors.js';
import { recordAudit } from '../audit.js';

const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
  category: z.enum(['bug', 'feature', 'general', 'other']).optional(),
}).strict();

export function createFeedbackRouter(database, middleware) {
  const router = express.Router();
  const feedbackLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 5, standardHeaders: 'draft-8', legacyHeaders: false });
  const optionalAuth = (request, response, next) => {
    if (!request.get('authorization')) {
      request.auth = { id: null, email: null };
      return next();
    }
    return middleware.requireAuth(request, response, next);
  };

  router.post('/', feedbackLimiter, optionalAuth, (request, response, next) => {
    try {
      const parsed = feedbackSchema.parse(request.body);
      const now = new Date().toISOString();
      const id = `fb_${parsed.subject.slice(0, 20).replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;

      const stmt = database.prepare(`
        INSERT INTO feedback (id, user_id, user_email, subject, message, category, rating, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)
      `);
      stmt.run(
        id,
        request.auth.id,
        request.auth.email,
        parsed.subject,
        parsed.message,
        parsed.category || 'general',
        parsed.rating || null,
        now,
        now,
      );

      recordAudit(database, {
        actorUserId: request.auth.id,
        actorEmail: request.auth.email,
        action: 'create',
        module: 'feedback',
        recordId: id,
        summary: `New feedback submitted: '${parsed.subject}'.`,
        ipAddress: request.ip,
        after: { subject: parsed.subject, category: parsed.category || 'general', rating: parsed.rating || null },
      });

      return sendSuccess(response, { id, status: 'received' }, 201);
    } catch (error) {
      return next(error);
    }
  });

  router.get('/mine', middleware.requireAuth, (request, response, next) => {
    try {
      const items = database.prepare(`
        SELECT id, subject, message, category, rating, status, created_at AS createdAt, updated_at AS updatedAt
        FROM feedback
        WHERE user_id = ?
        ORDER BY created_at DESC
      `).all(request.auth.id);
      return sendSuccess(response, { items });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
