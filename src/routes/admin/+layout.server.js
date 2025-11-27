import { redirect } from "@sveltejs/kit";
import { getSiteConfig } from "$lib/utils/markdown.js";

// Disable prerendering for all admin routes
// Admin pages require authentication and should be server-rendered at request time
export const prerender = false;

export async function load({ locals, url }) {
  if (!locals.user) {
    throw redirect(
      302,
      `/auth/login?redirect=${encodeURIComponent(url.pathname)}`,
    );
  }

  const siteConfig = getSiteConfig();

  return {
    user: locals.user,
    siteConfig,
  };
}
