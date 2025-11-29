# Phase 4: Medium Priority Improvements (Day 3)

**Duration**: 8 hours
**Priority**: MEDIUM
**Agent**: house-coder (Haiku model - straightforward implementations)
**Risk Reduction**: 4%
**Dependencies**: Phase 3 completed

---

## Overview

Implement medium-priority security improvements:
1. Prevent prototype pollution in JSON parsing
2. Strengthen path traversal prevention
3. Add magic byte validation for images
4. Sanitize error messages
5. Implement audit logging
6. Add filename timestamps
7. Improve input validation

**CVSS Scores**: 6.8 (Prototype Pollution), 6.5 (Path Traversal), 6.3 (Magic Bytes), 5.8 (Error Disclosure), 5.5 (Audit), 5.2 (Validation)

---

## Task Breakdown

### Task 1: Prevent Prototype Pollution in JSON Parsing (45 min)

**File**: `src/lib/utils/json.js` (NEW)

**Issue**: Direct JSON.parse() can be vulnerable to prototype pollution in certain contexts

**Solution**:
```javascript
/**
 * Safe JSON parsing with prototype pollution prevention
 */

/**
 * Parse JSON string safely without prototype pollution
 * @param {string} jsonString - JSON to parse
 * @returns {object} Parsed object
 * @throws {Error} If JSON is invalid or contains dangerous keys
 */
export function safeJsonParse(jsonString) {
  // Validate input
  if (typeof jsonString !== 'string') {
    throw new Error('Input must be a string');
  }

  // Use reviver function to sanitize keys
  const parsed = JSON.parse(jsonString, (key, value) => {
    // Block dangerous prototype pollution keys
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      console.warn(`Dangerous key detected in JSON: ${key}`);
      return undefined;
    }

    return value;
  });

  // Additional check: ensure result is object
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Parsed JSON must be an object');
  }

  // Verify no prototype pollution occurred
  if (Object.getOwnPropertyNames(Object.prototype).length > 1) {
    throw new Error('Prototype pollution detected');
  }

  return parsed;
}

/**
 * Stringify JSON safely
 * @param {object} obj - Object to stringify
 * @returns {string} JSON string
 */
export function safeJsonStringify(obj) {
  return JSON.stringify(obj, (key, value) => {
    // Remove sensitive properties
    if (key.startsWith('_')) {
      return undefined;
    }
    return value;
  });
}

/**
 * Validate JSON structure matches expected schema
 * @param {object} data - Parsed JSON data
 * @param {object} schema - Expected schema
 * @returns {boolean} True if valid
 */
export function validateJsonSchema(data, schema) {
  for (const [key, expectedType] of Object.entries(schema)) {
    if (!(key in data)) {
      throw new Error(`Missing required field: ${key}`);
    }

    const actualType = typeof data[key];
    if (actualType !== expectedType) {
      throw new Error(`Field ${key} must be ${expectedType}, got ${actualType}`);
    }
  }

  return true;
}
```

**Usage**:
```javascript
// Update API endpoints that parse JSON
import { safeJsonParse, validateJsonSchema } from '$lib/utils/json.js';

export async function POST({ request, locals, platform }) {
  try {
    // Parse safely
    const rawText = await request.text();
    const data = safeJsonParse(rawText);

    // Validate schema
    validateJsonSchema(data, {
      title: 'string',
      content: 'string',
      slug: 'string'
    });

    // Use validated data
    // ...
  } catch (err) {
    console.error('JSON parsing error:', err.message);
    throw error(400, 'Invalid request format');
  }
}
```

**Test**:
```javascript
// Should reject prototype pollution
const maliciousJson = '{"title":"test","__proto__":{"admin":true}}';
try {
  safeJsonParse(maliciousJson);
  console.error('Should have rejected malicious JSON');
} catch (err) {
  console.log('Correctly rejected:', err.message);
}

// Should accept valid JSON
const validJson = '{"title":"test","content":"hello"}';
const result = safeJsonParse(validJson);
console.assert(result.title === 'test', 'Valid JSON should parse');
```

---

