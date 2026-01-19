/**
 * GroveAuth (Heartwood) Client
 *
 * Standard OAuth 2.0 + PKCE integration with Heartwood authentication service.
 * This replaces the old Better Auth session-based approach with proper token-based auth.
 *
 * URLs:
 * - Login UI: https://heartwood.grove.place
 * - API Base: https://auth-api.grove.place
 */

// =============================================================================
// CONFIGURATION
// =============================================================================

const HEARTWOOD_LOGIN_URL = "https://heartwood.grove.place";
const GROVEAUTH_API_URL = "https://auth-api.grove.place";

// =============================================================================
// TYPES
// =============================================================================

export interface GroveAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;
  refresh_token?: string; // Optional on token refresh
  scope: string;
}

export interface TokenInfo {
  active: boolean;
  sub?: string;
  email?: string;
  name?: string;
  exp?: number;
  iat?: number;
  client_id?: string;
}

export interface UserInfo {
  sub: string;
  email: string;
  name: string | null;
  picture: string | null;
  provider: "google" | "discord" | "magic_code";
}

export interface LoginUrlResult {
  url: string;
  state: string;
  codeVerifier: string;
}

export class GroveAuthError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400) {
    super(message);
    this.name = "GroveAuthError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

// =============================================================================
// PKCE HELPERS
// =============================================================================

/**
 * Generate a cryptographically secure random string for PKCE
 */
function generateRandomString(length: number): string {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const randomValues = new Uint8Array(length);
  crypto.getRandomValues(randomValues);
  return Array.from(
    randomValues,
    (byte) => charset[byte % charset.length],
  ).join("");
}

/**
 * Generate a code verifier for PKCE (64 characters)
 */
export function generateCodeVerifier(): string {
  return generateRandomString(64);
}

/**
 * Generate a code challenge from a code verifier using SHA-256
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
  // URL-safe base64
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Generate a random state parameter for CSRF protection
 */
export function generateState(): string {
  return crypto.randomUUID();
}

// =============================================================================
// GROVEAUTH CLIENT CLASS
// =============================================================================

export class GroveAuthClient {
  private config: GroveAuthConfig;

  constructor(config: GroveAuthConfig) {
    this.config = config;
  }

  /**
   * Generate a login URL with PKCE parameters.
   * Store the state and codeVerifier in secure httpOnly cookies for verification.
   */
  async getLoginUrl(returnTo?: string): Promise<LoginUrlResult> {
    const state = generateState();
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    // Include return_to in state if provided (will be stored in cookie separately)
    return {
      url: `${HEARTWOOD_LOGIN_URL}/login?${params}`,
      state,
      codeVerifier,
    };
  }

  /**
   * Exchange an authorization code for tokens
   */
  async exchangeCode(
    code: string,
    codeVerifier: string,
  ): Promise<TokenResponse> {
    const response = await fetch(`${GROVEAUTH_API_URL}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: this.config.redirectUri,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code_verifier: codeVerifier,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new GroveAuthError(
        data.error || "token_error",
        data.error_description || data.message || "Failed to exchange code",
        response.status,
      );
    }

    return data as TokenResponse;
  }

  /**
   * Verify an access token and get token info
   */
  async verifyToken(accessToken: string): Promise<TokenInfo | null> {
    try {
      const response = await fetch(`${GROVEAUTH_API_URL}/verify`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.debug(
          "[GroveAuth] Token verification failed:",
          response.status,
        );
        return null;
      }

      const data = (await response.json()) as TokenInfo;
      if (!data.active) {
        console.debug("[GroveAuth] Token is inactive");
      }
      return data.active ? data : null;
    } catch (error) {
      console.error(
        "[GroveAuth] Token verification error:",
        error instanceof Error ? error.message : "Unknown error",
      );
      return null;
    }
  }

  /**
   * Get user info using an access token
   */
  async getUserInfo(accessToken: string): Promise<UserInfo | null> {
    try {
      const response = await fetch(`${GROVEAUTH_API_URL}/userinfo`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      return response.json() as Promise<UserInfo>;
    } catch {
      return null;
    }
  }

  /**
   * Refresh an access token using a refresh token
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch(`${GROVEAUTH_API_URL}/token/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new GroveAuthError(
        data.error || "refresh_error",
        data.error_description || data.message || "Failed to refresh token",
        response.status,
      );
    }

    return data as TokenResponse;
  }

  /**
   * Revoke a refresh token (logout)
   */
  async revokeToken(refreshToken: string): Promise<void> {
    const response = await fetch(`${GROVEAUTH_API_URL}/token/revoke`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        token: refreshToken,
        token_type_hint: "refresh_token",
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new GroveAuthError(
        data.error || "revoke_error",
        data.error_description || data.message || "Failed to revoke token",
        response.status,
      );
    }
  }

  /**
   * Full logout - revokes tokens on the server
   */
  async logout(accessToken: string): Promise<void> {
    try {
      await fetch(`${GROVEAUTH_API_URL}/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {
      // Best effort - logout should succeed even if API call fails
    }
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a GroveAuth client instance
 */
export function createGroveAuthClient(
  config: GroveAuthConfig,
): GroveAuthClient {
  return new GroveAuthClient(config);
}

// =============================================================================
// HELPER: Create client from platform env
// =============================================================================

/**
 * Create a GroveAuth client from Cloudflare platform environment
 *
 * @throws Error if GROVEAUTH_CLIENT_SECRET is not configured
 */
export function createClientFromEnv(
  platform: App.Platform | undefined,
  origin: string,
): GroveAuthClient {
  const clientSecret = platform?.env?.GROVEAUTH_CLIENT_SECRET;

  if (!clientSecret) {
    throw new Error(
      "GROVEAUTH_CLIENT_SECRET is required. Configure it in your Cloudflare Pages environment.",
    );
  }

  return new GroveAuthClient({
    clientId: platform?.env?.GROVEAUTH_CLIENT_ID || "autumnsgrove",
    clientSecret,
    redirectUri: `${origin}/auth/callback`,
  });
}
