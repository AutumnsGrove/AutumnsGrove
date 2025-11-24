#!/bin/bash

# Deploy script for the CloudFlare Worker
set -e

echo "🚀 Deploying AutumnsGrove Posts Sync Worker..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

# Generate API key if not already set
if [ -z "$SYNC_API_KEY" ]; then
    echo "🔑 Generating API key..."
    SYNC_API_KEY=$(node generate-api-key.js | grep "Generated API Key:" | cut -d' ' -f4)
    echo "Generated API Key: $SYNC_API_KEY"
    echo "⚠️  Save this key securely - you'll need it for GitHub Actions!"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Deploy the worker
echo "🌐 Deploying worker..."
wrangler deploy --env production

# Set the API key as a secret
echo "🔐 Setting API key secret..."
echo "$SYNC_API_KEY" | wrangler secret put SYNC_API_KEY --env production

echo "✅ Worker deployed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Set up GitHub repository secrets:"
echo "   - CLOUDFLARE_WORKER_URL: $(wrangler info --env production | grep 'Worker URL:' | cut -d' ' -f3)"
echo "   - CLOUDFLARE_SYNC_API_KEY: $SYNC_API_KEY"
echo "2. Test the sync by pushing a change to the UserContent/Posts directory"
echo "3. Monitor the GitHub Actions workflow for any issues"