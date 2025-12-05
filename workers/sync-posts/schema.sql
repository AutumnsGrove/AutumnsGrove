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
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  gutter_content TEXT DEFAULT '[]',  -- JSON array for gutter items (comments, photos, galleries)
  font TEXT DEFAULT 'default'        -- Post-specific font override
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_posts_date ON posts(date);
CREATE INDEX IF NOT EXISTS idx_posts_title ON posts(title);
CREATE INDEX IF NOT EXISTS idx_posts_last_synced ON posts(last_synced);

-- Table for storing site pages (Home, About, Contact, etc.)
CREATE TABLE IF NOT EXISTS pages (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'page',
  markdown_content TEXT NOT NULL,
  html_content TEXT,
  hero TEXT,                      -- JSON object for hero section
  gutter_content TEXT DEFAULT '[]', -- JSON array for gutter items
  font TEXT DEFAULT 'default',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick lookups by type
CREATE INDEX IF NOT EXISTS idx_pages_type ON pages(type);

-- Index for ordering by update time
CREATE INDEX IF NOT EXISTS idx_pages_updated ON pages(updated_at DESC);

-- Table for storing recipes (mirrors posts structure with url field)
CREATE TABLE IF NOT EXISTS recipes (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  tags TEXT,
  description TEXT,
  url TEXT,                          -- External recipe source URL
  markdown_content TEXT NOT NULL,
  html_content TEXT,
  file_hash TEXT NOT NULL,
  last_synced TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_recipes_date ON recipes(date DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_title ON recipes(title);
CREATE INDEX IF NOT EXISTS idx_recipes_last_synced ON recipes(last_synced);
