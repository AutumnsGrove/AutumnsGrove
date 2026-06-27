---
name: AutumnsGrove
description: A warm, introspective personal site — midnight tea shop meets indie web
colors:
  bg-light: "#f9f3ec"
  bg-dark: "#231a2d"
  surface-light: "#f1eae1"
  surface-dark: "#2c2038"
  ink-light: "#352039"
  ink-dark: "#ede3d6"
  primary-light: "#6b2d8b"
  primary-dark: "#c08de0"
  accent-light: "#c07830"
  accent-dark: "#d4a050"
  muted-light: "#8a7a6e"
  muted-dark: "#9a8e82"
  border-light: "#ddd0c3"
  border-dark: "#3e2f4e"
typography:
  heading:
    fontFamily: "Lora, Georgia, serif"
    fontSize: "clamp(2.1rem, 4vw + 1rem, 3.2rem)"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Lexend, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  mono:
    fontFamily: "JetBrains Mono, Fira Code, ui-monospace, monospace"
    fontSize: "0.88em"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "6px"
  lg: "12px"
  pill: "100px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "48px"
  section: "clamp(3rem, 6vw, 5rem)"
components:
  button-primary:
    backgroundColor: "{colors.primary-light}"
    textColor: "{colors.bg-light}"
    rounded: "{rounded.pill}"
    padding: "10px 24px"
  button-primary-hover:
    backgroundColor: "#5a2477"
    textColor: "{colors.bg-light}"
  tag:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.primary-light}"
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  nav-link:
    textColor: "{colors.muted-light}"
    padding: "0"
  nav-link-active:
    textColor: "{colors.primary-light}"
---

## Overview

AutumnsGrove is a personal blog and portfolio site with an indie web / zine aesthetic. The visual identity centers on warmth: deep plums, amber accents, and soft cream backgrounds that shift to rich purple-tinted darks in dark mode. The site uses Lora (a calligraphic serif) for headings and Lexend (an accessibility-focused sans) for body text. A signature feature is "Vines" — sidebar annotations that float alongside blog content like margin notes.

The design register is **brand**: design is the product. Every visual choice should reinforce the feeling of a handmade, intentionally crafted personal space.

## Colors: The Midnight Bloom Palette

The palette is built on two emotional axes: **plum ↔ amber** (cool ↔ warm) and **cream ↔ deep purple** (light ↔ dark). All colors defined in OKLCH in code for perceptual uniformity.

| Role | Light | Dark | Usage |
|------|-------|------|-------|
| Background | Warm cream `oklch(0.978 0.008 75)` | Deep plum `oklch(0.130 0.018 310)` | Page bg |
| Surface | Sandy cream `oklch(0.960 0.012 70)` | Muted plum `oklch(0.170 0.022 310)` | Cards, TOC, editor |
| Ink | Near-black plum `oklch(0.200 0.020 310)` | Off-white cream `oklch(0.910 0.012 70)` | Body text |
| Primary | Deep plum `oklch(0.420 0.130 310)` | Light lavender `oklch(0.700 0.120 310)` | Links, active states, CTAs |
| Accent | Warm amber `oklch(0.620 0.155 55)` | Golden amber `oklch(0.720 0.145 55)` | Secondary emphasis, footer CTA |
| Muted | Warm gray `oklch(0.500 0.015 60)` | Warm gray `oklch(0.580 0.012 60)` | Dates, metadata, captions |
| Border | Sandy border `oklch(0.880 0.015 70)` | Plum border `oklch(0.250 0.020 310)` | Dividers, outlines |

Color strategy: **Committed.** Plum is the identity color, carrying 30-50% of surface presence in dark mode and anchoring headings, links, and CTAs in light mode. Amber is the warm counterpoint at ~10-15%.

## Typography

Two typefaces, no more:

- **Lora** (serif, Google Fonts) — headings only. Calligraphic brush strokes give warmth. Weight 600-700, letter-spacing -0.015em to -0.025em.
- **Lexend** (sans, Google Fonts) — everything else. Designed for reading comfort and accessibility. Weight 300-700.
- **JetBrains Mono** — code blocks and editor only.

Scale uses `clamp()` for fluid sizing. H1 spans 2.1rem to 3.2rem. Body is 17px (106.25% base). Line length capped at 68ch via `max-width` on prose elements.

Hierarchy signals: headings are always Lora with noticeably heavier weight (700) and tighter tracking (-0.025em) vs body (Lexend 400, normal tracking). The contrast is font family + weight + tracking, not just size.

## Elevation

Minimal elevation. This is not a glass-card site.

- **Level 0** — flat, border only. Used for most containers (nav, footer, TOC, gutter items).
- **Level 1** — subtle shadow `0 2px 8px oklch(0.1 0 0 / 0.08)`. Used sparingly: floating TOC button on mobile, directive autocomplete dropdown.
- **Level 2** — modal shadow `0 16px 48px oklch(0.1 0 0 / 0.25)`. GutterManager modal, lightbox.

No glassmorphism. No backdrop-filter on content elements. Surfaces are opaque with clear borders.

## Components

**Nav** — sticky, full-width, `var(--nav-height)` tall. Brand name left (Lora 700), uppercase links right (Lexend 400, 0.06em tracking). Mobile: slide-in drawer from right with backdrop blur. Theme toggle is a circular bordered button.

**Footer** — centered column: amber CTA link ("Say hello →"), uppercase navigation links, subtle copyright + admin link.

**Tags** — pill-shaped (`border-radius: 100px`), surface bg with primary text, 1px border. On hover: primary bg, bg text.

**Vine annotations** — float left within content flow. Surface bg, 1px border, 3px left border in primary color. Radius 0 on left, var(--radius) on right. Comment type gets the border-left accent; photo type gets uniform border with image inside.

**TOC** — sticky right sidebar (desktop), floating button + popover (mobile). Surface bg, bordered, active item highlighted with surface-hover bg.

**Buttons** — pill-shaped primary (primary bg, white text). Outline variant (border only, accent text). Danger variant (red border, red text → red bg on hover).

## Do's and Don'ts

**Do:**
- Use the plum/amber palette consistently. Every surface should feel warm.
- Let headings in Lora be large and confident. The serif contrast with Lexend body creates personality.
- Give vine annotations visual weight — they're a signature feature, not an afterthought.
- Vary spacing for rhythm. Section gaps should breathe; inline elements can be tighter.
- Use oklch for all color definitions. Maintain perceptual lightness consistency across themes.

**Don't:**
- Don't use pure black (`#000`) or pure white (`#fff`). Tint every neutral toward plum or cream.
- Don't add glassmorphism or backdrop-filter to content surfaces. Surfaces are opaque.
- Don't use uniform padding everywhere. Cards, sections, and elements should have distinct breathing room.
- Don't make everything a card. Blog list items are separated by borders, not boxed.
- Don't use side-stripe borders as accent decoration (the vine left-border is structural, not decorative — it indicates a content annotation).
- Don't let the admin panel look like a different site. Same palette, same fonts, less decoration.
