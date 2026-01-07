/**
 * Better Auth Integration Utilities
 * Session-based authentication for AutumnsGrove via auth-api.grove.place
 */

const AUTH_BASE_URL = 'https://auth-api.grove.place';

// ==================== Types ====================

export interface BetterAuthUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
  createdAt: string;  // ISO 8601 date string from API
  updatedAt: string;  // ISO 8601 date string from API
}

export interface BetterAuthSession {
  user: BetterAuthUser;
  session: {
    id: string;
    userId: string;
    expiresAt: string;  // ISO 8601 date string from API
    token: string;
    ipAddress?: string;
    userAgent?: string;
  };
}

// ==================== Auth Operations ====================

/**
 * Start OAuth login flow by redirecting to Better Auth
 * @param provider - OAuth provider ('google' or 'github')
 * @param callbackURL - URL to redirect back to after login
 */
export function signIn(provider: 'google' | 'github', callbackURL?: string): void {
  const redirectUrl = callbackURL || window.location.href;
  const url = `${AUTH_BASE_URL}/api/auth/sign-in/${provider}?callbackURL=${encodeURIComponent(redirectUrl)}`;
  window.location.href = url;
}

/**
 * Get the current session (works both server-side and client-side)
 * @param cookieHeader - Optional cookie header for server-side requests
 * @returns Session data or null if not authenticated or on error
 */
export async function getSession(cookieHeader?: string): Promise<BetterAuthSession | null> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Server-side: pass cookie header
    if (cookieHeader) {
      headers['cookie'] = cookieHeader;
    }

    const res = await fetch(`${AUTH_BASE_URL}/api/auth/session`, {
      credentials: 'include', // Required for cross-origin cookies
      headers,
    });

    if (!res.ok) {
      return null;
    }

    return res.json();
  } catch (error) {
    // Network error or Better Auth unavailable
    console.error('[AUTH] Failed to fetch session:', error);
    return null;
  }
}

/**
 * Sign out the current user
 * @param cookieHeader - Optional cookie header for server-side requests
 * @throws Error if sign-out fails (caller should handle gracefully)
 */
export async function signOut(cookieHeader?: string): Promise<void> {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (cookieHeader) {
      headers['cookie'] = cookieHeader;
    }

    const res = await fetch(`${AUTH_BASE_URL}/api/auth/sign-out`, {
      method: 'POST',
      credentials: 'include',
      headers,
    });

    if (!res.ok) {
      throw new Error(`Sign-out failed: ${res.status} ${res.statusText}`);
    }
  } catch (error) {
    // Network error or Better Auth unavailable
    console.error('[AUTH] Sign-out request failed:', error);
    throw error; // Re-throw so caller can decide how to handle
  }
}

// ==================== CSRF Token Helpers ====================

/**
 * Get CSRF token from Better Auth
 * This is used for additional security on state-changing operations
 */
export async function getCSRFToken(): Promise<string | null> {
  try {
    const res = await fetch(`${AUTH_BASE_URL}/api/auth/csrf`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.csrfToken || null;
  } catch {
    return null;
  }
}
