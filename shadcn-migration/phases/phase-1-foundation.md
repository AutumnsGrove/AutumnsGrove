# Phase 1: Foundation Setup for shadcn-svelte Migration

## Context

You are setting up the foundation for shadcn-svelte in an existing SvelteKit 5 project called AutumnsGrove. The project currently uses custom CSS with CSS variables. We need to add Tailwind CSS and shadcn-svelte while creating a mapping layer that preserves the existing CSS variable names.

**Important**: After this phase, the site should look IDENTICAL to before. We're only adding infrastructure.

---

## Tasks

### 1.0 Record Bundle Size Baseline

**Before making any changes**, record the current bundle size for comparison after migration:

```bash
# Build and capture bundle info
npm run build 2>&1 | tee /tmp/pre-migration-build.log

# Note the key sizes - look for output like:
# .svelte-kit/output/client/_app/immutable/chunks/...
# Total JS size, total CSS size
```

Save this output! We'll compare it in Phase 6 to ensure the migration doesn't bloat the bundle excessively.

**Acceptable threshold**: Up to 15-20% increase is reasonable given we're adding Tailwind + shadcn. If it exceeds 25%, investigate what's being pulled in.

---

### 1.1 Install Dependencies

Run these commands:
```bash
npm install -D tailwindcss postcss autoprefixer
npm install -D @tailwindcss/typography
npm install bits-ui clsx tailwind-merge tailwind-variants
npx tailwindcss init -p
```

### 1.2 Create tailwind.config.js

Create a Tailwind config that:
- Includes shadcn's recommended configuration
- Maps the AutumnsGrove color palette to Tailwind's HSL system
- Extends with custom values matching current design tokens

**Color Mapping (hex → HSL):**
> ✅ *Verified with color conversion tool - 2025-11-28*

- Primary: #2c5f2d → `121 37% 27%` (forest green)
- Primary hover: #4a9d4f → `124 36% 45%`
- Primary light (dark mode): #5cb85f → `122 39% 54%`
- Text: #333 → `0 0% 20%`
- Text muted: #666 → `0 0% 40%`
- Background secondary: #f5f5f5 → `0 0% 96%`
- Border: #e0e0e0 → `0 0% 88%`
- Danger: #d73a49 → `354 66% 54%`
- Tags purple: #7c4dab → `270 38% 49%`

```javascript
import { fontFamily } from "tailwindcss/defaultTheme";

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./src/**/*.{html,js,svelte,ts}"],
  safelist: ["dark"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px"
      }
    },
    extend: {
      colors: {
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)"
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)"
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)"
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)"
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      fontFamily: {
        sans: ["var(--font-sans)", ...fontFamily.sans]
      }
    }
  },
  plugins: [require("@tailwindcss/typography")]
};
```

### 1.3 Create src/app.css

