import express from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { sendSuccess } from '../errors.js';

const loginSchema = z.object({
  loginId: z.string().trim().min(3).max(120),
  password: z.string().min(1).max(200),
}).strict();

const refreshSchema = z.object({ refreshToken: z.string().min(32).max(256) }).strict();

const passwordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(12).max(200),
}).strict();

function parseBody(schema, request) {
  return schema.parse(request.body);
}

export function createAuthRouter(authService, middleware) {
  const router = express.Router();
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { success: false, data: null, error: { code: 'LOGIN_RATE_LIMITED', message: 'Too many sign-in attempts. Try again later.' } },
  });
  const refreshLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_request, response) => response.status(429).json({
      success: false,
      data: null,
      error: { code: 'REFRESH_RATE_LIMITED', message: 'Too many refresh attempts. Try again later.' },
    }),
  });

  router.post('/login', loginLimiter, (request, response, next) => {
    try {
      return sendSuccess(response, authService.login(parseBody(loginSchema, request), request));
    } catch (error) {
      return next(error);
    }
  });

  router.post('/refresh', refreshLimiter, (request, response, next) => {
    try {
      return sendSuccess(response, authService.refresh(parseBody(refreshSchema, request), request));
    } catch (error) {
      return next(error);
    }
  });

  router.get('/me', middleware.requireAuth, (request, response) => {
    const { id, email, login_id: loginId, display_name: name, role_name: role, system_key: roleKey, must_change_password: mustChangePassword, role_id: roleId } = request.auth;
    return sendSuccess(response, {
      user: { id, loginId: loginId || email, email: loginId || email, name, role, roleKey, mustChangePassword: Boolean(mustChangePassword) },
      permissions: authService.permissionsFor(roleId),
    });
  });

  router.post('/change-password', middleware.requireAuth, (request, response, next) => {
    try {
      const tokens = authService.changePassword(request.auth, request.auth.sessionId, parseBody(passwordSchema, request), request);
      return sendSuccess(response, tokens);
    } catch (error) {
      return next(error);
    }
  });

  router.post('/logout', middleware.requireAuth, (request, response) => {
    authService.logout(request.auth, request.auth.sessionId, request);
    return sendSuccess(response, { loggedOut: true });
  });

  return router;
}
