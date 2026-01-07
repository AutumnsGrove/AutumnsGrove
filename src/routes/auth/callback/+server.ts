import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/**
 * OAuth Callback Handler for Better Auth
 *
 * Better Auth automatically handles the OAuth callback and sets the session cookie.
 * This endpoint is mainly for compatibility - we redirect to the desired page.
 * The actual session is managed by Better Auth via the cookie.
 */
export const GET: RequestHandler = async ({ url }) => {
  // Get the redirect destination from query params (set by Better Auth)
  const redirectTo = url.searchParams.get('redirect') || '/admin';

  // Better Auth has already set the session cookie by this point
  // Just redirect to the intended destination
  redirect(302, redirectTo);
};
