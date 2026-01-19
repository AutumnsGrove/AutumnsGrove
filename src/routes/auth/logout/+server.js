/**
 * Logout Handler
 *
 * Revokes tokens on Heartwood and clears local session cookies.
 */

import { redirect } from "@sveltejs/kit";
import { createClientFromEnv } from "$lib/auth/groveauth";
import { getCookie } from "$lib/utils/cookies";

export async function GET({ request, cookies, url, platform }) {
  const cookieHeader = request.headers.get("cookie");
  const accessToken = getCookie(cookieHeader, "access_token");
  const refreshToken = getCookie(cookieHeader, "refresh_token");

  // Revoke tokens on Heartwood (best effort)
  // Important: Revoke both refresh token AND access token for complete logout
  try {
    const auth = createClientFromEnv(platform, url.origin);

    // Revoke refresh token first (more important for security)
    if (refreshToken) {
      await auth.revokeToken(refreshToken);
    }

    // Then revoke access token
    if (accessToken) {
      await auth.logout(accessToken);
    }
  } catch (err) {
    // Even if Heartwood fails, we still clear local cookies
    console.warn(
      "[LOGOUT] Heartwood token revocation failed (non-fatal):",
      err.message,
    );
  }

  // Determine if we're in production
  const isProduction =
    url.hostname !== "localhost" && url.hostname !== "127.0.0.1";

  // Clear all auth cookies
  const cookieOptions = {
    path: "/",
    httpOnly: true,
    secure: isProduction,
  };

  cookies.delete("access_token", cookieOptions);
  cookies.delete("refresh_token", cookieOptions);
  cookies.delete("session", cookieOptions);

  // Redirect to home page
  redirect(302, "/");
}