### Task 2: Strengthen Path Traversal Prevention (1 hour)

**File**: `src/lib/utils/pathValidation.js` (NEW)

**Issue**: Current file operations may allow `../` traversal

**Solution**:
```javascript
/**
 * Path traversal prevention utilities
 */

import path from 'path';

/**
 * Validate file path is within allowed directory
 * @param {string} userPath - User-provided path
 * @param {string} baseDir - Allowed base directory
 * @returns {string} Validated safe path
 * @throws {Error} If path escapes base directory
 */
export function validateSafePath(userPath, baseDir) {
  // Normalize paths
  const normalized = path.normalize(userPath);
  const baseDirNormalized = path.normalize(baseDir);

  // Prevent absolute paths
  if (path.isAbsolute(normalized)) {
    throw new Error('Absolute paths not allowed');
  }

  // Prevent going outside base directory
  if (normalized.includes('..')) {
    throw new Error('Directory traversal not allowed');
  }

  // Construct full path
  const fullPath = path.join(baseDirNormalized, normalized);

  // Verify result is still within base directory
  const relative = path.relative(baseDirNormalized, fullPath);
  if (relative.startsWith('..')) {
    throw new Error('Path escapes base directory');
  }

  return fullPath;
}

/**
 * Validate filename (no path separators)
 * @param {string} filename - Filename to validate
 * @returns {string} Validated filename
 * @throws {Error} If filename contains invalid characters
 */
export function validateFilename(filename) {
  // Remove any path separators
  const clean = filename.replace(/[\/\\]/g, '');

  // Prevent hidden files on Unix
  if (clean.startsWith('.')) {
    throw new Error('Hidden files not allowed');
  }

  // Prevent null bytes
  if (clean.includes('\0')) {
    throw new Error('Null bytes not allowed');
  }

  // Limit length
  if (clean.length > 255) {
    throw new Error('Filename too long (max 255 characters)');
  }

  // Ensure not empty after validation
  if (clean.length === 0) {
    throw new Error('Invalid filename');
  }

  return clean;
}

/**
 * Get safe file extension
 * @param {string} filename - Filename to check
 * @returns {string} File extension (lowercase)
 */
export function getSafeExtension(filename) {
  const ext = path.extname(filename).toLowerCase();

  // Validate extension is reasonable
  if (ext.length > 10) {
    throw new Error('Extension too long');
  }

  return ext;
}

/**
 * Sanitize file path for logging (remove sensitive info)
 * @param {string} filePath - Full file path
 * @returns {string} Sanitized path for logging
 */
export function sanitizePathForLogging(filePath) {
  // Only show filename, not full path
  return path.basename(filePath);
}
```

**Usage**:
```javascript
import { validateSafePath, validateFilename } from '$lib/utils/pathValidation.js';

export async function POST({ request, platform }) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const userPath = formData.get('path') || '/uploads';

    // Validate filename
    const safeName = validateFilename(file.name);

    // Validate path
    const safePath = validateSafePath(userPath, '/home/app/uploads');

    // Use validated values
    const fullPath = `${safePath}/${safeName}`;

    console.log(`File uploaded to: ${sanitizePathForLogging(fullPath)}`);
  } catch (err) {
    throw error(400, err.message);
  }
}
```

**Test**:
```javascript
// Should reject directory traversal
try {
  validateSafePath('../../etc/passwd', '/home/app/uploads');
  console.error('Should have rejected traversal');
} catch (err) {
  console.log('Correctly rejected traversal:', err.message);
}

// Should allow normal paths
const safePath = validateSafePath('images/photo.jpg', '/home/app/uploads');
console.assert(safePath.includes('uploads'), 'Should allow normal paths');
```

---

### Task 3: Add Magic Byte Validation for Images (1 hour)

**File**: `src/lib/utils/magicBytes.js` (NEW)

**Issue**: MIME type spoofing (renaming .exe as .jpg)

