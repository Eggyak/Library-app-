import { randomBytes, randomUUID } from 'node:crypto';
import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { recordAudit } from '../audit.js';
import { MODULES } from '../db/seed.js';
import { HttpError, sendSuccess } from '../errors.js';

const actions = ['read', 'write', 'update', 'delete'];
const permissionsSchema = z.array(z.object({
  module: z.enum(MODULES),
  action: z.enum(actions),
  allowed: z.boolean(),
}).strict()).refine(items => {
  const keys = new Set(items.map(item => `${item.module}:${item.action}`));
  return keys.size === MODULES.length * actions.length;
}, 'Every module/action permission must be provided exactly once.');

const roleSchema = z.object({ name: z.string().trim().min(2).max(80), permissions: permissionsSchema }).strict();
const userCreateSchema = z.object({
  loginId: z.string().trim().min(3).max(120).regex(/^[A-Za-z0-9._@+-]+$/),
  name: z.string().trim().min(1).max(120),
  roleId: z.string().min(1).max(100),
  password: z.string().min(12).max(200),
  isActive: z.boolean().default(true),
}).strict();
const userUpdateSchema = z.object({
  loginId: z.string().trim().min(3).max(120).regex(/^[A-Za-z0-9._@+-]+$/).optional(),
  name: z.string().trim().min(1).max(120).optional(),
  roleId: z.string().min(1).max(100).optional(),
  isActive: z.boolean().optional(),
}).strict().refine(body => Object.keys(body).length > 0, 'At least one field is required.');

function roleWithPermissions(database, roleId) {
  const role = database.prepare(`
    SELECT id, name, system_key AS systemKey, is_system AS isSystem,
      created_at AS createdAt, updated_at AS updatedAt
    FROM roles WHERE id = ?
  `).get(roleId);
  if (!role) throw new HttpError(404, 'ROLE_NOT_FOUND', 'Role not found.');
  role.isSystem = Boolean(role.isSystem);
  role.permissions = database.prepare(`
    SELECT module, action, allowed FROM role_permissions
    WHERE role_id = ? ORDER BY module, action
  `).all(roleId).map(item => ({ ...item, allowed: Boolean(item.allowed) }));
  return role;
}

function userWithRole(database, userId) {
  const user = database.prepare(`
    SELECT users.id, users.login_id AS loginId, users.login_id AS email, users.display_name AS name, users.role_id AS roleId,
      roles.name AS roleName, roles.system_key AS roleKey,
      users.is_active AS isActive, users.must_change_password AS mustChangePassword,
      users.created_at AS createdAt, users.updated_at AS updatedAt,
      users.last_login_at AS lastLoginAt
    FROM users JOIN roles ON roles.id = users.role_id WHERE users.id = ?
  `).get(userId);
  if (user) {
    user.isActive = Boolean(user.isActive);
    user.mustChangePassword = Boolean(user.mustChangePassword);
  }
  return user;
}

function parse(schema, request) {
  return schema.parse(request.body);
}

function createTemporaryPassword() {
  return `${randomBytes(18).toString('base64url')}!aA7`;
}

