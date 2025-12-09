import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  getLoginUrl,
} from '$lib/auth/groveauth';

export const GET: RequestHandler = async ({ url, platform, cookies }) => {
  const env = platform?.env;

  if (!env?.GROVEAUTH_CLIENT_ID || !env?.GROVEAUTH_REDIRECT_URI) {
    throw new Error('GroveAuth not configured - missing GROVEAUTH_CLIENT_ID or GROVEAUTH_REDIRECT_URI');
  }

  // Generate PKCE challenge
  const state = crypto.randomUUID();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Preserve the original redirect destination
  const redirectTo = url.searchParams.get('redirect') || '/admin';

  // Determine if production for cookie security
  const isProduction = url.hostname !== 'localhost' && url.hostname !== '127.0.0.1';

  // Store state and verifier in cookies (short-lived for auth flow)
  const cookieOptions = {
    path: '/',
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    maxAge: 600, // 10 minutes - auth flow should complete quickly
  };

  cookies.set('auth_state', state, cookieOptions);
  cookies.set('code_verifier', codeVerifier, cookieOptions);
  cookies.set('auth_redirect', redirectTo, cookieOptions);

  // Redirect to GroveAuth
  const loginUrl = getLoginUrl({
    clientId: env.GROVEAUTH_CLIENT_ID,
    redirectUri: env.GROVEAUTH_REDIRECT_URI,
    state,
    codeChallenge,
  });

  redirect(302, loginUrl);
};
