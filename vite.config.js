import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  build: {
    // Disable source maps in production to prevent source code exposure
    sourcemap: false,
  },
  ssr: {
    // Include linked packages in the bundle to resolve their dependencies
    noExternal: ["@autumnsgrove/groveengine"],
  },
  resolve: {
    // Dedupe shared dependencies to prevent resolution issues with linked packages
    dedupe: ["svelte", "sonner", "bits-ui"],
  },
  server: {
    fs: {
      // Allow serving files from project root directories (dev only)
      allow: [".."],
    },
  },
});
