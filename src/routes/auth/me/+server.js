import { json } from '@sveltejs/kit';
import { getSession } from '$lib/auth/groveauth';

export async function GET({ request }) {
  const cookieHeader = request.headers.get('cookie');

  try {
    const sessionData = await getSession(cookieHeader);

    if (!sessionData?.user) {
      return json({ authenticated: false }, { status: 401 });
    }

    return json({
      authenticated: true,
      user: {
        id: sessionData.user.id,
        email: sessionData.user.email,
        name: sessionData.user.name || null,
      },
    });
  } catch (err) {
    console.error('[AUTH ME] Session verification failed:', err.message);
    return json(
      { authenticated: false, error: 'Session verification failed' },
      { status: 500 }
    );
  }
}
