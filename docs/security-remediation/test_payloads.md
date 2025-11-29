# Security Test Payloads

**Purpose**: Collection of security test cases for manual verification of all fixes

**Usage**: Use these payloads to verify security measures are working

---

## XSS Test Payloads

### Basic Script Injection

```html
<script>alert('XSS')</script>
```

**Expected Result**: Script tags stripped, alert does NOT execute

**Verification**:
```javascript
// Check in browser console
if (document.body.innerHTML.includes('<script>')) {
  console.error('FAIL: Script tag present in DOM');
} else {
  console.log('PASS: Script tags sanitized');
}
```

---

### Event Handler Injection

```html
<img src=x onerror=alert('XSS')>
<div onclick=alert('XSS')>Click me</div>
<body onload=alert('XSS')>
```

**Expected Result**: Event handlers removed or neutralized

**Test Steps**:
1. Paste payload in markdown editor
2. Submit
3. Verify alert does NOT execute
4. Inspect element - should not contain onclick/onerror/onload

---

### JavaScript Protocol

```html
<a href="javascript:alert('XSS')">Click here</a>
<img src="javascript:alert('XSS')">
<iframe src="javascript:alert('XSS')"></iframe>
```

**Expected Result**: javascript: protocol stripped

**Verification**:
```javascript
// Check for javascript: protocol
const hasJavascriptProtocol = document.body.innerHTML.includes('javascript:');
console.assert(!hasJavascriptProtocol, 'javascript: protocol should be blocked');
```

---

### DOM-based XSS

```html
<div id="test"></div>
<script>
document.getElementById('test').innerHTML = '<img src=x onerror=alert("XSS")>';
</script>
```

**Expected Result**: Should be sanitized when set via innerHTML

**Note**: Only relevant if using `innerHTML` directly (should use text content or DOMPurify)

---

### Mermaid Diagram Injection

```markdown
\```mermaid
graph TD
    A[<img src=x onerror=alert('XSS')>]
    B[Normal node]
\```

\```mermaid
graph LR
    A[<script>alert('XSS')</script>]
\```
```

**Expected Result**: No alert appears, diagram renders safely

**Verification**:
```javascript
// Check Mermaid SVG is sanitized
const mermaidSvg = document.querySelector('.mermaid svg');
const hasScript = mermaidSvg.innerHTML.includes('<script>');
console.assert(!hasScript, 'Mermaid SVG should not contain scripts');
```

---

### HTML Entity Encoding

```html
&lt;script&gt;alert('XSS')&lt;/script&gt;
&#60;script&#62;alert('XSS')&#60;/script&#62;
```

**Expected Result**: Entities displayed as text, not executed

---

### SVG-based XSS

```xml
<svg onload=alert('XSS')>
  <circle cx="50" cy="50" r="40" />
</svg>

<svg>
  <script>alert('XSS')</script>
</svg>
```

**Expected Result**: SVG rendered safely without event handlers or scripts

---

### Style Tag Injection

```html
<style>
  @import 'javascript:alert("XSS")';
</style>

<style>
  body { background: url('javascript:alert("XSS")'); }
</style>
```

**Expected Result**: Style tags filtered or content sanitized

---

## CSRF Test Payloads

### Cross-Origin Form Submission

**File**: `csrf_test.html`

```html
<!DOCTYPE html>
<html>
<head>
    <title>CSRF Test</title>
</head>
<body>
    <!-- This form will attempt CSRF attack -->
    <form id="csrf-form" action="https://autumnsgrove.com/api/posts" method="POST">
        <input type="hidden" name="title" value="Hacked Post">
        <input type="hidden" name="content" value="This post was created via CSRF">
        <input type="submit" value="Click me!">
    </form>

    <script>
        // Auto-submit the form
        // document.getElementById('csrf-form').submit();

        // (Commented out for safety)
    </script>
</body>
</html>
```

