import { redirect, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  exchangeCode,
  createTokenCookies,
} from '$lib/auth/groveauth';

export const GET: RequestHandler = async ({ url, platform, cookies }) => {
  const env = platform?.env;

  if (!env?.GROVEAUTH_CLIENT_ID || !env?.GROVEAUTH_CLIENT_SECRET || !env?.GROVEAUTH_REDIRECT_URI) {
    error(500, 'GroveAuth not configured');
  }

  // Get callback parameters
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const authError = url.searchParams.get('error');
  const errorDescription = url.searchParams.get('error_description');

  // Handle auth errors from GroveAuth
  if (authError) {
    console.error('[AUTH CALLBACK] GroveAuth error:', authError, errorDescription);
    error(400, errorDescription || `Authentication failed: ${authError}`);
  }

  if (!code || !state) {
    error(400, 'Missing code or state parameter');
  }

  // Verify state matches what we sent
  const savedState = cookies.get('auth_state');
  if (state !== savedState) {
    console.error('[AUTH CALLBACK] State mismatch:', { received: state, expected: savedState });
    error(400, 'Invalid state - possible CSRF attack');
  }

  // Get code verifier for PKCE
  const codeVerifier = cookies.get('code_verifier');
  if (!codeVerifier) {
    error(400, 'Missing code verifier - auth session expired');
  }

  // Get original redirect destination
  const redirectTo = cookies.get('auth_redirect') || '/admin';

  // Clear auth flow cookies
  cookies.delete('auth_state', { path: '/' });
  cookies.delete('code_verifier', { path: '/' });
  cookies.delete('auth_redirect', { path: '/' });

  // Exchange code for tokens
  try {
    const tokens = await exchangeCode({
      code,
      codeVerifier,
      clientId: env.GROVEAUTH_CLIENT_ID,
      clientSecret: env.GROVEAUTH_CLIENT_SECRET,
      redirectUri: env.GROVEAUTH_REDIRECT_URI,
    });

    // Determine if production
    const isProduction = url.hostname !== 'localhost' && url.hostname !== '127.0.0.1';

    // Set token cookies
    const tokenCookies = createTokenCookies(tokens, isProduction);

    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectTo,
        'Set-Cookie': tokenCookies.join(', '),
      },
    });
  } catch (err) {
    console.error('[AUTH CALLBACK] Token exchange failed:', err);
    error(500, 'Authentication failed - could not exchange code for tokens');
  }
};
