import { json } from "@sveltejs/kit";
import { isAllowedAdmin } from "$lib/auth/session.js";

/**
 * Generate a random 6-digit code
 * @returns {string}
 */
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send magic code via Resend
 * @param {string} email
 * @param {string} code
 * @param {string} apiKey
 */
async function sendEmail(email, code, apiKey) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Autumns Grove <noreply@autumnsgrove.com>",
      to: [email],
      subject: "Your login code for Autumns Grove",
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #24292e; margin-bottom: 20px;">Admin Login Code</h2>
          <p style="color: #586069; margin-bottom: 20px;">
            Here's your verification code to access the Autumns Grove admin panel:
          </p>
          <div style="background: #f6f8fa; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #24292e;">
              ${code}
            </span>
          </div>
          <p style="color: #6a737d; font-size: 14px;">
            This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.
          </p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }

  return response.json();
}

export async function POST({ request, platform }) {
  const env = platform?.env;

  if (!env) {
    return json({ error: "Server configuration error" }, { status: 500 });
  }

  const { RESEND_API_KEY, ALLOWED_ADMIN_EMAILS, SESSION_SECRET, GIT_STATS_DB } = env;

  if (!RESEND_API_KEY || !ALLOWED_ADMIN_EMAILS || !SESSION_SECRET || !GIT_STATS_DB) {
    return json({ error: "Server configuration error" }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email } = body;

  if (!email || typeof email !== "string") {
    return json({ error: "Email is required" }, { status: 400 });
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check if email is allowed
  if (!isAllowedAdmin(normalizedEmail, ALLOWED_ADMIN_EMAILS)) {
    // Return generic message to prevent email enumeration
    return json({ success: true, message: "If this email is registered, a code has been sent." });
  }

  // Generate code
  const code = generateCode();
  const now = Date.now();
  const expiresAt = now + 10 * 60 * 1000; // 10 minutes

  // Store code in D1
  try {
    // Clean up old codes for this email
    await GIT_STATS_DB.prepare(
      "DELETE FROM magic_codes WHERE email = ? OR expires_at < ?"
    ).bind(normalizedEmail, now).run();

    // Insert new code
    await GIT_STATS_DB.prepare(
      "INSERT INTO magic_codes (email, code, created_at, expires_at, used) VALUES (?, ?, ?, ?, 0)"
    ).bind(normalizedEmail, code, now, expiresAt).run();
  } catch (error) {
    console.error("Database error:", error);
    return json({ error: "Failed to generate code" }, { status: 500 });
  }

  // Send email
  try {
    await sendEmail(normalizedEmail, code, RESEND_API_KEY);
  } catch (error) {
    console.error("Email error:", error);
    return json({ error: "Failed to send email" }, { status: 500 });
  }

  return json({ success: true, message: "If this email is registered, a code has been sent." });
}
