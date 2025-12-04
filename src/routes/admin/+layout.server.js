import { redirect, error } from "@sveltejs/kit";

// Disable prerendering for all admin routes
// Admin pages require authentication and should be server-rendered at request time
export const prerender = false;

export async function load({ locals, url }) {
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

    // Otherwise, log the actual error with details
    console.error('[ADMIN LAYOUT ERROR]', {
      message: err.message,
      stack: err.stack,
      url: url.pathname,
      hasUser: !!locals.user,
    });

    // Throw a more descriptive error
    throw error(500, `Admin layout failed: ${err.message}`);
  }
}
