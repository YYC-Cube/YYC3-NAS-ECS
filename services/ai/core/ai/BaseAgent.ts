/**
 * @file BaseAgent.ts
 * @description 基础智能体抽象类
 * @module core/ai
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import {
  AgentConfig,
  AgentMessage,
  AgentCommand,
  AgentResponse,
  AgentContext,
  AgentCapability
} from './AgentProtocol';
import { EventEmitter } from 'events';
import {
  InternalError
} from '../error-handler/ErrorTypes';

export interface PopupInstance {
  id: string;
  title: string;
  content: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  visible: boolean;
  zIndex: number;
}

export abstract class BaseAgent extends EventEmitter {
  public config: AgentConfig;
  protected popup: PopupInstance | null = null;
  protected context: AgentContext | null = null;
  protected capabilities: Map<string, AgentCapability> = new Map();

  protected messageHistory: AgentMessage[] = [];
  protected maxHistorySize = 100;

  protected commandHandlers: Map<string, (params: any) => Promise<any>> = new Map();

  constructor(config: AgentConfig) {
    super();
    this.config = config;
    this.setupCapabilities();
    this.setupCommandHandlers();
  }

  protected abstract setupCapabilities(): void;

  protected abstract setupCommandHandlers(): void;

  async bindToPopup(popup: PopupInstance): Promise<void> {
    this.popup = popup;

    this.context = {
      popupId: popup.id,
      sessionId: `session-${Date.now()}`,
      environment: {
        screenSize: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        deviceType: this.getDeviceType(),
        platform: navigator.platform,
        language: navigator.language
      },
      preferences: {},
      history: []
    };

    this.emit('agent:bound', {
      popupId: popup.id,
      agentId: this.config.id,
      timestamp: Date.now()
    });

    console.log(`智能体 ${this.config.id} 已绑定到弹窗 ${popup.id}`);
  }

  async handleMessage(message: AgentMessage): Promise<AgentResponse> {
    const startTime = Date.now();

    try {
      this.messageHistory.push(message);
      if (this.messageHistory.length > this.maxHistorySize) {
        this.messageHistory.shift();
      }

      if (this.context) {
        this.context.history.push(message);
      }

      let response: AgentResponse;

      switch (message.type) {
        case 'command':
          response = await this.handleCommand(message.payload);
          break;
        case 'query':
          response = await this.handleQuery(message.payload);
          break;
        default:
          response = {
            success: false,
            error: {
              code: 'UNSUPPORTED_MESSAGE_TYPE',
              message: `不支持的消息类型: ${message.type}`
            },
            timestamp: Date.now()
          };
      }

      response.executionTime = Date.now() - startTime;

      this.emit('message:processed', {
        messageId: message.id,
        response,
        timestamp: Date.now()
      });

      return response;

    } catch (error) {
      console.error(`智能体处理消息失败:`, error);

      return {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: `智能体内部错误: ${error}`
        },
        executionTime: Date.now() - startTime,
        timestamp: Date.now()
      };
    }
  }

  protected async handleCommand(payload: AgentCommand): Promise<AgentResponse> {
    const handler = this.commandHandlers.get(payload.action);

    if (!handler) {
      return {
        success: false,
        error: {
          code: 'COMMAND_NOT_SUPPORTED',
          message: `命令不支持: ${payload.action}`
        },
        timestamp: Date.now()
      };
    }

    try {
      const result = await handler(payload.parameters);

      return {
        success: true,
        data: result,
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'COMMAND_EXECUTION_FAILED',
          message: `命令执行失败: ${error}`
        },
        timestamp: Date.now()
      };
    }
  }

  protected async handleQuery(payload: any): Promise<AgentResponse> {
    console.log(`智能体 ${this.config.id} 收到查询请求:`, payload);
    
    return {
      success: false,
      error: {
        code: 'QUERY_NOT_SUPPORTED',
        message: '查询功能未实现'
      },
      timestamp: Date.now()
    };
  }

  protected addCapability(capability: AgentCapability): void {
    this.capabilities.set(capability.id, capability);
    this.config.capabilities.push(capability);

    this.emit('capability:added', {
      capabilityId: capability.id,
      agentId: this.config.id,
      timestamp: Date.now()
    });
  }

  protected removeCapability(capabilityId: string): void {
    const capability = this.capabilities.get(capabilityId);
    if (!capability) return;

    this.capabilities.delete(capabilityId);
    this.config.capabilities = this.config.capabilities.filter(
      c => c.id !== capabilityId
    );

    this.emit('capability:removed', {
      capabilityId,
      agentId: this.config.id,
      timestamp: Date.now()
    });
  }

  protected registerCommandHandler(
    command: string,
    handler: (params: any) => Promise<any>
  ): void {
    this.commandHandlers.set(command, handler);
  }

  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const width = window.innerWidth;
    if (width < 768) return 'mobile';
    if (width < 1024) return 'tablet';
    return 'desktop';
  }

  protected handlePopupUpdate(data: any): void {
    if (!this.popup || this.popup.id !== data.popupId) return;

    this.popup = { ...this.popup, ...data.popup };

    this.emit('popup:updated', {
      popupId: this.popup!.id,
      changes: data.changes,
      timestamp: Date.now()
    });
  }

  protected handlePopupClosed(data: any): void {
    if (!this.popup || this.popup.id !== data.popupId) return;

    this.emit('popup:closed', {
      popupId: this.popup.id,
      timestamp: Date.now()
    });

    this.destroy();
  }

  protected async sendMessageToAgent(
    target: string,
    type: AgentMessage['type'],
    payload: any
  ): Promise<AgentResponse> {
    const message: AgentMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      from: this.config.id,
      to: target,
      timestamp: Date.now(),
      payload
    };

    const agentManager = (window as any).agentManager;
    if (!agentManager) {
      throw new InternalError('AgentManager 未初始化', { additionalData: { agentId: this.config.id } });
    }

    return agentManager.sendMessage(message);
  }

  protected async broadcastMessage(
    type: AgentMessage['type'],
    payload: any
  ): Promise<AgentResponse> {
    const message: AgentMessage = {
      id: `broadcast-${Date.now()}`,
      type,
      from: this.config.id,
      to: 'broadcast',
      timestamp: Date.now(),
      payload
    };

    const agentManager = (window as any).agentManager;
    if (!agentManager) {
      throw new InternalError('AgentManager 未初始化', { additionalData: { agentId: this.config.id } });
    }

    return agentManager.sendMessage(message);
  }

  getStatus() {
    return {
      agentId: this.config.id,
      popupId: this.popup?.id || null,
      capabilities: Array.from(this.capabilities.values()),
      messageHistoryCount: this.messageHistory.length,
      isBound: !!this.popup,
      context: this.context,
      config: this.config
    };
  }

  getCapabilities(): AgentCapability[] {
    return Array.from(this.capabilities.values());
  }

  async shutdown(): Promise<void> {
    this.emit('agent:shutdown', {
      agentId: this.config.id,
      timestamp: Date.now()
    });
    this.destroy();
  }

  destroy(): void {
    this.emit('agent:destroyed', {
      agentId: this.config.id,
      timestamp: Date.now()
    });

    this.removeAllListeners();
    this.messageHistory = [];
    this.commandHandlers.clear();
    this.capabilities.clear();
    this.popup = null;
    this.context = null;
  }
}
