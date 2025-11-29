# Security Remediation Guide - Master Index

**Status**: Implementation Ready
**Priority**: CRITICAL - Start Immediately
**Timeline**: 5 days (37 hours)
**Last Updated**: 2025-11-29

---

## Quick Start

**For Subagent Execution**: Each phase has its own task file optimized for parallel agent execution.

```bash
# Phase 1 (Day 1) - CRITICAL XSS & CSRF
house-coder: security/phase1_xss_fixes.md
house-coder: security/phase2_csrf_fixes.md

# Phase 2 (Day 2) - HIGH Priority
house-coder: security/phase3_high_priority.md

# Phase 3 (Day 3) - MEDIUM Priority
house-coder: security/phase4_medium_priority.md

# Phase 4 (Day 4-5) - Testing & Deployment
house-bash: security/phase5_testing.md
```

---

## Security Audit Summary

**Total Vulnerabilities Found**: 20
- **Critical**: 3 (XSS in Mermaid, marked.parse, DELETE CSRF bug)
- **High**: 6 (SVG XSS, weak CSRF, CSP, rate limiting, gallery auth)
- **Medium**: 8 (Prototype pollution, path traversal, validation, logging)
- **Low**: 3 (Cookie security, code generation, DB constraints)

**Current Risk Level**: MEDIUM-HIGH
**Target Risk Level**: LOW
**Overall Security Grade**: B+ → A

---

## Implementation Phases

### Phase 1: Critical XSS Vulnerabilities (Day 1 Morning - 4 hours)
**File**: [phase1_xss_fixes.md](./phase1_xss_fixes.md)
**Agent**: house-coder
**Model**: Sonnet (precision required)

**Tasks**:
1. Fix Mermaid SVG XSS injection
2. Create centralized HTML sanitization utility
3. Sanitize marked.parse() output before storage
4. Sanitize gutter content rendering
5. Test XSS fixes with payloads

**Files Modified**: 7
**Estimated Time**: 4 hours
**Risk Reduction**: 45%

---

### Phase 2: Critical CSRF Vulnerabilities (Day 1 Afternoon - 4 hours)
**File**: [phase2_csrf_fixes.md](./phase2_csrf_fixes.md)
**Agent**: house-coder
**Model**: Sonnet (security-critical)

**Tasks**:
1. Fix DELETE endpoint missing request parameter
2. Implement token-based CSRF protection
3. Update hooks.server.js for token generation
4. Create client-side API utility
5. Test CSRF protection

**Files Modified**: 12+
**Estimated Time**: 4 hours
**Risk Reduction**: 40%

---

### Phase 3: High Priority Security Hardening (Day 2 - 8 hours)
**File**: [phase3_high_priority.md](./phase3_high_priority.md)
**Agent**: house-coder
**Model**: Sonnet (complex CSP nonce implementation)

**Tasks**:
1. Remove SVG upload support
2. Implement CSP with nonces
3. Add rate limiting to all endpoints
4. Secure gallery endpoint with auth
5. Add R2 cache-control headers

**Files Modified**: 15+
**Estimated Time**: 8 hours
**Risk Reduction**: 10%

---

### Phase 4: Medium Priority Improvements (Day 3 - 8 hours)
**File**: [phase4_medium_priority.md](./phase4_medium_priority.md)
**Agent**: house-coder
**Model**: Haiku (straightforward implementations)

**Tasks**:
1. Prevent prototype pollution
2. Strengthen path traversal prevention
3. Add magic byte validation
4. Sanitize error messages
5. Implement audit logging
6. Add filename timestamps
7. Improve input validation

**Files Modified**: 20+
**Estimated Time**: 8 hours
**Risk Reduction**: 4%

---

### Phase 5: Testing, Documentation & Deployment (Day 4-5 - 13 hours)
**File**: [phase5_testing.md](./phase5_testing.md)
**Agent**: house-bash (testing), Main (documentation)
**Model**: Haiku for tests, Sonnet for docs

**Tasks**:
1. Create security test suite
2. Run comprehensive security tests
3. Performance testing
4. Update documentation (AGENT.md, SECURITY.md)
5. Configure Cloudflare CDN headers
6. Production deployment
7. Monitor & verify

