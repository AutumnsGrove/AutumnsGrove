# Phase 5: Migrate Gallery Components to shadcn Patterns

## Context

You mentioned the gallery components are "just okay." Let's improve them using shadcn patterns while keeping the zoom/pan functionality that makes them useful.

**Goal**: Modernize gallery components with shadcn Dialog for lightbox, improved loading states, and better accessibility.

---

## Components to Migrate

| Component | Current State | Target State |
|-----------|---------------|--------------|
| `ImageGallery.svelte` | Custom multi-image gallery | Improved with shadcn patterns |
| `Lightbox.svelte` | Custom modal | Replace with shadcn Dialog |
| `ZoomableImage.svelte` | Custom zoom/pan | Keep logic, improve styling |
| `LightboxCaption.svelte` | Simple caption | Integrate into new Lightbox |

---

## Migration Steps

### 5.1 New Lightbox Using Dialog

Replace the custom lightbox with shadcn Dialog for better accessibility and consistent styling.

**Create `$lib/components/gallery/Lightbox.svelte`:**

```svelte
<script lang="ts">
  import * as Dialog from "$lib/components/shadcn/dialog";
  import { Button } from "$lib/components/ui";
  import ZoomableImage from "./ZoomableImage.svelte";
  import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-svelte";
  import { cn } from "$lib/utils/cn";

  interface Props {
    open?: boolean;
    src: string;
    alt?: string;
    caption?: string;
    onClose?: () => void;
    onPrev?: () => void;
    onNext?: () => void;
    showNav?: boolean;
    currentIndex?: number;
    totalCount?: number;
  }

  let {
    open = $bindable(false),
    src,
    alt = "",
    caption = "",
    onClose,
    onPrev,
    onNext,
    showNav = false,
    currentIndex = 0,
    totalCount = 0
  }: Props = $props();

  let zoomLevel = $state(1);
  let zoomableRef: ZoomableImage | null = $state(null);

  function handleOpenChange(value: boolean) {
    open = value;
    if (!value) {
      zoomLevel = 1;
      onClose?.();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!open) return;

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        onPrev?.();
        break;
      case "ArrowRight":
        e.preventDefault();
        onNext?.();
        break;
      case "Escape":
        e.preventDefault();
        open = false;
        break;
      case "+":
      case "=":
        e.preventDefault();
        zoomableRef?.zoomIn();
        break;
      case "-":
        e.preventDefault();
        zoomableRef?.zoomOut();
        break;
    }
  }

  function handlePrev(e: MouseEvent) {
    e.stopPropagation();
    onPrev?.();
  }

  function handleNext(e: MouseEvent) {
    e.stopPropagation();
    onNext?.();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
  <Dialog.Content
    class="max-w-[95vw] max-h-[95vh] w-auto p-0 bg-black/95 border-none overflow-hidden"
  >
    <!-- Header with close and counter -->
    <div class="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
      {#if totalCount > 1}
        <span class="text-white/80 text-sm font-medium">
          {currentIndex + 1} / {totalCount}
        </span>
      {:else}
        <span></span>
      {/if}

      <div class="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          class="text-white/80 hover:text-white hover:bg-white/10"
          onclick={() => zoomableRef?.zoomOut()}
          aria-label="Zoom out"
        >
          <ZoomOut class="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="text-white/80 hover:text-white hover:bg-white/10"
          onclick={() => zoomableRef?.zoomIn()}
          aria-label="Zoom in"
        >
          <ZoomIn class="h-5 w-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          class="text-white/80 hover:text-white hover:bg-white/10"
          onclick={() => open = false}
          aria-label="Close"
        >
          <X class="h-5 w-5" />
        </Button>
      </div>
    </div>

    <!-- Navigation arrows -->
    {#if showNav && onPrev}
      <Button
        variant="ghost"
        size="icon"
        class="absolute left-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/30 text-white/80 hover:bg-black/50 hover:text-white"
        onclick={handlePrev}
        aria-label="Previous image"
      >
        <ChevronLeft class="h-8 w-8" />
      </Button>
    {/if}

    {#if showNav && onNext}
      <Button
        variant="ghost"
        size="icon"
        class="absolute right-4 top-1/2 -translate-y-1/2 z-10 h-12 w-12 rounded-full bg-black/30 text-white/80 hover:bg-black/50 hover:text-white"
        onclick={handleNext}
        aria-label="Next image"
      >
        <ChevronRight class="h-8 w-8" />
      </Button>
    {/if}

    <!-- Image container -->
    <div class="flex items-center justify-center min-h-[50vh] p-8">
      <ZoomableImage
        bind:this={zoomableRef}
        {src}
        {alt}
        class="max-h-[80vh] max-w-full object-contain"
        onZoomChange={(level) => zoomLevel = level}
      />
    </div>

    <!-- Caption -->
    {#if caption}
      <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
        <p class="text-white/90 text-center text-sm italic">
          {caption}
        </p>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
```

