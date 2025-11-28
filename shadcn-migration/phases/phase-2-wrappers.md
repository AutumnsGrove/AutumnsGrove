# Phase 2: Install shadcn Components & Create Wrapper Layer

## Context

Foundation is complete (Phase 1). Now we install the shadcn primitive components and create abstraction wrappers that expose a clean API while using shadcn internally. This wrapper pattern allows future flexibility to swap implementations.

**Key Principle**: Routes will import from `$lib/components/ui/`, never directly from `$lib/components/shadcn/`.

---

## Tasks

### 2.1 Install shadcn Primitive Components

Run these commands to install components to `$lib/components/shadcn/`:

```bash
npx shadcn-svelte@latest add button
npx shadcn-svelte@latest add card
npx shadcn-svelte@latest add input
npx shadcn-svelte@latest add label
npx shadcn-svelte@latest add textarea
npx shadcn-svelte@latest add dialog
npx shadcn-svelte@latest add alert-dialog
npx shadcn-svelte@latest add select
npx shadcn-svelte@latest add tabs
npx shadcn-svelte@latest add accordion
npx shadcn-svelte@latest add badge
npx shadcn-svelte@latest add table
npx shadcn-svelte@latest add sheet
npx shadcn-svelte@latest add tooltip
npx shadcn-svelte@latest add sonner
npx shadcn-svelte@latest add separator
npx shadcn-svelte@latest add checkbox
npx shadcn-svelte@latest add radio-group
npx shadcn-svelte@latest add dropdown-menu
npx shadcn-svelte@latest add skeleton
```

### 2.2 Create Wrapper Components

Create wrapper components in `$lib/components/ui/` that provide a simplified, consistent API.

---

#### Button.svelte

```svelte
<script lang="ts">
  import { Button as ShadcnButton } from "$lib/components/shadcn/button";
  import { cn } from "$lib/utils/cn";
  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";

  type Variant = "primary" | "secondary" | "danger" | "ghost" | "link";
  type Size = "sm" | "md" | "lg" | "icon";

  interface Props extends HTMLButtonAttributes {
    variant?: Variant;
    size?: Size;
    loading?: boolean;
    class?: string;
    children?: Snippet;
  }

  let {
    variant = "primary",
    size = "md",
    disabled = false,
    loading = false,
    class: className = "",
    children,
    ...restProps
  }: Props = $props();

  // Map our variants to shadcn variants
  const variantMap: Record<Variant, string> = {
    primary: "default",
    secondary: "secondary",
    danger: "destructive",
    ghost: "ghost",
    link: "link"
  };

  const sizeMap: Record<Size, string> = {
    sm: "sm",
    md: "default",
    lg: "lg",
    icon: "icon"
  };
</script>

<ShadcnButton
  variant={variantMap[variant]}
  size={sizeMap[size]}
  disabled={disabled || loading}
  class={cn(loading && "opacity-70 cursor-wait", className)}
  {...restProps}
>
  {#if loading}
    <span class="mr-2 inline-block animate-spin">⟳</span>
  {/if}
  {#if children}
    {@render children()}
  {/if}
</ShadcnButton>
```

---

#### Card.svelte

```svelte
<script lang="ts">
  import * as ShadcnCard from "$lib/components/shadcn/card";
  import { cn } from "$lib/utils/cn";
  import type { Snippet } from "svelte";

  interface Props {
    title?: string;
    description?: string;
    class?: string;
    hoverable?: boolean;
    children?: Snippet;
    footer?: Snippet;
  }

  let {
    title,
    description,
    class: className = "",
    hoverable = false,
    children,
    footer
  }: Props = $props();
</script>

<ShadcnCard.Root
  class={cn(
    hoverable && "transition-all duration-200 hover:shadow-lg hover:-translate-y-1 hover:border-primary/50",
    className
  )}
>
  {#if title || description}
    <ShadcnCard.Header>
      {#if title}
        <ShadcnCard.Title>{title}</ShadcnCard.Title>
      {/if}
      {#if description}
        <ShadcnCard.Description>{description}</ShadcnCard.Description>
      {/if}
    </ShadcnCard.Header>
  {/if}

  <ShadcnCard.Content>
    {#if children}
      {@render children()}
    {/if}
  </ShadcnCard.Content>

  {#if footer}
    <ShadcnCard.Footer>
      {@render footer()}
    </ShadcnCard.Footer>
  {/if}
</ShadcnCard.Root>
```

