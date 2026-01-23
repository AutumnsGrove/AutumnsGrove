# Quick Setup Commands

## Secrets/Environment Variables

**Good news:** You don't need any new secrets for Better Auth! 🎉

### What to KEEP (for other features):
```bash
GITHUB_TOKEN=your_github_token_here
ANTHROPIC_API_KEY=your_anthropic_key_here
```

### What you CAN DELETE (after testing):
```bash
# These are no longer used by Better Auth migration
GROVEAUTH_CLIENT_ID=...
GROVEAUTH_CLIENT_SECRET=...
GROVEAUTH_REDIRECT_URI=...
SESSION_SECRET=...
RESEND_API_KEY=...
ALLOWED_ADMIN_EMAILS=...
```

## Testing Locally

```bash
# 1. Pull the branch
git checkout claude/migrate-better-auth-c2Acs
git pull

# 2. Install dependencies
pnpm install

# 3. Build to verify everything works
pnpm run build

# 4. Test locally
pnpm run dev
# Then visit: http://localhost:5173/admin
# You should be redirected to login
```

## Deploy to Production

```bash
# Option 1: Via Cloudflare Pages (automatic)
git push origin claude/migrate-better-auth-c2Acs
# Then merge the PR and Cloudflare Pages will auto-deploy

# Option 2: Manual build and deploy
pnpm run build
# Then deploy .svelte-kit/output to Cloudflare Pages
```

## Verify Auth Works

After deployment, test these flows:

1. **Google Login:**
   - Visit `/admin` (logged out)
   - Click "Login with Google"
   - Authorize the app
   - Should redirect back to `/admin` (logged in)

2. **GitHub Login:**
   - Visit `/auth/login?provider=github`
   - Authorize the app
   - Should redirect to `/admin` (logged in)

3. **Session Persistence:**
   - Refresh the page
   - Should stay logged in

4. **Logout:**
   - Visit `/auth/logout`
   - Should redirect to home
   - Visiting `/admin` should redirect to login

## Troubleshooting

### "Can't reach auth-api.grove.place"
```bash
# Test if Better Auth server is up
curl https://auth-api.grove.place/api/auth/session
# Should return JSON (even if unauthenticated)
```

### "Session not found after OAuth"
- Check browser cookies - should have `better-auth.session_token` cookie
- Verify the cookie domain is `.grove.place`
- Check browser console for errors

### "Build fails"
```bash
# Clear cache and reinstall
rm -rf node_modules .svelte-kit
pnpm install
pnpm run build
```

## Rollback (if needed)

```bash
# Revert the migration
git revert HEAD~2..HEAD

# Restore old environment variables
# Add back: GROVEAUTH_CLIENT_ID, GROVEAUTH_CLIENT_SECRET, GROVEAUTH_REDIRECT_URI

# Redeploy
pnpm run build
# Deploy
```

---

For detailed documentation, see: `BETTER_AUTH_MIGRATION.md`
