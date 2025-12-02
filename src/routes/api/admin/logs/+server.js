import { json, error } from "@sveltejs/kit";
import {
  getLogs,
  getAllLogs,
  getLogStats,
  subscribe,
} from "$lib/server/logger.js";
import { verifySession, isAllowedAdmin } from "@autumnsgrove/groveengine/auth/session";

export const prerender = false;

/**
 * GET /api/admin/logs
 * Returns logs for admin console
 *
 * Query params:
 * - category: 'api' | 'github' | 'errors' | 'cache' | 'all' (default: 'all')
 * - since: ISO timestamp to get logs after this time
 * - stream: 'true' for Server-Sent Events streaming
 */
export async function GET({ url, request, cookies, platform }) {
  // Verify admin authentication
  const sessionToken = cookies.get("session");
  if (!sessionToken) {
    throw error(401, "Authentication required");
  }

  let user;
  try {
    user = await verifySession(sessionToken, platform.env.SESSION_SECRET);
    if (!user) {
      throw error(401, "Invalid session");
    }
  } catch (e) {
    if (e.status) throw e;
    throw error(401, "Authentication failed");
  }

  // Verify admin access
  const allowedAdmins = platform.env.ALLOWED_EMAILS || "";
  if (!isAllowedAdmin(user.email, allowedAdmins)) {
    throw error(403, "Admin access required");
  }

  const category = url.searchParams.get("category") || "all";
  const since = url.searchParams.get("since");
  const stream = url.searchParams.get("stream") === "true";

  // Server-Sent Events streaming
  if (stream) {
    const encoder = new TextEncoder();

    // Create a readable stream for SSE
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const initialData = `data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`;
        controller.enqueue(encoder.encode(initialData));

        // Send existing logs immediately
        const existingLogs =
          category === "all" ? getAllLogs() : getLogs(category);
        if (existingLogs.length > 0) {
          const data = `data: ${JSON.stringify({ type: "initial", logs: existingLogs })}\n\n`;
          controller.enqueue(encoder.encode(data));
        }

        // Subscribe to new logs
        const unsubscribe = subscribe((log) => {
          // Filter by category if specified
          if (category !== "all" && log.category !== category) {
            return;
          }

          try {
            const data = `data: ${JSON.stringify({ type: "log", log })}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch (error) {
            console.error("[SSE] Failed to send log:", error);
          }
        });

        // Send periodic heartbeat to keep connection alive
        const heartbeatInterval = setInterval(() => {
          try {
            const data = `data: ${JSON.stringify({ type: "heartbeat", timestamp: new Date().toISOString() })}\n\n`;
            controller.enqueue(encoder.encode(data));
          } catch (error) {
            console.error("[SSE] Heartbeat failed:", error);
            clearInterval(heartbeatInterval);
          }
        }, 30000); // Every 30 seconds

        // Handle client disconnect
        request.signal.addEventListener("abort", () => {
          clearInterval(heartbeatInterval);
          unsubscribe();
          try {
            controller.close();
          } catch (error) {
            // Controller might already be closed
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // Disable nginx buffering
      },
    });
  }

  // Regular JSON response (non-streaming)
  try {
    let logs;

    if (category === "all") {
      logs = getAllLogs(since);
    } else if (["api", "github", "errors", "cache"].includes(category)) {
      logs = getLogs(category, since);
    } else {
      return json({ error: "Invalid category" }, { status: 400 });
    }

    const stats = getLogStats();

    return json({
      category,
      logs,
      stats,
      count: logs.length,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    console.error("[API] Error fetching logs:", e);
    return json(
      { error: "Failed to fetch logs" },
      { status: 500 },
    );
  }
}
