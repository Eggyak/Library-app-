CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE books (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT,
  publisher TEXT,
  publication_year INTEGER,
  description TEXT,
  cover_path TEXT,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  shelf_location TEXT,
  quantity_total INTEGER NOT NULL DEFAULT 0 CHECK (quantity_total >= 0),
  quantity_available INTEGER NOT NULL DEFAULT 0 CHECK (quantity_available >= 0 AND quantity_available <= quantity_total),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX books_title_search ON books(title COLLATE NOCASE);
CREATE INDEX books_author_search ON books(author COLLATE NOCASE);
CREATE INDEX books_category ON books(category_id);
CREATE UNIQUE INDEX books_isbn_unique ON books(isbn) WHERE isbn IS NOT NULL AND trim(isbn) <> '';

CREATE TABLE clippings (
  id TEXT PRIMARY KEY,
  title TEXT,
  clipping_date TEXT NOT NULL,
  topic TEXT NOT NULL,
  newspaper_name TEXT NOT NULL,
  notes TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX clippings_date_topic ON clippings(clipping_date DESC, topic COLLATE NOCASE);

CREATE TABLE clipping_files (
  id TEXT PRIMARY KEY,
  clipping_id TEXT NOT NULL REFERENCES clippings(id) ON DELETE CASCADE,
  original_name TEXT NOT NULL,
  stored_name TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp', 'application/pdf')),
  byte_size INTEGER NOT NULL CHECK (byte_size > 0),
  created_at TEXT NOT NULL
);

CREATE TABLE library_info (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  rules_markdown TEXT NOT NULL DEFAULT '',
  timings_json TEXT NOT NULL DEFAULT '[]',
  contact_json TEXT NOT NULL DEFAULT '{}',
  version INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE holidays (
  id TEXT PRIMARY KEY,
  holiday_date TEXT NOT NULL,
  name TEXT NOT NULL,
  is_closed INTEGER NOT NULL DEFAULT 1 CHECK (is_closed IN (0, 1)),
  special_opening TEXT,
  special_closing TEXT,
  notes TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX holidays_date ON holidays(holiday_date);

CREATE TABLE e_resource_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE e_resources (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  category_id TEXT REFERENCES e_resource_categories(id) ON DELETE SET NULL,
  requires_campus_network INTEGER NOT NULL DEFAULT 0 CHECK (requires_campus_network IN (0, 1)),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX e_resources_category ON e_resources(category_id);

CREATE TABLE announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  starts_at TEXT,
  ends_at TEXT,
  is_published INTEGER NOT NULL DEFAULT 0 CHECK (is_published IN (0, 1)),
  version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX announcements_public ON announcements(is_published, starts_at, ends_at);