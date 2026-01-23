# GroveEngine Upgrade & Admin Dashboard Migration Plan

**Date:** January 5, 2026  
**Current Version:** 0.8.0  
**Target Version:** 0.8.6  
**Admin Dashboard:** `/admin` routes

---

## Executive Summary

This document outlines the complete upgrade of GroveEngine from v0.8.0 to v0.8.6 and the full migration of the admin dashboard system to utilize the latest engine capabilities.

### Key Changes in GroveEngine 0.8.0 → 0.8.6

Based on the package metadata and release timeline:
- **0.8.5** (Jan 4, 2026): Latest stable release
- **0.8.6** (Jan 5, 2026): Most recent version with potential API improvements
- Package exports now include proper Svelte component resolution
- Component exports are properly configured for Vite resolution
- Enhanced admin component capabilities

### Migration Scope

1. **Package Upgrade**: `@autumnsgrove/groveengine` 0.8.0 → 0.8.6
2. **Admin Dashboard Migration**: All `/admin` routes and components
3. **API Endpoint Updates**: All admin-related API routes
4. **Data Structure Migration**: If breaking changes exist
5. **Backward Compatibility**: Layer for deprecated features
6. **Comprehensive Testing**: All admin panel features
7. **Rollback Procedures**: Full rollback capability
8. **Documentation Updates**: Version compatibility matrix

---

## Phase 1: Pre-Migration Analysis

### 1.1 Current State Assessment

**Current Dependencies:**
```json
{
  "@autumnsgrove/groveengine": "^0.8.0"
}
```

**Admin Dashboard Structure:**
```
/admin
├── +layout.svelte (main layout)
├── +layout.server.js (auth check)
├── +page.svelte (dashboard home)
├── analytics/
├── blog/
│   ├── +page.svelte (list posts)
│   ├── new/
│   └── edit/[slug]/
├── images/
├── logs/
├── pages/
│   ├── +page.svelte (list pages)
│   └── edit/[slug]/
├── settings/
└── timeline/
```

**Key Admin Components:**
- `MarkdownEditor.svelte` - Blog post editor
- `GutterManager.svelte` - Content gutter management
- Image gallery components
- Settings management

### 1.2 Version Compatibility Matrix

| Component | 0.8.0 Status | 0.8.6 Status | Action Required |
|-----------|--------------|--------------|----------------|
| Admin Layout | ✅ Working | ✅ Compatible | Update imports |
| Markdown Editor | ✅ Working | ✅ Enhanced | Update API calls |
| Image Gallery | ✅ Working | ✅ Improved | Update component refs |
| Settings Panel | ✅ Working | ✅ Compatible | Verify data structures |
| Timeline Admin | ✅ Working | ✅ Compatible | Test integration |

### 1.3 Breaking Changes Analysis

**Expected Changes from 0.8.0 to 0.8.6:**

1. **Component Import Paths**
   - Before: `$lib/components/admin/MarkdownEditor.svelte`
   - After: `@autumnsgrove/groveengine/components/admin/MarkdownEditor.svelte`

2. **Utility Function Exports**
   - Before: `$lib/utils/markdown.js`
   - After: `@autumnsgrove/groveengine/utils/markdown`

3. **API Response Format**
   - Potential changes in admin API responses
   - Verify data structure compatibility

4. **Component Props**
   - Check for new/removed props in admin components
   - Verify backward compatibility

---

## Phase 2: Upgrade Execution

### 2.1 Package Upgrade

```bash
# Backup current state
git checkout -b backup/pre-groveengine-upgrade

# Upgrade package
npm install @autumnsgrove/groveengine@0.8.6

# Verify installation
npm list @autumnsgrove/groveengine
```

### 2.2 Import Path Migration

**Files to Update (Priority Order):**

#### Critical Files (Must Update First)
1. `src/hooks.server.js` - Authentication & CSRF
2. `src/routes/+layout.svelte` - Main layout
3. `src/routes/admin/+layout.svelte` - Admin layout

#### Admin Route Files (12+ files)
1. `src/routes/admin/+page.svelte`
2. `src/routes/admin/analytics/+page.svelte`
3. `src/routes/admin/blog/+page.svelte`
4. `src/routes/admin/blog/new/+page.svelte`
5. `src/routes/admin/blog/edit/[slug]/+page.svelte`
6. `src/routes/admin/blog/edit/[slug]/+page.server.js`
7. `src/routes/admin/images/+page.svelte`
8. `src/routes/admin/logs/+page.svelte`
9. `src/routes/admin/pages/+page.svelte`
10. `src/routes/admin/pages/edit/[slug]/+page.svelte`
11. `src/routes/admin/pages/edit/[slug]/+page.server.js`
12. `src/routes/admin/settings/+page.svelte`
13. `src/routes/admin/timeline/+page.svelte`

