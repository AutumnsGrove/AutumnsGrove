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
// Path is relative to project root - now using UserContent directory

// Posts
const modules = import.meta.glob("../../../UserContent/Posts/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

// Recipes
const recipeModules = import.meta.glob("../../../UserContent/Recipes/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

// About
const aboutModules = import.meta.glob("../../../UserContent/About/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

// Home
const homeModules = import.meta.glob("../../../UserContent/Home/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

// Contact
const contactModules = import.meta.glob("../../../UserContent/Contact/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

// Load recipe metadata JSON files (step icons, etc.)
const recipeMetadataModules = import.meta.glob(
  "../../../UserContent/Recipes/*/gutter/recipe.json",
  {
    eager: true,
  },
);

// Load gutter manifest files for blog posts
const gutterManifestModules = import.meta.glob(
  "../../../UserContent/Posts/*/gutter/manifest.json",
  {
    eager: true,
  },
);

// Load gutter markdown content files
const gutterMarkdownModules = import.meta.glob(
  "../../../UserContent/Posts/*/gutter/*.md",
  {
    eager: true,
    query: "?raw",
    import: "default",
  },
);

// Load gutter image files
const gutterImageModules = import.meta.glob(
  "../../../UserContent/Posts/*/gutter/*.{jpg,jpeg,png,gif,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

// Load about page gutter manifest files
const aboutGutterManifestModules = import.meta.glob(
  "../../../UserContent/About/*/gutter/manifest.json",
  {
    eager: true,
  },
);

// Load about page gutter markdown content files
const aboutGutterMarkdownModules = import.meta.glob(
  "../../../UserContent/About/*/gutter/*.md",
  {
    eager: true,
    query: "?raw",
    import: "default",
  },
);

// Load about page gutter image files
const aboutGutterImageModules = import.meta.glob(
  "../../../UserContent/About/*/gutter/*.{jpg,jpeg,png,gif,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

// Load recipe gutter manifest files
const recipeGutterManifestModules = import.meta.glob(
  "../../../UserContent/Recipes/*/gutter/manifest.json",
  {
    eager: true,
  },
);

// Load recipe gutter markdown content files
const recipeGutterMarkdownModules = import.meta.glob(
  "../../../UserContent/Recipes/*/gutter/*.md",
  {
    eager: true,
    query: "?raw",
    import: "default",
  },
);

// Load recipe gutter image files
const recipeGutterImageModules = import.meta.glob(
  "../../../UserContent/Recipes/*/gutter/*.{jpg,jpeg,png,gif,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

// Load home page gutter manifest files
const homeGutterManifestModules = import.meta.glob(
  "../../../UserContent/Home/*/gutter/manifest.json",
  {
    eager: true,
  },
);

// Load home page gutter markdown content files
const homeGutterMarkdownModules = import.meta.glob(
  "../../../UserContent/Home/*/gutter/*.md",
  {
    eager: true,
    query: "?raw",
    import: "default",
  },
);

// Load home page gutter image files
const homeGutterImageModules = import.meta.glob(
  "../../../UserContent/Home/*/gutter/*.{jpg,jpeg,png,gif,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

// Load contact page gutter manifest files
const contactGutterManifestModules = import.meta.glob(
  "../../../UserContent/Contact/*/gutter/manifest.json",
  {
    eager: true,
  },
);

// Load contact page gutter markdown content files
const contactGutterMarkdownModules = import.meta.glob(
  "../../../UserContent/Contact/*/gutter/*.md",
  {
    eager: true,
    query: "?raw",
    import: "default",
  },
);

// Load contact page gutter image files
const contactGutterImageModules = import.meta.glob(
  "../../../UserContent/Contact/*/gutter/*.{jpg,jpeg,png,gif,webp}",
  {
    eager: true,
    query: "?url",
    import: "default",
  },
);

/**
 * Validates if a string is a valid URL
 * @param {string} urlString - The string to validate as a URL
 * @returns {boolean} True if the string is a valid URL, false otherwise
 */
function isValidUrl(urlString) {
  try {
    const url = new URL(urlString);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Get all markdown posts from the posts directory
 * @returns {Array} Array of post objects with metadata and slug
 */
export function getAllPosts() {
  try {
    const posts = Object.entries(modules)
      .map(([filepath, content]) => {
        try {
          // Extract slug from filepath: ../../../UserContent/Posts/example.md -> example
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
          // Extract slug from filepath: ../../../UserContent/Recipes/example.md -> example
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
  let htmlContent = marked.parse(markdown);

  // Process anchor tags in the HTML content
  htmlContent = processAnchorTags(htmlContent);

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
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
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
 * Process anchor tags in HTML content
 * Converts <!-- anchor:tagname --> comments to identifiable span elements
 * @param {string} html - The HTML content
 * @returns {string} HTML with anchor markers converted to spans
 */
export function processAnchorTags(html) {
  // Convert <!-- anchor:tagname --> to <span class="anchor-marker" data-anchor="tagname"></span>
  // Supports alphanumeric characters, underscores, and hyphens in tag names
  return html.replace(
    /<!--\s*anchor:([\w-]+)\s*-->/g,
    (match, tagname) =>
      `<span class="anchor-marker" data-anchor="${tagname}"></span>`,
  );
}

/**
 * Get gutter content from specified modules
 * @param {string} slug - The page/post slug
 * @param {Object} manifestModules - The manifest modules to search
 * @param {Object} markdownModules - The markdown modules to search
 * @param {Object} imageModules - The image modules to search
 * @returns {Array} Array of gutter items with content and position info
 */
function getGutterContentFromModules(
  slug,
  manifestModules,
  markdownModules,
  imageModules,
) {
  // Find the manifest file for this page/post
  const manifestEntry = Object.entries(manifestModules).find(([filepath]) => {
    const parts = filepath.split("/");
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
  return manifest.items
    .map((item) => {
      if (item.type === "comment" || item.type === "markdown") {
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
      } else if (item.type === "photo" || item.type === "image") {
        // Check if file is an external URL
        if (item.file && isValidUrl(item.file)) {
          return {
            ...item,
            src: item.file,
          };
        }

        // Find the local image file
        const imgEntry = Object.entries(imageModules).find(([filepath]) => {
          return filepath.includes(`/${slug}/gutter/${item.file}`);
        });

        if (imgEntry) {
          return {
            ...item,
            src: imgEntry[1],
          };
        }
      } else if (item.type === "emoji") {
        // Emoji items can use URLs (local or CDN) or local files
        if (item.url) {
          // Direct URL (local path like /icons/instruction/mix.webp or CDN URL)
          return {
            ...item,
            src: item.url,
          };
        } else if (item.file) {
          // Local file in gutter directory
          const imgEntry = Object.entries(imageModules).find(([filepath]) => {
            return filepath.includes(`/${slug}/gutter/${item.file}`);
          });

          if (imgEntry) {
            return {
              ...item,
              src: imgEntry[1],
            };
          }
        }
        return item;
      } else if (item.type === "gallery") {
        /**
         * Process gallery items containing multiple images
         *
         * Galleries can contain:
         * - External URLs (validated for http/https protocol)
         * - Local files (resolved from the gutter directory)
         *
         * Images that fail to resolve (invalid URLs or missing files) are filtered out.
         * If all images fail to resolve, the entire gallery item is excluded.
         */
        const originalImageCount = (item.images || []).length;
        const images = (item.images || [])
          .map((img) => {
            // Check if it's an external URL
            if (img.url) {
              // Validate URL format to prevent malformed URLs from failing silently
              if (!isValidUrl(img.url)) {
                console.warn(
                  `Invalid URL in gallery for "${slug}": ${img.url}`,
                );
                return null;
              }
              return {
                url: img.url,
                alt: img.alt || "",
                caption: img.caption || "",
              };
            }

            // Otherwise, look for local file
            if (img.file) {
              const imgEntry = Object.entries(imageModules).find(
                ([filepath]) => {
                  return filepath.includes(`/${slug}/gutter/${img.file}`);
                },
              );

              if (imgEntry) {
                return {
                  url: imgEntry[1],
                  alt: img.alt || "",
                  caption: img.caption || "",
                };
              } else {
                console.warn(
                  `Local file not found in gallery for "${slug}": ${img.file}`,
                );
              }
            }

            return null;
          })
          .filter(Boolean);

        if (images.length > 0) {
          return {
            ...item,
            images,
          };
        } else if (originalImageCount > 0) {
          // All images failed to resolve - log warning for debugging
          console.warn(
            `Gallery in "${slug}" has ${originalImageCount} image(s) defined but none could be resolved`,
          );
        }
      }

      return item;
    })
    .filter(
      (item) =>
        item.content || item.src || item.images || item.type === "emoji",
    ); // Filter out items that weren't found
}

/**
 * Get gutter content for a recipe by slug
 * @param {string} slug - The recipe slug
 * @returns {Array} Array of gutter items with content and position info
 */
export function getRecipeGutterContent(slug) {
  return getGutterContentFromModules(
    slug,
    recipeGutterManifestModules,
    recipeGutterMarkdownModules,
    recipeGutterImageModules,
  );
}

/**
 * Get gutter content for a blog post by slug
 * @param {string} slug - The post slug
 * @returns {Array} Array of gutter items with content and position info
 */
export function getGutterContent(slug) {
  return getGutterContentFromModules(
    slug,
    gutterManifestModules,
    gutterMarkdownModules,
    gutterImageModules,
  );
}

/**
 * Get gutter content for the home page
 * @param {string} slug - The page slug (e.g., 'home')
 * @returns {Array} Array of gutter items with content and position info
 */
export function getHomeGutterContent(slug) {
  return getGutterContentFromModules(
    slug,
    homeGutterManifestModules,
    homeGutterMarkdownModules,
    homeGutterImageModules,
  );
}

/**
 * Get gutter content for the contact page
 * @param {string} slug - The page slug (e.g., 'contact')
 * @returns {Array} Array of gutter items with content and position info
 */
export function getContactGutterContent(slug) {
  return getGutterContentFromModules(
    slug,
    contactGutterManifestModules,
    contactGutterMarkdownModules,
    contactGutterImageModules,
  );
}

/**
 * Get the home page content
 * @returns {Object|null} Home page object with content, metadata, and galleries
 */
export function getHomePage() {
  try {
    // Find the home.md file
    const entry = Object.entries(homeModules).find(([filepath]) => {
      return filepath.includes("home.md");
    });

    if (!entry) {
      return null;
    }

    const content = entry[1];

    const { data, content: markdown } = matter(content);
    const htmlContent = marked.parse(markdown);

    // Extract headers for table of contents
    const headers = extractHeaders(markdown);

    // Get gutter content for the home page
    const gutterContent = getHomeGutterContent("home");

    return {
      slug: "home",
      title: data.title || "Home",
      description: data.description || "",
      hero: data.hero || null,
      galleries: data.galleries || [],
      content: htmlContent,
      headers,
      gutterContent,
    };
  } catch (err) {
    console.error("Error in getHomePage:", err);
    return null;
  }
}

/**
 * Get the contact page content
 * @returns {Object|null} Contact page object with content and metadata
 */
export function getContactPage() {
  try {
    // Find the contact.md file
    const entry = Object.entries(contactModules).find(([filepath]) => {
      return filepath.includes("contact.md");
    });

    if (!entry) {
      return null;
    }

    const content = entry[1];

    const { data, content: markdown } = matter(content);
    const htmlContent = marked.parse(markdown);

    // Extract headers for table of contents
    const headers = extractHeaders(markdown);

    // Get gutter content for the contact page
    const gutterContent = getContactGutterContent("contact");

    return {
      slug: "contact",
      title: data.title || "Contact",
      description: data.description || "",
      content: htmlContent,
      headers,
      gutterContent,
    };
  } catch (err) {
    console.error("Error in getContactPage:", err);
    return null;
  }
}

/**
 * Get the about page content
 * @returns {Object|null} About page object with content and metadata
 */
export function getAboutPage() {
  try {
    // Find the about.md file
    const entry = Object.entries(aboutModules).find(([filepath]) => {
      return filepath.includes("about.md");
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
    const gutterContent = getAboutGutterContent("about");

    return {
      slug: "about",
      title: data.title || "About",
      date: data.date || new Date().toISOString(),
      description: data.description || "",
      content: htmlContent,
      headers,
      gutterContent,
    };
  } catch (err) {
    console.error("Error in getAboutPage:", err);
    return null;
  }
}

/**
 * Get gutter content for the about page
 * @param {string} slug - The page slug (e.g., 'about')
 * @returns {Array} Array of gutter items with content and position info
 */
export function getAboutGutterContent(slug) {
  return getGutterContentFromModules(
    slug,
    aboutGutterManifestModules,
    aboutGutterMarkdownModules,
    aboutGutterImageModules,
  );
}

/**
 * Get recipe metadata (step icons, etc.) for a recipe by slug
 * @param {string} slug - The recipe slug
 * @returns {Object|null} Recipe metadata with instruction icons
 */
export function getRecipeSidecar(slug) {
  // Find the recipe.json file in the gutter folder
  // Expected path: ../../../UserContent/Recipes/{slug}/gutter/recipe.json
  // parts[-3] extracts the recipe folder name from this path structure
  const entry = Object.entries(recipeMetadataModules).find(([filepath]) => {
    const parts = filepath.split("/");
    const folder = parts[parts.length - 3]; // Get the recipe folder name
    return folder === slug;
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
  let htmlContent = marked.parse(processedContent);

  // Process anchor tags in the HTML content
  htmlContent = processAnchorTags(htmlContent);

  // Extract headers for table of contents
  const headers = extractHeaders(markdown);

  // Get sidecar data if available
  const sidecar = getRecipeSidecar(slug);

  // Get gutter content for this recipe
  const gutterContent = getRecipeGutterContent(slug);

  return {
    slug,
    title: data.title || "Untitled Recipe",
    date: data.date || new Date().toISOString(),
    tags: data.tags || [],
    description: data.description || "",
    content: htmlContent,
    headers,
    gutterContent,
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
