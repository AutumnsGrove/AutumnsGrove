/**
 * Input validation and sanitization — standalone version (no Lattice media deps).
 */

const DANGEROUS_KEYS = ["__proto__", "constructor", "prototype"];

export function sanitizeObject<T>(obj: T): T {
	if (typeof obj !== "object" || obj === null) return obj;

	if (Array.isArray(obj)) {
		return Object.freeze(
			obj.map((item) =>
				typeof item === "object" && item !== null ? sanitizeObject(item) : item
			)
		) as T;
	}

	const sanitized: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(obj)) {
		const lowerKey = key.toLowerCase();
		if (
			DANGEROUS_KEYS.includes(key) ||
			DANGEROUS_KEYS.includes(lowerKey) ||
			key.includes("[") ||
			key.includes("]")
		) {
			continue;
		}

		sanitized[key] = typeof value === "object" && value !== null ? sanitizeObject(value) : value;
	}

	return Object.freeze(sanitized) as T;
}

export function sanitizeFilename(filename: string): string {
	if (!filename || typeof filename !== "string") return "";

	let clean = filename
		.replace(/[<>:"\\|?*\x00-\x1F]/g, "")
		.replace(/\.\./g, "_")
		.replace(/script/gi, "")
		.replace(/javascript/gi, "")
		.replace(/eval/gi, "")
		.replace(/\s+/g, "_")
		.replace(/^\.+/, "")
		.trim();

	if (clean.length === 0) clean = "file";
	if (clean.length > 255) clean = clean.substring(0, 255);

	return clean;
}

export function validatePath(path: string): boolean {
	if (!path || typeof path !== "string") return false;

	const normalized = path.toLowerCase().replace(/\\/g, "/");

	if (
		normalized.includes("..") ||
		normalized.includes("//") ||
		normalized.includes("%2e%2e") ||
		normalized.includes("..%2f") ||
		normalized.includes("%2f..") ||
		normalized.includes("0x2e0x2e") ||
		normalized.match(/\.\.[\\/]/) ||
		normalized.match(/[\\/]\.\./) ||
		path.startsWith("/") ||
		path.startsWith("\\")
	) {
		return false;
	}

	if (!/^[a-zA-Z0-9/_.-]+$/.test(path)) return false;

	return true;
}

export function validateEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email) && email.length < 255;
}

export function validateURL(url: string): boolean {
	try {
		const parsed = new URL(url);
		return ["http:", "https:"].includes(parsed.protocol);
	} catch {
		return false;
	}
}

export function validateSlug(slug: string): boolean {
	return /^[a-z0-9-]+$/.test(slug) && slug.length > 0 && slug.length < 200;
}

export function validateUUID(uuid: string): boolean {
	return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
}
