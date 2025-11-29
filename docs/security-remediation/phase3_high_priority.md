# Phase 3: High Priority Security Hardening (Day 2)

**Duration**: 8 hours
**Priority**: HIGH
**Agent**: house-coder (Sonnet model)
**Risk Reduction**: 10%
**Dependencies**: Phase 1 & 2 completed (or can run after Phase 2)

---

## Overview

Implement critical security hardening measures:
1. Remove SVG upload support (eliminates file-based XSS vector)
2. Implement CSP with nonces (prevents inline script injection)
3. Add rate limiting (prevents brute force & DoS)
4. Secure gallery endpoint (requires authentication)
5. Add R2 cache headers (prevents unauthorized caching)

**CVSS Scores**: 7.8 (SVG), 7.2 (CSP), 7.0 (Rate Limiting), 6.8 (Gallery Auth), 6.5 (Cache-Control)

---

## Task Breakdown

### Task 1: Remove SVG Upload Support (1 hour)

**File**: `src/routes/api/images/upload/+server.js`

**Issue**: Lines 45-47
- SVG files allowed without sanitization
- Can contain embedded JavaScript
- `image/svg+xml` MIME type processed as code

**Fix**:
```javascript
// Line 1 - Add import at top
import { error } from '@sveltejs/kit';

// Lines 43-60 - Update MIME type validation
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif'
  // REMOVED: 'image/svg+xml'
];

const mimeType = file.type;
if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
  throw error(400, `File type ${mimeType} not allowed. Supported: JPEG, PNG, WebP, AVIF`);
}

// Lines 65-75 - Add file extension validation (defense-in-depth)
const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
const fileExtension = filename.slice(filename.lastIndexOf('.')).toLowerCase();

if (!validExtensions.includes(fileExtension)) {
  throw error(400, `Invalid file extension: ${fileExtension}. Use: ${validExtensions.join(', ')}`);
}

// Lines 80-90 - Add explicit rejection of SVG
if (fileExtension === '.svg' || mimeType === 'image/svg+xml') {
  throw error(400, 'SVG uploads are not supported for security reasons');
}
```

**Test**:
```javascript
// Should FAIL with 400 error:
const formData = new FormData();
formData.append('file', svgFile, 'test.svg');

const response = await fetch('/api/images/upload', {
  method: 'POST',
  body: formData
});

// Expected: 400 - "SVG uploads are not supported"
```

**Database Migration** (if needed):
```sql
-- Mark existing SVG uploads as unsafe (add status column if not exists)
UPDATE images SET status = 'unsafe_svg'
WHERE mime_type = 'image/svg+xml' OR filename LIKE '%.svg';

-- Archive SVG references
CREATE TABLE archived_images AS
SELECT * FROM images
WHERE mime_type = 'image/svg+xml' OR filename LIKE '%.svg';

-- Delete SVG uploads
DELETE FROM images
WHERE mime_type = 'image/svg+xml' OR filename LIKE '%.svg';
```

---

### Task 2: Implement CSP with Nonces (2.5 hours)

**Files**:
1. `src/hooks.server.js` (main CSP implementation)
2. `src/lib/utils/csp.js` (nonce utility)
3. `src/app.html` (layout changes - optional but recommended)

**New File**: `src/lib/utils/csp.js`

