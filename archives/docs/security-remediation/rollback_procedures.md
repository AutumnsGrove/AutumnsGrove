# Emergency Rollback Procedures

**Purpose**: Quick reference for rolling back security fixes in case of critical issues

**When to Use**: Only when fixes cause application failures or security regressions

---

## Rollback Decision Tree

```
Issue Encountered?
├─ Performance degradation (>5% latency)
│  └─ Phase 3 or 4 likely culprit
├─ CSRF validation blocking legitimate requests
│  └─ Phase 2 rollback needed
├─ XSS fixes breaking content rendering
│  └─ Phase 1 rollback needed
├─ Rate limiting too aggressive
│  └─ Adjust limits (Phase 3 only)
├─ Authentication failures
│  └─ Phase 1 or 2 likely culprit
└─ File uploads failing
   └─ Phase 3 (SVG/magic bytes) culprit
```

---

## Full Rollback (All Phases)

**Time Required**: 5-10 minutes
**Risk**: Restores all vulnerabilities

### Step 1: Immediate Stop

```bash
# Pause production traffic (if using Cloudflare)
# Go to: Cloudflare Dashboard > Page Rules > Create Rule
# URL: https://autumnsgrove.com/*
# Action: Pause Everything (disables all optimizations but keeps site up)

# Or via API:
curl -X POST "https://api.cloudflare.com/client/v4/zones/{zone_id}/page_rules" \
  -H "X-Auth-Email: {email}" \
  -H "X-Auth-Key: {api_key}" \
  -H "Content-Type: application/json" \
  --data '{"targets":[{"target":"url","constraint":{"operator":"matches","value":"*"}}],"actions":[{"id":"disable_security"}],"priority":1,"status":"active"}'
```

### Step 2: Complete Revert

```bash
# Go to previous stable commit (before all security work)
git log --oneline | head -20
# Find commit before security work started

# Full revert
git reset --hard <safe-commit-hash>

# Or revert all 5 commits
git reset --hard HEAD~5
```

### Step 3: Redeploy

```bash
# Rebuild
npm run build

# Deploy immediately
npm run deploy:production

# Verify deployment
curl -I https://autumnsgrove.com
echo "Response should show no CSP nonces in headers"
```

### Step 4: Notify Team

```bash
# Send notification
cat << EOF > rollback_alert.txt
SECURITY FIXES ROLLED BACK - URGENT

Timestamp: $(date)
Reason: Critical issue encountered
Commits Reverted: 5 (all security phases)

Status: Application restored to pre-security state
Risk: All vulnerabilities now active again

Next Steps:
1. Investigate root cause
2. Re-apply fixes incrementally
3. Add additional testing

Contact: [On-call engineer]
EOF

# Post to Slack/Teams
slack-post "@here URGENT: Security fixes rolled back due to critical issue"
```

---

## Phase-Specific Rollbacks

### Rollback Phase 1 Only (XSS Fixes)

**Time**: 3-5 minutes
**Impact**: XSS vulnerabilities return

```bash
# List commits in Phase 1
git log --oneline | grep -i "xss\|sanitize\|mermaid" | head -5

# Revert Phase 1 commits (usually 1-2 commits)
git revert HEAD~0  # Adjust to correct commit count

# Or manually revert files
git checkout HEAD~1 -- src/lib/utils/sanitize.js
git checkout HEAD~1 -- src/lib/utils/markdown.js
git checkout HEAD~1 -- src/routes/api/posts/+server.js
git checkout HEAD~1 -- src/lib/components/custom/GutterItem.svelte

# Rebuild and deploy
npm run build && npm run deploy:production
```

**Validation**:
```bash
# Check sanitize.js removed
if [ ! -f "src/lib/utils/sanitize.js" ]; then
  echo "Phase 1 reverted successfully"
fi
```

---

### Rollback Phase 2 Only (CSRF Fixes)

**Time**: 3-5 minutes
**Impact**: CSRF protection disabled

