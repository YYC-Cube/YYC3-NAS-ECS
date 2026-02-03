import { describe, it, expect } from 'vitest';
import {
  RateLimiter,
  escapeHTML,
  unescapeHTML,
  sanitize,
  sanitizeObject,
  validateInput,
  xssProtection,
} from '../xss-protection';

describe('XSSProtection', () => {
  describe('escapeHTML', () => {
    it('应该转义HTML特殊字符', () => {
      expect(xssProtection.escapeHTML('<script>alert("XSS")</script>')).toBe(
        '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;'
      );
      expect(xssProtection.escapeHTML('<div>Content</div>')).toBe(
        '&lt;div&gt;Content&lt;&#x2F;div&gt;'
      );
      expect(xssProtection.escapeHTML('&')).toBe('&amp;');
    });

    it('应该处理非字符串输入', () => {
      expect(xssProtection.escapeHTML(String(123))).toBe('123');
      expect(xssProtection.escapeHTML(String(null))).toBe('null');
      expect(xssProtection.escapeHTML(String(undefined))).toBe('undefined');
    });
  });

  describe('unescapeHTML', () => {
    it('应该反转义HTML实体', () => {
      expect(xssProtection.unescapeHTML('&lt;script&gt;')).toBe('<script>');
      expect(xssProtection.unescapeHTML('&amp;')).toBe('&');
      expect(xssProtection.unescapeHTML('&quot;')).toBe('"');
    });

    it('应该处理非字符串输入', () => {
      expect(xssProtection.unescapeHTML(String(123))).toBe('123');
    });
  });

  describe('sanitize', () => {
    it('应该移除危险脚本标签', () => {
      const input = '<script>alert("XSS")</script><p>Safe content</p>';
      const result = xssProtection.sanitize(input, { stripTags: true });
      expect(result).not.toContain('<script>');
      expect(result).toContain('Safe content');
    });

    it('应该移除危险事件处理器', () => {
      const input = '<div onclick="alert(1)">Click me</div>';
      const result = xssProtection.sanitize(input, { stripTags: true });
      expect(result).not.toContain('onclick');
    });

    it('应该保留允许的标签', () => {
      const input = '<p>Paragraph</p><script>alert(1)</script>';
      const result = xssProtection.sanitize(input, {
        allowedTags: ['p'],
      });
      expect(result).toContain('<p>');
      expect(result).not.toContain('<script>');
    });

    it('应该移除HTML注释', () => {
      const input = '<!-- Comment --><p>Content</p>';
      const result = xssProtection.sanitize(input, { stripComments: true });
      expect(result).not.toContain('<!--');
      expect(result).toContain('Content');
    });
  });

  describe('sanitizeObject', () => {
    it('应该清理对象中的字符串属性', () => {
      const input = {
        name: '<script>alert(1)</script>',
        age: 25,
        nested: {
          description: '<img src=x onerror=alert(1)>',
        },
      };
      const result = xssProtection.sanitizeObject(input, { stripTags: true });
      expect(result.name).not.toContain('<script>');
      expect(result.age).toBe(25);
      expect(result.nested.description).not.toContain('onerror');
    });
  });

  describe('sanitizeArray', () => {
    it('应该清理数组中的字符串元素', () => {
      const input = [
        '<script>alert(1)</script>',
        'safe text',
        { nested: '<img src=x onerror=alert(1)>' },
      ];
      const result = xssProtection.sanitizeArray(input, { stripTags: true });
      expect(result[0]).not.toContain('<script>');
      expect(result[1]).toBe('safe text');
      if (typeof result[2] === 'object' && result[2] !== null && 'nested' in result[2]) {
        expect((result[2] as { nested: string }).nested).not.toContain('onerror');
      }
    });
  });

  describe('validateInput', () => {
    it('应该检测脚本注入', () => {
      expect(validateInput('<script>alert(1)</script>')).toBe(false);
      expect(validateInput('<img src=x onerror=alert(1)>')).toBe(false);
    });

    it('应该通过安全输入', () => {
      expect(validateInput('safe text')).toBe(true);
      expect(validateInput('<p>safe</p>')).toBe(true);
    });
  });
});

