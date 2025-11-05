# GitHub Actions Deployment Setup

This repository is configured to automatically deploy to Cloudflare Pages using GitHub Actions.

## Required Secrets

You need to add the following secrets to your GitHub repository:

### 1. CLOUDFLARE_API_TOKEN

Create a Cloudflare API token with the following permissions:
- Go to https://dash.cloudflare.com/profile/api-tokens
- Click "Create Token"
- Use the "Edit Cloudflare Workers" template or create a custom token with:
  - Account > Cloudflare Pages > Edit permissions

**To add to GitHub:**
1. Go to your repository on GitHub
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `CLOUDFLARE_API_TOKEN`
5. Value: Your Cloudflare API token

### 2. CLOUDFLARE_ACCOUNT_ID

Find your Cloudflare Account ID:
- Go to https://dash.cloudflare.com/
- Select your account
- The Account ID is shown in the right sidebar under "Account ID"

**To add to GitHub:**
1. Go to your repository on GitHub
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `CLOUDFLARE_ACCOUNT_ID`
5. Value: Your Cloudflare Account ID

## How to Deploy

### Automatic Deployment
The workflow automatically deploys when you push to the `main` branch.

### Manual Deployment
1. Go to your repository on GitHub
2. Click the "Actions" tab
3. Select "Deploy to Cloudflare Pages" workflow
4. Click "Run workflow"
5. Select the branch (usually `main`)
6. Click "Run workflow"

## Workflow Details

The deployment workflow:
1. Checks out the code
2. Sets up Node.js 20
3. Installs dependencies with caching
4. Builds the SvelteKit application
5. Deploys the `.svelte-kit/cloudflare` directory to Cloudflare Pages

## Troubleshooting

If deployment fails:
- Check the Actions tab for error logs
- Verify your secrets are set correctly
- Ensure the build completes successfully locally with `npm run build`
- Check that the output directory `.svelte-kit/cloudflare` exists after build
