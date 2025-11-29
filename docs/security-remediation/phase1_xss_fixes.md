# Phase 1: Critical XSS Fixes (Day 1 Morning)

**Duration**: 4 hours
**Priority**: CRITICAL - Start First
**Agent**: house-coder (Sonnet model)
**Risk Reduction**: 45%

---

## Overview

Fix all critical XSS vulnerabilities allowing arbitrary JavaScript execution through:
1. Mermaid diagram SVG injection
2. Unsanitized markdown HTML storage
3. Gutter content rendering

**CVSS Scores**: 9.3 (Mermaid), 9.0 (marked.parse), 8.5 (Gutter)

---

## Task Breakdown

### Task 1: Fix Mermaid SVG XSS Injection (1 hour)

**File**: `src/lib/utils/markdown.js`

**Issue**: Lines 9 & 939
- `securityLevel: "loose"` allows JavaScript execution
- Direct `innerHTML = svg` without sanitization

**Fix**:
```javascript
// Line 9 - Change security level
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "strict",  // CHANGED from "loose"
  themeVariables: {
    // ... keep existing config
  }
});

// Lines 938-945 - Sanitize SVG before injection
const { svg } = await mermaid.render(container.id, diagramCode);

// Import DOMPurify (already in package.json)
const DOMPurify = (await import('dompurify')).default;
const sanitizedSvg = DOMPurify.sanitize(svg, {
  USE_PROFILES: { svg: true, svgFilters: true },
  ADD_TAGS: ['foreignObject'],
  ADD_ATTR: ['xmlns', 'viewBox', 'width', 'height', 'style']
});

container.innerHTML = sanitizedSvg;
```

**Test**:
```javascript
// Try this XSS payload in a mermaid diagram:
graph TD
    A[<img src=x onerror=alert('XSS')>]
// Should NOT execute alert
```

---

### Task 2: Create Centralized Sanitization Utility (30 min)

**New File**: `src/lib/utils/sanitize.js`

**Purpose**: Single source of truth for HTML sanitization

```javascript
import DOMPurify from 'dompurify';

/**
 * Sanitize HTML content for safe rendering
 * Used for markdown output, user-generated content
 */
export function sanitizeHtml(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      // Headings
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      // Text formatting
      'p', 'a', 'strong', 'em', 'del', 'ins', 'sup', 'sub',
      // Lists
      'ul', 'ol', 'li',
      // Blocks
      'blockquote', 'code', 'pre', 'br', 'hr', 'div', 'span',
      // Tables
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      // Media (images only, no video/audio for security)
      'img'
    ],
    ALLOWED_ATTR: [
      'href', 'src', 'alt', 'title', 'class', 'id',
      'data-anchor', 'data-language', 'data-line-numbers'
    ],
    ALLOW_DATA_ATTR: false,  // Prevent data-* injection attacks
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout']
  });
}

/**
 * Sanitize SVG content specifically
 * More restrictive than general HTML
 */
export function sanitizeSvg(svg) {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ['foreignObject'],
    ADD_ATTR: ['xmlns', 'viewBox', 'width', 'height', 'style'],
    FORBID_TAGS: ['script'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick']
  });
}

/**
 * Sanitize user input for gutter content
 * Most restrictive - only basic formatting
 */
export function sanitizeGutterContent(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'a', 'strong', 'em', 'code', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'class'],
    ALLOW_DATA_ATTR: false
  });
}
```

---

### Task 3: Sanitize marked.parse() Output (1.5 hours)

**Files to Update**:
1. `src/routes/api/posts/+server.js` (Line 103)
2. `src/routes/api/posts/[slug]/+server.js` (Line 139)
3. `src/lib/utils/markdown.js` (Multiple locations: 405, 522, 721, 763, 803, 885)

**Pattern** (apply to all locations):
```javascript
// BEFORE:
const html_content = marked.parse(data.markdown_content);

// AFTER:
import { sanitizeHtml } from '$lib/utils/sanitize.js';

const rawHtml = marked.parse(data.markdown_content);
const html_content = sanitizeHtml(rawHtml);  // Sanitize before storage
```

**Specific Updates**:

**File 1**: `src/routes/api/posts/+server.js`
```javascript
// Line 1 - Add import
import { sanitizeHtml } from '$lib/utils/sanitize.js';

// Line 103 - Sanitize before storing
const rawHtml = marked.parse(data.markdown_content);
const html_content = sanitizeHtml(rawHtml);
```

**File 2**: `src/routes/api/posts/[slug]/+server.js`
```javascript
// Line 1 - Add import
import { sanitizeHtml } from '$lib/utils/sanitize.js';

// Line 139 - Sanitize before storing
const rawHtml = marked.parse(data.markdown_content);
const html_content = sanitizeHtml(rawHtml);
```

