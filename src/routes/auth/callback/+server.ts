/**
 * OAuth Callback - Handle Heartwood authentication response
 *
 * Exchanges the authorization code for tokens, sets session cookies,
 * and redirects to the original destination.
 */

import { redirect } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { createClientFromEnv } from "$lib/auth/groveauth";

/** Session cookie duration: 30 days */
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

/** Default access token duration: 1 hour */
const DEFAULT_ACCESS_TOKEN_DURATION = 3600;

/** Buffer to subtract from token expiry to account for network latency (60 seconds) */
const TOKEN_EXPIRY_BUFFER_SECONDS = 60;

/** Map error codes to user-friendly messages */
const ERROR_MESSAGES: Record<string, string> = {
  access_denied: "You cancelled the login process",
  invalid_grant: "Login session expired, please try again",
  server_error: "Authentication service unavailable, please try later",
  invalid_state: "Login session expired, please try again",
  missing_verifier: "Login session expired, please try again",
  missing_code: "Login was not completed, please try again",
  token_exchange_failed: "Unable to complete login, please try again",
};

function getFriendlyErrorMessage(errorCode: string): string {
  return ERROR_MESSAGES[errorCode] || "An error occurred during login";
}

export const GET: RequestHandler = async ({ url, cookies, platform }) => {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");

  // Determine production mode early for cookie operations
  const isProduction =
    url.hostname !== "localhost" && url.hostname !== "127.0.0.1";

  // Helper to clear all auth state cookies (prevents reuse on errors)
  const clearAuthCookies = () => {
    cookies.delete("auth_state", {
      path: "/",
      httpOnly: true,
      secure: isProduction,
    });
    cookies.delete("auth_code_verifier", {
      path: "/",
      httpOnly: true,
      secure: isProduction,
    });
    cookies.delete("auth_return_to", {
      path: "/",
      httpOnly: true,
      secure: isProduction,
    });
  };

  // Check for error from Heartwood
  if (errorParam) {
    console.error("[Auth Callback] Error from Heartwood:", errorParam);
    clearAuthCookies();
    const friendlyMessage = getFriendlyErrorMessage(errorParam);
    redirect(302, `/?error=${encodeURIComponent(friendlyMessage)}`);
  }

  // Validate state (CSRF protection)
  const savedState = cookies.get("auth_state");
  if (!state || state !== savedState) {
    console.error("[Auth Callback] State mismatch - CSRF check failed");
    clearAuthCookies();
    redirect(
      302,
      `/?error=${encodeURIComponent(getFriendlyErrorMessage("invalid_state"))}`,
    );
  }

  // Get code verifier (PKCE)
  const codeVerifier = cookies.get("auth_code_verifier");
  if (!codeVerifier) {
    console.error("[Auth Callback] Missing code verifier");
    clearAuthCookies();
    redirect(
      302,
      `/?error=${encodeURIComponent(getFriendlyErrorMessage("missing_verifier"))}`,
    );
  }

  if (!code) {
    clearAuthCookies();
    redirect(
      302,
      `/?error=${encodeURIComponent(getFriendlyErrorMessage("missing_code"))}`,
    );
  }

  // Get return URL
  const returnTo = cookies.get("auth_return_to") || "/admin";

  // Clear auth state cookies before token exchange
  clearAuthCookies();

  try {
    // Create GroveAuth client
    const auth = createClientFromEnv(platform, url.origin);

    // Exchange code for tokens
    const tokens = await auth.exchangeCode(code, codeVerifier);

    // Set session cookies
    const cookieOptions = {
      path: "/",
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax" as const,
    };

    // Set access token (used for API calls and session verification)
    // Subtract buffer from expiry to prevent edge cases where cookie outlives token
    const accessTokenMaxAge = Math.max(
      (tokens.expires_in || DEFAULT_ACCESS_TOKEN_DURATION) -
        TOKEN_EXPIRY_BUFFER_SECONDS,
      60, // Minimum 60 seconds
    );
    cookies.set("access_token", tokens.access_token, {
      ...cookieOptions,
      maxAge: accessTokenMaxAge,
    });

    // Set refresh token
    if (tokens.refresh_token) {
      cookies.set("refresh_token", tokens.refresh_token, {
        ...cookieOptions,
        maxAge: SESSION_DURATION_SECONDS,
      });
    }

    // Set session identifier
    const sessionId = crypto.randomUUID();
    cookies.set("session", sessionId, {
      ...cookieOptions,
      maxAge: SESSION_DURATION_SECONDS,
    });

    // Redirect to the requested destination
    redirect(302, returnTo);
  } catch (err) {
    // Re-throw redirects
    if (
      err &&
      typeof err === "object" &&
      "status" in err &&
      err.status === 302
    ) {
      throw err;
    }

    console.error("[Auth Callback] Token exchange error:", err);
    redirect(
      302,
      `/?error=${encodeURIComponent(getFriendlyErrorMessage("token_exchange_failed"))}`,
    );
  }
};