---

#### Dialog.svelte

```svelte
<script lang="ts">
  import * as ShadcnDialog from "$lib/components/shadcn/dialog";
  import { cn } from "$lib/utils/cn";
  import type { Snippet } from "svelte";

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    title?: string;
    description?: string;
    class?: string;
    children?: Snippet;
    footer?: Snippet;
  }

  let {
    open = $bindable(false),
    onOpenChange,
    title,
    description,
    class: className = "",
    children,
    footer
  }: Props = $props();

  function handleOpenChange(value: boolean) {
    open = value;
    onOpenChange?.(value);
  }
</script>

<ShadcnDialog.Root bind:open onOpenChange={handleOpenChange}>
  <ShadcnDialog.Content class={cn(className)}>
    {#if title || description}
      <ShadcnDialog.Header>
        {#if title}
          <ShadcnDialog.Title>{title}</ShadcnDialog.Title>
        {/if}
        {#if description}
          <ShadcnDialog.Description>{description}</ShadcnDialog.Description>
        {/if}
      </ShadcnDialog.Header>
    {/if}

    {#if children}
      {@render children()}
    {/if}

    {#if footer}
      <ShadcnDialog.Footer>
        {@render footer()}
      </ShadcnDialog.Footer>
    {/if}
  </ShadcnDialog.Content>
</ShadcnDialog.Root>
```

---

#### Input.svelte

```svelte
<script lang="ts">
  import { Input as ShadcnInput } from "$lib/components/shadcn/input";
  import { Label } from "$lib/components/shadcn/label";
  import { cn } from "$lib/utils/cn";
  import type { HTMLInputAttributes } from "svelte/elements";

  interface Props extends HTMLInputAttributes {
    label?: string;
    error?: string;
    class?: string;
    inputClass?: string;
  }

  let {
    label,
    error,
    value = $bindable(""),
    class: className = "",
    inputClass = "",
    id,
    ...restProps
  }: Props = $props();

  const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
</script>

<div class={cn("space-y-2", className)}>
  {#if label}
    <Label for={inputId}>{label}</Label>
  {/if}

  <ShadcnInput
    id={inputId}
    bind:value
    class={cn(error && "border-destructive focus-visible:ring-destructive", inputClass)}
    {...restProps}
  />

  {#if error}
    <p class="text-sm text-destructive">{error}</p>
  {/if}
</div>
```

---

#### Select.svelte

```svelte
<script lang="ts">
  import * as ShadcnSelect from "$lib/components/shadcn/select";
  import { Label } from "$lib/components/shadcn/label";
  import { cn } from "$lib/utils/cn";

  interface Option {
    value: string;
    label: string;
    disabled?: boolean;
  }

  interface Props {
    label?: string;
    placeholder?: string;
    options: Option[];
    value?: string;
    onValueChange?: (value: string) => void;
    class?: string;
    disabled?: boolean;
  }

  let {
    label,
    placeholder = "Select...",
    options,
    value = $bindable(""),
    onValueChange,
    class: className = "",
    disabled = false
  }: Props = $props();

  function handleChange(v: string) {
    value = v;
    onValueChange?.(v);
  }
</script>

<div class={cn("space-y-2", className)}>
  {#if label}
    <Label>{label}</Label>
  {/if}

  <ShadcnSelect.Root bind:value onValueChange={handleChange} {disabled}>
    <ShadcnSelect.Trigger>
      <ShadcnSelect.Value {placeholder} />
    </ShadcnSelect.Trigger>
    <ShadcnSelect.Content>
      {#each options as option}
        <ShadcnSelect.Item value={option.value} disabled={option.disabled}>
          {option.label}
        </ShadcnSelect.Item>
      {/each}
    </ShadcnSelect.Content>
  </ShadcnSelect.Root>
</div>
```

---

#### Tabs.svelte

