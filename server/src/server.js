import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { applyMigrations, openDatabase } from './db/database.js';
import { seedDatabase } from './db/seed.js';

const config = loadConfig();

const database = openDatabase(config.databasePath);
applyMigrations(database);

seedDatabase(database, {
  loginId: config.superAdminLoginId,
  password: config.superAdminPassword,
});

const hasActiveSuperAdmin = database.prepare(`
  SELECT 1 FROM users JOIN roles ON roles.id = users.role_id
  WHERE roles.system_key = 'super_admin' AND users.is_active = 1 LIMIT 1
`).get();
if (!config.authDisabled && !hasActiveSuperAdmin) {
  throw new Error('No Super Admin exists. Set SUPER_ADMIN_LOGIN_ID and SUPER_ADMIN_PASSWORD in server/.env.');
}

const app = createApp({ database, config });
const host = config.authDisabled ? '127.0.0.1' : '0.0.0.0';
const server = app.listen(config.port, host, () => {
  if (config.authDisabled) {
    console.warn('WARNING: API authentication is disabled. This server is available only on this PC.');
  }
  console.log(`NU LIRC API listening on http://${host}:${config.port}`);
  console.log(`Health: http://localhost:${config.port}/api/v1/health`);
  console.log(`API docs: http://localhost:${config.port}/api/docs`);
});

function shutdown(signal) {
  console.log(`${signal} received; closing server.`);
  server.close(() => {
    database.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
