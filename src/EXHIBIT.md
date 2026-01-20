# The Architecture

> *How a personal website actually works, from request to response.*

---

## What You're Looking At

This is the `src/` directory—the heart of AutumnsGrove. Everything a visitor sees, everything the admin panel does, every API call that powers the site lives here.

Before we dive in, understand this: **some building blocks come from elsewhere**. Components like `Button`, `Dialog`, and `toast` are imported from `@autumnsgrove/groveengine`. Utilities like `sanitizeMarkdown` and `validateCSRF` come from there too.

But the *architecture*—how these pieces connect, how data flows, how authentication works—that's what this codebase demonstrates. The engine gives you bricks. This codebase shows you how to build a house.

---

## The Request Lifecycle

Every request to AutumnsGrove follows this path:

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLOUDFLARE EDGE                          │
│  Your request hits a data center near you (not a central server)│
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      hooks.server.js                            │
│  The bouncer. Checks your tokens, validates CSRF, adds headers. │
│  Sets `event.locals.user` so every route knows who you are.     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     +page.server.js                             │
│  The data loader. Queries D1, checks permissions, prepares data.│
│  Runs on the server, never exposed to the browser.              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       +page.svelte                              │
│  The UI. Receives data as props, renders HTML, handles events.  │
│  Hydrates in the browser for interactivity.                     │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API Endpoints                              │
│  When the UI needs to mutate data (create post, upload image),  │
│  it calls /api/* endpoints that talk to D1/R2.                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Key Players

| File | What It Does |
|------|--------------|
| `hooks.server.js` | Intercepts every request. Validates auth tokens, generates CSRF tokens, sets security headers. The gatekeeper. |
| `app.html` | The HTML shell. Includes dark mode flash prevention and CSRF token in meta tag. |
| `app.css` | Global styles. Tailwind imports plus custom CSS variables. |
| `app.d.ts` | TypeScript definitions for `locals`, `platform.env`, etc. |
| `lib/auth/groveauth.ts` | OAuth 2.0 + PKCE client for Heartwood authentication. The key to "who is this user?" |
| `lib/utils/cookies.js` | Cookie parsing utilities. Simple but essential. |

---

## Authentication: How "Login" Actually Works

AutumnsGrove uses **OAuth 2.0 with PKCE** via [Heartwood](https://heartwood.grove.place), Grove's centralized auth service.

### The Flow

```
1. User clicks "Login"
   └─► /auth/login generates PKCE codes, redirects to Heartwood

2. User authenticates at Heartwood (Google, Discord, or magic code)
   └─► Heartwood redirects back to /auth/callback with auth code

3. /auth/callback exchanges code for tokens
   └─► Stores access_token + refresh_token in httpOnly cookies

4. Every subsequent request:
   └─► hooks.server.js reads cookies
   └─► Verifies access_token with Heartwood
   └─► If expired, uses refresh_token to get new access_token
   └─► Sets event.locals.user = { id, email, name }
```

### Key Files

- **`lib/auth/groveauth.ts`** — The OAuth client. Handles PKCE challenge generation, token exchange, verification, and refresh.
- **`routes/auth/login/+server.js`** — Initiates login, stores PKCE verifier in cookie
- **`routes/auth/callback/+server.js`** — Handles OAuth callback, exchanges code for tokens
- **`routes/auth/logout/+server.js`** — Revokes tokens, clears cookies

### The Clever Bit: Token Refresh Deduplication

Look at lines 19-25 of `hooks.server.js`:

```javascript
const refreshPromises = new Map();
```

When multiple concurrent requests hit with an expired token, they all try to refresh. Without deduplication, you'd hit Heartwood's API multiple times for the same user. This Map ensures only ONE refresh happens, and all concurrent requests wait for that same promise.

---

## Data Flow: How Posts Get Loaded

Let's trace what happens when someone visits `/blog`:

### 1. hooks.server.js runs first
- Checks cookies for `access_token`
- Verifies with Heartwood
- Sets `event.locals.user` (or null if not logged in)

### 2. routes/blog/+page.server.js loads data
```javascript
export async function load({ locals, platform }) {
  // Try D1 database first
  if (platform?.env?.POSTS_DB) {
    const result = await platform.env.POSTS_DB.prepare(
      `SELECT slug, title, date, tags, description
       FROM posts ORDER BY date DESC`
    ).all();
    // ... transform and return
  }

  // Fallback to filesystem (local dev)
  return { posts: getAllPosts(), user: locals.user };
}
```

Key insight: **D1 first, filesystem fallback**. This lets local development work without a database while production uses the real thing.

### 3. routes/blog/+page.svelte renders
The component receives `data.posts` and `data.user` as props, renders the post list.

---

## API Pattern: CRUD Operations

When the admin panel creates, updates, or deletes data, it calls API endpoints. Here's the pattern:

### routes/api/posts/+server.js

```javascript
// GET = list, POST = create
export async function GET({ platform, locals }) {
  // 1. Auth check
  if (!locals.user) throw error(401, "Unauthorized");

  // 2. Query D1
  const result = await platform.env.POSTS_DB.prepare(`...`).all();

  // 3. Return JSON
  return json({ posts: result.results });
}

export async function POST({ request, platform, locals }) {
  // 1. Auth check
  if (!locals.user) throw error(401, "Unauthorized");

  // 2. CSRF check (state-changing operation)
  if (!validateCSRF(request)) throw error(403, "Invalid origin");

  // 3. Validate & sanitize input
  const data = sanitizeObject(await request.json());

  // 4. Insert into D1
  await platform.env.POSTS_DB.prepare(`INSERT INTO...`).bind(...).run();

  // 5. Return success
  return json({ success: true, slug });
}
```

### The Pattern

1. **Auth first** — Always check `locals.user`
2. **CSRF for mutations** — GET is safe, POST/PUT/DELETE need CSRF
3. **Sanitize everything** — Never trust client input
4. **Validate before database** — Check lengths, formats, existence
5. **Meaningful errors** — Use proper HTTP status codes

---

## Security: Defense in Depth

Security isn't one thing—it's layers. Here's what AutumnsGrove does:

### Layer 1: CSRF Protection (hooks.server.js)
```javascript
if (["POST", "PUT", "DELETE", "PATCH"].includes(event.request.method)) {
  if (!validateCSRFToken(event.request, csrfToken)) {
    throw error(403, "Invalid CSRF token");
  }
}
```

### Layer 2: Security Headers (hooks.server.js)
```javascript
response.headers.set("X-Frame-Options", "DENY");
response.headers.set("X-Content-Type-Options", "nosniff");
response.headers.set("Content-Security-Policy", csp);
```

### Layer 3: Input Sanitization (API endpoints)
```javascript
const data = sanitizeObject(await request.json());
const html = sanitizeMarkdown(marked.parse(data.markdown_content));
```

### Layer 4: Auth on Every Endpoint
```javascript
if (!locals.user) throw error(401, "Unauthorized");
```

### Layer 5: Parameterized Queries (D1)
```javascript
// NEVER do this: `WHERE slug = '${slug}'` (SQL injection!)
// ALWAYS do this:
platform.env.POSTS_DB.prepare("WHERE slug = ?").bind(slug)
```

---

## What's Borrowed vs. Built

### From @autumnsgrove/groveengine

| Category | What |
|----------|------|
| **UI Components** | Button, Dialog, Select, Tabs, Badge, Input, toast |
| **Utilities** | validateCSRF, sanitizeObject, sanitizeMarkdown, api, apiRequest |
| **Charts** | Activity charts, contribution graphs |

### Built Here

| Category | What |
|----------|------|
| **Architecture** | How components connect, request lifecycle |
| **Auth Integration** | groveauth.ts, login/logout flows, token refresh |
| **All Routes** | Public pages, admin panel, API endpoints |
| **Database Schema** | migrations/, how data is structured |
| **Business Logic** | Post creation, gallery management, timeline generation |

The engine gives you ingredients. This codebase is the recipe.

---

## Directory Guide

```
src/
├── app.css          # Global styles, Tailwind imports
├── app.d.ts         # TypeScript: locals, platform.env types
├── app.html         # HTML shell with dark mode + CSRF
├── hooks.server.js  # THE GATEKEEPER - auth, CSRF, headers
├── lib/
│   ├── auth/        # Heartwood OAuth client
│   ├── components/  # Re-exports from engine + custom components
│   ├── config/      # Configuration constants
│   ├── content/     # Markdown processing utilities
│   ├── styles/      # Additional style utilities
│   └── utils/       # Cookies, helpers
├── routes/
│   ├── (public)     # blog/, gallery/, about/, contact/
│   ├── admin/       # THE CONTROL ROOM - CMS interface
│   ├── api/         # THE ENGINE ROOM - CRUD endpoints
│   └── auth/        # login, callback, logout
└── worker.js        # Cloudflare Workers entry point
```

---

## Where to Go Next

- **[The Control Room](/src/routes/admin/EXHIBIT.md)** — Deep dive into the 7,000-line admin panel
- **[The Engine Room](/src/routes/api/EXHIBIT.md)** — API architecture and patterns
- **[The Foundation](/migrations/EXHIBIT.md)** — Database schema design

---

## Lessons Learned

1. **Token refresh deduplication matters** — Without it, concurrent requests cause race conditions
2. **D1 + filesystem fallback** — Great pattern for dev/prod parity
3. **Security is layers** — No single defense is enough
4. **The engine is for building blocks, not architecture** — You still need to wire it together
5. **httpOnly cookies for tokens** — Never expose auth tokens to JavaScript

---

## Continue Your Tour

**Explore deeper into specific areas:**

- **[The Visitor Experience](/src/routes/EXHIBIT.md)** — Public-facing pages and routing
- **[The Control Room](/src/routes/admin/EXHIBIT.md)** — The admin panel CMS
- **[The Engine Room](/src/routes/api/EXHIBIT.md)** — REST API architecture
- **[The Workshop](/src/lib/EXHIBIT.md)** — Shared utilities and building blocks

**Related exhibits:**

- **[The Content Gallery](/UserContent/EXHIBIT.md)** — Where content files live
- **[Edge Computing](/workers/EXHIBIT.md)** — Cloudflare Workers patterns
- **[The Foundation](/migrations/EXHIBIT.md)** — Database schema
- **[The Security Lab](/tests/EXHIBIT.md)** — Security testing

**[← Back to the Museum Entrance](/MUSEUM.md)**

---

*This exhibit was written for Ariana, who wants to learn how websites actually work.*
