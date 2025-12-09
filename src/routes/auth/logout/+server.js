import { logout, clearTokenCookies, parseTokenCookies } from '$lib/auth/groveauth';

export async function GET({ request, url }) {
  const cookieHeader = request.headers.get('cookie');
  const { accessToken } = parseTokenCookies(cookieHeader);

  // Call GroveAuth logout (best effort - don't fail if it errors)
  if (accessToken) {
    try {
      await logout(accessToken);
    } catch (err) {
      console.warn('[LOGOUT] GroveAuth logout failed:', err.message);
    }
  }

  // Clear local token cookies
  const isProduction = url.hostname !== 'localhost' && url.hostname !== '127.0.0.1';
  const clearCookies = clearTokenCookies(isProduction);

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': clearCookies.join(', '),
    },
  });
}

// Also support POST for CSRF-protected logout
export async function POST({ request, url }) {
  return GET({ request, url });
}
