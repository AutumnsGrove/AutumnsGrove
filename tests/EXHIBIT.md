# The Security Lab: Testing the Castle Walls

Welcome to the testing gallery. This is where we don't just hope things work—we prove it. Every line of code that protects this site has a corresponding test that says, "Yes, this actually does what you think it does."

Think of this as the quality assurance department of a fortress. The walls might look solid, but someone needs to actually try to break in to know for sure.

---

## What You're Looking At

The `tests/` directory contains a focused **security test suite**. This isn't about testing that buttons click or forms submit—it's about testing that attackers can't:

- Forge requests on your behalf (CSRF)
- Inject malicious scripts (XSS)
- Bypass file upload restrictions
- Traverse paths to read sensitive files
- Pollute JavaScript prototypes
- Inject SQL into your database

Every test here represents a real attack vector that's been blocked, verified, and documented.

---

## The Testing Philosophy

This project uses **Vitest** with **@testing-library/svelte** for testing. But the philosophy matters more than the tools:

```
┌──────────────────────────────────────────────────────────────────┐
│                       SECURITY FIRST                              │
│  We test the things that, if broken, would be catastrophic.      │
│  Not "the button is blue" but "the attacker can't steal tokens." │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                      ATTACK SCENARIOS                             │
│  Each test simulates what a real attacker would try.             │
│  Not "does this function return true" but "can I bypass this?"   │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│                     DEFENSE IN DEPTH                              │
│  Multiple layers of tests for multiple layers of protection.     │
│  If one test fails, another should catch the same attack.        │
└──────────────────────────────────────────────────────────────────┘
```

---

## The Test Files

| File | What It Guards |
|------|----------------|
| `security/csrf.test.js` | Request forgery attacks |
| `security/xss.test.js` | Script injection attacks |
| `security/headers.test.js` | HTTP security headers |
| `security/validation.test.js` | Input validation and sanitization |
| `security/uploads.test.js` | File upload security |
| `setup.js` | Test environment configuration |

---

## CSRF Protection Tests

Cross-Site Request Forgery is when an attacker tricks your browser into making requests you didn't intend. The tests verify:

### Token Generation
```javascript
it('should generate unique tokens', () => {
  const token1 = generateCSRFToken();
  const token2 = generateCSRFToken();

  expect(token1).not.toBe(token2);
});

it('should generate tokens in UUID format', () => {
  const token = generateCSRFToken();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  expect(token).toMatch(uuidRegex);
});
```

Every token must be unique. Predictable tokens are exploitable tokens.

### Origin Validation
```javascript
it('should reject cross-origin requests', () => {
  const mockRequest = {
    headers: {
      get: (key) => ({
        'origin': 'https://evil.com',
        'host': 'autumnsgrove.com'
      }[key])
    }
  };

  expect(validateCSRF(mockRequest)).toBe(false);
});

it('should reject subdomain attacks', () => {
  // evil.autumnsgrove.com is NOT autumnsgrove.com
  const mockRequest = {
    headers: {
      get: (key) => ({
        'origin': 'https://evil.autumnsgrove.com',
        'host': 'autumnsgrove.com'
      }[key])
    }
  };

  expect(validateCSRF(mockRequest)).toBe(false);
});
```

The origin must match exactly. Subdomains don't count.

---

## XSS Protection Tests

Cross-Site Scripting is when attackers inject malicious scripts into pages. The tests verify sanitization strips dangerous content:

### Script Tag Removal
```javascript
it('should remove script tags', () => {
  const malicious = '<p>Hello</p><script>alert("XSS")</script>';
  const clean = sanitizeHTML(malicious);

  expect(clean).not.toContain('<script>');
  expect(clean).not.toContain('alert');
  expect(clean).toContain('<p>Hello</p>');
});
```

### Event Handler Removal
```javascript
it('should remove onclick event handlers', () => {
  const malicious = "<div onclick=\"alert('XSS')\">Click me</div>";
  const clean = sanitizeHTML(malicious);

  expect(clean).not.toContain('onclick');
});

it('should remove onerror from img tags', () => {
  const malicious = '<img src=x onerror="alert(1)">';
  const clean = sanitizeHTML(malicious);

  expect(clean).not.toContain('onerror');
});
```

Event handlers are a common XSS vector. Every `on*` attribute must be stripped.

