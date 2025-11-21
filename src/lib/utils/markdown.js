import { marked } from "marked";
import matter from "gray-matter";
import mermaid from "mermaid";

// Configure Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
});

// Use Vite's import.meta.glob to load markdown files at build time
// This works in both dev and production (including Cloudflare Workers)
// Path is relative to project root
const modules = import.meta.glob("../../../posts/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});
const recipeModules = import.meta.glob("../../../recipes/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

// Load about page markdown
const aboutModules = import.meta.glob("../../../about/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

// Load recipe sidecar JSON files for instruction icons
const recipeSidecarModules = import.meta.glob("../../../recipes/*-grove.json", {
  eager: true,
});

// Load gutter manifest files for blog posts
const gutterManifestModules = import.meta.glob("../../../posts/*/gutter/manifest.json", {
  eager: true,
});

// Load gutter markdown content files
const gutterMarkdownModules = import.meta.glob("../../../posts/*/gutter/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

// Load gutter image files
const gutterImageModules = import.meta.glob("../../../posts/*/gutter/*.{jpg,jpeg,png,gif,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});

// Load about page gutter manifest files
const aboutGutterManifestModules = import.meta.glob("../../../about/*/gutter/manifest.json", {
  eager: true,
});

// Load about page gutter markdown content files
const aboutGutterMarkdownModules = import.meta.glob("../../../about/*/gutter/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

// Load about page gutter image files
const aboutGutterImageModules = import.meta.glob("../../../about/*/gutter/*.{jpg,jpeg,png,gif,webp}", {
  eager: true,
  query: "?url",
  import: "default",
});

/**
 * Get all markdown posts from the posts directory
 * @returns {Array} Array of post objects with metadata and slug
 */
export function getAllPosts() {
  try {
    const posts = Object.entries(modules)
      .map(([filepath, content]) => {
        try {
          // Extract slug from filepath: ../../../posts/example.md -> example
          const slug = filepath.split("/").pop().replace(".md", "");
          const { data } = matter(content);

          return {
            slug,
            title: data.title || "Untitled",
            date: data.date || new Date().toISOString(),
            tags: data.tags || [],
            description: data.description || "",
          };
        } catch (err) {
          console.error(`Error processing post ${filepath}:`, err);
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return posts;
  } catch (err) {
    console.error("Error in getAllPosts:", err);
    return [];
  }
}

/**
 * Get all recipes from the recipes directory
 * @returns {Array} Array of recipe objects with metadata and slug
 */
export function getAllRecipes() {
  try {
    const recipes = Object.entries(recipeModules)
      .map(([filepath, content]) => {
        try {
          // Extract slug from filepath: ../../../recipes/example.md -> example
          const slug = filepath.split("/").pop().replace(".md", "");
          const { data } = matter(content);

          return {
            slug,
            title: data.title || "Untitled Recipe",
            date: data.date || new Date().toISOString(),
            tags: data.tags || [],
            description: data.description || "",
          };
        } catch (err) {
          console.error(`Error processing recipe ${filepath}:`, err);
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    return recipes;
  } catch (err) {
    console.error("Error in getAllRecipes:", err);
    return [];
  }
}

/**
 * Get a single post by slug
 * @param {string} slug - The post slug
 * @returns {Object|null} Post object with content and metadata
 */
export function getPostBySlug(slug) {
  // Find the matching module by slug
  const entry = Object.entries(modules).find(([filepath]) => {
    const fileSlug = filepath.split("/").pop().replace(".md", "");
    return fileSlug === slug;
  });

  if (!entry) {
    return null;
  }

  const content = entry[1];

  const { data, content: markdown } = matter(content);
  const htmlContent = marked.parse(markdown);

  // Extract headers for table of contents
  const headers = extractHeaders(markdown);

  // Get gutter content for this post
  const gutterContent = getGutterContent(slug);

  return {
    slug,
    title: data.title || "Untitled",
    date: data.date || new Date().toISOString(),
    tags: data.tags || [],
    description: data.description || "",
    content: htmlContent,
    headers,
    gutterContent,
  };
}

/**
 * Extract headers from markdown content for table of contents
 * @param {string} markdown - The raw markdown content
 * @returns {Array} Array of header objects with level, text, and id
 */
export function extractHeaders(markdown) {
  const headers = [];
  const headerRegex = /^(#{1,6})\s+(.+)$/gm;

  let match;
  while ((match = headerRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const text = match[2].trim();
    // Create a slug-style ID from the header text
    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    headers.push({
      level,
      text,
      id,
    });
  }

  return headers;
}

/**
 * Get gutter content from specified modules
 * @param {string} slug - The page/post slug
 * @param {Object} manifestModules - The manifest modules to search
 * @param {Object} markdownModules - The markdown modules to search
 * @param {Object} imageModules - The image modules to search
 * @returns {Array} Array of gutter items with content and position info
 */
function getGutterContentFromModules(slug, manifestModules, markdownModules, imageModules) {
  // Find the manifest file for this page/post
  const manifestEntry = Object.entries(manifestModules).find(([filepath]) => {
    const parts = filepath.split('/');
    const folder = parts[parts.length - 3]; // Get the folder name
    return folder === slug;
  });

  if (!manifestEntry) {
    return [];
  }

  const manifest = manifestEntry[1].default || manifestEntry[1];

  if (!manifest.items || !Array.isArray(manifest.items)) {
    return [];
  }

  // Process each gutter item
  return manifest.items.map(item => {
    if (item.type === 'comment' || item.type === 'markdown') {
      // Find the markdown content file
      const mdEntry = Object.entries(markdownModules).find(([filepath]) => {
        return filepath.includes(`/${slug}/gutter/${item.file}`);
      });

      if (mdEntry) {
        const markdownContent = mdEntry[1];
        const htmlContent = marked.parse(markdownContent);

        return {
          ...item,
          content: htmlContent,
        };
      }
    } else if (item.type === 'photo' || item.type === 'image') {
      // Find the image file
      const imgEntry = Object.entries(imageModules).find(([filepath]) => {
        return filepath.includes(`/${slug}/gutter/${item.file}`);
      });

      if (imgEntry) {
        return {
          ...item,
          src: imgEntry[1],
        };
      }
    } else if (item.type === 'gallery') {
      // Process gallery images
      const images = (item.images || []).map(img => {
        // Check if it's an external URL
        if (img.url) {
          return {
            url: img.url,
            alt: img.alt || '',
            caption: img.caption || '',
          };
        }

        // Otherwise, look for local file
        if (img.file) {
          const imgEntry = Object.entries(imageModules).find(([filepath]) => {
            return filepath.includes(`/${slug}/gutter/${img.file}`);
          });

          if (imgEntry) {
            return {
              url: imgEntry[1],
              alt: img.alt || '',
              caption: img.caption || '',
            };
          }
        }

        return null;
      }).filter(Boolean);

      if (images.length > 0) {
        return {
          ...item,
          images,
        };
      }
    }

    return item;
  }).filter(item => item.content || item.src || item.images); // Filter out items that weren't found
}

/**
 * Get gutter content for a blog post by slug
 * @param {string} slug - The post slug
 * @returns {Array} Array of gutter items with content and position info
 */
export function getGutterContent(slug) {
  return getGutterContentFromModules(slug, gutterManifestModules, gutterMarkdownModules, gutterImageModules);
}

/**
 * Get the about page content
 * @returns {Object|null} About page object with content and metadata
 */
export function getAboutPage() {
  try {
    // Find the about.md file
    const entry = Object.entries(aboutModules).find(([filepath]) => {
      return filepath.includes('about.md');
    });

    if (!entry) {
      return null;
    }

    const content = entry[1];

    const { data, content: markdown } = matter(content);
    const htmlContent = marked.parse(markdown);

    // Extract headers for table of contents
    const headers = extractHeaders(markdown);

    // Get gutter content for the about page
    const gutterContent = getAboutGutterContent('about');

    return {
      slug: 'about',
      title: data.title || 'About',
      date: data.date || new Date().toISOString(),
      description: data.description || '',
      content: htmlContent,
      headers,
      gutterContent,
    };
  } catch (err) {
    console.error('Error in getAboutPage:', err);
    return null;
  }
}

/**
 * Get gutter content for the about page
 * @param {string} slug - The page slug (e.g., 'about')
 * @returns {Array} Array of gutter items with content and position info
 */
export function getAboutGutterContent(slug) {
  return getGutterContentFromModules(slug, aboutGutterManifestModules, aboutGutterMarkdownModules, aboutGutterImageModules);
}

/**
 * Get sidecar JSON data for a recipe by slug
 * @param {string} slug - The recipe slug (e.g., 'focaccia-recipe')
 * @returns {Object|null} Sidecar data with instruction icons
 */
export function getRecipeSidecar(slug) {
  // Try to find a matching sidecar file
  // Sidecar files are named like: recipe-name-grove.json
  const entry = Object.entries(recipeSidecarModules).find(([filepath]) => {
    // Extract the base name: ../../../recipes/focaccia-recipe-grove.json -> focaccia-recipe
    const filename = filepath.split("/").pop();
    const sidecarSlug = filename.replace("-grove.json", "");
    return sidecarSlug === slug;
  });

  if (!entry) {
    return null;
  }

  // The module is already parsed JSON
  return entry[1].default || entry[1];
}

/**
 * Get a single recipe by slug
 * @param {string} slug - The recipe slug
 * @returns {Object|null} Recipe object with content and metadata
 */
export function getRecipeBySlug(slug) {
  // Find the matching module by slug
  const entry = Object.entries(recipeModules).find(([filepath]) => {
    const fileSlug = filepath.split("/").pop().replace(".md", "");
    return fileSlug === slug;
  });

  if (!entry) {
    return null;
  }

  const content = entry[1];

  const { data, content: markdown } = matter(content);

  // Process Mermaid diagrams in the content
  const processedContent = processMermaidDiagrams(markdown);
  const htmlContent = marked.parse(processedContent);

  // Get sidecar data if available
  const sidecar = getRecipeSidecar(slug);

  return {
    slug,
    title: data.title || "Untitled Recipe",
    date: data.date || new Date().toISOString(),
    tags: data.tags || [],
    description: data.description || "",
    content: htmlContent,
    sidecar: sidecar,
  };
}

/**
 * Process Mermaid diagrams in markdown content
 * @param {string} markdown - The markdown content
 * @returns {string} Processed markdown with Mermaid diagrams
 */
function processMermaidDiagrams(markdown) {
  // Replace Mermaid code blocks with special divs that will be processed later
  return markdown.replace(
    /```mermaid\n([\s\S]*?)```/g,
    (match, diagramCode) => {
      const diagramId = "mermaid-" + Math.random().toString(36).substr(2, 9);
      return `<div class="mermaid-container" id="${diagramId}" data-diagram="${encodeURIComponent(diagramCode.trim())}"></div>`;
    },
  );
}

/**
 * Render Mermaid diagrams in the DOM
 * This should be called after the content is mounted
 */
export async function renderMermaidDiagrams() {
  const containers = document.querySelectorAll(".mermaid-container");

  for (const container of containers) {
    try {
      const diagramCode = decodeURIComponent(container.dataset.diagram);
      const { svg } = await mermaid.render(container.id, diagramCode);
      container.innerHTML = svg;
    } catch (error) {
      console.error("Error rendering Mermaid diagram:", error);
      container.innerHTML = '<p class="error">Error rendering diagram</p>';
    }
  }
}
