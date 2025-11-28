-- D1 Schema for Git Stats Historical Data
-- Database: autumnsgrove-git-stats

-- Track repositories being monitored
CREATE TABLE IF NOT EXISTS repositories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner TEXT NOT NULL,
    name TEXT NOT NULL,
    full_name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(owner, name)
);

-- Store daily snapshots of repository stats
CREATE TABLE IF NOT EXISTS repo_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_id INTEGER NOT NULL,
    snapshot_date TEXT NOT NULL,
    total_commits INTEGER DEFAULT 0,
    total_additions INTEGER DEFAULT 0,
    total_deletions INTEGER DEFAULT 0,
    open_issues INTEGER DEFAULT 0,
    stars INTEGER DEFAULT 0,
    forks INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (repo_id) REFERENCES repositories(id),
    UNIQUE(repo_id, snapshot_date)
);

-- Store individual commits for history tracking
CREATE TABLE IF NOT EXISTS commits (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_id INTEGER NOT NULL,
    sha TEXT NOT NULL,
    message TEXT,
    author TEXT,
    committed_at TEXT NOT NULL,
    additions INTEGER DEFAULT 0,
    deletions INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (repo_id) REFERENCES repositories(id),
    UNIQUE(repo_id, sha)
);

-- Store TODO snapshots for progress tracking
CREATE TABLE IF NOT EXISTS todo_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_id INTEGER NOT NULL,
    snapshot_date TEXT NOT NULL,
    total_todos INTEGER DEFAULT 0,
    completed_todos INTEGER DEFAULT 0,
    code_todos INTEGER DEFAULT 0,
    markdown_todos INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (repo_id) REFERENCES repositories(id),
    UNIQUE(repo_id, snapshot_date)
);

-- Store AI analysis results
CREATE TABLE IF NOT EXISTS ai_analyses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_id INTEGER NOT NULL,
    analysis_date TEXT NOT NULL,
    health_score INTEGER,
    raw_analysis TEXT,
    input_tokens INTEGER DEFAULT 0,
    output_tokens INTEGER DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (repo_id) REFERENCES repositories(id)
);

-- Store commit activity by hour/day for heatmaps
CREATE TABLE IF NOT EXISTS commit_activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_id INTEGER NOT NULL,
    activity_date TEXT NOT NULL,
    hour INTEGER NOT NULL CHECK(hour >= 0 AND hour <= 23),
    day_of_week INTEGER NOT NULL CHECK(day_of_week >= 0 AND day_of_week <= 6),
    commit_count INTEGER DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (repo_id) REFERENCES repositories(id),
    UNIQUE(repo_id, activity_date, hour)
);

-- Store daily development summaries for timeline display
CREATE TABLE IF NOT EXISTS daily_summaries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    summary_date TEXT NOT NULL UNIQUE,       -- YYYY-MM-DD format
    brief_summary TEXT,                       -- 1-2 sentence overview (null for rest days)
    detailed_timeline TEXT,                   -- Full markdown breakdown
    gutter_content TEXT,                      -- JSON array of gutter items for side comments
    commit_count INTEGER DEFAULT 0,
    repos_active TEXT,                        -- JSON array of repo names
    total_additions INTEGER DEFAULT 0,
    total_deletions INTEGER DEFAULT 0,
    ai_model TEXT,                            -- Model used for generation
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_repo_snapshots_date ON repo_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_commits_committed_at ON commits(committed_at);
CREATE INDEX IF NOT EXISTS idx_commits_repo ON commits(repo_id);
CREATE INDEX IF NOT EXISTS idx_todo_snapshots_date ON todo_snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_commit_activity_date ON commit_activity(activity_date);
CREATE INDEX IF NOT EXISTS idx_daily_summaries_date ON daily_summaries(summary_date DESC);