export function createManagementRouter(database, config, middleware) {
  const router = express.Router();
  const adminOnly = [middleware.requireAuth, middleware.requirePasswordChanged, middleware.requireSuperAdmin];

  router.get('/modules', ...adminOnly, (_request, response) => sendSuccess(response, {
    modules: MODULES,
    actions,
  }));

  router.get('/roles', ...adminOnly, (_request, response) => {
    const roles = database.prepare(`
      SELECT roles.id, roles.name, roles.system_key AS systemKey,
        roles.is_system AS isSystem, COUNT(users.id) AS assignedUsers
      FROM roles LEFT JOIN users ON users.role_id = roles.id
      GROUP BY roles.id ORDER BY roles.is_system DESC, roles.name COLLATE NOCASE
    `).all().map(role => ({ ...role, isSystem: Boolean(role.isSystem) }));
    return sendSuccess(response, roles);
  });

  router.get('/roles/:roleId', ...adminOnly, (request, response) => {
    return sendSuccess(response, roleWithPermissions(database, request.params.roleId));
  });

  router.post('/roles', ...adminOnly, (request, response, next) => {
    try {
      const body = parse(roleSchema, request);
      const now = new Date().toISOString();
      const id = `role_${randomUUID()}`;
      const create = database.transaction(() => {
        database.prepare('INSERT INTO roles (id, name, is_system, created_at, updated_at) VALUES (?, ?, 0, ?, ?)')
          .run(id, body.name, now, now);
        const insertPermission = database.prepare('INSERT INTO role_permissions (role_id, module, action, allowed) VALUES (?, ?, ?, ?)');
        for (const permission of body.permissions) insertPermission.run(id, permission.module, permission.action, Number(permission.allowed));
        recordAudit(database, {
          actorUserId: request.auth.id,
          actorEmail: request.auth.email,
          action: 'create',
          module: 'roles',
          recordId: id,
          summary: `Created role '${body.name}'.`,
          ipAddress: request.ip,
          after: { name: body.name, permissions: body.permissions },
        });
      });
      create();
      return sendSuccess(response, roleWithPermissions(database, id), 201);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return next(new HttpError(409, 'ROLE_NAME_EXISTS', 'A role with this name already exists.'));
      return next(error);
    }
  });

  router.post('/roles/:roleId/clone', ...adminOnly, (request, response, next) => {
    try {
      const source = roleWithPermissions(database, request.params.roleId);
      const body = z.object({ name: z.string().trim().min(2).max(80) }).strict().parse(request.body);
      const now = new Date().toISOString();
      const id = `role_${randomUUID()}`;
      database.transaction(() => {
        database.prepare('INSERT INTO roles (id, name, is_system, created_at, updated_at) VALUES (?, ?, 0, ?, ?)')
          .run(id, body.name, now, now);
        const insertPermission = database.prepare('INSERT INTO role_permissions (role_id, module, action, allowed) VALUES (?, ?, ?, ?)');
        for (const permission of source.permissions) insertPermission.run(id, permission.module, permission.action, Number(permission.allowed));
        recordAudit(database, {
          actorUserId: request.auth.id,
          actorEmail: request.auth.email,
          action: 'clone',
          module: 'roles',
          recordId: id,
          summary: `Cloned role '${source.name}' as '${body.name}'.`,
          ipAddress: request.ip,
          before: { sourceRoleId: source.id },
          after: { name: body.name, permissions: source.permissions },
        });
      })();
      return sendSuccess(response, roleWithPermissions(database, id), 201);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return next(new HttpError(409, 'ROLE_NAME_EXISTS', 'A role with this name already exists.'));
      return next(error);
    }
  });

  router.put('/roles/:roleId', ...adminOnly, (request, response, next) => {
    try {
      const body = parse(roleSchema, request);
      const before = roleWithPermissions(database, request.params.roleId);
      if (before.isSystem) throw new HttpError(400, 'SYSTEM_ROLE_IMMUTABLE', 'System roles cannot be edited.');
      const now = new Date().toISOString();
      database.transaction(() => {
        database.prepare('UPDATE roles SET name = ?, updated_at = ? WHERE id = ?').run(body.name, now, before.id);
        database.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(before.id);
        const insertPermission = database.prepare('INSERT INTO role_permissions (role_id, module, action, allowed) VALUES (?, ?, ?, ?)');
        for (const permission of body.permissions) insertPermission.run(before.id, permission.module, permission.action, Number(permission.allowed));
        recordAudit(database, {
          actorUserId: request.auth.id,
          actorEmail: request.auth.email,
          action: 'update',
          module: 'roles',
          recordId: before.id,
          summary: `Updated role '${before.name}'.`,
          ipAddress: request.ip,
          before,
          after: { name: body.name, permissions: body.permissions },
        });
      })();
      return sendSuccess(response, roleWithPermissions(database, before.id));
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return next(new HttpError(409, 'ROLE_NAME_EXISTS', 'A role with this name already exists.'));
      return next(error);
    }
  });

  router.post('/roles/:roleId/reassign', ...adminOnly, (request, response, next) => {
    try {
      const body = z.object({ targetRoleId: z.string().min(1).max(100) }).strict().parse(request.body);
      const source = roleWithPermissions(database, request.params.roleId);
      const target = database.prepare('SELECT id, name, system_key FROM roles WHERE id = ?').get(body.targetRoleId);
      if (source.isSystem) throw new HttpError(400, 'SYSTEM_ROLE_IMMUTABLE', 'System roles cannot be reassigned or deleted.');
      if (!target || target.id === source.id || target.system_key === 'super_admin') throw new HttpError(400, 'INVALID_TARGET_ROLE', 'Choose another management role.');
      const users = database.prepare('SELECT id, login_id FROM users WHERE role_id = ?').all(source.id);
      database.transaction(() => {
        database.prepare('UPDATE users SET role_id = ?, token_version = token_version + 1, updated_at = ? WHERE role_id = ?')
          .run(target.id, new Date().toISOString(), source.id);
        for (const user of users) recordAudit(database, {
          actorUserId: request.auth.id, actorEmail: request.auth.email, action: 'role_reassigned',
          module: 'user_management', recordId: user.id, summary: `Reassigned '${user.login_id}' from '${source.name}' to '${target.name}'.`,
          ipAddress: request.ip, before: { roleId: source.id }, after: { roleId: target.id },
        });
      })();
      return sendSuccess(response, { reassigned: users.length, roleId: target.id, roleName: target.name });
    } catch (error) { return next(error); }
  });

  router.delete('/roles/:roleId', ...adminOnly, (request, response, next) => {
    try {
      const role = roleWithPermissions(database, request.params.roleId);
      if (role.isSystem) throw new HttpError(400, 'SYSTEM_ROLE_IMMUTABLE', 'System roles cannot be deleted.');
      const assignedUsers = database.prepare('SELECT COUNT(*) AS count FROM users WHERE role_id = ?').get(role.id).count;
      if (assignedUsers > 0) throw new HttpError(409, 'ROLE_IN_USE', 'Reassign users before deleting this role.');
      database.transaction(() => {
        database.prepare('DELETE FROM roles WHERE id = ?').run(role.id);
        recordAudit(database, {
          actorUserId: request.auth.id,
          actorEmail: request.auth.email,
          action: 'delete',
          module: 'roles',
          recordId: role.id,
          summary: `Deleted role '${role.name}'.`,
          ipAddress: request.ip,
          before: role,
        });
      })();
      return sendSuccess(response, { deleted: true });
    } catch (error) {
      return next(error);
    }
  });

  router.get('/users', ...adminOnly, (request, response, next) => {
    try {
      const query = z.object({
        page: z.coerce.number().int().min(1).default(1),
        pageSize: z.coerce.number().int().min(1).max(100).default(25),
        query: z.string().trim().max(120).optional(),
        roleId: z.string().max(100).optional(),
        active: z.enum(['true', 'false']).optional(),
      }).strict().parse(request.query);
      const clauses = [];
      const values = [];
      if (query.query) {
        clauses.push('(users.login_id LIKE ? OR users.display_name LIKE ?)');
        values.push(`%${query.query}%`, `%${query.query}%`);
      }
      if (query.roleId) { clauses.push('users.role_id = ?'); values.push(query.roleId); }
      if (query.active) { clauses.push('users.is_active = ?'); values.push(query.active === 'true' ? 1 : 0); }
      const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
      const total = database.prepare(`SELECT COUNT(*) AS count FROM users ${where}`).get(...values).count;
      const rows = database.prepare(`
        SELECT users.id, users.login_id AS loginId, users.login_id AS email, users.display_name AS name, users.role_id AS roleId,
          roles.name AS roleName, roles.system_key AS roleKey, users.is_active AS isActive,
          users.must_change_password AS mustChangePassword, users.created_at AS createdAt,
          users.updated_at AS updatedAt, users.last_login_at AS lastLoginAt
        FROM users JOIN roles ON roles.id = users.role_id ${where}
        ORDER BY users.created_at DESC LIMIT ? OFFSET ?
      `).all(...values, query.pageSize, (query.page - 1) * query.pageSize)
        .map(user => ({ ...user, isActive: Boolean(user.isActive), mustChangePassword: Boolean(user.mustChangePassword) }));
      return sendSuccess(response, {
        items: rows,
        pagination: { page: query.page, pageSize: query.pageSize, total, pageCount: Math.ceil(total / query.pageSize) },
      });
    } catch (error) {
      return next(error);
    }
  });

  router.post('/users', ...adminOnly, (request, response, next) => {
    try {
      const body = parse(userCreateSchema, request);
      const role = database.prepare('SELECT id, name, system_key FROM roles WHERE id = ?').get(body.roleId);
      if (!role) throw new HttpError(400, 'ROLE_NOT_FOUND', 'Selected role does not exist.');
      if (role.system_key === 'super_admin') throw new HttpError(400, 'SUPER_ADMIN_CREATION_FORBIDDEN', 'Use the configured bootstrap account for Super Admin access.');

      const id = `usr_${randomUUID()}`;
      const now = new Date().toISOString();
      database.transaction(() => {
        database.prepare(`
          INSERT INTO users (id, email, login_id, display_name, password_hash, role_id, is_active, must_change_password, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        `).run(id, body.loginId, body.loginId, body.name, bcrypt.hashSync(body.password, 12), role.id, Number(body.isActive), now, now);
        recordAudit(database, {
          actorUserId: request.auth.id,
          actorEmail: request.auth.email,
          action: 'create',
          module: 'user_management',
          recordId: id,
          summary: `Created user '${body.name}' with role '${role.name}'.`,
          ipAddress: request.ip,
          after: { id, loginId: body.loginId, name: body.name, roleId: role.id, isActive: body.isActive },
        });
      })();
      return sendSuccess(response, { user: userWithRole(database, id) }, 201);
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return next(new HttpError(409, 'LOGIN_ID_ALREADY_EXISTS', 'That Login ID is already in use.'));
      return next(error);
    }
  });

  router.put('/users/:userId', ...adminOnly, (request, response, next) => {
    try {
      const body = parse(userUpdateSchema, request);
      const before = userWithRole(database, request.params.userId);
      if (!before) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found.');
      const targetIsSuperAdmin = before.roleKey === 'super_admin';
      if (targetIsSuperAdmin) throw new HttpError(400, 'SUPER_ADMIN_PROTECTED', 'Super Admin accounts cannot be modified here.');
      if (body.roleId) {
        const roleExists = database.prepare('SELECT id, system_key FROM roles WHERE id = ?').get(body.roleId);
        if (!roleExists) throw new HttpError(400, 'ROLE_NOT_FOUND', 'Selected role does not exist.');
        if (roleExists.system_key === 'super_admin') {
          throw new HttpError(400, 'SUPER_ADMIN_ASSIGNMENT_FORBIDDEN', 'Super Admin access cannot be assigned here.');
        }
      }
      const nextLoginId = body.loginId;
      const now = new Date().toISOString();
      database.transaction(() => {
        database.prepare(`
          UPDATE users SET email = COALESCE(?, email), login_id = COALESCE(?, login_id), display_name = COALESCE(?, display_name),
            role_id = COALESCE(?, role_id), is_active = COALESCE(?, is_active),
            token_version = token_version + 1, updated_at = ? WHERE id = ?
        `).run(nextLoginId || null, nextLoginId || null, body.name || null, body.roleId || null,
          body.isActive === undefined ? null : Number(body.isActive), now, before.id);
        database.prepare('UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL')
          .run(now, before.id);
        recordAudit(database, {
          actorUserId: request.auth.id,
          actorEmail: request.auth.email,
          action: body.isActive === false ? 'suspend' : body.isActive === true ? 'activate' : 'update',
          module: 'user_management',
          recordId: before.id,
          summary: `Updated user '${before.name}'. Existing sessions were revoked.`,
          ipAddress: request.ip,
          before,
          after: { ...before, ...body, loginId: nextLoginId || before.loginId },
        });
      })();
      return sendSuccess(response, userWithRole(database, before.id));
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return next(new HttpError(409, 'LOGIN_ID_ALREADY_EXISTS', 'That Login ID is already in use.'));
      return next(error);
    }
  });

  router.post('/users/:userId/reset-password', ...adminOnly, (request, response, next) => {
    try {
      z.object({}).strict().parse(request.body || {});
      const user = userWithRole(database, request.params.userId);
      if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found.');
      if (user.roleKey === 'super_admin') throw new HttpError(400, 'SUPER_ADMIN_RESET_FORBIDDEN', 'Reset the Super Admin password through its signed-in account.');
      const temporaryPassword = createTemporaryPassword();
      const now = new Date().toISOString();
      database.transaction(() => {
        database.prepare(`
          UPDATE users SET password_hash = ?, must_change_password = 1,
            token_version = token_version + 1, updated_at = ? WHERE id = ?
        `).run(bcrypt.hashSync(temporaryPassword, 12), now, user.id);
        database.prepare('UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').run(now, user.id);
        recordAudit(database, {
          actorUserId: request.auth.id,
          actorEmail: request.auth.email,
          action: 'password_reset',
          module: 'user_management',
          recordId: user.id,
          summary: `Reset password for '${user.name}' and revoked active sessions.`,
          ipAddress: request.ip,
          before: { mustChangePassword: user.mustChangePassword },
          after: { mustChangePassword: true },
        });
      })();
      return sendSuccess(response, { temporaryPassword, user: userWithRole(database, user.id) });
    } catch (error) {
      return next(error);
    }
  });

  router.delete('/users/:userId', ...adminOnly, (request, response, next) => {
    try {
      const user = userWithRole(database, request.params.userId);
      if (!user) throw new HttpError(404, 'USER_NOT_FOUND', 'User not found.');
      if (user.roleKey === 'super_admin') {
        const activeAdmins = database.prepare(`
          SELECT COUNT(*) AS count FROM users JOIN roles ON roles.id = users.role_id
          WHERE roles.system_key = 'super_admin' AND users.is_active = 1
        `).get().count;
        if (activeAdmins <= 1) throw new HttpError(400, 'LAST_SUPER_ADMIN', 'At least one active Super Admin must remain.');
        throw new HttpError(400, 'SUPER_ADMIN_PROTECTED', 'Super Admin accounts cannot be removed here.');
      }
      database.transaction(() => {
        database.prepare('DELETE FROM users WHERE id = ?').run(user.id);
        recordAudit(database, {
          actorUserId: request.auth.id,
          actorEmail: request.auth.email,
          action: 'delete',
          module: 'user_management',
          recordId: user.id,
          summary: `Removed user '${user.name}'.`,
          ipAddress: request.ip,
          before: user,
        });
      })();
      return sendSuccess(response, { deleted: true });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}
