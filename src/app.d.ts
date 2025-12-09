// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

import type { AuthTokens } from '$lib/auth/groveauth';

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      user: {
        id: string;
        email: string;
        name: string | null;
      } | null;
      csrfToken: string;
      // Internal: used to pass refreshed tokens to response
      _newTokens?: AuthTokens;
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
        // GroveAuth configuration
        GROVEAUTH_CLIENT_ID: string;
        GROVEAUTH_CLIENT_SECRET: string;
        GROVEAUTH_REDIRECT_URI: string;
        // Legacy auth secrets (keep for rollback, remove after stable)
        SESSION_SECRET?: string;
        RESEND_API_KEY?: string;
        ALLOWED_ADMIN_EMAILS?: string;
      };
      context: {
        waitUntil(promise: Promise<unknown>): void;
      };
      caches: CacheStorage & { default: Cache };
    }
  }
}

export {};
