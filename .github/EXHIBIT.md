# The Automation Wing: GitHub Actions

> *Teammates who never sleep, reviewing your code, deploying your changes, and syncing your content.*

---

## What You're Looking At

This is `.github/`—the automation headquarters of AutumnsGrove. Inside this folder are **workflows**: automated scripts that run on GitHub's servers whenever something happens to your repository.

Think of GitHub Actions as invisible colleagues. They watch the repository, and when they see something they care about (a push, a pull request, a scheduled time), they spring into action. They run tests, deploy code, review changes, sync content—all without you lifting a finger.

If the rest of this museum shows you *how* the code works, this wing shows you *how the code ships*.

---

## The Vocabulary

Before we tour the workflows, here are the terms you'll encounter:

| Term | Meaning |
|------|---------|
| **Workflow** | A YAML file that defines automated tasks. Lives in `.github/workflows/` |
| **Trigger** | What starts the workflow (push, pull request, schedule, manual) |
| **Job** | A group of steps that run on the same machine |
| **Step** | A single task within a job (run a command, use an action) |
| **Action** | A reusable piece of automation (checkout code, setup Node, deploy) |
| **Secret** | Sensitive data stored securely (API keys, tokens) |
| **Runner** | The machine that executes your workflow (usually `ubuntu-latest`) |

Every workflow follows this anatomy:

```yaml
name: What This Workflow Does        # Human-readable name

on:                                  # TRIGGERS - when does this run?
  push:
    branches: [main]
  pull_request:

jobs:                                # JOBS - what does it do?
  job-name:
    runs-on: ubuntu-latest           # What machine?
    steps:                           # STEPS - individual tasks
      - name: Checkout code
        uses: actions/checkout@v4
      - name: Run a command
        run: echo "Hello, automation!"
```

That's it. Triggers tell GitHub *when*. Jobs and steps tell GitHub *what*. Everything else is details.

---

## Gallery 1: The Deployment Pipeline

**File:** `workflows/deploy.yml`

This is the heart of continuous deployment. When you push to `main`, this workflow:

1. **Runs security tests** (before anything else)
2. **Audits dependencies** (checks for vulnerabilities)
3. **Builds the application** (SvelteKit → static files)
4. **Deploys to Cloudflare Pages** (production or preview)

```
Push to main
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          TEST JOB                                    │
│  • Checkout code                                                     │
│  • Install dependencies (pnpm)                                       │
│  • Run security tests                                                │
│  • Audit packages for vulnerabilities                                │
│  • Generate test coverage                                            │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     BUILD AND DEPLOY JOB                             │
│  • Checkout code                                                     │
│  • Install dependencies                                              │
│  • Build SvelteKit application                                       │
│  • Deploy to Cloudflare Pages                                        │
│    - Production (push to main)                                       │
│    - Preview (pull request)                                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Patterns

**Sequential Jobs with Dependencies:**

```yaml
build-and-deploy:
  needs: test  # Only runs if 'test' job succeeds
```

Tests run first. If they fail, deployment never happens. Your production site stays safe.

**Environment-Aware Deployment:**

```yaml
- name: Deploy to Cloudflare Pages (Production)
  if: github.event_name == 'push' && github.ref == 'refs/heads/main'
  # ... deploy to production

- name: Deploy to Cloudflare Pages (Preview)
  if: github.event_name == 'pull_request'
  # ... deploy to preview URL
```

Push to main? Production. Open a PR? Preview environment. Same workflow, different outcomes based on context.

**Secrets for Credentials:**

```yaml
apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

API keys never appear in code. They're stored as repository secrets and injected at runtime. Even if someone reads your workflow file, they can't steal your credentials.

---

## Gallery 2: Your AI Code Reviewer

**File:** `workflows/claude-code-review.yml`

This is automation as mentorship. Every time someone opens a pull request, Claude reviews the code automatically. No one asked. No one needed to remember. It just happens.

```
Pull Request Opened
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      CLAUDE REVIEW JOB                               │
│  • Checkout repository                                               │
│  • Run Claude Code with review prompt                                │
│  • Claude reads the diff, analyzes changes                           │
│  • Posts review as a PR comment                                      │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
PR Comment with Feedback
```

### How It Works

```yaml
on:
  pull_request:
    types: [opened, synchronize]  # New PR or new commits pushed
```

Triggers on every PR and every new commit to an existing PR. Fresh eyes on every change.

