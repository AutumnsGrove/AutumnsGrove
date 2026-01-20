# Edge Computing: A Museum Exhibit

Welcome! You're standing at the threshold of understanding how the modern web actually works. What you're looking at isn't code running on a single server in a data center somewhere. This is **edge computing**—code deployed to hundreds of servers around the world, instantly responding to users wherever they are.

Let me give you a tour.

## What You're Looking At

Inside this `workers/` directory are three Cloudflare Workers. Think of them as tiny programs that live at the **edge** of the internet—geographically distributed servers scattered across the globe. When someone visits a website, instead of waiting for a request to travel to a central server, these workers intercept the request right at the closest edge location and respond immediately.

It's the difference between waiting for someone in a distant city to answer a question versus having someone standing right next to you who already knows the answer.

## What is Edge Computing?

Traditionally, web applications work like this:
```
User's Browser → Long Journey to Distant Server → Long Journey Back
```

Edge computing flips the model:
```
User's Browser → Nearest Edge Location (milliseconds away) → Answer
```

The magic is that edge workers have access to:
- **KV Storage**: A distributed key-value store for caching and global state
- **D1 Databases**: Real databases at the edge (replicated from a source)
- **External APIs**: Ability to call third-party services when needed
- **Request Headers**: Information about where the request came from, who's making it, etc.

This matters because **milliseconds count**. Every 100ms of latency loses users. Redirects that take 50ms vs 500ms mean the difference between "instant" and "noticeable."

## The Redirect Worker: Simplest Pattern

Let's start with the simplest one—the redirect worker. It does one thing beautifully:

```typescript
export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const newUrl = `https://autumn.grove.place${url.pathname}${url.search}`;
    return Response.redirect(newUrl, 301);
  },
};
```

**What's happening here:**
1. Someone visits `autumnsgrove.com/about`
2. Instead of traveling to a server, this worker intercepts it at the edge
3. It builds a new URL: `autumn.grove.place/about`
4. It sends back a 301 (permanent redirect) response

The `301` status code is important for SEO—it tells search engines "this domain moved permanently." Google will update its indexes without penalizing the site.

**Why edge for redirects?**
- A redirect needs to happen before the user even gets to the actual server
- It's so simple that running it at the edge (which is everywhere) means every user gets a response within milliseconds
- No origin server needed; it's just data transformation

## The Sync Worker: Content Pipeline

Now it gets interesting. The sync worker is a content pipeline:

```
Your Content System → POST /sync → Sync Worker → D1 Database
                                    ↓
                              Batch Process
                              Rate Limit
                              Validate
                              Hash Check
```

Here's what makes this pattern powerful:

**Rate Limiting at the Edge:**
```javascript
const clientIP = request.headers.get('CF-Connecting-IP');
const rateLimitKey = `rate_limit:${clientIP}`;
// Limited to 10 requests per minute
```

Instead of logging requests locally and checking them later, the worker uses KV storage to track request counts in real-time. This happens *at the edge* for every user, everywhere. If someone from Tokyo tries to DOS the endpoint, the worker in Tokyo blocks them. If someone from São Paulo tries, they're blocked there. There's no central bottleneck.

**Batching for Efficiency:**
The sync endpoint accepts up to 100 posts at once. Why? SQLite (the database) has a limit of 999 bind parameters in a single query. The worker carefully calculates safe batch sizes:

```javascript
// 100 posts × 9 parameters per post = 900 params (safe)
const MAX_POSTS_PER_SYNC = 100;
```

This is **edge thinking**—optimizing for the constraints of the system, not just "make it work."

**Hashing for Deduplication:**
Before syncing each post, it generates a SHA-256 hash:

```javascript
async function generateHash(content) {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  // ... convert to hex string
}
```

Then it compares against the existing hash in the database. If the hashes match, the post hasn't changed—skip it. This is **smart sync logic**: only update what's actually changed.

**The Validation Wall:**
Every post is validated before hitting the database:
- Slug format (kebab-case only: `my-post-name`)
- Content size (max 5MB)
- Title length (max 500 characters)
- Description length (max 2000 characters)

This happens at the edge, catching bad data *before* it reaches the database. It's like a bouncer at a club—prevent problems before they start.

## The Daily Summary Worker: AI Integration at Scale

This is where it gets sophisticated. Every night at 11:59 PM Eastern, this worker:

1. **Fetches GitHub commits** for the day using GraphQL
2. **Tracks costs** for every AI API call
3. **Generates a summary** using an AI provider of choice (Anthropic, Cloudflare AI, or others)
4. **Stores the result** in D1 with full metadata

```javascript
async function generateDailySummary(env, targetDate = null, modelOverride = null) {
  // Fetch commits from GitHub for this date
  const commits = await fetchCommitsForDate(username, token, summaryDate);

  // Get historical context (what was I working on yesterday?)
  const historicalContext = await getHistoricalContext(env.DB, summaryDate);

  // Generate AI summary (tracks cost, tokens, etc.)
  const summary = await generateSummary(env, commits, summaryDate, ownerName);

  // Store with context data for trending analysis
  await storeSummary(env.DB, summaryDate, summary, commits, contextData);
}
```

**Cost Tracking (The Hidden Pattern):**
Every AI request is logged:

```javascript
await trackAIUsage(
  env.DB,
  provider,
  model,
  inputTokens,
  outputTokens,
  cost,
  summaryDate,
  success
);
```

This creates two tables:
- `ai_usage`: Aggregate stats (how many requests today? Total cost?)
- `ai_requests`: Individual request log (which model? How many tokens? Did it succeed?)

An admin can then query `/usage?days=30` and get cost breakdowns by provider and model. This is **financial transparency**—knowing exactly what's being spent where.

**Multiple AI Providers:**
The worker doesn't hard-code to one provider. Instead, it uses an abstraction:

```javascript
const { provider, model } = parseModelString(
  env.AI_MODEL || `${DEFAULT_PROVIDER}:${DEFAULT_MODEL}`
);

