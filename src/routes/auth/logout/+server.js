import { redirect } from "@sveltejs/kit";
import { clearSessionCookie } from "$lib/auth/session";

export async function GET() {
  return new Response(null, {
    status: 302,
    headers: {
      Location: "/auth/login",
      "Set-Cookie": clearSessionCookie(),
    },
  });
}
