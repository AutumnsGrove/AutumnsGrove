import { redirect } from "@sveltejs/kit";
import { getSiteConfig } from "$lib/utils/markdown.js";

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