#### Admin Component Files (2 files)
1. `src/lib/components/admin/MarkdownEditor.svelte`
2. `src/lib/components/admin/GutterManager.svelte`

### 2.3 Import Update Pattern

**Before:**
```javascript
import MarkdownEditor from '$lib/components/admin/MarkdownEditor.svelte';
import { getAllPosts } from '$lib/utils/markdown';
import { generateCSRFToken } from '$lib/utils/csrf';
```

**After:**
```javascript
import MarkdownEditor from '@autumnsgrove/groveengine/components/admin/MarkdownEditor.svelte';
import { getAllPosts } from '@autumnsgrove/groveengine/utils/markdown';
import { generateCSRFToken } from '@autumnsgrove/groveengine/utils/csrf';
```

### 2.4 API Endpoint Updates

**Admin API Routes to Verify:**
- `/api/admin/cache/clear`
- `/api/admin/settings`
- `/api/admin/gallery/tags`
- `/api/admin/gallery/sync`
- `/api/admin/logs`

**Update Pattern:**
```javascript
// Before
import { api } from '$lib/utils/api';

// After (verify new API structure)
import { api } from '@autumnsgrove/groveengine/utils/api';
```

---

## Phase 3: Data Structure Migration

### 3.1 Breaking Changes Check

**Verify these data structures:**
1. **Post Data Format**
   ```javascript
   // Verify post object structure
   {
     slug: string,
     title: string,
     content: string,
     // ... other fields
   }
   ```

2. **Settings Format**
   ```javascript
   // Verify settings object
   {
     setting_key: string,
     setting_value: string,
     // ... other fields
   }
   ```

3. **Image Gallery Data**
   ```javascript
   // Verify image object
   {
     id: string,
     url: string,
     tags: array,
     // ... other fields
   }
   ```

### 3.2 Migration Actions

If breaking changes are found:
1. **Create Migration Script**
   ```javascript
   // scripts/migrate-groveengine-086.js
   import { migrateData } from './migration-helpers.js';
   
   await migrateData({
     fromVersion: '0.8.0',
     toVersion: '0.8.6',
     dataType: 'admin'
   });
   ```

2. **Apply Data Transformations**
   - Update data structures as needed
   - Preserve backward compatibility
   - Document changes

---

## Phase 4: Backward Compatibility Layer

### 4.1 Compatibility Strategy

**Implement wrapper functions for deprecated APIs:**

```javascript
// src/lib/compatibility/groveengine-086.js
import * as GroveEngine from '@autumnsgrove/groveengine';

// Wrapper for deprecated functions
export const getAllPosts = GroveEngine.getAllPosts || 
  (() => { console.warn('Deprecated: Use GroveEngine directly'); });

// Backward compatible exports
export const adminAPI = {
  getSettings: GroveEngine.utils.admin.getSettings,
  updateSettings: GroveEngine.utils.admin.updateSettings,
  // ... other admin functions
};
```

### 4.2 Deprecation Warnings

Add warnings for deprecated features:
```javascript
// Example: Admin component props
<script>
  import { onMount } from 'svelte';
  
  // Warn if using deprecated prop
  onMount(() => {
    if (deprecatedProp) {
      console.warn('deprecatedProp is deprecated, use newProp instead');
    }
  });
</script>
```

---

## Phase 5: Testing Strategy

### 5.1 Test Categories

#### Unit Tests
- Component rendering
- Utility functions
- API responses

#### Integration Tests
- Admin dashboard flows
- Blog post editing
- Image gallery operations
- Settings management

#### End-to-End Tests
- Complete admin workflows
- Authentication flows
- Data persistence

### 5.2 Test Execution Plan

```bash
# 1. Build verification
npm run build

# 2. Type checking
npm run check

# 3. Unit tests
npm run test

# 4. Integration tests
npm run test:integration

# 5. Admin panel manual testing
# - Login flow
# - Blog post creation/editing
# - Image upload/management
# - Settings updates
# - Timeline operations
```

