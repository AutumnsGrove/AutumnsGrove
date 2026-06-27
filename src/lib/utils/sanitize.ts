/**
 * HTML/Markdown sanitization — standalone version using DOMPurify (browser)
 * and sanitize-html (server/Workers).
 */

import { BROWSER } from "esm-env";
import type { DOMPurify as DOMPurifyInstance, Config } from "dompurify";
import sanitizeHtml from "sanitize-html";

let DOMPurify: DOMPurifyInstance | null = null;

if (BROWSER) {
	import("dompurify").then((module) => {
		DOMPurify = module.default;

		DOMPurify.addHook("afterSanitizeAttributes", (node) => {
			if (node.tagName === "A") {
				const href = node.getAttribute("href") || "";
				const target = node.getAttribute("target");
				const isExternal =
					href.startsWith("http://") || href.startsWith("https://") || target === "_blank";

				if (isExternal) {
					const existingRel = node.getAttribute("rel") || "";
					const relParts = new Set(existingRel.split(/\s+/).filter(Boolean));
					relParts.add("noopener");
					relParts.add("noreferrer");
					node.setAttribute("rel", Array.from(relParts).join(" "));
				}
			}
		});
	});
}

function tabnabbingTransform(
	tagName: string,
	attribs: sanitizeHtml.Attributes
): sanitizeHtml.Tag {
	const href = attribs.href || "";
	const target = attribs.target;
	const isExternal =
		href.startsWith("http://") || href.startsWith("https://") || target === "_blank";

	if (isExternal) {
		const existingRel = attribs.rel || "";
		const relParts = new Set(existingRel.split(/\s+/).filter(Boolean));
		relParts.add("noopener");
		relParts.add("noreferrer");
		attribs.rel = Array.from(relParts).join(" ");
	}
	return { tagName, attribs };
}

function normalizeTagWhitespace(html: string): string {
	return html.replace(/<([^>]*)>/g, (_match, inner) => {
		return "<" + inner.replace(/[\n\r\t]+/g, "") + ">";
	});
}

function sanitizeServerSafe(
	html: string,
	options?: { forbidTags?: string[] }
): string {
	if (!html || typeof html !== "string") return "";

	html = normalizeTagWhitespace(html);

	const baseTags = sanitizeHtml.defaults.allowedTags.concat([
		"img", "h1", "h2", "del", "ins", "sub", "sup", "mark",
		"kbd", "samp", "var", "small", "abbr", "dd", "dl", "dt", "hr",
		"button", "svg", "path", "rect",
	]);

	const allowedTags = options?.forbidTags
		? baseTags.filter((tag) => !options.forbidTags!.includes(tag))
		: baseTags;

	return sanitizeHtml(html, {
		allowedTags,
		disallowedTagsMode: "discard",
		allowedAttributes: {
			a: ["href", "title", "target", "rel", "class", "id"],
			img: ["src", "alt", "title", "width", "height", "class"],
			"*": ["class", "id"],
			span: ["class", "id", "data-anchor"],
			div: ["class", "id"],
			button: ["class", "aria-label", "data-code"],
			svg: ["width", "height", "viewbox", "fill", "xmlns"],
			path: ["d", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "fill"],
			rect: ["x", "y", "width", "height", "stroke", "stroke-width", "stroke-linecap", "stroke-linejoin"],
			td: ["align"],
			th: ["align"],
			input: ["type", "checked", "disabled"],
			label: [],
		},
		allowedSchemes: ["http", "https", "mailto", "tel"],
		transformTags: {
			a: tabnabbingTransform,
		},
	});
}

export function sanitizeHTML(html: string): string {
	if (!html || typeof html !== "string") return "";

	if (!BROWSER || !DOMPurify) {
		return sanitizeServerSafe(html, { forbidTags: ["button", "input", "base", "meta"] });
	}

	const config: Config = {
		FORBID_TAGS: [
			"script", "iframe", "object", "embed", "link",
			"style", "form", "input", "button", "base", "meta",
		],
		FORBID_ATTR: [
			"onerror", "onload", "onclick", "onmouseover", "onfocus",
			"onblur", "onchange", "onsubmit", "onmouseenter", "onmouseleave", "style",
		],
		ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/|#)/i,
		ALLOW_DATA_ATTR: false,
		KEEP_CONTENT: true,
		SAFE_FOR_TEMPLATES: true,
		RETURN_TRUSTED_TYPE: false,
	};

	return DOMPurify.sanitize(html, config) as string;
}

export function sanitizeMarkdown(markdownHTML: string): string {
	if (!markdownHTML || typeof markdownHTML !== "string") return "";

	if (!BROWSER || !DOMPurify) {
		return sanitizeServerSafe(markdownHTML);
	}

	return DOMPurify.sanitize(markdownHTML, {
		ALLOWED_TAGS: [
			"a", "abbr", "b", "blockquote", "br", "code", "dd", "del", "div", "dl", "dt",
			"em", "h1", "h2", "h3", "h4", "h5", "h6", "hr", "i", "img", "ins", "kbd",
			"li", "mark", "ol", "p", "pre", "q", "s", "samp", "small", "span", "strong",
			"sub", "sup", "table", "tbody", "td", "tfoot", "th", "thead", "tr", "u", "ul",
			"var", "input", "label", "button", "svg", "path", "rect",
		],
		ALLOWED_ATTR: [
			"href", "src", "alt", "title", "class", "id", "target", "rel",
			"width", "height", "align", "type", "checked", "disabled",
			"data-anchor", "data-code", "aria-label",
			"viewBox", "xmlns", "fill", "d",
			"stroke", "stroke-width", "stroke-linecap", "stroke-linejoin", "x", "y",
		],
		FORBID_TAGS: ["script", "iframe", "object", "embed", "link", "style", "form"],
		FORBID_ATTR: [
			"onerror", "onload", "onclick", "onmouseover", "onfocus",
			"onblur", "onchange", "onsubmit", "style",
		],
		ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/|#)/i,
		KEEP_CONTENT: true,
		RETURN_TRUSTED_TYPE: false,
	}) as string;
}

export function sanitizeURL(url: string): string {
	if (!url || typeof url !== "string") return "";

	if (url.startsWith("/") || url.startsWith("./") || url.startsWith("../")) return url;

	if (/^(javascript|data|vbscript|file|about):/i.test(url)) return "";

	if (/^(https?|mailto|tel):/i.test(url)) return url;

	if (!url.includes(":")) return url;

	return "";
}
