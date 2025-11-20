import { redirect } from "@sveltejs/kit";
import {
  createSession,
  createSessionCookie,
  isAllowedAdmin,
} from "$lib/auth/session.js";

export async function GET({ url, platform }) {
  const code = url.searchParams.get("code");

  if (!code) {
    throw redirect(302, "/auth/login?error=no_code");
  }

  const env = platform?.env;
  if (
    !env?.GITHUB_CLIENT_ID ||
    !env?.GITHUB_CLIENT_SECRET ||
    !env?.SESSION_SECRET
  ) {
    console.error("Missing OAuth environment variables");
    throw redirect(302, "/auth/login?error=server_error");
  }

  try {
    // Exchange code for access token
    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      },
    );

    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      console.error("Token error:", tokenData);
      throw redirect(302, "/auth/login?error=token_failed");
    }

    // Get GitHub user info
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "User-Agent": "AutumnsGrove-Admin",
      },
    });

    if (!userRes.ok) {
      console.error("User fetch error:", userRes.status);
      throw redirect(302, "/auth/login?error=token_failed");
    }

    const user = await userRes.json();

    // Check allowlist
    if (!isAllowedAdmin(user.login, env.ADMIN_GITHUB_USERNAMES || "")) {
      console.warn(`Unauthorized login attempt: ${user.login}`);
      throw redirect(302, "/auth/login?error=unauthorized");
    }

    // Create session
    const sessionToken = await createSession(
      {
        id: user.id.toString(),
        username: user.login,
        avatar: user.avatar_url,
      },
      env.SESSION_SECRET,
    );

    // Determine if production based on URL
    const isProduction =
      url.hostname !== "localhost" && !url.hostname.includes("127.0.0.1");

    // Set cookie and redirect to admin
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/admin",
        "Set-Cookie": createSessionCookie(sessionToken, isProduction),
      },
    });
  } catch (error) {
    // Re-throw redirects
    if (error?.status === 302) {
      throw error;
    }

    console.error("Auth error:", error);
    throw redirect(302, "/auth/login?error=server_error");
  }
}
