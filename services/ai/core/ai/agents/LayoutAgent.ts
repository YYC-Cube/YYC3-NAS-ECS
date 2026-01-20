/**
 * @file LayoutAgent.ts
 * @description 布局智能体 - 负责弹窗布局管理
 * @module core/ai/agents
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { BaseAgent } from '../BaseAgent';
import { AgentConfig } from '../AgentProtocol';
import { ValidationError as YYC3ValidationError } from '../../error-handler/ErrorTypes';

export class LayoutAgent extends BaseAgent {
  constructor(config: AgentConfig) {
    super(config);
  }

  protected setupCapabilities(): void {
    this.addCapability({
      id: 'layout-position',
      name: '位置控制',
      description: '控制弹窗的位置',
      version: '1.0.0',
      enabled: true
    });

    this.addCapability({
      id: 'layout-size',
      name: '尺寸控制',
      description: '控制弹窗的尺寸',
      version: '1.0.0',
      enabled: true
    });

    this.addCapability({
      id: 'layout-zindex',
      name: '层级控制',
      description: '控制弹窗的层级',
      version: '1.0.0',
      enabled: true
    });

    this.addCapability({
      id: 'layout-minimize',
      name: '最小化',
      description: '最小化弹窗',
      version: '1.0.0',
      enabled: true
    });

    this.addCapability({
      id: 'layout-maximize',
      name: '最大化',
      description: '最大化弹窗',
      version: '1.0.0',
      enabled: true
    });
  }

  protected setupCommandHandlers(): void {
    this.registerCommandHandler('move', this.handleMove.bind(this));
    this.registerCommandHandler('resize', this.handleResize.bind(this));
    this.registerCommandHandler('setZIndex', this.handleSetZIndex.bind(this));
    this.registerCommandHandler('minimize', this.handleMinimize.bind(this));
    this.registerCommandHandler('maximize', this.handleMaximize.bind(this));
    this.registerCommandHandler('restore', this.handleRestore.bind(this));
    this.registerCommandHandler('center', this.handleCenter.bind(this));
  }

  private async handleMove(params: { x: number; y: number; animate?: boolean }): Promise<any> {
    if (!this.popup) {
      throw new YYC3ValidationError('智能体未绑定到弹窗', 'popup', {
        additionalData: { agentId: this.config.id, command: 'move' }
      });
    }

    this.popup.position = { x: params.x, y: params.y };

    this.emit('layout:moved', {
      popupId: this.popup.id,
      position: this.popup.position,
      animate: params.animate || false,
      timestamp: Date.now()
    });

    return { success: true, position: this.popup.position };
  }

  private async handleResize(params: { width: number; height: number; animate?: boolean }): Promise<any> {
    if (!this.popup) {
      throw new YYC3ValidationError('智能体未绑定到弹窗', 'popup', {
        additionalData: { agentId: this.config.id, command: 'resize' }
      });
    }

    this.popup.size = { width: params.width, height: params.height };

    this.emit('layout:resized', {
      popupId: this.popup.id,
      size: this.popup.size,
      animate: params.animate || false,
      timestamp: Date.now()
    });

    return { success: true, size: this.popup.size };
  }

  private async handleSetZIndex(params: { zIndex: number }): Promise<any> {
    if (!this.popup) {
      throw new YYC3ValidationError('智能体未绑定到弹窗', 'popup', {
        additionalData: { agentId: this.config.id, command: 'setZIndex' }
      });
    }

    this.popup.zIndex = params.zIndex;

    this.emit('layout:zindex-changed', {
      popupId: this.popup.id,
      zIndex: this.popup.zIndex,
      timestamp: Date.now()
    });

    return { success: true, zIndex: this.popup.zIndex };
  }

  private async handleMinimize(): Promise<any> {
    if (!this.popup) {
      throw new YYC3ValidationError('智能体未绑定到弹窗', 'popup', {
        additionalData: { agentId: this.config.id, command: 'minimize' }
      });
    }

    this.emit('layout:minimized', {
      popupId: this.popup.id,
      timestamp: Date.now()
    });

    return { success: true, minimized: true };
  }

  private async handleMaximize(): Promise<any> {
    if (!this.popup) {
      throw new YYC3ValidationError('智能体未绑定到弹窗', 'popup', {
        additionalData: { agentId: this.config.id, command: 'maximize' }
      });
    }

    this.emit('layout:maximized', {
      popupId: this.popup.id,
      timestamp: Date.now()
    });

    return { success: true, maximized: true };
  }

  private async handleRestore(): Promise<any> {
    if (!this.popup) {
      throw new YYC3ValidationError('智能体未绑定到弹窗', 'popup', {
        additionalData: { agentId: this.config.id, command: 'restore' }
      });
    }

    this.emit('layout:restored', {
      popupId: this.popup.id,
      timestamp: Date.now()
    });

    return { success: true, restored: true };
  }

  private async handleCenter(): Promise<any> {
    if (!this.popup) {
      throw new YYC3ValidationError('智能体未绑定到弹窗');
    }

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    this.popup.position = {
      x: (screenWidth - this.popup.size.width) / 2,
      y: (screenHeight - this.popup.size.height) / 2
    };

    this.emit('layout:centered', {
      popupId: this.popup.id,
      position: this.popup.position,
      timestamp: Date.now()
    });

    return { success: true, position: this.popup.position };
  }
}
