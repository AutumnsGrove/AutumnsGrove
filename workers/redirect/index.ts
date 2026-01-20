/**
 * AutumnsGrove Redirect Worker
 *
 * Redirects all traffic from autumnsgrove.com to autumn.grove.place
 * with proper 301 permanent redirects for SEO preservation.
 */

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Build the new URL preserving path and query
    const newUrl = `https://autumn.grove.place${url.pathname}${url.search}`;

    // 301 = permanent redirect (good for SEO)
    return Response.redirect(newUrl, 301);
  },
};
