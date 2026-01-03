// Component exports for easy importing
// Usage: import { ImageGallery, IconLegend, Glass, GlassCard } from '$lib/components';

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

// UI components from GroveEngine
export {
  Button,
  Card,
  Badge,
  Dialog,
  Input,
  Textarea,
  Select,
  Tabs,
  Accordion,
  Sheet,
  Toast,
  Skeleton,
  Spinner,
  Table,
  Logo,
  LogoLoader,
  // Glass components
  Glass,
  GlassButton,
  GlassCard,
  GlassConfirmDialog,
  GlassNavbar,
  GlassOverlay,
  GlassLogo,
  // Toast utilities
  toast,
} from "@autumnsgrove/groveengine/ui";

// Site-specific custom components - keep local
export { default as IconLegend } from "./custom/IconLegend.svelte";
export { default as InternalsPostViewer } from "./custom/InternalsPostViewer.svelte";
export { default as LogViewer } from "./custom/LogViewer.svelte";

// Chart components - now from groveengine
export {
  Sparkline,
  LOCBar,
  RepoBreakdown,
  ActivityOverview,
} from "@autumnsgrove/groveengine/ui/charts";
