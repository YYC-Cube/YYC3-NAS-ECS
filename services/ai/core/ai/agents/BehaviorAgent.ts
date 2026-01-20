/**
 * @file BehaviorAgent.ts
 * @description 行为智能体 - 负责弹窗行为控制
 * @module core/ai/agents
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { BaseAgent } from '../BaseAgent';
import { AgentConfig } from '../AgentProtocol';

export class BehaviorAgent extends BaseAgent {
  private behaviors: Map<string, any> = new Map();
  private behaviorRules: Map<string, any[]> = new Map();

  constructor(config: AgentConfig) {
    super(config);
  }

  protected setupCapabilities(): void {
    this.addCapability({
      id: 'behavior-autohide',
      name: '自动隐藏',
      description: '自动隐藏弹窗',
      version: '1.0.0',
      enabled: true
    });

    this.addCapability({
      id: 'behavior-autoclose',
      name: '自动关闭',
      description: '自动关闭弹窗',
      version: '1.0.0',
      enabled: true
    });

    this.addCapability({
      id: 'behavior-sticky',
      name: '粘性',
      description: '保持弹窗在视口中',
      version: '1.0.0',
      enabled: true
    });

    this.addCapability({
      id: 'behavior-draggable',
      name: '可拖拽',
      description: '允许拖拽弹窗',
      version: '1.0.0',
      enabled: true
    });

    this.addCapability({
      id: 'behavior-resizable',
      name: '可调整大小',
      description: '允许调整弹窗大小',
      version: '1.0.0',
      enabled: true
    });
  }

  protected setupCommandHandlers(): void {
    this.registerCommandHandler('setBehavior', this.handleSetBehavior.bind(this));
    this.registerCommandHandler('getBehavior', this.handleGetBehavior.bind(this));
    this.registerCommandHandler('enableBehavior', this.handleEnableBehavior.bind(this));
    this.registerCommandHandler('disableBehavior', this.handleDisableBehavior.bind(this));
    this.registerCommandHandler('addBehaviorRule', this.handleAddBehaviorRule.bind(this));
    this.registerCommandHandler('removeBehaviorRule', this.handleRemoveBehaviorRule.bind(this));
  }

  private async handleSetBehavior(params: { behavior: string; config: any }): Promise<any> {
    this.behaviors.set(params.behavior, params.config);

    this.emit('behavior:set', {
      behavior: params.behavior,
      config: params.config,
      timestamp: Date.now()
    });

    return { success: true, behavior: params.behavior };
  }

  private async handleGetBehavior(params: { behavior: string }): Promise<any> {
    const behavior = this.behaviors.get(params.behavior);

    return {
      success: true,
      behavior: params.behavior,
      config: behavior
    };
  }

  private async handleEnableBehavior(params: { behavior: string }): Promise<any> {
    const behavior = this.behaviors.get(params.behavior);
    if (behavior) {
      behavior.enabled = true;

      this.emit('behavior:enabled', {
        behavior: params.behavior,
        timestamp: Date.now()
      });
    }

    return { success: true, behavior: params.behavior };
  }

  private async handleDisableBehavior(params: { behavior: string }): Promise<any> {
    const behavior = this.behaviors.get(params.behavior);
    if (behavior) {
      behavior.enabled = false;

      this.emit('behavior:disabled', {
        behavior: params.behavior,
        timestamp: Date.now()
      });
    }

    return { success: true, behavior: params.behavior };
  }

  private async handleAddBehaviorRule(params: { behavior: string; rule: any }): Promise<any> {
    if (!this.behaviorRules.has(params.behavior)) {
      this.behaviorRules.set(params.behavior, []);
    }

    const rules = this.behaviorRules.get(params.behavior)!;
    rules.push(params.rule);

    this.emit('behavior:rule-added', {
      behavior: params.behavior,
      rule: params.rule,
      timestamp: Date.now()
    });

    return { success: true, behavior: params.behavior };
  }

  private async handleRemoveBehaviorRule(params: { behavior: string; ruleId: string }): Promise<any> {
    const rules = this.behaviorRules.get(params.behavior);
    if (rules) {
      const index = rules.findIndex(r => r.id === params.ruleId);
      if (index !== -1) {
        rules.splice(index, 1);

        this.emit('behavior:rule-removed', {
          behavior: params.behavior,
          ruleId: params.ruleId,
          timestamp: Date.now()
        });
      }
    }

    return { success: true, behavior: params.behavior };
  }
}
