/**
 * GitHub API utilities for GitDashboard
 * Ported from FastAPI backend to SvelteKit
 */

// Constants
export const GITHUB_API_BASE = "https://api.github.com";
export const GITHUB_GRAPHQL_URL = "https://api.github.com/graphql";
export const MAX_REPOS_PAGES = 10;
export const MAX_LIMIT = 50;
export const MIN_LIMIT = 1;
export const DEFAULT_TIMEOUT = 60000; // 60 seconds in ms

// Username validation regex
// Valid: alphanumeric and hyphens, cannot start/end with hyphen, max 39 chars
const USERNAME_PATTERN = /^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$/;

/**
 * Validate GitHub username format
 * @param {string} username
 * @returns {string} validated username
 * @throws {Error} if invalid
 */
export function validateUsername(username) {
  if (!username || !USERNAME_PATTERN.test(username)) {
    throw new Error(
      "Invalid username format. GitHub usernames must be alphanumeric with hyphens, 1-39 characters.",
    );
  }
  return username;
}

/**
 * Get headers for GitHub REST API requests
 * @param {string} token
 * @returns {Record<string, string>}
 */
export function getHeaders(token) {
  const headers = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "AutumnsGrove-GitDashboard",
  };
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }
  return headers;
}

/**
 * Get headers for GitHub GraphQL API requests
 * @param {string} token
 * @returns {Record<string, string>}
 */
export function getGraphQLHeaders(token) {
  if (!token) {
    throw new Error("GitHub token required for GraphQL API");
  }
  return {
    Authorization: `bearer ${token}`,
    "Content-Type": "application/json",
    "User-Agent": "AutumnsGrove-GitDashboard",
  };
}

// GraphQL query for fetching user commits with stats (with optional date filter)
export const GRAPHQL_USER_COMMITS_QUERY = `
query($username: String!, $first: Int!, $since: GitTimestamp) {
  user(login: $username) {
    repositories(first: $first, orderBy: {field: UPDATED_AT, direction: DESC}) {
      nodes {
        name
        owner {
          login
        }
        defaultBranchRef {
          target {
            ... on Commit {
              history(first: 100, since: $since) {
                nodes {
                  oid
                  message
                  committedDate
                  additions
                  deletions
                  author {
                    user {
                      login
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
`;

/**
 * Fetch user stats using GitHub GraphQL API
 * @param {string} username
 * @param {number} limit
 * @param {string} token
 * @param {string|null} since - ISO date string for filtering commits (optional)
 * @returns {Promise<object>}
 */
