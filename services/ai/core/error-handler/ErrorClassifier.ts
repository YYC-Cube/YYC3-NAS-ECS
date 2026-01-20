import { YYC3Error, ErrorSeverity, ErrorCategory } from './ErrorTypes';

export interface ErrorPattern {
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  keywords: string[];
  patterns: RegExp[];
  customMatcher?: (error: Error | YYC3Error) => boolean;
}

export interface ErrorClassificationResult {
  category: ErrorCategory;
  severity: ErrorSeverity;
  confidence: number;
  matchedPattern?: string;
}

export class ErrorClassifier {
  private patterns: ErrorPattern[] = [];
  private errorFrequency: Map<string, number> = new Map();
  private errorSeverityHistory: Map<string, ErrorSeverity[]> = new Map();
  private readonly FREQUENCY_THRESHOLD = 5;
  private readonly CONFIDENCE_THRESHOLD = 0.7;

  constructor() {
    this.initializeDefaultPatterns();
  }

  private initializeDefaultPatterns(): void {
    this.patterns = [
      {
        code: 'NETWORK_ERROR',
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.HIGH,
        keywords: ['network', 'connection', 'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT'],
        patterns: [
          /network/i,
          /connection/i,
          /ECONNREFUSED/i,
          /ENOTFOUND/i,
          /fetch failed/i
        ]
      },
      {
        code: 'TIMEOUT_ERROR',
        category: ErrorCategory.TIMEOUT,
        severity: ErrorSeverity.HIGH,
        keywords: ['timeout', 'timed out', 'ETIMEDOUT'],
        patterns: [
          /timeout/i,
          /timed out/i,
          /ETIMEDOUT/i
        ]
      },
      {
        code: 'VALIDATION_ERROR',
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.LOW,
        keywords: ['validation', 'invalid', 'required', 'format'],
        patterns: [
          /validation/i,
          /invalid/i,
          /required/i,
          /format/i
        ]
      },
      {
        code: 'AUTHENTICATION_ERROR',
        category: ErrorCategory.AUTHENTICATION,
        severity: ErrorSeverity.HIGH,
        keywords: ['authentication', 'unauthorized', 'unauthenticated', '401'],
        patterns: [
          /authentication/i,
          /unauthorized/i,
          /401/i
        ]
      },
      {
        code: 'AUTHORIZATION_ERROR',
        category: ErrorCategory.AUTHORIZATION,
        severity: ErrorSeverity.HIGH,
        keywords: ['authorization', 'forbidden', 'permission', '403'],
        patterns: [
          /authorization/i,
          /forbidden/i,
          /permission/i,
          /403/i
        ]
      },
      {
        code: 'NOT_FOUND_ERROR',
        category: ErrorCategory.NOT_FOUND,
        severity: ErrorSeverity.MEDIUM,
        keywords: ['not found', '404', 'does not exist'],
        patterns: [
          /not found/i,
          /404/i,
          /does not exist/i
        ]
      },
      {
        code: 'RATE_LIMIT_ERROR',
        category: ErrorCategory.RATE_LIMIT,
        severity: ErrorSeverity.MEDIUM,
        keywords: ['rate limit', 'too many requests', '429'],
        patterns: [
          /rate limit/i,
          /too many requests/i,
          /429/i
        ]
      },
      {
        code: 'CONFLICT_ERROR',
        category: ErrorCategory.CONFLICT,
        severity: ErrorSeverity.MEDIUM,
        keywords: ['conflict', 'already exists', '409'],
        patterns: [
          /conflict/i,
          /already exists/i,
          /409/i
        ]
      },
      {
        code: 'INTERNAL_ERROR',
        category: ErrorCategory.INTERNAL,
        severity: ErrorSeverity.CRITICAL,
        keywords: ['internal', '500', 'server error'],
        patterns: [
          /internal/i,
          /500/i,
          /server error/i
        ]
      }
    ];
  }

