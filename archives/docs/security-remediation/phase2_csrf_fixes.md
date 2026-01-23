# Phase 2: Critical CSRF Fixes (Day 1 Afternoon)

**Duration**: 4 hours
**Priority**: CRITICAL
**Agent**: house-coder (Sonnet model)
**Risk Reduction**: 40%
**Dependencies**: None (can run after Phase 1 or in parallel)

---

## Overview

Implement comprehensive CSRF protection using token-based validation:
1. Fix DELETE endpoint bug (missing request parameter)
2. Implement token generation and validation
3. Update hooks.server.js for automatic CSRF handling
4. Create client-side API utility

**CVSS Scores**: 8.1 (DELETE bug), 7.5 (Weak CSRF implementation)

---

## Task Breakdown

### Task 1: Fix DELETE Endpoint Bug (5 min) ⚡ QUICK WIN

**File**: `src/routes/api/posts/[slug]/+server.js`

**Issue**: Line 196 - `validateCSRF(request)` called but `request` not in function params

**Fix**:
```javascript
// Line 195 - Add 'request' to function signature
export async function DELETE({ params, request, platform, locals }) {
  //                                   ^^^^^^^ ADD THIS

  // Auth check
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }

  // CSRF check - now 'request' is defined
  if (!validateCSRF(request)) {
    throw error(403, "Invalid origin");
  }

  // ... rest of existing code (no changes)
}
```

**Test**: DELETE endpoint should now properly validate CSRF

---

### Task 2: Implement Token-Based CSRF Protection (2 hours)

**File**: `src/lib/utils/csrf.js` (COMPLETE REWRITE)

**Current Issue**: Only validates Origin header, no CSRF tokens

**New Implementation**:
```javascript
/**
 * CSRF Protection Utilities
 * Implements token-based CSRF validation with origin checking as defense-in-depth
 */

/**
 * Generate cryptographically secure CSRF token
 * @returns {string} 64-character hex token
 */
export function generateCSRFToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token from request header
 * Implements two-layer validation:
 * 1. Origin/Referer header validation (defense-in-depth)
 * 2. CSRF token validation (primary protection)
 *
 * @param {Request} request - HTTP request object
 * @param {string} expectedToken - Expected CSRF token from session
 * @returns {boolean} True if valid, false otherwise
 */
export function validateCSRF(request, expectedToken) {
  // Layer 1: Validate origin/referer headers (defense-in-depth)
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const host = request.headers.get('host');

  // Require at least origin or referer for state-changing requests
  if (!origin && !referer) {
    console.warn('[CSRF] Rejected: No origin or referer header');
    return false;
  }

  // Validate origin header if present
  if (origin) {
    try {
      const originUrl = new URL(origin);
      const isLocalhost = originUrl.hostname === 'localhost' ||
                         originUrl.hostname === '127.0.0.1';

      if (!isLocalhost && host && originUrl.host !== host) {
        console.warn(`[CSRF] Origin mismatch: ${origin} vs ${host}`);
        return false;
      }
    } catch (err) {
      console.warn('[CSRF] Invalid origin URL:', err);
      return false;
    }
  } else if (referer) {
    // Fallback to referer validation if no origin
    try {
      const refererUrl = new URL(referer);
      const isLocalhost = refererUrl.hostname === 'localhost' ||
                         refererUrl.hostname === '127.0.0.1';

      if (!isLocalhost && host && refererUrl.host !== host) {
        console.warn(`[CSRF] Referer mismatch: ${referer} vs ${host}`);
        return false;
      }
    } catch (err) {
      console.warn('[CSRF] Invalid referer URL:', err);
      return false;
    }
  }

  // Layer 2: Validate CSRF token (primary protection)
  const csrfToken = request.headers.get('x-csrf-token');

  if (!csrfToken) {
    console.warn('[CSRF] Rejected: No CSRF token in header');
    return false;
  }

  if (csrfToken !== expectedToken) {
    console.warn('[CSRF] Rejected: Token mismatch');
    return false;
  }

  return true;
}
```

---

### Task 3: Update hooks.server.js for Automatic CSRF Handling (1.5 hours)

**File**: `src/hooks.server.js`

**Changes**: Add CSRF token generation and validation middleware

