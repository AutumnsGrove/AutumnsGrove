# GitHub OAuth Setup Guide

> **For You**: Manual steps to set up GitHub OAuth and Cloudflare secrets

## Step 1: Create GitHub OAuth App

1. Go to **GitHub Settings** (click your avatar → Settings)
2. Scroll down to **Developer settings** (bottom of left sidebar)
3. Click **OAuth Apps** → **New OAuth App**
4. Fill in the form:

| Field | Value |
|-------|-------|
| **Application name** | `Autumns Grove Admin` (or whatever you want) |
| **Homepage URL** | `https://admin.autumnsgrove.com` |
| **Authorization callback URL** | `https://admin.autumnsgrove.com/auth/callback` |

5. Click **Register application**

## Step 2: Get Your Credentials

After creating the app:

1. You'll see your **Client ID** - copy this
2. Click **Generate a new client secret**
3. **IMMEDIATELY copy the secret** - you won't see it again!

Save these somewhere safe temporarily:
```
Client ID: Iv1.xxxxxxxxxx
Client Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 3: Generate Session Secret

Generate a strong random secret for signing JWTs. Run this in terminal:

```bash
openssl rand -base64 32
```

Or use any password generator to create a 32+ character random string.

Save this:
```
Session Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Step 4: Add Secrets to Cloudflare

Navigate to your admin project directory, then run these commands:

```bash
# Add GitHub OAuth credentials
wrangler secret put GITHUB_CLIENT_ID
# Paste your Client ID when prompted

wrangler secret put GITHUB_CLIENT_SECRET
# Paste your Client Secret when prompted

wrangler secret put SESSION_SECRET
# Paste your generated session secret when prompted

wrangler secret put ADMIN_GITHUB_USERNAMES
# Enter comma-separated GitHub usernames who can access admin
# Example: AutumnsGrove,trusted-collaborator
```

## Step 5: For Local Development

Create a `.dev.vars` file in your workers directory (this is gitignored):

```ini
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxx
SESSION_SECRET=your-session-secret-here
ADMIN_GITHUB_USERNAMES=AutumnsGrove
```

**Important**: For local dev, you'll need to either:
- Use `http://localhost:8787/auth/callback` as the callback URL (create a second OAuth app for dev)
- Or use a tunnel like `cloudflared tunnel` to get HTTPS locally

### Option: Separate Dev OAuth App

Create a second OAuth app for local development:
- **Homepage URL**: `http://localhost:8787`
- **Callback URL**: `http://localhost:8787/auth/callback`

Then use those credentials in `.dev.vars`.

## Step 6: Update DNS (if not already done)

In Cloudflare Dashboard → DNS:

1. Add a CNAME record:
   - **Name**: `admin`
   - **Target**: Your pages/workers URL or `@` for same zone
   - **Proxy**: Enabled (orange cloud)

## Step 7: Deploy and Test

```bash
# Deploy the worker
wrangler deploy

# Test the flow
# 1. Visit https://admin.autumnsgrove.com/auth/login
# 2. Click "Sign in with GitHub"
# 3. Authorize the app
# 4. Should redirect back to dashboard
```

## Troubleshooting

### "The redirect_uri MUST match the registered callback URL"
- Check the callback URL in GitHub exactly matches your code
- Must include protocol (https://)
- Must match domain exactly (no trailing slash differences)

### "Application suspended"
- Your OAuth app may have been flagged - check GitHub settings

### "Not authorized" after login
- Check that your GitHub username is in `ADMIN_GITHUB_USERNAMES`
- Username comparison is case-insensitive
- No spaces around commas in the list

### Cookie not being set
- Ensure you're on HTTPS in production
- Check browser dev tools → Application → Cookies

## Quick Reference

| Secret | Example | Notes |
|--------|---------|-------|
| `GITHUB_CLIENT_ID` | `Iv1.a1b2c3d4e5f6` | From GitHub OAuth app |
| `GITHUB_CLIENT_SECRET` | `abc123...` | Only shown once! |
| `SESSION_SECRET` | `K8x9...` | 32+ random chars |
| `ADMIN_GITHUB_USERNAMES` | `AutumnsGrove,friend` | Comma-separated, no spaces |

## Security Notes

- Never commit secrets to git
- Rotate `GITHUB_CLIENT_SECRET` if ever exposed
- Keep the allowlist minimal
- Consider adding 2FA requirement for admin users on GitHub
