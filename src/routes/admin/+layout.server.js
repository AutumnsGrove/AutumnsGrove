import { redirect, error } from "@sveltejs/kit";

// Disable prerendering for all admin routes
// Admin pages require authentication and should be server-rendered at request time
export const prerender = false;

export async function load({ locals, url }) {
  // Debug info
  const debugInfo = {
    hasUser: !!locals.user,
    userEmail: locals.user?.email || 'none',
    pathname: url.pathname,
  };

  try {
    if (!locals.user) {
      throw redirect(
        302,
        `/auth/login?redirect=${encodeURIComponent(url.pathname)}`,
      );
    }

    return {
      user: locals.user,
    };
  } catch (err) {
    // If it's a redirect, let it through
    if (err.status === 302) {
      throw err;
    }

    // Otherwise, throw a descriptive error with debug info
    throw error(500, `Admin layout error: ${err.message} | Debug: ${JSON.stringify(debugInfo)} | Stack: ${err.stack?.substring(0, 200)}`);
  }
}