Create the main CSS file with Tailwind directives and shadcn CSS variables:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Import the mapping layer */
@import "$lib/styles/tokens.css";

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 20%;

    --card: 0 0% 100%;
    --card-foreground: 0 0% 20%;

    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 20%;

    --primary: 121 37% 27%;
    --primary-foreground: 0 0% 100%;
    --primary-hover: 124 36% 45%;

    --secondary: 0 0% 96%;
    --secondary-foreground: 0 0% 20%;

    --muted: 0 0% 96%;
    --muted-foreground: 0 0% 40%;

    --accent: 270 38% 49%;
    --accent-foreground: 0 0% 100%;

    --destructive: 354 66% 54%;
    --destructive-foreground: 0 0% 100%;

    --border: 0 0% 88%;
    --input: 0 0% 88%;
    --ring: 121 37% 27%;

    --radius: 0.5rem;

    --font-sans: var(--font-family-main, "Alagard", system-ui, sans-serif);
  }

  .dark {
    --background: 0 0% 10%;
    --foreground: 0 0% 94%;

    --card: 0 0% 14%;
    --card-foreground: 0 0% 94%;

    --popover: 0 0% 14%;
    --popover-foreground: 0 0% 94%;

    --primary: 122 39% 54%;
    --primary-foreground: 0 0% 10%;
    --primary-hover: 122 49% 64%;

    --secondary: 0 0% 16%;
    --secondary-foreground: 0 0% 94%;

    --muted: 0 0% 16%;
    --muted-foreground: 0 0% 70%;

    --accent: 270 45% 55%;
    --accent-foreground: 0 0% 100%;

    --destructive: 354 66% 54%;
    --destructive-foreground: 0 0% 100%;

    --border: 0 0% 20%;
    --input: 0 0% 20%;
    --ring: 122 39% 54%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### 1.4 Create src/lib/styles/tokens.css

Create the mapping layer that preserves AutumnsGrove's original variable names:

```css
/*
 * AutumnsGrove CSS Variable Mapping Layer
 *
 * This file maps the original AutumnsGrove variable names to shadcn's system.
 * This allows existing code to continue working while we migrate.
 *
 * Original names → shadcn HSL system
 */

:root {
  /* === Color Mappings === */

  /* Primary colors */
  --color-primary: hsl(var(--primary));
  --color-primary-hover: hsl(var(--primary-hover));
  --color-primary-light: hsl(var(--primary)); /* Same in light mode */
  --color-primary-light-hover: hsl(var(--primary-hover));

  /* Text colors */
  --color-text: hsl(var(--foreground));
  --color-text-muted: hsl(var(--muted-foreground));
  --color-text-subtle: hsl(var(--muted-foreground) / 0.7);

  /* Background colors */
  --color-bg-secondary: hsl(var(--secondary));
  --color-bg-tertiary: hsl(var(--muted));

  /* Border colors */
  --color-border: hsl(var(--border));

  /* Semantic colors */
  --color-danger: hsl(var(--destructive));
  --tag-bg: hsl(var(--accent));
  --tag-bg-hover: hsl(var(--accent) / 0.8);

  /* === Spacing & Sizing === */

  --border-radius-standard: var(--radius);
  --border-radius-small: calc(var(--radius) - 4px);
  --border-radius-button: calc(var(--radius) - 2px);

  /* === Typography === */

  /* Font family is set dynamically from database, passthrough */
  /* --font-family-main is set in +layout.svelte */

  /* === Component-specific (mobile menu, etc.) === */

  --mobile-menu-bg: hsl(var(--card));
  --mobile-menu-border: hsl(var(--border));
}

/* Dark mode overrides for original variable names */
.dark {
  --color-primary-light: hsl(var(--primary));
  --color-primary-light-hover: hsl(var(--primary-hover));

  --color-bg-secondary-dark: hsl(var(--secondary));
  --color-bg-tertiary-dark: hsl(var(--muted));

  --color-text-dark: hsl(var(--foreground));
  --color-text-muted-dark: hsl(var(--muted-foreground));
  --color-text-subtle-dark: hsl(var(--muted-foreground) / 0.7);

  --color-border-dark: hsl(var(--border));
}
```

### 1.5 Create src/lib/utils/cn.ts

Create the class name utility:

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes with tailwind-merge for deduplication
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

### 1.6 Create components.json

Configure shadcn-svelte CLI:

```json
{
  "$schema": "https://shadcn-svelte.com/schema.json",
  "style": "default",
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/app.css",
    "baseColor": "slate"
  },
  "aliases": {
    "components": "$lib/components/shadcn",
    "utils": "$lib/utils"
  },
  "typescript": true
}
```

**Note**: We install shadcn components to `$lib/components/shadcn/` so our wrappers can live separately in `$lib/components/ui/`.

### 1.7 Update svelte.config.js (if needed)

Ensure Vite processes Tailwind. Usually no changes needed with standard setup.

### 1.8 Update src/routes/+layout.svelte

1. Add import for app.css at the top:
   ```svelte
   <script>
     import "../app.css";
     // ... rest of imports
   </script>
   ```

2. Remove the inline `:root` CSS variable definitions from the `<style>` block (they're now in app.css and tokens.css)

3. Keep:
   - Dark mode toggle logic (it's compatible with shadcn's class-based approach)
   - Font loading logic
   - Layout structure
   - Navigation logic

4. The large `<style>` block can be significantly reduced - only keep:
   - Layout-specific positioning
   - Navigation animations
   - Anything not related to colors/spacing tokens

---

## Success Criteria

- [ ] `npm run dev` starts without errors
- [ ] Tailwind classes work in any component (test with `class="text-red-500"`)
- [ ] Existing CSS variables still work via mapping layer
- [ ] Dark mode toggle still functions
- [ ] No visual changes to the site
- [ ] All pages render correctly

---

## Files Created/Modified

| File | Action | Description |
|------|--------|-------------|
| `tailwind.config.js` | CREATE | Tailwind configuration |
| `postcss.config.js` | CREATE | PostCSS config (from init) |
| `src/app.css` | CREATE | Tailwind directives + shadcn vars |
| `src/lib/styles/tokens.css` | CREATE | CSS variable mapping layer |
| `src/lib/utils/cn.ts` | CREATE | Class merge utility |
| `components.json` | CREATE | shadcn-svelte CLI config |
| `package.json` | MODIFY | Dependencies added |
| `src/routes/+layout.svelte` | MODIFY | Import app.css, remove inline vars |

---

## Important Notes

- Do NOT install any shadcn components yet (that's Phase 2)
- Do NOT modify any existing components yet
- The site should look IDENTICAL after this phase
- Test dark mode toggle works
- Test on mobile viewport
- Run `npm run build` to verify no build errors
