import { error } from "@sveltejs/kit";

/**
 * Server-side loader for the gallery page
 * Fetches all images from R2 bucket
 */
export async function load({ platform }) {
  // Check for R2 binding
  if (!platform?.env?.IMAGES) {
    // Return empty array for local dev or if R2 not configured
    return {
      images: [],
      truncated: false,
    };
  }

  try {
    // Fetch all images (may need pagination for very large galleries)
    const allImages = [];
    let cursor = undefined;
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"];

    // Paginate through all images
    do {
      const listResult = await platform.env.IMAGES.list({
        cursor: cursor,
        limit: 500,
      });

      // Filter and transform objects
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

      allImages.push(...images);
      cursor = listResult.truncated ? listResult.cursor : undefined;
    } while (cursor);

    // Sort by upload date (newest first)
    allImages.sort(
      (a, b) => new Date(b.uploaded).getTime() - new Date(a.uploaded).getTime()
    );

    return {
      images: allImages,
      truncated: false,
    };
  } catch (err) {
    console.error("Gallery load error:", err);
    throw error(500, "Failed to load gallery images");
  }
}
