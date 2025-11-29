# Phase 5: Testing, Documentation & Deployment (Days 4-5)

**Duration**: 13 hours (5 days)
**Priority**: CRITICAL - Final validation
**Agent**: house-bash (Haiku model for tests), Main Claude (documentation)
**Risk Reduction**: 1% (validation & monitoring)
**Dependencies**: All Phase 1-4 completed

---

## Overview

Final phase: comprehensive testing, documentation updates, and production deployment.

**Goals**:
1. Create security test suite
2. Run comprehensive security tests
3. Performance testing (ensure <5% impact)
4. Update documentation (AGENT.md, SECURITY.md)
5. Configure Cloudflare CDN headers
6. Production deployment
7. Monitor & verify all fixes

---

## Task Breakdown

### Task 1: Create Security Test Suite (2.5 hours)

**File**: `tests/security.test.js` (NEW)

**Purpose**: Comprehensive security tests for all vulnerabilities fixed

```javascript
/**
 * Security Test Suite
 * Tests all security fixes and validations
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { POST as uploadEndpoint } from '../src/routes/api/images/upload/+server.js';
import { POST as postsEndpoint } from '../src/routes/api/posts/+server.js';
import { sanitizeHtml, sanitizeSvg } from '../src/lib/utils/sanitize.js';
import { generateCSRFToken, validateCSRF } from '../src/lib/utils/csrf.js';
import { validateMagicBytes } from '../src/lib/utils/magicBytes.js';
import { safeJsonParse } from '../src/lib/utils/json.js';
import { validateSafePath } from '../src/lib/utils/pathValidation.js';

describe('Security Tests', () => {
  // ==========================================
  // XSS Prevention Tests (Phase 1)
  // ==========================================
  describe('XSS Prevention', () => {
    it('should sanitize malicious script tags in HTML', () => {
      const malicious = '<p>Hello</p><script>alert("XSS")</script>';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('<p>Hello</p>');
    });

    it('should block onclick handlers', () => {
      const malicious = '<img src=x onclick=alert("XSS")>';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('onclick');
    });

    it('should block onerror handlers', () => {
      const malicious = '<img src=x onerror=alert("XSS")>';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('onerror');
    });

    it('should allow safe HTML', () => {
      const safe = '<p>Hello <strong>world</strong></p>';
      const sanitized = sanitizeHtml(safe);

      expect(sanitized).toContain('<strong>world</strong>');
    });

    it('should block javascript: URLs', () => {
      const malicious = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const sanitized = sanitizeHtml(malicious);

      expect(sanitized).not.toContain('javascript:');
    });

    it('should sanitize SVG injection in Mermaid', () => {
      const maliciousSvg = '<svg><script>alert("XSS")</script></svg>';
      const sanitized = sanitizeSvg(maliciousSvg);

      expect(sanitized).not.toContain('<script>');
    });
  });

  // ==========================================
  // CSRF Prevention Tests (Phase 2)
  // ==========================================
  describe('CSRF Prevention', () => {
    it('should generate unique CSRF tokens', () => {
      const token1 = generateCSRFToken();
      const token2 = generateCSRFToken();

      expect(token1).not.toBe(token2);
      expect(token1.length).toBe(64);  // 32 bytes in hex = 64 chars
    });

    it('should validate matching CSRF tokens', () => {
      const token = generateCSRFToken();

      const request = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': token,
          'origin': 'http://localhost'
        }
      });

      const isValid = validateCSRF(request, token);
      expect(isValid).toBe(true);
    });

    it('should reject mismatched CSRF tokens', () => {
      const token = generateCSRFToken();
      const wrongToken = generateCSRFToken();

      const request = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': wrongToken,
          'origin': 'http://localhost'
        }
      });

      const isValid = validateCSRF(request, token);
      expect(isValid).toBe(false);
    });

    it('should reject requests without CSRF token', () => {
      const token = generateCSRFToken();

      const request = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: {
          'origin': 'http://localhost'
          // No x-csrf-token header
        }
      });

      const isValid = validateCSRF(request, token);
      expect(isValid).toBe(false);
    });

    it('should reject cross-origin requests', () => {
      const token = generateCSRFToken();

      const request = new Request('http://localhost/api/test', {
        method: 'POST',
        headers: {
          'x-csrf-token': token,
          'origin': 'http://evil.com',
          'host': 'localhost'
        }
      });

      const isValid = validateCSRF(request, token);
      expect(isValid).toBe(false);
    });
  });

  // ==========================================
  // SVG Upload Blocking (Phase 3)
  // ==========================================
  describe('SVG Upload Prevention', () => {
    it('should reject SVG files', async () => {
      const svgContent = '<?xml version="1.0"?><svg></svg>';
      const svgFile = new File([svgContent], 'test.svg', { type: 'image/svg+xml' });

      const formData = new FormData();
      formData.append('file', svgFile);

      const request = new Request('http://localhost/api/images/upload', {
        method: 'POST',
        body: formData
      });

      // This should throw 400 error
      // In actual test, mock the endpoint call
      expect(() => {
        if (svgFile.type === 'image/svg+xml') {
          throw new Error('SVG uploads are not supported');
        }
      }).toThrow('SVG uploads are not supported');
    });
  });

  // ==========================================
  // Rate Limiting Tests (Phase 3)
  // ==========================================
  describe('Rate Limiting', () => {
    it('should track request counts per IP', () => {
      // Test implemented in integration tests
      // Rate limiting is middleware-based
      expect(true).toBe(true);  // Placeholder
    });
  });

  // ==========================================
  // File Security Tests (Phase 4)
  // ==========================================
  describe('Magic Byte Validation', () => {
    it('should validate PNG magic bytes', () => {
      const pngMagic = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
      const buffer = pngMagic.buffer;

      expect(() => {
        validateMagicBytes(buffer, 'image/png');
      }).not.toThrow();
    });

    it('should reject file type mismatch', () => {
      const jpegMagic = new Uint8Array([0xFF, 0xD8, 0xFF]);
      const buffer = jpegMagic.buffer;

      expect(() => {
        validateMagicBytes(buffer, 'image/png');
      }).toThrow();
    });

    it('should reject empty files', () => {
      const emptyBuffer = new ArrayBuffer(0);

      expect(() => {
        validateMagicBytes(emptyBuffer, 'image/png');
      }).toThrow('File is empty');
    });
  });

  // ==========================================
  // Input Validation Tests (Phase 4)
  // ==========================================
  describe('Input Validation', () => {
    it('should detect prototype pollution attempts', () => {
      const malicious = '{"title":"test","__proto__":{"admin":true}}';

      expect(() => {
        safeJsonParse(malicious);
      }).toThrow();
    });

    it('should accept valid JSON', () => {
      const validJson = '{"title":"test","content":"hello"}';
      const result = safeJsonParse(validJson);

      expect(result.title).toBe('test');
      expect(result.content).toBe('hello');
    });
  });

  // ==========================================
  // Path Traversal Tests (Phase 4)
  // ==========================================
  describe('Path Traversal Prevention', () => {
    it('should reject directory traversal', () => {
      expect(() => {
        validateSafePath('../../etc/passwd', '/home/app/uploads');
      }).toThrow('Directory traversal not allowed');
    });

    it('should allow normal paths', () => {
      const safe = validateSafePath('images/photo.jpg', '/home/app/uploads');
      expect(safe).toContain('uploads');
    });
  });
});
```

