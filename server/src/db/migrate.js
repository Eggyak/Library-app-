import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { applyMigrations, openDatabase } from './database.js';
import { seedDatabase } from './seed.js';

const serverDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
dotenv.config({ path: path.join(serverDirectory, '.env') });
const configuredPath = process.env.DATABASE_PATH || './data/library.sqlite';
const databasePath = path.isAbsolute(configuredPath) ? configuredPath : path.resolve(serverDirectory, configuredPath);
const database = openDatabase(databasePath);

try {
  applyMigrations(database);
  const adminId = seedDatabase(database, {
    loginId: process.env.SUPER_ADMIN_LOGIN_ID || '',
    password: process.env.SUPER_ADMIN_PASSWORD || '',
  });
  console.log('Database migrations are current.');
  console.log(adminId ? 'Super Admin is seeded.' : 'Super Admin not seeded; set SUPER_ADMIN_LOGIN_ID and SUPER_ADMIN_PASSWORD before production use.');
} finally {
  database.close();
}