**Solution**:
```javascript
/**
 * Magic byte validation for file types
 * Verifies actual file content matches claimed MIME type
 */

/**
 * Common file signatures (magic bytes)
 */
const MAGIC_BYTES = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png': [0x89, 0x50, 0x4E, 0x47],
  'image/gif': [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46],  // RIFF... (check more bytes)
  'image/avif': [0x00, 0x00, 0x00],  // ftyp... (ISOBMFF format)
  'application/pdf': [0x25, 0x50, 0x44, 0x46],  // %PDF
  'application/zip': [0x50, 0x4B, 0x03, 0x04],  // PK..
  'image/svg+xml': [0x3C, 0x3F, 0x78, 0x6D],  // <?xm (SVG XML)
  'text/xml': [0x3C, 0x3F, 0x78, 0x6D]  // <?xm
};

/**
 * Validate file magic bytes match MIME type
 * @param {ArrayBuffer} fileBuffer - File content as bytes
 * @param {string} expectedMimeType - Expected MIME type
 * @returns {boolean} True if magic bytes match
 * @throws {Error} If file type mismatch detected
 */
export function validateMagicBytes(fileBuffer, expectedMimeType) {
  if (!fileBuffer || fileBuffer.byteLength === 0) {
    throw new Error('File is empty');
  }

  const bytes = new Uint8Array(fileBuffer);
  const signature = MAGIC_BYTES[expectedMimeType];

  if (!signature) {
    console.warn(`No magic byte signature for: ${expectedMimeType}`);
    return true; // Allow if not in database
  }

  // Check if file starts with expected signature
  for (let i = 0; i < signature.length; i++) {
    if (bytes[i] !== signature[i]) {
      throw new Error(
        `File type mismatch: expected ${expectedMimeType}, ` +
        `got unrecognized format`
      );
    }
  }

  return true;
}

/**
 * Detect MIME type from magic bytes
 * @param {ArrayBuffer} fileBuffer - File content
 * @returns {string|null} Detected MIME type or null
 */
export function detectMimeType(fileBuffer) {
  const bytes = new Uint8Array(fileBuffer);

  // Check JPEG
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
    return 'image/jpeg';
  }

  // Check PNG
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
    return 'image/png';
  }

  // Check GIF
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return 'image/gif';
  }

  // Check WebP
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
    // Additional check for WEBP signature
    if (bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
      return 'image/webp';
    }
  }

  // Check PDF
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return 'application/pdf';
  }

  return null;
}

/**
 * Validate image dimensions for safety
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {number} maxWidth - Maximum allowed width
 * @param {number} maxHeight - Maximum allowed height
 * @returns {boolean} True if dimensions valid
 * @throws {Error} If dimensions exceed limits
 */
export function validateImageDimensions(width, height, maxWidth = 4096, maxHeight = 4096) {
  if (width > maxWidth || height > maxHeight) {
    throw new Error(
      `Image dimensions exceed limits: ${width}x${height} > ${maxWidth}x${maxHeight}`
    );
  }

  if (width < 1 || height < 1) {
    throw new Error('Image dimensions must be positive');
  }

  return true;
}
```

**Usage**:
```javascript
import { validateMagicBytes, detectMimeType } from '$lib/utils/magicBytes.js';

export async function POST({ request, platform }) {
  const formData = await request.formData();
  const file = formData.get('file');

  const arrayBuffer = await file.arrayBuffer();

  // Detect actual file type
  const detectedType = detectMimeType(arrayBuffer);
  console.log(`Detected type: ${detectedType}`);

  // Validate matches claimed type
  try {
    validateMagicBytes(arrayBuffer, file.type);
    console.log('Magic bytes validated');
  } catch (err) {
    throw error(400, err.message);
  }

  // Continue with upload...
}
```

**Test**:
```javascript
// Create test file with PNG header but wrong extension
const pngHeader = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
const buffer = new ArrayBuffer(8);
new Uint8Array(buffer).set(pngHeader);

// Should detect as PNG
const detected = detectMimeType(buffer);
console.assert(detected === 'image/png', 'Should detect PNG from magic bytes');

// Should validate correctly
try {
  validateMagicBytes(buffer, 'image/png');
  console.log('PNG validation passed');
} catch (err) {
  console.error('PNG validation failed:', err.message);
}
```

