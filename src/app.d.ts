declare global {
  namespace App {
    interface Locals {
      user: {
        id: string;
        email: string;
        name: string | null;
      } | null;
      csrfToken: string;
      newTokens?: {
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
      };
    }
    interface Platform {
      env: {
        GROVE_DB: D1Database;
        CURIO_DB: D1Database;
        MEDIA: R2Bucket;
        CACHE_KV: KVNamespace;
        GROVEAUTH: Fetcher;
        TENANT_ID: string;
        GITHUB_TOKEN: string;
        ANTHROPIC_API_KEY: string;
        GROVEAUTH_CLIENT_ID: string;
        GROVEAUTH_CLIENT_SECRET: string;
        SESSION_SECRET: string;
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
