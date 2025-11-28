# Phase 4: Migrate Content Styling to Tailwind Typography

## Context

Components are migrated (Phases 2-3). Now we update the content styling system (blog posts, recipes, markdown content) to use Tailwind Typography while maintaining the AutumnsGrove aesthetic.

**Goal**: Migrate `content.css` to Tailwind Typography plugin with custom theme that preserves the site's personality.

---

## Files to Migrate

- `$lib/styles/content.css` (14KB) → Tailwind Typography + custom overrides

---

## Tasks

### 4.1 Configure Tailwind Typography

Update `tailwind.config.js` to add typography customization:

```javascript
import { fontFamily } from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  // ... existing config
  theme: {
    extend: {
      // ... existing extends
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            // Use our CSS variables for colors
            '--tw-prose-body': 'hsl(var(--foreground))',
            '--tw-prose-headings': 'hsl(var(--primary))',
            '--tw-prose-lead': 'hsl(var(--muted-foreground))',
            '--tw-prose-links': 'hsl(var(--primary))',
            '--tw-prose-bold': 'hsl(var(--foreground))',
            '--tw-prose-counters': 'hsl(var(--muted-foreground))',
            '--tw-prose-bullets': 'hsl(var(--muted-foreground))',
            '--tw-prose-hr': 'hsl(var(--border))',
            '--tw-prose-quotes': 'hsl(var(--muted-foreground))',
            '--tw-prose-quote-borders': 'hsl(var(--primary))',
            '--tw-prose-captions': 'hsl(var(--muted-foreground))',
            '--tw-prose-code': 'hsl(var(--foreground))',
            '--tw-prose-pre-code': 'hsl(var(--foreground))',
            '--tw-prose-pre-bg': 'hsl(var(--secondary))',
            '--tw-prose-th-borders': 'hsl(var(--border))',
            '--tw-prose-td-borders': 'hsl(var(--border))',

            // Invert colors for dark mode
            '--tw-prose-invert-body': 'hsl(var(--foreground))',
            '--tw-prose-invert-headings': 'hsl(var(--primary))',
            '--tw-prose-invert-lead': 'hsl(var(--muted-foreground))',
            '--tw-prose-invert-links': 'hsl(var(--primary))',
            '--tw-prose-invert-bold': 'hsl(var(--foreground))',
            '--tw-prose-invert-counters': 'hsl(var(--muted-foreground))',
            '--tw-prose-invert-bullets': 'hsl(var(--muted-foreground))',
            '--tw-prose-invert-hr': 'hsl(var(--border))',
            '--tw-prose-invert-quotes': 'hsl(var(--muted-foreground))',
            '--tw-prose-invert-quote-borders': 'hsl(var(--primary))',
            '--tw-prose-invert-captions': 'hsl(var(--muted-foreground))',
            '--tw-prose-invert-code': 'hsl(var(--foreground))',
            '--tw-prose-invert-pre-code': 'hsl(var(--foreground))',
            '--tw-prose-invert-pre-bg': '#0d1117',
            '--tw-prose-invert-th-borders': 'hsl(var(--border))',
            '--tw-prose-invert-td-borders': 'hsl(var(--border))',

            // Custom element styles
            maxWidth: '65ch',
            lineHeight: '1.8',

            // Headings - forest green
            'h1, h2, h3, h4': {
              color: 'hsl(var(--primary))',
              fontWeight: '600',
              scrollMarginTop: '6rem', // For anchor links
            },
            h1: {
              fontSize: '2.25rem',
              marginTop: '0',
              marginBottom: '1rem',
            },
            h2: {
              fontSize: '1.75rem',
              marginTop: '2rem',
              marginBottom: '0.75rem',
            },
            h3: {
              fontSize: '1.4rem',
              marginTop: '1.5rem',
              marginBottom: '0.5rem',
            },

            // Links
            a: {
              color: 'hsl(var(--primary))',
              textDecoration: 'underline',
              textUnderlineOffset: '3px',
              transition: 'color 0.2s ease',
              '&:hover': {
                color: 'hsl(var(--primary-hover))',
              },
            },

            // Blockquotes - with primary color border
            blockquote: {
              borderLeftColor: 'hsl(var(--primary))',
              borderLeftWidth: '4px',
              paddingLeft: '1rem',
              fontStyle: 'italic',
              color: 'hsl(var(--muted-foreground))',
              backgroundColor: 'hsl(var(--secondary) / 0.5)',
              paddingTop: '0.5rem',
              paddingBottom: '0.5rem',
              paddingRight: '1rem',
              borderRadius: '0 0.5rem 0.5rem 0',
            },

            // Inline code
            code: {
              backgroundColor: 'hsl(var(--muted))',
              padding: '0.2rem 0.4rem',
              borderRadius: '0.25rem',
              fontWeight: '500',
              fontSize: '0.875em',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },

            // Code blocks - will be overridden by custom styles
            pre: {
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
              padding: '0',
              overflow: 'hidden',
            },
            'pre code': {
              backgroundColor: 'transparent',
              padding: '1rem',
              display: 'block',
              overflow: 'auto',
            },

            // Lists
            'ul, ol': {
              paddingLeft: '1.5rem',
            },
            li: {
              marginTop: '0.25rem',
              marginBottom: '0.25rem',
            },
            'li::marker': {
              color: 'hsl(var(--primary))',
            },

            // Horizontal rules
            hr: {
              borderColor: 'hsl(var(--border))',
              marginTop: '2rem',
              marginBottom: '2rem',
            },

            // Images
            img: {
              borderRadius: '0.5rem',
              marginTop: '1.5rem',
              marginBottom: '1.5rem',
            },

            // Tables
            table: {
              width: '100%',
              borderCollapse: 'collapse',
            },
            'th, td': {
              padding: '0.75rem',
              borderBottom: '1px solid hsl(var(--border))',
            },
            th: {
              textAlign: 'left',
              fontWeight: '600',
              backgroundColor: 'hsl(var(--secondary))',
            },

            // Strong
            strong: {
              fontWeight: '600',
            },

            // Paragraphs
            p: {
              marginTop: '1.25rem',
              marginBottom: '1.25rem',
            },
          },
        },
        // Size variant for larger content areas
        lg: {
          css: {
            fontSize: '1.125rem',
            lineHeight: '1.8',
            h1: {
              fontSize: '2.5rem',
            },
            h2: {
              fontSize: '2rem',
            },
            h3: {
              fontSize: '1.5rem',
            },
          },
        },
      }),
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
```

