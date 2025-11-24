# AutumnsGrove Posts Sync Worker

A CloudFlare Worker that syncs blog posts from markdown files to a CloudFlare D1 database.

## Features

- 🔄 Automatic sync of markdown posts to D1 database
- 🔍 Content change detection using SHA-256 hashing
- 📝 Stores both raw markdown and HTML content
- 🗂️ Full metadata preservation (title, date, tags, description)
- 🔐 Secure API authentication with bearer tokens
- 🛡️ Comprehensive security protections (CORS, rate limiting, input validation)
- ⚡ Performance optimized with batch operations (~95% fewer DB calls)
- 🎯 Automatic slug normalization to SEO-friendly kebab-case
- 🚀 GitHub Actions integration
- 📊 Detailed sync reporting with error tracking

## Setup

### Prerequisites

- Node.js 18+
- Wrangler CLI
- CloudFlare account with D1 database access

### Installation

1. Navigate to the worker directory:
   ```bash
   cd workers/sync-posts
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create the D1 database and apply schema:
   ```bash
   wrangler d1 create autumnsgrove-posts
   wrangler d1 execute autumnsgrove-posts --file=schema.sql --env production
   ```

4. Deploy the worker:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

5. Set up GitHub repository secrets:
   - `CLOUDFLARE_WORKER_URL`: Your worker's URL (shown after deployment)
   - `CLOUDFLARE_SYNC_API_KEY`: The API key generated during deployment

## API Endpoints

### POST /sync
Sync posts to the database (requires authentication)

**Headers:**
- `Authorization: Bearer <API_KEY>`
- `Content-Type: application/json`

**Request Body:**
```json
[
  {
    "slug": "post-slug",
    "content": "---\ntitle: \"Post Title\"\ndate: \"2025-01-15\"\ntags: [\"tag1\", \"tag2\"]\ndescription: \"Post description\"\n---\n\nPost content here..."
  }
]
```

**Response:**
```json
{
  "synced": 3,
  "errors": [],
  "details": [
    {
      "slug": "post-slug",
      "action": "created"
    }
  ]
}
```

### GET /posts
Get all posts (metadata only)

**Response:**
```json
[
  {
    "slug": "post-slug",
    "title": "Post Title",
    "date": "2025-01-15",
    "tags": ["tag1", "tag2"],
    "description": "Post description",
    "last_synced": "2025-01-15T12:00:00Z"
  }
]
```

### GET /posts/{slug}
Get a specific post (full content)

**Response:**
```json
{
  "slug": "post-slug",
  "title": "Post Title",
  "date": "2025-01-15",
  "tags": ["tag1", "tag2"],
  "description": "Post description",
  "markdown_content": "---\n...",
  "html_content": "<h1>Post Title</h1>...",
  "file_hash": "abc123...",
  "last_synced": "2025-01-15T12:00:00Z"
}
```

### GET /health
Health check endpoint

**Response:** `OK`

## Database Schema

```sql
CREATE TABLE posts (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  tags TEXT,
  description TEXT,
  markdown_content TEXT NOT NULL,
  html_content TEXT,
  file_hash TEXT NOT NULL,
  last_synced TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
```

## GitHub Actions Integration

The sync process is automatically triggered when:
- Files in the `posts/` directory are modified
- A push is made to the `main` branch
- The workflow is manually triggered

## Development

### Local Development

```bash
npm run dev
```

### Deploy to Staging

```bash
npm run deploy:staging
```

### Deploy to Production

```bash
npm run deploy:production
```

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Ensure the `SYNC_API_KEY` secret is set correctly
   - Check that the API key in GitHub Actions matches the worker secret

2. **Database Connection Issues**
   - Verify the D1 database binding in `wrangler.toml`
   - Check that the database ID is correct

3. **Sync Failures**
   - Check the GitHub Actions logs for detailed error messages
   - Verify the markdown file format and frontmatter

### Logs

Check the CloudFlare Worker logs:
```bash
wrangler tail --env production
```

## Security

### 🔒 Security Features

- **Authentication**: Bearer token authentication for sync endpoint
- **CORS Protection**: Configurable allowed origin (no wildcard in production)
- **Rate Limiting**: Optional KV-based rate limiting (10 requests/minute per IP)
- **Input Validation**: Multi-layer validation for all inputs
  - Slug format validation (SEO-friendly kebab-case)
  - Content type and size validation (5MB per post, 50MB request max)
  - Title/description length limits (500/2000 chars)
- **Request Size Limits**: Prevents DoS attacks via oversized payloads
- **XSS Protection**: Markdown parsing with security options
- **SQL Injection Protection**: Parameterized queries throughout
- **Error Message Sanitization**: Generic errors in production

### 🔐 Environment Variables

Required in `wrangler.toml`:

```toml
[env.production]
vars = {
  ENVIRONMENT = "production",
  ALLOWED_ORIGIN = "https://autumnsgrove.com"  # Your production domain
}
```

### 🚨 Required Secrets

Set using `wrangler secret put <NAME> --env production`:

```bash
# Required
wrangler secret put SYNC_API_KEY --env production
```

### 📊 Optional: Rate Limiting Setup

For enhanced protection, create a KV namespace:

```bash
# Create KV namespace
wrangler kv:namespace create RATE_LIMIT_KV --env production

# Update wrangler.toml with the returned ID
[[env.production.kv_namespaces]]
binding = "RATE_LIMIT_KV"
id = "your-kv-namespace-id"
```

Without KV, rate limiting is disabled but other security measures remain active.

### 🛡️ Best Practices

1. **Always use environment variables** for `ALLOWED_ORIGIN` - never use `'*'`
2. **Enable rate limiting** for production by configuring KV namespace
3. **Use strong API keys** (32+ characters, randomly generated)
4. **Rotate secrets regularly** (every 90 days recommended)
5. **Monitor CloudFlare logs** for suspicious activity
6. **Implement CSP headers** on the client-side when rendering HTML content
7. **Consider DOMPurify** for additional XSS protection on the frontend

### 🎯 Slug Format

Slugs are automatically normalized to SEO-friendly kebab-case:
- Converts to lowercase
- Replaces spaces and underscores with hyphens
- Removes special characters
- Prevents consecutive hyphens

Examples:
- `"First Post"` → `"first-post"`
- `"My_Cool_Article"` → `"my-cool-article"`
- `"Hello  World!"` → `"hello-world"`

### 📈 Performance Optimizations

- **Batch Operations**: ~95% reduction in database calls
- **Smart Caching**: Content hash comparison to skip unchanged posts
- **Efficient Deletes**: Batch deletion for removed posts
- **Early Validation**: Input checks before expensive operations

## License

MIT