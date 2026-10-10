ALTER TABLE users ADD COLUMN login_id TEXT;
UPDATE users SET login_id = email WHERE login_id IS NULL;
CREATE UNIQUE INDEX users_login_id_unique ON users(login_id COLLATE NOCASE);

CREATE TABLE login_failures (
  login_id TEXT PRIMARY KEY COLLATE NOCASE,
  attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT,
  updated_at TEXT NOT NULL
);

ALTER TABLE room_requests ADD COLUMN device_id TEXT;
ALTER TABLE book_requests ADD COLUMN device_id TEXT;
CREATE INDEX room_requests_device_history ON room_requests(device_id, created_at DESC);
CREATE INDEX book_requests_device_history ON book_requests(device_id, created_at DESC);

DELETE FROM users WHERE role_id IN (SELECT id FROM roles WHERE system_key = 'student');
DELETE FROM roles WHERE system_key = 'student';
