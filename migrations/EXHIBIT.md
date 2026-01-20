# The Foundation: AutumnsGrove Database Schema

Welcome. This is the story of how a personal website's database grew from nothing into something that matters. If you've ever wondered how web applications actually *persist* the things that make them special, this is where it happens.

I've written this for you, Ariana, and anyone learning to build. Think of these migrations as chapters—each one adds something new when the previous version couldn't quite do the job anymore.

---

## What You're Looking At

This `migrations/` directory contains **five sequential SQL files** that show the complete evolution of AutumnsGrove's database. Each migration builds on the previous one, never tearing down what came before. This is intentional—it's how real applications grow.

- **001_magic_codes.sql**: Email authentication without passwords
- **002_auth_security.sql**: Protections against abuse
- **003_site_settings.sql**: Dynamic, configurable behavior
- **004_pages_table.sql**: The content itself—pages, posts, everything
- **005_ai_writing.sql**: Tracking AI assistance and usage

Each migration can be run independently, but their order matters. You could think of them as bricks: the first brick supports everything that comes after.

---

## The Schema Evolution Story

### Migration 001: Magic Codes - The Passwordless Door

```sql
magic_codes
├── id (auto-incrementing primary key)
├── email (not null)
├── code (the secret key sent via email)
├── created_at (when it was generated)
├── expires_at (when it stops working)
└── used (boolean: has this code been redeemed?)
```

**Why this exists**: Traditional password authentication is a pain. Send someone an email with a magic link instead. When they click it, they've proven they own that email address. Simple. Warm. Passwordless.

**The indexes**: We create *two* indexes here—one for "give me all codes for this email" and another for the common query "show me valid, unused codes for this user." Indexes are like bookmarks; without them, finding data means reading every row. That gets slow fast.

---

### Migration 002: Auth Security - Building Walls

At this point, someone asks: "What if someone just keeps trying random codes?" Enter rate limiting and breach prevention.

```sql
rate_limits
├── id (auto-incrementing)
├── ip_address (where the request came from)
└── created_at (timestamp of the attempt)

failed_attempts
├── id (auto-incrementing)
├── email (marked UNIQUE—one row per person)
├── attempts (how many wrong tries)
├── last_attempt (when they last tried)
└── locked_until (temporary lockout timestamp)
```

**The pattern**: We track *two* dimensions of abuse:
- **By IP**: Rapid requests from the same computer
- **By email**: Too many wrong attempts for one person's account

The `UNIQUE` constraint on `failed_attempts.email` is important—it forces one row per email address. You can't have duplicates, so updates are always modifying the same row.

**Why this matters**: Security isn't an afterthought. It's built in from migration two, not added later when someone exploits migration one.

---

### Migration 003: Site Settings - Configuration Without Code Changes

Ever needed to change something about your site without deploying new code? That's what this does.

```sql
site_settings
├── setting_key (the name of the thing, marked UNIQUE)
├── setting_value (the value, stored as TEXT)
└── updated_at (when it last changed)
```

**The philosophy**: One simple key-value table can hold fonts, color schemes, feature flags, API keys—anything you need to adjust dynamically. The migration even seeds a default font (`alagard`), using `ON CONFLICT(setting_key) DO NOTHING` to avoid errors if it already exists.

**Why TEXT for everything?** Flexibility. Store JSON, numbers, strings, whatever you want. Your application layer converts it to the right type when needed.

---

### Migration 004: Pages Table - Where Content Lives

Now we get to the actual website.

```sql
pages
├── slug (PRIMARY KEY: the URL path like "about" or "projects")
├── title (the page title)
├── description (SEO metadata)
├── type (distinguishes 'page' from 'post' from other content)
├── markdown_content (the raw text you write)
├── html_content (rendered version, cached for speed)
├── hero (JSON object for the hero section)
├── gutter_content (JSON array of sidebar items)
├── font (which font this page uses)
├── created_at (when added)
└── updated_at (when last modified)
```

**Smart choices here**:
- Using `slug` as PRIMARY KEY means no duplicate URLs. Each page is findable by its URL.
- Storing both `markdown_content` and `html_content` is a cache. When someone visits, you serve the pre-rendered HTML. Fast. Efficient.
- `hero` and `gutter_content` store JSON. This gives you flexibility—different pages can have different layouts without schema changes.
- The indexes on `type` and `updated_at` let you query "all posts ordered by newest first" efficiently.

**Why this matters**: Most websites live here. Everything else exists to support content creation and access.

---

### Migration 005: AI Writing - Tracking Assistance

The newest chapter. As AI becomes part of the writing process, you need to understand how it's being used.

```sql
ai_writing_requests
├── id (auto-incrementing)
├── user_id (which email made this request)
├── action ('grammar', 'tone', 'readability', 'all')
├── model (which AI model processed it)
├── input_tokens (how many tokens it read)
├── output_tokens (how many it generated)
├── cost (estimated USD cost)
├── post_slug (which page/post was analyzed)
└── created_at (when it happened)
```

**Why track this?** Every API call costs money. By tracking tokens and cost, you can see patterns: "I used $X on AI this month." You can optimize. You can set budgets.