---

### Task 4: Sanitize Error Messages (1 hour)

**File**: `src/lib/utils/errorHandler.js` (NEW)

**Issue**: Error messages leaking sensitive information (stack traces, file paths, DB queries)

**Solution**:
```javascript
/**
 * Error message sanitization for user-facing responses
 */

/**
 * Sanitize error for display to users
 * Prevents information disclosure
 * @param {Error} err - Error object
 * @param {boolean} isDev - Development mode flag
 * @returns {object} Sanitized error response
 */
export function sanitizeError(err, isDev = false) {
  const errorId = generateErrorId();

  // Log full error server-side for debugging
  console.error(`[${errorId}] ${err.message}`, {
    stack: err.stack,
    cause: err.cause
  });

  // Return minimal error to client
  if (isDev) {
    // Development: include more details
    return {
      message: err.message,
      stack: err.stack,
      type: err.name,
      id: errorId
    };
  }

  // Production: generic message
  return {
    message: getPublicErrorMessage(err),
    id: errorId,
    timestamp: new Date().toISOString()
  };
}

/**
 * Map error types to user-friendly messages
 * @param {Error} err - Error object
 * @returns {string} Safe error message for client
 */
function getPublicErrorMessage(err) {
  const message = err.message || '';

  // Database errors
  if (message.includes('FOREIGN KEY') || message.includes('UNIQUE')) {
    return 'Invalid request data';
  }
  if (message.includes('database') || message.includes('query')) {
    return 'Service temporarily unavailable';
  }

  // File system errors
  if (message.includes('ENOENT') || message.includes('not found')) {
    return 'Resource not found';
  }
  if (message.includes('EACCES') || message.includes('permission')) {
    return 'Access denied';
  }

  // Network errors
  if (message.includes('ECONNREFUSED')) {
    return 'Service unavailable';
  }
  if (message.includes('timeout')) {
    return 'Request timeout';
  }

  // Validation errors (safe to expose)
  if (err.name === 'ValidationError') {
    return message;  // These are user-friendly
  }

  // Default safe message
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Generate unique error ID for tracking
 * @returns {string} Error ID (e.g., ERR_1732385400_a3f2)
 */
function generateErrorId() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 6);
  return `ERR_${timestamp}_${random}`;
}

/**
 * Remove sensitive paths from error messages
 * @param {string} message - Error message
 * @returns {string} Sanitized message
 */
export function removeSensitivePaths(message) {
  // Remove file paths
  let sanitized = message.replace(/\/[a-zA-Z0-9/_.-]+\.(js|ts|jsx|tsx|py|rb|java)/g, '[file]');

  // Remove absolute paths
  sanitized = sanitized.replace(/\/home\/[a-zA-Z0-9_/-]+/g, '[path]');
  sanitized = sanitized.replace(/C:\\[a-zA-Z0-9_\\-]+/g, '[path]');

  // Remove SQL-like strings
  sanitized = sanitized.replace(/SELECT .+ FROM/gi, '[query]');

  // Remove API keys (basic patterns)
  sanitized = sanitized.replace(/sk-[a-zA-Z0-9-]+/g, '[key]');
  sanitized = sanitized.replace(/token[=:]\s*[a-zA-Z0-9]+/gi, 'token=[redacted]');

  return sanitized;
}

/**
 * Validate error is safe to log
 * @param {Error} err - Error object
 * @returns {boolean} True if safe to log
 */
export function isSafeToLog(err) {
  // Don't log errors with sensitive data
  if (err.message.includes('password') ||
      err.message.includes('token') ||
      err.message.includes('secret')) {
    return false;
  }

  return true;
}
```

**Usage**:
```javascript
import { sanitizeError } from '$lib/utils/errorHandler.js';

export async function POST({ request, locals, platform }) {
  try {
    // ... do work ...
  } catch (err) {
    const isDev = process.env.NODE_ENV === 'development';
    const sanitized = sanitizeError(err, isDev);

    return new Response(JSON.stringify(sanitized), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
```

