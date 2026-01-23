# Museum Exhibit Plan

> *A roadmap for documenting the AutumnsGrove codebase as a learning resource.*

---

## Overview

Transform AutumnsGrove from archived code into an educational museum. Each major directory gets an EXHIBIT.md that explains:
- What this section does
- How it fits into the whole
- Key files to study
- Patterns worth learning
- Gotchas and lessons learned

---

## Exhibits to Write

### Phase 1: Core Architecture

| Exhibit | Location | Focus |
|---------|----------|-------|
| **The Architecture** | `src/EXHIBIT.md` | Request lifecycle, auth flow, data patterns |
| **The Foundation** | `migrations/EXHIBIT.md` | Database schema, relationships, D1 patterns |

### Phase 2: Routes & APIs

| Exhibit | Location | Focus |
|---------|----------|-------|
| **The Visitor Experience** | `src/routes/EXHIBIT.md` | Public pages, SvelteKit routing, SSR |
| **The Control Room** | `src/routes/admin/EXHIBIT.md` | Admin panel architecture, 7K lines of CMS |
| **The Engine Room** | `src/routes/api/EXHIBIT.md` | REST API design, endpoint patterns |

### Phase 3: Supporting Code

| Exhibit | Location | Focus |
|---------|----------|-------|
| **The Workshop** | `src/lib/EXHIBIT.md` | Utilities, auth helpers, shared code |
| **Edge Computing** | `workers/EXHIBIT.md` | Cloudflare Workers, redirect patterns |

---

## Exhibit Template

Each EXHIBIT.md should follow this structure:

```markdown
# [Wing Name]

> *One-line description of what this section is about.*

---

## What You're Looking At

Brief orientation. What does this directory contain? What's its role in the system?

## The Key Players

Table or list of the most important files, with one-sentence descriptions.

| File | Purpose |
|------|---------|
| `example.js` | Does the thing |

## How It Works

Prose explanation of the flow/architecture. Diagrams in ASCII if helpful.

## Patterns Worth Stealing

Specific techniques that are worth copying:
1. **Pattern Name** - Where to find it, what it does
2. **Another Pattern** - etc.

## Lessons Learned

Things I'd do differently, gotchas, hard-won knowledge.

## Where to Go Next

Links to related exhibits or specific files to dive into.
```

---

## Priority Order

1. **src/EXHIBIT.md** - The architecture overview (most important for orientation)
2. **migrations/EXHIBIT.md** - Database is foundational
3. **src/routes/api/EXHIBIT.md** - APIs reveal the data model in action
4. **src/routes/admin/EXHIBIT.md** - The crown jewel, most complex
5. **src/routes/EXHIBIT.md** - Public pages
6. **src/lib/EXHIBIT.md** - Supporting utilities
7. **workers/EXHIBIT.md** - Small but instructive

---

## Key Files to Highlight

### Authentication Flow
- `src/hooks.server.js` - Request interception, session validation
- `src/lib/auth/` - Auth utilities
- `src/routes/auth/` - Login/logout/callback routes

### Content Management
- `src/routes/admin/blog/` - Post editor
- `src/routes/api/posts/` - Post CRUD
- `src/lib/content/` - Markdown processing

### Timeline (Git Activity)
- `src/routes/api/timeline/` - Daily summary generation
- `src/routes/api/git/` - GitHub API integration
- `migrations/` - Timeline schema

### Gallery
- `src/routes/gallery/` - Public gallery
- `src/routes/api/gallery/` - Image management
- `src/routes/admin/images/` - Admin interface

### Database Patterns
- `migrations/*.sql` - Schema evolution
- Any file with D1 queries - How to work with edge SQLite

---

## Voice Guidelines

Write exhibits like you're giving a personal tour:
- Warm but technical
- "Here's what I built and why"
- Point out both clever solutions AND mistakes
- Assume the reader is smart but unfamiliar with the codebase
- Include code snippets when they illuminate patterns

---

## Success Criteria

When complete, someone like Imani should be able to:
1. Understand the overall architecture in 10 minutes (MUSEUM.md + src/EXHIBIT.md)
2. Find and understand any specific feature within 5 minutes
3. Copy patterns for their own projects
4. Learn from documented mistakes without repeating them

---

## Notes

- README.md stays untouched (it's the GitHub landing page)
- MUSEUM.md is the tour entrance
- Each EXHIBIT.md is a self-contained wing
- Cross-link between exhibits where relevant

---

*Plan created January 2026*
