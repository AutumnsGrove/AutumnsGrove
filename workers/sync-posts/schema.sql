-- D1 Schema for Blog Posts Storage
-- Database: autumnsgrove-posts

CREATE TABLE IF NOT EXISTS posts (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  tags TEXT,
  description TEXT,
  markdown_content TEXT NOT NULL,
  html_content TEXT,
  file_hash TEXT NOT NULL,
  last_synced TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(date);
CREATE INDEX IF NOT EXISTS idx_posts_title ON posts(title);
CREATE INDEX IF NOT EXISTS idx_posts_last_synced ON posts(last_synced);
