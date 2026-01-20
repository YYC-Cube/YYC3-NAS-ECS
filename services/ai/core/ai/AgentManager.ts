/**
 * @file 智能体管理器
 * @description 管理和协调所有智能体的核心系统
 * @module core/ai/AgentManager
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 * @updated 2025-01-30
 * @copyright Copyright (c) 2025 YYC³
 * @license MIT
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import {
  AgentMessage,
  AgentResponse,
  AgentConfig,
  AgentCapability,
  AgentStatusType,
  AgentStatistics,
  AgentRoute
} from './AgentProtocol';
import { BaseAgent } from './BaseAgent';
import {
  ConflictError,
  TimeoutError
} from '../error-handler/ErrorTypes';
import { ErrorHandler } from '../error-handler/ErrorHandler';
import { ErrorBoundary } from '../error-handler/ErrorBoundary';

export interface AgentManagerConfig {
  maxQueueSize?: number;
  maxMessageHistory?: number;
  enableMetrics?: boolean;
  enableLogging?: boolean;
  defaultTimeout?: number;
  retryPolicy?: {
    maxRetries: number;
    retryDelay: number;
    backoffMultiplier: number;
  };
}

export interface AgentRegistration {
  agent: BaseAgent;
  config: AgentConfig;
  registeredAt: number;
  lastActive: number;
  status: AgentStatusType;
  statistics: AgentStatistics;
}

export interface MessageQueueItem {
  message: AgentMessage;
  priority: number;
  timestamp: number;
  retries: number;
  nextRetryTime?: number;
}

export class AgentManager extends EventEmitter {
  private agents: Map<string, AgentRegistration> = new Map();
  private messageQueue: MessageQueueItem[] = [];
  private messageHistory: AgentMessage[] = [];
  private routes: Map<string, AgentRoute[]> = new Map();
  private config: Required<AgentManagerConfig>;
  private processingQueue = false;
  private metricsInterval: NodeJS.Timeout | null = null;
  private errorHandler: ErrorHandler;
  private errorBoundary: ErrorBoundary;

  constructor(config: AgentManagerConfig = {}) {
    super();
    this.config = {
      maxQueueSize: config.maxQueueSize || 1000,
      maxMessageHistory: config.maxMessageHistory || 10000,
      enableMetrics: config.enableMetrics !== false,
      enableLogging: config.enableLogging !== false,
      defaultTimeout: config.defaultTimeout || 30000,
      retryPolicy: config.retryPolicy || {
        maxRetries: 3,
        retryDelay: 1000,
        backoffMultiplier: 2
      }
    };

    this.errorHandler = new ErrorHandler({ enableAutoRecovery: true });
    this.errorBoundary = new ErrorBoundary(this.errorHandler, {
      enableRecovery: true,
      maxRetries: this.config.retryPolicy.maxRetries,
      retryDelay: this.config.retryPolicy.retryDelay
    });

    this.setupErrorHandling();

    if (this.config.enableMetrics) {
      this.startMetricsCollection();
    }
  }

  private setupErrorHandling(): void {
    this.on('error', (errorInfo: any) => {
      console.error('[AgentManager Error]', errorInfo);
    });
  }

  registerAgent(agent: BaseAgent, config: AgentConfig): string {
    const agentId = config.id || uuidv4();
    
    if (this.agents.has(agentId)) {
      throw new ConflictError(`智能体 ${agentId} 已存在`);
    }

    const registration: AgentRegistration = {
      agent,
      config,
      registeredAt: Date.now(),
      lastActive: Date.now(),
      status: 'idle',
      statistics: {
        messagesReceived: 0,
        messagesProcessed: 0,
        messagesFailed: 0,
        averageProcessingTime: 0,
        lastError: null,
        uptime: 0
      }
    };

    this.agents.set(agentId, registration);

    agent.on('message:processed', (data) => {
      this.updateAgentStatistics(agentId, data);
    });

    this.emit('agent:registered', {
      agentId,
      config,
      timestamp: Date.now()
    });

    if (this.config.enableLogging) {
      console.log(`[AgentManager] 智能体已注册: ${agentId}`);
    }

    return agentId;
  }

  unregisterAgent(agentId: string): boolean {
    const registration = this.agents.get(agentId);
    
    if (!registration) {
      return false;
    }

    registration.agent.removeAllListeners();
    this.agents.delete(agentId);

    this.emit('agent:unregistered', {
      agentId,
      timestamp: Date.now()
    });

    if (this.config.enableLogging) {
      console.log(`[AgentManager] 智能体已注销: ${agentId}`);
    }

    return true;
  }

  getAgent(agentId: string): BaseAgent | undefined {
    const registration = this.agents.get(agentId);
    return registration?.agent;
  }

  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values()).map(reg => reg.agent);
  }

  getAgentIds(): string[] {
    return Array.from(this.agents.keys());
  }

  async sendMessage(message: AgentMessage): Promise<AgentResponse> {
    const registration = this.agents.get(message.to);
    
    if (!registration) {
      return {
        success: false,
        error: {
          code: 'AGENT_NOT_FOUND',
          message: `智能体 ${message.to} 不存在`
        },
        timestamp: Date.now()
      };
    }

    registration.lastActive = Date.now();
    registration.status = 'processing';
    registration.statistics.messagesReceived++;

    this.addToHistory(message);

    try {
      const response = await this.errorBoundary.captureAsyncError(
        async () => {
          return await Promise.race([
            registration.agent.handleMessage(message),
            this.createTimeoutPromise(this.config.defaultTimeout)
          ]);
        },
        { context: { agentId: message.to, messageId: message.id } }
      );

      if (!response) {
        throw new Error('处理失败');
      }

      registration.status = 'idle';
      registration.statistics.messagesProcessed++;
      registration.statistics.averageProcessingTime = 
        (registration.statistics.averageProcessingTime * (registration.statistics.messagesProcessed - 1) + 
         (response.executionTime || 0)) / registration.statistics.messagesProcessed;

      this.emit('message:sent', {
        message,
        response,
        timestamp: Date.now()
      });

      return response;
    } catch (error) {
      registration.status = 'error';
      registration.statistics.messagesFailed++;
      registration.statistics.lastError = {
        code: 'PROCESSING_ERROR',
        message: String(error),
        timestamp: Date.now()
      };

      this.emit('message:failed', {
        message,
        error,
        timestamp: Date.now()
      });

      return {
        success: false,
        error: {
          code: 'PROCESSING_ERROR',
          message: String(error)
        },
        timestamp: Date.now()
      };
    }
  }

  broadcastMessage(message: Omit<AgentMessage, 'to'>): Promise<AgentResponse[]> {
    const promises = this.getAgentIds().map(agentId => 
      this.sendMessage({
        ...message,
        to: agentId
      })
    );

    return Promise.all(promises);
  }

  queueMessage(message: AgentMessage, priority: number = 0): void {
    if (this.messageQueue.length >= this.config.maxQueueSize) {
      this.emit('queue:full', {
        message,
        timestamp: Date.now()
      });
      return;
    }

    const queueItem: MessageQueueItem = {
      message,
      priority,
      timestamp: Date.now(),
      retries: 0
    };

    this.messageQueue.push(queueItem);
    this.messageQueue.sort((a, b) => b.priority - a.priority);

    if (!this.processingQueue) {
      this.processQueue();
    }

    this.emit('message:queued', {
      messageId: message.id,
      queueSize: this.messageQueue.length,
      timestamp: Date.now()
    });
  }

  private async processQueue(): Promise<void> {
    this.processingQueue = true;

    while (this.messageQueue.length > 0) {
      const queueItem = this.messageQueue.shift()!;

      try {
        const response = await this.sendMessage(queueItem.message);
        
        if (!response.success && queueItem.retries < this.config.retryPolicy.maxRetries) {
          const delay = this.config.retryPolicy.retryDelay * 
                       Math.pow(this.config.retryPolicy.backoffMultiplier, queueItem.retries);
          
          queueItem.retries++;
          queueItem.nextRetryTime = Date.now() + delay;
          
          setTimeout(() => {
            this.messageQueue.push(queueItem);
            this.messageQueue.sort((a, b) => b.priority - a.priority);
          }, delay);
        }
      } catch (error) {
        this.emit('queue:error', {
          queueItem,
          error,
          timestamp: Date.now()
        });
      }
    }

    this.processingQueue = false;
  }

  addRoute(route: AgentRoute): void {
    if (!this.routes.has(route.from)) {
      this.routes.set(route.from, []);
    }

    const routes = this.routes.get(route.from)!;
    routes.push(route);

    this.emit('route:added', {
      route,
      timestamp: Date.now()
    });
  }

  removeRoute(routeId: string): void {
    for (const [, routes] of this.routes.entries()) {
      const index = routes.findIndex(r => r.id === routeId);
      if (index !== -1) {
        routes.splice(index, 1);
        this.emit('route:removed', {
          routeId,
          timestamp: Date.now()
        });
        return;
      }
    }
  }

  async routeMessage(message: AgentMessage): Promise<AgentResponse[]> {
    const routes = this.routes.get(message.from) || [];
    const responses: AgentResponse[] = [];

    for (const route of routes) {
      if (this.shouldRoute(message, route)) {
        const routedMessage: AgentMessage = {
          ...message,
          to: route.to,
          id: uuidv4()
        };

        const response = await this.sendMessage(routedMessage);
        responses.push(response);
      }
    }

    return responses;
  }

  private shouldRoute(message: AgentMessage, route: AgentRoute): boolean {
    if (route.conditions?.messageTypes && 
        !route.conditions.messageTypes.includes(message.type)) {
      return false;
    }

    if (route.conditions?.priority && 
        message.metadata?.priority !== route.conditions.priority) {
      return false;
    }

    return true;
  }

  getAgentCapabilities(agentId: string): AgentCapability[] {
    const registration = this.agents.get(agentId);
    return registration?.agent.getCapabilities() || [];
  }

  getAllCapabilities(): Map<string, AgentCapability[]> {
    const capabilities = new Map<string, AgentCapability[]>();

    for (const [agentId, registration] of this.agents.entries()) {
      capabilities.set(agentId, registration.agent.getCapabilities());
    }

    return capabilities;
  }

  getAgentStatistics(agentId: string): AgentStatistics | undefined {
    const registration = this.agents.get(agentId);
    return registration?.statistics;
  }

  getAllStatistics(): Map<string, AgentStatistics> {
    const statistics = new Map<string, AgentStatistics>();

    for (const [agentId, registration] of this.agents.entries()) {
      statistics.set(agentId, registration.statistics);
    }

    return statistics;
  }

  getAgentStatus(agentId: string): AgentStatusType | undefined {
    const registration = this.agents.get(agentId);
    return registration?.status;
  }

  getAllStatuses(): Map<string, AgentStatusType> {
    const statuses = new Map<string, AgentStatusType>();

    for (const [agentId, registration] of this.agents.entries()) {
      statuses.set(agentId, registration.status);
    }

    return statuses;
  }

  private updateAgentStatistics(agentId: string, data: any): void {
    const registration = this.agents.get(agentId);
    
    if (registration) {
      registration.lastActive = Date.now();
      registration.statistics.uptime = Date.now() - registration.registeredAt;
      console.log(`[AgentManager] 更新智能体统计信息: ${agentId}`, data);
    }
  }

  private addToHistory(message: AgentMessage): void {
    this.messageHistory.push(message);

    if (this.messageHistory.length > this.config.maxMessageHistory) {
      this.messageHistory.shift();
    }
  }

  getMessageHistory(agentId?: string): AgentMessage[] {
    if (agentId) {
      return this.messageHistory.filter(msg => 
        msg.from === agentId || msg.to === agentId
      );
    }

    return [...this.messageHistory];
  }

  private createTimeoutPromise(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new TimeoutError(`操作超时`, timeout));
      }, timeout);
    });
  }

  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.emit('metrics:collected', {
        statistics: this.getAllStatistics(),
        queueSize: this.messageQueue.length,
        historySize: this.messageHistory.length,
        timestamp: Date.now()
      });
    }, 60000);
  }

  stopMetricsCollection(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
  }

  async shutdown(): Promise<void> {
    this.stopMetricsCollection();

    for (const [agentId, registration] of this.agents.entries()) {
      await registration.agent.shutdown();
      this.unregisterAgent(agentId);
    }

    this.messageQueue = [];
    this.messageHistory = [];
    this.routes.clear();

    this.emit('manager:shutdown', {
      timestamp: Date.now()
    });

    if (this.config.enableLogging) {
      console.log('[AgentManager] 智能体管理器已关闭');
    }
  }

  getQueueSize(): number {
    return this.messageQueue.length;
  }

  getHistorySize(): number {
    return this.messageHistory.length;
  }

  getRegisteredAgentCount(): number {
    return this.agents.size;
  }
}

export default AgentManager;
