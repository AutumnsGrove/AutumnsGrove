// Component exports for easy importing
// Usage: import { ImageGallery, IconLegend } from '$lib/components';

// Re-export all components from GroveEngine main barrel
export {
  // Gallery components
  ImageGallery,
  ZoomableImage,
  Lightbox,
  LightboxCaption,
  // Admin components
  MarkdownEditor,
  GutterManager,
  // Gutter/TOC components
  ContentWithGutter,
  LeftGutter,
  GutterItem,
  TableOfContents,
  MobileTOC,
  CollapsibleSection,
} from "@autumnsgrove/groveengine";

// Site-specific custom components - keep local
export { default as IconLegend } from "./custom/IconLegend.svelte";
export { default as InternalsPostViewer } from "./custom/InternalsPostViewer.svelte";
export { default as LogViewer } from "./custom/LogViewer.svelte";
export { default as AIWritingPanel } from "./custom/AIWritingPanel.svelte";

// Chart components - now from groveengine
export {
  Sparkline,
  LOCBar,
  RepoBreakdown,
  ActivityOverview,
} from "@autumnsgrove/groveengine/ui/charts";