### 5.2 Improved ZoomableImage

Update `$lib/components/gallery/ZoomableImage.svelte` to work better with the new lightbox:

```svelte
<script lang="ts">
  import { cn } from "$lib/utils/cn";

  interface Props {
    src: string;
    alt?: string;
    class?: string;
    onZoomChange?: (level: number) => void;
  }

  let {
    src,
    alt = "",
    class: className = "",
    onZoomChange
  }: Props = $props();

  // Zoom levels: 1x, 1.5x, 2.5x
  const zoomLevels = [1, 1.5, 2.5];
  let zoomIndex = $state(0);
  let zoom = $derived(zoomLevels[zoomIndex]);

  // Pan state
  let isPanning = $state(false);
  let panStart = $state({ x: 0, y: 0 });
  let panOffset = $state({ x: 0, y: 0 });
  let currentOffset = $state({ x: 0, y: 0 });

  // Track if this is a drag vs click
  let isDragging = $state(false);
  let dragThreshold = 5;

  // Cursor state
  let cursor = $derived.by(() => {
    if (zoom > 1) {
      return isPanning ? 'grabbing' : 'grab';
    }
    return zoomIndex < zoomLevels.length - 1 ? 'zoom-in' : 'zoom-out';
  });

  export function zoomIn() {
    if (zoomIndex < zoomLevels.length - 1) {
      zoomIndex++;
      onZoomChange?.(zoomLevels[zoomIndex]);
    }
  }

  export function zoomOut() {
    if (zoomIndex > 0) {
      zoomIndex--;
      resetPan();
      onZoomChange?.(zoomLevels[zoomIndex]);
    }
  }

  function resetPan() {
    panOffset = { x: 0, y: 0 };
    currentOffset = { x: 0, y: 0 };
  }

  function cycleZoom() {
    zoomIndex = (zoomIndex + 1) % zoomLevels.length;
    if (zoomIndex === 0) {
      resetPan();
    }
    onZoomChange?.(zoomLevels[zoomIndex]);
  }

  function handleMouseDown(e: MouseEvent) {
    if (zoom > 1) {
      isPanning = true;
      isDragging = false;
      panStart = { x: e.clientX - currentOffset.x, y: e.clientY - currentOffset.y };
    }
  }

  function handleMouseMove(e: MouseEvent) {
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;

      // Check if we've moved enough to be considered a drag
      if (Math.abs(dx - currentOffset.x) > dragThreshold || Math.abs(dy - currentOffset.y) > dragThreshold) {
        isDragging = true;
      }

      panOffset = { x: dx, y: dy };
    }
  }

  function handleMouseUp(e: MouseEvent) {
    if (isPanning) {
      currentOffset = panOffset;
      isPanning = false;

      // If not dragging, it was a click - cycle zoom
      if (!isDragging) {
        cycleZoom();
      }
    } else {
      // Not panning, just clicked - cycle zoom
      cycleZoom();
    }
  }

  function handleMouseLeave() {
    if (isPanning) {
      currentOffset = panOffset;
      isPanning = false;
    }
  }

  // Touch support
  function handleTouchStart(e: TouchEvent) {
    if (e.touches.length === 1 && zoom > 1) {
      isPanning = true;
      isDragging = false;
      const touch = e.touches[0];
      panStart = { x: touch.clientX - currentOffset.x, y: touch.clientY - currentOffset.y };
    }
  }

  function handleTouchMove(e: TouchEvent) {
    if (isPanning && e.touches.length === 1) {
      const touch = e.touches[0];
      const dx = touch.clientX - panStart.x;
      const dy = touch.clientY - panStart.y;

      if (Math.abs(dx - currentOffset.x) > dragThreshold || Math.abs(dy - currentOffset.y) > dragThreshold) {
        isDragging = true;
      }

      panOffset = { x: dx, y: dy };
      e.preventDefault(); // Prevent scroll while panning
    }
  }

  function handleTouchEnd(e: TouchEvent) {
    if (isPanning) {
      currentOffset = panOffset;
      isPanning = false;

      if (!isDragging) {
        cycleZoom();
      }
    } else if (e.changedTouches.length === 1) {
      cycleZoom();
    }
  }

  // Reset zoom when src changes
  $effect(() => {
    src; // Track src
    zoomIndex = 0;
    resetPan();
  });
</script>

<div
  class={cn("relative overflow-hidden select-none", className)}
  style:cursor={cursor}
  onmousedown={handleMouseDown}
  onmousemove={handleMouseMove}
  onmouseup={handleMouseUp}
  onmouseleave={handleMouseLeave}
  ontouchstart={handleTouchStart}
  ontouchmove={handleTouchMove}
  ontouchend={handleTouchEnd}
  role="img"
  aria-label={alt}
>
  <img
    {src}
    {alt}
    class="transition-transform duration-200 ease-out"
    style:transform="scale({zoom}) translate({panOffset.x / zoom}px, {panOffset.y / zoom}px)"
    draggable="false"
  />

  <!-- Zoom indicator -->
  {#if zoom > 1}
    <div class="absolute bottom-2 right-2 px-2 py-1 bg-black/50 text-white text-xs rounded">
      {zoom}x
    </div>
  {/if}
</div>
```

