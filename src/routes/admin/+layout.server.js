import { redirect } from "@sveltejs/kit";

export async function load({ locals, url }) {
  if (!locals.user) {
    throw redirect(
      302,
      `/auth/login?redirect=${encodeURIComponent(url.pathname)}`,
    );
  }

  return {
    user: locals.user,
  };
}
