import { json, error } from "@sveltejs/kit";

export async function DELETE({ request, platform, locals }) {
  // Authentication check
  if (!locals.user) {
    throw error(401, "Unauthorized");
  }

  // Check for R2 binding
  if (!platform?.env?.IMAGES) {
    throw error(500, "R2 bucket not configured");
  }

  try {
    const { key } = await request.json();

    if (!key || typeof key !== "string") {
      throw error(400, "No file key provided");
    }

    // Sanitize key to prevent directory traversal
    const sanitizedKey = key
      .replace(/\.\./g, "")
      .replace(/^\/+/, "");

    if (!sanitizedKey) {
      throw error(400, "Invalid file key");
    }

    // Check if file exists before deleting
    const existingFile = await platform.env.IMAGES.head(sanitizedKey);
    if (!existingFile) {
      throw error(404, "File not found");
    }

    // Delete from R2
    await platform.env.IMAGES.delete(sanitizedKey);

    return json({
      success: true,
      key: sanitizedKey,
      message: "File deleted successfully",
    });
  } catch (err) {
    if (err.status) throw err;
    console.error("Delete error:", err);
    throw error(500, "Failed to delete image");
  }
}
