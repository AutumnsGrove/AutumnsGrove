import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSession } from '$lib/auth/groveauth';

// Whitelist of allowed redirect paths (must match login whitelist)
const ALLOWED_REDIRECTS = [
  '/admin',
  '/admin/blog',
  '/admin/pages',
  '/admin/images',
  '/admin/analytics',
  '/admin/timeline',
  '/admin/logs',
  '/admin/settings',
  '/dashboard',
];

function validateRedirect(path: string): string {
  // Only allow internal paths (no external URLs)
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
    return '/admin';
  }

  // Normalize path
  const normalized = path.startsWith('/') ? path : `/${path}`;

  // Check if path is in whitelist or is a sub-path of allowed location
  const isAllowed = ALLOWED_REDIRECTS.some(allowed =>
    normalized === allowed || normalized.startsWith(`${allowed}/`)
  );

  return isAllowed ? normalized : '/admin';
}

/**
 * OAuth Callback Handler for Better Auth
 *
 * Better Auth handles the OAuth exchange and sets the session cookie.
 * This endpoint verifies the session was created successfully before redirecting.
 */
export const GET: RequestHandler = async ({ url, request }) => {
  // Get the redirect destination from query params
  const redirectParam = url.searchParams.get('redirect') || '/admin';
  const safeRedirect = validateRedirect(redirectParam);

  // Check for OAuth errors from Better Auth
  const authError = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  if (authError) {
    console.error('[AUTH CALLBACK] Better Auth error:', authError, errorDescription);
    throw error(400, errorDescription || `Authentication failed: ${authError}`);
  }

  // Verify that Better Auth actually created a session
  try {
    const cookieHeader = request.headers.get('cookie');
    const session = await getSession(cookieHeader);

    if (!session?.user) {
      console.error('[AUTH CALLBACK] No session found after OAuth callback');
      throw error(500, 'Authentication succeeded but no session was created. Please try again.');
    }

    // Session verified, redirect to destination
    redirect(302, safeRedirect);
  } catch (err) {
    // If it's already a redirect, re-throw it
    if (err?.status === 302) {
      throw err;
    }

    console.error('[AUTH CALLBACK] Session verification failed:', err);
    throw error(500, 'Failed to verify authentication session. Please try again.');
  }
};