```javascript
import { parseSessionCookie, verifySession } from "$lib/auth/session.js";
import { generateCSRFToken, validateCSRF } from '$lib/utils/csrf.js';

export async function handle({ event, resolve }) {
  // Parse session cookie
  const cookieHeader = event.request.headers.get("cookie");
  const sessionToken = parseSessionCookie(cookieHeader);

  // Verify session and set user
  if (sessionToken) {
    const secret = event.platform?.env?.SESSION_SECRET;
    if (secret) {
      const user = await verifySession(sessionToken, secret);
      event.locals.user = user;
    }
  }

  // ==========================================
  // NEW: CSRF Token Generation for Authenticated Users
  // ==========================================
  if (event.locals.user) {
    // Get existing token or generate new one
    let csrfToken = event.cookies.get('csrf_token');

    if (!csrfToken) {
      csrfToken = generateCSRFToken();
      event.cookies.set('csrf_token', csrfToken, {
        path: '/',
        httpOnly: true,
        secure: event.url.hostname !== 'localhost' && event.url.hostname !== '127.0.0.1',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7  // 7 days (same as session)
      });
    }

    // Make token available to endpoints via locals
    event.locals.csrfToken = csrfToken;
  }

  // ==========================================
  // NEW: Automatic CSRF Validation for API Routes
  // ==========================================
  const isApiRoute = event.url.pathname.startsWith('/api/');
  const isStateMutating = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(event.request.method);

  if (isApiRoute && isStateMutating && event.locals.user) {
    // Validate CSRF token for all authenticated state-changing API requests
    if (!validateCSRF(event.request, event.locals.csrfToken)) {
      return new Response('CSRF validation failed', {
        status: 403,
        headers: {
          'Content-Type': 'text/plain',
          'X-CSRF-Error': 'Token validation failed'
        }
      });
    }
  }

  // Continue with existing security headers logic...
  const response = await resolve(event);

  // Existing security headers (keep as-is)
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  if (event.url.hostname !== 'localhost' && event.url.hostname !== '127.0.0.1') {
    response.headers.set('Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' https://cdn.autumnsgrove.com https://api.github.com https://workers.cloudflare.com data:; " +
      "font-src 'self' data:; " +
      "connect-src 'self'; " +
      "frame-ancestors 'none'; " +
      "base-uri 'self'; " +
      "form-action 'self'"
    );
  }

  return response;
}
```

---

### Task 4: Remove Individual validateCSRF Calls (30 min)

**Action**: Update endpoints to rely on hooks.server.js validation

**Files to Update** (remove manual validateCSRF calls):
1. `src/routes/api/posts/+server.js` (Line 47)
2. `src/routes/api/posts/[slug]/+server.js` (Lines 87, 196)
3. `src/routes/api/pages/[slug]/+server.js` (Line 15)
4. `src/routes/api/admin/settings/+server.js` (Line 17)
5. `src/routes/api/images/upload/+server.js` (Line 11)

**Pattern** (for each file):
```javascript
// REMOVE THIS:
import { validateCSRF } from '$lib/utils/csrf.js';

// REMOVE THIS:
if (!validateCSRF(request)) {
  throw error(403, "Invalid origin");
}

// Hooks.server.js now handles CSRF validation automatically!
// Just keep the auth check:
if (!locals.user) {
  throw error(401, "Unauthorized");
}
```

**Exception**: `src/routes/api/images/delete/+server.js` has custom inline validation - can also remove it

---

### Task 5: Create Client-Side API Utility (30 min)

**New File**: `src/lib/utils/api.js`

**Purpose**: Centralized API calls with automatic CSRF token injection

```javascript
/**
 * Client-Side API Utilities
 * Automatically includes CSRF tokens in all requests
 */

/**
 * Get CSRF token from cookie
 * @returns {string|null} CSRF token or null if not found
 */
function getCSRFToken() {
  if (typeof document === 'undefined') return null; // SSR safety

  const token = document.cookie
    .split('; ')
    .find(row => row.startsWith('csrf_token='))
    ?.split('=')[1];

  return token || null;
}

/**
 * Make authenticated API request with CSRF protection
 *
 * @param {string} url - API endpoint URL
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 *
 * @example
 * const response = await apiRequest('/api/posts', {
 *   method: 'POST',
 *   body: JSON.stringify({ title: 'New Post' })
 * });
 */
export async function apiRequest(url, options = {}) {
  const csrfToken = getCSRFToken();

  // Merge headers with CSRF token
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  // Add CSRF token for state-changing requests
  const isStateMutating = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(
    options.method?.toUpperCase() || 'GET'
  );

  if (isStateMutating && csrfToken) {
    headers['X-CSRF-Token'] = csrfToken;
  }

  return fetch(url, {
    ...options,
    headers,
    credentials: 'include'  // Include cookies
  });
}

/**
 * Convenience methods for common HTTP verbs
 */
export const api = {
  get: (url, options = {}) => apiRequest(url, { ...options, method: 'GET' }),
  post: (url, data, options = {}) => apiRequest(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(data)
  }),
  put: (url, data, options = {}) => apiRequest(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  delete: (url, options = {}) => apiRequest(url, { ...options, method: 'DELETE' }),
};
```