**Test**:
```javascript
// Test database error sanitization
const dbError = new Error('FOREIGN KEY constraint failed on users.role_id');
const sanitized = sanitizeError(dbError, false);
console.assert(!sanitized.message.includes('FOREIGN KEY'), 'Should hide DB errors');
console.assert(sanitized.message === 'Invalid request data', 'Should show generic message');

// Test file path removal
const fileError = new Error('Failed at /home/user/app/src/file.js:42');
const cleaned = removeSensitivePaths(fileError.message);
console.assert(!cleaned.includes('/home/user'), 'Should remove file paths');
```

---

### Task 5: Implement Audit Logging (1.5 hours)

**File**: `src/lib/utils/auditLog.js` (NEW)

**Issue**: No logging of security events

**Solution**:
```javascript
/**
 * Audit logging for security events
 * Tracks all user actions for compliance and forensics
 */

/**
 * Log security event to database
 * @param {object} event - Event details
 * @returns {Promise<void>}
 */
export async function logAuditEvent(event, platform) {
  const {
    action,
    userId,
    resourceType,
    resourceId,
    changes = {},
    status = 'success',
    errorMessage = null,
    ipAddress,
    userAgent,
    metadata = {}
  } = event;

  const auditEntry = {
    timestamp: new Date().toISOString(),
    action,
    userId: userId || 'anonymous',
    resourceType,
    resourceId,
    changes: JSON.stringify(changes),
    status,
    errorMessage,
    ipAddress,
    userAgent,
    metadata: JSON.stringify(metadata)
  };

  try {
    // Insert into audit log table
    await platform.env.DB.prepare(`
      INSERT INTO audit_logs (
        timestamp, action, user_id, resource_type, resource_id,
        changes, status, error_message, ip_address, user_agent, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      auditEntry.timestamp,
      auditEntry.action,
      auditEntry.userId,
      auditEntry.resourceType,
      auditEntry.resourceId,
      auditEntry.changes,
      auditEntry.status,
      auditEntry.errorMessage,
      auditEntry.ipAddress,
      auditEntry.userAgent,
      auditEntry.metadata
    ).run();
  } catch (err) {
    // Don't fail request if logging fails, but log the error
    console.error('Failed to log audit event:', err);
  }
}

/**
 * Log authentication event
 */
export async function logAuthEvent(platform, {
  action,  // 'login', 'logout', 'failed_login', 'password_change'
  userId,
  email,
  success,
  ipAddress,
  userAgent,
  reason = null
}) {
  await logAuditEvent({
    action: `auth_${action}`,
    userId,
    resourceType: 'auth',
    resourceId: email,
    status: success ? 'success' : 'failure',
    errorMessage: reason,
    ipAddress,
    userAgent
  }, platform);
}

/**
 * Log data modification event
 */
export async function logDataModification(platform, {
  action,  // 'create', 'update', 'delete'
  userId,
  resourceType,  // 'post', 'image', 'user'
  resourceId,
  changes,  // { before, after } or { fields: [...] }
  ipAddress,
  userAgent
}) {
  await logAuditEvent({
    action: `data_${action}`,
    userId,
    resourceType,
    resourceId,
    changes,
    ipAddress,
    userAgent
  }, platform);
}

/**
 * Log security event
 */
export async function logSecurityEvent(platform, {
  action,  // 'csrf_rejected', 'xss_blocked', 'rate_limit', 'auth_failure'
  resourceType,
  details,
  ipAddress,
  userAgent,
  userId = null
}) {
  await logAuditEvent({
    action: `security_${action}`,
    userId,
    resourceType,
    resourceId: details,
    status: 'blocked',
    metadata: { details },
    ipAddress,
    userAgent
  }, platform);
}

/**
 * Retrieve audit logs with filtering
 */
