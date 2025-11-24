import { json, error } from "@sveltejs/kit";

export async function GET({ url, platform, locals }) {
  // Authentication check
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }

  // Check for R2 binding
  if (!platform?.env?.IMAGES) {
    throw error(500, "R2 bucket not configured");
  }

  try {
    const prefix = url.searchParams.get("prefix") || "";
    const cursor = url.searchParams.get("cursor") || undefined;
    const limit = parseInt(url.searchParams.get("limit") || "50", 10);

    // List objects from R2
    const listResult = await platform.env.IMAGES.list({
      prefix: prefix,
      cursor: cursor,
      limit: Math.min(limit, 100), // Cap at 100
    });

    // Transform objects to include CDN URLs
    const images = listResult.objects.map((obj) => ({
      key: obj.key,
      url: `https://cdn.autumnsgrove.com/${obj.key}`,
      size: obj.size,
      uploaded: obj.uploaded,
    }));

    return json({
      success: true,
      images: images,
      cursor: listResult.cursor || null,
      truncated: listResult.truncated,
    });
  } catch (err) {
    console.error("List error:", err);
    throw error(500, "Failed to list images");
  }
}