```bash
# Revert CSRF changes
git checkout HEAD~1 -- src/lib/utils/csrf.js
git checkout HEAD~1 -- src/hooks.server.js
git checkout HEAD~1 -- src/lib/utils/api.js

# Remove manual CSRF from individual endpoints
git checkout HEAD~1 -- src/routes/api/posts/+server.js
git checkout HEAD~1 -- src/routes/api/posts/[slug]/+server.js

# If CSRF breaks everything, emergency bypass
cat << 'EOF' > src/hooks.server.js
// TEMPORARY: CSRF validation disabled
export async function handle({ event, resolve }) {
  // ... keep existing code ...
  // Comment out CSRF validation:
  // if (!validateCSRF(event.request, event.locals.csrfToken)) {
  //   return new Response('CSRF failed', { status: 403 });
  // }

  return await resolve(event);
}
EOF

# Deploy
npm run deploy:production
```

**Why This Matters**: CSRF blocks legitimate requests if token generation broken

---

### Rollback Phase 3 Only (CSP, Rate Limiting, Gallery Auth)

**Time**: 2-3 minutes
**Impact**: Selective feature rollback

#### Option A: Rollback All Phase 3

```bash
# Revert Phase 3 files
git checkout HEAD~1 -- src/lib/utils/csp.js
git checkout HEAD~1 -- src/lib/utils/rateLimit.js
git checkout HEAD~1 -- src/hooks.server.js
git checkout HEAD~1 -- src/routes/api/images/upload/+server.js
git checkout HEAD~1 -- src/routes/api/gallery/+server.js

npm run deploy:production
```

#### Option B: Disable Only CSP (if causing issues)

```javascript
// In src/hooks.server.js - comment out CSP header
// response.headers.set('Content-Security-Policy', buildCSPHeader(cspNonce, env));

// But keep rate limiting and gallery auth
```

#### Option C: Disable Only Rate Limiting

```javascript
// In src/hooks.server.js - comment out rate limit checks
// if (event.url.pathname.startsWith('/api/auth/')) {
//   const rateLimitCheck = createRateLimitMiddleware(...);
//   ...
// }

// But keep CSP and gallery auth
```

#### Option D: Disable Only Gallery Auth

```javascript
// In src/routes/api/gallery/+server.js
// Comment out auth check:
// if (!locals.user) {
//   throw error(401, 'Authentication required');
// }
```

---

### Rollback Phase 4 Only (Input Validation & Audit Logging)

**Time**: 2-3 minutes
**Impact**: Low - audit logging is non-critical

```bash
# These changes are backwards-compatible
# Can usually just disable logging

# Temporarily disable audit logging
git checkout HEAD~1 -- src/lib/utils/auditLog.js

# Or comment out audit calls in hooks/endpoints
# search for: logAuditEvent, logAuthEvent, etc.

# Keep other Phase 4 fixes (validation, error sanitization)
npm run deploy:production
```

---

### Rollback Phase 5 Only (Tests & Documentation)

**Time**: 1 minute
**Impact**: None - testing doesn't affect production

```bash
# Tests don't need rollback
# Just revert documentation changes if necessary

git checkout HEAD~1 -- docs/SECURITY.md
git checkout HEAD~1 -- AGENT.md

# No deploy needed - these are documentation only
```

---

## Targeted Fixes for Common Issues

### Issue: CSRF Validation Blocking Legitimate Requests

**Symptom**: 403 errors on POST/DELETE, audit logs show CSRF rejections on same-origin requests

**Quick Fix (5 min)**:

```javascript
// In src/hooks.server.js
// Temporarily log CSRF failures instead of blocking
if (isApiRoute && isStateMutating && event.locals.user) {
  if (!validateCSRF(event.request, event.locals.csrfToken)) {
    console.warn('[CSRF] Request would be blocked:', {
      origin: event.request.headers.get('origin'),
      path: event.url.pathname
    });
    // Don't return error - continue instead
    // return new Response('CSRF validation failed', { status: 403 });
  }
}
```

**Proper Fix (10 min)**:

1. Check if CSRF token generation working:
```bash
# Check cookies set
curl -I https://autumnsgrove.com/ | grep -i set-cookie | grep csrf
```

2. If no CSRF token in cookies, fix token generation:
```javascript
// In hooks.server.js - ensure this runs
if (event.locals.user) {
  let csrfToken = event.cookies.get('csrf_token');
  if (!csrfToken) {
    csrfToken = generateCSRFToken();
    event.cookies.set('csrf_token', csrfToken, {
      httpOnly: true,
      sameSite: 'strict'
    });
  }
  event.locals.csrfToken = csrfToken;
}
```

