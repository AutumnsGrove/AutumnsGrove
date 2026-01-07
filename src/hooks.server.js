import { error } from '@sveltejs/kit';
import {
  generateCSRFToken,
  validateCSRFToken,
} from '@autumnsgrove/groveengine/utils';
import { getSession } from '$lib/auth/groveauth';

export async function handle({ event, resolve }) {
  // Initialize user as null
  event.locals.user = null;

  // Get session from Better Auth
  const cookieHeader = event.request.headers.get('cookie');

  try {
    const sessionData = await getSession(cookieHeader);

    if (sessionData?.user) {
      event.locals.user = {
        id: sessionData.user.id,
        email: sessionData.user.email,
        name: sessionData.user.name || null,
      };
    }
  } catch (err) {
    console.error('[HOOKS] Session verification failed:', err.message);
    // Don't throw, just leave user as null - they'll be redirected to login
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
    // Skip CSRF validation for auth endpoints (they have their own protection)
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

  // Content-Security-Policy - include auth-api.grove.place for Better Auth
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://cdn.autumnsgrove.com data:",
    "font-src 'self'",
    "connect-src 'self' https://api.github.com https://auth-api.grove.place https://autumnsgrove-sync-posts.m7jv4v7npb.workers.dev https://autumnsgrove-daily-summary.m7jv4v7npb.workers.dev https://cloudflareinsights.com",
    "frame-ancestors 'none'",
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);

  return response;
}
