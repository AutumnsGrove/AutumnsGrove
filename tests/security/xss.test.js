import { describe, it, expect, beforeEach } from 'vitest';
import { sanitizeHTML, sanitizeSVG, sanitizeURL } from '../../src/lib/utils/sanitize.js';

/**
 * XSS Protection Test Suite
 *
 * Tests sanitization of user input to prevent Cross-Site Scripting attacks.
 * These tests verify that HTML/SVG sanitization functions properly strip
 * dangerous tags, attributes, and protocols.
 *
 * Note: These tests will initially FAIL until sanitization utilities are implemented.
 * This is expected TDD behavior.
 */

describe('XSS Protection', () => {
  describe('HTML Sanitization', () => {
    // sanitizeHTML is imported from sanitize.js at the top of file

    it('should remove script tags', () => {
      const malicious = '<p>Hello</p><script>alert("XSS")</script>';
      const clean = sanitizeHTML(malicious);

      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert');
      expect(clean).toContain('<p>Hello</p>');
    });

    it('should remove event handlers from img tags', () => {
      const malicious = '<img src=x onerror="alert(1)">';
      const clean = sanitizeHTML(malicious);

      expect(clean).not.toContain('onerror');
      expect(clean).not.toContain('alert');
    });

    it('should remove onclick event handlers', () => {
      const malicious = '<div onclick="alert(\'XSS\')">Click me</div>';
      const clean = sanitizeHTML(malicious);

      expect(clean).not.toContain('onclick');
      expect(clean).not.toContain('alert');
    });

    it('should remove onload event handlers', () => {
      const malicious = '<body onload="alert(\'XSS\')">Content</body>';
      const clean = sanitizeHTML(malicious);

      expect(clean).not.toContain('onload');
      expect(clean).not.toContain('alert');
    });

    it('should remove javascript: protocol from links', () => {
      const malicious = '<a href="javascript:alert(1)">Click</a>';
      const clean = sanitizeHTML(malicious);

      expect(clean).not.toContain('javascript:');
      expect(clean).not.toContain('alert');
    });

    it('should remove javascript: protocol from img src', () => {
      const malicious = '<img src="javascript:alert(\'XSS\')">';
      const clean = sanitizeHTML(malicious);

      expect(clean).not.toContain('javascript:');
    });

    it('should remove javascript: protocol from iframe src', () => {
      const malicious = '<iframe src="javascript:alert(\'XSS\')"></iframe>';
      const clean = sanitizeHTML(malicious);

      expect(clean).not.toContain('javascript:');
      expect(clean).not.toContain('<iframe');
    });

    it('should handle HTML entities without executing them', () => {
      const encoded = '&lt;script&gt;alert("XSS")&lt;/script&gt;';
      const clean = sanitizeHTML(encoded);

      // Should preserve entity encoding or strip script tags after decoding
      const hasNoScript = !clean.includes('<script>') || clean.includes('&lt;script&gt;');
      expect(hasNoScript).toBe(true);
    });

    it('should remove style tags with dangerous content', () => {
      const malicious = '<style>@import \'javascript:alert("XSS")\';</style>';
      const clean = sanitizeHTML(malicious);

      expect(clean).not.toContain('javascript:');
      expect(clean).not.toContain('<style>');
    });

    it('should remove style attributes with javascript URLs', () => {
      const malicious = '<div style="background:url(javascript:alert(1))">Test</div>';
      const clean = sanitizeHTML(malicious);

      expect(clean).not.toContain('javascript:');
    });

    it('should handle multiple script tags', () => {
      const malicious = '<p>Start</p><script>alert(1)</script><p>Middle</p><script>alert(2)</script><p>End</p>';
      const clean = sanitizeHTML(malicious);

      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert');
      expect(clean).toContain('Start');
      expect(clean).toContain('End');
    });

    it('should remove data: protocol URIs', () => {
      const malicious = '<a href="data:text/html,<script>alert(1)</script>">Click</a>';
      const clean = sanitizeHTML(malicious);

      expect(clean).not.toContain('data:text/html');
      expect(clean).not.toContain('<script>');
    });

    it('should remove vbscript: protocol', () => {
      const malicious = '<a href="vbscript:alert(1)">Click</a>';
      const clean = sanitizeHTML(malicious);

      expect(clean).not.toContain('vbscript:');
    });

    it('should handle nested event handlers', () => {
      const malicious = '<div><span onclick="alert(1)">Text</span></div>';
      const clean = sanitizeHTML(malicious);

      expect(clean).not.toContain('onclick');
    });

    it('should remove onmouseover handlers', () => {
      const malicious = '<div onmouseover="alert(\'XSS\')">Hover me</div>';
      const clean = sanitizeHTML(malicious);

      expect(clean).not.toContain('onmouseover');
    });

    it('should handle case variations in script tags', () => {
      const malicious = '<ScRiPt>alert("XSS")</ScRiPt>';
      const clean = sanitizeHTML(malicious);

      expect(clean.toLowerCase()).not.toContain('<script>');
    });

    it('should remove embed tags', () => {
      const malicious = '<embed src="javascript:alert(1)">';
      const clean = sanitizeHTML(malicious);

      expect(clean).not.toContain('<embed');
    });

    it('should remove object tags', () => {
      const malicious = '<object data="javascript:alert(1)"></object>';
      const clean = sanitizeHTML(malicious);

      expect(clean).not.toContain('<object');
    });

    it('should handle mixed dangerous and safe content', () => {
      const malicious = '<p>Safe text</p><script>alert(1)</script><strong>More safe text</strong>';
      const clean = sanitizeHTML(malicious);

      expect(clean).toContain('Safe text');
      expect(clean).toContain('More safe text');
      expect(clean).not.toContain('<script>');
    });

    it('should preserve safe HTML while removing dangerous parts', () => {
      const mixed = '<h1>Title</h1><p>Paragraph</p><script>alert(1)</script><a href="http://example.com">Link</a>';
      const clean = sanitizeHTML(mixed);

      expect(clean).toContain('<h1>Title</h1>');
      expect(clean).toContain('<p>Paragraph</p>');
      expect(clean).not.toContain('<script>');
      expect(clean).toContain('example.com');
    });
  });

  describe('SVG Sanitization', () => {
    // sanitizeSVG is imported from sanitize.js at the top of file

    it('should remove script tags from SVG', () => {
      const malicious = '<svg><script>alert(1)</script></svg>';
      const clean = sanitizeSVG(malicious);

      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert');
    });

    it('should remove onload handlers from SVG', () => {
      const malicious = '<svg onload="alert(\'XSS\')"><circle cx="50" cy="50" r="40" /></svg>';
      const clean = sanitizeSVG(malicious);

      expect(clean).not.toContain('onload');
      expect(clean).not.toContain('alert');
    });

    it('should remove event handlers from SVG elements', () => {
      const malicious = '<svg><circle onclick="alert(1)" cx="50" cy="50" r="40" /></svg>';
      const clean = sanitizeSVG(malicious);

      expect(clean).not.toContain('onclick');
    });

    it('should handle SVG with xlink:href javascript protocol', () => {
      const malicious = '<svg><a xlink:href="javascript:alert(1)"><text>Click</text></a></svg>';
      const clean = sanitizeSVG(malicious);

      expect(clean).not.toContain('javascript:');
    });

    it('should preserve safe SVG structure', () => {
      const safe = '<svg><circle cx="50" cy="50" r="40" fill="blue" /></svg>';
      const clean = sanitizeSVG(safe);

      expect(clean).toContain('circle');
      expect(clean).toContain('cx="50"');
      expect(clean).toContain('fill="blue"');
    });
  });

  describe('Mermaid Diagram Sanitization', () => {
    // Use sanitizeHTML for Mermaid diagram labels
    const sanitizeMermaid = sanitizeHTML;

    it('should remove script tags from Mermaid node labels', () => {
      const malicious = 'graph TD\n    A[<script>alert("XSS")</script>]\n    B[Normal]';
      const clean = sanitizeMermaid(malicious);

      expect(clean).not.toContain('<script>');
      expect(clean).not.toContain('alert');
    });

    it('should remove img onerror from Mermaid nodes', () => {
      const malicious = 'graph TD\n    A[<img src=x onerror=alert(1)>]\n    B[Normal]';
      const clean = sanitizeMermaid(malicious);

      expect(clean).not.toContain('onerror');
    });

    it('should preserve valid Mermaid syntax', () => {
      const valid = 'graph TD\n    A[Start] --> B[End]';
      const clean = sanitizeMermaid(valid);

      expect(clean).toContain('graph TD');
      expect(clean).toContain('A[Start]');
      expect(clean).toContain('B[End]');
    });
  });

  describe('URL Sanitization', () => {
    // sanitizeURL is imported at the top of the file

    it('should reject javascript: protocol URLs', () => {
      const result = sanitizeURL('javascript:alert(1)');

      expect(result).not.toBe('javascript:alert(1)');
      expect(result).not.toContain('javascript:');
    });

    it('should reject data: protocol URLs', () => {
      const result = sanitizeURL('data:text/html,<script>alert(1)</script>');

      expect(result).not.toContain('data:text/html');
    });

    it('should reject vbscript: protocol URLs', () => {
      const result = sanitizeURL('vbscript:alert(1)');

      expect(result).not.toContain('vbscript:');
    });

    it('should allow http:// URLs', () => {
      const result = sanitizeURL('http://example.com');

      expect(result).toBe('http://example.com');
    });

    it('should allow https:// URLs', () => {
      const result = sanitizeURL('https://example.com');

      expect(result).toBe('https://example.com');
    });

    it('should allow relative URLs', () => {
      const result = sanitizeURL('/path/to/page');

      expect(result).toBe('/path/to/page');
    });
  });
});
