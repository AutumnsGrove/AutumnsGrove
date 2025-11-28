# Phase 6: Final Cleanup & Verification

## Context

All migrations complete (Phases 1-5). Now we clean up, remove deprecated code, verify everything works, and document the new architecture.

**Goal**: Production-ready codebase with no dead code, passing builds, and clear documentation.

---

## Cleanup Tasks

### 6.1 Remove Deprecated Components

**CollapsibleSection** - Replaced by Accordion wrapper

```bash
# Check if any files still import CollapsibleSection
grep -r "CollapsibleSection" src/

# If no imports found, delete the file
rm src/lib/components/custom/CollapsibleSection.svelte

# Update the barrel export
# Remove from src/lib/components/custom/index.js
```

**LightboxCaption** - Integrated into new Lightbox

```bash
# Check if any files still import LightboxCaption
grep -r "LightboxCaption" src/

# If no imports found, delete the file
rm src/lib/components/gallery/LightboxCaption.svelte

# Update src/lib/components/gallery/index.js
```

### 6.2 Audit and Remove Old CSS

**In `src/routes/+layout.svelte`:**

Remove these CSS patterns that are now handled by Tailwind/shadcn:

```css
/* DELETE: Button styles */
.primary-btn { ... }
.secondary-btn { ... }
.danger-btn { ... }
button { ... } /* generic button styles */

/* DELETE: Form input styles */
input[type="text"] { ... }
input[type="email"] { ... }
select { ... }
textarea { ... }

/* DELETE: Modal styles */
.modal-overlay { ... }
.modal-content { ... }

/* DELETE: Toast styles */
.toast { ... }
.toast-success { ... }
.toast-error { ... }

/* DELETE: Tab styles */
.tabs { ... }
.tab-btn { ... }

/* DELETE: Card styles (if using Card wrapper) */
.stat-card { ... }
.action-card { ... }

/* DELETE: Tag styles */
.tag { ... }

/* KEEP: Navigation animations */
.nav-link::after { ... } /* underline animation */

/* KEEP: Mobile menu animations */
.hamburger span { ... }

/* KEEP: Any layout-specific positioning */
```

**In `src/lib/styles/content.css`:**

Verify the file is now minimal (~2-3KB). Remove:
- Typography styles (now in Tailwind typography config)
- Code block base styles (now in app.css)
- Link styles
- Heading styles

Keep only:
- Mermaid diagram styles
- Recipe step icons
- Custom scrollbar
- Anything truly unique

### 6.3 Clean Up Empty Style Blocks

Search for and clean up empty or near-empty `<style>` blocks:

```bash
# Find files with style blocks
grep -r "<style>" src/routes/ src/lib/components/

# Manually review each and remove if empty or minimal
```

### 6.4 Update Component Index Files

Ensure all barrel exports are correct:

**`src/lib/components/ui/index.ts`:**
```typescript
// Verify all wrappers are exported
export { default as Button } from "./Button.svelte";
export { default as Card } from "./Card.svelte";
export { default as Dialog } from "./Dialog.svelte";
export { default as Input } from "./Input.svelte";
export { default as Select } from "./Select.svelte";
export { default as Tabs } from "./Tabs.svelte";
export { default as Accordion } from "./Accordion.svelte";
export { default as Badge } from "./Badge.svelte";
export { default as Toast } from "./Toast.svelte";
export { toast } from "./toast";
export { default as Sheet } from "./Sheet.svelte";
export { default as Skeleton } from "./Skeleton.svelte";

// Re-exports from shadcn that don't need wrappers
export { Separator } from "$lib/components/shadcn/separator";
export { Label } from "$lib/components/shadcn/label";
export { Checkbox } from "$lib/components/shadcn/checkbox";
export * as RadioGroup from "$lib/components/shadcn/radio-group";
export * as Table from "$lib/components/shadcn/table";
export * as Tooltip from "$lib/components/shadcn/tooltip";
export * as DropdownMenu from "$lib/components/shadcn/dropdown-menu";
```