```svelte
<script lang="ts">
  import * as ShadcnTabs from "$lib/components/shadcn/tabs";
  import { cn } from "$lib/utils/cn";
  import type { Snippet } from "svelte";

  interface Tab {
    value: string;
    label: string;
    icon?: Snippet;
  }

  interface Props {
    tabs: Tab[];
    value?: string;
    onValueChange?: (value: string) => void;
    class?: string;
    children?: Snippet<[string]>;
  }

  let {
    tabs,
    value = $bindable(tabs[0]?.value ?? ""),
    onValueChange,
    class: className = "",
    children
  }: Props = $props();

  function handleChange(v: string) {
    value = v;
    onValueChange?.(v);
  }
</script>

<ShadcnTabs.Root bind:value onValueChange={handleChange} class={cn(className)}>
  <ShadcnTabs.List>
    {#each tabs as tab}
      <ShadcnTabs.Trigger value={tab.value}>
        {#if tab.icon}
          {@render tab.icon()}
        {/if}
        {tab.label}
      </ShadcnTabs.Trigger>
    {/each}
  </ShadcnTabs.List>

  {#each tabs as tab}
    <ShadcnTabs.Content value={tab.value}>
      {#if children}
        {@render children(tab.value)}
      {/if}
    </ShadcnTabs.Content>
  {/each}
</ShadcnTabs.Root>
```

---

#### Accordion.svelte

Replaces CollapsibleSection with a more flexible API.

```svelte
<script lang="ts">
  import * as ShadcnAccordion from "$lib/components/shadcn/accordion";
  import { cn } from "$lib/utils/cn";
  import type { Snippet } from "svelte";

  interface Item {
    value: string;
    title: string;
    content?: Snippet;
  }

  interface Props {
    items?: Item[];
    type?: "single" | "multiple";
    collapsible?: boolean;
    value?: string | string[];
    class?: string;
    children?: Snippet;
  }

  let {
    items = [],
    type = "single",
    collapsible = true,
    value = $bindable(type === "single" ? "" : []),
    class: className = "",
    children
  }: Props = $props();
</script>

<ShadcnAccordion.Root {type} {collapsible} bind:value class={cn(className)}>
  {#if items.length > 0}
    {#each items as item}
      <ShadcnAccordion.Item value={item.value}>
        <ShadcnAccordion.Trigger>{item.title}</ShadcnAccordion.Trigger>
        <ShadcnAccordion.Content>
          {#if item.content}
            {@render item.content()}
          {/if}
        </ShadcnAccordion.Content>
      </ShadcnAccordion.Item>
    {/each}
  {:else if children}
    {@render children()}
  {/if}
</ShadcnAccordion.Root>

<!-- Export sub-components for manual composition -->
<script context="module">
  export {
    ShadcnAccordion.Item as Item,
    ShadcnAccordion.Trigger as Trigger,
    ShadcnAccordion.Content as Content
  };
</script>
```

---

#### Badge.svelte

For tags and status indicators.

```svelte
<script lang="ts">
  import { Badge as ShadcnBadge } from "$lib/components/shadcn/badge";
  import { cn } from "$lib/utils/cn";
  import type { Snippet } from "svelte";

  type Variant = "default" | "secondary" | "destructive" | "outline" | "tag";

  interface Props {
    variant?: Variant;
    class?: string;
    children?: Snippet;
  }

  let {
    variant = "default",
    class: className = "",
    children
  }: Props = $props();

  // Map our variants, with special "tag" variant for the purple tags
  const variantMap: Record<Variant, string> = {
    default: "default",
    secondary: "secondary",
    destructive: "destructive",
    outline: "outline",
    tag: "default" // We'll add custom classes
  };

  const isTag = variant === "tag";
</script>

<ShadcnBadge
  variant={variantMap[variant]}
  class={cn(
    isTag && "bg-accent hover:bg-accent/80 text-accent-foreground",
    className
  )}
>
  {#if children}
    {@render children()}
  {/if}
</ShadcnBadge>
```

---

#### Toast.svelte (and toast utility)

Wrapper for Sonner toast notifications.

