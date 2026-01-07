# Better Auth Migration Guide

## Overview

This migration replaces Heartwood's token-based authentication with Better Auth's session-based system. Better Auth is a fully managed service running at `auth-api.grove.place`.

## Environment Variables

### ✅ What You DON'T Need

Better Auth is fully managed, so you **do NOT need to set up any new environment variables** for the client application. The OAuth credentials are stored server-side in Better Auth.

### 🗑️ What You CAN Remove (After Testing)

Once the migration is verified stable, you can remove these legacy environment variables:

```bash
# Legacy Heartwood Auth (no longer used)
GROVEAUTH_CLIENT_ID=...         # Can be removed
GROVEAUTH_CLIENT_SECRET=...     # Can be removed
GROVEAUTH_REDIRECT_URI=...      # Can be removed
SESSION_SECRET=...              # Can be removed
RESEND_API_KEY=...             # Can be removed (if only used for auth)
ALLOWED_ADMIN_EMAILS=...       # Can be removed (auth is now OAuth-only)
```

### ✅ What You KEEP

These environment variables are still needed for other features:

```bash
# Required for other features
GITHUB_TOKEN=...               # For GitHub API integrations
ANTHROPIC_API_KEY=...          # For AI features
```

## Local Development Setup

### 1. Prerequisites

