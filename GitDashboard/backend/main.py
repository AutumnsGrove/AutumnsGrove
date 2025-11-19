"""
GitDashboard Backend API
FastAPI server for fetching and serving GitHub statistics
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import httpx
import os
from datetime import datetime
from collections import defaultdict
from typing import Optional
import json

app = FastAPI(title="GitDashboard API")

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
static_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")

# GitHub API configuration
GITHUB_API_BASE = "https://api.github.com"
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")

if not GITHUB_TOKEN:
    # Try loading from secrets.json at project root
    secrets_path = os.path.join(os.path.dirname(__file__), "..", "..", "secrets.json")
    if os.path.exists(secrets_path):
        with open(secrets_path) as f:
            secrets = json.load(f)
            GITHUB_TOKEN = secrets.get("github_token", "")


def get_headers():
    """Get headers for GitHub API requests"""
    headers = {
        "Accept": "application/vnd.github.v3+json",
    }
    if GITHUB_TOKEN:
        headers["Authorization"] = f"token {GITHUB_TOKEN}"
    return headers


@app.get("/")
async def root():
    """Root endpoint - serves the frontend"""
    frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend", "index.html")
    if os.path.exists(frontend_path):
        return FileResponse(frontend_path)
    return {"message": "GitDashboard API - Frontend not found"}


@app.get("/api/user/{username}")
async def get_user_info(username: str):
    """Get GitHub user information"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{GITHUB_API_BASE}/users/{username}",
            headers=get_headers()
        )

        if response.status_code == 404:
            raise HTTPException(status_code=404, detail="User not found")
        elif response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="GitHub API error")

        return response.json()


@app.get("/api/repos/{username}")
async def get_user_repos(username: str):
    """Get all repositories for a user"""
    all_repos = []
    page = 1
    per_page = 100

    async with httpx.AsyncClient() as client:
        while True:
            response = await client.get(
                f"{GITHUB_API_BASE}/users/{username}/repos",
                params={"page": page, "per_page": per_page, "sort": "updated"},
                headers=get_headers()
            )

            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to fetch repos")

            repos = response.json()
            if not repos:
                break

            all_repos.extend(repos)
            page += 1

    return all_repos


@app.get("/api/stats/{username}")
async def get_user_stats(username: str, limit: Optional[int] = 10):
    """
    Get comprehensive commit statistics for a user
    Returns: total commits, lines added/deleted, active hours, recent activity
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

    async with httpx.AsyncClient(timeout=30.0) as client:
        # Get user's repos
        repos_response = await client.get(
            f"{GITHUB_API_BASE}/users/{username}/repos",
            params={"per_page": limit, "sort": "updated"},
            headers=get_headers()
        )

        if repos_response.status_code != 200:
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
                    continue

                commits = commits_response.json()

                for commit in commits:
                    stats["total_commits"] += 1
                    stats["commits_by_repo"][repo["name"]] += 1

                    # Parse commit date
                    commit_date = commit["commit"]["author"]["date"]
                    dt = datetime.strptime(commit_date, "%Y-%m-%dT%H:%M:%SZ")

                    # Track by hour (0-23)
                    stats["commits_by_hour"][dt.hour] += 1

                    # Track by day of week (0=Monday, 6=Sunday)
                    stats["commits_by_day"][dt.strftime("%A")] += 1

                    # Get detailed stats for each commit
                    commit_detail_response = await client.get(
                        f"{GITHUB_API_BASE}/repos/{repo_name}/commits/{commit['sha']}",
                        headers=get_headers()
                    )

                    if commit_detail_response.status_code == 200:
                        commit_detail = commit_detail_response.json()

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

            except Exception as e:
                print(f"Error processing repo {repo_name}: {e}")
                continue

    # Convert defaultdicts to regular dicts for JSON serialization
    stats["commits_by_hour"] = dict(stats["commits_by_hour"])
    stats["commits_by_day"] = dict(stats["commits_by_day"])
    stats["commits_by_repo"] = dict(sorted(
        stats["commits_by_repo"].items(),
        key=lambda x: x[1],
        reverse=True
    )[:10])  # Top 10 repos

    return stats


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "github_token_configured": bool(GITHUB_TOKEN)
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