```svelte
<script lang="ts">
  import { Toaster } from "$lib/components/shadcn/sonner";

  interface Props {
    position?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "top-center" | "bottom-center";
    richColors?: boolean;
  }

  let {
    position = "bottom-right",
    richColors = true
  }: Props = $props();
</script>

<Toaster {position} {richColors} />
```

```typescript
// toast.ts - Export the toast function
import { toast as sonnerToast } from "svelte-sonner";

export const toast = {
  success: (message: string, options?: any) => sonnerToast.success(message, options),
  error: (message: string, options?: any) => sonnerToast.error(message, options),
  info: (message: string, options?: any) => sonnerToast.info(message, options),
  warning: (message: string, options?: any) => sonnerToast.warning(message, options),
  message: (message: string, options?: any) => sonnerToast(message, options),
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss
};
```

---

#### Sheet.svelte

For mobile menu/sidebar.

```svelte
<script lang="ts">
  import * as ShadcnSheet from "$lib/components/shadcn/sheet";
  import { cn } from "$lib/utils/cn";
  import type { Snippet } from "svelte";

  type Side = "top" | "right" | "bottom" | "left";

  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    side?: Side;
    title?: string;
    description?: string;
    class?: string;
    children?: Snippet;
  }

  let {
    open = $bindable(false),
    onOpenChange,
    side = "left",
    title,
    description,
    class: className = "",
    children
  }: Props = $props();

  function handleOpenChange(value: boolean) {
    open = value;
    onOpenChange?.(value);
  }
</script>

<ShadcnSheet.Root bind:open onOpenChange={handleOpenChange}>
  <ShadcnSheet.Content {side} class={cn(className)}>
    {#if title || description}
      <ShadcnSheet.Header>
        {#if title}
          <ShadcnSheet.Title>{title}</ShadcnSheet.Title>
        {/if}
        {#if description}
          <ShadcnSheet.Description>{description}</ShadcnSheet.Description>
        {/if}
      </ShadcnSheet.Header>
    {/if}

    {#if children}
      {@render children()}
    {/if}
  </ShadcnSheet.Content>
</ShadcnSheet.Root>
```

---

#### Skeleton.svelte

For loading states.

```svelte
<script lang="ts">
  import { Skeleton as ShadcnSkeleton } from "$lib/components/shadcn/skeleton";
  import { cn } from "$lib/utils/cn";

  interface Props {
    class?: string;
    width?: string;
    height?: string;
    circle?: boolean;
  }

  let {
    class: className = "",
    width,
    height,
    circle = false
  }: Props = $props();
</script>

<ShadcnSkeleton
  class={cn(
    circle && "rounded-full",
    className
  )}
  style:width={width}
  style:height={height}
/>
```

---

### 2.3 Create Barrel Export

Create `$lib/components/ui/index.ts`:

```typescript
// Wrapper components - use these in your routes
export { default as Button } from "./Button.svelte";
export { default as Card } from "./Card.svelte";
export { default as Dialog } from "./Dialog.svelte";
export { default as Input } from "./Input.svelte";
export { default as Select } from "./Select.svelte";
export { default as Tabs } from "./Tabs.svelte";
export { default as Accordion, Item as AccordionItem, Trigger as AccordionTrigger, Content as AccordionContent } from "./Accordion.svelte";
export { default as Badge } from "./Badge.svelte";
export { default as Toast } from "./Toast.svelte";
export { toast } from "./toast";
export { default as Sheet } from "./Sheet.svelte";
export { default as Skeleton } from "./Skeleton.svelte";

// Re-export some shadcn components that don't need wrappers
export { Separator } from "$lib/components/shadcn/separator";
export { Label } from "$lib/components/shadcn/label";
export { Checkbox } from "$lib/components/shadcn/checkbox";
export * as RadioGroup from "$lib/components/shadcn/radio-group";
export * as Table from "$lib/components/shadcn/table";
export * as Tooltip from "$lib/components/shadcn/tooltip";
export * as DropdownMenu from "$lib/components/shadcn/dropdown-menu";
```

---

### 2.4 Reorganize Existing Components

Move current components to proper directories:

