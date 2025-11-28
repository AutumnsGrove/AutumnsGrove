# shadcn-svelte Migration Plan for AutumnsGrove

> **Status**: Planning Complete - Ready for Execution
> **Branch**: `claude/explore-shadcn-integration-013yvUWs5fAGaXAmfEqtNddf`

---

## Overview

**Goal**: Migrate AutumnsGrove to shadcn-svelte while maintaining maximum abstraction through wrapper components and a CSS variable mapping layer. This allows future flexibility to swap underlying implementations.

**Philosophy**:
- Abstraction over direct usage
- Your API, shadcn's internals
- Preserve the warm, authentic AutumnsGrove aesthetic
- Everything is reversible (branch can be deleted)

---

## Architecture: The Abstraction Layers

```
┌─────────────────────────────────────────────────────────┐
│  YOUR ROUTES & PAGES                                    │
│  (Use wrapper components with your familiar API)        │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│  WRAPPER COMPONENTS ($lib/components/ui/)               │
│  Button.svelte, Card.svelte, Dialog.svelte, etc.        │
│  (Your API → shadcn components internally)              │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│  SHADCN PRIMITIVES ($lib/components/ui/shadcn/)         │
│  (Installed shadcn components, untouched)               │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│  CSS VARIABLE MAPPING ($lib/styles/tokens.css)          │
│  --color-primary: var(--primary)                        │
│  (Your names → shadcn's HSL system)                     │
└─────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────┐
│  TAILWIND + SHADCN BASE (tailwind.config.js + app.css)  │
│  (Foundation layer with HSL color system)               │
└─────────────────────────────────────────────────────────┘
```

---

## Target File Structure

```
src/lib/
├── components/
│   ├── ui/                      # YOUR wrapper components
│   │   ├── Button.svelte        # Wraps shadcn button
│   │   ├── Card.svelte          # Wraps shadcn card
│   │   ├── Dialog.svelte        # Wraps shadcn dialog
│   │   ├── Input.svelte         # Wraps shadcn input
│   │   ├── Toast.svelte         # Wraps sonner
│   │   ├── Tabs.svelte          # Wraps shadcn tabs
│   │   ├── Accordion.svelte     # Wraps shadcn accordion
│   │   ├── Select.svelte        # Wraps shadcn select
│   │   ├── Badge.svelte         # Wraps shadcn badge
│   │   ├── Table.svelte         # Wraps shadcn table
│   │   ├── Sheet.svelte         # Wraps shadcn sheet (mobile menu)
│   │   ├── Tooltip.svelte       # Wraps shadcn tooltip
│   │   └── index.ts             # Barrel export
│   │
│   ├── shadcn/                  # RAW shadcn components (don't edit)
│   │   ├── button/
│   │   ├── card/
│   │   ├── dialog/
│   │   └── ... (installed via CLI)
│   │
│   ├── custom/                  # YOUR unique components (keep)
│   │   ├── ContentWithGutter.svelte
│   │   ├── LeftGutter.svelte
│   │   ├── GutterItem.svelte
│   │   ├── TableOfContents.svelte
│   │   ├── MobileTOC.svelte
│   │   ├── LogViewer.svelte
│   │   └── index.js
│   │
│   ├── charts/                  # Chart components (restyle only)
│   │   ├── Sparkline.svelte
│   │   ├── LOCBar.svelte
│   │   ├── RepoBreakdown.svelte
│   │   ├── ActivityOverview.svelte
│   │   └── index.js
│   │
│   └── gallery/                 # Gallery (migrate to shadcn patterns)
│       ├── ImageGallery.svelte
│       ├── Lightbox.svelte
│       ├── ZoomableImage.svelte
│       └── index.js
│
├── styles/
│   ├── tokens.css               # CSS variable mapping layer
│   ├── content.css              # Blog/recipe prose (migrate to Tailwind Typography)
│   └── utilities.css            # Custom utility classes if needed
│
└── utils/
    └── cn.ts                    # clsx + tailwind-merge utility
```

---

## Phases Overview