### 5.3 Improved ImageGallery

Update `$lib/components/gallery/ImageGallery.svelte` with better patterns:

```svelte
<script lang="ts">
  import { Button, Skeleton } from "$lib/components/ui";
  import Lightbox from "./Lightbox.svelte";
  import { ChevronLeft, ChevronRight } from "lucide-svelte";
  import { cn } from "$lib/utils/cn";

  interface Image {
    src: string;
    alt?: string;
    caption?: string;
    thumbnail?: string;
  }

  interface Props {
    images: Image[];
    class?: string;
  }

  let { images, class: className = "" }: Props = $props();

  let currentIndex = $state(0);
  let lightboxOpen = $state(false);
  let loadedImages = $state<Set<number>>(new Set());
  let errorImages = $state<Set<number>>(new Set());

  // Navigation cooldown to prevent double-taps
  let navCooldown = $state(false);
  const cooldownMs = 300;

  function openLightbox(index: number) {
    currentIndex = index;
    lightboxOpen = true;
  }

  function goToPrev() {
    if (navCooldown) return;
    navCooldown = true;
    currentIndex = (currentIndex - 1 + images.length) % images.length;
    setTimeout(() => navCooldown = false, cooldownMs);
  }

  function goToNext() {
    if (navCooldown) return;
    navCooldown = true;
    currentIndex = (currentIndex + 1) % images.length;
    setTimeout(() => navCooldown = false, cooldownMs);
  }

  function handleImageLoad(index: number) {
    loadedImages = new Set([...loadedImages, index]);
  }

  function handleImageError(index: number) {
    errorImages = new Set([...errorImages, index]);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') {
      goToPrev();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    }
  }

  // Preload adjacent images when lightbox opens
  $effect(() => {
    if (lightboxOpen) {
      const prevIndex = (currentIndex - 1 + images.length) % images.length;
      const nextIndex = (currentIndex + 1) % images.length;

      // Preload next/prev images
      [prevIndex, nextIndex].forEach(idx => {
        if (!loadedImages.has(idx) && !errorImages.has(idx)) {
          const img = new Image();
          img.src = images[idx].src;
          img.onload = () => handleImageLoad(idx);
        }
      });
    }
  });
</script>

<div
  class={cn("relative", className)}
  onkeydown={handleKeydown}
  tabindex="0"
  role="region"
  aria-label="Image gallery"
>
  <!-- Main image display -->
  <div class="relative aspect-video bg-secondary rounded-lg overflow-hidden">
    {#if !loadedImages.has(currentIndex) && !errorImages.has(currentIndex)}
      <Skeleton class="absolute inset-0" />
    {/if}

    {#if errorImages.has(currentIndex)}
      <div class="absolute inset-0 flex items-center justify-center text-muted-foreground">
        <span>Failed to load image</span>
      </div>
    {:else}
      <button
        class="w-full h-full cursor-pointer"
        onclick={() => openLightbox(currentIndex)}
        aria-label="Open image in lightbox"
      >
        <img
          src={images[currentIndex].src}
          alt={images[currentIndex].alt || `Image ${currentIndex + 1}`}
          class={cn(
            "w-full h-full object-contain transition-opacity duration-300",
            loadedImages.has(currentIndex) ? "opacity-100" : "opacity-0"
          )}
          onload={() => handleImageLoad(currentIndex)}
          onerror={() => handleImageError(currentIndex)}
        />
      </button>
    {/if}

    <!-- Navigation arrows (if multiple images) -->
    {#if images.length > 1}
      <Button
        variant="ghost"
        size="icon"
        class="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50"
        onclick={goToPrev}
        aria-label="Previous image"
      >
        <ChevronLeft class="h-6 w-6" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        class="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white hover:bg-black/50"
        onclick={goToNext}
        aria-label="Next image"
      >
        <ChevronRight class="h-6 w-6" />
      </Button>
    {/if}
  </div>

  <!-- Caption -->
  {#if images[currentIndex].caption}
    <p class="mt-2 text-sm text-muted-foreground text-center italic">
      {images[currentIndex].caption}
    </p>
  {/if}

  <!-- Thumbnail strip (if multiple images) -->
  {#if images.length > 1}
    <div class="mt-4 flex gap-2 overflow-x-auto pb-2">
      {#each images as image, i}
        <button
          class={cn(
            "flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden transition-all",
            i === currentIndex
              ? "border-primary ring-2 ring-primary/30"
              : "border-transparent hover:border-border"
          )}
          onclick={() => currentIndex = i}
          aria-label={`View image ${i + 1}`}
          aria-current={i === currentIndex ? "true" : undefined}
        >
          <img
            src={image.thumbnail || image.src}
            alt=""
            class="w-full h-full object-cover"
            loading="lazy"
          />
        </button>
      {/each}
    </div>

    <!-- Progress dots (alternative to thumbnails for small sets) -->
    <div class="mt-3 flex justify-center gap-2">
      {#each images as _, i}
        <button
          class={cn(
            "w-2 h-2 rounded-full transition-colors",
            i === currentIndex ? "bg-primary" : "bg-border hover:bg-muted-foreground"
          )}
          onclick={() => currentIndex = i}
          aria-label={`Go to image ${i + 1}`}
          aria-current={i === currentIndex ? "true" : undefined}
        />
      {/each}
    </div>
  {/if}
</div>

<!-- Lightbox -->
<Lightbox
  bind:open={lightboxOpen}
  src={images[currentIndex]?.src || ""}
  alt={images[currentIndex]?.alt}
  caption={images[currentIndex]?.caption}
  showNav={images.length > 1}
  onPrev={goToPrev}
  onNext={goToNext}
  {currentIndex}
  totalCount={images.length}
/>
```

