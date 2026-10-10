CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE,
  capacity INTEGER NOT NULL CHECK (capacity > 0 AND capacity <= 1000),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE room_requests (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL,
  student_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  student_email TEXT NOT NULL COLLATE NOCASE,
  student_name TEXT NOT NULL,
  enrollment_no TEXT,
  room_id TEXT NOT NULL REFERENCES rooms(id),
  request_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  purpose TEXT NOT NULL,
  group_size INTEGER NOT NULL CHECK (group_size > 0 AND group_size <= 1000),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'cancelled')),
  remarks TEXT,
  override_reason TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (start_time < end_time)
);

CREATE UNIQUE INDEX room_requests_user_idempotency ON room_requests(student_id, idempotency_key) WHERE student_id IS NOT NULL;
CREATE UNIQUE INDEX room_requests_guest_idempotency ON room_requests(student_email, idempotency_key) WHERE student_id IS NULL;
CREATE INDEX room_requests_student_history ON room_requests(student_id, created_at DESC);
CREATE INDEX room_requests_room_slot ON room_requests(room_id, request_date, start_time, end_time, status);

CREATE TABLE book_requests (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL,
  student_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  student_email TEXT NOT NULL COLLATE NOCASE,
  student_name TEXT NOT NULL,
  enrollment_no TEXT,
  title TEXT NOT NULL,
  author TEXT,
  publisher TEXT,
  edition TEXT,
  reason TEXT NOT NULL,
  catalog_book_id TEXT REFERENCES books(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'done', 'rejected')),
  remarks TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX book_requests_user_idempotency ON book_requests(student_id, idempotency_key) WHERE student_id IS NOT NULL;
CREATE UNIQUE INDEX book_requests_guest_idempotency ON book_requests(student_email, idempotency_key) WHERE student_id IS NULL;
CREATE INDEX book_requests_student_history ON book_requests(student_id, created_at DESC);
CREATE INDEX book_requests_queue ON book_requests(status, created_at DESC);