```yaml
- name: Run Claude Code Review
  uses: anthropics/claude-code-action@v1
  with:
    claude_code_oauth_token: ${{ secrets.CLAUDE_CODE_OAUTH_TOKEN }}
    prompt: |
      Please review this pull request and provide feedback on:
      - Code quality and best practices
      - Potential bugs or issues
      - Performance considerations
      - Security concerns
      - Test coverage

      Use the repository's CLAUDE.md for guidance on style and conventions.
```

The prompt tells Claude what to look for. The `CLAUDE.md` file (which you've already seen) gives Claude context about your project's conventions.

### Why This Matters

Solo developers don't have teammates to review their PRs. Open source maintainers get overwhelmed with contributions. Junior developers benefit from consistent feedback.

Claude catches things humans miss: security patterns, performance issues, forgotten edge cases. It's not replacing human review—it's augmenting it. You still make the final call.

**Real-world usage:** This automatic review runs on ~99% of PRs. It's the default, always-on safety net.

---

## Gallery 3: The On-Demand Assistant

**File:** `workflows/claude.yml`

While the code reviewer is automatic, this workflow is on-demand. Mention `@claude` anywhere—in an issue, a PR comment, a review—and Claude responds.

```yaml
on:
  issue_comment:
    types: [created]
  pull_request_review_comment:
    types: [created]
  issues:
    types: [opened, assigned]
  pull_request_review:
    types: [submitted]
```

It listens to everything. Comments, reviews, new issues. If you tag `@claude`, it responds.

```yaml
if: |
  (github.event_name == 'issue_comment' && contains(github.event.comment.body, '@claude')) ||
  (github.event_name == 'pull_request_review_comment' && contains(github.event.comment.body, '@claude')) ||
  ...
```

The `if` condition checks whether `@claude` was mentioned. If not, the workflow skips entirely (no wasted compute).

### Use Cases

- **"@claude explain this function"** — Get an explanation of complex code
- **"@claude help me fix this bug"** — Debugging assistance
- **"@claude what's the best approach here?"** — Architecture guidance
- **"@claude update the PR description"** — Automate tedious tasks

This is your pair programmer, available 24/7, invoked by a simple mention.

**Real-world usage:** Less frequent than automatic reviews (~1% of interactions), but invaluable when you need specific help on a tricky problem.

---

## Gallery 4: The Content Pipeline

**File:** `workflows/sync-posts.yml`

Content lives in two places: `UserContent/Posts/` (markdown files in the repo) and the Cloudflare D1 database (what production serves). This workflow keeps them synchronized.

```
Push to main (changes in UserContent/Posts/)
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      PROCESS POSTS                                   │
│  • Read all markdown files                                           │
│  • Parse frontmatter (title, date, tags)                             │
│  • Process gutter content (sidebar items)                            │
│  • Normalize slugs to kebab-case                                     │
│  • Write to posts-data.json                                          │
└─────────────────────────────────────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SYNC TO D1                                      │
│  • POST to Cloudflare Worker sync endpoint                           │
│  • Worker validates, hashes, upserts                                 │
│  • Reports success/failure                                           │
└─────────────────────────────────────────────────────────────────────┘
```

### The Clever Bits

**Path-Based Triggers:**

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'UserContent/Posts/**'
```

Only runs when posts actually change. Push a code fix? This workflow sleeps. Push a blog post? It wakes up.

**Gutter Content Processing:**

The workflow doesn't just sync markdown. It reads gutter manifests, loads referenced files, and packages everything together:

```javascript
// Process gutter content if it exists
const gutterContent = processGutterContent(postsDir, rawSlug);
if (gutterContent && gutterContent.length > 0) {
  postData.gutterContent = gutterContent;
}
```

Your sidebar images, quotes, and notes travel with your posts.

**Manual Trigger Option:**

```yaml
workflow_dispatch:  # Allow manual triggering
```

Something went wrong? Trigger a re-sync from the Actions tab. No code changes required.

---

## Gallery 5: What Else Can Actions Do?

The workflows in this repository are just the beginning. GitHub Actions can automate almost anything that can be scripted. Here are patterns worth knowing:

### Automatic Test Runners

Run your test suite on every push. Block merges if tests fail.

```yaml
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm install
      - run: npm test
```

This is table stakes for professional software development. Never ship broken code.

### Documentation Freshness Checks

Documentation rots. Code changes, docs don't get updated. This workflow catches staleness:

```yaml
# From GroveEngine's docs-freshness.yml
on:
  schedule:
    - cron: '0 9 * * 1'  # Every Monday at 9 AM
```

It scans documentation files, checks `last_verified` dates in frontmatter, and creates issues when articles exceed 90 days without verification. Documentation as a living practice, not a one-time chore.

### Automatic Version Tagging

When you bump a version number, automate everything that follows:

```yaml
# From GroveEngine's auto-tag.yml
on:
  push:
    paths:
      - 'packages/engine/package.json'
```

This workflow:
1. Detects version changes in `package.json`
2. Creates a git tag (`v1.2.3`)
3. Generates a repository snapshot
4. Uses AI to summarize changes since the last release
5. Calculates package size
6. Syncs data to the landing page
7. Commits everything back to the repo

One version bump triggers an entire release pipeline. No manual steps, no forgotten tasks.

### Scheduled Tasks

Run anything on a schedule:

```yaml
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight
```

Generate daily reports. Clean up old data. Refresh caches. Check for security vulnerabilities. The possibilities are endless.

### Cross-Repository Workflows

Trigger workflows in other repositories:

```yaml
- uses: actions/github-script@v7
  with:
    script: |
      await github.rest.repos.createDispatchEvent({
        owner: 'your-org',
        repo: 'other-repo',
        event_type: 'trigger-build'
      })
```

Monorepo? Multi-service architecture? Coordinate deployments across boundaries.

---

## Patterns Worth Stealing

### 1. **Test Before Deploy**

```yaml
build-and-deploy:
  needs: test
```

Never let broken code reach production. Make deployment depend on passing tests.

### 2. **Path-Based Triggers**

```yaml
on:
  push:
    paths:
      - 'src/**'
```

Don't run workflows when nothing relevant changed. Save compute, save time.

### 3. **Environment Branching**

```yaml
if: github.ref == 'refs/heads/main'
  # Production deployment
if: github.event_name == 'pull_request'
  # Preview deployment
```

Same workflow, different behavior based on context. DRY principles for CI/CD.

### 4. **Secrets for Sensitive Data**

```yaml
${{ secrets.API_TOKEN }}
```

Never hardcode credentials. Repository secrets are encrypted, access-controlled, and automatically masked in logs.

### 5. **Manual Triggers for Emergencies**

```yaml
workflow_dispatch:
```

Always include a manual trigger. When automation fails, you need a way to run things by hand.

### 6. **Scheduled Maintenance**

```yaml
schedule:
  - cron: '0 9 * * 1'
```

Automate the tasks humans forget. Weekly checks, daily cleanups, monthly reports.

### 7. **AI-Augmented Review**

```yaml
uses: anthropics/claude-code-action@v1
```

Let AI handle the first pass. Catch security issues, style violations, and bugs before human review.

---

## Lessons Learned

### Automation is a Teammate

These workflows aren't just scripts. They're colleagues who:
- Never forget to run tests
- Never skip the security audit
- Never miss a PR that needs review
- Never let documentation get stale

Treat them that way. Give them clear responsibilities. Trust their output.

### Start Simple, Add Complexity

The deployment workflow started as "build and deploy." Tests came later. Preview environments came later. Each addition solved a real problem that emerged over time.

Don't design the perfect CI/CD pipeline upfront. Start with what you need today, iterate as you learn.

### Failures are Signals

When a workflow fails, something important changed. Don't just re-run it. Understand *why* it failed. The automation is telling you something.

### Secrets Management Matters

The moment you hardcode an API key, you've created a security vulnerability. Use secrets from day one. It's not paranoia—it's professionalism.

### Actions are Building Blocks

The `actions/checkout@v4` action is used in every workflow. The `actions/setup-node@v4` action handles Node.js installation. The `cloudflare/wrangler-action@v3` handles deployment.

You don't write everything from scratch. You compose workflows from trusted building blocks.

---

## The Workflows at a Glance

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `deploy.yml` | Push to main, PR | Test, build, and deploy to Cloudflare Pages |
| `claude-code-review.yml` | PR opened/updated | Automatic AI code review on every PR |
| `claude.yml` | @claude mention | On-demand AI assistance in issues/PRs |
| `sync-posts.yml` | Push to UserContent/Posts | Sync blog posts to D1 database |

---

## Continue Your Tour

**Directly Related:**

- **[The Content Gallery](/UserContent/EXHIBIT.md)** — Where the content that gets synced lives
- **[Edge Computing](/workers/EXHIBIT.md)** — The Cloudflare Worker that receives synced posts
- **[The Security Lab](/tests/EXHIBIT.md)** — The tests that run before deployment

**Architecture Context:**

- **[The Architecture](/src/EXHIBIT.md)** — How the deployed application works
- **[The Foundation](/migrations/EXHIBIT.md)** — The database schema that receives synced content

**[← Back to the Museum Entrance](/MUSEUM.md)**

---

*Automation isn't about replacing humans. It's about freeing humans to do what only humans can do—while the machines handle the rest.*
