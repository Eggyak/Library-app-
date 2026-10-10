CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  rating INTEGER DEFAULT NULL CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5)),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'responded')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS feedback_user_id ON feedback(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS feedback_created_at ON feedback(created_at DESC);
