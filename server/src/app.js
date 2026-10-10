import cors from 'cors';
import rateLimit from 'express-rate-limit';
import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerUi from 'swagger-ui-express';
import { createAuthMiddleware, createAuthService } from './auth/service.js';
import { createAuditRouter } from './routes/audit.js';
import { createAuthRouter } from './routes/auth.js';
import { createManagementRouter } from './routes/management.js';
import { createBooksRouter } from './routes/books.js';
import { createFeedbackRouter } from './routes/feedback.js';
import {
  createAnnouncementsRouter,
  createClippingsRouter,
  createEResourcesRouter,
  createGeneralInfoRouter,
  createHolidaysRouter,
} from './routes/content.js';
import {
  createRoomsRouter,
  createRoomRequestsRouter,
  createBookRequestsRouter,
} from './routes/requests.js';
import { createDashboardRouter } from './routes/dashboard.js';
import { createNotificationsRouter } from './routes/notifications.js';
import { createRealtimeRouter } from './realtime.js';
import { openApiDocument } from './openapi.js';
import { errorHandler, HttpError, sendSuccess } from './errors.js';
import { uploadDirectory } from './uploads.js';

const adminDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../admin');

export function createApp({ database, config }) {
  const app = express();
  const authService = createAuthService(database, config);
  const authMiddleware = createAuthMiddleware(authService, config);

  app.disable('x-powered-by');
  // Trust forwarding headers only from a local tunnel proxy. LAN clients keep their socket IP.
  app.set('trust proxy', address => ['127.0.0.1', '::1', '::ffff:127.0.0.1'].includes(address));
  // Do not upgrade relative portal assets from HTTP to HTTPS: the LAN portal
  // is served over HTTP, while public tunnel traffic is already HTTPS.
  app.use(helmet({
    contentSecurityPolicy: {
      directives: { upgradeInsecureRequests: null },
    },
  }));
  const corsMiddleware = cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) return callback(null, true);
      return callback(new HttpError(403, 'CORS_ORIGIN_DENIED', 'This origin is not allowed.'));
    },
    credentials: true,
  });
  app.use((request, response, next) => {
    const origin = request.get('origin');
    if (origin) {
      try {
        // The portal and API share an origin on localhost, LAN, and tunnels.
        // CORS is only needed for requests coming from a different origin.
        if (new URL(origin).host === request.get('host')) return next();
      } catch {
        // Let the CORS middleware reject malformed or untrusted origins.
      }
    }
    return corsMiddleware(request, response, next);
  });
  app.use(express.json({ limit: '1mb', type: 'application/json' }));
  const publicReadLimiter = rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-8', legacyHeaders: false });

  app.get('/api/v1/health', (_request, response) => sendSuccess(response, {
    status: 'ok',
    version: config.version,
    timestamp: new Date().toISOString(),
  }));

  app.get('/api/openapi.json', (_request, response) => response.json(openApiDocument));
  app.use('/api/docs', (_request, response, next) => {
    response.removeHeader('Content-Security-Policy');
    next();
  }, swaggerUi.serve, swaggerUi.setup(openApiDocument, { explorer: true }));

  app.use('/api/v1/auth', createAuthRouter(authService, authMiddleware));
  app.use('/api/v1/admin', createManagementRouter(database, config, authMiddleware));
  app.use('/api/v1/audit-log', createAuditRouter(database, authMiddleware));
  app.use('/api/v1/books', publicReadLimiter, createBooksRouter(database, authMiddleware));
  app.use('/api/v1/feedback', createFeedbackRouter(database, authMiddleware));
  app.use('/api/v1/clippings', publicReadLimiter, createClippingsRouter(database, authMiddleware));
  app.use('/api/v1/general-info', publicReadLimiter, createGeneralInfoRouter(database, authMiddleware));
  app.use('/api/v1/holidays', publicReadLimiter, createHolidaysRouter(database, authMiddleware));
  app.use('/api/v1/e-resources', publicReadLimiter, createEResourcesRouter(database, authMiddleware));
  app.use('/api/v1/announcements', publicReadLimiter, createAnnouncementsRouter(database, authMiddleware));
  app.use('/api/v1/rooms', publicReadLimiter, createRoomsRouter(database, authMiddleware));
  app.use('/api/v1/room-requests', createRoomRequestsRouter(database, authMiddleware));
  app.use('/api/v1/book-requests', createBookRequestsRouter(database, authMiddleware));
  app.use('/api/v1/dashboard', createDashboardRouter(database, authMiddleware));
  app.use('/api/v1/notifications', createNotificationsRouter(database, authMiddleware));
  app.use('/api/v1', publicReadLimiter, createRealtimeRouter(database, authMiddleware));
  app.use('/files', publicReadLimiter, express.static(uploadDirectory, { fallthrough: false, dotfiles: 'deny' }));

  app.get('/admin', (_request, response) => response.redirect('/'));
  app.use(express.static(adminDirectory, { index: 'index.html', fallthrough: true }));
  app.get('/{*path}', (request, response, next) => {
    if (request.path.startsWith('/api/') || request.path.startsWith('/files/')) {
      return next();
    }
    response.sendFile(path.join(adminDirectory, 'index.html'));
  });
  app.use('/api/v1', (_request, _response, next) => next(new HttpError(404, 'NOT_FOUND', 'API route not found.')));
  app.use((_request, _response, next) => next(new HttpError(404, 'NOT_FOUND', 'Route not found.')));
  app.use(errorHandler);
  return app;
}
