# Migrating to autumn.grove.place

This guide covers migrating AutumnsGrove to a Lattice tenant at `autumn.grove.place`.

## What's Included

| File | Purpose |
|------|---------|
| `lattice_tenant_setup.sql` | Creates tenant, home/about pages, Timeline config |
| `export_timeline_for_lattice.sql` | Exports existing timeline summaries |

## Migration Steps

### Step 1: Create the Tenant

Run the setup SQL against **Lattice's D1 database**:

```bash
cd /path/to/GroveEngine/packages/engine
wrangler d1 execute lattice-engine --file=/path/to/AutumnsGrove/migrations/lattice_tenant_setup.sql
```

This creates:
- Tenant `autumn` with `evergreen` plan
- Home page with hero section
- About page with your bio
- Timeline curio config (enabled, using `quest` voice)

### Step 2: Add API Keys (via Admin UI)

The SQL doesn't include API keys (they need encryption). After setup:

1. Go to `autumn.grove.place/admin/curios/timeline`
2. Add your **GitHub Token** (for fetching commits)
3. Add your **OpenRouter Key** (for AI summaries)

Or manually update the `timeline_curio_config` table with encrypted keys.

### Step 3: Migrate Timeline History (Optional)

To preserve your existing timeline summaries:

```bash
# 1. Export from AutumnsGrove's git-stats D1
cd /path/to/AutumnsGrove
wrangler d1 execute autumnsgrove-git-stats \
  --file=migrations/export_timeline_for_lattice.sql \
  > timeline_export.sql

# 2. Import to Lattice
cd /path/to/GroveEngine/packages/engine
wrangler d1 execute lattice-engine --file=/path/to/timeline_export.sql
```

### Step 4: Migrate Blog Posts (Future)

Blog posts can be migrated using the post-migrator tool once it supports cross-tenant migration. For now, posts can be:
- Manually added via admin
- Synced from markdown files (if using file-based workflow)

### Step 5: Setup Domain Redirect

Option A: **Cloudflare Redirect Rules**
1. Go to Cloudflare dashboard → autumnsgrove.com
2. Rules → Redirect Rules
3. Add rule: `autumnsgrove.com/*` → `https://autumn.grove.place/$1` (301)

Option B: **Worker redirect** (more control)
```javascript
export default {
  fetch(request) {
    const url = new URL(request.url);
    return Response.redirect(
      `https://autumn.grove.place${url.pathname}${url.search}`,
      301
    );
  }
};
```

## Verification Checklist

After migration:

- [ ] `autumn.grove.place` loads
- [ ] Home page displays with hero
- [ ] About page shows bio
- [ ] `/timeline` shows (may be empty until API keys added)
- [ ] `/blog` loads (may be empty until posts migrated)
- [ ] `/admin` accessible with Heartwood auth
- [ ] `autumnsgrove.com` redirects to `autumn.grove.place`

## What Stays on AutumnsGrove (for now)

- Gallery (until Gallery Curio PR is merged)
- Git Dashboard (until Git Dashboard PR is merged)
- Recipes (until Recipes Curio is built... or just blog posts tagged "recipe")

## Notes

- **Don't delete AutumnsGrove!** It's your personal baby AND your GitHub profile README.
- The `evergreen` plan gives full access to all features.
- Timeline uses `quest` voice preset for that adventure-log feel.
- Excluded repos: `dotfiles`, `.github` (configurable in admin)
