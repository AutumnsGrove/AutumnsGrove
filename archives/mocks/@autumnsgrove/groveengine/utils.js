import { createRequire } from "module";
const require = createRequire(import.meta.url);
const DOMPurify = require("isomorphic-dompurify");

// Re-export all original exports
import * as originalModule from "@autumnsgrove/groveengine/utils";

// Override sanitize functions
export * from "@autumnsgrove/groveengine/utils";

// Custom sanitizeHTML that works in Node
export function sanitizeHTML(html) {
  if (!html || typeof html !== "string") {
    return "";
  }

  const config = {
    FORBID_TAGS: [
      "script",
      "iframe",
      "object",
      "embed",
      "link",
      "style",
      "form",
      "input",
      "button",
      "base",
      "meta",
    ],
    FORBID_ATTR: [
      "onerror",
      "onload",
      "onclick",
      "onmouseover",
      "onfocus",
      "onblur",
      "onchange",
      "onsubmit",
      "onmouseenter",
      "onmouseleave",
      "style",
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|\/|#)/i,
    ALLOW_DATA_ATTR: false,
    KEEP_CONTENT: true,
    SAFE_FOR_TEMPLATES: true,
  };

  return DOMPurify.sanitize(html, config);
}

// Custom sanitizeSVG
export function sanitizeSVG(svg) {
  if (!svg || typeof svg !== "string") {
    return "";
  }

  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ALLOWED_TAGS: [
      "svg",
      "g",
      "path",
      "circle",
      "rect",
      "line",
      "polyline",
      "polygon",
      "ellipse",
      "text",
      "tspan",
      "defs",
      "marker",
      "pattern",
      "clipPath",
      "mask",
      "linearGradient",
      "radialGradient",
      "stop",
      "use",
      "symbol",
      "title",
      "desc",
    ],
    ALLOWED_ATTR: [
      "class",
      "id",
      "transform",
      "fill",
      "stroke",
      "stroke-width",
      "x",
      "y",
      "x1",
      "y1",
      "x2",
      "y2",
      "cx",
      "cy",
      "r",
      "rx",
      "ry",
      "width",
      "height",
      "d",
      "points",
      "viewBox",
      "xmlns",
      "version",
      "preserveAspectRatio",
      "opacity",
      "fill-opacity",
      "stroke-opacity",
    ],
    FORBID_TAGS: [
      "script",
      "iframe",
      "object",
      "embed",
      "link",
      "style",
      "foreignObject",
      "image",
      "a",
    ],
    FORBID_ATTR: [
      "onerror",
      "onload",
      "onclick",
      "onmouseover",
      "onfocus",
      "onblur",
      "style",
      "href",
      "xlink:href",
    ],
    KEEP_CONTENT: false,
    SAFE_FOR_TEMPLATES: true,
  });
}

// sanitizeURL is already fine (no DOM dependency), keep original
export const sanitizeURL = originalModule.sanitizeURL;