```javascript
/**
 * CSP Nonce Utilities
 * Generate unique nonce for each request to allow inline scripts safely
 */

/**
 * Generate cryptographically secure nonce
 * @returns {string} Base64-encoded 32-byte nonce
 */
export function generateNonce() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  // Use URL-safe base64
  return btoa(String.fromCharCode.apply(null, array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Build CSP header value with nonce
 * @param {string} nonce - Generated nonce value
 * @param {string} environment - 'development' or 'production'
 * @returns {string} Complete CSP header value
 */
export function buildCSPHeader(nonce, environment = 'production') {
  const isDev = environment === 'development';

  return [
    // Default: only from same origin
    `default-src 'self'`,

    // Scripts: self + nonce + trusted CDN
    `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://cdn.jsdelivr.net https://cdn.mermaid.io`,

    // Styles: self + nonce + CDN
    `style-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://cdn.jsdelivr.net https://fonts.googleapis.com`,

    // Images: self + CDN + data URIs
    `img-src 'self' https://cdn.autumnsgrove.com https://api.github.com https://workers.cloudflare.com data:`,

    // Fonts
    `font-src 'self' https://fonts.gstatic.com data:`,

    // Connect (API calls)
    `connect-src 'self' https://api.github.com https://workers.cloudflare.com`,

    // Prevent framing
    `frame-ancestors 'none'`,

    // Base URI restriction
    `base-uri 'self'`,

    // Form submission
    `form-action 'self'`,

    // Development: allow eval for dev tools
    ...(isDev ? [`script-src-attr 'none'`, `script-src-elem 'self' 'nonce-${nonce}' 'unsafe-inline'`] : [])
  ].join('; ');
}

/**
 * Create CSP report-only header for testing
 * (Doesn't block, only logs violations)
 */
export function buildCSPReportOnlyHeader(nonce, reportUri = '/api/security/csp-report') {
  return buildCSPHeader(nonce) + `; report-uri ${reportUri}`;
}
```

**Update**: `src/hooks.server.js`

```javascript
// Add at top of file
import { generateNonce, buildCSPHeader } from '$lib/utils/csp.js';

export async function handle({ event, resolve }) {
  // ... existing session handling code ...

  // ==========================================
  // NEW: Generate CSP Nonce for This Request
  // ==========================================
  const cspNonce = generateNonce();
  event.locals.cspNonce = cspNonce;

  const response = await resolve(event);

  // Existing security headers...
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // ==========================================
  // NEW: CSP Header with Nonce
  // ==========================================
  if (event.url.hostname !== 'localhost' && event.url.hostname !== '127.0.0.1') {
    const env = event.url.hostname === 'localhost' ? 'development' : 'production';
    response.headers.set('Content-Security-Policy', buildCSPHeader(cspNonce, env));
  }

  return response;
}
```

**Update**: `src/app.html` (optional - adds nonce to script tags)

```html
<!-- Line 4 - in <head> -->
<script nonce="{data.cspNonce}">
  // Global app initialization
  console.log('App initialized with CSP nonce');
</script>

<!-- Or in <svelte:head> in any component: -->
<svelte:head>
  <script nonce="{$page.data.cspNonce}">
    // Component-specific initialization
  </script>
</svelte:head>
```

**Update Components** - Use nonce in Svelte components:

```svelte
<script>
  import { page } from '$app/stores';

  let nonce = '';
  onMount(() => {
    // Get nonce from page data
    nonce = $page.data.cspNonce || '';
  });
</script>

<!-- Use nonce in inline scripts -->
<svelte:head>
  <script nonce="{nonce}">
    console.log('This script is allowed by CSP nonce');
  </script>
</svelte:head>
```

**Test**:
```javascript
// Check CSP header is present
const response = await fetch('https://autumnsgrove.com/');
const cspHeader = response.headers.get('content-security-policy');
console.log(cspHeader);
// Should contain: "script-src 'self' 'nonce-xxx'"

// Verify nonce is unique per request
const response1 = await fetch('https://autumnsgrove.com/');
const response2 = await fetch('https://autumnsgrove.com/');
const nonce1 = response1.headers.get('content-security-policy').match(/nonce-([a-zA-Z0-9_-]+)/)[1];
const nonce2 = response2.headers.get('content-security-policy').match(/nonce-([a-zA-Z0-9_-]+)/)[1];
console.assert(nonce1 !== nonce2, 'Nonces should be unique per request');
```

---

### Task 3: Add Rate Limiting to All Endpoints (2.5 hours)

**File**: `src/lib/utils/rateLimit.js` (NEW)

```javascript
/**
 * Rate Limiting Utilities
 * Prevents brute force attacks and DoS
 */

