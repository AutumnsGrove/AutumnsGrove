"""
GitDashboard Backend API
FastAPI server for fetching and serving GitHub statistics
"""
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import httpx
import os
import re
import logging
from datetime import datetime
from collections import defaultdict
from typing import Optional
import json

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="GitDashboard API")

# Rate limiting setup
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.util import get_remote_address
    from slowapi.errors import RateLimitExceeded

    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
    RATE_LIMITING_ENABLED = True
except ImportError:
    logger.warning("slowapi not installed - rate limiting disabled. Run: uv add slowapi")
    RATE_LIMITING_ENABLED = False
    limiter = None

# Enable CORS for local development
# Note: Removed allow_credentials=True since we don't use cookies
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8000", "http://127.0.0.1:8000"],
    allow_credentials=False,
    allow_methods=["GET"],
    allow_headers=["*"],
)

# Mount static files
static_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# GitHub API configuration
GITHUB_API_BASE = "https://api.github.com"
GITHUB_GRAPHQL_URL = "https://api.github.com/graphql"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")

# Constants for safety limits
MAX_REPOS_PAGES = 10  # Maximum pages to fetch (1000 repos max)
MAX_LIMIT = 50  # Maximum repos to analyze
MIN_LIMIT = 1
DEFAULT_TIMEOUT = 60.0  # Increased for GraphQL queries
MAX_DETAILED_COMMITS = 30  # Limit detail fetches for REST fallback
COMMITS_PER_REPO = 50  # Commits to fetch per repo via GraphQL

# GraphQL query for fetching repository commits with stats
GRAPHQL_REPOS_QUERY = """
query($username: String!, $first: Int!) {
  user(login: $username) {
    repositories(first: $first, orderBy: {field: UPDATED_AT, direction: DESC}) {
      nodes {
        name
        defaultBranchRef {
          target {
            ... on Commit {
              history(first: 50, author: {id: null}) {
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
"""

# Simpler GraphQL query that gets commit history filtered by author
GRAPHQL_USER_COMMITS_QUERY = """
query($username: String!, $first: Int!) {
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
              history(first: 100) {
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
"""

if not GITHUB_TOKEN:
    # Try loading from secrets.json at project root
    secrets_path = os.path.join(os.path.dirname(__file__), "..", "..", "secrets.json")
    if os.path.exists(secrets_path):
        try:
            with open(secrets_path) as f:
                secrets = json.load(f)
                GITHUB_TOKEN = secrets.get("github_token", "")
                if GITHUB_TOKEN:
                    logger.info("GitHub token loaded from secrets.json")
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse secrets.json: {e}")
        except Exception as e:
            logger.error(f"Failed to load secrets.json: {e}")


# GitHub username validation regex
# Valid: alphanumeric and hyphens, cannot start/end with hyphen, max 39 chars
USERNAME_PATTERN = re.compile(r'^[a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38}$')


def validate_username(username: str) -> str:
    """Validate GitHub username format"""
    if not username or not USERNAME_PATTERN.match(username):
        raise HTTPException(
            status_code=400,
            detail="Invalid username format. GitHub usernames must be alphanumeric with hyphens, 1-39 characters."
        )
    return username


