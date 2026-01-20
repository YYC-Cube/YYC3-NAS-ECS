/**
 * @file 智能体系统入口
 * @description 智能体系统的统一入口，提供智能体创建、管理和通信功能
 * @module core/ai/index
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 * @updated 2025-01-30
 * @copyright Copyright (c) 2025 YYC³
 * @license MIT
 */

import { AgentManager, AgentManagerConfig } from './AgentManager';
import { BaseAgent } from './BaseAgent';
import { LayoutAgent } from './agents/LayoutAgent';
import { BehaviorAgent } from './agents/BehaviorAgent';
import { ContentAgent } from './agents/ContentAgent';
import { AssistantAgent } from './agents/AssistantAgent';
import { MonitoringAgent } from './agents/MonitoringAgent';
import {
  AgentConfig,
  AgentMessage,
  AgentResponse,
  AgentCapability,
  AgentContext
} from './AgentProtocol';

export class AgentSystem {
  private manager: AgentManager;
  private initialized = false;

  constructor(config?: AgentManagerConfig) {
    this.manager = new AgentManager(config);
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.manager.on('agent:registered', (data) => {
      console.log(`[AgentSystem] 智能体已注册: ${data.agentId}`);
    });

    this.manager.on('message:sent', (data) => {
      console.log(`[AgentSystem] 消息已发送: ${data.message.id} -> ${data.message.to}`);
    });

    this.manager.on('message:failed', (data) => {
      console.error(`[AgentSystem] 消息发送失败: ${data.message.id}`, data.error);
    });

    this.initialized = true;
    console.log('[AgentSystem] 智能体系统已初始化');
  }

  createLayoutAgent(config: AgentConfig): LayoutAgent {
    const agent = new LayoutAgent(config);
    this.manager.registerAgent(agent, config);
    return agent;
  }

  createBehaviorAgent(config: AgentConfig): BehaviorAgent {
    const agent = new BehaviorAgent(config);
    this.manager.registerAgent(agent, config);
    return agent;
  }

  createContentAgent(config: AgentConfig): ContentAgent {
    const agent = new ContentAgent(config);
    this.manager.registerAgent(agent, config);
    return agent;
  }

  createAssistantAgent(config: AgentConfig): AssistantAgent {
    const agent = new AssistantAgent(config);
    this.manager.registerAgent(agent, config);
    return agent;
  }

  createMonitoringAgent(config: AgentConfig): MonitoringAgent {
    const agent = new MonitoringAgent(config);
    this.manager.registerAgent(agent, config);
    return agent;
  }

  registerAgent(agent: BaseAgent, config: AgentConfig): string {
    return this.manager.registerAgent(agent, config);
  }

  unregisterAgent(agentId: string): boolean {
    return this.manager.unregisterAgent(agentId);
  }

  getAgent(agentId: string): BaseAgent | undefined {
    return this.manager.getAgent(agentId);
  }

  getAllAgents(): BaseAgent[] {
    return this.manager.getAllAgents();
  }

  async sendMessage(message: AgentMessage): Promise<AgentResponse> {
    return this.manager.sendMessage(message);
  }

  broadcastMessage(message: Omit<AgentMessage, 'to'>): Promise<AgentResponse[]> {
    return this.manager.broadcastMessage(message);
  }

  queueMessage(message: AgentMessage, priority?: number): void {
    this.manager.queueMessage(message, priority);
  }

  getAgentCapabilities(agentId: string): AgentCapability[] {
    return this.manager.getAgentCapabilities(agentId);
  }

  getAllCapabilities(): Map<string, AgentCapability[]> {
    return this.manager.getAllCapabilities();
  }

  getAgentStatistics(agentId: string) {
    return this.manager.getAgentStatistics(agentId);
  }

  getAllStatistics() {
    return this.manager.getAllStatistics();
  }

  getAgentStatus(agentId: string) {
    return this.manager.getAgentStatus(agentId);
  }

  getAllStatuses() {
    return this.manager.getAllStatuses();
  }

  getMessageHistory(agentId?: string): AgentMessage[] {
    return this.manager.getMessageHistory(agentId);
  }

  getQueueSize(): number {
    return this.manager.getQueueSize();
  }

  getHistorySize(): number {
    return this.manager.getHistorySize();
  }

  getRegisteredAgentCount(): number {
    return this.manager.getRegisteredAgentCount();
  }

  on(event: string, listener: (...args: any[]) => void): this {
    this.manager.on(event, listener);
    return this;
  }

  off(event: string, listener: (...args: any[]) => void): this {
    this.manager.off(event, listener);
    return this;
  }

  async shutdown(): Promise<void> {
    await this.manager.shutdown();
    this.initialized = false;
    console.log('[AgentSystem] 智能体系统已关闭');
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

export {
  AgentManager,
  BaseAgent,
  LayoutAgent,
  BehaviorAgent,
  ContentAgent,
  AssistantAgent,
  MonitoringAgent
};

export type {
  AgentManagerConfig,
  AgentConfig,
  AgentMessage,
  AgentResponse,
  AgentCapability,
  AgentContext
};

export default AgentSystem;