### 5.4 Update Gallery Page

Update `/gallery/+page.svelte` to use improved components:

```svelte
<script>
  import { Skeleton } from "$lib/components/ui";
  import { Lightbox } from "$lib/components/gallery";
  import { cn } from "$lib/utils/cn";

  let { data } = $props();

  let lightboxOpen = $state(false);
  let lightboxIndex = $state(0);
  let loadedImages = $state<Set<number>>(new Set());

  function openLightbox(index: number) {
    lightboxIndex = index;
    lightboxOpen = true;
  }

  function goToPrev() {
    lightboxIndex = (lightboxIndex - 1 + data.images.length) % data.images.length;
  }

  function goToNext() {
    lightboxIndex = (lightboxIndex + 1) % data.images.length;
  }

  // Deterministic size classes for mood board effect
  function getSizeClass(index: number): string {
    const hash = (index * 2654435761) % 16;
    if (hash < 2) return 'col-span-2 row-span-2'; // Large
    if (hash < 4) return 'col-span-2'; // Wide
    if (hash < 6) return 'row-span-2'; // Tall
    return ''; // Regular
  }
</script>

<div class="min-h-screen">
  <header class="py-8 px-4 text-center">
    <h1 class="text-3xl font-bold text-primary">Gallery</h1>
    <p class="text-muted-foreground mt-2">{data.images.length} images</p>
  </header>

  <!-- Mood board grid -->
  <div class="px-4 pb-8">
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 auto-rows-[200px]">
      {#each data.images as image, i}
        <button
          class={cn(
            "relative overflow-hidden rounded-lg bg-secondary group cursor-pointer",
            getSizeClass(i)
          )}
          onclick={() => openLightbox(i)}
        >
          {#if !loadedImages.has(i)}
            <Skeleton class="absolute inset-0" />
          {/if}

          <img
            src={image.src}
            alt={image.alt || `Gallery image ${i + 1}`}
            class={cn(
              "w-full h-full object-cover transition-all duration-300",
              "group-hover:scale-105 group-hover:brightness-110",
              loadedImages.has(i) ? "opacity-100" : "opacity-0"
            )}
            loading="lazy"
            onload={() => loadedImages = new Set([...loadedImages, i])}
          />

          <!-- Hover overlay -->
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        </button>
      {/each}
    </div>
  </div>
</div>

<!-- Lightbox -->
<Lightbox
  bind:open={lightboxOpen}
  src={data.images[lightboxIndex]?.src || ""}
  alt={data.images[lightboxIndex]?.alt}
  caption={data.images[lightboxIndex]?.caption}
  showNav={data.images.length > 1}
  onPrev={goToPrev}
  onNext={goToNext}
  currentIndex={lightboxIndex}
  totalCount={data.images.length}
/>
```

