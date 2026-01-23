# GitHub OAuth Implementation Guide

> **For Claude Code**: Implement GitHub OAuth authentication for admin.autumnsgrove.com

## Overview

Implement GitHub OAuth to authenticate admin users. Only allow specific GitHub users (allowlist) to access the admin panel.

## Prerequisites

The user will provide these environment secrets (already configured in Cloudflare):
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `SESSION_SECRET` (for signing JWTs)
- `ADMIN_GITHUB_USERNAMES` (comma-separated allowlist, e.g., "AutumnsGrove,other-admin")

## Implementation Steps

### 1. Add Dependencies

```bash
# If using Hono on Cloudflare Workers
npm install hono @hono/jwt
```

### 2. Create Auth Routes

Create these endpoints in your Hono app:

```typescript
import { Hono } from 'hono'
import { setCookie, getCookie, deleteCookie } from 'hono/cookie'
import { sign, verify } from 'hono/jwt'

const app = new Hono<{ Bindings: Env }>()

// Login - redirect to GitHub
app.get('/auth/login', (c) => {
  const redirectUri = `${new URL(c.req.url).origin}/auth/callback`
  const params = new URLSearchParams({
    client_id: c.env.GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'read:user',
    state: crypto.randomUUID() // CSRF protection
  })
  return c.redirect(`https://github.com/login/oauth/authorize?${params}`)
})

// Callback - exchange code for token, create session
app.get('/auth/callback', async (c) => {
  const code = c.req.query('code')

  if (!code) {
    return c.redirect('/auth/login?error=no_code')
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: c.env.GITHUB_CLIENT_ID,
        client_secret: c.env.GITHUB_CLIENT_SECRET,
        code
      })
    })

    const tokenData = await tokenRes.json() as { access_token?: string; error?: string }

    if (!tokenData.access_token) {
      console.error('Token error:', tokenData)
      return c.redirect('/auth/login?error=token_failed')
    }

    // Get GitHub user info
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'Admin-Panel'
      }
    })

    const user = await userRes.json() as { login: string; id: number; avatar_url: string }

    // Check allowlist
    const allowedUsers = c.env.ADMIN_GITHUB_USERNAMES.split(',').map(u => u.trim().toLowerCase())
    if (!allowedUsers.includes(user.login.toLowerCase())) {
      return c.redirect('/auth/login?error=unauthorized')
    }

    // Create JWT session
    const payload = {
      sub: user.id.toString(),
      username: user.login,
      avatar: user.avatar_url,
      exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7) // 7 days
    }

    const token = await sign(payload, c.env.SESSION_SECRET)

    // Set secure cookie
    setCookie(c, 'session', token, {
      path: '/',
      secure: true,
      httpOnly: true,
      sameSite: 'Lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })

    return c.redirect('/') // Redirect to admin dashboard

  } catch (error) {
    console.error('Auth error:', error)
    return c.redirect('/auth/login?error=server_error')
  }
})

// Logout
app.get('/auth/logout', (c) => {
  deleteCookie(c, 'session', { path: '/' })
  return c.redirect('/auth/login')
})

// Get current user (API endpoint)
app.get('/auth/me', async (c) => {
  const session = getCookie(c, 'session')

  if (!session) {
    return c.json({ authenticated: false }, 401)
  }

  try {
    const payload = await verify(session, c.env.SESSION_SECRET)
    return c.json({
      authenticated: true,
      user: {
        id: payload.sub,
        username: payload.username,
        avatar: payload.avatar
      }
    })
  } catch {
    deleteCookie(c, 'session', { path: '/' })
    return c.json({ authenticated: false }, 401)
  }
})
```

### 3. Create Auth Middleware

Protect admin routes with this middleware:

```typescript
import { getCookie } from 'hono/cookie'
import { verify } from 'hono/jwt'

const authMiddleware = async (c: any, next: any) => {
  const session = getCookie(c, 'session')

  if (!session) {
    // For API requests, return 401
    if (c.req.path.startsWith('/api/')) {
      return c.json({ error: 'Unauthorized' }, 401)
    }
    // For page requests, redirect to login
    return c.redirect('/auth/login')
  }

  try {
    const payload = await verify(session, c.env.SESSION_SECRET)
    c.set('user', payload)
    await next()
  } catch {
    // Invalid/expired token
    if (c.req.path.startsWith('/api/')) {
      return c.json({ error: 'Session expired' }, 401)
    }
    return c.redirect('/auth/login')
  }
}

// Apply to protected routes
app.use('/api/*', authMiddleware)
app.use('/dashboard/*', authMiddleware)
```

### 4. Environment Type Definitions

```typescript
interface Env {
  GITHUB_CLIENT_ID: string
  GITHUB_CLIENT_SECRET: string
  SESSION_SECRET: string
  ADMIN_GITHUB_USERNAMES: string
  // ... other bindings
}
```

### 5. Login Page (Frontend)

Create a simple login page at `/auth/login`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Admin Login</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .login-box {
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      text-align: center;
    }
    .login-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: #24292e;
      color: white;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
    }
    .login-btn:hover {
      background: #2f363d;
    }
    .error {
      color: #d73a49;
      margin-bottom: 1rem;
    }
  </style>
</head>
<body>
  <div class="login-box">
    <h1>Admin Panel</h1>
    <div class="error" id="error" style="display:none"></div>
    <a href="/auth/login" class="login-btn">
      <svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
      </svg>
      Sign in with GitHub
    </a>
  </div>
  <script>
    const params = new URLSearchParams(window.location.search)
    const error = params.get('error')
    if (error) {
      const errorEl = document.getElementById('error')
      errorEl.style.display = 'block'
      const messages = {
        'unauthorized': 'You are not authorized to access this admin panel.',
        'token_failed': 'Failed to authenticate with GitHub.',
        'no_code': 'No authorization code received.',
        'server_error': 'Server error. Please try again.'
      }
      errorEl.textContent = messages[error] || 'An error occurred.'
    }
  </script>
</body>
</html>
```

### 6. Frontend Auth Check

For protected pages, check authentication on load:

```javascript
async function checkAuth() {
  try {
    const res = await fetch('/auth/me')
    if (!res.ok) {
      window.location.href = '/auth/login'
      return null
    }
    return await res.json()
  } catch {
    window.location.href = '/auth/login'
    return null
  }
}

// Use in your app
const user = await checkAuth()
if (user) {
  document.getElementById('username').textContent = user.user.username
  document.getElementById('avatar').src = user.user.avatar
}
```

## Security Checklist

- [ ] `SESSION_SECRET` is a strong random string (32+ chars)
- [ ] Cookies are `httpOnly`, `secure`, and `sameSite`
- [ ] JWT expiration is set appropriately
- [ ] Allowlist is properly configured
- [ ] HTTPS is enforced in production

## Testing

1. Visit `/auth/login`
2. Click "Sign in with GitHub"
3. Authorize the OAuth app
4. Should redirect back and set session cookie
5. Protected routes should now be accessible
6. `/auth/me` should return user info
7. `/auth/logout` should clear session
