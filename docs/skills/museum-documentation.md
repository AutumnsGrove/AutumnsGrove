# Museum Documentation: The Art of Inviting Code Tours

> *Transform codebases into living museums where documentation becomes a conversation, not a reference manual.*

---

## When to Use This Skill

Activate this skill when:
- Documenting a codebase, directory, feature, or system
- Writing EXHIBIT.md, README.md, or architectural documentation
- Explaining complex technical concepts to learners
- Creating onboarding materials for new developers
- Turning legacy code into educational resources

---

## The Museum Philosophy

Documentation isn't a chore. It's hospitality.

When someone opens your codebase, they're a visitor. They didn't build these walls. They don't know why that function exists or why you chose SQLite over Postgres. Your job is to be their guide, to walk beside them and say, "Here's what you're looking at. Here's why it matters. Here's what you can learn from it."

The museum style transforms technical writing from "reference material" into "invitation to understand."

---

## Core Principles

### 1. Orient Before You Explain

Every exhibit opens with context. Before diving into implementation details, tell the reader:
- What they're looking at
- Why it exists
- Who it's for

```markdown
## What You're Looking At

This is the `workers/` directory. These are Cloudflare Workers that run
at the edge of the internet. When someone visits the site, these tiny
programs intercept the request before it reaches any central server.

Think of them as greeters stationed at every door, not a single
receptionist in a lobby.
```

### 2. Explain the Why, Not Just the What

Code shows what. Documentation explains why.

**Instead of:**
> The `refreshPromises` Map stores pending token refresh operations.

**Write:**
> When multiple requests hit with an expired token, they all try to refresh it simultaneously. Without coordination, you'd hammer the auth server with duplicate requests. The `refreshPromises` Map ensures only ONE refresh happens. All concurrent requests wait for that same promise. It's the difference between five people calling the same pizza place versus one person ordering for the group.

### 3. Use Metaphors That Stick

Technical concepts become memorable when connected to familiar experiences.

| Concept | Museum Metaphor |
|---------|-----------------|
| Database | Filing cabinets (slow but definitive) |
| Cache | Quick-lookup shelf (fast but might be stale) |
| API | Service desk (ask questions, get answers) |
| Auth | Bouncer at the door (checks credentials) |
| Middleware | Security checkpoint (everyone passes through) |
| Workers | Distributed greeters (everywhere at once) |

### 4. Show Real Code, Then Explain It

Don't describe code abstractly. Show a real example, then walk through it.

```javascript
// The actual code
export async function POST({ request, platform, locals }) {
  if (!locals.user) throw error(401, "Unauthorized");
  if (!validateCSRF(request)) throw error(403, "Invalid origin");

  const data = sanitizeObject(await request.json());
  // ...
}
```

Then explain the story:
> Every POST request follows the same ritual. First, check if they're logged in. Then verify the request came from our site, not a malicious page. Finally, clean the input before trusting it. This pattern repeats across every endpoint. Once you understand one, you understand them all.

---

## The Exhibit Structure

Every piece of museum documentation follows this anatomy:

```
┌─────────────────────────────────────────────────────────────────┐
│  TITLE + TAGLINE                                                │
│  A poetic one-liner that captures the essence                   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  WHAT YOU'RE LOOKING AT                                         │
│  Orient the reader. What is this? Why does it exist?            │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  THE TOUR (Main Content)                                        │
│  Walk through each section with explanations, code, diagrams    │
│  Use galleries, parts, or sections to organize                  │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  PATTERNS WORTH STEALING                                        │
│  Transferable lessons. What can readers apply elsewhere?        │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  LESSONS LEARNED                                                │
│  Honest reflection. What worked? What would you change?         │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  CONTINUE YOUR TOUR                                             │
│  Links to related exhibits. Never leave visitors stranded.      │
└─────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│  CLOSING LINE                                                   │
│  A poetic or meaningful closer. The exhibit's signature.        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Visual Elements

### ASCII Flow Diagrams

Use box-drawing characters to show data flow, request lifecycles, or architecture:

```
User Request
    │
    ▼
┌─────────────┐     cache hit     ┌─────────────┐
│  KV Cache   │ ─────────────────►│   Return    │
└─────────────┘                   └─────────────┘
    │ cache miss
    ▼
┌─────────────┐
│  Database   │
└─────────────┘
    │
    ▼
┌─────────────┐
│ Update Cache│
└─────────────┘
```

**Character palette:**
- Box corners: `┌ ┐ └ ┘` (square) or `╭ ╮ ╰ ╯` (rounded)
- Lines: `─ │`
- Arrows: `► ◄ ▲ ▼ → ← ↑ ↓`
- Joins: `├ ┤ ┬ ┴ ┼`

### Tables for Quick Reference

Use tables to summarize patterns, files, or concepts:

```markdown
| File | What It Does |
|------|--------------|
| `hooks.server.js` | The gatekeeper. Auth, CSRF, headers. |
| `+page.server.js` | Data loader. Runs before rendering. |
| `+page.svelte` | The UI. What visitors actually see. |
```

### Code Blocks with Context

Always explain what the code demonstrates:

```markdown
### The Clever Bit: Token Refresh Deduplication

Look at lines 19-25 of `hooks.server.js`:

\`\`\`javascript
const refreshPromises = new Map();
\`\`\`

When multiple concurrent requests hit with an expired token, they all
try to refresh. Without deduplication, you'd hit the auth API multiple
times for the same user. This Map ensures only ONE refresh happens.
```

---

## Voice and Tone

### Do

- Write like you're walking beside the reader
- Use "you" and "we" naturally
- Explain decisions, not just implementations
- Admit imperfections ("This code isn't perfect. You'll find...")
- Include personal touches ("Written for Ariana, who wants to learn...")
- Use short paragraphs (2-4 sentences typically)
- Vary sentence rhythm

