/**
 * Client-Side API Utilities
 * Wraps the groveengine api utility with automatic CSRF token injection
 */

/**
 * Get CSRF token from cookie or meta tag
 * @returns {string|null} CSRF token or null if not found
 */
function getCSRFToken() {
  if (typeof document === "undefined") return null; // SSR safety

  // Try cookie first
  const cookieToken = document.cookie
    .split("; ")
    .find((row) => row.startsWith("csrf_token="))
    ?.split("=")[1];

  if (cookieToken) return cookieToken;

  // Fallback to meta tag
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  return metaTag?.getAttribute("content") || null;
}

/**
 * Make API request with automatic CSRF protection
 * Handles both JSON and FormData requests
 *
 * @param {string} url - API endpoint URL
 * @param {RequestInit} options - Fetch options
 * @returns {Promise<any>} Parsed JSON response
 * @throws {Error} If request fails or returns error status
 */
async function apiRequest(url, options = {}) {
  const csrfToken = getCSRFToken();

  // Check if body is FormData (for file uploads)
  const isFormData = options.body instanceof FormData;

  // Merge headers with CSRF token
  // Don't set Content-Type for FormData - browser will set it with boundary
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...options.headers,
  };

  // Add CSRF token for state-changing requests
  const method = options.method?.toUpperCase() || "GET";
  const isStateMutating = ["POST", "PUT", "DELETE", "PATCH"].includes(method);

  if (isStateMutating && csrfToken) {
    headers["x-csrf-token"] = csrfToken;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "include", // Include cookies
  });

  // Handle non-OK responses
  if (!response.ok) {
    const text = await response.text();
    let message;
    try {
      const json = JSON.parse(text);
      message = json.message || json.error || text;
    } catch {
      message = text || response.statusText;
    }
    throw new Error(message);
  }

  // Parse JSON response
  const text = await response.text();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * API utility with convenience methods for common HTTP verbs
 * Automatically includes CSRF tokens in all state-changing requests
 */
export const api = {
  /**
   * Make a GET request
   * @param {string} url - API endpoint
   * @param {RequestInit} options - Additional fetch options
   * @returns {Promise<any>} Parsed response
   */
  get: (url, options = {}) => apiRequest(url, { ...options, method: "GET" }),

  /**
   * Make a POST request with JSON body
   * @param {string} url - API endpoint
   * @param {any} data - Request body (will be JSON stringified)
   * @param {RequestInit} options - Additional fetch options
   * @returns {Promise<any>} Parsed response
   */
  post: (url, data, options = {}) =>
    apiRequest(url, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    }),

  /**
   * Make a PUT request with JSON body
   * @param {string} url - API endpoint
   * @param {any} data - Request body (will be JSON stringified)
   * @param {RequestInit} options - Additional fetch options
   * @returns {Promise<any>} Parsed response
   */
  put: (url, data, options = {}) =>
    apiRequest(url, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    }),

  /**
   * Make a DELETE request
   * @param {string} url - API endpoint
   * @param {RequestInit} options - Additional fetch options
   * @returns {Promise<any>} Parsed response
   */
  delete: (url, options = {}) =>
    apiRequest(url, { ...options, method: "DELETE" }),

  /**
   * Make a PATCH request with JSON body
   * @param {string} url - API endpoint
   * @param {any} data - Request body (will be JSON stringified)
   * @param {RequestInit} options - Additional fetch options
   * @returns {Promise<any>} Parsed response
   */
  patch: (url, data, options = {}) =>
    apiRequest(url, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

export { apiRequest, getCSRFToken };
