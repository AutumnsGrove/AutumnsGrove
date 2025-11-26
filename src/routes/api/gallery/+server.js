import { json, error } from "@sveltejs/kit";

/**
 * Public API endpoint to list gallery images from R2
 * Returns all images for the public gallery mood board
 */
export async function GET({ url, platform }) {
  // Check for R2 binding
  if (!platform?.env?.IMAGES) {
    throw error(500, "R2 bucket not configured");
  }

  try {
    const cursor = url.searchParams.get("cursor") || undefined;
    const limit = parseInt(url.searchParams.get("limit") || "100", 10);

    // List objects from R2
    const listResult = await platform.env.IMAGES.list({
      cursor: cursor,
      limit: Math.min(limit, 500), // Allow larger batches for gallery
    });

    // Transform objects to include CDN URLs
    // Filter to only include image files
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif'];
    const images = listResult.objects
      .filter((obj) => {
        const key = obj.key.toLowerCase();
        return imageExtensions.some((ext) => key.endsWith(ext));
      })
      .map((obj) => ({
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
    console.error("Gallery list error:", err);
    throw error(500, "Failed to list gallery images");
  }
}
