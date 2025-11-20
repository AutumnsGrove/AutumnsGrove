import { redirect } from "@sveltejs/kit";

export async function GET({ url, platform }) {
  const clientId = platform?.env?.GITHUB_CLIENT_ID;

  if (!clientId) {
    throw redirect(302, "/auth/login?error=server_error");
  }

  const redirectUri = `${url.origin}/auth/callback`;
  const state = crypto.randomUUID();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: "read:user",
    state: state,
  });

  throw redirect(302, `https://github.com/login/oauth/authorize?${params}`);
}