export async function getAuditLogs(platform, {
  userId = null,
  action = null,
  resourceType = null,
  startDate = null,
  endDate = null,
  limit = 100
}) {
  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];

  if (userId) {
    query += ' AND user_id = ?';
    params.push(userId);
  }

  if (action) {
    query += ' AND action LIKE ?';
    params.push(`%${action}%`);
  }

  if (resourceType) {
    query += ' AND resource_type = ?';
    params.push(resourceType);
  }

  if (startDate) {
    query += ' AND timestamp >= ?';
    params.push(startDate);
  }

  if (endDate) {
    query += ' AND timestamp <= ?';
    params.push(endDate);
  }

  query += ' ORDER BY timestamp DESC LIMIT ?';
  params.push(limit);

  return platform.env.DB.prepare(query).bind(...params).all();
}
```

**Database Schema**:
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id TEXT,
  resource_type TEXT,
  resource_id TEXT,
  changes TEXT,
  status TEXT,
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
```

**Usage**:
```javascript
import { logAuthEvent, logDataModification } from '$lib/utils/auditLog.js';

export async function POST({ request, locals, platform }) {
  const formData = await request.formData();
  const email = formData.get('email');
  const password = formData.get('password');

  try {
    // Authenticate user
    const user = await authenticateUser(email, password);

    if (user) {
      // Log successful login
      await logAuthEvent(platform, {
        action: 'login',
        userId: user.id,
        email,
        success: true,
        ipAddress: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent')
      });

      // Create session...
    } else {
      // Log failed login
      await logAuthEvent(platform, {
        action: 'login',
        email,
        success: false,
        reason: 'Invalid credentials',
        ipAddress: request.headers.get('x-forwarded-for'),
        userAgent: request.headers.get('user-agent')
      });

      throw error(401, 'Invalid credentials');
    }
  } catch (err) {
    // Log security event
    await logSecurityEvent(platform, {
      action: 'login_failure',
      resourceType: 'auth',
      details: err.message,
      ipAddress: request.headers.get('x-forwarded-for'),
      userAgent: request.headers.get('user-agent')
    });

    throw err;
  }
}
```

---

### Task 6: Add Filename Timestamps (45 min)

**File**: `src/lib/utils/fileNaming.js` (NEW)

**Issue**: Predictable filenames allow guessing uploads

**Solution**:
```javascript
/**
 * Secure filename generation with timestamps
 */

/**
 * Generate unique filename with timestamp and random suffix
 * @param {string} originalFilename - Original filename
 * @param {string} userId - User ID (for organizing)
 * @returns {string} New secure filename
 */
export function generateSecureFilename(originalFilename, userId = null) {
  // Extract extension
  const lastDot = originalFilename.lastIndexOf('.');
  const extension = lastDot > 0 ? originalFilename.slice(lastDot) : '';

  // Timestamp in format: YYYY-MM-DD-HHmmss
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[-:T.]/g, '')  // Remove separators
    .slice(0, 14);  // YYYYMMDDHHMMSS

  // Random suffix (6 chars)
  const random = Math.random().toString(36).substring(2, 8);

  // Combine with optional user ID directory
  const userDir = userId ? `${userId}/` : '';
  return `${userDir}${timestamp}-${random}${extension}`;
}

/**
 * Extract metadata from filename
 * @param {string} filename - Generated filename
 * @returns {object} Metadata
 */
export function parseSecureFilename(filename) {
  const match = filename.match(/(\d{14})-([a-z0-9]{6})\./);

  if (!match) {
    return null;
  }

  const [, timestamp, random] = match;

  // Parse timestamp back to date
  const year = parseInt(timestamp.slice(0, 4));
  const month = parseInt(timestamp.slice(4, 6));
  const day = parseInt(timestamp.slice(6, 8));
  const hour = parseInt(timestamp.slice(8, 10));
  const minute = parseInt(timestamp.slice(10, 12));
  const second = parseInt(timestamp.slice(12, 14));

  const date = new Date(year, month - 1, day, hour, minute, second);

  return {
    uploadedAt: date,
    random,
    timestamp
  };
}

/**
 * Generate organized file path
 * @param {string} originalFilename - Original file
 * @param {string} userId - User ID
 * @returns {string} Organized path: 2024/01/15/userid/filename
 */
export function generateOrganizedPath(originalFilename, userId) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const filename = generateSecureFilename(originalFilename, null);

  return `${year}/${month}/${day}/${userId}/${filename}`;
}
```

