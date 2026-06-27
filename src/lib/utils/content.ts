/**
 * Content processing — anchor directives and header extraction.
 * Handles Grove markdown conventions for Vines compatibility.
 */

/**
 * Convert anchor directives to span elements for gutter positioning.
 * Handles both forms:
 *   - ::anchor[tagname]:: (markdown directive, rendered as text by marked)
 *   - <!-- anchor:tagname --> (HTML comment form)
 */
export function processAnchorTags(html: string): string {
	// Handle ::anchor[tagname]:: that ended up as text in a <p> tag
	html = html.replace(
		/<p>\s*::anchor\[([\w-]+)\]::\s*<\/p>/g,
		(_match, tagname) => `<span class="anchor-marker" data-anchor="${tagname}"></span>`
	);

	// Handle inline ::anchor[tagname]:: within other elements
	html = html.replace(
		/::anchor\[([\w-]+)\]::/g,
		(_match, tagname) => `<span class="anchor-marker" data-anchor="${tagname}"></span>`
	);

	// Handle <!-- anchor:tagname --> HTML comment form
	html = html.replace(
		/<!--\s*anchor:([\w-]+)\s*-->/g,
		(_match, tagname) => `<span class="anchor-marker" data-anchor="${tagname}"></span>`
	);

	return html;
}

/**
 * Extract headers from markdown source for TOC.
 * Strips code blocks first to avoid matching # in code.
 */
export function extractHeadersFromMarkdown(markdown: string): { id: string; text: string; level: number }[] {
	const headers: { id: string; text: string; level: number }[] = [];

	const withoutCode = markdown.replace(/```[\s\S]*?```/g, "");

	const headerRegex = /^(#{1,6})\s+(.+)$/gm;
	let match;
	while ((match = headerRegex.exec(withoutCode)) !== null) {
		const level = match[1].length;
		const text = match[2].trim();
		const id = text
			.toLowerCase()
			.replace(/[^\w\s-]/g, "")
			.replace(/\s+/g, "-")
			.replace(/-+/g, "-")
			.trim();

		headers.push({ level, text, id });
	}

	return headers;
}
