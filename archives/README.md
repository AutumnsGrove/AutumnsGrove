# The Archives

> *Not everything needs to be on display. Some things just need to be kept safe.*

---

## Why This Exists

In January 2026, AutumnsGrove stopped being a living website and became a museum. The code that once served pages, processed uploads, and managed sessions is now preserved for learning—frozen in time, documented with care.

But a website isn't just source code. It's also configuration files, build scripts, development notes, migration plans, style configs, test infrastructure, and all the scaffolding that made the thing *run*. That scaffolding told the development story, but it cluttered the museum.

So we archived it.

Not deleted. Archived. Because the difference matters.

---

## What's Here

| Folder | What It Contains |
|--------|------------------|
| `AgentUsage/` | Workflow guides for AI-assisted development (git, testing, secrets, databases, Svelte) |
| `config/` | Build and runtime configuration (SvelteKit, Vite, Tailwind, Wrangler, TypeScript, PostCSS) |
| `development/` | Active development artifacts (TODOs, migration plans, code review notes) |
| `docs/` | Historical documentation (implementation summaries, OAuth guides, migration plans, daily summaries) |
| `githooks/` | Git hooks that enforced development practices |
| `mocks/` | Test mocks and fixtures for Vitest |
| `scripts/` | Build and sync scripts (content syncing, database operations) |
| `static/` | Static assets (CSS, fonts, images, favicon, manifest) |

---

## The Philosophy

A museum has a front-of-house and a back-of-house.

The **front-of-house** is what visitors see—the exhibits, the guided tours, the curated experience. That's the `MUSEUM.md`, the `EXHIBIT.md` files, the source code with its clear structure and readable patterns.

The **back-of-house** is where the tools live. The configuration that built the site. The scripts that synced content. The development notes that tracked progress. The mocks that made tests run. Essential during construction, but not part of the tour.

This folder is back-of-house. You're welcome here—there's nothing hidden—but the real experience is out in the museum proper.

---

## If You're Looking For Something Specific

**"How was the site configured?"**
Check `config/`. You'll find `wrangler.toml` (Cloudflare Workers config), `svelte.config.js`, `tailwind.config.js`, and the full `package.json` with all dependencies.

**"What was the development process like?"**
Start with `development/TODOS.md` for the running task list, `docs/THE_JOURNEY.md` for the narrative, and `AgentUsage/` for how AI-assisted development worked.

**"How did deployment work?"**
See `config/wrangler.toml` for the Cloudflare setup, `scripts/` for build automation, and `docs/DATABASE_SYNC_SETUP.md` for the content pipeline.

**"What about the design system?"**
`config/tailwind.config.js` and `config/tailwind.typography.config.js` define the visual language. `static/` has the actual CSS and assets. `docs/shadcn-migration-complete.md` tells the story of the UI component migration.

---

## A Note on Completeness

Everything that was in the repository is still in the repository. Files were moved, not removed. Git history is preserved. If you need to trace a change back to its origin, `git log --follow` will take you there.

This is an archive in the truest sense: nothing lost, just organized differently.

---

*The museum is out there. This is just the storage room. But even storage rooms have their stories.*