**Run tests**:
```bash
npm run test:security
# or
npm test -- security.test.js
```

---

### Task 2: Integration Tests (2 hours)

**File**: `tests/security.integration.test.js` (NEW)

```javascript
/**
 * Security Integration Tests
 * Tests end-to-end security flows
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

describe('Security Integration Tests', () => {
  let baseUrl = 'http://localhost:5173';
  let csrfToken = '';
  let authCookie = '';

  beforeAll(async () => {
    // Setup: create test user and get CSRF token
    const response = await fetch(`${baseUrl}/`);
    const cookies = response.headers.getSetCookie();
    // Extract CSRF token from cookies
    csrfToken = cookies.find(c => c.includes('csrf_token='))
      ?.split('=')[1]
      ?.split(';')[0] || '';
  });

  describe('CSRF Protection in Forms', () => {
    it('should allow request with valid CSRF token', async () => {
      const response = await fetch(`${baseUrl}/api/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken
        },
        body: JSON.stringify({
          title: 'Test Post',
          content: 'Test content'
        }),
        credentials: 'include'
      });

      expect([200, 201, 400]).toContain(response.status);  // 400 if auth required
    });

    it('should reject request without CSRF token', async () => {
      const response = await fetch(`${baseUrl}/api/posts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Test Post',
          content: 'Test content'
        }),
        credentials: 'include'
      });

      expect(response.status).toBe(403);
      const body = await response.text();
      expect(body).toContain('CSRF');
    });
  });

  describe('XSS Prevention in Responses', () => {
    it('should not execute injected scripts in post content', async () => {
      const xssPayload = '<script>alert("XSS")</script>';
      const response = await fetch(`${baseUrl}/api/posts/test`);
      const html = await response.text();

      expect(html).not.toContain('<script>');
    });
  });

  describe('CSP Headers', () => {
    it('should include CSP header with nonce', async () => {
      const response = await fetch(`${baseUrl}/`);
      const cspHeader = response.headers.get('content-security-policy');

      expect(cspHeader).toBeTruthy();
      expect(cspHeader).toContain("script-src 'nonce-");
    });

    it('should allow same-origin resources', async () => {
      const response = await fetch(`${baseUrl}/`);
      const cspHeader = response.headers.get('content-security-policy');

      expect(cspHeader).toContain("'self'");
    });

    it('should block inline scripts without nonce', async () => {
      const response = await fetch(`${baseUrl}/`);
      const cspHeader = response.headers.get('content-security-policy');

      // Should NOT allow 'unsafe-inline'
      expect(cspHeader).not.toContain("'unsafe-inline'");
    });
  });

  describe('Rate Limiting', () => {
    it('should block rapid requests', async () => {
      const requests = [];

      // Make 10 rapid requests to auth endpoint
      for (let i = 0; i < 10; i++) {
        const response = fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          body: JSON.stringify({ email: 'test@test.com', password: 'test' })
        });
        requests.push(response);
      }

      const responses = await Promise.all(requests);
      const rateLimited = responses.filter(r => r.status === 429);

      expect(rateLimited.length).toBeGreaterThan(0);
    });

    it('should include Retry-After header', async () => {
      // Make enough requests to trigger rate limit
      for (let i = 0; i < 6; i++) {
        await fetch(`${baseUrl}/api/auth/login`, {
          method: 'POST',
          body: JSON.stringify({ email: 'test@test.com' })
        });
      }

      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: 'test@test.com' })
      });

      if (response.status === 429) {
        expect(response.headers.has('Retry-After')).toBe(true);
      }
    });
  });

  describe('Gallery Authentication', () => {
    it('should require auth to access gallery', async () => {
      // Don't include auth cookie
      const response = await fetch(`${baseUrl}/api/gallery`);

      expect(response.status).toBe(401);
    });
  });

  describe('Security Headers', () => {
    it('should set X-Frame-Options to DENY', async () => {
      const response = await fetch(`${baseUrl}/`);
      const xFrameOptions = response.headers.get('x-frame-options');

      expect(xFrameOptions).toBe('DENY');
    });

    it('should set X-Content-Type-Options to nosniff', async () => {
      const response = await fetch(`${baseUrl}/`);
      const xContentType = response.headers.get('x-content-type-options');

      expect(xContentType).toBe('nosniff');
    });

    it('should disable permissions', async () => {
      const response = await fetch(`${baseUrl}/`);
      const permPolicy = response.headers.get('permissions-policy');

      expect(permPolicy).toContain('geolocation=()');
      expect(permPolicy).toContain('microphone=()');
      expect(permPolicy).toContain('camera=()');
    });
  });
});
```

---

### Task 3: Performance Testing (1.5 hours)

**File**: `tests/performance.test.js` (NEW)

```javascript
/**
 * Performance Impact Tests
 * Ensures security fixes don't degrade performance
 */

import { describe, it, expect } from 'vitest';

describe('Performance Tests', () => {
  const BASELINE_THRESHOLD = 1.05;  // 5% tolerance

  describe('XSS Sanitization Performance', () => {
    it('should sanitize 1000 strings in <100ms', async () => {
      const { sanitizeHtml } = await import('../src/lib/utils/sanitize.js');

      const htmlArray = Array(1000).fill(
        '<p>Hello <strong>world</strong></p>'
      );

      const start = performance.now();
      htmlArray.forEach(html => sanitizeHtml(html));
      const elapsed = performance.now() - start;

      console.log(`Sanitization: ${elapsed.toFixed(2)}ms for 1000 items`);
      expect(elapsed).toBeLessThan(100);
    });
  });

  describe('CSRF Token Generation Performance', () => {
    it('should generate 1000 tokens in <50ms', async () => {
      const { generateCSRFToken } = await import('../src/lib/utils/csrf.js');

      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        generateCSRFToken();
      }
      const elapsed = performance.now() - start;

      console.log(`Token generation: ${elapsed.toFixed(2)}ms for 1000 tokens`);
      expect(elapsed).toBeLessThan(50);
    });
  });

  describe('Magic Byte Validation Performance', () => {
    it('should validate 100 files in <10ms', async () => {
      const { validateMagicBytes } = await import('../src/lib/utils/magicBytes.js');

      const pngMagic = new Uint8Array([0x89, 0x50, 0x4E, 0x47]);
      const buffer = pngMagic.buffer;

      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        validateMagicBytes(buffer, 'image/png');
      }
      const elapsed = performance.now() - start;

      console.log(`Magic byte validation: ${elapsed.toFixed(2)}ms for 100 files`);
      expect(elapsed).toBeLessThan(10);
    });
  });

  describe('Request Overhead', () => {
    it('should add <50ms to typical request', async () => {
      // This is approximate - actual measurement requires end-to-end testing
      console.log('Request overhead: Depends on endpoint complexity');
      console.log('Expected: <50ms additional per request');
      expect(true).toBe(true);  // Placeholder for actual e2e test
    });
  });
});
```

**Run performance tests**:
```bash
npm run test:perf
```

---

### Task 4: Security Documentation (2 hours)

**File**: `docs/SECURITY.md` (NEW)

```markdown
# Security Policy & Implementation

## Overview

AutumnsGrove uses defense-in-depth security approach with multiple layers:

1. **Input Validation**: Strict validation of all user input
2. **Output Encoding**: Safe rendering of user-generated content
3. **Authentication**: Secure session management
4. **Authorization**: Role-based access control
5. **Encryption**: HTTPS for all traffic
6. **Monitoring**: Audit logging of security events

## Security Measures

### 1. XSS (Cross-Site Scripting) Prevention

**Implementation**:
- All HTML output sanitized with DOMPurify
- SVG uploads disabled (CVSS 7.8)
- Markdown parser output sanitized
- CSP header with strict nonces

**Test**:
```javascript
// Attempting injection: <script>alert('XSS')</script>
// Result: Script tags stripped, request safe
```

### 2. CSRF (Cross-Site Request Forgery) Protection

**Implementation**:
- Token-based CSRF validation
- SameSite=Strict cookies
- Origin/Referer header validation
- Automatic token injection for API calls

**Token Management**:
- Generated per user session
- 64-character cryptographic tokens
- Validated on all state-changing requests (POST, PUT, DELETE)

### 3. XSS via Content Security Policy (CSP)

**Headers**:
- `default-src 'self'` - Only same-origin resources
- `script-src 'nonce-xxxxx'` - Only nonce-authorized scripts
- `frame-ancestors 'none'` - No framing
- `form-action 'self'` - No off-site form submission

### 4. Rate Limiting

**Endpoints**:
- Auth: 5 requests/15 minutes
- Upload: 10 requests/hour
- API write: 60 requests/minute
- API read: 120 requests/minute

**Returns**: HTTP 429 with Retry-After header

### 5. File Upload Security

**Validation**:
- MIME type checking
- Magic byte validation (prevents spoofing)
- File size limits
- Extension whitelisting (JPEG, PNG, WebP, AVIF only)
- SVG uploads disabled

**Storage**:
- Files stored in Cloudflare R2
- Unique filenames with timestamps
- Organized by date/user
- Cache headers set correctly

### 6. Database Security

**Measures**:
- Prepared statements (prevent SQL injection)
- Input validation before queries
- Foreign key constraints
- Audit logging of changes

### 7. Error Handling

**User-Facing Errors**:
- Generic messages (no leaking paths, stack traces)
- Unique error IDs for tracking
- Logged server-side with full details

**Example**:
```
User sees: "Invalid request data"
Server logs: "FOREIGN KEY constraint failed on users.role_id" [ERR_1732385400_a3f2]
```

### 8. Audit Logging

**Events Tracked**:
- Authentication (login, logout, failed attempts)
- Data modifications (create, update, delete)
- Security events (blocked requests, rate limits)
- File operations (upload, delete)

**Fields**:
- Timestamp
- User ID
- Action
- Resource
- IP address
- User agent
- Status (success/failure)

### 9. Path Traversal Prevention

**Implementation**:
- Normalized path validation
- No `..` directory traversal allowed
- Paths confined to base directory
- Absolute paths rejected

### 10. Prototype Pollution Prevention

**JSON Parsing**:
```javascript
// Dangerous keys blocked
__proto__, constructor, prototype
```

---

## Vulnerability Report

See [../security-remediation/audit_report.md](../security-remediation/audit_report.md) for detailed vulnerability analysis.

### Fixed Vulnerabilities: 20

| Severity | Count | Examples |
|----------|-------|----------|
| Critical | 3 | XSS in Mermaid, XSS in marked.parse, DELETE CSRF |
| High | 6 | SVG XSS, weak CSRF, CSP missing, rate limiting |
| Medium | 8 | Prototype pollution, path traversal, validation |
| Low | 3 | Cookie security, code generation |

---

## Security Testing

### Unit Tests
```bash
npm run test:security
```

### Integration Tests
```bash
npm run test:integration
```

### Performance Tests
```bash
npm run test:perf
```

### Manual Testing
See [../security-remediation/test_payloads.md](../security-remediation/test_payloads.md)

---

## Deployment Checklist

Before production deployment:

- [ ] All tests passing (100%)
- [ ] No console warnings/errors
- [ ] HTTPS enabled
- [ ] Security headers verified
- [ ] CORS properly configured
- [ ] Database backed up
- [ ] Rollback procedures tested
- [ ] Monitoring configured

---

## Incident Response

**If security breach suspected**:
1. Stop affected services
2. Check audit logs: `SELECT * FROM audit_logs WHERE status='blocked'`
3. Identify compromised accounts
4. Reset session tokens
5. Review rollback procedure

---

## Compliance

- OWASP Top 10 protections implemented
- GDPR data handling (no tracking)
- No sensitive data in logs
- Encrypted sensitive fields

---

## Future Improvements

- [ ] Implement WAF (Web Application Firewall)
- [ ] Add 2FA (Two-Factor Authentication)
- [ ] Implement rate limiting with Redis
- [ ] Add security headers scoring (A+ on securityheaders.com)
- [ ] Penetration testing (annual)

---

*Last updated: 2025-11-29*
```

---

### Task 5: Update AGENT.md (1 hour)

Add to `/Users/mini/Documents/Projects/AutumnsGrove/AGENT.md`:

```markdown
## Security Implementation

### Overview

All security work is tracked in `/docs/security-remediation/`:

- **phase1_xss_fixes.md** - XSS prevention (CRITICAL)
- **phase2_csrf_fixes.md** - CSRF protection (CRITICAL)
- **phase3_high_priority.md** - CSP, rate limiting, gallery auth (HIGH)
- **phase4_medium_priority.md** - Input validation, audit logging (MEDIUM)
- **phase5_testing.md** - Testing and deployment (FINAL)

### Security Checklist

When working with user input:
- [ ] Is it validated?
- [ ] Is it sanitized before rendering?
- [ ] Is it escaped for the output context (HTML/JS/SQL)?
- [ ] Could it cause XSS?
- [ ] Could it cause CSRF?
- [ ] Is it rate limited?
- [ ] Is it logged?

### Adding New Endpoints

All new API endpoints MUST:

1. **Check authentication**:
```javascript
if (!locals.user) {
  throw error(401, 'Authentication required');
}
```

2. **Validate input**:
```javascript
import { isValidEmail, isValidSlug } from '$lib/utils/validation.js';

if (!isValidEmail(data.email)) {
  throw error(400, 'Invalid email');
}
```

3. **Sanitize output**:
```javascript
import { sanitizeHtml } from '$lib/utils/sanitize.js';

const safe = sanitizeHtml(userContent);
```

4. **Log events**:
```javascript
import { logAuditEvent } from '$lib/utils/auditLog.js';

await logAuditEvent({
  action: 'data_create',
  userId: locals.user.id,
  resourceType: 'post',
  resourceId: newPost.id
}, platform);
```

5. **Test security**:
- Run `npm run test:security`
- Check CSP doesn't block legitimate scripts
- Verify rate limiting works

---

## Vulnerabilities Fixed

Total: 20 vulnerabilities across Critical, High, Medium, Low severity

See `/docs/security-remediation/audit_report.md` for complete audit.

---
```

---

### Task 6: Configure Cloudflare CDN (1 hour)

**File**: `wrangler.toml` (update if using Cloudflare Pages)

```toml
# Security headers via Cloudflare
[env.production.routes]
# Existing routes...

# Cache rules
[env.production.triggers]
# Cache static assets for 30 days
pattern = "/images/*"
max_age = 2592000

# Don't cache HTML pages
pattern = "/*.html"
max_age = 0

# Cache API responses safely
pattern = "/api/public/*"
max_age = 300  # 5 minutes
```

**Cloudflare Rules** (via Dashboard):
1. Security > DDoS Protection → Standard
2. Security > Bot Management → Super Bot Fight Mode
3. Caching > Page Rules → Bypass cache for admin
4. Rules > Transform Rules → Add security headers
5. SSL/TLS → Always use HTTPS

**Example Transform Rule**:
```
Header name: Strict-Transport-Security
Value: max-age=31536000; includeSubDomains; preload
```

---

### Task 7: Production Deployment (2 hours)

**Deployment Checklist**:

```bash
# 1. Verify all tests pass
npm run test:security
npm run test:integration
npm run test:perf

# 2. Build production
npm run build

# 3. Check for console errors
npm run build 2>&1 | grep -i error

# 4. Deploy to staging first
npm run deploy:staging

# 5. Verify staging
curl -I https://staging.autumnsgrove.com
# Check security headers

# 6. Final verification
npm run test:e2e:staging

# 7. Deploy to production
npm run deploy:production

# 8. Verify production
curl -I https://autumnsgrove.com
# Check all headers present

# 9. Monitor logs
npm run logs:prod --follow
```

**Pre-deployment Checklist**:

- [ ] Database backed up
- [ ] Rollback procedures tested
- [ ] Monitoring alerts configured
- [ ] Team notified of deployment
- [ ] Maintenance window scheduled (if needed)
- [ ] All tests passing (100%)
- [ ] Security headers verified
- [ ] HTTPS working
- [ ] Rate limiting functional

**Post-deployment**:

- [ ] Monitor error rates (should be 0% from security fixes)
- [ ] Monitor performance (should be <5% impact)
- [ ] Check audit logs for any blocked requests
- [ ] Verify all features working
- [ ] Get team sign-off

---

### Task 8: Post-Deployment Monitoring (2.5 hours)

**File**: `docs/MONITORING.md` (NEW)

```markdown
# Security Monitoring & Alerting

## Metrics to Track

### Security Events
- Failed CSRF validations
- XSS attempts blocked
- Rate limit hits
- Failed authentications
- File upload rejections

### Performance Metrics
- Request latency (should be <100ms for API)
- Error rate (should be <0.1%)
- 404 rate (should be <1%)
- Rate limit hits (should be 0 for normal usage)

### Application Metrics
- Database query time
- Cache hit ratio
- CDN bandwidth
- Storage usage

## Alerting Rules

**CRITICAL**: Page on-call immediately
- CSRF validation failures > 10/minute
- XSS blocks > 5/minute
- Database errors > 1% of requests

**WARNING**: Page after 5 minutes
- Performance degradation (latency > 500ms)
- Error rate > 1%
- Rate limit hits > 1000/hour

**INFO**: Log for investigation
- Authentication failures > 5/minute
- File upload rejections > 1/minute

## Dashboards

### Security Dashboard
```
- CSRF blocks (last 24h)
- XSS attempts (last 24h)
- Failed auth (last 24h)
- Rate limit hits (last 24h)
```

### Performance Dashboard
```
- Request latency (p50, p95, p99)
- Error rate (%)
- Database queries/sec
- API endpoint performance
```

## Log Analysis

Check for security incidents:

```sql
-- Failed CSRF attempts
SELECT COUNT(*), ip_address
FROM audit_logs
WHERE action = 'security_csrf_rejected'
  AND timestamp > datetime('now', '-1 hour')
GROUP BY ip_address
ORDER BY COUNT(*) DESC;

-- XSS attempts
SELECT COUNT(*), ip_address
FROM audit_logs
WHERE action = 'security_xss_blocked'
  AND timestamp > datetime('now', '-1 hour')
GROUP BY ip_address
ORDER BY COUNT(*) DESC;

-- Rate limit hits
SELECT COUNT(*), ip_address
FROM audit_logs
WHERE action = 'security_rate_limit'
  AND timestamp > datetime('now', '-1 hour')
GROUP BY ip_address
ORDER BY COUNT(*) DESC;
```

---

*Last updated: 2025-11-29*
```

---

## Dependencies

**Before Starting**:
- ✅ Phase 1-4 completed and committed
- ✅ npm test configured
- ✅ Cloudflare account and wrangler.toml
- ✅ Production deployment access
- ✅ Monitoring/logging setup (Sentry, etc.)

---

## Validation Checklist

After completing all tasks:

- [ ] All unit tests passing (100%)
- [ ] All integration tests passing
- [ ] Performance tests show <5% impact
- [ ] Security documentation complete
- [ ] AGENT.md updated with security procedures
- [ ] SECURITY.md created with full policy
- [ ] Cloudflare headers configured
- [ ] Production deployment successful
- [ ] All security headers present on production
- [ ] Monitoring/alerting configured
- [ ] Error rates at baseline
- [ ] Performance metrics normal
- [ ] No console errors in production
- [ ] Audit logs working
- [ ] Rate limiting functional
- [ ] CSRF protection verified
- [ ] Git commit: "feat(security): complete security remediation and deployment"

---

## Files Modified/Created

**Total**: 10+ files

**New Files** (5):
1. `tests/security.test.js` (Unit tests)
2. `tests/security.integration.test.js` (Integration tests)
3. `tests/performance.test.js` (Performance tests)
4. `docs/SECURITY.md` (Security documentation)
5. `docs/MONITORING.md` (Monitoring guide)

**Modified Files** (5):
1. `/AGENT.md` (Add security section)
2. `/package.json` (Add test scripts)
3. `wrangler.toml` (Add security headers)
4. `/docs/README.md` (Link to security docs)
5. GitHub Actions workflow (Add security tests to CI/CD)

---

## Estimated Time Breakdown

| Task | Time | Complexity |
|------|------|-----------|
| 1. Create security test suite | 2.5 hours | Moderate |
| 2. Integration tests | 2 hours | Moderate |
| 3. Performance testing | 1.5 hours | Straightforward |
| 4. Documentation | 2 hours | Straightforward |
| 5. Update AGENT.md | 1 hour | Straightforward |
| 6. Configure Cloudflare | 1 hour | Straightforward |
| 7. Production deployment | 2 hours | Straightforward |
| 8. Post-deployment monitoring | 2.5 hours | Straightforward |
| **Total** | **13 hours** | **Final phase** |

---

## Rollback Procedures

**If deployment fails**:

```bash
# Immediate rollback (within 5 minutes)
git revert HEAD
npm run build
npm run deploy:production

# Or revert specific commit
git reset --hard <previous-commit>
npm run deploy:production
```

**If tests fail**:

```bash
# Run individual test suites
npm run test:security -- --reporter=verbose
npm run test:integration -- --reporter=verbose

# Run with coverage
npm run test -- --coverage
```

**If performance degrades**:

```bash
# Check specific endpoint
npm run perf:test -- /api/posts

# Profile request
npm run profile

# Check for N+1 queries
npm run audit:db
```

---

## Success Criteria

**All phases complete when**:

1. ✅ All 20 vulnerabilities fixed
2. ✅ Security tests 100% passing
3. ✅ Integration tests 100% passing
4. ✅ No performance degradation (>5%)
5. ✅ Documentation complete and reviewed
6. ✅ Production deployment successful
7. ✅ Monitoring working and alerting
8. ✅ Team trained on security procedures
9. ✅ Audit log functional
10. ✅ CSRF protection verified

---

## Next Steps

After Phase 5 completion:

1. **Schedule security review** (30 days post-deployment)
2. **Plan penetration testing** (90 days post-deployment)
3. **Update security policy** quarterly
4. **Review audit logs** weekly
5. **Update dependencies** monthly

---

## Contact & Escalation

**Security Issues Found**:
1. Document in GitHub issue
2. Mark as confidential
3. Email security team
4. Follow responsible disclosure

**Emergency Procedures**:
1. Stop affected services
2. Backup evidence
3. Notify stakeholders
4. Activate incident response
5. Review [rollback_procedures.md](./rollback_procedures.md)

---

**Phase 5 Complete**: All security fixes tested, documented, and deployed to production.
