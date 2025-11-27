# Daily Summary System

Automated end-of-day development summary generation for all git repositories.

## Quick Start

At the end of your workday, simply run:

```bash
/daily-summary
```

This will automatically:
1. Scan all git repos in `/Users/mini/Documents/Projects`
2. Collect all commits from today
3. Generate two summary documents
4. Save them to the current project directory

## Generated Documents

### 1. Detailed Timeline (`git-timeline-YYYY-MM-DD.md`)
A comprehensive chronological breakdown including:
- Summary statistics
- Timeline by time blocks
- Repository deep-dives
- Technical highlights
- Reflections and lessons learned

**Size:** 10-20 KB, 300-500 lines
**Audience:** Future you, detailed reference
**Time to review:** 5-10 minutes

### 2. Concise Summary (`daily-summary-YYYY-MM-DD.md`)
An executive summary in 2-3 paragraphs:
- Major technical work
- Secondary accomplishments
- Quick statistics

**Size:** 1-2 KB, 20-30 lines
**Audience:** Quick reference, team updates
**Time to review:** 30 seconds

## How It Works

### Step 1: Repository Discovery
```bash
# Scans for all .git directories
find /Users/mini/Documents/Projects -name ".git" -type d
```

### Step 2: Commit Collection
For each repository, collects:
- All commits since 00:00:00 today
- Commit hash, timestamp, message
- Author information

### Step 3: Analysis
Automatically identifies:
- **Major milestones**: Deployments, integrations
- **Features**: New functionality added
- **Bug fixes**: Issues resolved
- **Iterations**: Multi-commit features
- **Documentation**: Updates and additions
- **Infrastructure**: Cloud services, databases

### Step 4: Document Generation
Creates both timeline and summary using:
- Chronological ordering
- Time-block grouping (morning/afternoon/evening)
- Commit type categorization (feat/fix/docs/chore)
- Statistical analysis
- Pattern recognition

## File Organization

Documents are saved with date-stamped filenames:

```
AutumnsGrove/
├── git-timeline-2025-11-26.md
├── daily-summary-2025-11-26.md
├── git-timeline-2025-11-27.md
├── daily-summary-2025-11-27.md
└── ...
```

**Tip:** Create a `daily-summaries/` directory if you want to organize them separately:

```bash
mkdir -p daily-summaries
mv git-timeline-*.md daily-summaries/
mv daily-summary-*.md daily-summaries/
```

## Usage Patterns

### End of Workday (Most Common)
```bash
# When you're done for the day
/daily-summary
```

### Weekly Review
```bash
# View all summaries from this week
ls -1 daily-summary-2025-11-*.md | xargs cat
```

### Monthly Archive
```bash
# Archive last month's summaries
mkdir -p archives/2025-11
mv git-timeline-2025-11-*.md archives/2025-11/
mv daily-summary-2025-11-*.md archives/2025-11/
```

## Customization

### Change Repository Scan Path
Edit `.claude/commands/daily-summary.md`:
```markdown
Search for all git repositories in `/Your/Custom/Path`
```

### Adjust Time Blocks
The system auto-detects sessions with 1+ hour gaps.
To customize, modify the template to define explicit time ranges:
- Morning: 08:00-12:00
- Afternoon: 12:00-17:00
- Evening: 17:00-22:00
- Late Night: 22:00+

### Add Custom Sections
Edit `.claude/daily-summary-template.md` to add:
- Performance metrics
- Code review stats
- Testing coverage
- Deployment frequency

## Integration Ideas

### Git Commit Hook
Automatically remind yourself to generate summary:

```bash
# .git/hooks/post-commit
#!/bin/bash
HOUR=$(date +%H)
if [ $HOUR -ge 17 ]; then
  echo "💡 Tip: Run /daily-summary to generate end-of-day summary"
fi
```

### Shell Alias
Add to `~/.zshrc` or `~/.bashrc`:

```bash
alias eod="cd ~/Documents/Projects/AutumnsGrove && claude '/daily-summary'"
```

### Calendar Reminder
Set up a daily reminder at 6 PM:
- **macOS:** Reminders app
- **Calendar:** Recurring event
- **Message:** "Generate daily summary with /daily-summary"

## Example Output

### Concise Summary
```markdown
# Daily Summary - November 26, 2025

## What We Accomplished

Today was a highly productive development session with 52 commits across
4 repositories focused on infrastructure migration, feature development,
and UI refinements...

**Key Stats:** 30 commits to AutumnsGrove, 14 to GroveEngine | ~9 hours |
18 bug fixes, 7 new features, 14 PRs merged
```

### Detailed Timeline (excerpt)
```markdown
# Git Activity Timeline - November 26, 2025

**Total Repositories Active:** 4
**Total Commits:** 52
**Working Hours:** ~9 hours

## ⏰ Chronological Timeline

### Morning Session (08:55 - 11:59)

**08:55** - `94ef593` [GroveEngine] Merge PR #6: Landing page launch
**11:45** - `f628ca5` [GroveEngine] Enable autofill on email input
...
```

## Benefits

### For You
- **Memory aid**: Detailed record of what you accomplished
- **Progress tracking**: Visual proof of productivity
- **Pattern recognition**: Identify your productive hours
- **Lesson capture**: Document what you learned
- **Context switching**: Easy to resume work next day

### For Teams
- **Standup prep**: Quick summary for team meetings
- **Status updates**: Share concise summary with stakeholders
- **Onboarding**: New team members can review recent history
- **Documentation**: Automatic development log

### For Projects
- **Changelog**: Automated detailed change tracking
- **Release notes**: Foundation for version documentation
- **Debugging**: Track when issues were introduced/fixed
- **Time tracking**: Understand where time was spent

## Best Practices

### Daily Routine
1. **Commit frequently** with descriptive messages
2. **Use conventional commits** (feat:, fix:, docs:, etc.)
3. **Run /daily-summary** before closing your laptop
4. **Review the summary** to catch missed work
5. **Update TODOs** based on incomplete items

### Commit Message Quality
Good commit messages make better summaries:

**Good:**
```
feat: integrate D1 database for blog post storage
fix: resolve admin sidebar overlap with footer
docs: update API documentation for new endpoints
```

**Less Helpful:**
```
updates
fix stuff
wip
```

### Tracking Multiple Projects
If you work across many projects:
1. Run `/daily-summary` from main project
2. It automatically scans all repos
3. Review cross-project patterns
4. Identify context switching overhead

## Troubleshooting

### "No commits found"
- Verify you made commits today
- Check git repositories have valid `.git` directories
- Ensure commits are authored today (not pulled from remote)

### "Permission denied"
- Check read permissions on `/Users/mini/Documents/Projects`
- Verify git repositories are accessible

### "Document too large"
- Very active days (100+ commits) may produce large files
- Consider breaking into multiple sessions
- Archive older summaries regularly

## Future Enhancements

Potential additions to the system:

- [ ] Code statistics (lines added/removed)
- [ ] Language breakdown (% of changes per language)
- [ ] Test coverage deltas
- [ ] Deployment tracking
- [ ] Integration with time tracking tools
- [ ] Slack/Discord notifications
- [ ] Weekly/monthly rollups
- [ ] Visualization (commit graphs, heatmaps)

---

## Quick Reference Card

```
Command:        /daily-summary
Frequency:      End of each workday
Duration:       ~30 seconds to generate
Output:         2 files (detailed + concise)
Location:       Current project directory
Scans:          All repos in ~/Documents/Projects
Time Range:     Today (00:00:00 to now)
```

---

**Pro Tip:** Review your summary before shutting down. It's a great way to feel accomplished and plan tomorrow's work!
