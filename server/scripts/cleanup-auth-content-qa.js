import fs from 'node:fs';
import path from 'node:path';
import { loadConfig } from '../src/config.js';
import { openDatabase } from '../src/db/database.js';
import { uploadDirectory } from '../src/uploads.js';

const config = loadConfig();
const database = openDatabase(config.databasePath);
const uploadedFiles = database.prepare("SELECT clipping_files.stored_name AS storedName FROM clipping_files JOIN clippings ON clippings.id = clipping_files.clipping_id WHERE clippings.title = 'API acceptance clipping'").all();

database.transaction(() => {
  database.prepare("DELETE FROM room_requests WHERE purpose LIKE 'QA anonymous request %'").run();
  database.prepare("DELETE FROM rooms WHERE name = 'QA Room'").run();

  const qaUsers = database.prepare("SELECT id FROM users WHERE login_id IN ('clip01', 'librarianqa')").all();
  for (const user of qaUsers) {
    database.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);
    database.prepare('DELETE FROM users WHERE id = ?').run(user.id);
  }
  database.prepare("DELETE FROM login_failures WHERE login_id IN ('clip01', 'librarianqa')").run();

  const qaRoles = database.prepare("SELECT id FROM roles WHERE name IN ('Clippings Editor', 'Librarian QA', 'Reassign QA')").all();
  for (const role of qaRoles) {
    database.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(role.id);
    database.prepare('DELETE FROM roles WHERE id = ?').run(role.id);
  }

  const clippingRows = database.prepare("SELECT id FROM clippings WHERE title = 'API acceptance clipping'").all();
  for (const clipping of clippingRows) {
    database.prepare('DELETE FROM clipping_files WHERE clipping_id = ?').run(clipping.id);
    database.prepare('DELETE FROM clippings WHERE id = ?').run(clipping.id);
  }
})();

for (const file of uploadedFiles) {
  fs.rmSync(path.join(uploadDirectory, path.basename(file.storedName)), { force: true });
}

database.close();
console.log('Acceptance QA records removed; audit log entries retained.');