const response = await generateAIResponse(
  env, provider, model, SYSTEM_PROMPT, prompt
);
```

The `generateAIResponse` function knows how to talk to Anthropic, Cloudflare Workers AI, or others. This means swapping providers is a config change, not a code change.

**Task Continuation (Temporal Awareness):**
The worker detects if you're continuing work on the same task across multiple days:

```javascript
const continuation = detectContinuation(historicalContext, detectedTaskType);
focusStreak = continuation ? continuation.dayCount : 0;

// Result includes: "Day 5 of working on the database refactor"
```

This is **edge computing thinking**: the worker has access to historical data and can make intelligent decisions based on context, not just process requests blindly.

## Patterns Worth Stealing

Here are the design patterns that make these workers excellent:

### 1. **Immediate Validation at the Edge**
Don't let bad data near your database. Validate early, fail loudly, return helpful errors.

### 2. **Batch Operations with Safety Margins**
Know your limits (SQLite's 999 parameters). Batch in chunks smaller than the limit with headroom.

### 3. **Rate Limiting Distributed Globally**
Use KV storage to track state across all edge locations. Attackers can't circumvent it by switching IPs because every location enforces the limit.

### 4. **Hashing for Smart Syncs**
Compare content hashes before syncing. If nothing changed, skip expensive operations.

### 5. **Cost Tracking for AI APIs**
Log every AI request: tokens, cost, success/failure, which model, when it was used. Make costs visible and queryable.

### 6. **Provider Abstraction**
Don't lock yourself into one vendor. Abstract the AI provider so switching is configuration, not code changes.

### 7. **CORS Handling at the Edge**
Handle preflight OPTIONS requests at the edge. Let the browser make faster requests by establishing trust early.

### 8. **Idempotency and Upserts**
Use `INSERT ... ON CONFLICT DO UPDATE` (upsert) to make sync operations safe. Run them twice? Same result.

## Lessons Learned

**Why Edge Computing Matters:**

1. **Speed**: Code running 50ms away is 10x faster than code running 500ms away. Users feel the difference.

2. **Resilience**: If one data center goes down, your traffic automatically routes to the next nearest edge location.

3. **Cost Efficiency**: Blocking bad requests at the edge (before they reach expensive databases) saves compute, bandwidth, and database operations.

4. **Compliance**: Edge workers can enforce security policies (rate limiting, validation) before requests reach your infrastructure.

5. **Scale**: You can handle traffic spikes better because processing is distributed. No single server gets crushed.

**When NOT to Use Edge Computing:**

- Complex business logic that requires deep database introspection
- Stateful operations that can't be made idempotent
- Long-running processes (workers have timeout limits)

**The Sweet Spot for Edge:**

- Redirects and routing
- Content distribution and caching
- API validation and rate limiting
- Lightweight data transformations
- Authentication and authorization checks
- Analytics and telemetry collection
- Scheduled tasks with external dependencies

---

This museum exhibit represents three years of learning. The redirect worker is a hello-world. The sync worker taught me about batching, hashing, and safe defaults. The daily summary worker showed me how to think about costs, multiple vendors, and temporal patterns.

When you're designing your next feature, ask yourself: "Should this run at the edge or in the origin?" The answer is usually "yes, at least the first 80% of it." Let the edge servers do what they're meant to do—respond instantly to users, everywhere.

Welcome to the edge.