**`src/lib/components/custom/index.js`:**
```javascript
export { default as ContentWithGutter } from "./ContentWithGutter.svelte";
export { default as LeftGutter } from "./LeftGutter.svelte";
export { default as GutterItem } from "./GutterItem.svelte";
export { default as TableOfContents } from "./TableOfContents.svelte";
export { default as MobileTOC } from "./MobileTOC.svelte";
export { default as LogViewer } from "./LogViewer.svelte";
export { default as InternalsPostViewer } from "./InternalsPostViewer.svelte";
// CollapsibleSection removed - use Accordion from ui/
```

**`src/lib/components/gallery/index.js`:**
```javascript
export { default as ImageGallery } from "./ImageGallery.svelte";
export { default as Lightbox } from "./Lightbox.svelte";
export { default as ZoomableImage } from "./ZoomableImage.svelte";
// LightboxCaption removed - integrated into Lightbox
```

**`src/lib/components/charts/index.js`:**
```javascript
export { default as Sparkline } from "./Sparkline.svelte";
export { default as LOCBar } from "./LOCBar.svelte";
export { default as RepoBreakdown } from "./RepoBreakdown.svelte";
export { default as ActivityOverview } from "./ActivityOverview.svelte";
```

**`src/lib/components/index.js`:**
```javascript
// Re-export from all directories
export * from "./ui";
export * from "./custom";
export * from "./gallery";
export * from "./charts";
```

### 6.5 Check for Unused Dependencies

Review `package.json` for packages no longer needed:

```bash
# Check if any old packages can be removed
npm ls
```

Likely safe to keep everything added for shadcn. No packages should need removal unless you had UI libraries before.

### 6.6 TypeScript/JSDoc Verification

If using TypeScript, run type check:

```bash
npm run check
# or
npx svelte-check
```

Fix any type errors in wrapper components.

### 6.7 Lint and Format

Run linting and formatting:

```bash
npm run lint
npm run format
# or
npx prettier --write src/
npx eslint src/ --fix
```

---

## Verification Checklist

### Build Verification

```bash
# Clean install
rm -rf node_modules
npm install

# Development build
npm run dev

# Production build
npm run build

# Preview production
npm run preview
```

- [ ] `npm install` completes without errors
- [ ] `npm run dev` starts without errors
- [ ] `npm run build` completes without errors
- [ ] `npm run preview` works correctly
- [ ] No console errors in browser

### Visual Verification

Test each route in both light and dark mode:

**Public Routes:**
- [ ] Homepage loads with hero section
- [ ] Homepage CTA button styled correctly
- [ ] About page loads with warning banner
- [ ] Credits page displays cards correctly
- [ ] Blog list shows post cards
- [ ] Blog search filters work
- [ ] Blog post content renders with proper typography
- [ ] Blog tags styled correctly
- [ ] Recipe list displays correctly
- [ ] Recipe content renders with icons
- [ ] Dashboard loads with charts
- [ ] Dashboard selects work
- [ ] Gallery grid displays
- [ ] Gallery lightbox opens and navigates
- [ ] Timeline cards expand/collapse
- [ ] Contact page renders content
- [ ] Login form styled correctly

**Admin Routes:**
- [ ] Admin dashboard loads
- [ ] Admin sidebar navigation works
- [ ] Admin mobile menu works
- [ ] Settings page forms work
- [ ] Image upload works
- [ ] Image gallery displays
- [ ] Delete modal opens and works
- [ ] Toast notifications appear
- [ ] Logs page tabs work
- [ ] Analytics page loads

**Cross-cutting:**
- [ ] Navigation works (all links)
- [ ] Mobile navigation works
- [ ] Search opens (/ key and Cmd+K)
- [ ] Theme toggle works
- [ ] Theme persists on refresh
- [ ] Dark mode looks correct everywhere
- [ ] Responsive design works at all breakpoints

### Functional Verification

- [ ] Forms submit correctly
- [ ] Login/logout works
- [ ] Image upload completes
- [ ] Delete confirmations work
- [ ] Toast notifications auto-dismiss
- [ ] Tabs switch content
- [ ] Accordions expand/collapse
- [ ] Lightbox zoom works
- [ ] Lightbox navigation works
- [ ] Search filters posts
- [ ] Tag filtering works