3. If still failing, add debugging:
```javascript
console.log('[DEBUG] CSRF Token:', event.locals.csrfToken);
console.log('[DEBUG] Token from header:', event.request.headers.get('x-csrf-token'));
console.log('[DEBUG] Request origin:', event.request.headers.get('origin'));
console.log('[DEBUG] Host:', event.request.headers.get('host'));
```

---

### Issue: CSP Blocking Legitimate Scripts or Styles

**Symptom**: Console errors like "Refused to execute inline script because it violates CSP"

**Quick Fix (2 min)**:

```javascript
// Disable CSP temporarily in hooks.server.js
if (event.url.hostname !== 'localhost') {
  // TEMPORARILY DISABLED - debugging CSP issues
  // response.headers.set('Content-Security-Policy', buildCSPHeader(cspNonce, env));

  // Report-only mode (log violations without blocking)
  response.headers.set('Content-Security-Policy-Report-Only',
    buildCSPHeader(cspNonce, env) + '; report-uri /api/csp-report'
  );
}
```

**Proper Fix (15 min)**:

1. Check console for CSP violations:
   - Open DevTools > Console
   - Look for "Refused to execute/load" messages
   - Note the resource type and URL

2. If script blocked:
   - Add nonce: `<script nonce="{data.cspNonce}">`
   - Or add URL to `script-src` whitelist:
     ```javascript
     script-src 'self' 'nonce-${nonce}' https://trusted-cdn.com
     ```

3. If style blocked:
   - Check for inline styles
   - Use external CSS file instead
   - Or add nonce: `<style nonce="{data.cspNonce}">`

4. If image/font blocked:
   - Add domain to `img-src` or `font-src`

