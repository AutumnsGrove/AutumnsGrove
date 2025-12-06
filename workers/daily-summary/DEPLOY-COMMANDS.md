# Deployment Commands for daily-summary Worker

## 1. Deploy the worker (required after prompt changes)

```bash
cd workers/daily-summary
wrangler deploy
```

## 2. Regenerate today's summary

```bash
# Replace YOUR_TOKEN with any string (auth just checks for presence of Bearer header)
curl -X POST "https://autumnsgrove-daily-summary.YOUR_ACCOUNT.workers.dev/trigger" \
  -H "Authorization: Bearer admin"
```

## 3. Regenerate a specific date

```bash
curl -X POST "https://autumnsgrove-daily-summary.YOUR_ACCOUNT.workers.dev/trigger?date=2025-12-04" \
  -H "Authorization: Bearer admin"
```

## 4. Backfill all historical summaries

The `/backfill` endpoint has a 30-day max per request. Run in batches:

```bash
# Recent month (December 2025)
curl -X POST "https://autumnsgrove-daily-summary.YOUR_ACCOUNT.workers.dev/backfill?start=2025-11-06&end=2025-12-06" \
  -H "Authorization: Bearer admin"

# Previous month
curl -X POST "https://autumnsgrove-daily-summary.YOUR_ACCOUNT.workers.dev/backfill?start=2025-10-07&end=2025-11-05" \
  -H "Authorization: Bearer admin"

# Add more ranges as needed...
```

## Notes

- The actual worker URL is likely `https://autumnsgrove-daily-summary.autumnsgrove.workers.dev` or similar
- Auth just checks for Bearer header presence, token value doesn't matter
- Each date with commits costs ~0.001-0.002 USD (Haiku 4.5)
- Rest days (0 commits) don't call AI, no cost
