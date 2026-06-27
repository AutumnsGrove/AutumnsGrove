/**
 * Gutter utilities — inlined from Lattice, standalone with local types.
 */

export interface GutterItem {
	type: "comment" | "markdown" | "photo" | "image";
	content?: string;
	src?: string;
	url?: string;
	file?: string;
	caption?: string;
	alt?: string;
	anchor?: string;
}

export type AnchorType = "none" | "paragraph" | "tag" | "header";

export interface ParsedAnchor {
	type: AnchorType;
	value: string | number | null;
}

export interface Header {
	id: string;
	text: string;
	level?: number;
}

export function parseAnchor(anchor: string | undefined | null): ParsedAnchor {
	if (!anchor) return { type: "none", value: null };

	const paragraphMatch = anchor.match(/^paragraph:(\d+)$/);
	if (paragraphMatch) return { type: "paragraph", value: parseInt(paragraphMatch[1], 10) };

	const tagMatch = anchor.match(/^anchor:([\w-]+)$/);
	if (tagMatch) return { type: "tag", value: tagMatch[1] };

	const headerMatch = anchor.match(/^(#{1,6})\s+(.+)$/);
	if (headerMatch) return { type: "header", value: anchor };

	return { type: "header", value: anchor };
}

export function getAnchorKey(anchor: string, headers: Header[] = []): string {
	const parsed = parseAnchor(anchor);
	switch (parsed.type) {
		case "header": {
			const headerText = anchor.replace(/^#+\s*/, "");
			const header = headers.find((h) => h.text === headerText);
			return header ? `header:${header.id}` : `header:${anchor}`;
		}
		case "paragraph":
			return `paragraph:${parsed.value}`;
		case "tag":
			return `tag:${parsed.value}`;
		default:
			return `unknown:${anchor}`;
	}
}

export function getUniqueAnchors(items: GutterItem[] | undefined | null): string[] {
	if (!items) return [];
	const seen = new Set<string>();
	const anchors: string[] = [];
	for (const item of items) {
		if (item.anchor && !seen.has(item.anchor)) {
			seen.add(item.anchor);
			anchors.push(item.anchor);
		}
	}
	return anchors;
}

export function getItemsForAnchor(items: GutterItem[] | undefined | null, anchor: string): GutterItem[] {
	if (!items) return [];
	return items.filter((item) => item.anchor === anchor);
}

export function getOrphanItems(items: GutterItem[] | undefined | null, headers: Header[] = []): GutterItem[] {
	if (!items) return [];
	return items.filter((item) => {
		if (!item.anchor) return true;
		const parsed = parseAnchor(item.anchor);
		if (parsed.type === "header") {
			const headerText = item.anchor.replace(/^#+\s*/, "");
			return !headers.find((h) => h.text === headerText);
		}
		return parsed.type === "none";
	});
}

export function findAnchorElement(
	anchor: string,
	contentEl: HTMLElement | null,
	headers: Header[] = []
): HTMLElement | null {
	if (!contentEl) return null;

	const parsed = parseAnchor(anchor);

	switch (parsed.type) {
		case "header": {
			const headerText = anchor.replace(/^#+\s*/, "");
			const header = headers.find((h) => h.text === headerText);
			if (header) return document.getElementById(header.id);
			return null;
		}
		case "paragraph": {
			const paragraphs = contentEl.querySelectorAll(":scope > p");
			const index = (parsed.value as number) - 1;
			if (index >= 0 && index < paragraphs.length) return paragraphs[index] as HTMLElement;
			return null;
		}
		case "tag": {
			return contentEl.querySelector(`[data-anchor="${parsed.value}"]`);
		}
		default:
			return null;
	}
}