5. Test with Report-Only first (won't break):
   ```javascript
   response.headers.set('Content-Security-Policy-Report-Only', header);
   ```

---

### Issue: Rate Limiting Too Aggressive

**Symptom**: Users getting 429 errors too frequently

**Quick Fix (2 min)**:

```javascript
// In src/lib/utils/rateLimit.js
export const RATE_LIMITS = {
  auth: { maxRequests: 15, windowMs: 15 * 60 * 1000 },  // Was 5
  apiWrite: { maxRequests: 120, windowMs: 60 * 1000 },  // Was 60
  apiRead: { maxRequests: 240, windowMs: 60 * 1000 },   // Was 120
  upload: { maxRequests: 20, windowMs: 60 * 60 * 1000 },  // Was 10
  public: { maxRequests: 600, windowMs: 60 * 1000 }      // Was 300
};
```

**Proper Fix (10 min)**:

1. Analyze which endpoint is getting rate limited:
```sql
SELECT path, COUNT(*) as hits
FROM audit_logs
WHERE action = 'security_rate_limit'
  AND timestamp > datetime('now', '-1 hour')
GROUP BY path
ORDER BY hits DESC;
```

2. Adjust limit for specific endpoint:
```javascript
// In hooks.server.js
if (event.url.pathname === '/api/image-gallery') {
  // Less strict limit for this endpoint
  const rateLimitCheck = createRateLimitMiddleware(300, 60000)(event);
}
```

3. Or whitelist specific IPs:
```javascript
const whitelistedIps = ['10.0.0.5', '192.168.1.100'];
const clientIp = event.request.headers.get('x-forwarded-for');

if (!whitelistedIps.includes(clientIp)) {
  // Apply rate limiting
}
```

---

### Issue: File Uploads Failing (SVG/Magic Byte Rejection)

**Symptom**: Valid image files being rejected with 400 error

**Quick Fix (2 min)**:

```javascript
// In src/routes/api/images/upload/+server.js
// Temporarily disable magic byte validation
const arrayBuffer = await file.arrayBuffer();

// TEMPORARILY DISABLED
// try {
//   validateMagicBytes(arrayBuffer, file.type);
// } catch (err) {
//   throw error(400, err.message);
// }

// Just validate extension
const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
if (!['.jpg', '.png', '.webp'].includes(ext)) {
  throw error(400, 'Invalid file type');
}
```

**Proper Fix (10 min)**:

1. Check what files are being rejected:
```bash
# Look at audit logs
curl https://autumnsgrove.com/api/admin/logs?filter=upload_failed
```

2. If JPG files rejected:
   - May be corrupted JPG header
   - Try re-saving image in image editor
   - Validate magic bytes match: 0xFF 0xD8 0xFF

3. If WebP files rejected:
   - Check WEBP signature (RIFF... WEBP)
   - Add WebP support to magic bytes if missing

4. Test with known good file:
```bash
# Create test PNG
magick -size 100x100 xc:blue test.png

# Upload
curl -F "file=@test.png" https://autumnsgrove.com/api/images/upload
```

---

### Issue: Authentication Failures After CSRF Phase

**Symptom**: Login working, but some authenticated endpoints returning 401

**Quick Fix (2 min)**:

```javascript
// In hooks.server.js
// Temporarily disable CSRF validation
// if (!validateCSRF(event.request, event.locals.csrfToken)) {
//   return new Response('CSRF validation failed', { status: 403 });
// }

// But keep auth check
if (!event.locals.user && isProtectedRoute) {
  throw error(401, 'Not authenticated');
}
```

**Proper Fix (10 min)**:

1. Check if user is being loaded correctly:
```javascript
console.log('[DEBUG] User:', event.locals.user);
console.log('[DEBUG] CSRF Token:', event.locals.csrfToken);
```

2. Verify session cookie is set:
```bash
curl -I https://autumnsgrove.com/ | grep -i set-cookie
```

3. Check session verification function:
```javascript
// In src/hooks.server.js
const user = await verifySession(sessionToken, secret);
console.log('[DEBUG] Session valid:', !!user);
```

4. If session invalid, check:
   - SESSION_SECRET environment variable set?
   - Session token format correct?
   - Session expiration?

---

## Database Rollback

If database changes were made (audit logs table):

### Rollback Audit Log Table

```sql
-- Drop the table if it exists
DROP TABLE IF EXISTS audit_logs;

-- Or rename for backup
ALTER TABLE audit_logs RENAME TO audit_logs_backup;

-- Verify
SELECT COUNT(*) FROM sqlite_master
WHERE type='table' AND name='audit_logs';
```

### Restore from Backup

```bash
# If database backed up before changes
# Restore from latest backup
cp /backups/database_pre_security.db /app/data.db

# Or restore specific table
sqlite3 data.db < audit_logs_backup.sql
```

---

## Git Rollback Strategies

### Strategy 1: Hard Reset (Lose All Changes)

```bash
# Go back N commits
git reset --hard HEAD~5

# Or go to specific commit
git reset --hard abc123def
```

**Pros**: Quick, simple
**Cons**: Lose all work since that commit

### Strategy 2: Revert (Keep History)

```bash
# Create new commits that undo changes
git revert HEAD~4..HEAD

# Or revert specific commit
git revert abc123def
```

**Pros**: Keeps git history, auditable
**Cons**: Slower, may have conflicts

### Strategy 3: Selective Revert (File by File)

```bash
# Revert specific files only
git checkout HEAD~1 -- src/hooks.server.js

# Or cherry-pick specific commits to keep
git cherry-pick good-commit-hash
```

**Pros**: Fine-grained control
**Cons**: Most complex

### Strategy 4: Branch Rollback

```bash
# Keep main, revert to working branch
git branch -b rollback-point abc123def

# Or revert current branch to state from other branch
git reset --hard origin/stable-branch
```

---

## Verification Checklist After Rollback

After rolling back, verify application is working:

```bash
#!/bin/bash

echo "=== Post-Rollback Verification ==="

# 1. Check deployment
echo "1. Checking deployment..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://autumnsgrove.com/)
if [ "$RESPONSE" = "200" ]; then
  echo "   ✓ Site responding (200)"
else
  echo "   ✗ Site not responding ($RESPONSE)"
fi

# 2. Check basic functionality
echo "2. Checking basic functionality..."
curl -s https://autumnsgrove.com/ | grep -q "AutumnsGrove" && echo "   ✓ Homepage loads" || echo "   ✗ Homepage broken"

# 3. Check security headers (if not fully rolled back)
echo "3. Checking security headers..."
HEADERS=$(curl -I https://autumnsgrove.com/ 2>/dev/null | grep -i "security\|x-")
echo "   Headers: $HEADERS"

# 4. Check logs for errors
echo "4. Checking error logs..."
ERRORS=$(npm run logs:prod 2>/dev/null | grep -i error | wc -l)
echo "   Error count (last 5min): $ERRORS"

# 5. Check database
echo "5. Checking database..."
sqlite3 /path/to/db.db "SELECT COUNT(*) FROM posts" > /dev/null && echo "   ✓ Database accessible" || echo "   ✗ Database error"

echo ""
echo "=== Verification Complete ==="
```

---

## Timeline: Incident to Stable State

```
00:00 - Issue detected
      └─ Decision: Rollback necessary

00:02 - Full rollback executed
      └─ All security fixes removed
      └─ Site back online

00:05 - Notification sent to team
      └─ Slack/Email alert
      └─ Issue summary

00:10 - Investigation begins
      ├─ Which phase caused issue?
      ├─ Which specific fix?
      ├─ Reproducible?
      └─ Root cause identified

00:30 - Targeted re-implementation
      └─ Apply fix with modifications
      └─ Add debugging/logging

01:00 - Verification testing
      └─ Unit tests pass
      └─ Integration tests pass
      └─ Manual testing
      └─ Performance baseline

01:30 - Staged deployment
      └─ Deploy to staging
      └─ Monitor for 15 minutes
      └─ Deploy to production

02:00 - Monitoring & confirmation
      └─ Error rates normal
      └─ Performance normal
      └─ Features working
      └─ All-clear message

Total time: ~2 hours from detection to re-stabilization
```

---

## When NOT to Rollback

Do **NOT** rollback if:

1. ✗ Issue is minor (e.g., error message wording)
   - Fix directly instead

2. ✗ Issue is environmental (e.g., deployment script typo)
   - Fix deployment config instead

3. ✗ Issue is temporary (e.g., API momentarily slow)
   - Wait for it to resolve

4. ✗ Multiple vulnerabilities would be re-exposed
   - Rollback individual component instead

5. ✗ Only feature request (user wants to disable feature)
   - Add configuration instead

---

## Escalation Matrix

| Issue | Response | Escalation |
|-------|----------|-----------|
| Single endpoint broken | Fix endpoint | L1 Engineer |
| CSRF/Rate limiting too strict | Adjust limits | L2 Engineer |
| Data corruption | Restore DB backup | L3 Engineer + DBA |
| Site down | Full rollback | L3 Engineer + Incident Commander |
| Security regression | Revert phase | Security Team |

---

## Post-Incident Review

After rollback completes, schedule review:

1. **Root Cause Analysis**
   - What specifically failed?
   - Why wasn't it caught in testing?
   - Environmental factor?

2. **Preventive Measures**
   - Improve tests?
   - Better staging environment?
   - Gradual rollout instead of big-bang?

3. **Process Improvements**
   - Alert thresholds?
   - Monitoring improvements?
   - Training needed?

4. **Implementation**
   - Schedule re-implementation
   - With additional fixes
   - More comprehensive testing

---

## Emergency Contacts

**Security Issues**:
- Slack: @security-team
- Email: security@autumnsgrove.com

**Infrastructure Issues**:
- Slack: @platform-team
- PagerDuty: On-call engineer

**Data Loss/Corruption**:
- Slack: @dba-team
- Call: +1-xxx-xxx-xxxx (DBA on-call)

---

## Related Documents

- [phase1_xss_fixes.md](./phase1_xss_fixes.md) - XSS implementation details
- [phase2_csrf_fixes.md](./phase2_csrf_fixes.md) - CSRF implementation details
- [phase3_high_priority.md](./phase3_high_priority.md) - CSP/Rate Limit details
- [phase4_medium_priority.md](./phase4_medium_priority.md) - Input validation details
- [phase5_testing.md](./phase5_testing.md) - Testing procedures
- [audit_report.md](./audit_report.md) - Vulnerability details
- [test_payloads.md](./test_payloads.md) - Test cases

---

**Document Version**: 1.0
**Last Updated**: 2025-11-29
**Status**: Ready for Use

**⚠️ IMPORTANT**: Use only when absolutely necessary. All rollbacks should be followed by root cause analysis and re-implementation with fixes.
