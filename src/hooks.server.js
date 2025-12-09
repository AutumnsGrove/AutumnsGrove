import { error } from '@sveltejs/kit';
import {
  generateCSRFToken,
  validateCSRFToken,
} from '@autumnsgrove/groveengine/utils';
import {
  verifyToken,
  refreshTokens,
  parseTokenCookies,
  createTokenCookies,
} from '$lib/auth/groveauth';

export async function handle({ event, resolve }) {
  const env = event.platform?.env;

  // Initialize user as null
  event.locals.user = null;

  // Parse token cookies
  const cookieHeader = event.request.headers.get('cookie');
  const { accessToken, refreshToken } = parseTokenCookies(cookieHeader);

  // Verify access token with GroveAuth
  if (accessToken && env?.GROVEAUTH_CLIENT_ID) {
    try {
      const tokenInfo = await verifyToken(accessToken);

      if (tokenInfo.active) {
        event.locals.user = {
          id: tokenInfo.sub,
          email: tokenInfo.email,
          name: tokenInfo.name || null,
        };
      } else if (refreshToken && env?.GROVEAUTH_CLIENT_SECRET) {
        // Token expired, try to refresh
        const newTokens = await refreshTokens({
          refreshToken,
          clientId: env.GROVEAUTH_CLIENT_ID,
          clientSecret: env.GROVEAUTH_CLIENT_SECRET,
        });

        if (newTokens) {
          // Verify the new token
          const newTokenInfo = await verifyToken(newTokens.access_token);

          if (newTokenInfo.active) {
            event.locals.user = {
              id: newTokenInfo.sub,
              email: newTokenInfo.email,
              name: newTokenInfo.name || null,
            };

            // Store new tokens to set in response
            event.locals._newTokens = newTokens;
          }
        }
      }
    } catch (err) {
      console.error('[HOOKS] Token verification failed:', err.message);
      // Don't throw, just leave user as null - they'll be redirected to login
    }
  }

  // Parse or generate CSRF token from cookie
  let csrfToken = null;
  if (cookieHeader) {
    const match = cookieHeader.match(/csrf_token=([^;]+)/);
    if (match) {
      csrfToken = match[1];
    }
  }

  if (!csrfToken) {
    csrfToken = generateCSRFToken();
  }

  event.locals.csrfToken = csrfToken;

  // Auto-validate CSRF on state-changing methods
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(event.request.method)) {
    // Skip CSRF validation for auth endpoints (they have their own protection via state/PKCE)
    if (!event.url.pathname.startsWith('/auth/')) {
      if (!validateCSRFToken(event.request, csrfToken)) {
        console.error('[HOOKS] CSRF token validation failed', {
          path: event.url.pathname,
          method: event.request.method,
        });
        throw error(403, 'Invalid CSRF token');
      }
    }
  }

  const response = await resolve(event);

  // If tokens were refreshed, set new cookies
  if (event.locals._newTokens) {
    const isProduction =
      event.url.hostname !== 'localhost' && event.url.hostname !== '127.0.0.1';
    const tokenCookies = createTokenCookies(event.locals._newTokens, isProduction);
    tokenCookies.forEach((cookie) => {
      response.headers.append('Set-Cookie', cookie);
    });
  }

  // Set CSRF token cookie if it was just generated
  if (!cookieHeader || !cookieHeader.includes('csrf_token=')) {
    const isProduction =
      event.url.hostname !== 'localhost' && event.url.hostname !== '127.0.0.1';
    const cookieParts = [
      `csrf_token=${csrfToken}`,
      'Path=/',
      'Max-Age=604800', // 7 days
      'SameSite=Lax',
    ];

    if (isProduction) {
      cookieParts.push('Secure');
    }

    response.headers.append('Set-Cookie', cookieParts.join('; '));
  }

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()',
  );

  // Content-Security-Policy - include auth.grove.place for OAuth redirects
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://cdn.autumnsgrove.com data:",
    "font-src 'self'",
    "connect-src 'self' https://api.github.com https://auth.grove.place https://autumnsgrove-sync-posts.m7jv4v7npb.workers.dev https://autumnsgrove-daily-summary.m7jv4v7npb.workers.dev https://cloudflareinsights.com",
    "frame-ancestors 'none'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  return response;
}
