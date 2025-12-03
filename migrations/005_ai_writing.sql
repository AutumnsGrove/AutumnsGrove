-- Migration 005: AI Writing Assistant
-- Created: December 3, 2025
-- Purpose: Track AI writing assistant usage for grammar, tone, and readability analysis

-- AI Writing Requests table
CREATE TABLE IF NOT EXISTS ai_writing_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,                              -- User email who made the request
    action TEXT NOT NULL,                      -- 'grammar', 'tone', 'readability', 'all'
    model TEXT NOT NULL,                       -- Full model ID used
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    cost REAL DEFAULT 0,                       -- Estimated cost in USD
    post_slug TEXT,                            -- Optional: which post was analyzed
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Index for rate limiting queries (user + date)
CREATE INDEX IF NOT EXISTS idx_ai_writing_user_date ON ai_writing_requests(user_id, created_at DESC);

-- Index for date-based queries (usage stats)
CREATE INDEX IF NOT EXISTS idx_ai_writing_created ON ai_writing_requests(created_at DESC);
