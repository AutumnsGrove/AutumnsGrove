import { json, error } from "@sveltejs/kit";
import {
  validateUsername,
  getHeaders,
  GITHUB_API_BASE,
  getCacheKey,
} from "$lib/utils/github.js";

export const prerender = false;

const AI_CACHE_TTL = 21600; // 6 hours
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";

/**
 * Analyze a repository using Claude Haiku 4.5
 * Returns project health score, progress assessment, and insights
 * @type {import('./$types').RequestHandler}
 */
export async function GET({ params, platform }) {
  try {
    const username = validateUsername(params.username);
    const repo = params.repo;
    const token = platform?.env?.GITHUB_TOKEN;
    const anthropicKey = platform?.env?.ANTHROPIC_API_KEY;
    const kv = platform?.env?.CACHE_KV;

    if (!token) {
      throw error(401, "GitHub token not configured");
    }

    if (!anthropicKey) {
      throw error(401, "Anthropic API key not configured");
    }

    // Check cache first
    const cacheKey = getCacheKey("ai-analysis", username, { repo });
    if (kv) {
      const cached = await kv.get(cacheKey, { type: "json" });
      if (cached) {
        return json({ ...cached, cached: true });
      }
    }

    // Gather repository data
    const repoData = await gatherRepoData(username, repo, token);

    // Analyze with Claude
    const analysis = await analyzeWithClaude(repoData, anthropicKey);

    const result = {
      repo,
      owner: username,
      analysis,
      analyzedAt: new Date().toISOString(),
    };

    // Cache the result
    if (kv) {
      await kv.put(cacheKey, JSON.stringify(result), {
        expirationTtl: AI_CACHE_TTL,
      });
    }

    return json({ ...result, cached: false });
  } catch (e) {
    if (e.status) throw e;
    console.error("Error analyzing repository:", e);
    throw error(500, e.message || "Failed to analyze repository");
  }
}

/**
 * Gather repository data for analysis
 */
async function gatherRepoData(owner, repo, token) {
  const headers = getHeaders(token);

  // Fetch multiple data points in parallel
  const [repoInfo, commits, languages, contributors] = await Promise.all([
    fetchRepoInfo(owner, repo, headers),
    fetchRecentCommits(owner, repo, headers),
    fetchLanguages(owner, repo, headers),
    fetchContributors(owner, repo, headers),
  ]);

  // Try to fetch README
  const readme = await fetchReadme(owner, repo, headers);

  // Try to fetch TODOS.md
  const todos = await fetchTodos(owner, repo, headers);

  return {
    repo: {
      name: repoInfo.name,
      description: repoInfo.description,
      stars: repoInfo.stargazers_count,
      forks: repoInfo.forks_count,
      openIssues: repoInfo.open_issues_count,
      createdAt: repoInfo.created_at,
      updatedAt: repoInfo.updated_at,
      pushedAt: repoInfo.pushed_at,
      defaultBranch: repoInfo.default_branch,
      topics: repoInfo.topics || [],
      license: repoInfo.license?.name || "None",
    },
    commits: commits.slice(0, 20).map((c) => ({
      message: c.commit.message.split("\n")[0],
      date: c.commit.author.date,
      author: c.commit.author.name,
    })),
    languages,
    contributors: contributors.slice(0, 10).map((c) => ({
      login: c.login,
      contributions: c.contributions,
    })),
    readme: readme ? readme.substring(0, 2000) : null,
    todos,
  };
}

async function fetchRepoInfo(owner, repo, headers) {
  const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, {
    headers,
  });
  if (!response.ok)
    throw new Error(`Failed to fetch repo info: ${response.status}`);
  return response.json();
}

async function fetchRecentCommits(owner, repo, headers) {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=30`,
    { headers },
  );
  if (!response.ok) return [];
  return response.json();
}

async function fetchLanguages(owner, repo, headers) {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/languages`,
    { headers },
  );
  if (!response.ok) return {};
  return response.json();
}

async function fetchContributors(owner, repo, headers) {
  const response = await fetch(
    `${GITHUB_API_BASE}/repos/${owner}/${repo}/contributors?per_page=10`,
    { headers },
  );
  if (!response.ok) return [];
  return response.json();
}

async function fetchReadme(owner, repo, headers) {
  try {
    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${owner}/${repo}/readme`,
      { headers: { ...headers, Accept: "application/vnd.github.v3.raw" } },
    );
    if (!response.ok) return null;
    return response.text();
  } catch {
    return null;
  }
}

async function fetchTodos(owner, repo, headers) {
  const paths = ["TODOS.md", "TODO.md"];
  for (const path of paths) {
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`,
        { headers },
      );
      if (response.ok) {
        const data = await response.json();
        if (data.content) {
          return atob(data.content).substring(0, 2000);
        }
      }
    } catch {
      continue;
    }
  }
  return null;
}

/**
 * Analyze repository data with Claude Haiku 4.5
 */
async function analyzeWithClaude(repoData, apiKey) {
  const prompt = `Analyze this GitHub repository and provide a brief assessment.

Repository Data:
${JSON.stringify(repoData, null, 2)}

Please provide:
1. **Health Score** (0-100): Based on activity, documentation, maintenance
2. **Progress Assessment**: Brief assessment of project completion/maturity
3. **Key Insights** (3-5 bullet points): Notable observations about the project
4. **Recommendations** (2-3 bullet points): Actionable suggestions for improvement

Keep the response concise and actionable. Focus on the most important insights.`;

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251022",
      max_tokens: 1000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Claude API error:", errorText);
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.content[0]?.text || "Analysis failed";

  // Parse the response to extract structured data
  return {
    raw: content,
    healthScore: extractHealthScore(content),
    tokens: {
      input: data.usage?.input_tokens || 0,
      output: data.usage?.output_tokens || 0,
    },
    model: data.model,
  };
}

/**
 * Extract health score from Claude's response
 */
function extractHealthScore(content) {
  const match = content.match(/health\s*score[:\s]*(\d+)/i);
  if (match) {
    return Math.min(100, Math.max(0, parseInt(match[1], 10)));
  }
  return null;
}