**File 3**: `src/lib/utils/markdown.js`
```javascript
// Top of file - Add import
import { sanitizeHtml } from './sanitize.js';

// Update all marked.parse() calls:
// Line 405 (getPostBySlug)
const htmlContent = sanitizeHtml(marked.parse(post.markdown_content));

// Line 522 (getGutterContentFromModules)
content: sanitizeHtml(marked.parse(module.markdown))

// Line 721 (getHomePage)
content: sanitizeHtml(marked.parse(pageData.content))

// Line 763 (getContactPage)
content: sanitizeHtml(marked.parse(pageData.content))

// Line 803 (getAboutPage)
content: sanitizeHtml(marked.parse(pageData.content))

// Line 885 (getRecipeBySlug)
content: sanitizeHtml(marked.parse(processedMarkdown))
```

---

### Task 4: Sanitize Gutter Content Rendering (45 min)

**File**: `src/lib/components/custom/GutterItem.svelte`

**Issue**: Line 35 - `{@html item.content}` renders unsanitized content

**Fix**:
```svelte
<script>
  import DOMPurify from 'dompurify';
  import { onMount } from 'svelte';

  export let item;
  let sanitizedContent = '';

  onMount(async () => {
    // Sanitize on component mount (client-side)
    sanitizedContent = DOMPurify.sanitize(item.content, {
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'ul', 'ol', 'li',
                     'blockquote', 'code', 'pre', 'strong', 'em', 'br'],
      ALLOWED_ATTR: ['href', 'class', 'id'],
      ALLOW_DATA_ATTR: false
    });
  });
</script>

<!-- Line 35 - Now renders sanitized content -->
{@html sanitizedContent}
```

**Alternative** (if item.content is already from marked.parse()):
```javascript
// Better: Sanitize when creating gutter content
// In src/lib/utils/markdown.js (Line 522)
import { sanitizeGutterContent } from './sanitize.js';

{
  type: 'markdown',
  content: sanitizeGutterContent(marked.parse(module.markdown)),
  position
}
```

---

### Task 5: Test XSS Fixes (15 min)

**Test Cases**:

1. **Mermaid XSS** - Should NOT execute:
```markdown
\```mermaid
graph TD
    A[<img src=x onerror=alert('XSS')>]
    B[<script>alert('XSS')</script>]
\```
```

2. **Markdown XSS** - Should be stripped:
```markdown
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
[Click](javascript:alert('XSS'))
```

3. **Gutter XSS** - Should be stripped:
```json
{
  "type": "markdown",
  "content": "<script>alert('XSS')</script>Normal text"
}
```

4. **Verify Legitimate Content Still Works**:
```markdown
# Heading
**Bold** *italic*
[Link](https://example.com)
![Image](https://example.com/image.png)
\```javascript
console.log('code');
\```
```

---

## Dependencies

**Required Before Starting**:
- ✅ DOMPurify already installed (`package.json`)
- ✅ marked library already installed
- ✅ Svelte onMount available

**No new dependencies needed!**

---

## Validation Checklist

After completing all tasks:

- [ ] Mermaid securityLevel changed to "strict"
- [ ] Mermaid SVG sanitized before innerHTML
- [ ] `src/lib/utils/sanitize.js` created with 3 functions
- [ ] All 7 marked.parse() locations updated
- [ ] GutterItem.svelte sanitizes on render
- [ ] Test payloads blocked (scripts stripped)
- [ ] Legitimate markdown still renders correctly
- [ ] No console errors in dev mode
- [ ] Git commit: "fix(security): sanitize all HTML/SVG rendering (XSS prevention)"

---

## Files Modified

**Total**: 7 files
1. `src/lib/utils/markdown.js` (3 changes: line 9, imports, 6 parse locations)
2. `src/lib/utils/sanitize.js` (NEW FILE - 3 functions)
3. `src/routes/api/posts/+server.js` (import + line 103)
4. `src/routes/api/posts/[slug]/+server.js` (import + line 139)
5. `src/lib/components/custom/GutterItem.svelte` (onMount + sanitize)

---

## Rollback Procedure

If issues occur:
```bash
# Revert changes
git reset --hard HEAD~1

# Or revert specific file
git checkout HEAD~1 -- src/lib/utils/markdown.js
```

**Blockers**: If Mermaid breaks with `strict` mode:
1. Try `securityLevel: "antiscript"` instead
2. Or use sandboxed iframe for Mermaid rendering

---

## Next Phase

After completion → [phase2_csrf_fixes.md](./phase2_csrf_fixes.md)

**Estimated time saved**: 45% risk reduction (from 100% to 55%)