### 4.2 Create Code Block Styles

The GitHub-style code blocks need custom handling. Add to `src/app.css`:

```css
/* GitHub-style code blocks */
@layer components {
  /* Code block wrapper with header */
  .code-block {
    @apply relative bg-card border border-border rounded-lg overflow-hidden my-6;
  }

  .code-block-header {
    @apply flex items-center justify-between px-4 py-2 bg-secondary/50 border-b border-border;
  }

  .code-block-language {
    @apply text-sm text-muted-foreground font-mono;
  }

  .code-block-copy {
    @apply px-3 py-1 text-xs rounded bg-secondary hover:bg-secondary/80 text-muted-foreground transition-colors;
  }

  .code-block-copy.copied {
    @apply bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400;
  }

  .code-block pre {
    @apply m-0 p-4 overflow-x-auto bg-transparent border-0;
  }

  .code-block code {
    @apply bg-transparent p-0 text-sm;
  }

  /* Dark mode code blocks */
  .dark .code-block {
    @apply bg-[#0d1117];
  }

  .dark .code-block-header {
    @apply bg-[#161b22];
  }

  .dark .code-block pre {
    @apply bg-[#0d1117];
  }

  /* Syntax highlighting tokens (if using a highlighter) */
  .code-block .token.comment,
  .code-block .token.prolog,
  .code-block .token.doctype,
  .code-block .token.cdata {
    @apply text-gray-500;
  }

  .code-block .token.punctuation {
    @apply text-gray-600 dark:text-gray-400;
  }

  .code-block .token.property,
  .code-block .token.tag,
  .code-block .token.boolean,
  .code-block .token.number,
  .code-block .token.constant,
  .code-block .token.symbol {
    @apply text-blue-600 dark:text-blue-400;
  }

  .code-block .token.selector,
  .code-block .token.string,
  .code-block .token.char,
  .code-block .token.builtin {
    @apply text-green-600 dark:text-green-400;
  }

  .code-block .token.operator,
  .code-block .token.entity,
  .code-block .token.url {
    @apply text-yellow-600 dark:text-yellow-400;
  }

  .code-block .token.atrule,
  .code-block .token.attr-value,
  .code-block .token.keyword {
    @apply text-purple-600 dark:text-purple-400;
  }

  .code-block .token.function {
    @apply text-red-600 dark:text-red-400;
  }

  .code-block .token.regex,
  .code-block .token.important,
  .code-block .token.variable {
    @apply text-orange-600 dark:text-orange-400;
  }
}
```

### 4.3 Update ContentWithGutter Component

In `$lib/components/custom/ContentWithGutter.svelte`, update the prose container:

```svelte
<!-- Before -->
<div class="content-area">
  {@html content}
</div>

<!-- After -->
<div class="prose prose-lg dark:prose-invert max-w-none">
  {@html content}
</div>
```

Also update the import of content.css (if still needed):

```svelte
<script>
  // Remove or update this import
  // import "$lib/styles/content.css";
</script>
```

### 4.4 Migrate Gutter Styles

The gutter layout system needs to stay custom. Create `$lib/styles/gutter.css`:

