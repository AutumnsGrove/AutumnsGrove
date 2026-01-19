/**
 * Cookie Utilities
 *
 * Shared helper functions for cookie operations.
 */

/**
 * Extract a cookie value from a cookie header string
 *
 * @param cookieHeader - The raw cookie header string
 * @param name - The name of the cookie to extract
 * @returns The cookie value or null if not found
 */
export function getCookie(
  cookieHeader: string | null,
  name: string,
): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return match ? match[1] : null;
}
