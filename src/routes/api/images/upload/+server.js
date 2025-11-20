import { json, error } from "@sveltejs/kit";

export async function POST({ request, platform }) {
  // Check for R2 binding
  if (!platform?.env?.IMAGES) {
    throw error(500, "R2 bucket not configured");
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const folder = formData.get("folder") || "uploads";

    if (!file || !(file instanceof File)) {
      throw error(400, "No file provided");
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/svg+xml",
    ];
    if (!allowedTypes.includes(file.type)) {
      throw error(
        400,
        `Invalid file type: ${file.type}. Allowed: jpg, png, gif, webp, svg`,
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      throw error(400, "File too large. Maximum size is 10MB");
    }

    // Sanitize filename
    const sanitizedName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, "-")
      .replace(/-+/g, "-");

    // Sanitize folder path
    const sanitizedFolder = folder
      .toLowerCase()
      .replace(/[^a-z0-9/-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^\/+|\/+$/g, "");

    // Build the R2 key
    const key = `${sanitizedFolder}/${sanitizedName}`;

    // Upload to R2
    const arrayBuffer = await file.arrayBuffer();
    await platform.env.IMAGES.put(key, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Build CDN URL
    const cdnUrl = `https://cdn.autumnsgrove.com/${key}`;

    return json({
      success: true,
      url: cdnUrl,
      key: key,
      filename: sanitizedName,
      size: file.size,
      type: file.type,
      markdown: `![Alt text](${cdnUrl})`,
      svelte: `<img src="${cdnUrl}" alt="Description" />`,
    });
  } catch (err) {
    if (err.status) throw err;
    console.error("Upload error:", err);
    throw error(500, "Failed to upload image");
  }
}
