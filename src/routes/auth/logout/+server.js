import { signOut } from '$lib/auth/groveauth';

export async function GET({ request, url }) {
  const cookieHeader = request.headers.get('cookie');

  // Sign out via Better Auth
  try {
    await signOut(cookieHeader);
  } catch (err) {
    console.warn('[LOGOUT] Better Auth sign out failed:', err.message);
  }

  // Redirect to home page
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      // Better Auth clears the session cookie on sign-out
    },
  });
}

// Also support POST for CSRF-protected logout
export async function POST({ request, url }) {
  return GET({ request, url });
}
