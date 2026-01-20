/**
 * @file 可插拔式拖拽移动AI系统核心类型定义
 * @description 定义自治AI引擎、模型适配器等核心组件的类型和接口
 * @module core/pluggable/types
 * @author YYC³
 * @version 1.0.0
 * @created 2025-12-30
 */

export enum EngineStatus {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  READY = 'ready',
  RUNNING = 'running',
  PAUSED = 'paused',
  SHUTTING_DOWN = 'shutting_down',
  STOPPED = 'stopped',
  ERROR = 'error'
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  FILE = 'file',
  COMMAND = 'command',
  EVENT = 'event',
  SYSTEM = 'system'
}

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused'
}

export interface EngineConfig {
  maxConcurrentTasks?: number;
  taskTimeout?: number;
  enablePersistence?: boolean;
  persistencePath?: string;
  enableMetrics?: boolean;
  debugMode?: boolean;
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  modelAdapter?: string;
  subsystems?: string[];
}

export interface PluggableAgentMessage {
  id: string;
  type: MessageType;
  content: any;
  sender?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface PluggableAgentResponse {
  id: string;
  messageId: string;
  content: any;
  success: boolean;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface AgentMessageHandler {
  (message: PluggableAgentMessage): Promise<PluggableAgentResponse> | PluggableAgentResponse;
}

export interface AgentGoal {
  id: string;
  description: string;
  priority: number;
  deadline?: Date;
  constraints?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface AgentTaskPlan {
  id: string;
  goalId: string;
  steps: TaskStep[];
  estimatedDuration: number;
  dependencies: string[];
  metadata?: Record<string, any>;
}

export interface TaskStep {
  id: string;
  name: string;
  description: string;
  action: string;
  parameters: Record<string, any>;
  dependencies: string[];
  estimatedDuration: number;
}

export interface AgentTaskResult {
  taskId: string;
  goalId: string;
  status: TaskStatus;
  steps: TaskStepResult[];
  output: any;
  error?: Error;
  startTime: Date;
  endTime: Date;
  duration: number;
}

export interface TaskStepResult {
  stepId: string;
  status: TaskStatus;
  output: any;
  error?: Error;
  startTime: Date;
  endTime: Date;
  duration: number;
}

export interface AgentTaskProgress {
  taskId: string;
  goalId: string;
  status: TaskStatus;
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
  percentage: number;
  estimatedRemainingTime: number;
}

export interface ISubsystem {
  name: string;
  version: string;
  initialize(config: any): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): SubsystemStatus;
  handleEvent?(event: PluggableSystemEvent): Promise<void>;
}

export interface SubsystemStatus {
  name: string;
  status: EngineStatus;
  lastUpdated: Date;
  metrics?: Record<string, any>;
}

export interface PluggableSystemEvent {
  id: string;
  type: string;
  source: string;
  timestamp: Date;
  data: any;
  priority?: number;
}

export interface EngineState {
  status: EngineStatus;
  tasks: Map<string, AgentTaskResult>;
  subsystems: Map<string, SubsystemStatus>;
  metrics: EngineMetrics;
  lastUpdated: Date;
}

export interface EngineSnapshot {
  id: string;
  timestamp: Date;
  state: EngineState;
  version: string;
}

export interface EngineMetrics {
  uptime: number;
  tasksCompleted: number;
  tasksFailed: number;
  tasksRunning: number;
  averageTaskDuration: number;
  messageThroughput: number;
  errorRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

export interface DiagnosticReport {
  timestamp: Date;
  overallHealth: 'healthy' | 'degraded' | 'unhealthy';
  subsystems: SubsystemHealth[];
  performance: PluggablePerformanceMetrics;
  issues: DiagnosticIssue[];
  recommendations: string[];
}

export interface SubsystemHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  metrics: Record<string, any>;
  issues: string[];
}

export interface PluggablePerformanceMetrics {
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  responseTime: number;
  throughput: number;
}

export interface DiagnosticIssue {
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  description: string;
  affectedComponent: string;
  suggestedAction: string;
}

export interface ModelConfig {
  name: string;
  version: string;
  provider: string;
  apiKey?: string;
  endpoint?: string;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  timeout?: number;
}

export interface ModelRequest {
  prompt: string;
  messages?: Array<{ role: string; content: string }>;
  parameters?: Record<string, any>;
  context?: Record<string, any>;
}

export interface ModelResponse {
  content: string;
  tokensUsed: number;
  model: string;
  finishReason: string;
  metadata?: Record<string, any>;
}

export interface ModelCapabilities {
  supportsStreaming: boolean;
  supportsFunctionCalling: boolean;
  supportsVision: boolean;
  supportsAudio: boolean;
  maxContextLength: number;
  supportedLanguages: string[];
}

export interface IModelAdapter {
  name: string;
  version: string;
  initialize(config: ModelConfig): Promise<void>;
  generateResponse(request: ModelRequest): Promise<ModelResponse>;
  generateStreamingResponse(request: ModelRequest): AsyncGenerator<string>;
  getCapabilities(): ModelCapabilities;
  validateConfig(config: ModelConfig): boolean;
  healthCheck(): Promise<boolean>;
}

export interface IAutonomousAIEngine {
  initialize(config: EngineConfig): Promise<void>;
  start(): Promise<void>;
  pause(): Promise<void>;
  shutdown(): Promise<void>;
  getStatus(): EngineStatus;
  processMessage(input: PluggableAgentMessage): Promise<PluggableAgentResponse>;
  registerMessageHandler(type: MessageType, handler: AgentMessageHandler): void;
  unregisterMessageHandler(type: MessageType): void;
  planTask(goal: AgentGoal): Promise<AgentTaskPlan>;
  executeTask(taskId: string): Promise<AgentTaskResult>;
  cancelTask(taskId: string): Promise<void>;
  getTaskProgress(taskId: string): AgentTaskProgress;
  registerSubsystem(subsystem: ISubsystem): void;
  unregisterSubsystem(name: string): void;
  getSubsystem(name: string): ISubsystem | undefined;
  broadcastEvent(event: PluggableSystemEvent): void;
  getState(): EngineState;
  saveState(): Promise<EngineSnapshot>;
  restoreState(snapshot: EngineSnapshot): Promise<void>;
  resetState(): Promise<void>;
  getMetrics(): EngineMetrics;
  diagnose(): Promise<DiagnosticReport>;
  enableDebugMode(): void;
  disableDebugMode(): void;
  coordinateSubsystems(task: ComplexTask): Promise<CoordinationResult>;
}

export interface ComplexTask {
  id: string;
  description: string;
  priority: number;
  deadline?: Date;
  requirements: TaskRequirement[];
  constraints?: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface TaskRequirement {
  type: string;
  description: string;
  requiredCapabilities: string[];
  estimatedDuration: number;
  dependencies?: string[];
}

export interface CoordinationResult {
  success: boolean;
  results: any[];
  coordinationMetrics: {
    totalTime: number;
    subsystemsUsed: number;
    conflictsResolved: number;
    efficiency: number;
  };
  errors?: Error[];
}

export interface SubsystemAssignment {
  subsystemName: string;
  tasks: TaskRequirement[];
  estimatedDuration: number;
  priority: number;
}

export interface DependencyGraph {
  nodes: Map<string, TaskRequirement>;
  edges: Map<string, string[]>;
}
