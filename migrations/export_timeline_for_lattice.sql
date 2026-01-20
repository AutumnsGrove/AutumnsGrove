-- =============================================================================
-- Export Timeline Summaries for Lattice Migration
-- =============================================================================
-- Run this against AutumnsGrove's git-stats D1 to export timeline data,
-- then run the output against Lattice's D1.
--
-- Usage:
--   1. Export from AutumnsGrove:
--      wrangler d1 execute autumnsgrove-git-stats --file=migrations/export_timeline_for_lattice.sql
--
--   2. The output will be INSERT statements for Lattice
--
-- Note: This generates INSERT statements. Copy the output and run against Lattice D1.
-- =============================================================================

-- Export daily summaries as INSERT statements for Lattice's timeline_summaries table
SELECT
    'INSERT INTO timeline_summaries (id, tenant_id, summary_date, brief_summary, detailed_timeline, gutter_content, commit_count, repos_active, total_additions, total_deletions, ai_model, is_rest_day, rest_day_message, context_brief, detected_focus, continuation_of, focus_streak, created_at) VALUES (' ||
    '''' || 'autumn-summary-' || id || ''', ' ||
    '''tenant_autumn'', ' ||
    '''' || summary_date || ''', ' ||
    '''' || REPLACE(COALESCE(brief_summary, ''), '''', '''''') || ''', ' ||
    '''' || REPLACE(COALESCE(detailed_timeline, ''), '''', '''''') || ''', ' ||
    '''' || REPLACE(COALESCE(gutter_content, '[]'), '''', '''''') || ''', ' ||
    COALESCE(commit_count, 0) || ', ' ||
    '''' || REPLACE(COALESCE(repos_active, '[]'), '''', '''''') || ''', ' ||
    COALESCE(total_additions, 0) || ', ' ||
    COALESCE(total_deletions, 0) || ', ' ||
    '''' || COALESCE(ai_model, '') || ''', ' ||
    '0, ' ||  -- is_rest_day (we don't have this in old schema)
    'NULL, ' ||  -- rest_day_message
    '''' || REPLACE(COALESCE(context_brief, ''), '''', '''''') || ''', ' ||
    '''' || REPLACE(COALESCE(detected_focus, ''), '''', '''''') || ''', ' ||
    CASE WHEN continuation_of IS NULL THEN 'NULL' ELSE '''' || continuation_of || '''' END || ', ' ||
    COALESCE(focus_streak, 0) || ', ' ||
    'unixepoch()' ||
    ') ON CONFLICT(tenant_id, summary_date) DO NOTHING;' AS sql_statement
FROM daily_summaries
ORDER BY summary_date DESC;

-- Also export activity data for the heatmap
SELECT
    'INSERT INTO timeline_activity (tenant_id, activity_date, commit_count, repos_active, lines_added, lines_deleted, activity_level, created_at) VALUES (' ||
    '''tenant_autumn'', ' ||
    '''' || summary_date || ''', ' ||
    COALESCE(commit_count, 0) || ', ' ||
    '''' || REPLACE(COALESCE(repos_active, '[]'), '''', '''''') || ''', ' ||
    COALESCE(total_additions, 0) || ', ' ||
    COALESCE(total_deletions, 0) || ', ' ||
    CASE
        WHEN commit_count = 0 THEN 0
        WHEN commit_count <= 3 THEN 1
        WHEN commit_count <= 7 THEN 2
        WHEN commit_count <= 12 THEN 3
        ELSE 4
    END || ', ' ||
    'unixepoch()' ||
    ') ON CONFLICT(tenant_id, activity_date) DO NOTHING;' AS sql_statement
FROM daily_summaries
WHERE commit_count > 0
ORDER BY summary_date DESC;
