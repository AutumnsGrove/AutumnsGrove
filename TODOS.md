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

## Git Dashboard - Cloudflare D1 Storage
- [ ] Create new Cloudflare D1 database for git stats
- [ ] Design schema for storing historical commit data
- [ ] Build worker to sync GitHub stats to D1
- [ ] Create API endpoints for querying historical data
- [ ] Implement visualizations for historical trends
- [ ] Set up scheduled sync for periodic data collection
