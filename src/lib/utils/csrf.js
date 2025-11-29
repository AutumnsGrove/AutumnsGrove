/**
 * CSRF Protection Utilities
 * Validates requests come from same origin
 */

/**
 * Validate CSRF token from request headers
 * @param {Request} request
 * @returns {boolean}
 */
export function validateCSRF(request) {
	const origin = request.headers.get('origin');
	const host = request.headers.get('host');

	// Allow same-origin requests
	if (origin) {
		try {
			const originUrl = new URL(origin);
			const isLocalhost = originUrl.hostname === 'localhost' ||
			                   originUrl.hostname === '127.0.0.1';
			const hostMatches = host && originUrl.host === host;

			if (!isLocalhost && !hostMatches) {
				return false;
			}
		} catch {
			return false;
		}
	}

	return true;
}