/**
 * In-memory rate limiter with sliding window algorithm
 * Use Redis in production for distributed rate limiting
 */
class RateLimiter {
  constructor() {
    this.requests = new Map(); // ip -> [timestamps]
  }

  /**
   * Check if request is allowed
   * @param {string} identifier - IP address or user ID
   * @param {number} maxRequests - Max requests allowed
   * @param {number} windowMs - Time window in milliseconds
   * @returns {boolean} True if request allowed, false if rate limited
   */
  isAllowed(identifier, maxRequests = 60, windowMs = 60000) {
    const now = Date.now();
    const key = `${identifier}-${Math.floor(now / windowMs)}`;

    if (!this.requests.has(key)) {
      this.requests.set(key, []);
    }

    const timestamps = this.requests.get(key);

    // Clean old entries (older than 2 windows)
    if (timestamps.length > 0 && timestamps[0] < now - (windowMs * 2)) {
      timestamps.shift();
    }

    if (timestamps.length >= maxRequests) {
      return false;
    }

    timestamps.push(now);
    return true;
  }

  /**
   * Get current request count for identifier
   */
  getCount(identifier, windowMs = 60000) {
    const now = Date.now();
    const key = `${identifier}-${Math.floor(now / windowMs)}`;
    return (this.requests.get(key) || []).length;
  }
}

// Singleton instance
const limiter = new RateLimiter();

/**
 * Express/SvelteKit middleware for rate limiting
 * @param {number} maxRequests - Max requests per window
 * @param {number} windowMs - Window in milliseconds
 * @param {function} keyGenerator - Function to extract identifier (default: IP)
 */
export function createRateLimitMiddleware(maxRequests = 60, windowMs = 60000, keyGenerator = null) {
  return function rateLimit(event) {
    // Extract identifier (IP address by default)
    const identifier = keyGenerator
      ? keyGenerator(event)
      : event.request.headers.get('x-forwarded-for') || event.clientAddress || 'unknown';

    const isAllowed = limiter.isAllowed(identifier, maxRequests, windowMs);

    if (!isAllowed) {
      const retryAfter = Math.ceil(windowMs / 1000);
      return {
        status: 429,
        headers: {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': (Date.now() + windowMs).toString()
        },
        body: `Rate limited. Retry after ${retryAfter} seconds.`
      };
    }

    return null; // Allow request
  };
}

/**
 * Rate limit configurations for different endpoint types
 */
export const RATE_LIMITS = {
  // Auth endpoints: 5 attempts per 15 minutes
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 },

  // API write endpoints: 60 per minute
  apiWrite: { maxRequests: 60, windowMs: 60 * 1000 },

  // API read endpoints: 120 per minute
  apiRead: { maxRequests: 120, windowMs: 60 * 1000 },

  // Upload endpoints: 10 per hour
  upload: { maxRequests: 10, windowMs: 60 * 60 * 1000 },

  // Public endpoints: 300 per minute
  public: { maxRequests: 300, windowMs: 60 * 1000 }
};
```

**Update**: `src/hooks.server.js`

```javascript
// Add import
import { createRateLimitMiddleware, RATE_LIMITS } from '$lib/utils/rateLimit.js';