def get_headers() -> dict:
    """Get headers for GitHub API requests"""
    headers = {
        "Accept": "application/vnd.github.v3+json",
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
    return headers


def get_graphql_headers() -> dict:
    """Get headers for GitHub GraphQL API requests"""
    if not GITHUB_TOKEN:
        raise HTTPException(
            status_code=401,
            detail="GitHub token required for GraphQL API"
        )
    return {
        "Authorization": f"bearer {GITHUB_TOKEN}",
        "Content-Type": "application/json",
    }


async def fetch_stats_graphql(client: httpx.AsyncClient, username: str, limit: int) -> dict:
    """
    Fetch user stats using GitHub GraphQL API.
    Much more efficient than REST - gets all data in 1-2 requests instead of N+1.
    """
    stats = {
        "total_commits": 0,
        "total_additions": 0,
        "total_deletions": 0,
        "commits_by_hour": defaultdict(int),
        "commits_by_day": defaultdict(int),
        "commits_by_repo": defaultdict(int),
        "recent_commits": [],
        "repos_analyzed": 0
    }

    # Execute GraphQL query
    response = await client.post(
        GITHUB_GRAPHQL_URL,
        headers=get_graphql_headers(),
        json={
            "query": GRAPHQL_USER_COMMITS_QUERY,
            "variables": {
                "username": username,
                "first": limit
            }
        }
    )

    if response.status_code != 200:
        logger.error(f"GraphQL API error: {response.status_code}")
        raise HTTPException(status_code=response.status_code, detail="GitHub GraphQL API error")

    data = response.json()

    if "errors" in data:
        error_msg = data["errors"][0].get("message", "Unknown GraphQL error")
        logger.error(f"GraphQL error: {error_msg}")
        raise HTTPException(status_code=400, detail=f"GraphQL error: {error_msg}")

    user_data = data.get("data", {}).get("user")
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")

    repos = user_data.get("repositories", {}).get("nodes", [])
    stats["repos_analyzed"] = len(repos)

    # Process each repository
    for repo in repos:
        if not repo:
            continue

        repo_name = repo.get("name", "unknown")
        branch_ref = repo.get("defaultBranchRef")

        if not branch_ref:
            continue

        target = branch_ref.get("target", {})
        history = target.get("history", {})
        commits = history.get("nodes", [])

        for commit in commits:
            if not commit:
                continue

            # Filter to only this user's commits
            author = commit.get("author", {})
            author_user = author.get("user", {}) if author else {}
            commit_author = author_user.get("login", "") if author_user else ""

            if commit_author.lower() != username.lower():
                continue

            stats["total_commits"] += 1
            stats["commits_by_repo"][repo_name] += 1

            # Get additions/deletions directly from GraphQL response
            additions = commit.get("additions", 0)
            deletions = commit.get("deletions", 0)
            stats["total_additions"] += additions
            stats["total_deletions"] += deletions

            # Parse commit date
            commit_date = commit.get("committedDate", "")
            if commit_date:
                try:
                    dt = datetime.fromisoformat(commit_date.replace("Z", "+00:00"))
                    stats["commits_by_hour"][dt.hour] += 1
                    stats["commits_by_day"][dt.strftime("%A")] += 1
                except ValueError as e:
                    logger.warning(f"Failed to parse commit date: {e}")

            # Add to recent commits (limit to 20)
            if len(stats["recent_commits"]) < 20:
                message = commit.get("message", "")
                stats["recent_commits"].append({
                    "sha": commit.get("oid", "")[:7],
                    "message": message.split("\n")[0][:60] if message else "",
                    "date": commit_date,
                    "repo": repo_name,
                    "additions": additions,
                    "deletions": deletions
                })

    return stats


@app.get("/")
async def root() -> FileResponse | dict:
    """Root endpoint - serves the frontend"""
    frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "index.html")
    if os.path.exists(frontend_path):
        return FileResponse(frontend_path)
    return {"message": "GitDashboard API - Frontend not found"}


@app.get("/api/user/{username}")
async def get_user_info(request: Request, username: str) -> dict:
    """Get GitHub user information"""
    username = validate_username(username)

    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
        response = await client.get(
            f"{GITHUB_API_BASE}/users/{username}",
            headers=get_headers()
        )

        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="User not found")
        elif response.status_code != 200:
            logger.error(f"GitHub API error for user {username}: {response.status_code}")
            raise HTTPException(status_code=response.status_code, detail="GitHub API error")

        return response.json()


@app.get("/api/repos/{username}")
async def get_user_repos(request: Request, username: str) -> list:
    """Get repositories for a user (with pagination limits)"""
    username = validate_username(username)

    all_repos = []
    page = 1
    per_page = 100

    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
        while page <= MAX_REPOS_PAGES:
            response = await client.get(
                f"{GITHUB_API_BASE}/users/{username}/repos",
                params={"page": page, "per_page": per_page, "sort": "updated"},
                headers=get_headers()
            )

            if response.status_code != 200:
                logger.error(f"Failed to fetch repos for {username}: {response.status_code}")
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch repos")

            repos = response.json()
            if not repos:
                break

            all_repos.extend(repos)
            page += 1

    logger.info(f"Fetched {len(all_repos)} repos for {username}")
    return all_repos


