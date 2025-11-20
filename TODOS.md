# TODOs for AutumnsGrove

> **Last Updated:** November 2024 - Git Dashboard integration complete, visualizations pending

---

## ✅ Completed

### Initial Setup
- [x] Project initialized from BaseProject template
- [x] Dependencies configured (Python UV, npm)
- [x] Git hooks installed for code quality
- [x] SvelteKit with Cloudflare Pages adapter configured

### Core Website
- [x] Homepage layout implemented
- [x] Blog system with markdown rendering
- [x] Recipes section
- [x] Navigation menu with dark mode toggle
- [x] Responsive design

### Cloudflare Infrastructure
- [x] R2 bucket created: `autumnsgrove-images`
- [x] KV namespace created: `CACHE_KV` (ID: 6bc72b16c721401e8b9a848a7ae4e0ca)
- [x] D1 database created: `autumnsgrove-git-stats` (ID: 0ca4036f-93f7-4c8a-98a5-5353263acd44)
- [x] Wrangler.toml configured with all bindings
- [x] Secrets configured in Cloudflare Dashboard (GITHUB_TOKEN, ANTHROPIC_API_KEY)

### Git Dashboard - Core Integration
- [x] API routes created:
  - `/api/git/user/[username]` - User info
  - `/api/git/repos/[username]` - Repositories
  - `/api/git/stats/[username]` - Commit statistics
  - `/api/git/health` - Health check
  - `/api/git/todos/[username]/[repo]` - TODO extraction
  - `/api/git/sync` - Scheduled sync endpoint
  - `/api/git/history/[username]/[repo]` - Historical data
  - `/api/ai/analyze/[username]/[repo]` - AI analysis
- [x] Dashboard page at `/dashboard` with:
  - User info card
  - Stats cards (commits, additions, deletions, repos)
  - Hour-of-day bar chart
  - Day-of-week bar chart
  - Top repositories list
  - Recent commits list
- [x] Auto-loads AutumnsGrove account on page visit
- [x] 3-hour KV caching for all API responses
- [x] Navigation updated with Dashboard link

### Backend Systems
- [x] D1 schema designed (src/lib/db/schema.sql)
- [x] Claude Haiku 4.5 integration for AI analysis
- [x] TODO parsing from code comments and TODOS.md files

---

## 🔲 Remaining Tasks

### HIGH PRIORITY: Image Hosting Setup

**Goal:** Use R2 bucket to host images instead of committing to GitHub

**Steps to complete:**

1. **Connect custom domain to R2 bucket**
   - Go to: Cloudflare Dashboard → R2 → `autumnsgrove-images` → Settings → Custom Domains
   - Add domain: `cdn.autumnsgrove.com` (or `images.autumnsgrove.com`)
   - This requires the domain to be in your Cloudflare account

2. **Test upload workflow**
   ```bash
   # Upload a test image
   npx wrangler r2 object put autumnsgrove-images/test/hello.jpg --file ./path/to/image.jpg

   # Verify it's accessible
   curl https://cdn.autumnsgrove.com/test/hello.jpg
   ```

3. **Create upload helper script** (optional)
   - Consider creating a CLI script to make uploads easier
   - Or use the Cloudflare Dashboard for manual uploads

4. **Reference images in your site**

   In Svelte components:
   ```svelte
   <img src="https://cdn.autumnsgrove.com/blog/my-post/hero.jpg" alt="..." />
   ```

   In Markdown files (posts/recipes):
   ```markdown
   ![Alt text](https://cdn.autumnsgrove.com/blog/my-post/image.jpg)

   Or with a caption:
   ![My cool project screenshot](https://cdn.autumnsgrove.com/posts/2024-11-20/screenshot.png)
   ```

5. **Suggested folder structure in R2**
   ```
   autumnsgrove-images/
   ├── blog/
   │   └── post-slug/
   │       ├── hero.jpg
   │       └── diagram.png
   ├── recipes/
   │   └── recipe-slug/
   │       └── finished-dish.jpg
   └── projects/
       └── project-name/
           └── screenshot.png
   ```

6. **Document the process**
   - Create `ClaudeUsage/image_hosting.md` with upload instructions

---

### MEDIUM PRIORITY: Dashboard Visualizations

