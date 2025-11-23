/**
 * Custom Cloudflare Worker entry point
 * Wraps the SvelteKit worker and adds scheduled event handling
 */

// Import the SvelteKit-generated worker
import worker from "../.svelte-kit/cloudflare/_worker.js";

export default {
  // Pass through fetch requests to SvelteKit
  fetch: worker.fetch,

  // Handle scheduled events (cron triggers)
  async scheduled(event, env, ctx) {
    console.log(`[Scheduled] Cron triggered at ${new Date().toISOString()}`);

    try {
      // Call the sync endpoint to update git stats
      const syncUrl = "https://autumnsgrove.dev/api/git/sync";

      const response = await fetch(syncUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: "AutumnsGrove",
          limit: 15,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Scheduled] Sync failed with status ${response.status}: ${errorText}`);
        return;
      }

      const result = await response.json();
      console.log(`[Scheduled] Sync completed successfully:`, {
        username: result.username,
        date: result.date,
        repos_synced: result.repos_synced,
        total_commits: result.total_commits,
      });
    } catch (error) {
      console.error("[Scheduled] Error during sync:", error);
    }
  },
};
