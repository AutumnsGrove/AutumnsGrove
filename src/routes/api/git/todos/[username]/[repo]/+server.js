import { json, error } from "@sveltejs/kit";
import {
  validateUsername,
  getHeaders,
  GITHUB_API_BASE,
  getCacheKey,
} from "$lib/utils/github.js";

export const prerender = false;

const CACHE_TTL = 1800; // 30 minutes

// Common TODO patterns to search for
const TODO_PATTERNS = [
  /\/\/\s*TODO:?\s*(.+)/gi,
  /\/\/\s*FIXME:?\s*(.+)/gi,
  /#\s*TODO:?\s*(.+)/gi,
  /#\s*FIXME:?\s*(.+)/gi,
  /\/\*\s*TODO:?\s*(.+?)\*\//gi,
  /\/\*\s*FIXME:?\s*(.+?)\*\//gi,
];

// File extensions to search for TODOs
const SEARCHABLE_EXTENSIONS = [
  "js",
  "ts",
  "jsx",
  "tsx",
  "py",
  "rb",
  "go",
  "rs",
  "java",
  "cpp",
  "c",
  "h",
  "svelte",
  "vue",
  "php",
  "swift",
  "kt",
  "scala",
  "sh",
  "bash",
  "zsh",
];

/**
 * Get TODOs from a repository
 * Parses code comments and TODOS.md files
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ params, platform }) {
  try {
    const username = validateUsername(params.username);
    const repo = params.repo;
    const token = platform?.env?.GITHUB_TOKEN;
    const kv = platform?.env?.CACHE_KV;

    if (!token) {
      throw error(401, "GitHub token not configured");
    }

    // Check cache first
    const cacheKey = getCacheKey("todos", username, { repo });
    if (kv) {
      const cached = await kv.get(cacheKey, { type: "json" });
      if (cached) {
        return json({ ...cached, cached: true });
      }
    }

    const todos = {
      code_todos: [],
      markdown_todos: [],
      total: 0,
      repo: repo,
      owner: username,
    };

    // First, try to find and parse TODOS.md
    const todosMarkdown = await fetchTodosMarkdown(username, repo, token);
    if (todosMarkdown) {
      todos.markdown_todos = parseTodosMarkdown(todosMarkdown);
    }

    // Search for TODOs in code using GitHub Search API
    const codeTodos = await searchCodeTodos(username, repo, token);
    todos.code_todos = codeTodos;

    todos.total = todos.code_todos.length + todos.markdown_todos.length;

    // Cache the result
    if (kv) {
      await kv.put(cacheKey, JSON.stringify(todos), {
        expirationTtl: CACHE_TTL,
      });
    }

    return json({ ...todos, cached: false });
  } catch (e) {
    if (e.status) throw e;
    console.error("Error fetching TODOs:", e);
    throw error(500, e.message || "Failed to fetch TODOs");
  }
}

/**
 * Fetch TODOS.md file from repository
 */
async function fetchTodosMarkdown(owner, repo, token) {
  const paths = ["TODOS.md", "TODO.md", "todos.md", "todo.md"];

  for (const path of paths) {
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`,
        {
          headers: getHeaders(token),
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          // Decode base64 content
          return atob(data.content);
        }
      }
    } catch (e) {
      // Continue to next path
    }
  }

  return null;
}

/**
 * Parse TODOS.md content into structured todos
 */
function parseTodosMarkdown(content) {
  const todos = [];
  const lines = content.split("\n");
  let currentSection = "General";

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Check for section headers
    if (line.startsWith("## ")) {
      currentSection = line.substring(3).trim();
      continue;
    }

    // Check for todo items
    const todoMatch = line.match(/^-\s*\[([ xX])\]\s*(.+)$/);
    if (todoMatch) {
      const completed = todoMatch[1].toLowerCase() === "x";
      const text = todoMatch[2].trim();

      todos.push({
        text,
        completed,
        section: currentSection,
        line: i + 1,
        source: "markdown",
        priority: detectPriority(text),
      });
    }
  }

  return todos;
}

/**
 * Search for TODOs in code using GitHub Search API
 */
async function searchCodeTodos(owner, repo, token) {
  const todos = [];

  // Search for TODO and FIXME patterns
  const searchTerms = ["TODO", "FIXME"];

  for (const term of searchTerms) {
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/search/code?q=${term}+repo:${owner}/${repo}&per_page=50`,
        {
          headers: {
            ...getHeaders(token),
            Accept: "application/vnd.github.v3.text-match+json",
          },
        },
      );

      if (!response.ok) {
        // GitHub Search API has stricter rate limits
        if (response.status === 403) {
          console.warn("GitHub Search API rate limit hit");
          break;
        }
        continue;
      }

      const data = await response.json();

      for (const item of data.items || []) {
        // Check if file extension is searchable
        const ext = item.name.split(".").pop()?.toLowerCase();
        if (!SEARCHABLE_EXTENSIONS.includes(ext)) continue;

        // Extract text matches
        if (item.text_matches) {
          for (const match of item.text_matches) {
            const fragment = match.fragment || "";
            // Extract the actual TODO text
            for (const pattern of TODO_PATTERNS) {
              pattern.lastIndex = 0;
              let todoMatch;
              while ((todoMatch = pattern.exec(fragment)) !== null) {
                todos.push({
                  text: todoMatch[1].trim(),
                  file: item.path,
                  type: term,
                  source: "code",
                  priority: detectPriority(todoMatch[1]),
                });
              }
            }
          }
        }
      }
    } catch (e) {
      console.error(`Error searching for ${term}:`, e);
    }
  }

  // Deduplicate todos
  const seen = new Set();
  return todos.filter((todo) => {
    const key = `${todo.file}:${todo.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Detect priority based on keywords
 */
function detectPriority(text) {
  const upper = text.toUpperCase();
  if (
    upper.includes("URGENT") ||
    upper.includes("CRITICAL") ||
    upper.includes("ASAP")
  ) {
    return "high";
  }
  if (upper.includes("IMPORTANT") || upper.includes("PRIORITY")) {
    return "medium";
  }
  return "normal";
}