### 5.5 Update Gallery Barrel Export

Update `$lib/components/gallery/index.js`:

```javascript
export { default as ImageGallery } from "./ImageGallery.svelte";
export { default as Lightbox } from "./Lightbox.svelte";
export { default as ZoomableImage } from "./ZoomableImage.svelte";
// LightboxCaption is now integrated into Lightbox
```

---

## Testing Checklist

- [ ] Gallery grid displays images correctly
- [ ] Clicking image opens lightbox
- [ ] Lightbox displays image centered
- [ ] Close button works
- [ ] Escape key closes lightbox
- [ ] Arrow keys navigate images
- [ ] Click navigation arrows work
- [ ] Swipe/touch navigation works on mobile
- [ ] Zoom in/out works (click or buttons)
- [ ] Pan works when zoomed
- [ ] Zoom resets between images
- [ ] Image counter displays correctly
- [ ] Caption displays when present
- [ ] Loading skeleton appears
- [ ] Error state shows for failed images
- [ ] Thumbnail strip navigates correctly
- [ ] Progress dots work
- [ ] Accessibility: focus visible, aria labels present
- [ ] Dark mode looks good
- [ ] Mobile responsive

---

## Success Criteria

- [ ] Gallery looks cleaner and more polished
- [ ] Lightbox feels modern and accessible
- [ ] Zoom still works as expected
- [ ] Navigation works (keyboard + mouse + touch)
- [ ] Loading states are visible
- [ ] Error states are handled gracefully
- [ ] Accessibility improved (ARIA, focus management)
- [ ] No visual regressions from original