| Phase | Description | Dependencies | Parallelizable |
|-------|-------------|--------------|----------------|
| **Phase 1** | Foundation Setup | None | No |
| **Phase 2** | Install shadcn + Create Wrappers | Phase 1 | No |
| **Phase 3A** | Migrate Admin Routes | Phase 2 | Yes |
| **Phase 3B** | Migrate Public Routes | Phase 2 | Yes |
| **Phase 4** | Content/Typography Migration | Phase 2 | Yes |
| **Phase 5** | Gallery Component Improvements | Phase 2 | Yes |
| **Phase 6** | Cleanup & Verification | All above | No |

**Execution Flow:**
```
Phase 1 → Phase 2 → [Phase 3A, 3B, 4, 5 in parallel] → Phase 6
```

---

## Key Design Decisions

### 1. Wrapper Components
All shadcn components are wrapped with a simplified API:
- Wrappers live in `$lib/components/ui/`
- Raw shadcn components in `$lib/components/shadcn/`
- This allows swapping implementations later

### 2. CSS Variable Mapping
Preserve existing variable names via mapping layer:
```css
:root {
  /* AutumnsGrove names map to shadcn system */
  --color-primary: hsl(var(--primary));
  --color-text: hsl(var(--foreground));
}
```

### 3. Sacred Components (Don't Replace)
- `ContentWithGutter` - Core layout system
- `LeftGutter`, `GutterItem` - Gutter architecture
- `TableOfContents`, `MobileTOC` - TOC system
- `LogViewer` - Real-time log streaming
- All chart components - Data visualization

### 4. Components to Migrate
- Buttons, Cards, Inputs, Selects → shadcn wrappers
- Modals/Dialogs → shadcn Dialog
- Toasts → Sonner
- Tabs → shadcn Tabs
- Collapsible sections → shadcn Accordion
- Gallery/Lightbox → Improved with shadcn Dialog

---

## Phase Prompts

Each phase has a detailed prompt file in `./phases/`:
- `phase-1-foundation.md`
- `phase-2-wrappers.md`
- `phase-3a-admin-routes.md`
- `phase-3b-public-routes.md`
- `phase-4-content-styling.md`
- `phase-5-gallery.md`
- `phase-6-cleanup.md`

---

## Color Mapping Reference

> ✅ *HSL values verified with color conversion tool - 2025-11-28*

| AutumnsGrove Variable | Hex Value | HSL Value | shadcn Variable |
|-----------------------|-----------|-----------|-----------------|
| `--color-primary` | #2c5f2d | 121 37% 27% | `--primary` |
| `--color-primary-hover` | #4a9d4f | 124 36% 45% | `--primary-hover` (custom) |
| `--color-primary-light` | #5cb85f | 122 39% 54% | Dark mode primary |
| `--color-text` | #333 | 0 0% 20% | `--foreground` |
| `--color-text-muted` | #666 | 0 0% 40% | `--muted-foreground` |
| `--color-text-subtle` | #888 | 0 0% 53% | Custom or muted variant |
| `--color-bg-secondary` | #f5f5f5 | 0 0% 96% | `--secondary` |
| `--color-border` | #e0e0e0 | 0 0% 88% | `--border` |
| `--color-danger` | #d73a49 | 354 66% 54% | `--destructive` |
| `--tag-bg` | #7c4dab | 270 38% 49% | `--accent` |

---

## Rollback Strategy

If the migration fails at any point or you decide not to proceed:

```bash
# Option 1: Abandon the branch entirely
git checkout main
git branch -D claude/explore-shadcn-integration-013yvUWs5fAGaXAmfEqtNddf

# Option 2: Revert specific commits while keeping branch
git log --oneline  # Find commit to revert to
git reset --hard <commit-hash>

# Option 3: Cherry-pick only working phases
git checkout main
git checkout -b shadcn-partial
git cherry-pick <phase-1-commit> <phase-2-commit>  # etc.
```

**Key safety points:**
- All changes are contained in the feature branch
- `main` is never touched until PR merge
- Each phase can be committed separately for granular rollback
- The CSS variable mapping layer means existing code continues working during migration

---

## Success Criteria

- [ ] All routes use wrapper components
- [ ] Visual appearance matches original
- [ ] Dark mode works perfectly
- [ ] Mobile responsive throughout
- [ ] Forms and interactions work
- [ ] Bundle size reasonable
- [ ] No console errors
- [ ] Accessibility maintained

---

*Created: 2025-11-28*