**The indexes**: One on `(user_id, created_at DESC)` answers "show me this user's recent requests." Another on just `created_at` helps with "aggregate usage across all users in this time period." These two patterns cover the common queries.

---

## Patterns Worth Stealing

### Index Strategy
Every table here uses indexes thoughtfully, not recklessly. Common queries get indexes. Columns used in WHERE clauses get indexed. Multi-column indexes (like `(email, code, used)` in magic_codes) speed up specific query patterns.

```sql
-- Good: Supports the query "find unused codes for this email"
CREATE INDEX idx_magic_codes_lookup ON magic_codes(email, code, used);

-- Not in this codebase, but would be wasteful:
-- CREATE INDEX idx_every_column ON table(col1, col2, col3, col4, col5);
```

### Sensible Defaults
Tables have defaults that make sense:

```sql
-- Defaults reduce boilerplate in application code
used INTEGER DEFAULT 0,           -- New codes are unused
type TEXT NOT NULL DEFAULT 'page', -- Most things are pages
font TEXT DEFAULT 'default',       -- Fall back to default font
cost REAL DEFAULT 0,               -- Costs zero until we know otherwise
```

### Timestamps for Debugging
Every table with time-sensitive logic has timestamps:

```sql
created_at, expires_at, updated_at, locked_until, last_attempt
```

These answer questions like "Is this code expired?" and "Has too much time passed?" They're essential for debugging and for building features like "show me recent activity."

### Pragmatic Data Types
- `TEXT` for email addresses (not assumed to be unique at schema level unless needed)
- `INTEGER` for Unix timestamps (seconds since 1970; makes time math easy)
- `TEXT` for JSON (let the application layer validate structure)
- `REAL` for costs (floating-point math for money is generally fine for estimates)

### Constraint Use
- `PRIMARY KEY`: Enforces uniqueness (pages by slug, only one admin path per page)
- `UNIQUE`: Prevents duplicates (one settings row per key, one tracked email per failed_attempts)
- `NOT NULL`: Marks required fields (you can't have a page without content)

---

## Lessons Learned

### 1. Security Doesn't Get Added Later
Migration 002 exists immediately. The site was never vulnerable because protection was built in from the start. If auth had shipped without it, retrofitting would be messy.

### 2. Flexibility Through JSON
By using JSON for `hero` and `gutter_content`, the schema never needed to change when layout requirements did. That's powerful. But only use JSON for truly optional, variable-shape data.

### 3. Migrations Are Permanent Records
You never delete a migration file. Even if you later rolled back that table, the migration stays there. This is your audit trail. It tells the story of what your application needed.

### 4. Indexing Is About Query Patterns, Not Every Column
Notice which columns get indexed: email for lookups, timestamps for sorting and range queries, the primary key always (implicit). You're not indexing everything. You're indexing the questions you ask most often.

### 5. Timestamps Unlock Features
Created_at, updated_at, and expires_at allow you to:
- Sort by "newest first"
- Clean up old data (delete codes that expired 30 days ago)
- Show activity timelines
- Enforce business logic (is this code too old?)

They're not just nice to have. They're foundational.

---

## Running the Migrations

If you're setting up AutumnsGrove locally:

```bash
# Run migrations in order
npx wrangler d1 execute autumnsgrove-git-stats --file=migrations/001_magic_codes.sql
npx wrangler d1 execute autumnsgrove-git-stats --file=migrations/002_auth_security.sql
npx wrangler d1 execute autumnsgrove-git-stats --file=migrations/003_site_settings.sql
npx wrangler d1 execute autumnsgrove-posts --file=migrations/004_pages_table.sql --remote
npx wrangler d1 execute autumnsgrove-posts --file=migrations/005_ai_writing.sql
```

Note that 004 and 005 run against `autumnsgrove-posts` while 001-003 run against `autumnsgrove-git-stats`. These are two different D1 databases serving different purposes.

---

## The Deeper Idea

This foundation—these five tables and their indexes—is what makes AutumnsGrove work. Every feature you see (authentication, content management, AI assistance, configuration) rests on this schema.

When you're building something, this is how you think about it:
1. What data do I need to persist?
2. What queries will I ask most often?
3. What could go wrong, and how do I protect against it?
4. What might change later that I should plan for (JSON columns, flexibility)?

Then you write migrations. You keep them. You build on them. You learn from them.

This is the foundation. Everything else is just application logic running on top.

---

## Continue Your Tour

**Related exhibits:**

- **[The Architecture](/src/EXHIBIT.md)** — How the system uses this database
- **[The Engine Room](/src/routes/api/EXHIBIT.md)** — APIs that query these tables
- **[The Control Room](/src/routes/admin/EXHIBIT.md)** — Admin panel that reads/writes data
- **[The Content Gallery](/UserContent/EXHIBIT.md)** — Source content before database sync
- **[Edge Computing](/workers/EXHIBIT.md)** — Workers that write to D1
- **[The Automation Wing](/.github/EXHIBIT.md)** — GitHub Actions that sync content to D1

**[← Back to the Museum Entrance](/MUSEUM.md)**

---

*Written as a guide for learning web development. The AutumnsGrove database is a real, functioning example of these principles in practice.*