### 5.3 Manual Testing Checklist

**Admin Dashboard Features:**
- [ ] Login authentication
- [ ] Dashboard home loads
- [ ] Blog post list displays
- [ ] New post creation works
- [ ] Edit post functionality
- [ ] Image gallery operations
- [ ] Settings updates
- [ ] Timeline admin features
- [ ] Log viewer functionality
- [ ] Analytics display

**Critical User Flows:**
- [ ] Create new blog post
- [ ] Edit existing blog post
- [ ] Upload images
- [ ] Manage gallery tags
- [ ] Update site settings
- [ ] View analytics data

---

## Phase 6: Rollback Procedures

### 6.1 Rollback Triggers

Rollback if any of these occur:
1. Build failures not resolvable within 2 hours
2. Critical admin features non-functional
3. Data corruption detected
4. Authentication failures
5. Performance degradation > 50%

### 6.2 Rollback Steps

```bash
# 1. Revert package
npm install @autumnsgrove/groveengine@0.8.0

# 2. Revert code changes
git checkout backup/pre-groveengine-upgrade

# 3. Restore data if needed
# (Run data migration rollback script)

# 4. Verify rollback
npm run build
npm run test
```

### 6.3 Rollback Verification

After rollback:
- [ ] Build completes successfully
- [ ] All tests pass
- [ ] Admin dashboard accessible
- [ ] Critical features functional
- [ ] No data loss

---

## Phase 7: Documentation Updates

### 7.1 Version Compatibility Matrix

| Feature | 0.8.0 | 0.8.6 | Status |
|---------|-------|-------|--------|
| Admin Layout | ✅ | ✅ | Compatible |
| Markdown Editor | ✅ | ✅ | Enhanced |
| Image Gallery | ✅ | ✅ | Improved |
| Settings API | ✅ | ✅ | Compatible |
| Timeline Admin | ✅ | ✅ | Compatible |

### 7.2 Migration Guide Updates

Update these documents:
- `docs/GROVEENGINE-MIGRATION-GUIDE.md`
- `docs/plans/MIGRATION-MASTER-PLAN.md`
- `TODOS.md` - Mark migration complete

### 7.3 API Documentation

Document new/changed APIs:
- Admin component props
- Utility function signatures
- API response formats

---

## Phase 8: Validation & Sign-off

### 8.1 Success Criteria

Migration is successful when:
- [ ] All imports updated to v0.8.6
- [ ] Build completes without errors
- [ ] All tests pass
- [ ] Admin dashboard fully functional
- [ ] No breaking changes unhandled
- [ ] Backward compatibility maintained
- [ ] Documentation updated
- [ ] Rollback procedures tested

### 8.2 Final Verification

**Automated Checks:**
```bash
npm run build          # ✅ Must pass
npm run test           # ✅ Must pass
npm run check          # ✅ Must pass
```

**Manual Verification:**
- [ ] Admin login works
- [ ] Dashboard home loads
- [ ] Blog management works
- [ ] Image gallery works
- [ ] Settings updates work
- [ ] Timeline features work

### 8.3 Post-Migration Tasks

1. **Monitor for 48 hours:**
   - Error logs
   - Performance metrics
   - User reports

2. **Update monitoring alerts:**
   - New error patterns
   - Performance thresholds

3. **Document lessons learned:**
   - What worked well
   - What could be improved
   - Future migration recommendations

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Build failures | Medium | High | Test incrementally, rollback ready |
| Breaking changes | Low | High | Compatibility layer, thorough testing |
| Data loss | Very Low | Critical | Backup before migration, test rollback |
| Performance issues | Low | Medium | Monitor metrics, have rollback plan |
| Authentication failures | Very Low | High | Test login flow thoroughly |

---

## Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| Pre-Migration | 2 hours | Analysis, planning, backup |
| Upgrade | 3 hours | Package update, import updates |
| Migration | 4 hours | Component updates, API changes |
| Testing | 3 hours | Automated + manual testing |
| Documentation | 1 hour | Update docs, matrix |
| **Total** | **13 hours** | **Complete migration** |

---

## Success Metrics

1. **Zero downtime migration**
2. **All admin features functional**
3. **No breaking changes unhandled**
4. **Build time < 2 minutes**
5. **Test coverage > 80%**
6. **Documentation 100% complete**

---

*Last Updated: January 5, 2026*  
*Version: 1.0*  
*Owner: Engineering Team*