**Usage**:
```javascript
import { generateSecureFilename } from '$lib/utils/fileNaming.js';

export async function POST({ request, platform, locals }) {
  const formData = await request.formData();
  const file = formData.get('file');

  // Generate secure filename
  const secureFilename = generateSecureFilename(file.name, locals.user.id);

  // Upload to R2
  const arrayBuffer = await file.arrayBuffer();
  await platform.env.R2_BUCKET.put(secureFilename, arrayBuffer);

  return new Response(JSON.stringify({
    filename: secureFilename,
    url: `https://cdn.autumnsgrove.com/images/${secureFilename}`
  }));
}
```

**Test**:
```javascript
// Generate filename
const filename1 = generateSecureFilename('photo.jpg', 'user-123');
const filename2 = generateSecureFilename('photo.jpg', 'user-123');

// Should be different (timestamps/random different)
console.assert(filename1 !== filename2, 'Filenames should be unique');

// Should contain timestamp
console.assert(/\d{14}-[a-z0-9]{6}/.test(filename1), 'Should contain timestamp');

// Parse back
const metadata = parseSecureFilename(filename1);
console.assert(metadata.uploadedAt instanceof Date, 'Should parse timestamp');
```

---

### Task 7: Improve Input Validation (1.5 hours)

**File**: `src/lib/utils/validation.js` (ENHANCE existing)

**Add**:
```javascript
/**
 * Enhanced input validation utilities
 */

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid email
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;  // RFC 5321
}

/**
 * Validate password strength
 * @param {string} password - Password to check
 * @returns {object} { isValid, score, errors }
 */
export function validatePasswordStrength(password) {
  const errors = [];
  let score = 0;

  if (password.length < 12) {
    errors.push('Password must be at least 12 characters');
  } else {
    score += 1;
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  } else {
    score += 1;
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter');
  } else {
    score += 1;
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain number');
  } else {
    score += 1;
  }

  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain special character');
  } else {
    score += 1;
  }

  return {
    isValid: errors.length === 0,
    score,
    errors
  };
}

/**
 * Validate URL is safe
 * @param {string} url - URL to validate
 * @param {string[]} allowedDomains - Allowed domains
 * @returns {boolean} True if safe URL
 */