export async function handle({ event, resolve }) {
  // ... existing code ...

  // ==========================================
  // NEW: Rate Limiting Middleware
  // ==========================================

  // Rate limit authentication endpoints (strict)
  if (event.url.pathname.startsWith('/api/auth/')) {
    const rateLimitCheck = createRateLimitMiddleware(
      RATE_LIMITS.auth.maxRequests,
      RATE_LIMITS.auth.windowMs
    )(event);

    if (rateLimitCheck) {
      return new Response(rateLimitCheck.body, {
        status: rateLimitCheck.status,
        headers: rateLimitCheck.headers
      });
    }
  }

  // Rate limit upload endpoints (strict)
  if (event.url.pathname.startsWith('/api/images/upload')) {
    const rateLimitCheck = createRateLimitMiddleware(
      RATE_LIMITS.upload.maxRequests,
      RATE_LIMITS.upload.windowMs
    )(event);

    if (rateLimitCheck) {
      return new Response(rateLimitCheck.body, {
        status: rateLimitCheck.status,
        headers: rateLimitCheck.headers
      });
    }
  }

  // Rate limit API write endpoints (moderate)
  if (event.url.pathname.startsWith('/api/') &&
      ['POST', 'PUT', 'DELETE', 'PATCH'].includes(event.request.method)) {
    const rateLimitCheck = createRateLimitMiddleware(
      RATE_LIMITS.apiWrite.maxRequests,
      RATE_LIMITS.apiWrite.windowMs
    )(event);

    if (rateLimitCheck) {
      return new Response(rateLimitCheck.body, {
        status: rateLimitCheck.status,
        headers: rateLimitCheck.headers
      });
    }
  }

  // Rate limit public API endpoints (loose)
  if (event.url.pathname.startsWith('/api/public/')) {
    const rateLimitCheck = createRateLimitMiddleware(
      RATE_LIMITS.public.maxRequests,
      RATE_LIMITS.public.windowMs
    )(event);

    if (rateLimitCheck) {
      return new Response(rateLimitCheck.body, {
        status: rateLimitCheck.status,
        headers: rateLimitCheck.headers
      });
    }
  }

  // Continue with existing logic
  const response = await resolve(event);

  // ... existing security headers ...

  return response;
}
```

**Test**:
```javascript
// Simulate rapid requests to auth endpoint
const responses = [];
for (let i = 0; i < 10; i++) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: 'test@example.com' })
  });
  responses.push(response.status);
}

// First 5 should succeed (200-400 range), rest should be 429
console.log(responses);
// Expected: [400, 400, 400, 400, 400, 429, 429, 429, 429, 429]
```

---

### Task 4: Secure Gallery Endpoint with Authentication (1.5 hours)

**File**: `src/routes/api/gallery/+server.js` (or `/images` endpoint)

**Issue**: Public gallery access allows browsing all images without auth

**Fix**:
```javascript
// Line 1 - Add imports
import { error } from '@sveltejs/kit';

// Line 5 - Restrict to authenticated users only
export async function GET({ locals, url, platform }) {
  // Check authentication
  if (!locals.user) {
    throw error(401, 'Authentication required to access gallery');
  }

  // Optional: Check user permissions (admin only for sensitive gallery)
  if (!locals.user.isAdmin) {
    // Return only user's own uploads
    // Implementation depends on your data model
  }

  // Existing gallery logic...
  const galleryItems = await platform.env.DB.prepare(
    'SELECT * FROM images WHERE user_id = ? OR is_public = true ORDER BY created_at DESC'
  ).bind(locals.user.id).all();

  return new Response(JSON.stringify(galleryItems));
}

// Also protect DELETE with auth
export async function DELETE({ locals, url, platform }) {
  if (!locals.user) {
    throw error(401, 'Authentication required');
  }

  const imageId = url.searchParams.get('id');

  // Verify ownership
  const image = await platform.env.DB.prepare(
    'SELECT user_id FROM images WHERE id = ?'
  ).bind(imageId).first();

  if (!image || image.user_id !== locals.user.id) {
    throw error(403, 'Not authorized to delete this image');
  }

  // Delete from R2 and database...
}
```

**Update**: Component that displays gallery

```svelte
<script>
  import { page } from '$app/stores';

  let galleryItems = [];
  let error = '';

  onMount(async () => {
    // Check if user is authenticated
    if (!$page.data.user) {
      error = 'You must be logged in to view the gallery';
      return;
    }

    try {
      const response = await fetch('/api/gallery');

      if (response.status === 401) {
        error = 'Authentication required. Please log in.';
        return;
      }

      if (!response.ok) {
        throw new Error(`Gallery error: ${response.status}`);
      }

      galleryItems = await response.json();
    } catch (err) {
      error = err.message;
    }
  });
