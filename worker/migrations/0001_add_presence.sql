-- Add presence table for live player tracking
CREATE TABLE IF NOT EXISTS presence (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT DEFAULT '🐍',
  score INTEGER DEFAULT 0,
  last_seen INTEGER NOT NULL
);

-- Index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_presence_last_seen ON presence(last_seen);
