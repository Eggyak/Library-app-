import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';

export const MODULES = [
  'dashboard', 'books', 'new_arrivals', 'clippings', 'general_info', 'e_resources',
  'discussion_rooms', 'book_requests', 'audit_log', 'user_management', 'roles',
];

const ACTIONS = ['read', 'write', 'update', 'delete'];

function permissionsFor(systemKey) {
  if (systemKey === 'super_admin') {
    return MODULES.flatMap(module => ACTIONS.map(action => ({
      module,
      action,
      allowed: ['user_management', 'roles'].includes(module),
    })));
  }

  return MODULES.flatMap(module => ACTIONS.map(action => ({
    module,
    action,
    allowed: ['dashboard', 'books', 'clippings', 'general_info', 'e_resources', 'discussion_rooms', 'book_requests'].includes(module)
      && (action === 'read' || ['write', 'update'].includes(action)),
  })));
}

export function seedRoles(database) {
  const now = new Date().toISOString();
  const defaults = [
    { key: 'super_admin', name: 'Super Admin', isSystem: true },
    { key: 'staff', name: 'Librarian', isSystem: false },
  ];

  const insertRole = database.prepare(`
    INSERT OR IGNORE INTO roles (id, name, system_key, is_system, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const getRole = database.prepare('SELECT id FROM roles WHERE system_key = ?');
  const insertPermission = database.prepare(`
    INSERT OR IGNORE INTO role_permissions (role_id, module, action, allowed)
    VALUES (?, ?, ?, ?)
  `);

  database.transaction(() => {
    for (const role of defaults) {
      insertRole.run(`role_${role.key}`, role.name, role.key, Number(role.isSystem), now, now);
      const { id } = getRole.get(role.key);
      for (const permission of permissionsFor(role.key)) {
        insertPermission.run(id, permission.module, permission.action, Number(permission.allowed));
      }
    }
  })();
}

export function seedSuperAdmin(database, { loginId, password, displayName = 'Super Admin' }) {
  if (!loginId || !password) return null;
  const normalizedLoginId = loginId.trim();
  if (!/^[A-Za-z0-9._@+-]{3,120}$/.test(normalizedLoginId)) {
    throw new Error('SUPER_ADMIN_LOGIN_ID must be 3 to 120 letters, digits, dots, underscores, @ or hyphens.');
  }
  if (password.length < 12) {
    throw new Error('SUPER_ADMIN_PASSWORD must be at least 12 characters.');
  }

  const existing = database.prepare('SELECT id FROM users WHERE login_id = ? COLLATE NOCASE').get(normalizedLoginId);
  if (existing) return existing.id;

  const role = database.prepare("SELECT id FROM roles WHERE system_key = 'super_admin'").get();
  const priorBootstrap = database.prepare("SELECT id FROM users WHERE role_id = ? ORDER BY created_at LIMIT 1").get(role.id);
  const now = new Date().toISOString();
  const passwordHash = bcrypt.hashSync(password, 12);
  if (priorBootstrap) {
    database.prepare(`UPDATE users SET email = ?, login_id = ?, password_hash = ?, display_name = ?,
      is_active = 1, must_change_password = 1, token_version = token_version + 1, updated_at = ? WHERE id = ?`)
      .run(normalizedLoginId, normalizedLoginId, passwordHash, displayName, now, priorBootstrap.id);
    return priorBootstrap.id;
  }
  const id = `usr_${randomUUID()}`;
  database.prepare(`
    INSERT INTO users (id, email, login_id, display_name, password_hash, role_id, must_change_password, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).run(id, normalizedLoginId, normalizedLoginId, displayName, passwordHash, role.id, now, now);
  return id;
}

export function seedDatabase(database, superAdmin) {
  seedRoles(database);
  return seedSuperAdmin(database, superAdmin);
}
