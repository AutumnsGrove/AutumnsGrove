/**
 * OAuth Login - Initiate PKCE authentication flow via Heartwood
 *
 * Flow: /auth/login -> Heartwood login page -> /auth/callback
 */

import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createClientFromEnv } from "$lib/auth/groveauth";
import { validateRedirect } from "$lib/auth/constants";

export const GET: RequestHandler = async ({ url, cookies, platform }) => {
  // Get redirect destination (default to admin panel)
  const redirectParam = url.searchParams.get("redirect") || "/admin";
  const safeRedirect = validateRedirect(redirectParam);

  // Create GroveAuth client
  const auth = createClientFromEnv(platform, url.origin);

  // Generate login URL with PKCE
  const { url: loginUrl, state, codeVerifier } = await auth.getLoginUrl();

  // Determine if we're in production
  const isProduction =
    url.hostname !== "localhost" && url.hostname !== "127.0.0.1";

  // Cookie options for auth state (short-lived, 10 minutes)
  const cookieOptions = {
    path: "/",
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    maxAge: 60 * 10, // 10 minutes
  };

  // Store PKCE state in secure cookies
  cookies.set("auth_state", state, cookieOptions);
  cookies.set("auth_code_verifier", codeVerifier, cookieOptions);
  cookies.set("auth_return_to", safeRedirect, cookieOptions);

  // Redirect to Heartwood login
  redirect(302, loginUrl);
};
