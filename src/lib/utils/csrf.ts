/**
 * CSRF Protection — inlined from Lattice engine, standalone version.
 */

export function generateCSRFToken(): string {
	return crypto.randomUUID();
}

export function timingSafeEqual(a: string, b: string): boolean {
	const maxLength = Math.max(a.length, b.length);
	let result = a.length ^ b.length;
	for (let i = 0; i < maxLength; i++) {
		result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
	}
	return result === 0;
}

export function validateCSRFToken(
	request: Request,
	sessionToken: string
): boolean {
	if (!sessionToken) return false;

	const headerToken = request.headers.get("x-csrf-token");
	const bodyToken = request.headers.get("csrf-token");

	if (!headerToken && !bodyToken) return false;

	return (
		(headerToken !== null && timingSafeEqual(headerToken, sessionToken)) ||
		(bodyToken !== null && timingSafeEqual(bodyToken, sessionToken))
	);
}

interface ValidateCSRFOptions {
	csrfToken?: string | null;
	expectedToken?: string | null;
}

export function validateCSRF(
	request: Request,
	debug?: boolean,
	options?: ValidateCSRFOptions
): boolean {
	if (!request || typeof request !== "object") return false;
	if (!request.headers || typeof request.headers.get !== "function") return false;

	const origin = request.headers.get("origin");
	const host =
		request.headers.get("x-forwarded-host") || request.headers.get("host");

	if (origin) {
		try {
			const originUrl = new URL(origin);

			if (!["http:", "https:"].includes(originUrl.protocol)) return false;

			const isLocalhost =
				originUrl.hostname === "localhost" ||
				originUrl.hostname === "127.0.0.1";

			if (!isLocalhost && originUrl.protocol !== "https:") return false;

			const hostUrl = host ? new URL(`${originUrl.protocol}//${host}`) : null;
			const isSameHost = hostUrl && originUrl.hostname === hostUrl.hostname;

			const defaultPort = originUrl.protocol === "https:" ? "443" : "80";
			const originPort = originUrl.port || defaultPort;
			const hostPort = hostUrl?.port || defaultPort;

			if (!isLocalhost && (!isSameHost || originPort !== hostPort)) return false;
		} catch {
			return false;
		}

		return true;
	}

	if (options?.csrfToken && options?.expectedToken) {
		return timingSafeEqual(options.csrfToken, options.expectedToken);
	}

	return false;
}