```css
/* Gutter Layout System
 * These styles handle the 3-column layout for content with sidebars
 * Cannot be fully replaced by Tailwind due to complex positioning
 */

.content-wrapper {
  @apply grid gap-8 max-w-7xl mx-auto px-4;

  /* Mobile: single column */
  grid-template-columns: 1fr;
}

/* Tablet: with gutters */
@media (min-width: 769px) {
  .content-wrapper {
    grid-template-columns: 200px 1fr;
  }

  .content-wrapper.has-right-gutter {
    grid-template-columns: 1fr 200px;
  }

  .content-wrapper.has-both-gutters {
    grid-template-columns: 200px 1fr 200px;
  }
}

/* Desktop: wider gutters */
@media (min-width: 1200px) {
  .content-wrapper {
    grid-template-columns: 240px 1fr;
  }

  .content-wrapper.has-right-gutter {
    grid-template-columns: 1fr 200px;
  }

  .content-wrapper.has-both-gutters {
    grid-template-columns: 240px 1fr 200px;
  }
}

/* Left gutter */
.left-gutter {
  @apply hidden md:block;
  position: relative;
}

.left-gutter-content {
  position: sticky;
  top: 6rem;
}

/* Right gutter (TOC) */
.right-gutter {
  @apply hidden lg:block;
}

.right-gutter-content {
  position: sticky;
  top: 6rem;
  max-height: calc(100vh - 8rem);
  overflow-y: auto;
}

/* Gutter items */
.gutter-item {
  @apply bg-secondary/50 border-l-[3px] border-primary rounded-r-md p-3 mb-4 text-sm;
}

.gutter-item.comment {
  @apply italic text-muted-foreground;
}

.gutter-item.photo img {
  @apply rounded max-w-full;
}

/* Mobile gutter display */
@media (max-width: 768px) {
  .gutter-item-mobile {
    @apply my-4 p-4 bg-secondary/30 rounded-lg border border-border;
  }
}

/* Reference markers */
.reference-marker {
  @apply inline-flex items-center justify-center w-5 h-5 text-xs font-bold bg-primary text-primary-foreground rounded-full cursor-pointer;
}

.reference-marker:hover {
  @apply bg-primary/80;
}

/* Highlight animation for anchored elements */
@keyframes highlight-flash {
  0% {
    background-color: hsl(var(--primary) / 0.2);
  }
  100% {
    background-color: transparent;
  }
}

.highlight-target {
  animation: highlight-flash 1.5s ease-out;
}
```

Update `src/app.css` to import:

```css
@import "$lib/styles/gutter.css";
```

### 4.5 Slim Down Original content.css

After migration, `$lib/styles/content.css` should only contain:

1. Anything that truly can't be done with Tailwind
2. Complex positioning that's too verbose in utilities
3. Mermaid diagram styles (if used)

Target: Reduce from 14KB to ~2-3KB.

```css
/* $lib/styles/content.css
 * Minimal overrides for content rendering
 * Most styles now handled by Tailwind Typography
 */

/* Mermaid diagrams */
.mermaid-container {
  @apply my-6 p-4 bg-secondary/30 rounded-lg overflow-x-auto;
}

.mermaid-container svg {
  @apply max-w-full;
}

/* Recipe step icons */
.step-icon {
  @apply inline-block w-6 h-6 mr-1 align-middle;
}

.step-icon:hover {
  transform: scale(1.15);
}

/* Custom scrollbar for code blocks */
.prose pre::-webkit-scrollbar {
  height: 8px;
}

.prose pre::-webkit-scrollbar-track {
  @apply bg-secondary/50 rounded;
}

.prose pre::-webkit-scrollbar-thumb {
  @apply bg-border rounded;
}

.prose pre::-webkit-scrollbar-thumb:hover {
  @apply bg-muted-foreground/50;
}
```

### 4.6 Update All Content Pages

Update these routes to use `prose` classes:

#### /blog/[slug]/+page.svelte

```svelte
<ContentWithGutter>
  <div class="prose prose-lg dark:prose-invert max-w-none">
    {@html content}
  </div>
</ContentWithGutter>
```

#### /recipes/[slug]/+page.svelte

```svelte
<ContentWithGutter>
  <div class="prose prose-lg dark:prose-invert max-w-none">
    {@html content}
  </div>
</ContentWithGutter>
```

#### /about/+page.svelte

```svelte
<div class="prose dark:prose-invert max-w-3xl mx-auto">
  {@html content}
</div>
```

#### /contact/+page.svelte

```svelte
<div class="prose dark:prose-invert max-w-3xl mx-auto">
  {@html content}
</div>
```

---

## Testing Checklist

- [ ] Blog post headings are forest green
- [ ] Links are styled with underline
- [ ] Link hover changes color
- [ ] Blockquotes have left border and background
- [ ] Code blocks have proper styling
- [ ] Code block copy button works
- [ ] Inline code has background
- [ ] Lists render with green markers
- [ ] Tables render with borders
- [ ] Images are rounded
- [ ] Dark mode content looks correct
- [ ] Dark mode code blocks use GitHub dark theme
- [ ] Gutter items position correctly
- [ ] TOC sidebar sticky works
- [ ] Mobile layout collapses properly
- [ ] Mermaid diagrams render (if used)
- [ ] Recipe step icons display

---

## Success Criteria

- [ ] Blog posts render beautifully
- [ ] Recipe content looks correct
- [ ] Code blocks maintain GitHub styling
- [ ] Dark mode prose works perfectly
- [ ] Gutter layout unchanged
- [ ] content.css is much smaller (target: 2-3KB)
- [ ] Typography feels consistent with AutumnsGrove aesthetic
- [ ] No visual regressions in content rendering