### Protocol Sanitization
```javascript
it('should remove javascript: protocol', () => {
  const malicious = '<a href="javascript:alert(1)">Click</a>';
  const clean = sanitizeHTML(malicious);

  expect(clean).not.toContain('javascript:');
});

it('should remove data: protocol URIs', () => {
  const malicious = '<a href="data:text/html,<script>alert(1)</script>">Click</a>';
  const clean = sanitizeHTML(malicious);

  expect(clean).not.toContain('data:text/html');
});
```

URLs can execute code too. Only `http://`, `https://`, and relative paths are safe.

---

## Security Headers Tests

HTTP headers tell browsers how to behave. The right headers prevent entire categories of attacks:

### Content Security Policy
```javascript
it('should include nonce-based script-src', () => {
  const nonce = 'test-nonce-123';
  const csp = buildCSP(nonce);

  expect(csp).toContain(`script-src 'self' 'nonce-${nonce}'`);
});

it('should not include unsafe-inline for scripts', () => {
  const csp = buildCSP('test-nonce');

  expect(csp).not.toContain("'unsafe-inline'");
});

it('should not include unsafe-eval', () => {
  const csp = buildCSP('test-nonce');

  expect(csp).not.toContain("'unsafe-eval'");
});
```

A proper CSP blocks inline scripts entirely. Only scripts with the correct nonce execute.

### Clickjacking Protection
```javascript
it('should set X-Frame-Options to DENY', () => {
  const headers = buildSecurityHeaders();

  expect(headers['X-Frame-Options']).toBe('DENY');
});

it('should prevent frame-ancestors in CSP', () => {
  const csp = buildCSP('nonce');

  expect(csp).toContain("frame-ancestors 'none'");
});
```

Your site cannot be embedded in an iframe. This prevents clickjacking attacks where attackers overlay invisible buttons.

---

## Input Validation Tests

Every piece of user input is a potential attack vector. These tests verify validation catches common attacks:

### Prototype Pollution Prevention
```javascript
it('should remove __proto__ keys', () => {
  const malicious = { __proto__: { admin: true }, name: 'test' };
  const clean = sanitizeObject(malicious);

  expect(Object.hasOwn(clean, '__proto__')).toBe(false);
  expect(clean.name).toBe('test');
});

it('should handle nested objects', () => {
  const malicious = {
    user: {
      __proto__: { isAdmin: true },
      name: 'Alice'
    }
  };
  const clean = sanitizeObject(malicious);

  expect(Object.hasOwn(clean.user, '__proto__')).toBe(false);
});
```

Prototype pollution can escalate to remote code execution. These keys must be stripped from all user input.

### Path Traversal Prevention
```javascript
it('should reject .. sequences', () => {
  expect(validatePath('../etc/passwd')).toBe(false);
});

it('should reject paths starting with /', () => {
  expect(validatePath('/etc/passwd')).toBe(false);
});

it('should reject null byte injection', () => {
  expect(validatePath('file\0.txt')).toBe(false);
});

it('should reject encoded path traversal', () => {
  const decoded = decodeURIComponent('..%2F..%2Fetc%2Fpasswd');
  expect(validatePath(decoded)).toBe(false);
});
```

Attackers use `../` to escape intended directories. Null bytes can truncate filenames. URL encoding can hide attack patterns.

### SQL Injection Detection
```javascript
it('should detect basic SQL injection', () => {
  expect(containsSQLInjection("' OR '1'='1")).toBe(true);
});

it('should detect UNION injection', () => {
  expect(containsSQLInjection('UNION SELECT * FROM users')).toBe(true);
});

it('should detect DROP TABLE attempts', () => {
  expect(containsSQLInjection('1; DROP TABLE users;--')).toBe(true);
});
```

While parameterized queries prevent SQL injection at the database layer, detecting it early adds defense in depth.

---

## File Upload Tests

File uploads are one of the most dangerous features a web application can offer. These tests verify multiple layers of protection:

### Magic Byte Validation
```javascript
it('should validate JPEG magic bytes', async () => {
  const jpegBytes = new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]);
  const mockFile = { arrayBuffer: async () => jpegBytes.buffer };

  const result = await validateFileSignature(mockFile, 'image/jpeg');
  expect(result).toBe(true);
});

it('should reject executable disguised as image', async () => {
  // Windows executable magic bytes (MZ header)
  const exeBytes = new Uint8Array([0x4D, 0x5A, 0x90, 0x00]);
  const mockFile = { arrayBuffer: async () => exeBytes.buffer };

  const result = await validateFileSignature(mockFile, 'image/jpeg');
  expect(result).toBe(false);
});
```

