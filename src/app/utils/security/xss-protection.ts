/**
 * @file XSS防护工具
 * @description 提供XSS防护功能，包括HTML转义、输入验证等
 * @module utils/security
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-31
 */

const XSS_PATTERNS = {
  script: /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  onEvent: /on\w+\s*=/gi,
  javascript: /javascript:/gi,
  data: /data:\w+\/[^;]+;base64/gi,
  iframe: /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
  object: /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
  embed: /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
  style: /<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi,
  meta: /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*<\/meta>/gi,
  link: /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
};

const HTML_ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
};

const HTML_ENTITY_REVERSE_MAP: Record<string, string> = Object.entries(
  HTML_ENTITY_MAP
).reduce((acc, [key, value]) => ({ ...acc, [value]: key }), {});

export interface XSSSanitizeOptions {
  allowedTags?: string[];
  allowedAttributes?: Record<string, string[]>;
  stripTags?: boolean;
  stripComments?: boolean;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

export class XSSProtection {
  private static instance: XSSProtection;

  private constructor() {}

  public static getInstance(): XSSProtection {
    if (!XSSProtection.instance) {
      XSSProtection.instance = new XSSProtection();
    }
    return XSSProtection.instance;
  }

  escapeHTML(input: string): string {
    if (typeof input !== 'string') {
      return String(input);
    }

    return input.replace(/[&<>"'`=/]/g, (char) => HTML_ENTITY_MAP[char] || char);
  }

  unescapeHTML(input: string): string {
    if (typeof input !== 'string') {
      return String(input);
    }

    return input.replace(
      /&(amp|lt|gt|quot|#x27|#x2F|#x60|#x3D);/g,
      (entity) => HTML_ENTITY_REVERSE_MAP[entity] || entity
    );
  }

  sanitize(input: string, options: XSSSanitizeOptions = {}): string {
    if (typeof input !== 'string') {
      return String(input);
    }

    let sanitized = input;

    if (options.stripComments !== false) {
      sanitized = this.stripComments(sanitized);
    }

    sanitized = this.removeDangerousPatterns(sanitized);

    if (options.stripTags) {
      sanitized = this.stripAllTags(sanitized);
    } else if (options.allowedTags) {
      sanitized = this.stripTagsExcept(sanitized, options.allowedTags, options.allowedAttributes);
    }

    return sanitized;
  }

  sanitizeObject<T extends Record<string, any>>(obj: T, options: XSSSanitizeOptions = {}): T {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return this.sanitizeArray(obj as any[], options) as unknown as T;
    }

    const sanitized: Record<string, any> = {};

    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];

        if (typeof value === 'string') {
          sanitized[key] = this.sanitize(value, options);
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = this.sanitizeObject(value, options);
        } else if (Array.isArray(value)) {
          sanitized[key] = this.sanitizeArray(value, options);
        } else {
          sanitized[key] = value;
        }
      }
    }

    return sanitized as T;
  }

  sanitizeArray<T>(arr: T[], options: XSSSanitizeOptions = {}): T[] {
    return arr.map((item) => {
      if (typeof item === 'string') {
        return this.sanitize(item, options) as T;
      } else if (typeof item === 'object' && item !== null) {
        return this.sanitizeObject(item as Record<string, any>, options) as T;
      } else if (Array.isArray(item)) {
        return this.sanitizeArray(item as T[], options) as T;
      }
      return item;
    });
  }

  validateInput(input: string, patterns: RegExp[] = Object.values(XSS_PATTERNS)): boolean {
    if (typeof input !== 'string') {
      return false;
    }

    for (const pattern of patterns) {
      if (pattern.test(input)) {
        return false;
      }
    }

    return true;
  }

  private stripComments(input: string): string {
    return input.replace(/<!--[\s\S]*?-->/g, '');
  }

  private removeDangerousPatterns(input: string): string {
    let sanitized = input;

    for (const pattern of Object.values(XSS_PATTERNS)) {
      sanitized = sanitized.replace(pattern, '');
    }

    return sanitized;
  }

  private stripAllTags(input: string): string {
    return input.replace(/<[^>]+>/g, '');
  }

  private stripTagsExcept(
    input: string,
    allowedTags: string[],
    allowedAttributes?: Record<string, string[]>
  ): string {
    const tagPattern = /<\/?(\w+)(?:\s+[^>]*)?\/?>/g;
    const attrPattern = /(\w+)=["'][^"']*["']/g;

    return input.replace(tagPattern, (match, tagName, attributes) => {
      const lowerTag = tagName.toLowerCase();

      if (!allowedTags.includes(lowerTag)) {
        return '';
      }

      if (attributes && allowedAttributes?.[lowerTag]) {
        const allowedAttrs = allowedAttributes[lowerTag];
        const sanitizedAttrs = attributes.replace(attrPattern, (attrMatch: string, attrName: string) => {
          return allowedAttrs.includes(attrName.toLowerCase()) ? attrMatch : '';
        });

        return match.replace(attributes, sanitizedAttrs);
      }

      return match;
    });
  }
}

export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = {
      ...config,
      maxRequests: config.maxRequests ?? 100,
      windowMs: config.windowMs ?? 60000,
    };
  }

  check(identifier: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }

    const timestamps = this.requests.get(identifier)!;
    const validRequests = timestamps.filter(time => time > windowStart);

    const success = validRequests.length < this.config.maxRequests;

    if (success) {
      validRequests.push(now);
      this.requests.set(identifier, validRequests);
    }

    const remaining = Math.max(0, this.config.maxRequests - validRequests.length);

    return {
      success,
      remaining,
      resetTime: windowStart + this.config.windowMs,
      limit: this.config.maxRequests,
    };
  }

  reset(identifier?: string): void {
    if (identifier) {
      this.requests.delete(identifier);
    } else {
      this.requests.clear();
    }
  }

  cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const [identifier, timestamps] of this.requests.entries()) {
      const validRequests = timestamps.filter(time => time > windowStart);

      if (validRequests.length === 0) {
        this.requests.delete(identifier);
      } else {
        this.requests.set(identifier, validRequests);
      }
    }
  }
}

export const xssProtection = XSSProtection.getInstance();

export const escapeHTML = (input: string): string => xssProtection.escapeHTML(input);

export const unescapeHTML = (input: string): string => xssProtection.unescapeHTML(input);

export const sanitize = (input: string, options?: XSSSanitizeOptions): string =>
  xssProtection.sanitize(input, options);

export const sanitizeObject = <T extends Record<string, any>>(
  obj: T,
  options?: XSSSanitizeOptions
): T => xssProtection.sanitizeObject(obj, options);

export const validateInput = (input: string): boolean =>
  xssProtection.validateInput(input);

export default XSSProtection;