**Usage**:
1. Host on different domain (e.g., attacker.com)
2. Get logged-in user to visit page
3. Observe: POST request should fail with 403 CSRF validation error

**Expected Result**: 403 Forbidden - CSRF validation failed

---

### JavaScript CSRF Attack

```javascript
// Simulated CSRF attack from another origin
fetch('https://autumnsgrove.com/api/posts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'CSRF Attack Post',
    content: 'This should be blocked'
  }),
  credentials: 'include'  // Include cookies
});
```

**Expected Result**: 403 Forbidden (no CSRF token provided)

**Verification**:
```javascript
// In browser console on different origin
fetch('https://autumnsgrove.com/api/posts', {
  method: 'POST',
  body: JSON.stringify({ title: 'Test' }),
  credentials: 'include'
})
.then(r => r.status === 403 ? 'PASS: CSRF protected' : 'FAIL: No CSRF protection');
```

---

### Missing CSRF Token

```bash
# Using curl (no CSRF token)
curl -X POST https://autumnsgrove.com/api/posts \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","content":"Content"}' \
  -b "session=cookie_value"
```

**Expected Result**: 403 Forbidden - CSRF token missing

---

### Invalid CSRF Token

```bash
# With invalid CSRF token
curl -X POST https://autumnsgrove.com/api/posts \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: invalid_token_12345" \
  -d '{"title":"Test","content":"Content"}' \
  -b "session=cookie_value"
```

**Expected Result**: 403 Forbidden - Token validation failed

---

### Cross-Origin Request

```javascript
// Request from different origin
const response = await fetch('https://autumnsgrove.com/api/posts', {
  method: 'DELETE',
  headers: {
    'Origin': 'https://evil.com',  // Wrong origin
    'X-CSRF-Token': 'any_token'
  },
  body: JSON.stringify({ slug: 'target-post' }),
  credentials: 'include'
});

console.log(response.status);  // Should be 403
```

**Expected Result**: 403 Forbidden - Origin mismatch

---

## SQL Injection Payloads

### Basic SQL Injection

```javascript
// In search or form field
' OR '1'='1
admin'--
1; DROP TABLE posts;--
```

**Expected Result**:
- Should fail validation or show generic error
- Database should not execute injected SQL
- No data deleted or modified

**Verification**: Check audit logs for failed query attempts

---

### Time-based SQL Injection

```javascript
// Slow query to detect SQL injection
' OR SLEEP(5)--
' OR BENCHMARK(10000000, SHA1('test'))--
```

**Expected Result**:
- Response time should be normal (<500ms)
- Should not slow down significantly
- Indicates SQL injection blocked

---

## File Upload Payloads

### SVG Upload

**File**: `malicious.svg`

```xml
<?xml version="1.0" standalone="no"?>
<svg onload="alert('XSS from SVG')">
  <circle cx="50" cy="50" r="40" />
</svg>
```

**Usage**:
1. Try to upload as image
2. Observe: 400 error - "SVG uploads not supported"

**Expected Result**: 400 Bad Request - SVG rejected

---

### Executable Disguised as Image

**File**: `malware.exe` renamed to `photo.jpg`

**Usage**:
1. Rename Windows executable as .jpg
2. Try to upload
3. Observe: File rejected

**Expected Result**: 400 Bad Request - Magic byte validation failed

---

### Large File DoS

```bash
# Create large file (1GB)
dd if=/dev/zero of=large.jpg bs=1M count=1000

# Try to upload
curl -F "file=@large.jpg" https://autumnsgrove.com/api/images/upload
```

**Expected Result**:
- 413 Payload Too Large or
- 429 Rate Limit or
- Processing timeout

---

### Directory Traversal in Filename

```javascript
// Try to upload with path traversal
const filename = '../../etc/passwd.jpg';

// Or in form field
formData.append('filename', '../../sensitive/file.jpg');
```