export function isValidUrl(url, allowedDomains = []) {
  try {
    const parsed = new URL(url);

    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    // Prevent javascript: URLs
    if (parsed.protocol === 'javascript:') {
      return false;
    }

    // Check against allowed domains if provided
    if (allowedDomains.length > 0) {
      return allowedDomains.includes(parsed.hostname);
    }

    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Validate slug format (for blog posts)
 * @param {string} slug - Slug to validate
 * @returns {boolean} True if valid slug
 */
export function isValidSlug(slug) {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length > 0 && slug.length <= 100;
}

/**
 * Sanitize input string
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized string
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>\"'`]/g, '')  // Remove HTML-like characters
    .slice(0, 1000);  // Limit length
}

/**
 * Validate numeric input
 * @param {any} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number|null} Validated number or null
 */
export function validateNumber(value, min = 0, max = Infinity) {
  const num = parseFloat(value);

  if (isNaN(num) || num < min || num > max) {
    return null;
  }

  return num;
}

/**
 * Validate array of values
 * @param {any[]} array - Array to validate
 * @param {string} expectedType - Expected element type
 * @param {number} maxLength - Maximum array length
 * @returns {boolean} True if valid
 */
export function isValidArray(array, expectedType, maxLength = 100) {
  if (!Array.isArray(array) || array.length > maxLength) {
    return false;
  }

  if (expectedType) {
    return array.every(item => typeof item === expectedType);
  }

  return true;
}
```

**Usage**:
```javascript
import {
  isValidEmail,
  validatePasswordStrength,
  isValidUrl,
  sanitizeInput
} from '$lib/utils/validation.js';

export async function POST({ request, locals, platform }) {
  const data = await request.json();

  // Validate email
  if (!isValidEmail(data.email)) {
    throw error(400, 'Invalid email format');
  }

  // Validate password strength
  const pwStrength = validatePasswordStrength(data.password);
  if (!pwStrength.isValid) {
    throw error(400, pwStrength.errors.join(', '));
  }

  // Sanitize username
  const username = sanitizeInput(data.username);

  // Validate URL if provided
  if (data.website && !isValidUrl(data.website, ['autumnsgrove.com'])) {
    throw error(400, 'Invalid website URL');
  }

  // Continue with registration...
}
```

---

## Dependencies

**Before Starting**:
- ✅ Phase 1-3 completed
- ✅ SQLite database available (for audit logging)
- ✅ No new npm packages needed

**Database Migration** (required for audit logging):
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  action TEXT NOT NULL,
  user_id TEXT,
  resource_type TEXT,
  resource_id TEXT,
  changes TEXT,
  status TEXT,
  error_message TEXT,
  ip_address TEXT,
  user_agent TEXT,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## Validation Checklist

After completing all tasks:

- [ ] Prototype pollution keys blocked (__proto__, constructor)
- [ ] Path traversal prevention validates all user paths
- [ ] Magic bytes validated for all image uploads
- [ ] SVG files rejected at magic byte check
- [ ] Error messages sanitized (no stack traces, file paths)
- [ ] Sensitive paths removed from logged errors
- [ ] Audit logging table created and working
- [ ] Auth events logged (login, logout, failures)
- [ ] Data modification events logged (create, update, delete)
- [ ] Security events logged (blocked requests, rate limits)
- [ ] Filenames include timestamps and random suffixes
- [ ] Input validation functions comprehensive
- [ ] Email validation working correctly
- [ ] Password strength validation enforced
- [ ] URL validation prevents javascript: protocol
- [ ] No console errors in dev mode
- [ ] Performance impact minimal (<3%)
- [ ] Git commit: "feat(security): enhance input validation, add audit logging, sanitize errors"

---

## Files Modified

**Total**: 13 files

**New Files** (6):
1. `src/lib/utils/json.js` (Safe JSON parsing)
2. `src/lib/utils/pathValidation.js` (Path traversal prevention)
3. `src/lib/utils/magicBytes.js` (Magic byte validation)
4. `src/lib/utils/errorHandler.js` (Error sanitization)
5. `src/lib/utils/auditLog.js` (Audit logging)
6. `src/lib/utils/fileNaming.js` (Secure filenames)

**Enhanced Files** (1):
1. `src/lib/utils/validation.js` (Add new validation functions)

**Modified Files** (6):
1. `src/routes/api/posts/+server.js` (Use safeJsonParse)
2. `src/routes/api/images/upload/+server.js` (Use magic byte validation)
3. `src/hooks.server.js` (Add audit logging middleware)
4. Various API endpoints (Use sanitized errors)
5. Auth endpoints (Log events)
6. Database schema (Add audit_logs table)

---

## Estimated Time Breakdown

| Task | Time | Complexity |
|------|------|-----------|
| 1. Prototype pollution prevention | 45 min | Straightforward |
| 2. Path traversal prevention | 1 hour | Straightforward |
| 3. Magic byte validation | 1 hour | Straightforward |
| 4. Error message sanitization | 1 hour | Straightforward |
| 5. Audit logging | 1.5 hours | Moderate - DB integration |
| 6. Filename timestamps | 45 min | Straightforward |
| 7. Input validation | 1.5 hours | Straightforward |
| **Total** | **8 hours** | **Complete phase** |

---

## Rollback Procedure

If any task breaks functionality:

```bash
# Revert specific file
git checkout HEAD~1 -- src/lib/utils/errorHandler.js

# Or full revert
git reset --hard HEAD~1
```

**If audit logging breaks**:
- Drop the audit_logs table: `DROP TABLE audit_logs;`
- Audit logging is non-critical and can be disabled temporarily

---

## Next Phase

After completion → [phase5_testing.md](./phase5_testing.md)

**Risk reduction achieved**: 4% (total: 99% from initial state)
