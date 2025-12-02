import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  plugins: [sveltekit()],
  build: {
    // Disable source maps in production to prevent source code exposure
    sourcemap: false,
  },
  resolve: {
    alias: {
      // TODO: Remove these aliases once @autumnsgrove/groveengine package is properly built/published
      // Redirect groveengine imports to local files while package is being fixed
      "@autumnsgrove/groveengine/components/ui/toast": path.resolve(
        "./src/lib/components/ui/toast.ts",
      ),
      "@autumnsgrove/groveengine/components/ui/table": path.resolve(
        "./src/lib/components/ui/table",
      ),
      "@autumnsgrove/groveengine/components/ui": path.resolve(
        "./src/lib/components/ui",
      ),
      "@autumnsgrove/groveengine/utils/markdown": path.resolve(
        "./src/lib/utils/markdown.js",
      ),
      "@autumnsgrove/groveengine/utils/sanitize": path.resolve(
        "./src/lib/utils/sanitize.js",
      ),
      "@autumnsgrove/groveengine/utils/gallery": path.resolve(
        "./src/lib/utils/gallery.js",
      ),
      "@autumnsgrove/groveengine/utils/api": path.resolve(
        "./src/lib/utils/api.js",
      ),
      "@autumnsgrove/groveengine/utils/csrf": path.resolve(
        "./src/lib/utils/csrf.js",
      ),
      "@autumnsgrove/groveengine/utils/validation": path.resolve(
        "./src/lib/utils/validation.js",
      ),
      "@autumnsgrove/groveengine/auth/session": path.resolve(
        "./src/lib/auth/session.js",
      ),
      "@autumnsgrove/groveengine": path.resolve(
        "./src/lib/groveengine-local.js",
      ),
    },
  },
  server: {
    fs: {
      // Allow serving files from project root directories (dev only)
      allow: [".."],
    },
  },
});
