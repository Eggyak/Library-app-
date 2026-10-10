import { createHash, randomBytes, randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { recordAudit } from '../audit.js';
import { HttpError } from '../errors.js';

const DUMMY_PASSWORD_HASH = bcrypt.hashSync('not-a-valid-user-password', 12);

function refreshTokenHash(token) {
  return createHash('sha256').update(token).digest('hex');
}

function userById(database, userId) {
  return database.prepare(`
    SELECT users.id, users.login_id AS email, users.login_id, users.display_name, users.role_id, users.is_active,
      users.must_change_password, users.token_version, roles.name AS role_name, roles.system_key
    FROM users JOIN roles ON roles.id = users.role_id
    WHERE users.id = ?
  `).get(userId);
}

function publicUser(user) {
  return {
    id: user.id,
    loginId: user.login_id || user.email,
    email: user.login_id || user.email,
    name: user.display_name,
    role: user.role_name,
    roleKey: user.system_key,
    mustChangePassword: Boolean(user.must_change_password),
  };
}

export function createAuthService(database, config) {
  const createSession = (user, request) => {
    const id = `ses_${randomUUID()}`;
    const refreshToken = randomBytes(48).toString('base64url');
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + config.refreshTokenDays * 86_400_000);
    database.prepare(`
      INSERT INTO sessions (id, user_id, refresh_token_hash, created_at, expires_at, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      user.id,
      refreshTokenHash(refreshToken),
      createdAt.toISOString(),
      expiresAt.toISOString(),
      request.ip || null,
      request.get('user-agent') || null,
    );

    const accessToken = jwt.sign({ sid: id, ver: user.token_version }, config.jwtSecret, {
      subject: user.id,
      expiresIn: config.accessTokenTtl,
      issuer: 'nu-lirc-server',
      audience: 'nu-lirc-client',
    });
    return { accessToken, refreshToken, expiresAt: expiresAt.toISOString() };
  };

  const permissionsFor = (roleId) => database.prepare(`
    SELECT module, action FROM role_permissions
    WHERE role_id = ? AND allowed = 1
    ORDER BY module, action
  `).all(roleId);

  return {
    login({ loginId, password }, request) {
      const normalizedLoginId = loginId.trim();
      const failure = database.prepare('SELECT attempts, locked_until AS lockedUntil FROM login_failures WHERE login_id = ? COLLATE NOCASE').get(normalizedLoginId);
      if (failure?.lockedUntil && Date.parse(failure.lockedUntil) > Date.now()) {
        throw new HttpError(429, 'ACCOUNT_TEMPORARILY_LOCKED', 'Too many failed attempts. Try again in 15 minutes.');
      }

      const account = database.prepare(`
        SELECT users.*, users.login_id AS email, roles.name AS role_name, roles.system_key
        FROM users JOIN roles ON roles.id = users.role_id
        WHERE users.login_id = ? COLLATE NOCASE
      `).get(normalizedLoginId);
      const passwordMatches = bcrypt.compareSync(password, account?.password_hash || DUMMY_PASSWORD_HASH);
      if (!account || !passwordMatches || !account.is_active) {
        const attempts = failure?.lockedUntil && Date.parse(failure.lockedUntil) <= Date.now() ? 1 : (failure?.attempts || 0) + 1;
        const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000).toISOString() : null;
        const now = new Date().toISOString();
        database.prepare(`INSERT INTO login_failures (login_id, attempts, locked_until, updated_at)
          VALUES (?, ?, ?, ?) ON CONFLICT(login_id) DO UPDATE SET attempts = excluded.attempts,
          locked_until = excluded.locked_until, updated_at = excluded.updated_at`)
          .run(normalizedLoginId, attempts, lockedUntil, now);
        recordAudit(database, {
          actorUserId: account?.id || null,
          actorEmail: normalizedLoginId,
          action: 'login_failed',
          module: 'auth',
          recordId: normalizedLoginId,
          summary: 'Login failed.',
          ipAddress: request.ip,
        });
        throw new HttpError(401, 'INVALID_CREDENTIALS', 'Login ID or password is incorrect.');
      }

      database.prepare('DELETE FROM login_failures WHERE login_id = ? COLLATE NOCASE').run(normalizedLoginId);
      const now = new Date().toISOString();
      database.prepare('UPDATE users SET last_login_at = ?, updated_at = ? WHERE id = ?').run(now, now, account.id);
      const user = userById(database, account.id);
      const tokens = createSession(user, request);
      recordAudit(database, {
        actorUserId: user.id,
        actorEmail: user.email,
        action: 'login',
        module: 'auth',
        recordId: user.id,
        summary: 'User signed in.',
        ipAddress: request.ip,
      });
      return { ...tokens, user: publicUser(user) };
    },

    refresh({ refreshToken }, request) {
      const tokenHash = refreshTokenHash(refreshToken);
      const current = database.prepare(`
        SELECT sessions.*, users.is_active
        FROM sessions JOIN users ON users.id = sessions.user_id
        WHERE sessions.refresh_token_hash = ? AND sessions.revoked_at IS NULL
      `).get(tokenHash);
      if (!current || !current.is_active || Date.parse(current.expires_at) <= Date.now()) {
        throw new HttpError(401, 'INVALID_REFRESH_TOKEN', 'The refresh token is invalid or expired.');
      }

      const user = userById(database, current.user_id);
      const tokens = database.transaction(() => {
        const nextTokens = createSession(user, request);
        const changed = database.prepare(`
          UPDATE sessions SET revoked_at = ?, replaced_by_session_id = (
            SELECT id FROM sessions WHERE user_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 1
          ) WHERE id = ? AND revoked_at IS NULL AND refresh_token_hash = ?
        `).run(new Date().toISOString(), user.id, current.id, tokenHash);
        if (changed.changes !== 1) throw new HttpError(401, 'INVALID_REFRESH_TOKEN', 'The refresh token has already been used.');
        return nextTokens;
      })();
      return { ...tokens, user: publicUser(user) };
    },

    logout(user, sessionId, request) {
      const now = new Date().toISOString();
      database.prepare('UPDATE sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL').run(now, sessionId);
      recordAudit(database, {
        actorUserId: user.id,
        actorEmail: user.email,
        action: 'logout',
        module: 'auth',
        recordId: sessionId,
        summary: 'User signed out.',
        ipAddress: request.ip,
      });
    },

    changePassword(user, sessionId, { currentPassword, newPassword }, request) {
      const account = database.prepare('SELECT password_hash FROM users WHERE id = ?').get(user.id);
      if (!bcrypt.compareSync(currentPassword, account.password_hash)) {
        throw new HttpError(400, 'CURRENT_PASSWORD_INVALID', 'The current password is incorrect.');
      }

      const passwordHash = bcrypt.hashSync(newPassword, 12);
      database.transaction(() => {
        database.prepare(`
          UPDATE users SET password_hash = ?, must_change_password = 0,
            token_version = token_version + 1, updated_at = ? WHERE id = ?
        `).run(passwordHash, new Date().toISOString(), user.id);
        database.prepare('UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL')
          .run(new Date().toISOString(), user.id);
      })();

      const refreshedUser = userById(database, user.id);
      const tokens = createSession(refreshedUser, request);
      recordAudit(database, {
        actorUserId: user.id,
        actorEmail: user.email,
        action: 'password_changed',
        module: 'auth',
        recordId: user.id,
        summary: 'User changed their password.',
        ipAddress: request.ip,
      });
      return { ...tokens, user: publicUser(refreshedUser) };
    },

    authenticate(accessToken) {
      let claims;
      try {
        claims = jwt.verify(accessToken, config.jwtSecret, {
          issuer: 'nu-lirc-server',
          audience: 'nu-lirc-client',
        });
      } catch {
        throw new HttpError(401, 'INVALID_ACCESS_TOKEN', 'The access token is invalid or expired.');
      }

      const user = userById(database, claims.sub);
      const session = database.prepare(`
        SELECT id FROM sessions
        WHERE id = ? AND user_id = ? AND revoked_at IS NULL AND expires_at > ?
      `).get(claims.sid, claims.sub, new Date().toISOString());
      if (!user || !session || !user.is_active || user.token_version !== claims.ver) {
        throw new HttpError(401, 'SESSION_REVOKED', 'This session is no longer active. Please sign in again.');
      }
      return { ...user, sessionId: claims.sid };
    },

    permissionsFor,
  };
}

export function createAuthMiddleware(authService, config) {
  const localDevelopmentUser = {
    id: null,
    email: 'local@localhost',
    display_name: 'Local Development User',
    role_id: 'role_super_admin',
    role_name: 'Local Development',
    system_key: 'local_development',
    is_active: 1,
    must_change_password: 0,
    token_version: 1,
    sessionId: 'local-development-session',
  };

  function requireAuth(request, _response, next) {
    if (config.authDisabled) {
      request.auth = localDevelopmentUser;
      return next();
    }

    const [scheme, token] = (request.get('authorization') || '').split(' ');
    if (scheme !== 'Bearer' || !token) {
      return next(new HttpError(401, 'AUTHENTICATION_REQUIRED', 'Sign in to access this resource.'));
    }
    try {
      request.auth = authService.authenticate(token);
      return next();
    } catch (error) {
      return next(error);
    }
  }

  function requirePasswordChanged(request, _response, next) {
    if (config.authDisabled) return next();
    if (request.auth?.must_change_password) {
      return next(new HttpError(403, 'PASSWORD_CHANGE_REQUIRED', 'Change the initial password before continuing.'));
    }
    return next();
  }

  function requirePermission(module, action) {
    return (request, _response, next) => {
      if (config.authDisabled) return next();
      if (request.auth?.system_key === 'super_admin') {
        return next(new HttpError(403, 'PERMISSION_DENIED', 'Super Admin access is limited to Users and Roles.'));
      }
      const permission = authService.permissionsFor(request.auth.role_id)
        .some(item => item.module === module && item.action === action);
      if (!permission) return next(new HttpError(403, 'PERMISSION_DENIED', 'Your role cannot perform this action.'));
      return next();
    };
  }

  function requireAnyPermission(permissions) {
    return (request, _response, next) => {
      if (config.authDisabled) return next();
      if (request.auth?.system_key === 'super_admin') {
        return next(new HttpError(403, 'PERMISSION_DENIED', 'Super Admin access is limited to Users and Roles.'));
      }
      const granted = authService.permissionsFor(request.auth.role_id);
      if (!permissions.some(required => granted.some(item => item.module === required.module && item.action === required.action))) {
        return next(new HttpError(403, 'PERMISSION_DENIED', 'Your role cannot perform this action.'));
      }
      return next();
    };
  }

  function requireSuperAdmin(request, _response, next) {
    if (config.authDisabled && request.auth?.system_key === 'local_development') return next();
    if (request.auth?.system_key !== 'super_admin') {
      return next(new HttpError(403, 'SUPER_ADMIN_REQUIRED', 'Only a Super Admin can perform this action.'));
    }
    return next();
  }

  return { requireAuth, requirePasswordChanged, requirePermission, requireAnyPermission, requireSuperAdmin };
}
