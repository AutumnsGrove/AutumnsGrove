import { json } from '@sveltejs/kit';
import { verifyToken, parseTokenCookies } from '$lib/auth/groveauth';

export async function GET({ request }) {
  const cookieHeader = request.headers.get('cookie');
  const { accessToken } = parseTokenCookies(cookieHeader);

  if (!accessToken) {
    return json({ authenticated: false }, { status: 401 });
  }

  try {
    const tokenInfo = await verifyToken(accessToken);

    if (!tokenInfo.active) {
      return json({ authenticated: false }, { status: 401 });
    }

    return json({
      authenticated: true,
      user: {
        id: tokenInfo.sub,
        email: tokenInfo.email,
        name: tokenInfo.name || null,
      },
    });
  } catch (err) {
    console.error('[AUTH ME] Token verification failed:', err.message);
    return json({ authenticated: false, error: 'Token verification failed' }, { status: 500 });
  }
}