### Accessibility Verification

- [ ] Tab navigation works throughout site
- [ ] Focus states visible on all interactive elements
- [ ] Screen reader can navigate (test with VoiceOver/NVDA)
- [ ] ARIA attributes present on dialogs/modals
- [ ] Color contrast acceptable
- [ ] Images have alt text
- [ ] Form inputs have labels

### Performance Verification

- [ ] Bundle size is reasonable (check build output)
- [ ] Page load times acceptable
- [ ] No layout shift on load
- [ ] Images lazy load correctly
- [ ] No memory leaks (check DevTools)

---

## Documentation

### 6.8 Create Architecture Note

Create `src/lib/components/README.md`:

```markdown
# Component Architecture

## Overview

AutumnsGrove uses a layered component architecture with shadcn-svelte as the foundation.

## Directory Structure

```
src/lib/components/
├── ui/          # Wrapper components (use these!)
├── shadcn/      # Raw shadcn primitives (don't edit)
├── custom/      # Unique AutumnsGrove components
├── gallery/     # Image gallery components
└── charts/      # Data visualization
```

## Usage Guidelines

### Importing Components

Always import from the appropriate directory:

```svelte
// UI components (buttons, cards, forms)
import { Button, Card, Input, Dialog } from "$lib/components/ui";

// Custom components (gutter, TOC, etc.)
import { ContentWithGutter, LogViewer } from "$lib/components/custom";

// Gallery components
import { ImageGallery, Lightbox } from "$lib/components/gallery";

// Chart components
import { Sparkline, ActivityOverview } from "$lib/components/charts";
```

### Adding New shadcn Components

1. Install the primitive: `npx shadcn-svelte@latest add [component]`
2. Create a wrapper in `$lib/components/ui/` if needed
3. Export from `$lib/components/ui/index.ts`

### Wrapper Pattern

Wrappers in `ui/` provide:
- Simplified API
- Consistent prop names (our conventions)
- Default styling aligned with AutumnsGrove aesthetic
- Future flexibility to swap implementations

Example:
```svelte
// Our API
<Button variant="primary" loading={true}>Save</Button>

// Maps internally to shadcn
<ShadcnButton variant="default" disabled={true}>...</ShadcnButton>
```

## CSS Architecture

- **Tailwind**: Utility classes for layout and spacing
- **CSS Variables**: Theme colors via `tokens.css`
- **Tailwind Typography**: Prose content styling
- **Scoped CSS**: Only for truly unique component needs

## Theming

Colors are defined in `src/app.css` as HSL values.
Original variable names mapped in `src/lib/styles/tokens.css`.

Dark mode: Add `.dark` class to `<html>` element.
```

---

## Final Commit

After all verification passes:

```bash
# Stage all changes
git add .

# Create comprehensive commit
git commit -m "$(cat <<'EOF'
feat: complete shadcn-svelte migration

- Add Tailwind CSS and shadcn-svelte foundation
- Create wrapper components for abstraction layer
- Migrate all admin routes to new components
- Migrate all public routes to new components
- Migrate content styling to Tailwind Typography
- Improve gallery components with shadcn Dialog
- Remove deprecated components and CSS
- Add component architecture documentation

This migration provides:
- Consistent, accessible UI components
- Abstraction layer for future flexibility
- Improved dark mode support
- Better loading states and animations
- Cleaner, more maintainable codebase

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"

# Push to branch
git push -u origin claude/explore-shadcn-integration-013yvUWs5fAGaXAmfEqtNddf
```

---

## Success Criteria

- [ ] All deprecated files removed
- [ ] All barrel exports updated
- [ ] No unused CSS remains
- [ ] `npm run build` succeeds
- [ ] No console errors
- [ ] All routes render correctly
- [ ] Dark mode works everywhere
- [ ] Mobile responsive throughout
- [ ] Forms and interactions work
- [ ] Accessibility maintained
- [ ] Documentation created
- [ ] Clean commit history