export async function fetchStatsGraphQL(username, limit, token, since = null) {
  const stats = {
    total_commits: 0,
    total_additions: 0,
    total_deletions: 0,
    commits_by_hour: {},
    commits_by_day: {},
    commits_by_repo: {},
    recent_commits: [],
    repos_analyzed: 0,
    time_range: since ? 'filtered' : 'all_time',
    filtered_since: since || null, // Include the actual filter date for debugging
  };

  // Initialize hour buckets
  for (let i = 0; i < 24; i++) {
    stats.commits_by_hour[i] = 0;
  }

  // Initialize day buckets
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  days.forEach((day) => {
    stats.commits_by_day[day] = 0;
  });

  // Build variables, only include since if provided
  const variables = {
    username,
    first: limit,
  };
  if (since) {
    variables.since = since;
  }

  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: "POST",
    headers: getGraphQLHeaders(token),
    body: JSON.stringify({
      query: GRAPHQL_USER_COMMITS_QUERY,
      variables,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("GitHub GraphQL error response:", errorText);
    throw new Error(
      `GitHub GraphQL API error: ${response.status} - ${errorText.substring(0, 200)}`,
    );
  }

  const data = await response.json();

  if (data.errors) {
    const errorMsg = data.errors[0]?.message || "Unknown GraphQL error";
    console.error("GraphQL errors:", data.errors);
    throw new Error(`GraphQL error: ${errorMsg}`);
  }

  const userData = data?.data?.user;
  if (!userData) {
    throw new Error("User not found");
  }

  const repos = userData.repositories?.nodes || [];
  stats.repos_analyzed = repos.length;

  // Process each repository
  for (const repo of repos) {
    if (!repo) continue;

    const repoName = repo.name || "unknown";
    const branchRef = repo.defaultBranchRef;

    if (!branchRef) continue;

    const target = branchRef.target || {};
    const history = target.history || {};
    const commits = history.nodes || [];

    for (const commit of commits) {
      if (!commit) continue;

      // Filter to only this user's commits
      // Check both author.user.login (GitHub linked) and author.name/email (git config)
      const author = commit.author || {};
      const authorUser = author.user || {};
      const commitAuthorLogin = authorUser.login || "";

      // Match by GitHub login if available, otherwise skip commits without linked accounts
      // This allows commits from users who have their git email linked to their GitHub account
      if (commitAuthorLogin && commitAuthorLogin.toLowerCase() !== username.toLowerCase()) {
        continue;
      }
      // If no login is available (author.user is null), include the commit anyway
      // These are commits made with a git email that isn't linked to GitHub,
      // but they're in the user's repo so they're likely theirs

      stats.total_commits++;

      if (!stats.commits_by_repo[repoName]) {
        stats.commits_by_repo[repoName] = 0;
      }
      stats.commits_by_repo[repoName]++;

      // Get additions/deletions
      const additions = commit.additions || 0;
      const deletions = commit.deletions || 0;
      stats.total_additions += additions;
      stats.total_deletions += deletions;

      // Parse commit date
      const commitDate = commit.committedDate;
      if (commitDate) {
        try {
          const dt = new Date(commitDate);
          stats.commits_by_hour[dt.getUTCHours()]++;
          stats.commits_by_day[days[dt.getUTCDay()]]++;
        } catch (e) {
          console.warn("Failed to parse commit date:", e);
        }
      }

      // Add to recent commits (limit to 20)
      if (stats.recent_commits.length < 20) {
        const message = commit.message || "";
        // Get first 3 lines of commit message
        const messageLines = message.split("\n").slice(0, 3).join("\n").substring(0, 300);
        stats.recent_commits.push({
          sha: (commit.oid || "").substring(0, 7),
          message: messageLines,
          date: commitDate,
          repo: repoName,
          additions,
          deletions,
        });
      }
    }
  }

  // Sort commits_by_repo by count (top 10)
  const sortedRepos = Object.entries(stats.commits_by_repo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  stats.commits_by_repo = Object.fromEntries(sortedRepos);

  return stats;
}

/**
 * Generate cache key for KV storage
 * @param {string} type
 * @param {string} username
 * @param {object} params
 * @returns {string}
 */
export function getCacheKey(type, username, params = {}) {
  const paramStr = Object.entries(params)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return `github:${type}:${username}${paramStr ? ":" + paramStr : ""}`;
}

/**
 * GraphQL query for fetching commits with pagination support
 *
 * @description Fetches commit history from user's repositories for client-side pagination.
 * Note: This query fetches up to 100 commits per repo from the top N repos,
 * then sorts and paginates client-side. Consider cursor-based pagination for
 * very active users.
 *
 * @variables
 * - username: String! - GitHub username
 * - first: Int! - Number of repositories to fetch (repo limit)
 * - since: GitTimestamp - Optional ISO date string to filter commits after this date
 *
 * @returns {Object} User data with repositories containing commit history
 * @returns {Array} user.repositories.nodes - Array of repository objects
 * @returns {Object} user.repositories.nodes[].defaultBranchRef.target.history - Commit history
 * @returns {Array} user.repositories.nodes[].defaultBranchRef.target.history.nodes - Commits array
 *
 * @example
 * // Variables example:
 * {
 *   username: "octocat",
 *   first: 15,
 *   since: "2024-01-01T00:00:00Z"
 * }
 */
export const GRAPHQL_COMMITS_PAGINATED_QUERY = `
query($username: String!, $first: Int!, $since: GitTimestamp) {
  user(login: $username) {
    repositories(first: $first, orderBy: {field: UPDATED_AT, direction: DESC}) {
      nodes {
        name
        owner {
          login
        }
        defaultBranchRef {
          target {
            ... on Commit {
              history(first: 100, since: $since) {
                nodes {
                  oid
                  message
                  committedDate
                  additions
                  deletions
                  author {
                    user {
                      login
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
`;

/**
 * Fetch paginated commits using GitHub GraphQL API
 * @param {string} username
 * @param {number} repoLimit - Number of repos to analyze
 * @param {string} token
 * @param {number} page - Page number (1-indexed)
 * @param {number} perPage - Items per page
 * @param {string|null} since - ISO date string for filtering commits (optional)
 * @returns {Promise<object>}
 */
export async function fetchCommitsPaginated(username, repoLimit, token, page = 1, perPage = 20, since = null) {
  // Build variables, only include since if provided
  const variables = {
    username,
    first: repoLimit,
  };
  if (since) {
    variables.since = since;
  }

  const response = await fetch(GITHUB_GRAPHQL_URL, {
    method: "POST",
    headers: getGraphQLHeaders(token),
    body: JSON.stringify({
      query: GRAPHQL_COMMITS_PAGINATED_QUERY,
      variables,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("GitHub GraphQL error response:", errorText);
    throw new Error(
      `GitHub GraphQL API error: ${response.status} - ${errorText.substring(0, 200)}`,
    );
  }

  const data = await response.json();

  if (data.errors) {
    const errorMsg = data.errors[0]?.message || "Unknown GraphQL error";
    console.error("GraphQL errors:", data.errors);
    throw new Error(`GraphQL error: ${errorMsg}`);
  }

  const userData = data?.data?.user;
  if (!userData) {
    throw new Error("User not found");
  }

  const repos = userData.repositories?.nodes || [];

  // Collect all commits from all repos
  const allCommits = [];

  for (const repo of repos) {
    if (!repo) continue;

    const repoName = repo.name || "unknown";
    const branchRef = repo.defaultBranchRef;

    if (!branchRef) continue;

    const target = branchRef.target || {};
    const history = target.history || {};
    const commits = history.nodes || [];

    for (const commit of commits) {
      if (!commit) continue;

      // Filter to only this user's commits
      // Check both author.user.login (GitHub linked) and author.name/email (git config)
      const author = commit.author || {};
      const authorUser = author.user || {};
      const commitAuthorLogin = authorUser.login || "";

      // Match by GitHub login if available, otherwise skip commits without linked accounts
      // This allows commits from users who have their git email linked to their GitHub account
      if (commitAuthorLogin && commitAuthorLogin.toLowerCase() !== username.toLowerCase()) {
        continue;
      }
      // If no login is available (author.user is null), include the commit anyway
      // These are commits made with a git email that isn't linked to GitHub,
      // but they're in the user's repo so they're likely theirs

      const commitDate = commit.committedDate;
      const message = commit.message || "";
      // Get first 3 lines of commit message
      const messageLines = message.split("\n").slice(0, 3).join("\n").substring(0, 300);

      allCommits.push({
        sha: (commit.oid || "").substring(0, 7),
        message: messageLines,
        date: commitDate,
        repo: repoName,
        additions: commit.additions || 0,
        deletions: commit.deletions || 0,
      });
    }
  }

  // Sort all commits by date (newest first)
  // Use string comparison since ISO dates sort lexicographically correctly
  // This avoids creating Date objects for every comparison
  // Note: Assumes all dates are ISO 8601 format (e.g., "2024-01-15T10:30:00Z")
  allCommits.sort((a, b) => {
    if (b.date > a.date) return 1;
    if (b.date < a.date) return -1;
    return 0;
  });

  // Calculate pagination
  const totalCommits = allCommits.length;
  const totalPages = Math.ceil(totalCommits / perPage);
  const startIndex = (page - 1) * perPage;
  const endIndex = startIndex + perPage;
  const commits = allCommits.slice(startIndex, endIndex);

  return {
    commits,
    page,
    per_page: perPage,
    total_commits: totalCommits,
    total_pages: totalPages,
    has_more: page < totalPages,
  };
}