**Files Modified**: 5+ (tests, docs, configs)
**Estimated Time**: 13 hours
**Risk Reduction**: 1% (validation only)

---

## Subagent Execution Strategy

### Parallel Execution Pattern

```javascript
// Day 1 Morning - Run these in PARALLEL
Task(house-coder, phase1_xss_fixes.md, task_1_mermaid)
Task(house-coder, phase1_xss_fixes.md, task_2_sanitize_util)
// Wait for sanitize util completion before task 3-4

// Day 1 Afternoon - Sequential (dependencies)
Task(house-coder, phase2_csrf_fixes.md, task_1_delete_fix)
Task(house-coder, phase2_csrf_fixes.md, task_2_csrf_tokens)
// Must complete in order

// Day 2 - Parallel where possible
Task(house-coder, phase3_high_priority.md, task_1_svg_removal)
Task(house-coder, phase3_high_priority.md, task_4_gallery_auth)
// Independent tasks run parallel
```

### Agent Selection Guide

| Phase | Primary Agent | Reason | Fallback |
|-------|--------------|--------|----------|
| Phase 1 | house-coder (Sonnet) | Security-critical XSS fixes | Main if complex decisions |
| Phase 2 | house-coder (Sonnet) | CSRF token system | Main for architecture |
| Phase 3 | house-coder (Sonnet) | CSP nonce complexity | house-planner if blocked |
| Phase 4 | house-coder (Haiku) | Straightforward utils | Sonnet if issues |
| Phase 5 | house-bash (Haiku) | Test execution | Main for analysis |

---

## File Structure

```
AgentUsage/security/
├── README.md                    # This file - master index
├── phase1_xss_fixes.md          # Critical XSS tasks (Day 1 AM)
├── phase2_csrf_fixes.md         # Critical CSRF tasks (Day 1 PM)
├── phase3_high_priority.md      # High priority tasks (Day 2)
├── phase4_medium_priority.md    # Medium priority tasks (Day 3)
├── phase5_testing.md            # Testing & deployment (Day 4-5)
├── audit_report.md              # Full security audit findings
├── test_payloads.md             # XSS/CSRF/SQLi test cases
└── rollback_procedures.md       # Emergency rollback guide
```

---

## Progress Tracking

### Completed Phases: 0/5

- [ ] **Phase 1** - Critical XSS Fixes (0/5 tasks)
- [ ] **Phase 2** - Critical CSRF Fixes (0/5 tasks)
- [ ] **Phase 3** - High Priority (0/5 tasks)
- [ ] **Phase 4** - Medium Priority (0/7 tasks)
- [ ] **Phase 5** - Testing & Deployment (0/7 tasks)

**Total Progress**: 0/29 tasks (0%)

---

## Success Criteria

All phases complete when:
- ✅ All Critical/High vulnerabilities resolved
- ✅ Security tests passing (100% coverage)
- ✅ No console errors in production
- ✅ CSRF tokens working in all forms
- ✅ Rate limiting functional (verified with load tests)
- ✅ Audit logs capturing all events
- ✅ CSP not blocking legitimate scripts
- ✅ Performance unchanged (±5% threshold)
- ✅ Documentation updated
- ✅ Rollback procedures tested

---

## Emergency Contacts

**Security Issues During Implementation**:
1. Stop immediately
2. Revert last commit: `git reset --hard HEAD~1`
3. Check rollback procedures: [rollback_procedures.md](./rollback_procedures.md)
4. Document incident in audit log

---

## Related Documentation

- **[audit_report.md](./audit_report.md)** - Full security audit findings
- **[test_payloads.md](./test_payloads.md)** - Security test cases
- **[rollback_procedures.md](./rollback_procedures.md)** - Emergency recovery
- **[../house_agents.md](../house_agents.md)** - Agent usage patterns
- **[../git_guide.md](../git_guide.md)** - Commit standards
- **[../../AGENT.md](../../AGENT.md)** - Project standards

---

## User Preferences Applied

✅ **SVG Upload**: Remove entirely (safest option)
✅ **Gallery Access**: Require authentication
✅ **CSP Strategy**: Implement nonces (best security)
✅ **Timeline**: All phases ASAP (4-5 days)

---

**Next Action**: Start with [phase1_xss_fixes.md](./phase1_xss_fixes.md)
