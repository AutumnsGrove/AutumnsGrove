#!/bin/bash
# ============================================================================
# AutumnsGrove Deployment Commands
# Run this script from your local machine (not in Claude Code environment)
# ============================================================================

set -e

echo "=========================================="
echo "AutumnsGrove Cloudflare Deployment Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================================================
# 1. DATABASE MIGRATIONS
# ============================================================================

echo -e "${YELLOW}Step 1: Apply Database Migrations${NC}"
echo "-------------------------------------------"

# Apply schema to posts database (includes recipes table)
echo "Applying schema to autumnsgrove-posts database..."
wrangler d1 execute autumnsgrove-posts --file=workers/sync-posts/schema.sql

# Apply schema to git-stats database (for timeline)
echo "Applying schema to autumnsgrove-git-stats database..."
wrangler d1 execute autumnsgrove-git-stats --file=src/lib/db/schema.sql

echo -e "${GREEN}Database migrations complete!${NC}"
echo ""

# ============================================================================
# 2. SECRETS CONFIGURATION
# ============================================================================

echo -e "${YELLOW}Step 2: Configure Secrets${NC}"
echo "-------------------------------------------"
echo "The following secrets need to be configured."
echo "You'll be prompted to enter each one."
echo ""

# Main site secrets
echo "Setting secrets for main site (autumnsgrove)..."
echo "Note: Press Ctrl+C to skip if already configured"
echo ""

read -p "Configure ANTHROPIC_API_KEY? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    wrangler secret put ANTHROPIC_API_KEY
fi

read -p "Configure SESSION_SECRET? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    wrangler secret put SESSION_SECRET
fi

read -p "Configure RESEND_API_KEY? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    wrangler secret put RESEND_API_KEY
fi

read -p "Configure ALLOWED_ADMIN_EMAILS? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    wrangler secret put ALLOWED_ADMIN_EMAILS
fi

# Sync worker secrets
echo ""
echo "Setting secrets for sync-posts worker..."
cd workers/sync-posts

read -p "Configure SYNC_API_KEY for sync worker? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    wrangler secret put SYNC_API_KEY
fi

cd ../..

# Daily summary worker secrets
echo ""
echo "Setting secrets for daily-summary worker..."
cd workers/daily-summary

read -p "Configure ANTHROPIC_API_KEY for daily-summary worker? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    wrangler secret put ANTHROPIC_API_KEY
fi

read -p "Configure GITHUB_TOKEN for daily-summary worker? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    wrangler secret put GITHUB_TOKEN
fi

cd ../..

echo -e "${GREEN}Secrets configuration complete!${NC}"
echo ""

# ============================================================================
# 3. DEPLOY WORKERS
# ============================================================================

echo -e "${YELLOW}Step 3: Deploy Workers${NC}"
echo "-------------------------------------------"

# Deploy sync-posts worker
echo "Deploying sync-posts worker..."
cd workers/sync-posts
wrangler deploy
cd ../..

# Deploy daily-summary worker
echo "Deploying daily-summary worker..."
cd workers/daily-summary
wrangler deploy
cd ../..

echo -e "${GREEN}Workers deployed!${NC}"
echo ""

# ============================================================================
# 4. BUILD AND DEPLOY MAIN SITE
# ============================================================================

echo -e "${YELLOW}Step 4: Build and Deploy Main Site${NC}"
echo "-------------------------------------------"

echo "Building SvelteKit application..."
npm run build

echo "Deploying to Cloudflare Pages..."
wrangler pages deploy .svelte-kit/cloudflare

echo -e "${GREEN}Main site deployed!${NC}"
echo ""

# ============================================================================
# SUMMARY
# ============================================================================

echo "=========================================="
echo -e "${GREEN}DEPLOYMENT COMPLETE!${NC}"
echo "=========================================="
echo ""
echo "What was deployed:"
echo "  - Database migrations applied"
echo "  - Secrets configured"
echo "  - sync-posts worker deployed"
echo "  - daily-summary worker deployed"
echo "  - Main site built and deployed"
echo ""
echo "URLs:"
echo "  - Main site: https://autumnsgrove.com"
echo "  - Sync worker: https://autumnsgrove-sync-posts.m7jv4v7npb.workers.dev"
echo "  - Daily summary: https://autumnsgrove-daily-summary.m7jv4v7npb.workers.dev"
echo ""
echo "New features deployed:"
echo "  - RSS feed at /api/feed (and /rss.xml redirect)"
echo "  - Recipes D1 integration (sync via GitHub Actions)"
echo ""
