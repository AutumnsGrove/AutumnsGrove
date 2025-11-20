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

  return resolve(event);
}
