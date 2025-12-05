/** @type {import('./$types').PageLoad} */
export async function load({ fetch }) {
  try {
    const response = await fetch("/api/timeline?limit=30");
    if (!response.ok) {
      throw new Error("Failed to load timeline");
    }
    const data = await response.json();
    return {
      summaries: data.summaries || [],
      pagination: data.pagination || {
        limit: 30,
        offset: 0,
        total: 0,
        hasMore: false,
      },
    };
  } catch (error) {
    console.error("Timeline load error:", error);
    return {
      summaries: [],
      pagination: { limit: 30, offset: 0, total: 0, hasMore: false },
      error: error.message,
    };
  }
}
