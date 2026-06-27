import type { Header } from "./gutter";

export function extractHeadersFromHtml(html: string): Header[] {
	const headers: Header[] = [];
	const headerRegex = /<h([1-6])[^>]*id="([^"]*)"[^>]*>([^<]*)<\/h[1-6]>/gi;
	let match;
	while ((match = headerRegex.exec(html)) !== null) {
		headers.push({
			level: parseInt(match[1]),
			id: match[2],
			text: match[3].trim(),
		});
	}
	return headers;
}
