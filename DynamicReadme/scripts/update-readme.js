/**
 * Update README.md with dynamic GitHub stats.
 *
 * Fetches repo data from the GitHub API and injects formatted
 * content between marker comments in the README.
 *
 * Markers:
 *   <!-- BEGIN:recent_activity --> / <!-- END:recent_activity -->
 *   <!-- BEGIN:repo_stats --> / <!-- END:repo_stats -->
 *
 * Usage:
 *   GITHUB_TOKEN=ghp_xxx GITHUB_USERNAME=AutumnsGrove node update-readme.js
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const README_PATH = resolve(__dirname, '../../README.md');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = process.env.GITHUB_USERNAME || 'AutumnsGrove';

if (!GITHUB_TOKEN) {
  console.error('GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

async function main() {
  console.log(`Fetching GitHub data for ${USERNAME}...`);

  const [recentActivity, repoStats] = await Promise.all([
    fetchRecentActivity(),
    fetchRepoStats(),
  ]);

  let readme = readFileSync(README_PATH, 'utf-8');

  readme = inject(readme, 'recent_activity', recentActivity);
  readme = inject(readme, 'repo_stats', repoStats);

  writeFileSync(README_PATH, readme, 'utf-8');
  console.log('README.md updated successfully.');
}

/**
 * Inject content between <!-- BEGIN:name --> and <!-- END:name --> markers.
 */
function inject(content, name, replacement) {
  const begin = `<!-- BEGIN:${name} -->`;
  const end = `<!-- END:${name} -->`;
  const regex = new RegExp(`${escapeRegex(begin)}[\\s\\S]*?${escapeRegex(end)}`, 'g');

  if (!regex.test(content)) {
    console.warn(`Marker "${name}" not found in README — skipping.`);
    return content;
  }

  return content.replace(regex, `${begin}\n${replacement}\n${end}`);
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Fetch recent push events and format as a markdown list.
 */
async function fetchRecentActivity() {
  const res = await ghFetch(`https://api.github.com/users/${USERNAME}/events/public?per_page=30`);
  const events = await res.json();

  const pushEvents = events
    .filter(e => e.type === 'PushEvent')
    .slice(0, 5);

  if (pushEvents.length === 0) {
    return '*No recent activity*';
  }

  const lines = pushEvents.map(event => {
    const repo = event.repo.name.replace(`${USERNAME}/`, '');
    const commits = event.payload.commits || [];
    const msg = commits.length > 0
      ? commits[0].message.split('\n')[0].slice(0, 60)
      : 'pushed changes';
    const date = new Date(event.created_at);
    const ago = timeAgo(date);
    return `- \`${repo}\` — ${msg} *(${ago})*`;
  });

  return lines.join('\n');
}

/**
 * Fetch starred/forked repo stats and format as a summary.
 */
async function fetchRepoStats() {
  const res = await ghFetch(
    `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated&type=owner`
  );
  const repos = await res.json();

  const totalStars = repos.reduce((sum, r) => sum + (r.stargazers_count || 0), 0);
  const totalForks = repos.reduce((sum, r) => sum + (r.forks_count || 0), 0);
  const publicRepos = repos.filter(r => !r.fork).length;

  // Top repos by stars
  const topRepos = repos
    .filter(r => !r.fork && r.stargazers_count > 0)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, 5);

  let md = `**${publicRepos}** public repos · **${totalStars}** stars · **${totalForks}** forks\n\n`;

  if (topRepos.length > 0) {
    md += '| Project | Stars | Language |\n|---------|-------|----------|\n';
    for (const repo of topRepos) {
      const lang = repo.language || '—';
      md += `| [${repo.name}](${repo.html_url}) | ${repo.stargazers_count} | ${lang} |\n`;
    }
  }

  return md.trim();
}

async function ghFetch(url) {
  const res = await fetch(url, {
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'grove-readme-updater/1.0',
    },
  });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText} for ${url}`);
  }

  return res;
}

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

main().catch(err => {
  console.error('Failed to update README:', err);
  process.exit(1);
});
