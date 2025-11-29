import { parseSessionCookie, verifySession } from "$lib/auth/session.js";

export async function handle({ event, resolve }) {
  // Initialize user as null
  event.locals.user = null;

  // Parse session cookie
  const cookieHeader = event.request.headers.get("cookie");
  const sessionToken = parseSessionCookie(cookieHeader);

  if (sessionToken && event.platform?.env?.SESSION_SECRET) {
    const user = await verifySession(
      sessionToken,
      event.platform.env.SESSION_SECRET,
    );
    if (user) {
      event.locals.user = user;
    }
  }

  const response = await resolve(event);

  // Add security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  // Content-Security-Policy (production only, needs unsafe-eval for Mermaid)
  if (event.url.hostname !== 'localhost' && event.url.hostname !== '127.0.0.1') {
    response.headers.set('Content-Security-Policy',
      "default-src 'self'; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; " +
      "style-src 'self' 'unsafe-inline'; " +
      "img-src 'self' https://cdn.autumnsgrove.com data:; " +
      "font-src 'self'; " +
      "connect-src 'self' https://api.github.com https://autumnsgrove-sync-posts.m7jv4v7npb.workers.dev https://autumnsgrove-daily-summary.m7jv4v7npb.workers.dev; " +
      "frame-ancestors 'none';"
    );
  }

  return response;
}