**Expected Result**: 400 Bad Request - Invalid filename

---

## Authentication Payloads

### Brute Force Attack

```bash
# Try multiple passwords
for i in {1..100}; do
  curl -X POST https://autumnsgrove.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"admin@test.com\",\"password\":\"password$i\"}"
done
```

**Expected Result**:
- After 5 failed attempts in 15 minutes
- Receive 429 Too Many Requests
- With Retry-After header

---

### SQL Injection in Login

```javascript
// Email field
"admin'--"

// Or
"admin' OR '1'='1"

// Or
"admin'; DROP TABLE users;--"
```

**Expected Result**:
- 401 Unauthorized (invalid credentials)
- Or 400 Bad Request (invalid input)
- Database not modified

---

### Session Hijacking Attempt

```bash
# Capture session cookie from legitimate user
# Then use it from different IP/browser
curl -b "session=hijacked_session_token" \
  https://autumnsgrove.com/api/user/profile
```

**Expected Result**:
- Could succeed if session doesn't validate IP/User-Agent
- Should fail if additional validation in place
- Check audit log for session reuse detection

---

## Rate Limiting Verification

### Rapid Login Attempts

```bash
#!/bin/bash
for i in {1..10}; do
  echo "Attempt $i"
  curl -X POST https://autumnsgrove.com/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"wrong"}'
  sleep 0.1
done
```

**Expected Result**:
- First 5 requests: 401 Unauthorized
- Requests 6-10: 429 Too Many Requests

---

### API Endpoint Rate Limiting

```bash
# Rapid POST requests
for i in {1..100}; do
  curl -X POST https://autumnsgrove.com/api/posts \
    -H "X-CSRF-Token: token" \
    -H "Content-Type: application/json" \
    -d "{\"title\":\"Post $i\"}" &
done

wait
```

**Expected Result**: Some requests return 429 Too Many Requests

---

### Upload Rate Limiting

```bash
# Rapid upload attempts
for i in {1..20}; do
  curl -F "file=@image.jpg" \
    https://autumnsgrove.com/api/images/upload &
done

wait
```

**Expected Result**:
- First 10 uploads succeed
- Next 10 get 429 Too Many Requests

---

## Input Validation Tests

### Invalid Email Formats

```javascript
[
  'not-an-email',
  'missing-at-sign.com',
  '@example.com',
  'user@',
  'user name@example.com',
  'user@domain',
  'user@@example.com',
  'user@domain..com'
]
```

**Expected Result**: All rejected with validation error

---

### Weak Passwords

```javascript
[
  '123456',           // Too short
  'password',         // No number
  'Password',         // No special char
  'Pass123',          // Too short
  '!@#$%^&',          // No letter
  'abcdefgh',         // No uppercase, number, special
  ''                  // Empty
]
```

**Expected Result**: All rejected with password strength requirements

---

### JavaScript URLs

```javascript
[
  'javascript:alert("XSS")',
  'data:text/html,<script>alert("XSS")</script>',
  'vbscript:alert("XSS")',
  'file:///etc/passwd'
]
```

**Expected Result**: All rejected as invalid URL format

---

## Security Headers Testing

### Check Headers with curl

```bash
curl -I https://autumnsgrove.com/ | grep -i "Security"
```

**Should contain**:
```
Content-Security-Policy: script-src 'nonce-...
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Strict-Transport-Security: max-age=...
Permissions-Policy: geolocation=(), microphone=(), camera=()
Referrer-Policy: strict-origin-when-cross-origin
```

---

### Browser DevTools Check

```javascript
// In browser console
const headers = {};
for (let [key, value] of document.head.entries()) {
  if (key.startsWith('x-') || key.includes('security') || key.includes('content')) {
    console.log(`${key}: ${value}`);
  }
}
```

---

## Path Traversal Attempts

### Directory Traversal

