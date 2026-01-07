import { redirect } from '@sveltejs/kit';
import { signOut } from '$lib/auth/groveauth';

/**
 * Logout Handler
 *
 * Uses GET-only to avoid CSRF complexity (logout is idempotent and safe).
 * Better Auth clears the session cookie server-side.
 */
export async function GET({ request }) {
  const cookieHeader = request.headers.get('cookie');

  // Sign out via Better Auth (best effort)
  try {
    await signOut(cookieHeader);
  } catch (err) {
    // Even if Better Auth fails, we still redirect home
    // The session cookie will expire naturally or be cleared on next login
    console.warn('[LOGOUT] Better Auth sign out failed (non-fatal):', err.message);
  }

  // Redirect to home page
  redirect(302, '/');
}
