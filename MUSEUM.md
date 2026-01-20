# Welcome to the AutumnsGrove Museum

> *A living archive of a personal website, preserved for learning.*

---

## What Is This Place?

You're standing in the source code of what was once a fully functional personal website—my corner of the internet, built from scratch with SvelteKit, Cloudflare Workers, and a lot of late nights.

**This code no longer runs the live site.** In January 2026, AutumnsGrove migrated to [autumn.grove.place](https://autumn.grove.place), powered by the Grove Engine (Lattice). But rather than let this codebase rot in an archive, I've turned it into something better: a museum.

Walk through these halls. Read the exhibits. See how a real website gets built—not a tutorial's sanitized example, but the actual messy, evolving, *working* code that served real pages to real people.

---

## Why a Museum?

Because code is knowledge, and knowledge shouldn't disappear.

When I built AutumnsGrove, I learned by reading other people's code. Open source projects, GitHub repos, scattered blog posts. I'd find a pattern I liked, trace it back to its origin, try to understand *why* someone made that choice.

Now it's my turn to give back.

This museum is for:
- **Ariana**, who wants to build her own site and needs to see how the pieces fit together
- **The curious developer** who learns better from real code than tutorials
- **Future me**, who will forget why I made these choices
- **Anyone** who believes personal websites matter

---

## The Wings

Each major section of this codebase has an **EXHIBIT.md** file—a guided tour of what you're looking at. Start anywhere that interests you.

### [The Architecture](/src/EXHIBIT.md)
*How everything connects*

The high-level view. Request flow, authentication, data patterns. Start here if you want the big picture.

### [The Visitor Experience](/src/routes/EXHIBIT.md)
*Public-facing pages*

What visitors see: the blog, the gallery, the about page. How SvelteKit routes work in practice.

### [The Control Room](/src/routes/admin/EXHIBIT.md)
*The admin panel*

~7,000 lines of custom CMS. Blog editor, image management, settings, timeline configuration. The beating heart of content management.

### [The Engine Room](/src/routes/api/EXHIBIT.md)
*API architecture*

REST endpoints for everything. How the admin panel talks to the database. CRUD operations, validation, error handling.

### [The Workshop](/src/lib/EXHIBIT.md)
*Shared utilities*

Authentication helpers, content processing, utility functions. The code that gets imported everywhere.

### [Edge Computing](/workers/EXHIBIT.md)
*Cloudflare Workers*

The redirect worker that sends autumnsgrove.com to its new home. A tiny example of edge computing.

### [The Foundation](/migrations/EXHIBIT.md)
*Database schema*

D1 (SQLite) migrations that define the data model. Posts, pages, images, sessions, timeline entries.

---

## The Stack

For the technically curious, here's what powered AutumnsGrove:

| Layer | Technology |
|-------|------------|
| **Framework** | SvelteKit 2.x |
| **Runtime** | Cloudflare Workers |
| **Database** | Cloudflare D1 (SQLite at the edge) |
| **Storage** | Cloudflare R2 (S3-compatible) |
| **Cache** | Cloudflare KV |
| **Auth** | Custom OAuth + session management |
| **Styling** | Tailwind CSS |
| **AI** | OpenRouter (DeepSeek, Claude) |

No Next.js. No Vercel. No AWS. Just Cloudflare's edge platform and a determination to own my infrastructure.

---

## How to Read This Museum

**If you're building something similar:**
Start with [The Architecture](/src/EXHIBIT.md), then dive into whatever section matches what you're trying to build.

**If you're curious about a specific feature:**
Jump directly to that wing. Each exhibit is self-contained.

**If you just want to browse:**
Wander. Click into files that look interesting. The exhibits will give you context, but the real learning is in the code itself.

---

## A Note on Imperfection

This code is not perfect. You'll find:
- Comments I meant to clean up
- Patterns I'd do differently now
- Edge cases I never handled
- That one TODO from November I kept meaning to fix

That's the point. Real code has history. Real code evolves. Real code ships with known imperfections because *shipping matters*.

Don't let perfect be the enemy of deployed.

---

## The Successor

This museum exists because AutumnsGrove found a better home.

[Grove Engine](https://github.com/AutumnsGrove/GroveEngine) (Lattice) is the multi-tenant platform that now powers autumn.grove.place and will eventually host other writers' groves too. Many patterns from this codebase live on there—evolved, refined, battle-tested.

If you're building for yourself, study this museum.
If you're building for others, study Lattice.

---

## Begin Your Tour

Pick a wing. Read an exhibit. Trace the code.

Welcome to the museum.

*— Autumn, January 2026*

---

<p align="center">
<em>"The best way to learn is to see how someone else solved the problem you're facing."</em>
</p>