**Usage Example** (in Svelte components):
```javascript
import { api } from '$lib/utils/api.js';

// Before (manual fetch):
const response = await fetch('/api/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'New Post' })
});

// After (automatic CSRF):
const response = await api.post('/api/posts', { title: 'New Post' });
```

---

### Task 6: Test CSRF Protection (15 min)

**Test Cases**:

1. **Valid Request** - Should succeed:
```javascript
import { api } from '$lib/utils/api.js';
const response = await api.post('/api/posts', { title: 'Test' });
// Expected: 200 OK
```

2. **Missing CSRF Token** - Should fail:
```javascript
const response = await fetch('/api/posts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  // No X-CSRF-Token header
  body: JSON.stringify({ title: 'Test' })
});
// Expected: 403 Forbidden - "CSRF validation failed"
```

3. **Wrong CSRF Token** - Should fail:
```javascript
const response = await fetch('/api/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': 'invalid-token-12345'
  },
  body: JSON.stringify({ title: 'Test' })
});
// Expected: 403 Forbidden
```

4. **Cross-Origin Request** - Should fail:
```html
<!-- From evil.com -->
<form action="https://autumnsgrove.com/api/posts/my-post" method="POST">
  <input type="hidden" name="title" value="Hacked">
</form>
<script>document.forms[0].submit();</script>
<!-- Expected: 403 Forbidden (no origin match + no token) -->
```

---

## Dependencies

**Before Starting**:
- ✅ Phase 1 completed (optional - can run in parallel)
- ✅ No new npm packages needed
- ✅ Web Crypto API available (built-in)

---

## Validation Checklist

After completing all tasks:

- [ ] DELETE endpoint has `request` parameter
- [ ] `csrf.js` rewritten with token validation
- [ ] `hooks.server.js` generates CSRF tokens
- [ ] `hooks.server.js` validates all API POST/PUT/DELETE
- [ ] Individual `validateCSRF()` calls removed from 6 endpoints
- [ ] `src/lib/utils/api.js` created
- [ ] Test: Valid request with token succeeds
- [ ] Test: Request without token fails (403)
- [ ] Test: Request with wrong token fails (403)
- [ ] Test: Cross-origin request fails
- [ ] No errors in console
- [ ] Git commit: "feat(security): implement token-based CSRF protection"

---

## Files Modified

**Total**: 13 files

**New Files** (2):
1. `src/lib/utils/api.js` (NEW - client API utility)

**Modified Files** (11):
1. `src/lib/utils/csrf.js` (COMPLETE REWRITE)
2. `src/hooks.server.js` (Add CSRF middleware)
3. `src/routes/api/posts/+server.js` (Remove manual validation)
4. `src/routes/api/posts/[slug]/+server.js` (Fix DELETE + remove validation)
5. `src/routes/api/pages/[slug]/+server.js` (Remove validation)
6. `src/routes/api/admin/settings/+server.js` (Remove validation)
7. `src/routes/api/images/upload/+server.js` (Remove validation)
8. `src/routes/api/images/delete/+server.js` (Remove custom validation)
9. `src/routes/api/timeline/trigger/+server.js` (Auto-protected by hooks)
10. `src/routes/api/timeline/trigger/backfill/+server.js` (Auto-protected)
11. `src/routes/api/timeline/[date]/+server.js` (Auto-protected)

---

## Migration Path for Existing Code

**If you have existing client-side fetch calls**, update them gradually:

```javascript
// Option 1: Update imports
import { api } from '$lib/utils/api.js';
const response = await api.post('/api/posts', data);

// Option 2: Manual token (if can't use api.js)
const csrfToken = document.cookie
  .split('; ')
  .find(row => row.startsWith('csrf_token='))
  ?.split('=')[1];

fetch('/api/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify(data)
});
```

---

## Rollback Procedure

If CSRF breaks functionality:

```bash
# Revert hooks.server.js only (keeps token generation)
git checkout HEAD~1 -- src/hooks.server.js

# Or full revert
git reset --hard HEAD~1
```

**Emergency Bypass** (temporary, for debugging only):
```javascript
// In hooks.server.js - comment out validation
// if (!validateCSRF(event.request, event.locals.csrfToken)) {
//   return new Response('CSRF validation failed', { status: 403 });
// }
```

---

## Next Phase

After completion → [phase3_high_priority.md](./phase3_high_priority.md)

**Risk reduction achieved**: 40% (CSRF attacks now blocked)
**Total risk reduction so far**: 85% (Phase 1 + Phase 2)
