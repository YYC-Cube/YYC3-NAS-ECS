/**
 * @file ContentAgent.ts
 * @description 内容智能体 - 负责弹窗内容管理
 * @module core/ai/agents
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { BaseAgent } from '../BaseAgent';
import { AgentConfig } from '../AgentProtocol';
import { ValidationError as YYC3ValidationError } from '../../error-handler/ErrorTypes';

export class ContentAgent extends BaseAgent {
  private contentCache: Map<string, any> = new Map();
  private contentHistory: any[] = [];

  constructor(config: AgentConfig) {
    super(config);
  }

  protected setupCapabilities(): void {
    this.addCapability({
      id: 'content-update',
      name: '内容更新',
      description: '更新弹窗内容',
      version: '1.0.0',
      enabled: true
    });

    this.addCapability({
      id: 'content-reload',
      name: '内容重载',
      description: '重新加载内容',
      version: '1.0.0',
      enabled: true
    });

    this.addCapability({
      id: 'content-cache',
      name: '内容缓存',
      description: '缓存内容以提高性能',
      version: '1.0.0',
      enabled: true
    });

    this.addCapability({
      id: 'content-history',
      name: '内容历史',
      description: '记录内容变更历史',
      version: '1.0.0',
      enabled: true
    });

    this.addCapability({
      id: 'content-validate',
      name: '内容验证',
      description: '验证内容有效性',
      version: '1.0.0',
      enabled: true
    });
  }

  protected setupCommandHandlers(): void {
    this.registerCommandHandler('updateContent', this.handleUpdateContent.bind(this));
    this.registerCommandHandler('reloadContent', this.handleReloadContent.bind(this));
    this.registerCommandHandler('clearCache', this.handleClearCache.bind(this));
    this.registerCommandHandler('getHistory', this.handleGetHistory.bind(this));
    this.registerCommandHandler('validateContent', this.handleValidateContent.bind(this));
    this.registerCommandHandler('restoreContent', this.handleRestoreContent.bind(this));
  }

  private async handleUpdateContent(params: { content: any; cache?: boolean }): Promise<any> {
    if (!this.popup) {
      throw new YYC3ValidationError('智能体未绑定到弹窗', 'popup', {
        additionalData: { agentId: this.config.id, command: 'updateContent' }
      });
    }

    const oldContent = this.popup.content;
    this.popup.content = params.content;

    if (params.cache !== false) {
      this.contentCache.set(this.popup.id, params.content);
    }

    this.contentHistory.push({
      timestamp: Date.now(),
      oldContent,
      newContent: params.content
    });

    if (this.contentHistory.length > 50) {
      this.contentHistory.shift();
    }

    this.emit('content:updated', {
      popupId: this.popup.id,
      content: params.content,
      timestamp: Date.now()
    });

    return { success: true, content: params.content };
  }

  private async handleReloadContent(): Promise<any> {
    if (!this.popup) {
      throw new YYC3ValidationError('智能体未绑定到弹窗', 'popup', {
        additionalData: { agentId: this.config.id, command: 'reloadContent' }
      });
    }

    const cachedContent = this.contentCache.get(this.popup.id);
    if (cachedContent) {
      this.popup.content = cachedContent;

      this.emit('content:reloaded', {
        popupId: this.popup.id,
        content: cachedContent,
        timestamp: Date.now()
      });

      return { success: true, content: cachedContent };
    }

    return { success: false, message: '没有缓存的内容' };
  }

  private async handleClearCache(): Promise<any> {
    this.contentCache.clear();

    this.emit('content:cache-cleared', {
      timestamp: Date.now()
    });

    return { success: true };
  }

  private async handleGetHistory(params?: { limit?: number }): Promise<any> {
    const limit = params?.limit || 10;
    const history = this.contentHistory.slice(-limit);

    return {
      success: true,
      history,
      total: this.contentHistory.length
    };
  }

  private async handleValidateContent(params?: { content?: any }): Promise<any> {
    const content = params?.content || this.popup?.content;

    if (!content) {
      return {
        success: false,
        valid: false,
        message: '内容为空'
      };
    }

    const validation = {
      valid: true,
      errors: [] as string[],
      warnings: [] as string[]
    };

    if (typeof content === 'object' && content !== null) {
      if (Object.keys(content).length === 0) {
        validation.warnings.push('内容对象为空');
      }
    } else if (typeof content === 'string') {
      if (content.trim().length === 0) {
        validation.errors.push('内容字符串为空');
      }
    }

    validation.valid = validation.errors.length === 0;

    this.emit('content:validated', {
      validation,
      timestamp: Date.now()
    });

    return {
      success: true,
      ...validation
    };
  }

  private async handleRestoreContent(params: { historyIndex: number }): Promise<any> {
    if (!this.popup) {
      throw new YYC3ValidationError('智能体未绑定到弹窗', 'popup', {
        additionalData: { agentId: this.config.id, command: 'restoreContent' }
      });
    }

    const historyItem = this.contentHistory[params.historyIndex];
    if (!historyItem) {
      return {
        success: false,
        message: '历史记录不存在'
      };
    }

    this.popup.content = historyItem.oldContent;

    this.emit('content:restored', {
      popupId: this.popup.id,
      content: historyItem.oldContent,
      historyIndex: params.historyIndex,
      timestamp: Date.now()
    });

    return {
      success: true,
      content: historyItem.oldContent
    };
  }
}
