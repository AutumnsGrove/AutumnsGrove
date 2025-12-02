# GroveEngine Cleanup Handoff

> **Purpose**: Guide for deleting remnant local code after GroveEngine package is properly installed and tested.
> **Status**: Pending - execute after `@groveengine/engine` is published to npm and symlinked/installed.

## Prerequisites

Before executing this cleanup:

1. [ ] `@groveengine/engine` package is available (either published to npm or symlinked locally)
2. [ ] `npm install` or symlink setup completed successfully
3. [ ] Application builds without errors (`npm run build`)
4. [ ] Application runs locally and all routes work
5. [ ] All tests pass (if applicable)
6. [ ] Manual testing of critical paths:
   - [ ] Home page loads
   - [ ] Blog posts render with gutter content
   - [ ] Admin authentication works
   - [ ] Admin blog editor works (create/edit/delete posts)
   - [ ] Gallery loads and filters work
   - [ ] Timeline page renders

## Files to Delete

Once all prerequisites are confirmed, delete the following files/directories:

### 1. Custom Components (Now in GroveEngine)

```bash
# Delete these files - they are now exported from @groveengine/engine
rm src/lib/components/custom/ContentWithGutter.svelte
rm src/lib/components/custom/TableOfContents.svelte
rm src/lib/components/custom/MobileTOC.svelte
rm src/lib/components/custom/CollapsibleSection.svelte
rm src/lib/components/custom/LeftGutter.svelte
rm src/lib/components/custom/GutterItem.svelte
rm -rf src/lib/components/gallery/  # All gallery components
```

### 2. Admin Components (Now in GroveEngine)

```bash
rm src/lib/components/admin/MarkdownEditor.svelte
rm src/lib/components/admin/GutterManager.svelte
```

### 3. UI Components (Now in GroveEngine)

```bash
# Delete entire UI directory - all components are in @groveengine/engine/components/ui
rm -rf src/lib/components/ui/
```

### 4. Utility Files (Now in GroveEngine)

```bash
rm src/lib/utils/markdown.js
rm src/lib/utils/sanitize.js
rm src/lib/utils/csrf.js
rm src/lib/utils/gutter.js
rm src/lib/utils/gallery.js
rm src/lib/utils/validation.js
rm src/lib/utils/api.js
rm src/lib/utils/debounce.js
rm src/lib/utils/json.js
rm src/lib/utils.ts  # The cn() re-export
```

### 5. Auth Files (Now in GroveEngine)

```bash
rm src/lib/auth/jwt.js
rm src/lib/auth/session.js
```

## Files to KEEP (Local/Personal)

These files should NOT be deleted - they are personal to this site:

### Custom Components (Local)
- `src/lib/components/custom/LogViewer.svelte` - System logs viewer
- `src/lib/components/custom/IconLegend.svelte` - Recipe icons
- `src/lib/components/custom/InternalsPostViewer.svelte` - Homepage post preview

### Dashboard Components (Local)
- `src/routes/dashboard/+page.svelte` - Personal dashboard
- `src/routes/dashboard/Heatmap.svelte` - Contribution heatmap

### Chart Components (Local)
- `src/routes/dashboard/ActivityOverview.svelte`
- `src/routes/dashboard/LOCBar.svelte`
- `src/routes/dashboard/RepoBreakdown.svelte`
- `src/routes/dashboard/Sparkline.svelte`

### GitHub Integration (Local)
- `src/lib/utils/github.js` - Personal GitHub API wrapper

## Cleanup Script

After verifying prerequisites, run this script:

```bash
#!/bin/bash
# GROVEENGINE CLEANUP SCRIPT
# Run from project root after verifying the app works with @groveengine/engine

set -e  # Exit on error

echo "Starting GroveEngine cleanup..."

# 1. Custom components (migrated to GroveEngine)
echo "Removing migrated custom components..."
rm -f src/lib/components/custom/ContentWithGutter.svelte
rm -f src/lib/components/custom/TableOfContents.svelte
rm -f src/lib/components/custom/MobileTOC.svelte
rm -f src/lib/components/custom/CollapsibleSection.svelte
rm -f src/lib/components/custom/LeftGutter.svelte
rm -f src/lib/components/custom/GutterItem.svelte

# 2. Gallery components
echo "Removing gallery components..."
rm -rf src/lib/components/gallery/

# 3. Admin components
echo "Removing admin components..."
rm -f src/lib/components/admin/MarkdownEditor.svelte
rm -f src/lib/components/admin/GutterManager.svelte
rmdir src/lib/components/admin/ 2>/dev/null || true

# 4. UI components
echo "Removing UI components..."
rm -rf src/lib/components/ui/

# 5. Utilities
echo "Removing utility files..."
rm -f src/lib/utils/markdown.js
rm -f src/lib/utils/sanitize.js
rm -f src/lib/utils/csrf.js
rm -f src/lib/utils/gutter.js
rm -f src/lib/utils/gallery.js
rm -f src/lib/utils/validation.js
rm -f src/lib/utils/api.js
rm -f src/lib/utils/debounce.js
rm -f src/lib/utils/json.js
rm -f src/lib/utils.ts

# 6. Auth files
echo "Removing auth files..."
rm -f src/lib/auth/jwt.js
rm -f src/lib/auth/session.js
rmdir src/lib/auth/ 2>/dev/null || true

echo ""
echo "Cleanup complete!"
echo ""
echo "Remaining in src/lib/components/custom/:"
ls -la src/lib/components/custom/ 2>/dev/null || echo "  (directory empty or removed)"
echo ""
echo "Remaining in src/lib/utils/:"
ls -la src/lib/utils/ 2>/dev/null || echo "  (directory empty or removed)"
echo ""
echo "Please verify the application still works:"
echo "  npm run build"
echo "  npm run dev"
```

## Post-Cleanup Verification

After cleanup:

1. Run `npm run build` - should complete without errors
2. Run `npm run dev` - site should work normally
3. Test all pages mentioned in prerequisites
4. Commit the deletions:
   ```bash
   git add -A
   git commit -m "chore: Remove migrated code, now using @groveengine/engine"
   ```

## Rollback

If something breaks after cleanup:

1. Don't panic - the files were just deleted locally
2. Restore from git: `git checkout HEAD~1 -- src/lib/`
3. Or restore specific files: `git checkout HEAD~1 -- src/lib/components/ui/`

## Migration Reference

For details on what was migrated and how, see:
- `docs/plans/MIGRATION-MASTER-PLAN.md` - Original migration plan
- `groveengine-package-config.patch` - GroveEngine package exports structure

---

*Created: December 2025*
*Context: Migration from local components to @groveengine/engine package*
