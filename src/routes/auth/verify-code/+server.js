import { json } from "@sveltejs/kit";
import { createSession, createSessionCookie } from "$lib/auth/session.js";

export async function POST({ request, platform, url }) {
  const env = platform?.env;

  if (!env) {
    return json({ error: "Server configuration error" }, { status: 500 });
  }

  const { SESSION_SECRET, GIT_STATS_DB } = env;

  if (!SESSION_SECRET || !GIT_STATS_DB) {
    return json({ error: "Server configuration error" }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, code } = body;

  if (!email || typeof email !== "string") {
    return json({ error: "Email is required" }, { status: 400 });
  }

  if (!code || typeof code !== "string") {
    return json({ error: "Code is required" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedCode = code.trim();

  // Validate code format
  if (!/^\d{6}$/.test(normalizedCode)) {
    return json({ error: "Invalid code format" }, { status: 400 });
  }

  const now = Date.now();

  // Look up code in database
  let result;
  try {
    result = await GIT_STATS_DB.prepare(
      "SELECT * FROM magic_codes WHERE email = ? AND code = ? AND used = 0 AND expires_at > ?"
    ).bind(normalizedEmail, normalizedCode, now).first();
  } catch (error) {
    console.error("Database error:", error);
    return json({ error: "Verification failed" }, { status: 500 });
  }

  if (!result) {
    return json({ error: "Invalid or expired code" }, { status: 400 });
  }

  // Mark code as used
  try {
    await GIT_STATS_DB.prepare(
      "UPDATE magic_codes SET used = 1 WHERE id = ?"
    ).bind(result.id).run();
  } catch (error) {
    console.error("Database error:", error);
    // Continue anyway - code was valid
  }

  // Create session
  const user = { email: normalizedEmail };
  const token = await createSession(user, SESSION_SECRET);

  // Determine if production
  const isProduction = url.hostname !== "localhost" && !url.hostname.includes("127.0.0.1");
  const cookie = createSessionCookie(token, isProduction);

  return json(
    { success: true, redirect: "/admin" },
    {
      headers: {
        "Set-Cookie": cookie,
      },
    }
  );
}
