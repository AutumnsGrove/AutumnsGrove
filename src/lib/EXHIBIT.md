# The Workshop: Shared Utilities & Building Blocks

Welcome to the workshop—this is where all the pieces come together. Everything in `/src/lib` is designed to be reused across the site, shared utilities that make the whole system hum.

Think of this as a toolbox. You reach into it when you need something that's already been tested, thought through, and designed to work reliably. This file is your guide to what's in the toolbox and how to use it.

---

## What You're Looking At

The `/src/lib` directory contains five core module categories:

- **auth/** - OAuth 2.0 + PKCE authentication with Heartwood
- **content/** - Markdown parsing, rendering, and the "gutter" system for side content
- **utils/** - Helper functions (GitHub GraphQL, cookies, general utilities)
- **components/** - Reusable UI components, both local and re-exported from GroveEngine
- **config/** - Configuration objects (AI models, constants)

Everything here is designed to work together. When you're building a new page or feature, you'll find yourself importing from these modules repeatedly.

---

## Authentication Module (`auth/`)

AutumnsGrove uses **OAuth 2.0 with PKCE** for authentication via Heartwood, our shared auth service.

### The Architecture

**GroveAuth** (`groveauth.ts`) is a client library that handles the OAuth flow:

```typescript
// Create a client
const client = createGroveAuthClient({
  clientId: "autumnsgrove",
  clientSecret: process.env.GROVEAUTH_CLIENT_SECRET,
  redirectUri: `${origin}/auth/callback`,
});

// Get login URL with PKCE parameters
const { url, state, codeVerifier } = await client.getLoginUrl();

// Exchange authorization code for tokens
const tokens = await client.exchangeCode(code, codeVerifier);
```

### Why PKCE?

PKCE (Proof Key for Code Exchange) is a security extension to OAuth 2.0 that protects against authorization code interception. Even without a client secret, PKCE ensures that only the application that started the login flow can complete it.

The flow:
1. Generate a random `codeVerifier` (64 characters)
2. Hash it to create a `codeChallenge`
3. Send the challenge to the authorization server
4. Exchange the code with the verifier to prove you started the flow

### Token Operations

Once authenticated, you can:

```typescript
// Verify a token is still valid
const tokenInfo = await client.verifyToken(accessToken);

// Get user information
const user = await client.getUserInfo(accessToken);
// { sub, email, name, picture, provider }

// Refresh when expired
const newTokens = await client.refreshToken(refreshToken);

// Logout (revoke refresh token)
await client.revokeToken(refreshToken);
```

### Security Considerations

- **Redirect Validation** (`constants.ts`): Only whitelisted paths can receive post-login redirects
  - Prevents open redirect vulnerabilities
  - Add new admin routes to `ALLOWED_REDIRECTS` when you create them
  - The `validateRedirect()` function checks both absolute paths and sub-paths

- **Token Storage**: Tokens are stored in httpOnly cookies (set by server-side code)
  - httpOnly prevents JavaScript from accessing them (XSS protection)
  - Secure flag ensures they only travel over HTTPS

- **Error Handling**: The `GroveAuthError` class gives you structured error information
  - Check `error.code` for specific error types
  - Check `error.statusCode` to decide how to respond

---

## Content Module (`content/`)

This is where markdown becomes magic. The `markdown.js` file is the beating heart of how content flows from files into the site.

### The Markdown Pipeline

**Reading files at build time:**

```javascript
// Content is loaded at build time via import.meta.glob
// This works in both dev and production (including Cloudflare Workers)
const modules = import.meta.glob("/UserContent/Posts/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});
```

Once loaded, content goes through:
1. **Parse** - Extract frontmatter with `gray-matter`
2. **Render** - Convert markdown to HTML with custom `marked` renderer
3. **Process** - Extract headers for TOC, handle anchors, build gutter content
4. **Return** - Structured object with content + metadata

### The Gutter System

The gutter is that sidebar content you see next to blog posts. It can contain images, quotes, links—anything that provides context without disrupting the main text flow.

**How it works:**

```
UserContent/Posts/
  my-post/
    my-post.md (the blog post)
    gutter/
      manifest.json (defines what goes where)
      sidebar-image.png
      sidebar-quote.md
```

The manifest tells the system what to display and where:

```json
{
  "items": [
    {
      "type": "photo",
      "file": "sidebar-image.png",
      "position": 1,
      "caption": "A moment that inspired this"
    },
    {
      "type": "markdown",
      "file": "sidebar-quote.md",
      "position": 2
    }
  ]
}
```

**Supported gutter types:**
- `photo`/`image` - Images (local files or external URLs)
- `markdown`/`comment` - Formatted text content
- `emoji` - Small icons or graphics
- `gallery` - Collections of images with alt text and captions

### Custom Code Block Rendering

The markdown renderer has special handling for code blocks:

```javascript
// Markdown blocks are rendered as formatted HTML (like GitHub)
// This lets you show what markdown looks like when rendered

// Regular code blocks show the language tag and a copy button
renderer.code = function (token) {
  // Handles both old and new marked API signatures
  // Renders with syntax highlighting class
  // Includes one-click copy button
};
```

### Helper Functions You'll Use

```javascript
// Get all posts (sorted by date, newest first)
const posts = getAllPosts();
// [{ slug, title, date, tags, description }, ...]

// Get a single post with full content
const post = getPostBySlug("my-post");
// { slug, title, date, tags, description, content, headers, gutterContent }

// Extract headers for table of contents
const headers = extractHeaders(markdown);
// [{ level: 2, text: "Section Title", id: "section-title" }, ...]

// Process <!-- anchor:name --> comments to searchable markers
const html = processAnchorTags(html);

// Get the home/about/contact pages similarly
const home = getHomePage();
const about = getAboutPage();
const contact = getContactPage();
```

---

## GitHub Module (`utils/github.js`)

If you're showing GitHub data (commits, repos, stats), this is where the magic happens.

### Input Validation

```javascript
// Always validate GitHub usernames before API calls
if (!isValidUsername(username)) {
  throw new Error("Invalid GitHub username");
}

// GitHub usernames: 1-39 chars, alphanumeric + hyphens
// Cannot start/end with hyphen, no consecutive hyphens
```

### Making GraphQL Queries

GitHub's GraphQL API is powerful but requires proper authentication:

```javascript
// Get the right headers for the API
const headers = getGraphQLHeaders(token);
// { Authorization: "bearer TOKEN", Content-Type: "application/json", ... }

// Make a query
const response = await fetch(GITHUB_GRAPHQL_URL, {
  method: "POST",
  headers,
  body: JSON.stringify({
    query: GRAPHQL_USER_COMMITS_QUERY,
    variables: { username, first: 50, since: "2024-01-01" }
  })
});
```

### Constants to Know

```javascript
export const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";
export const MAX_REPOS_PAGES = 10;        // Don't paginate more than 10 times
export const DEFAULT_TIMEOUT = 60000;     // Give requests 60 seconds
```

### Pattern: REST vs GraphQL

- **REST API**: Simpler queries, but requires more requests to get related data
- **GraphQL API**: Single request gets everything, but requires token auth

Use REST for public data, GraphQL when you need complex relationships.

---

## Components (`components/`)

Most UI components are imported from GroveEngine, our shared component library. But a few are site-specific.

### Local Components (in `/src/lib/components/custom/`)

These are built here because they're specific to AutumnsGrove:

- **IconLegend.svelte** - Explains what different icons mean (custom visualization)
- **InternalsPostViewer.svelte** - Renders "internals" posts with special formatting
- **LogViewer.svelte** - Debug logs displayed in a readable format

### Imported from GroveEngine

Everything else comes from our shared component library:

```javascript
import {
  Button, Card, Badge, Dialog,
  Glass, GlassButton, GlassCard,
  ImageGallery, Lightbox,
  MarkdownEditor, GutterManager,
  ContentWithGutter, LeftGutter,
  TableOfContents, MobileTOC,
} from '$lib/components';
```

### Using Components

```svelte
<script>
  import { Card, Button, Badge } from '$lib/components';
</script>

<Card class="mb-4">
  <h2>Hello, Workshop</h2>
  <p>This is a glass card with some content.</p>
  <Button onclick={() => console.log('clicked')}>
    Do something
  </Button>
</Card>
```

---

## Configuration (`config/`)

### AI Models Configuration

The `ai-models.js` file defines all Claude models you can use:

```javascript
export const AI_MODELS = {
  haiku: {
    id: "claude-haiku-4-5-20251022",
    name: "Claude Haiku 4.5",
    pricing: {
      input: 1.0,    // per million tokens
      output: 5.0
    }
  },
  sonnet: {
    id: "claude-sonnet-4-20250514",
    // ...
  }
};

// Calculate costs
const cost = calculateCost("haiku", 100000, 50000);
// Returns cost in USD

// Get model ID
const modelId = getModelId("sonnet");
```

**Important:** Pricing is manually updated quarterly. The TODO at the top reminds you when to check again.

---

## Patterns Worth Stealing

Here are specific techniques used throughout the lib that you can apply elsewhere:

### 1. Build-Time Content Loading

```javascript
// Load files at build time, not runtime
const modules = import.meta.glob("path/**/*.md", {
  eager: true,        // Load immediately, don't lazy-load
  query: "?raw",      // Get raw text content
  import: "default"   // Extract default export
});
```

**Why?** Blazingly fast. The content exists in the bundle, no API calls needed.

### 2. Safe Redirect Validation

```javascript
// Prevent open redirects by checking against a whitelist
export function validateRedirect(path) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return '/admin'; // Never redirect to external sites
  }

  // Use URL constructor to normalize path traversal attempts
  const url = new URL(path, 'http://dummy.local');
  const normalized = url.pathname;

  // Allow both exact paths and sub-paths
  const isAllowed = ALLOWED_REDIRECTS.some(allowed =>
    normalized === allowed || normalized.startsWith(`${allowed}/`)
  );

  return isAllowed ? normalized : '/admin';
}
```

### 3. Structured Error Classes

```typescript
export class GroveAuthError extends Error {
  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

// Then catch with confidence
try {
  await client.exchangeCode(code, verifier);
} catch (error) {
  if (error instanceof GroveAuthError) {
    if (error.code === 'token_error') {
      // Handle token errors specifically
    }
    console.error(`Auth error: ${error.message} (${error.statusCode})`);
  }
}
```

### 4. Flexible Type Signatures

```javascript
// Handle both old and new function signatures gracefully
renderer.code = function (token) {
  const code = typeof token === 'string' ? token : token.text;
  const language = typeof token === 'string' ? arguments[1] : token.lang;
  // Works with both API versions
};
```

### 5. Optional Security: Cost Limiting

```javascript
export const MONTHLY_COST_CAP = {
  enabled: true,
  maxCostUSD: 5.0,        // Per user per month
  warningThreshold: 0.8   // Warn at 80% of limit
};
```

This prevents runaway costs from malicious or accidental usage.

---

## Lessons Learned

### The Gutter System

The gutter system exists because blog content often wants *companion context* that doesn't interrupt the main flow. Images, quotes, related links—they live beside, not within. The manifest approach means content creators don't need to touch code; they add files and configure them in JSON.

### Why OAuth + PKCE

Session-based auth works, but OAuth 2.0 + PKCE is more flexible. It separates concerns: Heartwood handles identity, this app handles permissions. If you ever want to let users log in elsewhere, or integrate with other services, PKCE-based OAuth makes that trivial.

### Build-Time Loading

Content files are loaded at build time because:
- **Speed**: No runtime parsing, just serve pre-processed data
- **Safety**: Validation happens once, not per request
- **SEO**: Full content exists in HTML for crawlers
- **Offline**: In a PWA, the whole site works offline

This is why the site feels instant.

### Keep Validation at the Door

Every external input (GitHub usernames, redirect paths, token verification) gets validated early with clear error messages. This prevents entire categories of bugs and security issues from ever reaching your business logic.

---

## The Connection

Everything here is designed to work together. When you're building a new page:

1. Define content in `/UserContent`
2. Use `markdown.js` to fetch and process it
3. Use `components` to render it
4. Use `auth/` if you need permissions
5. Use `config/` for constants
6. Use `utils/` for helpers

The workshop isn't just a place to find things—it's a set of proven approaches for building this site well. When you need to add something new, look here first. Most likely, someone's already solved it.

---

*This is your space. Make it feel like home by understanding how the pieces fit together.*
