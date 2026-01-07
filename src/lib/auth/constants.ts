/**
 * Authentication Constants
 * Shared across auth endpoints to prevent duplication
 */

/**
 * Whitelist of allowed redirect paths for post-login navigation.
 * Prevents open redirect vulnerabilities.
 *
 * To add new protected routes, add them here.
 */
export const ALLOWED_REDIRECTS = [
  '/admin',
  '/admin/blog',
  '/admin/pages',
  '/admin/images',
  '/admin/analytics',
  '/admin/timeline',
  '/admin/logs',
  '/admin/settings',
  '/dashboard',
] as const;

/**
 * Validates a redirect path against the whitelist.
 *
 * @param path - The redirect path to validate
 * @returns A safe redirect path, or '/admin' if validation fails
 */
export function validateRedirect(path: string): string {
  // Only allow internal paths (no external URLs)
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('//')) {
    return '/admin'; // Default to safe location
  }

  // Normalize path
  const normalized = path.startsWith('/') ? path : `/${path}`;

  // Check if path is in whitelist or is a sub-path of allowed location
  const isAllowed = ALLOWED_REDIRECTS.some(allowed =>
    normalized === allowed || normalized.startsWith(`${allowed}/`)
  );

  return isAllowed ? normalized : '/admin';
}