</script>

{#if error}
  <p class="error">{error}</p>
{:else if galleryItems.length === 0}
  <p>No images in gallery</p>
{:else}
  <div class="gallery">
    {#each galleryItems as item}
      <img src={item.url} alt={item.title} />
    {/each}
  </div>
{/if}
```

**Test**:
```javascript
// Unauthenticated request should fail
const response = await fetch('/api/gallery');
console.assert(response.status === 401, 'Gallery should require auth');

// Authenticated request should succeed
const authResponse = await fetch('/api/gallery', {
  credentials: 'include' // Include cookies
});
console.assert(authResponse.status === 200, 'Gallery should work with auth');
```

---

### Task 5: Add R2 Cache-Control Headers (1.5 hours)

**File**: `src/routes/api/images/[id]/+server.js` or R2 upload handler

**Issue**: Browser/Cloudflare cache headers not set, allows unauthorized caching

**Fix**:
```javascript
// In image upload handler
export async function POST({ request, platform, locals }) {
  // ... existing validation ...

  // Upload to R2 with cache headers
  const arrayBuffer = await file.arrayBuffer();
  const objectName = `${timestamp}-${sanitizedFilename}`;

  const uploadResponse = await platform.env.R2_BUCKET.put(objectName, arrayBuffer, {
    customMetadata: {
      'uploaded-by': locals.user?.id || 'anonymous',
      'upload-date': new Date().toISOString(),
      'original-filename': filename
    },
    httpMetadata: {
      // PUBLIC images: cache for 30 days
      cacheControl: isPublic
        ? 'public, max-age=2592000, immutable'  // 30 days
        : 'private, max-age=604800, must-revalidate',  // 7 days, must revalidate
      contentType: file.type,
      contentDisposition: `inline; filename="${filename}"`
    }
  });

  // When serving image from R2
  return new Response(imageData, {
    headers: {
      'Content-Type': 'image/jpeg', // Or appropriate MIME type
      'Cache-Control': isPublic
        ? 'public, max-age=2592000, immutable'
        : 'private, max-age=604800, must-revalidate, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Cross-Origin-Resource-Policy': 'cross-origin', // Allow CDN
      'Permissions-Policy': 'none'
    }
  });
}

// For Cloudflare CDN integration
export async function GET({ params, platform, request }) {
  const imageId = params.id;

  // Get image from R2
  const object = await platform.env.R2_BUCKET.get(imageId);

  if (!object) {
    throw error(404, 'Image not found');
  }

  // Set cache headers based on sensitivity
  const isSensitive = object.customMetadata?.isSensitive === 'true';

  return new Response(object.body, {
    headers: {
      'Content-Type': object.httpMetadata?.contentType || 'image/jpeg',
      'Cache-Control': isSensitive
        ? 'private, max-age=0, no-cache, no-store, must-revalidate'  // No caching
        : 'public, max-age=2592000, immutable',  // 30 days caching
      'ETag': object.etag,
      'Last-Modified': object.uploaded?.toUTCString()
    }
  });
}
```

**Cloudflare Worker** (if using Cloudflare Pages):

```javascript
// In _middleware.ts
export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  // Cache control for images
  if (url.pathname.startsWith('/images/')) {
    const response = await context.next();

    // Apply cache headers
    const newResponse = new Response(response.body, response);

    newResponse.headers.set(
      'Cache-Control',
      'public, max-age=2592000, immutable'
    );
    newResponse.headers.set('CDN-Cache-Control', 'max-age=2592000');

    return newResponse;
  }

  return context.next();
}
```

**Test**:
```javascript
// Check cache headers on image response
const response = await fetch('https://cdn.autumnsgrove.com/images/sample.jpg');

const cacheControl = response.headers.get('cache-control');
console.log('Cache-Control:', cacheControl);
// Should be: 'public, max-age=2592000, immutable' or 'private, max-age=604800'

// Verify private images not cached
const privateResponse = await fetch('https://autumnsgrove.com/api/images/private/123');
const privateCacheControl = privateResponse.headers.get('cache-control');
console.assert(privateCacheControl.includes('no-store'), 'Private images should not be cached');
```

---

## Dependencies

**Before Starting**:
- ✅ Phase 1 & 2 completed
- ✅ `crypto.getRandomValues()` available (Node 15+, all browsers)
- ✅ No new npm packages needed
- ✅ Cloudflare R2 bucket configured

**Optional**:
- Redis for distributed rate limiting (for multi-server deployment)
- Cloudflare Workers KV for cross-worker rate limiting

---

## Validation Checklist

After completing all tasks:

- [ ] SVG uploads rejected with 400 error
- [ ] SVG file extension blocked at upload
- [ ] CSP header includes nonce on all responses
- [ ] Nonce is unique per request
- [ ] Inline scripts have nonce attribute
- [ ] Rate limiting returns 429 on excessive requests
- [ ] Rate limit headers include Retry-After
- [ ] Gallery endpoint requires authentication
- [ ] Unauthenticated gallery request returns 401
- [ ] Image cache headers set appropriately
- [ ] Private images have `no-store` in Cache-Control
- [ ] Public images have `immutable` in Cache-Control
- [ ] No console errors in dev mode
- [ ] Performance impact minimal (<5%)
- [ ] Git commit: "feat(security): implement CSP, rate limiting, gallery auth, and cache headers"

---

## Files Modified

**Total**: 8 files

**New Files** (2):
1. `src/lib/utils/csp.js` (CSP nonce utility)
2. `src/lib/utils/rateLimit.js` (Rate limiting utility)

**Modified Files** (6):
1. `src/routes/api/images/upload/+server.js` (Block SVG uploads)
2. `src/hooks.server.js` (Add CSP nonce generation + rate limiting)
3. `src/routes/api/gallery/+server.js` (Require authentication)
4. `src/routes/api/images/[id]/+server.js` (Add cache headers)
5. `src/app.html` (Optional: add nonce to scripts)
6. `src/lib/components/Gallery.svelte` (Check auth before displaying)

---

## Estimated Time Breakdown

| Task | Time | Status |
|------|------|--------|
| 1. Remove SVG uploads | 1 hour | Straightforward |
| 2. Implement CSP nonces | 2.5 hours | Complex - requires nonce generation |
| 3. Add rate limiting | 2.5 hours | Complex - sliding window algorithm |
| 4. Secure gallery auth | 1.5 hours | Straightforward |
| 5. R2 cache headers | 1.5 hours | Straightforward |
| **Total** | **8 hours** | **Complete phase** |

---

## Rollback Procedure

If CSP breaks functionality:

```bash
# Revert CSP-related changes only
git checkout HEAD~1 -- src/hooks.server.js src/lib/utils/csp.js

# Or full revert
git reset --hard HEAD~1
```

**Emergency CSP Bypass** (development only):
```javascript
// In hooks.server.js - comment out CSP header
// response.headers.set('Content-Security-Policy', buildCSPHeader(cspNonce, env));
```

**If Rate Limiting Too Strict**:
```javascript
// Increase limits in rateLimit.js
export const RATE_LIMITS = {
  auth: { maxRequests: 10, windowMs: 15 * 60 * 1000 },  // Was 5
  apiWrite: { maxRequests: 120, windowMs: 60 * 1000 },  // Was 60
  // ...
};
```

---

## Next Phase

After completion → [phase4_medium_priority.md](./phase4_medium_priority.md)

**Risk reduction achieved**: 10% (total: 95% from initial state)
