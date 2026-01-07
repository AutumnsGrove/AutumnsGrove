import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { validateRedirect } from '$lib/auth/constants';

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