describe('RateLimiter', () => {
  describe('check', () => {
    it('应该限制请求频率', () => {
      const limiter = new RateLimiter({
        maxRequests: 3,
        windowMs: 1000,
      });

      const result1 = limiter.check('user1');
      expect(result1.success).toBe(true);
      expect(result1.remaining).toBe(2);

      const result2 = limiter.check('user1');
      expect(result2.success).toBe(true);
      expect(result2.remaining).toBe(1);

      const result3 = limiter.check('user1');
      expect(result3.success).toBe(true);
      expect(result3.remaining).toBe(0);

      const result4 = limiter.check('user1');
      expect(result4.success).toBe(false);
      expect(result4.remaining).toBe(0);
    });

    it('应该为不同用户分别计数', () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 1000,
      });

      const user1Result1 = limiter.check('user1');
      const user1Result2 = limiter.check('user1');
      const user2Result1 = limiter.check('user2');

      expect(user1Result1.success).toBe(true);
      expect(user1Result2.success).toBe(true);
      expect(user2Result1.success).toBe(true);
    });

    it('应该在时间窗口后重置', () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 100,
      });

      limiter.check('user1');
      limiter.check('user1');

      const result3 = limiter.check('user1');
      expect(result3.success).toBe(false);

      return new Promise((resolve) => {
        setTimeout(() => {
          const result4 = limiter.check('user1');
          expect(result4.success).toBe(true);
          resolve(undefined);
        }, 150);
      });
    });
  });

  describe('reset', () => {
    it('应该重置特定用户的计数', () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 1000,
      });

      limiter.check('user1');
      limiter.check('user1');

      limiter.reset('user1');

      const result = limiter.check('user1');
      expect(result.success).toBe(true);
    });

    it('应该重置所有用户的计数', () => {
      const limiter = new RateLimiter({
        maxRequests: 2,
        windowMs: 1000,
      });

      limiter.check('user1');
      limiter.check('user1');
      limiter.check('user2');
      limiter.check('user2');

      limiter.reset();

      expect(limiter.check('user1').success).toBe(true);
      expect(limiter.check('user2').success).toBe(true);
    });
  });

  describe('cleanup', () => {
    it('应该清理过期的请求记录', () => {
      const limiter = new RateLimiter({
        maxRequests: 10,
        windowMs: 100,
      });

      for (let i = 0; i < 5; i++) {
        limiter.check('user1');
      }

      limiter.cleanup();

      return new Promise((resolve) => {
        setTimeout(() => {
          limiter.cleanup();
          const result = limiter.check('user1');
          expect(result.success).toBe(true);
          resolve(undefined);
        }, 150);
      });
    });
  });
});

describe('导出函数', () => {
  it('应该正确导出escapeHTML函数', () => {
    expect(escapeHTML).toBeDefined();
    expect(escapeHTML('<script>')).toBe('&lt;script&gt;');
  });

  it('应该正确导出unescapeHTML函数', () => {
    expect(unescapeHTML).toBeDefined();
    expect(unescapeHTML('&lt;')).toBe('<');
  });

  it('应该正确导出sanitize函数', () => {
    expect(sanitize).toBeDefined();
    expect(sanitize('<script>alert(1)</script>', { stripTags: true })).not.toContain('<script>');
  });

  it('应该正确导出sanitizeObject函数', () => {
    expect(sanitizeObject).toBeDefined();
    const result = sanitizeObject({ x: '<script>' }, { stripTags: true });
    expect(result.x).not.toContain('<script>');
  });

  it('应该正确导出validateInput函数', () => {
    expect(validateInput).toBeDefined();
    expect(validateInput('<script>alert(1)</script>')).toBe(false);
  });
});
