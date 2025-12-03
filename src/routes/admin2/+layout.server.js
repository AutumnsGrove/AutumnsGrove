import { redirect } from "@sveltejs/kit";

// Disable prerendering for admin routes
export const prerender = false;

export async function load({ locals, url }) {
  console.log("[admin2] Layout load - checking auth");
  console.log("[admin2] locals.user:", locals.user);

  if (!locals.user) {
    console.log("[admin2] No user, redirecting to login");
    throw redirect(
      302,
      `/auth/login?redirect=${encodeURIComponent(url.pathname)}`,
    );
  }

  console.log("[admin2] User authenticated:", locals.user.email);
  return {
    user: locals.user,
  };
}
