# Security Policy

## Supported Versions

We take security seriously for the AutumnsGrove project. Currently, security updates are provided for:

| Version | Supported          |
| ------- | ------------------ |
| main    | :white_check_mark: |
| feature branches | :x: |

## Reporting a Vulnerability

If you discover a security vulnerability in AutumnsGrove, please follow responsible disclosure practices:

### How to Report

**DO NOT create a public GitHub issue for security vulnerabilities.**

Instead, please report security issues via one of these methods:

1. **Email**: Contact the maintainer directly (check GitHub profile for contact info)
2. **GitHub Security Advisory**: Use GitHub's private vulnerability reporting feature
   - Go to the Security tab → Advisories → Report a vulnerability

### What to Include

Please provide as much information as possible:

- **Type of vulnerability** (e.g., XSS, CSRF, SQL injection, authentication bypass)
- **Affected component(s)** (e.g., admin panel, blog posts, API endpoints)
- **Steps to reproduce** the vulnerability
- **Proof of concept** (if applicable)
- **Potential impact** of the vulnerability
- **Suggested fix** (if you have one)

### Response Timeline

- **Initial Response**: Within 48 hours of report
- **Vulnerability Assessment**: Within 1 week
- **Fix Timeline**: Critical issues within 2 weeks, others based on severity
- **Public Disclosure**: After fix is deployed and users have time to update

## Security Measures in Place

AutumnsGrove implements multiple layers of security:

### Authentication & Authorization
- **Passwordless authentication** via magic links (email-based codes)
- **JWT sessions** with HMAC-SHA256 signing
- **HttpOnly cookies** (XSS protection)
- **SameSite=Lax cookies** (CSRF mitigation)
- **Rate limiting** on authentication endpoints
- **Account lockout** after failed attempts
- **Admin email whitelist** for access control

### Input Validation & Sanitization
- **HTML sanitization** with DOMPurify (XSS protection)
- **CSRF protection** on all state-changing API endpoints
- **SQL injection protection** via parameterized queries
- **File upload validation** (type, size, filename sanitization)
- **Content length limits** (title: 200 chars, description: 500 chars, content: 1MB)
- **Path traversal prevention** in file operations

### Security Headers
- **X-Frame-Options: DENY** (clickjacking protection)
- **X-Content-Type-Options: nosniff** (MIME sniffing protection)
- **Referrer-Policy: strict-origin-when-cross-origin** (privacy)
- **Permissions-Policy** (blocks unnecessary browser features)
- **Content-Security-Policy** (production only, allows Mermaid diagrams)

### Infrastructure Security
- **Cloudflare Pages** deployment (DDoS protection, CDN)
- **Cloudflare R2** for image storage (isolated from main site)
- **Cloudflare D1** database with prepared statements
- **Environment variables** for all secrets (no hardcoded credentials)
- **GitHub Actions** for automated deployments (no manual secret exposure)

### Code Security
- **Dependencies audited** regularly
- **No eval() or Function()** constructor usage
- **Safe regex patterns** (ReDoS prevention)
- **Secure random token generation** (crypto.getRandomValues)
- **Timing-safe comparisons** for authentication codes

## Security Best Practices for Contributors

If you're contributing to AutumnsGrove, please follow these guidelines:

### Code Review Checklist
- [ ] No hardcoded secrets or API keys
- [ ] All user inputs validated and sanitized
- [ ] SQL queries use parameterized statements
- [ ] HTML rendering uses DOMPurify or `{@html}` safely
- [ ] File operations check for path traversal
- [ ] Authentication checks present on admin routes
- [ ] CSRF validation on state-changing endpoints
- [ ] Error messages don't expose sensitive info
- [ ] No eval(), innerHTML without sanitization

### Testing Security Changes
```bash
# Run dependency audit
npm audit

# Check for security issues in dependencies
npm audit --audit-level=moderate

# Test authentication flows
# - Try accessing admin routes without session
# - Try CSRF attacks from different origin
# - Try XSS payloads in blog posts
# - Try path traversal in image uploads
```

### Secrets Management
- **Never commit** `.env`, `secrets.json`, or files with credentials
- **Use wrangler secrets** for Cloudflare Workers: `wrangler secret put SECRET_NAME`
- **Use GitHub Secrets** for Actions workflows
- **Rotate secrets** immediately if accidentally exposed

## Known Security Considerations

### Mermaid Diagrams
- Mermaid.js requires `unsafe-eval` in CSP for diagram rendering
- This is a known limitation of the library
- Mermaid content is user-generated (admin only) and sanitized

### CDN Image Links
- Images served from `cdn.autumnsgrove.com` (Cloudflare R2)
- Public read access (by design for blog images)
- Upload restricted to authenticated admins only

### External APIs
- GitHub API calls (public data only, rate limited)
- Anthropic API (admin-only, for AI timeline summaries)
- All API keys stored in Cloudflare secrets

## Security Updates

Security updates will be announced via:
- GitHub Security Advisories
- Release notes with `[SECURITY]` prefix
- Commits tagged with `security:` type

## Acknowledgments

We appreciate security researchers who help keep AutumnsGrove safe. Responsible disclosure will be acknowledged in:
- Release notes
- CHANGELOG.md
- This SECURITY.md file (with permission)

---

**Last Updated**: November 29, 2025
**Security Contact**: See GitHub profile for contact information
