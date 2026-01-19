/**
 * Current User Endpoint
 *
 * Returns the authenticated user's information from the token.
 * User is populated by hooks.server.js via token verification.
 */

import { json } from "@sveltejs/kit";

export async function GET({ locals }) {
  if (!locals.user) {
    return json({ authenticated: false }, { status: 401 });
  }

  return json({
    authenticated: true,
    user: {
      id: locals.user.id,
      email: locals.user.email,
      name: locals.user.name || null,
    },
  });
}