- Node.js 18+ and pnpm installed
- Access to `auth-api.grove.place` (ensure it's reachable)

### 2. Installation

```bash
# Install dependencies
pnpm install

# Verify build works
pnpm run build
```

### 3. Test Authentication Locally

```bash
# Start dev server
pnpm run dev

# Or with Cloudflare Workers emulation
pnpm run dev:wrangler
```

**Testing the auth flow:**

1. Navigate to `http://localhost:5173/admin` (or your dev port)
2. You should be redirected to `/auth/login`
3. The login endpoint will redirect to `auth-api.grove.place` for OAuth
4. After OAuth, you'll be redirected back to your local server
5. Verify you can access `/admin` pages

**Note:** The session cookie is set on `.grove.place` domain. In local development (localhost), cross-domain cookies may not work perfectly. For full testing, deploy to a `.grove.place` subdomain.

## Deployment Checklist

### Pre-Deployment

- [ ] **Test on staging**: Deploy to a staging environment first if possible
- [ ] **Verify Better Auth is running**: Check `https://auth-api.grove.place/api/auth/session` returns a proper response
- [ ] **Review protected routes**: Ensure all admin routes check `event.locals.user`
- [ ] **Test both OAuth providers**: Verify Google and GitHub login both work

### Deployment Steps

1. **Deploy the code:**
   ```bash
   git checkout claude/migrate-better-auth-c2Acs
   pnpm install
   pnpm run build
   # Deploy to Cloudflare Pages (via your CI/CD or manual)
   ```

2. **Clear old auth data (important!):**
   - Users will need to log in again after deployment
   - Old token cookies will be invalid
   - Consider showing a banner: "We've upgraded our authentication system. Please log in again."

3. **Monitor for issues:**
   - Check logs for auth-related errors
   - Monitor Better Auth availability
   - Watch for any failed login attempts

### Post-Deployment

- [ ] **Test all auth flows**: Login with Google, login with GitHub, logout, session persistence
- [ ] **Verify protected routes**: Try accessing `/admin` without being logged in
- [ ] **Test cross-subdomain SSO** (if applicable): Log in on one subdomain, verify session works on another
- [ ] **Remove legacy environment variables**: After 1-2 weeks of stable operation, clean up old vars

## Rollback Procedure

If you need to roll back to the old token-based auth:

1. **Revert to the previous commit:**
   ```bash
   git revert HEAD  # Or git reset --hard <previous-commit>
   ```

2. **Restore environment variables:**
   Ensure `GROVEAUTH_CLIENT_ID`, `GROVEAUTH_CLIENT_SECRET`, and `GROVEAUTH_REDIRECT_URI` are set.

3. **Redeploy:**
   ```bash
   pnpm run build
   # Deploy
   ```

4. **Clear session cookies:**
   Users will need to log in again with the old system.

## Troubleshooting

### Issue: "Session not found after OAuth callback"

**Cause:** Better Auth didn't set the session cookie, or the cookie wasn't sent back.

**Solutions:**
- Verify `auth-api.grove.place` is reachable
- Check that the domain is set to `.grove.place` in Better Auth config
- Ensure your app is running on a `.grove.place` subdomain (not localhost for production)

### Issue: "CORS errors when calling Better Auth"

**Cause:** Missing `credentials: 'include'` in fetch requests.

**Solution:** All Better Auth requests in `groveauth.ts` already use `credentials: 'include'`. Verify your CSP headers allow `auth-api.grove.place`.

### Issue: "Open redirect vulnerability detected"

**Cause:** The redirect whitelist in `/auth/login/+server.ts` may need updating.

**Solution:** Add your custom protected routes to the `ALLOWED_REDIRECTS` array:

```typescript
const ALLOWED_REDIRECTS = [
  '/admin',
  '/admin/blog',
  // Add your routes here
  '/my-custom-route',
];
```

### Issue: "Session validation is slow"

**Cause:** Better Auth session endpoint is being called on every request.

**Solution:** Better Auth sessions are cached in KV and should be <100ms. If it's slower, check:
- Network latency to `auth-api.grove.place`
- Better Auth server health

## Security Improvements in This Migration

✅ **Open redirect protection**: Login and callback endpoints validate redirect URLs against a whitelist
✅ **Session verification**: Callback endpoint verifies the session was created before redirecting
✅ **Error handling**: Proper error messages for auth failures
✅ **No client-side secrets**: All OAuth credentials are server-side only
✅ **HttpOnly cookies**: Session cookie cannot be accessed via JavaScript
✅ **Cross-subdomain SSO**: Session works across all `.grove.place` services

## Architecture Changes

### Before (Token Auth):
```
User → /auth/login → auth.grove.place/login (PKCE)
  → /auth/callback → Exchange code for tokens
  → Store tokens in cookies
  → /verify endpoint checks tokens on every request
  → Manual refresh token logic
```

### After (Better Auth):
```
User → /auth/login → auth-api.grove.place/api/auth/sign-in/{provider}
  → OAuth flow (handled by Better Auth)
  → /auth/callback → Verify session exists
  → Session cookie set by Better Auth
  → /api/auth/session endpoint validates session (cached <100ms)
  → No refresh needed (long-lived sessions)
```

## API Reference

### Better Auth Endpoints (auth-api.grove.place)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/sign-in/google` | GET | Start Google OAuth |
| `/api/auth/sign-in/github` | GET | Start GitHub OAuth |
| `/api/auth/session` | GET | Get current session + user |
| `/api/auth/sign-out` | POST | End session |

### Local Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login?provider=google` | GET | Initiate Google login |
| `/auth/login?provider=github` | GET | Initiate GitHub login |
| `/auth/callback` | GET | OAuth callback handler |
| `/auth/logout` | GET/POST | Sign out user |
| `/auth/me` | GET | Get current user (API endpoint) |

## Testing Commands

```bash
# Run type checking
pnpm run build

# Run security tests (if you have them)
pnpm run test:security

# Test local dev server
pnpm run dev

# Test with Wrangler (Cloudflare Workers emulation)
pnpm run dev:wrangler
```

## Support & Contact

If you encounter issues with Better Auth itself (not this client integration), check the auth server logs at `auth-api.grove.place`.

For client-side auth issues in this app, check:
1. Browser console for errors
2. Server logs for `[AUTH]` tagged messages
3. Network tab for failed requests to `auth-api.grove.place`

---

**Migration completed**: 2026-01-07
**Net LOC reduction**: 248 lines removed
**Security improvements**: 5 (open redirect protection, session verification, error handling, etc.)
