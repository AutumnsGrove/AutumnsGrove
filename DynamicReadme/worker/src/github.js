/**
 * GitHub GraphQL API client for fetching user stats.
 */

const GITHUB_GRAPHQL = 'https://api.github.com/graphql';

const USER_STATS_QUERY = `
query($username: String!) {
  user(login: $username) {
    name
    repositories(first: 100, ownerAffiliations: OWNER, orderBy: {field: STARGAZERS, direction: DESC}, isFork: false) {
      totalCount
      nodes {
        stargazerCount
        primaryLanguage {
          name
          color
        }
        languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
          edges {
            size
            node {
              name
              color
            }
          }
        }
      }
    }
    contributionsCollection {
      totalCommitContributions
      restrictedContributionsCount
      totalPullRequestContributions
      totalIssueContributions
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays {
            contributionCount
            date
          }
        }
      }
    }
    pullRequests(first: 1) {
      totalCount
    }
    issues(first: 1) {
      totalCount
    }
    repositoriesContributedTo(first: 1, contributionTypes: [COMMIT, PULL_REQUEST, REPOSITORY, PULL_REQUEST_REVIEW]) {
      totalCount
    }
  }
}`;

/**
 * Fetch all user stats from GitHub GraphQL API.
 */
export async function fetchUserStats(username, token) {
  const response = await fetch(GITHUB_GRAPHQL, {
    method: 'POST',
    headers: {
      'Authorization': `bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'grove-readme-stats/1.0',
    },
    body: JSON.stringify({
      query: USER_STATS_QUERY,
      variables: { username },
    }),
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const json = await response.json();

  if (json.errors) {
    throw new Error(`GraphQL error: ${json.errors[0].message}`);
  }

  const user = json.data.user;
  if (!user) {
    throw new Error(`User not found: ${username}`);
  }

  return parseStats(user);
}

/**
 * Parse raw GraphQL response into clean stats objects.
 */
function parseStats(user) {
  const repos = user.repositories.nodes;

  // Total stars across all owned repos
  const totalStars = repos.reduce((sum, r) => sum + r.stargazerCount, 0);

  // Language stats aggregated by size
  const langMap = new Map();
  for (const repo of repos) {
    for (const edge of repo.languages.edges) {
      const name = edge.node.name;
      const existing = langMap.get(name) || { name, color: edge.node.color, size: 0 };
      existing.size += edge.size;
      langMap.set(name, existing);
    }
  }
  const languages = [...langMap.values()]
    .sort((a, b) => b.size - a.size)
    .slice(0, 8);
  const totalLangSize = languages.reduce((sum, l) => sum + l.size, 0);
  const languagesWithPercent = languages.map(l => ({
    ...l,
    percent: ((l.size / totalLangSize) * 100),
  }));

  // Contribution stats
  const contrib = user.contributionsCollection;
  const totalCommits = contrib.totalCommitContributions + contrib.restrictedContributionsCount;

  // Streak calculation
  const weeks = contrib.contributionCalendar.weeks;
  const streak = calculateStreak(weeks);

  return {
    stats: {
      name: user.name || user.login,
      totalStars,
      totalCommits,
      totalPRs: user.pullRequests.totalCount,
      totalIssues: user.issues.totalCount,
      contributedTo: user.repositoriesContributedTo.totalCount,
      totalRepos: user.repositories.totalCount,
      totalContributions: contrib.contributionCalendar.totalContributions,
    },
    languages: languagesWithPercent,
    streak,
  };
}

/**
 * Calculate current and longest contribution streaks.
 */
function calculateStreak(weeks) {
  const days = weeks
    .flatMap(w => w.contributionDays)
    .sort((a, b) => a.date.localeCompare(b.date));

  let longestStreak = 0;
  let tempStreak = 0;

  for (const day of days) {
    if (day.contributionCount > 0) {
      tempStreak++;
      longestStreak = Math.max(longestStreak, tempStreak);
    } else {
      tempStreak = 0;
    }
  }

  // Current streak: walk backwards from today
  let currentStreak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].contributionCount > 0) {
      currentStreak++;
    } else {
      // If today has 0 contributions, it might just be early — check yesterday
      if (i === days.length - 1) continue;
      break;
    }
  }

  return {
    current: currentStreak,
    longest: longestStreak,
    total: days.reduce((sum, d) => sum + d.contributionCount, 0),
  };
}

/**
 * Calculate a rank based on GitHub activity.
 */
export function calculateRank(stats) {
  const score =
    (stats.totalStars * 1) +
    (stats.totalCommits * 0.25) +
    (stats.totalPRs * 0.5) +
    (stats.totalIssues * 0.25) +
    (stats.contributedTo * 0.5);

  if (score >= 1000) return { level: 'S+', percentile: 1 };
  if (score >= 500) return { level: 'S', percentile: 5 };
  if (score >= 250) return { level: 'A++', percentile: 10 };
  if (score >= 100) return { level: 'A+', percentile: 25 };
  if (score >= 50) return { level: 'A', percentile: 50 };
  if (score >= 25) return { level: 'B+', percentile: 75 };
  return { level: 'B', percentile: 100 };
}