  classify(error: Error | YYC3Error): ErrorClassificationResult {
    const errorMessage = error.message || '';
    const errorCode = error instanceof YYC3Error ? error.code : '';
    const errorStack = error.stack || '';

    let bestMatch: ErrorPattern | null = null;
    let highestScore = 0;

    for (const pattern of this.patterns) {
      let score = 0;

      if (errorCode === pattern.code) {
        score += 1.0;
      }

      if (pattern.keywords.some(keyword => 
        errorMessage.toLowerCase().includes(keyword.toLowerCase())
      )) {
        score += 0.8;
      }

      if (pattern.patterns.some(regex => regex.test(errorMessage))) {
        score += 0.7;
      }

      if (pattern.patterns.some(regex => regex.test(errorStack))) {
        score += 0.5;
      }

      if (pattern.customMatcher && pattern.customMatcher(error)) {
        score += 1.0;
      }

      if (score > highestScore) {
        highestScore = score;
        bestMatch = pattern;
      }
    }

    if (bestMatch && highestScore >= this.CONFIDENCE_THRESHOLD) {
      return {
        category: bestMatch.category,
        severity: this.adjustSeverityBasedOnFrequency(
          bestMatch.code,
          bestMatch.severity
        ),
        confidence: Math.min(highestScore, 1.0),
        matchedPattern: bestMatch.code
      };
    }

    return {
      category: ErrorCategory.UNKNOWN,
      severity: ErrorSeverity.MEDIUM,
      confidence: 0.0
    };
  }

  private adjustSeverityBasedOnFrequency(
    errorCode: string,
    baseSeverity: ErrorSeverity
  ): ErrorSeverity {
    const frequency = this.errorFrequency.get(errorCode) || 0;
    const severityHistory = this.errorSeverityHistory.get(errorCode) || [];

    if (frequency >= this.FREQUENCY_THRESHOLD) {
      if (baseSeverity === ErrorSeverity.LOW) {
        return ErrorSeverity.MEDIUM;
      }
      if (baseSeverity === ErrorSeverity.MEDIUM) {
        return ErrorSeverity.HIGH;
      }
    }

    if (severityHistory.length > 0) {
      const recentSeverity = severityHistory[severityHistory.length - 1];
      const severityLevels = {
        [ErrorSeverity.LOW]: 1,
        [ErrorSeverity.MEDIUM]: 2,
        [ErrorSeverity.HIGH]: 3,
        [ErrorSeverity.CRITICAL]: 4
      };

      if (severityLevels[recentSeverity] > severityLevels[baseSeverity]) {
        return recentSeverity;
      }
    }

    return baseSeverity;
  }

  recordError(error: Error | YYC3Error): void {
    let errorCode: string;

    if (error instanceof YYC3Error) {
      errorCode = error.code;
    } else {
      const classification = this.classify(error);
      errorCode = classification.matchedPattern || 'UNKNOWN_ERROR';
    }

    const currentFrequency = this.errorFrequency.get(errorCode) || 0;
    this.errorFrequency.set(errorCode, currentFrequency + 1);

    const severity = error instanceof YYC3Error ? error.severity : ErrorSeverity.MEDIUM;
    const history = this.errorSeverityHistory.get(errorCode) || [];
    history.push(severity);

    if (history.length > 10) {
      history.shift();
    }
    this.errorSeverityHistory.set(errorCode, history);
  }

  addCustomPattern(pattern: ErrorPattern): void {
    this.patterns.push(pattern);
  }

  removePattern(code: string): void {
    this.patterns = this.patterns.filter(p => p.code !== code);
  }

  getErrorFrequency(code: string): number {
    return this.errorFrequency.get(code) || 0;
  }

  getTopErrors(limit: number = 10): Array<{ code: string; frequency: number }> {
    return Array.from(this.errorFrequency.entries())
      .map(([code, frequency]) => ({ code, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit);
  }

  reset(): void {
    this.errorFrequency.clear();
    this.errorSeverityHistory.clear();
  }

  getPatterns(): ErrorPattern[] {
    return [...this.patterns];
  }
}

export const globalErrorClassifier = new ErrorClassifier();