@app.get("/api/stats/{username}")
async def get_user_stats(request: Request, username: str, limit: Optional[int] = 10) -> dict:
    """
    Get comprehensive commit statistics for a user.
    Uses GraphQL API for efficiency (1 request vs N+1).
    Falls back to REST API if GraphQL fails.

    Returns: total commits, lines added/deleted, active hours, recent activity
    """
    username = validate_username(username)

    # Clamp limit to safe bounds
    limit = max(MIN_LIMIT, min(limit or 10, MAX_LIMIT))

    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
        # Try GraphQL first (much more efficient)
        if GITHUB_TOKEN:
            try:
                stats = await fetch_stats_graphql(client, username, limit)
                # Convert defaultdicts to regular dicts for JSON serialization
                stats["commits_by_hour"] = dict(stats["commits_by_hour"])
                stats["commits_by_day"] = dict(stats["commits_by_day"])
                stats["commits_by_repo"] = dict(sorted(
                    stats["commits_by_repo"].items(),
                    key=lambda x: x[1],
                    reverse=True
                )[:10])
                logger.info(f"GraphQL stats for {username}: {stats['total_commits']} commits")
                return stats
            except Exception as e:
                logger.warning(f"GraphQL failed, falling back to REST: {e}")

        # Fallback to REST API (slower, but works without token)
        logger.info(f"Using REST API fallback for {username}")

    stats = {
        "total_commits": 0,
        "total_additions": 0,
        "total_deletions": 0,
        "commits_by_hour": defaultdict(int),
        "commits_by_day": defaultdict(int),
        "commits_by_repo": defaultdict(int),
        "recent_commits": [],
        "repos_analyzed": 0
    }

    # Track how many detailed fetches we've done to avoid N+1 explosion
    detailed_fetches = 0

    async with httpx.AsyncClient(timeout=DEFAULT_TIMEOUT) as client:
        # Get user's repos
        repos_response = await client.get(
            f"{GITHUB_API_BASE}/users/{username}/repos",
            params={"per_page": limit, "sort": "updated"},
            headers=get_headers()
        )

        if repos_response.status_code != 200:
            logger.error(f"Failed to fetch repos for stats: {repos_response.status_code}")
            raise HTTPException(status_code=repos_response.status_code, detail="Failed to fetch repos")

        repos = repos_response.json()
        stats["repos_analyzed"] = len(repos)

        # For each repo, get commits
        for repo in repos:
            repo_name = repo["full_name"]

            try:
                # Get commits for this repo
                commits_response = await client.get(
                    f"{GITHUB_API_BASE}/repos/{repo_name}/commits",
                    params={"author": username, "per_page": 100},
                    headers=get_headers()
                )

                if commits_response.status_code != 200:
                    logger.warning(f"Failed to fetch commits for {repo_name}: {commits_response.status_code}")
                    continue

                commits = commits_response.json()

                for commit in commits:
                    stats["total_commits"] += 1
                    stats["commits_by_repo"][repo["name"]] += 1

                    # Parse commit date
                    commit_date = commit["commit"]["author"]["date"]
                    try:
                        dt = datetime.strptime(commit_date, "%Y-%m-%dT%H:%M:%SZ")
                        # Track by hour (0-23)
                        stats["commits_by_hour"][dt.hour] += 1
                        # Track by day of week (0=Monday, 6=Sunday)
                        stats["commits_by_day"][dt.strftime("%A")] += 1
                    except ValueError as e:
                        logger.warning(f"Failed to parse commit date: {e}")

                    # Only fetch detailed stats for limited number of commits
                    # This prevents N+1 explosion (was fetching for ALL commits)
                    if detailed_fetches < MAX_DETAILED_COMMITS:
                        commit_detail_response = await client.get(
                            f"{GITHUB_API_BASE}/repos/{repo_name}/commits/{commit['sha']}",
                            headers=get_headers()
                        )

                        if commit_detail_response.status_code == 200:
                            commit_detail = commit_detail_response.json()
                            detailed_fetches += 1

                            if commit_detail.get("stats"):
                                stats["total_additions"] += commit_detail["stats"].get("additions", 0)
                                stats["total_deletions"] += commit_detail["stats"].get("deletions", 0)

                            # Add to recent commits (limit to 20)
                            if len(stats["recent_commits"]) < 20:
                                stats["recent_commits"].append({
                                    "sha": commit["sha"][:7],
                                    "message": commit["commit"]["message"].split("\n")[0][:60],
                                    "date": commit_date,
                                    "repo": repo["name"],
                                    "additions": commit_detail.get("stats", {}).get("additions", 0),
                                    "deletions": commit_detail.get("stats", {}).get("deletions", 0)
                                })

            except httpx.TimeoutException:
                logger.error(f"Timeout processing repo {repo_name}")
                continue
            except httpx.HTTPError as e:
                logger.error(f"HTTP error processing repo {repo_name}: {e}")
                continue
            except Exception as e:
                logger.error(f"Unexpected error processing repo {repo_name}: {e}")
                continue

    # Convert defaultdicts to regular dicts for JSON serialization
    stats["commits_by_hour"] = dict(stats["commits_by_hour"])
    stats["commits_by_day"] = dict(stats["commits_by_day"])
    stats["commits_by_repo"] = dict(sorted(
        stats["commits_by_repo"].items(),
        key=lambda x: x[1],
        reverse=True
    )[:10])  # Top 10 repos

    logger.info(f"Stats for {username}: {stats['total_commits']} commits, {detailed_fetches} detailed fetches")
    return stats


@app.get("/api/health")
async def health_check() -> dict:
    """Health check endpoint"""
    return {
        "status": "healthy",
        "github_token_configured": bool(GITHUB_TOKEN),
        "rate_limiting_enabled": RATE_LIMITING_ENABLED
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
