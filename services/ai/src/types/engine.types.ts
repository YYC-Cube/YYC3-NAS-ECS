/**
 * @file engine.types.ts - 核心引擎类型定义
 * @description YYC³ MovAISys 智能浮窗系统 - 类型定义层
 * @author YanYuCloudCube Team
 * @version 1.0.0
 * @created 2025-12-31
 */

/**
 * ================== 基础类型定义 ==================
 */

/**
 * 消息类型枚举
 */
export enum MessageType {
  // 系统消息
  SYSTEM_START = 'system:start',
  SYSTEM_STOP = 'system:stop',
  SYSTEM_ERROR = 'system:error',

  // 任务消息
  TASK_CREATED = 'task:created',
  TASK_COMPLETED = 'task:completed',
  TASK_FAILED = 'task:failed',
  TASK_CANCELLED = 'task:cancelled',

  // 用户消息
  USER_MESSAGE = 'user:message',
  USER_COMMAND = 'user:command',

  // AI消息
  AI_RESPONSE = 'ai:response',
  AI_ERROR = 'ai:error',

  // 工具消息
  TOOL_INVOKED = 'tool:invoked',
  TOOL_RESULT = 'tool:result',
  TOOL_ERROR = 'tool:error',

  // 子系统消息
  SUBSYSTEM_REGISTERED = 'subsystem:registered',
  SUBSYSTEM_UNREGISTERED = 'subsystem:unregistered',
  SUBSYSTEM_ERROR = 'subsystem:error'
}

/**
 * 引擎状态枚举
 */
export enum EngineStatus {
  STOPPED = 'STOPPED',
  INITIALIZING = 'INITIALIZING',
  STARTING = 'STARTING',
  RUNNING = 'RUNNING',
  PAUSING = 'PAUSING',
  PAUSED = 'PAUSED',
  STOPPING = 'STOPPING',
  ERROR = 'ERROR'
}

/**
 * 消息接口
 */
export interface AgentMessage {
  id: string;
  type: MessageType;
  content: unknown;
  timestamp: Date;
  source?: string;
  metadata?: Record<string, unknown>;
  correlationId?: string;
}

/**
 * 消息响应接口
 */
export interface AgentResponse {
  success: boolean;
  content: unknown;
  metadata?: {
    processingTime: number;
    traceId?: string;
    modelUsed?: string;
    tokensUsed?: number;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * ================== 任务相关类型 ==================
 */

/**
 * 任务状态枚举
 */
export enum TaskStatus {
  PENDING = 'PENDING',
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  TIMEOUT = 'TIMEOUT'
}

/**
 * 任务优先级
 */
export enum TaskPriority {
  LOW = 0,
  NORMAL = 1,
  HIGH = 2,
  CRITICAL = 3
}

/**
 * 任务接口
 */
export interface AgentTask {
  id: string;
  type: string;
  priority: TaskPriority;
  status: TaskStatus;
  input: unknown;
  output?: unknown;
  error?: Error;
  progress: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  timeout?: number;
  metadata?: Record<string, unknown>;
}

/**
 * ================== 系统配置类型 ==================
 */

/**
 * 引擎配置接口
 */
export interface EngineConfig {
  version: string;
  environment: 'development' | 'staging' | 'production';

  // 消息配置
  messageConfig: {
    maxQueueSize: number;
    retryPolicy: {
      maxRetries: number;
      backoffFactor: number;
    };
  };

  // 任务配置
  taskConfig: {
    maxConcurrentTasks: number;
    timeoutMs: number;
    priorityLevels: number;
  };

  // 状态配置
  stateConfig: {
    autoPersist: boolean;
    persistInterval: number;
    maxHistory: number;
  };

  // 日志配置
  logConfig: {
    level: string;
    format: 'json' | 'text';
  };
}

/**
 * ================== 子系统类型 ==================
 */

/**
 * 子系统接口
 */
export interface ISubsystem {
  name: string;
  version: string;
  status: string;
  initialize(config?: unknown): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): string;
  handleMessage(message: AgentMessage): Promise<void>;
}

/**
 * ================== 监控与诊断类型 ==================
 */

/**
 * 引擎状态接口
 */
export interface EngineState {
  status: EngineStatus;
  uptime: number;
  tasks: {
    total: number;
    active: number;
    completed: number;
    failed: number;
  };
  subsystems: string[];
  metrics: {
    messageThroughput: number;
    averageResponseTime: number;
    errorRate: number;
  };
}

/**
 * 引擎指标接口
 */
export interface EngineMetrics {
  uptime: number;
  status: EngineStatus;
  taskCount: number;
  activeTasks: number;
  queuedTasks: number;
  completedTasks: number;
  failedTasks: number;
  messageThroughput: number;
  memoryUsage: NodeJS.MemoryUsage;
  subsystemHealth: Record<string, { status: string; lastCheck: Date }>;
  errorRate: number;
  responseTimes: {
    p50: number;
    p95: number;
    p99: number;
    average: number;
  };
}

/**
 * ================== 消息处理相关类型 ==================
 */

/**
 * 消息处理器函数类型
 */
export type MessageHandler = (
  message: AgentMessage,
  context: ProcessingContext
) => Promise<AgentResponse>;

/**
 * 处理上下文接口
 */
export interface ProcessingContext {
  traceId: string;
  message: AgentMessage;
  engineState: EngineState;
  availableSubsystems: string[];
  currentTime: Date;
  userContext?: {
    userId?: string;
    sessionId?: string;
    preferences?: Record<string, unknown>;
  };
  systemConstraints?: {
    maxExecutionTime: number;
    maxMemoryUsage: number;
  };
}

/**
 * ================== 辅助函数 ==================
 */

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * 生成追踪ID
 */
export function generateTraceId(): string {
  return `trace-${generateId()}`;
}

/**
 * ================== 核心引擎接口 ==================
 */

/**
 * 自治AI引擎接口
 */
export interface IAutonomousAIEngine {
  // ================= 生命周期管理 =================
  initialize(config: EngineConfig): Promise<void>;
  start(): Promise<void>;
  pause(): Promise<void>;
  shutdown(): Promise<void>;
  getStatus(): EngineStatus;

  // ================= 消息处理 =================
  processMessage(input: AgentMessage): Promise<AgentResponse>;
  registerMessageHandler(type: MessageType, handler: Function): void;
  unregisterMessageHandler(type: MessageType): void;

  // ================= 决策与规划 =================
  planTask(goal: unknown): Promise<unknown>;
  executeTask(taskId: string): Promise<unknown>;
  cancelTask(taskId: string): Promise<void>;
  getTaskProgress(taskId: string): unknown;

  // ================= 系统协调 =================
  registerSubsystem(subsystem: ISubsystem): void;
  unregisterSubsystem(name: string): void;
  getSubsystem(name: string): ISubsystem | undefined;
  broadcastEvent(event: unknown): void;

  // ================= 状态管理 =================
  getState(): EngineState;
  saveState(): Promise<unknown>;
  restoreState(snapshot: unknown): Promise<void>;
  resetState(): Promise<void>;

  // ================= 监控与诊断 =================
  getMetrics(): EngineMetrics;
  diagnose(): Promise<unknown>;
  enableDebugMode(): void;
  disableDebugMode(): void;
}
