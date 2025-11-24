# CloudFlare D1 Database Sync Setup Guide

This guide walks you through setting up the complete CloudFlare Worker solution for syncing your blog posts to a D1 database.

## 🎯 What This Solution Does

- **Automatically syncs** all markdown posts to CloudFlare D1 database
- **Detects changes** using content hashing to avoid unnecessary updates
- **Stores complete data** including metadata and raw markdown content
- **Triggers on GitHub pushes** to the main branch when posts are modified
- **Provides API endpoints** for accessing your posts programmatically

## 📋 Prerequisites

- CloudFlare account with D1 database access
- GitHub repository for your blog
- Node.js 18+ installed locally
- Wrangler CLI installed (`npm install -g wrangler`)

## 🚀 Quick Start

### 1. Deploy the CloudFlare Worker

```bash
cd workers/sync-posts
npm install
chmod +x deploy.sh
./deploy.sh
```

**Note**: Save the generated API key - you'll need it for GitHub Actions.

### 2. Set Up GitHub Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret:

- `CLOUDFLARE_WORKER_URL`: Your worker's URL (shown after deployment)
- `CLOUDFLARE_SYNC_API_KEY`: The API key generated during deployment

### 3. Test the Setup

The sync will automatically trigger when you push changes to the `posts/` directory. You can also manually trigger it from the GitHub Actions tab.

## 🔧 Manual Setup (Alternative)

If you prefer to set up everything manually:

### Step 1: Create D1 Database
```bash
wrangler d1 create autumnsgrove-posts
```

### Step 2: Deploy Worker
```bash
wrangler deploy --env production
wrangler secret put SYNC_API_KEY
# Enter your secure API key when prompted
```

### Step 3: Configure GitHub Actions
The workflow file is already created at `.github/workflows/sync-posts.yml`. Just add the secrets as described above.

## 📊 Database Schema

The D1 database uses this schema:

```sql
CREATE TABLE posts (
  slug TEXT PRIMARY KEY,           -- Post identifier (filename without .md)
  title TEXT NOT NULL,             -- Post title from frontmatter
  date TEXT NOT NULL,              -- Publication date
  tags TEXT,                       -- JSON array of tags
  description TEXT,                -- Post description
  markdown_content TEXT NOT NULL,  -- Raw markdown content
  html_content TEXT,               -- Generated HTML content
  file_hash TEXT NOT NULL,         -- SHA-256 hash for change detection
  last_synced TEXT NOT NULL,       -- Last sync timestamp
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## 🔌 API Endpoints

Once deployed, your worker provides these endpoints:

### Sync Posts
```bash
POST https://your-worker.workers.dev/sync
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

# Body: Array of posts with slug and content
```

### Get All Posts
```bash
GET https://your-worker.workers.dev/posts
# Returns: Array of post metadata (no content)
```

### Get Single Post
```bash
GET https://your-worker.workers.dev/posts/{slug}
# Returns: Complete post data including content
```

### Health Check
```bash
GET https://your-worker.workers.dev/health
# Returns: OK
```

## 🧪 Testing

Test your setup locally:

```bash
cd workers/sync-posts
npm install
node test-sync.js
```

This will:
- Read your existing posts
- Test the sync endpoint
- Verify data retrieval
- Run health checks

## 🔍 Monitoring

### Check Worker Logs
```bash
wrangler tail --env production
```

### Check Database Contents
```bash
wrangler d1 execute autumnsgrove-posts --command "SELECT * FROM posts LIMIT 5"
```

### Monitor GitHub Actions
- Go to your repository's Actions tab
- Look for "Sync Posts to CloudFlare D1" workflow runs
- Check logs for any errors or warnings

## 🛠️ Troubleshooting

### Common Issues

**1. Authentication Failed**
- Verify `SYNC_API_KEY` is set in both worker secrets and GitHub secrets
- Check that the API key matches exactly

**2. Database Connection Issues**
- Verify D1 database binding in `wrangler.toml`
- Check database ID is correct
- Ensure worker has proper permissions

**3. Sync Failures**
- Check GitHub Actions logs for detailed error messages
- Verify markdown files have proper frontmatter
- Ensure all dependencies are installed

**4. Missing Posts**
- Check if posts have valid frontmatter (title, date)
- Verify file extensions are `.md`
- Look for error messages in worker logs

### Debug Mode

Enable debug logging by setting environment variable:
```bash
export DEBUG=true
node test-sync.js
```

## 🔒 Security

- API keys are stored as CloudFlare secrets (never in code)
- All endpoints use HTTPS
- Authentication required for sync operations
- CORS configured for cross-origin requests

## 📈 Performance

- Content hashing prevents unnecessary database updates
- Efficient batch processing for multiple posts
- Optimized database queries with proper indexing
- Minimal overhead on your existing blog workflow

## 🔄 Workflow

1. **You write/edit posts** in the `UserContent/Posts/` directory
2. **Push to GitHub** triggers the workflow
3. **GitHub Actions** reads and processes posts
4. **CloudFlare Worker** syncs to D1 database
5. **Database** stores complete post data
6. **API endpoints** provide access to your data

## 🎯 Use Cases

Once set up, you can:

- **Build search functionality** across all posts
- **Create analytics** on your content
- **Generate RSS feeds** dynamically
- **Build mobile apps** that consume your content
- **Create backup systems** for your posts
- **Implement content management** features

## 📚 Next Steps

After successful setup, consider:

1. **Adding search functionality** to your blog using the database
2. **Creating an admin interface** for post management
3. **Building analytics** on your content performance
4. **Implementing content validation** before sync
5. **Adding backup strategies** for the database

## 🤝 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review worker logs for error details
3. Verify all configuration values
4. Test with the provided test script
5. Check GitHub Actions logs for workflow issues

---

**Generated with Kilo Code** - Your blog posts are now automatically synced to a robust database system! 🎉