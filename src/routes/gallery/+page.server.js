import { error } from "@sveltejs/kit";
import {
  parseImageFilename,
  getAvailableYears,
  getAvailableCategories,
} from "@autumnsgrove/grove-engine/utils/gallery";

/**
 * Server-side loader for the gallery page
 * Fetches images from R2, parses metadata, and joins with D1 data
 */
export async function load({ platform }) {
  // Check for R2 binding
  if (!platform?.env?.IMAGES) {
    // Return empty structure for local dev or if R2 not configured
    return {
      images: [],
      filters: {
        categories: [],
        years: [],
        tags: [],
        collections: [],
      },
    };
  }

  try {
    // Step 1: Fetch all images from R2
    const allImages = [];
    let cursor = undefined;
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"];

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

    // Step 2: Parse metadata from filenames
    const parsedImages = allImages.map((img) => {
      const parsed = parseImageFilename(img.key);
      return {
        ...img,
        r2_key: img.key,
        parsed_date: parsed.date,
        parsed_category: parsed.category,
        parsed_slug: parsed.slug,
        parsed_filename: parsed.filename,
        parsed_extension: parsed.extension,
      };
    });

    // Step 3: Batch query D1 for metadata and tags (if DB available)
    let d1Metadata = new Map();
    let allTags = [];
    let allCollections = [];

    if (platform?.env?.DB) {
      // Batch fetch gallery metadata (max 100 keys per batch to avoid SQL length limits)
      const batchSize = 100;
      for (let i = 0; i < parsedImages.length; i += batchSize) {
        const batch = parsedImages.slice(i, i + batchSize);
        const keys = batch.map((img) => img.r2_key);

        // Build parameterized query for batch
        const placeholders = keys.map(() => "?").join(",");
        const query = `
          SELECT
            gi.r2_key,
            gi.custom_title,
            gi.custom_description,
            gi.custom_date,
            gi.file_size,
            gi.uploaded_at,
            gi.id as db_id
          FROM gallery_images gi
          WHERE gi.r2_key IN (${placeholders})
        `;

        const results = await platform.env.DB.prepare(query)
          .bind(...keys)
          .all();

        // Store metadata by r2_key
        if (results.results) {
          results.results.forEach((row) => {
            d1Metadata.set(row.r2_key, row);
          });
        }
      }

      // Fetch tags for images that have D1 entries
      const dbIds = Array.from(d1Metadata.values()).map((m) => m.db_id);
      if (dbIds.length > 0) {
        // Batch fetch tags (max 100 IDs per batch)
        const tagsByImageId = new Map();
        for (let i = 0; i < dbIds.length; i += batchSize) {
          const batch = dbIds.slice(i, i + batchSize);
          const placeholders = batch.map(() => "?").join(",");
          const tagsQuery = `
            SELECT
              git.image_id,
              gt.id,
              gt.name,
              gt.slug,
              gt.color
            FROM gallery_image_tags git
            JOIN gallery_tags gt ON git.tag_id = gt.id
            WHERE git.image_id IN (${placeholders})
          `;

          const tagsResults = await platform.env.DB.prepare(tagsQuery)
            .bind(...batch)
            .all();

          if (tagsResults.results) {
            tagsResults.results.forEach((row) => {
              if (!tagsByImageId.has(row.image_id)) {
                tagsByImageId.set(row.image_id, []);
              }
              tagsByImageId.get(row.image_id).push({
                id: row.id,
                name: row.name,
                slug: row.slug,
                color: row.color,
              });
            });
          }
        }

        // Attach tags to metadata
        d1Metadata.forEach((meta) => {
          meta.tags = tagsByImageId.get(meta.db_id) || [];
        });
      }

      // Fetch all available tags (for filters)
      const allTagsResult = await platform.env.DB.prepare(
        "SELECT id, name, slug, color FROM gallery_tags ORDER BY name"
      ).all();
      allTags = allTagsResult.results || [];

      // Fetch all collections (for filters)
      const collectionsResult = await platform.env.DB.prepare(
        "SELECT id, name, slug, description FROM gallery_collections ORDER BY display_order, name"
      ).all();
      allCollections = collectionsResult.results || [];
    }

    // Step 4: Join R2 + D1 data
    const joinedImages = parsedImages.map((img) => {
      const metadata = d1Metadata.get(img.r2_key);

      return {
        // R2 data
        r2_key: img.r2_key,
        url: img.url,
        size: metadata?.file_size || img.size,
        uploaded: metadata?.uploaded_at || img.uploaded,

        // Parsed metadata
        parsed_date: img.parsed_date,
        parsed_category: img.parsed_category,
        parsed_slug: img.parsed_slug,
        parsed_filename: img.parsed_filename,

        // D1 custom metadata (if available)
        custom_title: metadata?.custom_title || null,
        custom_description: metadata?.custom_description || null,
        custom_date: metadata?.custom_date || null,
        tags: metadata?.tags || [],
        db_id: metadata?.db_id || null,
      };
    });

    // Step 5: Sort by date (custom_date || parsed_date || uploaded, newest first)
    joinedImages.sort((a, b) => {
      const dateA = a.custom_date || a.parsed_date || a.uploaded;
      const dateB = b.custom_date || b.parsed_date || b.uploaded;

      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;

      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    // Step 6: Extract filter options
    const categories = getAvailableCategories(joinedImages);
    const years = getAvailableYears(joinedImages);

    return {
      images: joinedImages,
      filters: {
        categories,
        years,
        tags: allTags,
        collections: allCollections,
      },
    };
  } catch (err) {
    console.error("Gallery load error:", err);
    throw error(500, "Failed to load gallery images");
  }
}
