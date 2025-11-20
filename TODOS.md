# TODOs for AutumnsGrove

## Initial Setup
- [x] Project initialized from BaseProject template
- [x] Dependencies configured (Python UV, npm)
- [x] Git hooks installed for code quality

## Core Features
- [ ] Choose and set up web framework (Flask or FastAPI)
- [ ] Design and implement homepage layout
- [ ] Create blog post system (create, edit, display)
- [ ] Build project showcase section
- [ ] Implement article sharing functionality

## Design & Frontend
- [ ] Design responsive website layout
- [ ] Create CSS styling and theme
- [ ] Add navigation menu
- [ ] Implement blog post templates

## Content Management
- [ ] Set up blog post storage (file-based or database)
- [ ] Create markdown rendering for blog posts
- [ ] Add metadata support (dates, tags, categories)

## Deployment
- [ ] Choose hosting platform
- [ ] Set up deployment pipeline
- [ ] Configure domain (if applicable)

## Git Dashboard Integration
- [ ] Configure GitHub token in secrets.json (requires GH CLI login)
- [ ] Install GitDashboard backend dependencies (uv sync)
- [ ] Test GitDashboard backend locally
- [ ] Integrate GitDashboard as a section/route on the main website
- [ ] Update navigation to include Git Dashboard link
- [ ] Style GitDashboard to match overall site theme

## Image Hosting (Cloudflare R2)
- [ ] Create R2 bucket `autumnsgrove-images`
- [ ] Connect custom domain (cdn.autumnsgrove.com or similar)
- [ ] Test image upload/access workflow
- [ ] Document upload process in ClaudeUsage/

## Secrets & Environment Setup
- [ ] Update secrets_template.json with all required keys
- [ ] Configure GITHUB_TOKEN with `repo` scope (for private repos)
- [ ] Configure ANTHROPIC_API_KEY
- [ ] Create KV namespace for API response caching
- [ ] Set up Cloudflare AI Gateway instance

## Git Dashboard - SvelteKit Integration
- [ ] Create /src/routes/api/git/user/+server.js
- [ ] Create /src/routes/api/git/repos/+server.js
- [ ] Create /src/routes/api/git/stats/+server.js
- [ ] Port GraphQL query logic from FastAPI backend
- [ ] Add KV caching to all endpoints
- [ ] Create /src/routes/dashboard/+page.svelte
- [ ] Port Chart.js + rough.js visualizations
- [ ] Style dashboard to match site theme (green/teal, dark mode)
- [ ] Update navigation to include Dashboard link

## Git Dashboard - New Visualizations
- [ ] Add commit history heatmap (GitHub contribution graph style)
- [ ] Add interactive timeline for commit history
- [ ] Add date range filtering
- [ ] Build project comparison side-by-side charts
- [ ] Add radar chart for multi-dimensional repo comparison
- [ ] Implement weekly/monthly activity graph

## TODO Tracking System
- [ ] Create /src/routes/api/git/todos/+server.js
- [ ] Parse TODO/FIXME from code comments
- [ ] Parse TODOS.md files from repositories
- [ ] Categorize by file, status, age, priority
- [ ] Build frontend TODO list with filtering/search
- [ ] Add progress bars (completed vs pending)
- [ ] Group TODOs by project
- [ ] Show TODO aging (how long they've existed)

## AI-Powered Analysis (Claude Haiku 4.5)
- [ ] Set up Anthropic integration via AI Gateway
- [ ] Create /src/routes/api/ai/analyze/+server.js
- [ ] Implement project health score calculation
- [ ] Add progress assessment (completion %)
- [ ] Generate AI insights and recommendations
- [ ] Cache AI results in KV (6-hour TTL)

## Git Dashboard - Cloudflare D1 Historical Storage
- [ ] Create D1 database for git stats
- [ ] Design schema: commits, repo_stats, todos, snapshots
- [ ] Build scheduled sync worker (6-hour cron)
- [ ] Create API endpoints for historical data
- [ ] Add line charts for commit trends over time
- [ ] Add TODO completion trend visualization
- [ ] Add project activity trend charts

## Security & Performance
- [ ] Validate all inputs server-side
- [ ] Add rate limiting to API endpoints
- [ ] Ensure secrets never leak to client-side
- [ ] Optimize chart loading (lazy-load)
- [ ] Mobile optimization
