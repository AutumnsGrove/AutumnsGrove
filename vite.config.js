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
    noExternal: [
      "@autumnsgrove/lattice",
      "@autumnsgrove/grove-markdown",
      "@autumnsgrove/grove-errors",
      "@autumnsgrove/grove-crypto",
      "@autumnsgrove/prism",
      "@autumnsgrove/infra",
      "@autumnsgrove/curios",
    ],
  },
  resolve: {
    // Dedupe shared dependencies to prevent resolution issues with linked packages
    dedupe: ["svelte", "sonner", "bits-ui"],
  },
  optimizeDeps: {
    // Exclude JXL codec from optimization - it uses IIFE workers that conflict with code-splitting
    exclude: ["@jsquash/jxl"],
  },
  worker: {
    // Use ES format for workers to support code-splitting
    format: "es",
  },
  server: {
    fs: {
      // Allow serving files from project root directories (dev only)
      allow: [".."],
    },
  },
});