```
# Create directories
mkdir -p src/lib/components/custom
mkdir -p src/lib/components/gallery

# Move custom components
mv src/lib/components/ContentWithGutter.svelte src/lib/components/custom/
mv src/lib/components/LeftGutter.svelte src/lib/components/custom/
mv src/lib/components/GutterItem.svelte src/lib/components/custom/
mv src/lib/components/TableOfContents.svelte src/lib/components/custom/
mv src/lib/components/MobileTOC.svelte src/lib/components/custom/
mv src/lib/components/LogViewer.svelte src/lib/components/custom/
mv src/lib/components/InternalsPostViewer.svelte src/lib/components/custom/
mv src/lib/components/CollapsibleSection.svelte src/lib/components/custom/

# Move gallery components
mv src/lib/components/ImageGallery.svelte src/lib/components/gallery/
mv src/lib/components/Lightbox.svelte src/lib/components/gallery/
mv src/lib/components/ZoomableImage.svelte src/lib/components/gallery/
mv src/lib/components/LightboxCaption.svelte src/lib/components/gallery/
```

Create `$lib/components/custom/index.js`:

```javascript
export { default as ContentWithGutter } from "./ContentWithGutter.svelte";
export { default as LeftGutter } from "./LeftGutter.svelte";
export { default as GutterItem } from "./GutterItem.svelte";
export { default as TableOfContents } from "./TableOfContents.svelte";
export { default as MobileTOC } from "./MobileTOC.svelte";
export { default as LogViewer } from "./LogViewer.svelte";
export { default as InternalsPostViewer } from "./InternalsPostViewer.svelte";
export { default as CollapsibleSection } from "./CollapsibleSection.svelte";
```

Create `$lib/components/gallery/index.js`:

```javascript
export { default as ImageGallery } from "./ImageGallery.svelte";
export { default as Lightbox } from "./Lightbox.svelte";
export { default as ZoomableImage } from "./ZoomableImage.svelte";
export { default as LightboxCaption } from "./LightboxCaption.svelte";
```

**Update the main index.js** (`$lib/components/index.js`):

```javascript
// Re-export from organized directories
export * from "./custom";
export * from "./gallery";
export * from "./charts";
```

---

### 2.5 Update Import Paths

Search and replace imports throughout the codebase:

```javascript
// Before
import ContentWithGutter from "$lib/components/ContentWithGutter.svelte";

// After
import { ContentWithGutter } from "$lib/components/custom";
// OR
import { ContentWithGutter } from "$lib/components";
```

---

## Success Criteria

- [ ] All shadcn primitives installed in `$lib/components/shadcn/`
- [ ] All wrappers created in `$lib/components/ui/`
- [ ] Existing components moved to `$lib/components/custom/`
- [ ] Gallery components moved to `$lib/components/gallery/`
- [ ] Import paths updated throughout codebase
- [ ] `npm run dev` works without errors
- [ ] `npm run build` succeeds
- [ ] No visual changes yet (wrappers aren't used in routes yet)

---

## Files Created

| File | Description |
|------|-------------|
| `$lib/components/ui/Button.svelte` | Button wrapper |
| `$lib/components/ui/Card.svelte` | Card wrapper |
| `$lib/components/ui/Dialog.svelte` | Dialog wrapper |
| `$lib/components/ui/Input.svelte` | Input wrapper |
| `$lib/components/ui/Select.svelte` | Select wrapper |
| `$lib/components/ui/Tabs.svelte` | Tabs wrapper |
| `$lib/components/ui/Accordion.svelte` | Accordion wrapper |
| `$lib/components/ui/Badge.svelte` | Badge wrapper |
| `$lib/components/ui/Toast.svelte` | Toast component |
| `$lib/components/ui/toast.ts` | Toast utility |
| `$lib/components/ui/Sheet.svelte` | Sheet wrapper |
| `$lib/components/ui/Skeleton.svelte` | Skeleton wrapper |
| `$lib/components/ui/index.ts` | Barrel export |
| `$lib/components/custom/index.js` | Custom components export |
| `$lib/components/gallery/index.js` | Gallery components export |

---

## Important Notes

- Keep wrapper APIs simple and intuitive
- Document any prop mapping (our names → shadcn names)
- Wrappers should handle common use cases, allow passthrough for advanced
- Don't modify routes yet (that's Phase 3)
- Test that imports still work after reorganization