**Goal:** Add advanced visualizations to make the dashboard more informative

#### Commit History Heatmap (GitHub contribution graph style)
- [ ] Create new component: `src/routes/dashboard/Heatmap.svelte`
- [ ] Use the `/api/git/history/[username]/[repo]` endpoint for data
- [ ] Display 52 weeks of commit activity
- [ ] Color intensity based on commit count
- [ ] Libraries to consider: D3.js or custom SVG

#### Interactive Timeline
- [ ] Show commits over time with scrollable timeline
- [ ] Click to see commit details
- [ ] Filter by date range

#### Project Comparison Charts
- [ ] Side-by-side bar charts for multiple repos
- [ ] Compare: commits, additions, deletions, activity
- [ ] Radar chart for multi-dimensional comparison
- [ ] Select which repos to compare

#### Historical Trends
- [ ] Line charts showing commits over weeks/months
- [ ] TODO completion trends
- [ ] Requires D1 data to be populated first

---

### MEDIUM PRIORITY: Initialize D1 Database

**Goal:** Set up the database schema for historical tracking

**Steps:**

1. **Run the schema migration**
   ```bash
   npx wrangler d1 execute autumnsgrove-git-stats --file=src/lib/db/schema.sql
   ```

2. **Trigger initial sync** (after deployment)
   ```bash
   curl -X POST https://autumnsgrove.com/api/git/sync \
     -H "Content-Type: application/json" \
     -d '{"username": "AutumnsGrove", "limit": 20}'
   ```

3. **Set up cron trigger** (in Cloudflare Dashboard)
   - Workers & Pages → autumnsgrove → Settings → Triggers
   - Add cron: `0 */6 * * *` (every 6 hours)
   - This calls `/api/git/sync` automatically

---

### LOW PRIORITY: Dashboard UI Improvements

**Based on your design feedback (to be discussed):**
- [ ] Layout adjustments
- [ ] Color scheme tweaks
- [ ] Typography changes
- [ ] Mobile responsiveness improvements
- [ ] Loading states and animations

---

### LOW PRIORITY: Security & Performance

- [ ] Add rate limiting to API endpoints (use Cloudflare's built-in)
- [ ] Input validation hardening
- [ ] Lazy-load Chart.js (reduce initial bundle size)
- [ ] Mobile optimization for charts
- [ ] Add error boundaries for graceful failures

---

## 📝 Quick Reference

### Local Development
```bash
# Start with Cloudflare bindings
npx wrangler pages dev -- npm run dev

# Access at http://localhost:8788
```

### Key Files
- **Dashboard page:** `src/routes/dashboard/+page.svelte`
- **GitHub utilities:** `src/lib/utils/github.js`
- **API routes:** `src/routes/api/git/`
- **D1 schema:** `src/lib/db/schema.sql`
- **Wrangler config:** `wrangler.toml`
- **Local secrets:** `.dev.vars` (gitignored)

### Cloudflare Resources
- **R2 Bucket:** `autumnsgrove-images`
- **KV Namespace:** `CACHE_KV`
- **D1 Database:** `autumnsgrove-git-stats`

### API Endpoints
| Endpoint | Description | Cache |
|----------|-------------|-------|
| `/api/git/user/[username]` | User profile | 3 hours |
| `/api/git/stats/[username]` | Commit stats | 3 hours |
| `/api/git/repos/[username]` | Repositories | 3 hours |
| `/api/git/todos/[username]/[repo]` | TODO extraction | 30 min |
| `/api/git/history/[username]/[repo]` | Historical data | 30 min |
| `/api/ai/analyze/[username]/[repo]` | AI analysis | 6 hours |
| `/api/git/sync` | Trigger data sync | N/A |
| `/api/git/health` | Health check | N/A |

---

## 🚀 Next Session Checklist

When you return to work on this project:

1. **First, deploy current changes:**
   ```bash
   git push origin main
   ```

2. **Initialize D1 database:**
   ```bash
   npx wrangler d1 execute autumnsgrove-git-stats --file=src/lib/db/schema.sql
   ```

3. **Set up R2 custom domain** (Cloudflare Dashboard)

4. **Test the deployed dashboard** at https://autumnsgrove.com/dashboard

5. **Continue with visualizations** or address design feedback

---

*Last updated: November 2024*
