export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  CONFLICT = 'conflict',
  RATE_LIMIT = 'rate_limit',
  INTERNAL = 'internal',
  EXTERNAL = 'external',
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  DATABASE = 'database',
  UNKNOWN = 'unknown'
}

export interface ErrorContext {
  timestamp: number;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  path?: string;
  method?: string;
  userAgent?: string;
  ip?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorMetadata {
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  retryable: boolean;
  userMessage?: string;
  technicalMessage?: string;
  suggestions?: string[];
  relatedErrors?: string[];
}

export class YYC3Error extends Error {
  public readonly code: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly retryable: boolean;
  public readonly context: ErrorContext;
  public readonly userMessage?: string;
  public readonly technicalMessage?: string;
  public readonly suggestions?: string[];
  public readonly relatedErrors?: string[];
  public readonly originalError?: Error;

  constructor(
    code: string,
    message: string,
    metadata: Partial<ErrorMetadata> = {},
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(message);
    this.name = 'YYC3Error';
    this.code = code;
    this.category = metadata.category || ErrorCategory.INTERNAL;
    this.severity = metadata.severity || ErrorSeverity.MEDIUM;
    this.retryable = metadata.retryable ?? false;
    this.userMessage = metadata.userMessage;
    this.technicalMessage = metadata.technicalMessage;
    this.suggestions = metadata.suggestions;
    this.relatedErrors = metadata.relatedErrors;
    this.originalError = originalError;
    this.context = {
      timestamp: Date.now(),
      ...context
    };

    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): Record<string, any> {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      category: this.category,
      severity: this.severity,
      retryable: this.retryable,
      userMessage: this.userMessage,
      suggestions: this.suggestions,
      context: this.context,
      stack: this.stack
    };
  }

  toString(): string {
    return `[${this.code}] ${this.message}`;
  }
}

export class ValidationError extends YYC3Error {
  public readonly field?: string;

  constructor(
    message: string,
    field?: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      'VALIDATION_ERROR',
      message,
      {
        category: ErrorCategory.VALIDATION,
        severity: ErrorSeverity.LOW,
        retryable: false,
        userMessage: '输入数据验证失败',
        suggestions: field ? [`请检查字段: ${field}`] : ['请检查输入数据']
      },
      context,
      originalError
    );
    this.name = 'ValidationError';
    this.field = field;
  }
}

export class AuthenticationError extends YYC3Error {
  constructor(
    message: string = '认证失败',
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      'AUTHENTICATION_ERROR',
      message,
      {
        category: ErrorCategory.AUTHENTICATION,
        severity: ErrorSeverity.HIGH,
        retryable: false,
        userMessage: '身份验证失败，请重新登录',
        suggestions: ['请检查用户名和密码', '如果问题持续存在，请联系管理员']
      },
      context,
      originalError
    );
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends YYC3Error {
  constructor(
    message: string = '权限不足',
    requiredPermission?: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      'AUTHORIZATION_ERROR',
      message,
      {
        category: ErrorCategory.AUTHORIZATION,
        severity: ErrorSeverity.HIGH,
        retryable: false,
        userMessage: '您没有执行此操作的权限',
        suggestions: requiredPermission
          ? [`需要权限: ${requiredPermission}`]
          : ['请联系管理员获取所需权限']
      },
      context,
      originalError
    );
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends YYC3Error {
  constructor(
    resource: string,
    identifier?: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    const message = identifier
      ? `未找到资源: ${resource} (${identifier})`
      : `未找到资源: ${resource}`;

    super(
      'NOT_FOUND_ERROR',
      message,
      {
        category: ErrorCategory.NOT_FOUND,
        severity: ErrorSeverity.MEDIUM,
        retryable: false,
        userMessage: '请求的资源不存在',
        suggestions: ['请检查资源标识符', '确认资源是否已被删除']
      },
      context,
      originalError
    );
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends YYC3Error {
  constructor(
    message: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      'CONFLICT_ERROR',
      message,
      {
        category: ErrorCategory.CONFLICT,
        severity: ErrorSeverity.MEDIUM,
        retryable: false,
        userMessage: '操作冲突，请刷新后重试',
        suggestions: ['刷新页面', '检查数据是否已被其他用户修改']
      },
      context,
      originalError
    );
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends YYC3Error {
  constructor(
    limit: number,
    window: number,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      'RATE_LIMIT_ERROR',
      `请求频率超限: ${limit} 次/${window} 秒`,
      {
        category: ErrorCategory.RATE_LIMIT,
        severity: ErrorSeverity.MEDIUM,
        retryable: true,
        userMessage: '请求过于频繁，请稍后再试',
        suggestions: [`请在 ${window} 秒后重试`, '考虑降低请求频率']
      },
      context,
      originalError
    );
    this.name = 'RateLimitError';
  }
}

export class NetworkError extends YYC3Error {
  public readonly statusCode?: number;

  constructor(
    message: string = '网络连接失败',
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      'NETWORK_ERROR',
      message,
      {
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.HIGH,
        retryable: true,
        userMessage: '网络连接失败，请检查网络设置',
        suggestions: ['检查网络连接', '稍后重试', '如果问题持续，请联系技术支持']
      },
      context,
      originalError
    );
    this.name = 'NetworkError';
    this.statusCode = context.additionalData?.status;
  }
}

export class TimeoutError extends YYC3Error {
  public readonly timeout: number;

  constructor(
    operation: string,
    timeout: number,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      'TIMEOUT_ERROR',
      `操作超时: ${operation} (${timeout}ms)`,
      {
        category: ErrorCategory.TIMEOUT,
        severity: ErrorSeverity.HIGH,
        retryable: true,
        userMessage: '操作超时，请稍后重试',
        suggestions: ['检查网络连接', '稍后重试', '如果问题持续，请联系技术支持']
      },
      context,
      originalError
    );
    this.name = 'TimeoutError';
    this.timeout = timeout;
  }
}

export class InternalError extends YYC3Error {
  public readonly critical: boolean;

  constructor(
    message: string,
    context: Partial<ErrorContext> = {},
    originalError?: Error
  ) {
    super(
      'INTERNAL_ERROR',
      message,
      {
        category: ErrorCategory.INTERNAL,
        severity: ErrorSeverity.CRITICAL,
        retryable: false,
        userMessage: '系统内部错误，请稍后重试',
        suggestions: ['如果问题持续，请联系技术支持']
      },
      context,
      originalError
    );
    this.name = 'InternalError';
    this.critical = context.additionalData?.critical ?? false;
  }
}

export function isYYC3Error(error: any): error is YYC3Error {
  return error instanceof YYC3Error;
}

export function getErrorCode(error: any): string {
  if (isYYC3Error(error)) {
    return error.code;
  }
  return 'UNKNOWN_ERROR';
}

export function getErrorCategory(error: any): ErrorCategory {
  if (isYYC3Error(error)) {
    return error.category;
  }
  return ErrorCategory.UNKNOWN;
}

export function getErrorSeverity(error: any): ErrorSeverity {
  if (isYYC3Error(error)) {
    return error.severity;
  }
  return ErrorSeverity.MEDIUM;
}

export function isRetryable(error: any): boolean {
  if (isYYC3Error(error)) {
    return error.retryable;
  }
  return false;
}
