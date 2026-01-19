import { error } from "@sveltejs/kit";
import {
  generateCSRFToken,
  validateCSRFToken,
} from "@autumnsgrove/groveengine/utils";
import { createClientFromEnv } from "$lib/auth/groveauth";
import { getCookie } from "$lib/utils/cookies";

/** Session cookie duration: 30 days */
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

/** Default access token duration: 1 hour */
const DEFAULT_ACCESS_TOKEN_DURATION = 3600;

export async function handle({ event, resolve }) {
  // Initialize user as null
  event.locals.user = null;

  const cookieHeader = event.request.headers.get("cookie");
  const accessToken = getCookie(cookieHeader, "access_token");
  const refreshToken = getCookie(cookieHeader, "refresh_token");

  // Verify access token if present
  if (accessToken) {
    try {
      const auth = createClientFromEnv(event.platform, event.url.origin);
      const tokenInfo = await auth.verifyToken(accessToken);

      if (tokenInfo) {
        // Token is valid - set user from token info
        event.locals.user = {
          id: tokenInfo.sub,
          email: tokenInfo.email,
          name: tokenInfo.name || null,
        };
      } else if (refreshToken) {
        // Access token expired, try to refresh
        try {
          const newTokens = await auth.refreshToken(refreshToken);

          // Get user info from new token
          const userInfo = await auth.getUserInfo(newTokens.access_token);

          if (userInfo) {
            event.locals.user = {
              id: userInfo.sub,
              email: userInfo.email,
              name: userInfo.name || null,
            };

            // Store new tokens to set in response
            event.locals.newTokens = newTokens;
          }
        } catch (refreshErr) {
          // Refresh failed - user needs to re-login
          console.warn("[HOOKS] Token refresh failed:", refreshErr.message);
        }
      }
    } catch (err) {
      console.error("[HOOKS] Token verification failed:", err.message);
      // Don't throw, just leave user as null - they'll be redirected to login
    }
  }

  // Parse or generate CSRF token from cookie
  let csrfToken = getCookie(cookieHeader, "csrf_token");

  if (!csrfToken) {
    csrfToken = generateCSRFToken();
  }

  event.locals.csrfToken = csrfToken;

  // Auto-validate CSRF on state-changing methods
  if (["POST", "PUT", "DELETE", "PATCH"].includes(event.request.method)) {
    // Skip CSRF validation for auth endpoints (they have their own protection)
    if (!event.url.pathname.startsWith("/auth/")) {
      if (!validateCSRFToken(event.request, csrfToken)) {
        console.error("[HOOKS] CSRF token validation failed", {
          path: event.url.pathname,
          method: event.request.method,
        });
        throw error(403, "Invalid CSRF token");
      }
    }
  }

  const response = await resolve(event);

  // If we refreshed tokens, set the new cookies
  if (event.locals.newTokens) {
    const isProduction =
      event.url.hostname !== "localhost" && event.url.hostname !== "127.0.0.1";

    const cookieParts = (name, value, maxAge) => {
      const parts = [
        `${name}=${value}`,
        "Path=/",
        `Max-Age=${maxAge}`,
        "HttpOnly",
        "SameSite=Lax",
      ];
      if (isProduction) {
        parts.push("Secure");
      }
      return parts.join("; ");
    };

    response.headers.append(
      "Set-Cookie",
      cookieParts(
        "access_token",
        event.locals.newTokens.access_token,
        event.locals.newTokens.expires_in || DEFAULT_ACCESS_TOKEN_DURATION,
      ),
    );

    if (event.locals.newTokens.refresh_token) {
      response.headers.append(
        "Set-Cookie",
        cookieParts(
          "refresh_token",
          event.locals.newTokens.refresh_token,
          SESSION_DURATION_SECONDS,
        ),
      );
    }
  }

  // Set CSRF token cookie if it was just generated
  if (!cookieHeader || !cookieHeader.includes("csrf_token=")) {
    const isProduction =
      event.url.hostname !== "localhost" && event.url.hostname !== "127.0.0.1";
    const cookieParts = [
      `csrf_token=${csrfToken}`,
      "Path=/",
      "Max-Age=604800", // 7 days
      "SameSite=Lax",
    ];

    if (isProduction) {
      cookieParts.push("Secure");
    }

    response.headers.append("Set-Cookie", cookieParts.join("; "));
  }

  // Add security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=()",
  );

  // Content-Security-Policy - include Heartwood for OAuth
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://static.cloudflareinsights.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://cdn.autumnsgrove.com data:",
    "font-src 'self'",
    "connect-src 'self' https://api.github.com https://auth-api.grove.place https://heartwood.grove.place https://autumnsgrove-sync-posts.m7jv4v7npb.workers.dev https://autumnsgrove-daily-summary.m7jv4v7npb.workers.dev https://cloudflareinsights.com",
    "frame-ancestors 'none'",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  return response;
}