File extensions lie. Content-Type headers lie. Only the actual bytes tell the truth.

### Filename Sanitization
```javascript
it('should replace path traversal sequences', () => {
  const malicious = '../../etc/passwd.jpg';
  const clean = sanitizeFilename(malicious);

  expect(clean).not.toContain('..');
});

it('should remove dangerous keywords', () => {
  expect(sanitizeFilename('testscript.js')).not.toContain('script');
  expect(sanitizeFilename('eval_test.py')).not.toContain('eval');
});
```

Filenames can contain attacks too. Strip path traversal, dangerous keywords, and special characters.

### SVG Rejection
```javascript
it('should detect SVG content', () => {
  const svgContent = '<svg><circle cx="50" cy="50" r="40"/></svg>';
  expect(isSVG(svgContent)).toBe(true);
});

it('should detect SVG with XML declaration', () => {
  const svgContent = '<?xml version="1.0"?><svg><circle/></svg>';
  expect(isSVG(svgContent)).toBe(true);
});
```

SVG is XML. XML can contain JavaScript. SVG uploads are XSS vectors disguised as images.

---

## Running the Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run in watch mode during development
pnpm test:watch

# Run only security tests
pnpm test tests/security
```

---

## Patterns Worth Stealing

### 1. **Test the Attack, Not Just the Defense**

Bad: `expect(sanitize('hello')).toBe('hello')`

Good: `expect(sanitize('<script>alert(1)</script>')).not.toContain('<script>')`

Test what attackers would actually try, not just happy paths.

### 2. **Mock at the Boundary**

```javascript
const mockRequest = {
  headers: {
    get: (key) => headers[key]
  }
};
```

Create minimal mocks that behave like real objects. Don't mock implementation details.

### 3. **Multiple Assertions per Attack Vector**

```javascript
it('should reject cross-origin requests', () => {
  expect(validateCSRF(mockRequest)).toBe(false);
});

it('should reject subdomain attacks', () => {
  expect(validateCSRF(subdomainRequest)).toBe(false);
});

it('should reject different port attacks', () => {
  expect(validateCSRF(portRequest)).toBe(false);
});
```

Each variation of an attack gets its own test. When one fails, you know exactly what's broken.

### 4. **Edge Cases Are Security Cases**

```javascript
it('should handle null request object', () => {
  expect(() => validateCSRF(null)).not.toThrow();
});

it('should handle request without headers', () => {
  expect(() => validateCSRF({})).not.toThrow();
});
```

Crashes are denial of service vulnerabilities. Graceful handling of malformed input is a security requirement.

### 5. **Document Why, Not Just What**

```javascript
/**
 * CSRF Protection Test Suite
 *
 * Tests Cross-Site Request Forgery protection mechanisms.
 * Verifies that:
 * - CSRF tokens are properly generated and validated
 * - Cross-origin requests are blocked
 * - Same-origin requests are allowed
 */
```

Future you (and future contributors) need to understand the threat model, not just the test mechanics.

---

## Lessons Learned

1. **Security tests are living documentation.** They show exactly what attacks the system defends against.

2. **Tests don't make code secure—they prove it.** Write the secure code first, then write tests to verify it stays secure.

3. **Edge cases are where security breaks.** Empty strings, null values, unusual encodings—these are where vulnerabilities hide.

4. **Mock realistically.** If your mocks don't behave like real requests, your tests prove nothing.

5. **Test at multiple layers.** Validation should happen at the edge (API layer), in utilities (sanitization functions), and in the database layer (parameterized queries).

6. **Failing tests are signals, not problems.** When a security test fails, something important changed. Investigate before fixing.

---

## The Connection

Every test in this directory connects to code elsewhere in the codebase:

- CSRF tests verify `hooks.server.js` and `validateCSRF` from GroveEngine
- XSS tests verify `sanitizeHTML`, `sanitizeSVG`, `sanitizeURL` from GroveEngine
- Header tests verify the security headers set in `hooks.server.js`
- Validation tests verify `sanitizeObject` and custom validation functions
- Upload tests verify the file upload handling in API routes

When you change security-critical code, run these tests. When tests fail, understand why before proceeding.

This isn't bureaucracy—it's protection. Every passing test is a verified promise that an attack vector is closed.

---

*Security isn't a feature. It's a foundation. These tests make sure the foundation holds.*