```bash
# Try to access parent directories
curl https://autumnsgrove.com/api/files/../../../etc/passwd
curl https://autumnsgrove.com/api/files/../../secrets.json
curl https://autumnsgrove.com/upload/..%2F..%2Fetc%2Fpasswd
curl https://autumnsgrove.com/upload/..%252F..%252Fetc%252Fpasswd  # Double encoded
```

**Expected Result**: 400/403 error - Path traversal blocked

---

### Null Byte Injection

```bash
curl https://autumnsgrove.com/api/files/legitimate%00.txt
# Should not access file with null byte
```

**Expected Result**: 400 Bad Request

---

## Cache Poisoning Tests

### Check Cache Headers

```bash
# For public images
curl -I https://cdn.autumnsgrove.com/images/public.jpg
# Should return: Cache-Control: public, max-age=2592000, immutable

# For private content
curl -I https://autumnsgrove.com/api/user/data
# Should return: Cache-Control: private, no-cache, no-store
```

---

## Running Automated Tests

### Using curl in script

```bash
#!/bin/bash
# Save as test_security.sh

DOMAIN="https://autumnsgrove.com"
PASS=0
FAIL=0

test_xss() {
  echo "Testing XSS prevention..."
  response=$(curl -s -X POST "$DOMAIN/api/posts" \
    -H "X-CSRF-Token: test" \
    -d '{"title":"<script>alert(1)</script>"}')

  if [[ ! $response =~ "<script>" ]]; then
    echo "✓ XSS blocked"
    ((PASS++))
  else
    echo "✗ XSS NOT blocked"
    ((FAIL++))
  fi
}

test_csrf() {
  echo "Testing CSRF protection..."
  status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$DOMAIN/api/posts" \
    -H "Content-Type: application/json" \
    -d '{"title":"Test"}')

  if [ $status -eq 403 ]; then
    echo "✓ CSRF protected"
    ((PASS++))
  else
    echo "✗ CSRF not protected (status: $status)"
    ((FAIL++))
  fi
}

test_rate_limit() {
  echo "Testing rate limiting..."
  for i in {1..10}; do
    curl -s -X POST "$DOMAIN/api/auth/login" -d '{"email":"test@test.com"}' > /dev/null
  done

  status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$DOMAIN/api/auth/login" \
    -d '{"email":"test@test.com"}')

  if [ $status -eq 429 ]; then
    echo "✓ Rate limiting working"
    ((PASS++))
  else
    echo "✗ Rate limiting not working"
    ((FAIL++))
  fi
}

echo "=== Security Test Suite ==="
test_xss
test_csrf
test_rate_limit

echo ""
echo "Results: $PASS passed, $FAIL failed"
```

**Run**:
```bash
chmod +x test_security.sh
./test_security.sh
```

---

## Testing Tools

### Browser Extensions
- **OWASP ZAP**: Free security scanner
- **Burp Suite Community**: Web application testing
- **ModSecurity**: WAF testing

### Command Line Tools
```bash
# SQL injection testing
sqlmap -u "https://autumnsgrove.com/api/search?q=test" --dbs

# XSS scanning
xsser -u "https://autumnsgrove.com/api/test"

# Security header checking
curl -I https://autumnsgrove.com | grep -i security

# Nmap vulnerability scanning
nmap -sV --script http-security-headers autumnsgrove.com
```

---

## Expected Results Summary

| Test | Payload | Expected | Status |
|------|---------|----------|--------|
| XSS | `<script>alert('XSS')</script>` | Blocked | ✓ |
| CSRF | No token on DELETE | 403 | ✓ |
| SVG Upload | .svg file | 400 Rejected | ✓ |
| Rate Limit | 10 auth attempts | 429 after 5 | ✓ |
| Path Traversal | `../../../etc/passwd` | 400 | ✓ |
| SQL Injection | `' OR '1'='1` | 401/400 | ✓ |

---

**Last Updated**: 2025-11-29
**Version**: 1.0
