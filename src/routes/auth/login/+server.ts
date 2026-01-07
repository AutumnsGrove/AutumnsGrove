import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
  // Get redirect destination and provider (default to Google)
  const redirectTo = url.searchParams.get('redirect') || '/admin';
  const provider = url.searchParams.get('provider') || 'google';

  // Validate provider
  if (provider !== 'google' && provider !== 'github') {
    throw new Error('Invalid OAuth provider. Must be "google" or "github".');
  }

  // Build Better Auth OAuth URL
  const callbackURL = encodeURIComponent(`${url.origin}${redirectTo}`);
  const authUrl = `https://auth-api.grove.place/api/auth/sign-in/${provider}?callbackURL=${callbackURL}`;

  // Redirect to Better Auth
  redirect(302, authUrl);
};
