// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      user: {
        id: string;
        username: string;
        avatar: string;
      } | null;
    }
    // interface PageData {}
    // interface PageState {}
    interface Platform {
      env: {
        // KV Namespace for caching
        CACHE_KV: KVNamespace;
        // R2 Bucket for images
        IMAGES: R2Bucket;
        // D1 Database for git stats
        GIT_STATS_DB: D1Database;
        // Secrets
        GITHUB_TOKEN: string;
        ANTHROPIC_API_KEY: string;
        // OAuth secrets
        GITHUB_CLIENT_ID: string;
        GITHUB_CLIENT_SECRET: string;
        SESSION_SECRET: string;
        ADMIN_GITHUB_USERNAMES: string;
      };
      context: {
        waitUntil(promise: Promise<unknown>): void;
      };
      caches: CacheStorage & { default: Cache };
    }
  }
}

export {};
