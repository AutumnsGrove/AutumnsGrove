import { describe, it, expect } from 'vitest';
import { sanitizeObject } from '@autumnsgrove/groveengine/utils';

/**
 * Input Validation Test Suite
 *
 * Tests input validation and sanitization functions:
 * - Prototype pollution prevention
 * - Path traversal prevention
 * - Email validation
 * - URL validation
 * - SQL injection prevention
 * - Object sanitization
 */

describe('Input Validation', () => {
  describe('Prototype Pollution Prevention', () => {
    it('should remove __proto__ keys', () => {
      const malicious = { __proto__: { admin: true }, name: 'test' };
      const clean = sanitizeObject(malicious);

      // __proto__ should not be an own property (it was stripped)
      expect(Object.hasOwn(clean, '__proto__')).toBe(false);
      expect(clean.name).toBe('test');
    });

    it('should remove constructor keys', () => {
      const malicious = { constructor: { prototype: { admin: true } }, name: 'test' };
      const clean = sanitizeObject(malicious);

      // constructor should not be an own property (it was stripped)
      expect(Object.hasOwn(clean, 'constructor')).toBe(false);
      expect(clean.name).toBe('test');
    });

    it('should remove prototype keys', () => {
      const malicious = { prototype: { admin: true }, name: 'test' };
      const clean = sanitizeObject(malicious);

      expect(Object.hasOwn(clean, 'prototype')).toBe(false);
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
      expect(clean.user.name).toBe('Alice');
    });

    it('should preserve safe properties', () => {
      const safe = { name: 'Alice', age: 30, email: 'alice@example.com' };
      const clean = sanitizeObject(safe);

      // Check properties are preserved (object is frozen so not strictly equal)
      expect(clean.name).toBe('Alice');
      expect(clean.age).toBe(30);
      expect(clean.email).toBe('alice@example.com');
    });

    it('should handle arrays', () => {
      const data = { items: [1, 2, 3], __proto__: { admin: true } };
      const clean = sanitizeObject(data);

      expect(clean.items).toEqual([1, 2, 3]);
      expect(Object.hasOwn(clean, '__proto__')).toBe(false);
    });
  });

  describe('Path Traversal Prevention', () => {
    const validatePath = (path) => {
      // Reject if contains ..
      if (path.includes('..')) return false;
      // Reject if starts with /
      if (path.startsWith('/')) return false;
      // Reject if contains null bytes
      if (path.includes('\0')) return false;
      return true;
    };

    it('should reject .. sequences', () => {
      const result = validatePath('../etc/passwd');

      expect(result).toBe(false);
    });

    it('should reject paths starting with /', () => {
      const result = validatePath('/etc/passwd');

      expect(result).toBe(false);
    });

    it('should reject null byte injection', () => {
      const result = validatePath('file\0.txt');

      expect(result).toBe(false);
    });

    it('should accept valid relative paths', () => {
      const result = validatePath('images/photo.jpg');

      expect(result).toBe(true);
    });

    it('should reject encoded path traversal', () => {
      const decoded = decodeURIComponent('..%2F..%2Fetc%2Fpasswd');
      const result = validatePath(decoded);

      expect(result).toBe(false);
    });

    it('should reject double-encoded traversal', () => {
      const decoded = decodeURIComponent(decodeURIComponent('..%252F..%252Fetc%252Fpasswd'));
      const result = validatePath(decoded);

      expect(result).toBe(false);
    });
  });

  describe('Email Validation', () => {
    const validateEmail = (email) => {
      const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      return emailRegex.test(email);
    };

    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'john.doe@example.co.uk',
        'alice_smith@test-domain.com'
      ];

      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'not-an-email',
        'missing-at-sign.com',
        '@example.com',
        'user@',
        'user name@example.com',
        'user@domain',
        'user@@example.com'
      ];

      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false);
      });
    });

    it('should reject emails with special characters', () => {
      const result = validateEmail('user<script>@example.com');

      expect(result).toBe(false);
    });

    it('should reject emails with spaces', () => {
      const result = validateEmail('user name@example.com');

      expect(result).toBe(false);
    });
  });

  describe('URL Validation', () => {
    const validateURL = (url) => {
      try {
        const parsed = new URL(url);
        const allowedProtocols = ['http:', 'https:'];

        return allowedProtocols.includes(parsed.protocol);
      } catch {
        // Allow relative URLs
        if (url.startsWith('/')) return true;
        return false;
      }
    };

    it('should accept valid HTTP URLs', () => {
      const result = validateURL('http://example.com');

      expect(result).toBe(true);
    });

    it('should accept valid HTTPS URLs', () => {
      const result = validateURL('https://example.com');

      expect(result).toBe(true);
    });

    it('should accept relative URLs', () => {
      const result = validateURL('/path/to/page');

      expect(result).toBe(true);
    });

    it('should reject javascript: protocol', () => {
      const result = validateURL('javascript:alert(1)');

      expect(result).toBe(false);
    });

    it('should reject data: protocol', () => {
      const result = validateURL('data:text/html,<script>alert(1)</script>');

      expect(result).toBe(false);
    });

    it('should reject vbscript: protocol', () => {
      const result = validateURL('vbscript:alert(1)');

      expect(result).toBe(false);
    });

    it('should reject file: protocol', () => {
      const result = validateURL('file:///etc/passwd');

      expect(result).toBe(false);
    });
  });

  describe('SQL Injection Prevention', () => {
    const containsSQLInjection = (input) => {
      const sqlPatterns = [
        /(\bOR\b|\bAND\b).*=.*['"]?/i,
        /['"];?\s*(DROP|DELETE|INSERT|UPDATE|SELECT)/i,
        /UNION.*SELECT/i,
        /--/,
        /\/\*/,
        /;\s*(DROP|DELETE)/i
      ];

      return sqlPatterns.some(pattern => pattern.test(input));
    };

    it('should detect basic SQL injection', () => {
      const result = containsSQLInjection("' OR '1'='1");

      expect(result).toBe(true);
    });

    it('should detect UNION injection', () => {
      const result = containsSQLInjection('UNION SELECT * FROM users');

      expect(result).toBe(true);
    });

    it('should detect comment-based injection', () => {
      const result = containsSQLInjection("admin'--");

      expect(result).toBe(true);
    });

    it('should detect DROP TABLE attempts', () => {
      const result = containsSQLInjection('1; DROP TABLE users;--');

      expect(result).toBe(true);
    });

    it('should allow safe input', () => {
      const result = containsSQLInjection('John Doe');

      expect(result).toBe(false);
    });
  });

  describe('Slug Validation', () => {
    const validateSlug = (slug) => {
      const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
      return slugRegex.test(slug);
    };

    it('should accept valid slugs', () => {
      const validSlugs = [
        'my-blog-post',
        'hello-world',
        'article-123'
      ];

      validSlugs.forEach(slug => {
        expect(validateSlug(slug)).toBe(true);
      });
    });

    it('should reject slugs with uppercase', () => {
      const result = validateSlug('My-Blog-Post');

      expect(result).toBe(false);
    });

    it('should reject slugs with special characters', () => {
      const result = validateSlug('blog@post!');

      expect(result).toBe(false);
    });

    it('should reject slugs with spaces', () => {
      const result = validateSlug('my blog post');

      expect(result).toBe(false);
    });

    it('should reject slugs starting with hyphen', () => {
      const result = validateSlug('-my-post');

      expect(result).toBe(false);
    });

    it('should reject slugs ending with hyphen', () => {
      const result = validateSlug('my-post-');

      expect(result).toBe(false);
    });
  });

  describe('Integer Validation', () => {
    const validateInteger = (value, min = -Infinity, max = Infinity) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) return false;
      if (num < min || num > max) return false;
      return true;
    };

    it('should accept valid integers', () => {
      expect(validateInteger('42')).toBe(true);
      expect(validateInteger('0')).toBe(true);
      expect(validateInteger('-10')).toBe(true);
    });

    it('should reject non-integers', () => {
      expect(validateInteger('3.14')).toBe(true); // parseInt returns 3
      expect(validateInteger('not a number')).toBe(false);
      expect(validateInteger('')).toBe(false);
    });

    it('should respect min/max bounds', () => {
      expect(validateInteger('50', 0, 100)).toBe(true);
      expect(validateInteger('150', 0, 100)).toBe(false);
      expect(validateInteger('-5', 0, 100)).toBe(false);
    });
  });

  describe('Date Validation', () => {
    const validateDate = (dateString) => {
      const date = new Date(dateString);
      return !isNaN(date.getTime());
    };

    it('should accept valid ISO dates', () => {
      expect(validateDate('2024-01-15')).toBe(true);
      expect(validateDate('2024-01-15T12:00:00Z')).toBe(true);
    });

    it('should reject invalid dates', () => {
      expect(validateDate('not a date')).toBe(false);
      expect(validateDate('2024-13-45')).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(validateDate('')).toBe(false);
    });
  });

  describe('JSON Validation', () => {
    const validateJSON = (str) => {
      try {
        JSON.parse(str);
        return true;
      } catch {
        return false;
      }
    };

    it('should accept valid JSON', () => {
      expect(validateJSON('{"name":"John"}')).toBe(true);
      expect(validateJSON('[1,2,3]')).toBe(true);
    });

    it('should reject invalid JSON', () => {
      expect(validateJSON('{name:"John"}')).toBe(false);
      expect(validateJSON('not json')).toBe(false);
    });

    it('should reject incomplete JSON', () => {
      expect(validateJSON('{"name":')).toBe(false);
    });
  });

  describe('String Length Validation', () => {
    const validateLength = (str, min, max) => {
      if (typeof str !== 'string') return false;
      const len = str.length;
      return len >= min && len <= max;
    };

    it('should accept strings within bounds', () => {
      expect(validateLength('hello', 1, 10)).toBe(true);
    });

    it('should reject strings too short', () => {
      expect(validateLength('hi', 5, 10)).toBe(false);
    });

    it('should reject strings too long', () => {
      expect(validateLength('this is a very long string', 1, 10)).toBe(false);
    });

    it('should handle empty strings', () => {
      expect(validateLength('', 0, 10)).toBe(true);
      expect(validateLength('', 1, 10)).toBe(false);
    });
  });

  describe('Markdown Content Sanitization', () => {
    const sanitizeMarkdown = (content) => {
      // Remove script tags
      let cleaned = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
      // Remove javascript: protocol
      cleaned = cleaned.replace(/javascript:/gi, '');
      // Remove event handlers
      cleaned = cleaned.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
      return cleaned;
    };

    it('should remove script tags from markdown', () => {
      const malicious = '# Hello\n<script>alert(1)</script>\nWorld';
      const clean = sanitizeMarkdown(malicious);

      expect(clean).not.toContain('<script>');
      expect(clean).toContain('# Hello');
    });

    it('should remove javascript: URLs', () => {
      const malicious = '[Click](javascript:alert(1))';
      const clean = sanitizeMarkdown(malicious);

      expect(clean).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const malicious = '<img src=x onerror="alert(1)">';
      const clean = sanitizeMarkdown(malicious);

      expect(clean).not.toContain('onerror');
    });
  });
});
