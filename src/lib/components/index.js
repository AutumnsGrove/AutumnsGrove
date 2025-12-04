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
  CollapsibleSection
} from '@autumnsgrove/groveengine';

// Site-specific custom components - keep local
export { default as IconLegend } from "./custom/IconLegend.svelte";
export { default as InternalsPostViewer } from "./custom/InternalsPostViewer.svelte";
export { default as LogViewer } from "./custom/LogViewer.svelte";
export { default as AIWritingPanel } from "./admin/AIWritingPanel.svelte";

// Chart components - keep local (site-specific GitDashboard feature)
export { default as Sparkline } from "./charts/Sparkline.svelte";
export { default as LOCBar } from "./charts/LOCBar.svelte";
export { default as RepoBreakdown } from "./charts/RepoBreakdown.svelte";
export { default as ActivityOverview } from "./charts/ActivityOverview.svelte";