### Avoid

- Em-dashes (use commas, periods, or parentheses)
- The "not X, but Y" construction (describe directly instead)
- Corporate jargon: "leverage," "robust," "seamless," "innovative"
- Heavy transitions: "Furthermore," "Moreover," "Additionally"
- Passive voice when active is clearer
- Hedging language: "might," "perhaps," "it seems"

### Tone Examples

**Instead of:**
> This module provides robust functionality for seamless authentication integration.

**Write:**
> This is where login happens. When someone proves they own an email address, this code decides what they can access.

**Instead of:**
> The aforementioned pattern leverages caching to optimize performance.

**Write:**
> We check the cache first. If the data's there, we skip the slow database call entirely.

---

## The Term Table Pattern

For documentation with specialized vocabulary, include a term table early:

```markdown
## Terms You'll See

| Term | Meaning |
|------|---------|
| **D1** | Cloudflare's SQLite database at the edge |
| **R2** | Cloudflare's object storage (like S3) |
| **KV** | Key-value store for caching |
| **Edge** | Servers distributed globally, close to users |
| **PKCE** | Security extension for OAuth (pronounced "pixie") |
| **Hydration** | When JavaScript takes over server-rendered HTML |
```

This prevents readers from getting lost in unfamiliar terminology.

---

## Museum Organization Patterns

### For a Full Codebase

Create a central `MUSEUM.md` with links to wing exhibits:

```markdown
# Welcome to the [Project] Museum

## The Wings

| Wing | Path | Description |
|------|------|-------------|
| [The Architecture](/src/EXHIBIT.md) | `src/` | How everything connects |
| [The Engine Room](/src/api/EXHIBIT.md) | `src/api/` | REST API endpoints |
| [The Foundation](/migrations/EXHIBIT.md) | `migrations/` | Database schema |
```

### For a Single Directory

Create an `EXHIBIT.md` that covers:
1. What this directory contains
2. How files relate to each other
3. Key patterns used here
4. Connections to other parts of the system

### For a Complex Feature

Structure as "galleries" or "parts":

```markdown
## Gallery 1: The Data Layer
## Gallery 2: The API Endpoints
## Gallery 3: The Frontend Components
## Gallery 4: Security Considerations
```

---

## Closing Signatures

End each exhibit with a meaningful closer. These aren't mandatory flourishes; they're the exhibit's signature.

Examples:
- *"This is where every post begins. A file. A folder. Words waiting to become pages."*
- *"Security isn't a feature. It's a foundation. These tests make sure the foundation holds."*
- *"Welcome to the edge."*
- *"That's the engine room. That's where the magic happens."*
- *"The best way to learn is to see how someone else solved the problem you're facing."*

---

## Validation Checklist

Before finishing museum documentation, verify:

**Structure:**
- [ ] Title with poetic tagline
- [ ] "What You're Looking At" section
- [ ] Clear organization (galleries, parts, or sections)
- [ ] "Patterns Worth Stealing" or equivalent
- [ ] "Lessons Learned" section
- [ ] "Continue Your Tour" with related links
- [ ] Meaningful closing line

**Visual Elements:**
- [ ] At least one ASCII diagram (for process-based content)
- [ ] Tables for patterns, files, or terms
- [ ] Code blocks with explanations
- [ ] No walls of text without breaks

**Voice:**
- [ ] No em-dashes
- [ ] No "not X, but Y" patterns
- [ ] No corporate jargon (robust, seamless, leverage)
- [ ] Short paragraphs (2-4 sentences)
- [ ] Direct, warm tone
- [ ] Explains why, not just what

**Completeness:**
- [ ] Reader knows what they're looking at
- [ ] Key files or concepts are explained
- [ ] Connections to other system parts are clear
- [ ] Imperfections are acknowledged honestly

---

## Example: Minimal Exhibit

```markdown
# The Utils Directory

> *Small tools that make everything else possible.*

---

## What You're Looking At

This is `/src/utils/`. Every function here solves a specific problem
that comes up repeatedly across the codebase. Think of it as a toolbox.
When you need to format a date, validate an email, or escape HTML,
you reach in here.

---

## The Key Tools

| File | Purpose |
|------|---------|
| `dates.js` | Format timestamps for humans |
| `validation.js` | Check emails, URLs, slugs |
| `sanitize.js` | Clean user input safely |

---

## Patterns Worth Stealing

### 1. Pure Functions

Every utility here takes input and returns output. No side effects.
No global state. This makes them trivial to test and safe to use anywhere.

### 2. Fail Gracefully

```javascript
export function formatDate(timestamp) {
  if (!timestamp) return '';
  try {
    return new Date(timestamp).toLocaleDateString();
  } catch {
    return '';
  }
}
```

Bad input returns an empty string, not an explosion.

---

## Continue Your Tour

- **[The Architecture](/src/EXHIBIT.md)** — Where these utilities get used
- **[The API](/src/api/EXHIBIT.md)** — Validation in action

---

*Small tools. Big impact. This is where reliability lives.*
```

---

## Integration with Other Skills

**Before writing:** If the system has naming conventions or terminology, review those first.

**While writing:** Apply warm, clear voice consistently. Show real code. Explain decisions.

**After writing:** Walk through as a newcomer. Does the tour make sense? Can someone follow the path?

---

## The Deeper Idea

Museum documentation isn't about being clever. It's about respecting your reader's time and intelligence. They came to learn. Your job is to teach.

Write documentation you'd want to read at 2 AM when you're debugging something urgent. Clear. Warm. Honest. Helpful.

Make every codebase feel like a place someone cared about.

---

*"Code is knowledge, and knowledge shouldn't disappear."*
