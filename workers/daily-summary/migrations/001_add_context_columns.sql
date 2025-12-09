-- Migration: Add context tracking columns to daily_summaries
-- Purpose: Enable long-horizon context for multi-day task awareness
-- Date: 2025-12-08

-- Add context brief column (JSON string with condensed summary data)
ALTER TABLE daily_summaries ADD COLUMN context_brief TEXT;

-- Add detected focus column (JSON string: {"task": "security work", "repos": [], "keywords": []})
ALTER TABLE daily_summaries ADD COLUMN detected_focus TEXT;

-- Add continuation_of column (date string linking to start of multi-day task)
ALTER TABLE daily_summaries ADD COLUMN continuation_of TEXT;

-- Add focus streak counter (number of consecutive days on same task)
ALTER TABLE daily_summaries ADD COLUMN focus_streak INTEGER DEFAULT 0;

-- Index for efficient context lookups (by date, descending)
CREATE INDEX IF NOT EXISTS idx_summaries_context_lookup
ON daily_summaries(summary_date DESC, context_brief);
