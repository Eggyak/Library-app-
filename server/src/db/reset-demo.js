/**
 * Reset demo data script
 * Clears all library content and reseeds demo data
 */

import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = resolve(__dirname, '../data/library.db');
const uploadsPath = resolve(__dirname, '../uploads');

const db = new Database(dbPath);

console.log('Resetting demo data...');

// Disable foreign keys temporarily
db.exec('PRAGMA foreign_keys = OFF;');

// Clear all library content tables (but preserve users, roles, sessions, audit_log)
const tablesToClear = [
    'books',
    'book_categories',
    'clipping_files',
    'news_clippings',
    'general_info',
    'holidays',
    'e_resource_items',
    'e_resource_categories',
    'announcements',
    'discussion_rooms',
    'room_requests',
    'book_requests',
];

for (const table of tablesToClear) {
    try {
        db.prepare(`DELETE FROM ${table}`).run();
        console.log(`  Cleared ${table}`);
    } catch (e) {
        console.log(`  Skipped ${table} (${e.message})`);
    }
}

// Clear uploads folder
if (fs.existsSync(uploadsPath)) {
    fs.rmSync(uploadsPath, { recursive: true, force: true });
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log('  Cleared uploads folder');
}

// Re-enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

console.log('Demo data reset complete. Running demo seed...');
console.log('Seeding demo data...');
db.close();