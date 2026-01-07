import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Whitelist of allowed redirect paths (prevent open redirect vulnerability)
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
    return '/admin'; // Default to safe location
  }

  // Normalize path
  const normalized = path.startsWith('/') ? path : `/${path}`;

  // Check if path is in whitelist or is a sub-path of allowed location
  const isAllowed = ALLOWED_REDIRECTS.some(allowed =>
    normalized === allowed || normalized.startsWith(`${allowed}/`)
  );

  return isAllowed ? normalized : '/admin';
}

export const GET: RequestHandler = async ({ url }) => {
  // Get redirect destination and provider (default to Google)
  const redirectParam = url.searchParams.get('redirect') || '/admin';
  const provider = url.searchParams.get('provider') || 'google';

  // Validate provider
  if (provider !== 'google' && provider !== 'github') {
    throw error(400, 'Invalid OAuth provider. Must be "google" or "github".');
  }

  // Validate and sanitize redirect destination
  const safeRedirect = validateRedirect(redirectParam);

  // Build Better Auth OAuth URL with proper callback flow
  // Better Auth will redirect back to our callback endpoint with the redirect parameter
  const callbackURL = encodeURIComponent(`${url.origin}/auth/callback?redirect=${encodeURIComponent(safeRedirect)}`);
  const authUrl = `https://auth-api.grove.place/api/auth/sign-in/${provider}?callbackURL=${callbackURL}`;

  // Redirect to Better Auth
  redirect(302, authUrl);
};
