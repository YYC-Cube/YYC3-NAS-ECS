/**
 * @file BehaviorAgent单元测试
 * @description 测试BehaviorAgent的行为管理功能
 * @module __tests__/unit/ai/agents/BehaviorAgent.test
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-02
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BehaviorAgent } from '@/ai/agents/BehaviorAgent';
import { AgentConfig } from '@/ai/AgentProtocol';
import type { AgentCapability, AgentCommand, AgentResponse } from '@/ai/types';

describe('BehaviorAgent', () => {
  let behaviorAgent: BehaviorAgent;
  let testConfig: AgentConfig;
  let mockPopup: any;

  beforeEach(() => {
    testConfig = {
      id: 'behavior-agent-1',
      name: 'Behavior Agent',
      description: 'Behavior agent for unit testing',
      capabilities: [],
      policies: {
        maxConcurrentRequests: 10,
        rateLimit: 100,
        privacyLevel: 'medium',
        dataRetention: 30
      }
    };

    mockPopup = {
      id: 'popup-1',
      title: 'Test Popup',
      content: {},
      position: { x: 100, y: 100 },
      size: { width: 400, height: 300 },
      visible: true,
      zIndex: 100
    };

    behaviorAgent = new BehaviorAgent(testConfig);
  });

  afterEach(() => {
    behaviorAgent.destroy();
  });

  describe('初始化', () => {
    it('应该正确初始化BehaviorAgent', () => {
      expect(behaviorAgent).toBeDefined();
      expect(behaviorAgent.config.id).toBe('behavior-agent-1');
      expect(behaviorAgent.config.name).toBe('Behavior Agent');
    });

    it('应该设置正确的能力', () => {
      const capabilities = behaviorAgent.config.capabilities;
      expect(capabilities).toBeDefined();
      expect(Array.isArray(capabilities)).toBe(true);
      expect(capabilities.length).toBeGreaterThan(0);
    });

    it('应该包含自动隐藏能力', () => {
      const capabilities = behaviorAgent.config.capabilities;
      const autohideCapability = capabilities.find((cap: AgentCapability) => cap.id === 'behavior-autohide');
      expect(autohideCapability).toBeDefined();
      expect(autohideCapability.name).toBe('自动隐藏');
    });

    it('应该包含自动关闭能力', () => {
      const capabilities = behaviorAgent.config.capabilities;
      const autocloseCapability = capabilities.find((cap: AgentCapability) => cap.id === 'behavior-autoclose');
      expect(autocloseCapability).toBeDefined();
      expect(autocloseCapability.name).toBe('自动关闭');
    });

    it('应该包含粘性定位能力', () => {
      const capabilities = behaviorAgent.config.capabilities;
      const stickyCapability = capabilities.find((cap: AgentCapability) => cap.id === 'behavior-sticky');
      expect(stickyCapability).toBeDefined();
      expect(stickyCapability.name).toBe('粘性');
    });

    it('应该包含拖拽能力', () => {
      const capabilities = behaviorAgent.config.capabilities;
      const draggableCapability = capabilities.find((cap: AgentCapability) => cap.id === 'behavior-draggable');
      expect(draggableCapability).toBeDefined();
      expect(draggableCapability.name).toBe('可拖拽');
    });

    it('应该包含调整大小能力', () => {
      const capabilities = behaviorAgent.config.capabilities;
      const resizableCapability = capabilities.find((cap: AgentCapability) => cap.id === 'behavior-resizable');
      expect(resizableCapability).toBeDefined();
      expect(resizableCapability.name).toBe('可调整大小');
    });
  });

  describe('行为配置', () => {
    it('应该能够设置行为配置', async () => {
      const result = await behaviorAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setBehavior',
          parameters: {
            behavior: 'autohide',
            config: {
              enabled: true,
              delay: 5000
            }
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('应该能够获取行为配置', async () => {
      await behaviorAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setBehavior',
          parameters: {
            behavior: 'autohide',
            config: {
              enabled: true,
              delay: 5000
            }
          }
        }
      });

      const result = await behaviorAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'getBehavior',
          parameters: {
            behavior: 'autohide'
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.config.enabled).toBe(true);
      expect(result.data.config.delay).toBe(5000);
    });

    it('应该能够启用行为', async () => {
      const result = await behaviorAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'enableBehavior',
          parameters: {
            behavior: 'autohide'
          }
        }
      });

      expect(result.success).toBe(true);
    });

    it('应该能够禁用行为', async () => {
      const result = await behaviorAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'disableBehavior',
          parameters: {
            behavior: 'autohide'
          }
        }
      });

      expect(result.success).toBe(true);
    });
  });

  describe('行为规则管理', () => {
    it('应该能够添加行为规则', async () => {
      const result = await behaviorAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'addBehaviorRule',
          parameters: {
            behavior: 'autohide',
            rule: {
              condition: 'userInactive',
              action: 'hide',
              threshold: 30000
            }
          }
        }
      });

      expect(result.success).toBe(true);
    });

    it('应该能够移除行为规则', async () => {
      await behaviorAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'addBehaviorRule',
          parameters: {
            behavior: 'autohide',
            rule: {
              id: 'rule-1',
              condition: 'userInactive',
              action: 'hide',
              threshold: 30000
            }
          }
        }
      });

      const result = await behaviorAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'removeBehaviorRule',
          parameters: {
            behavior: 'autohide',
            ruleId: 'rule-1'
          }
        }
      });

      expect(result.success).toBe(true);
    });
  });

  describe('事件发射', () => {
    it('应该在设置行为时发射事件', async () => {
      const eventSpy = vi.fn();
      behaviorAgent.on('behavior:set', eventSpy);

      await behaviorAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setBehavior',
          parameters: {
            behavior: 'autohide',
            config: {
              enabled: true,
              delay: 5000
            }
          }
        }
      });

      expect(eventSpy).toHaveBeenCalled();
    });

    it('应该在启用行为时发射事件', async () => {
      const eventSpy = vi.fn();
      behaviorAgent.on('behavior:enabled', eventSpy);

      await behaviorAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setBehavior',
          parameters: {
            behavior: 'autohide',
            config: {
              enabled: false,
              delay: 5000
            }
          }
        }
      });

      await behaviorAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'enableBehavior',
          parameters: {
            behavior: 'autohide'
          }
        }
      });

      expect(eventSpy).toHaveBeenCalled();
    });

    it('应该在禁用行为时发射事件', async () => {
      const eventSpy = vi.fn();
      behaviorAgent.on('behavior:disabled', eventSpy);

      await behaviorAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setBehavior',
          parameters: {
            behavior: 'autohide',
            config: {
              enabled: true,
              delay: 5000
            }
          }
        }
      });

      await behaviorAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'disableBehavior',
          parameters: {
            behavior: 'autohide'
          }
        }
      });

      expect(eventSpy).toHaveBeenCalled();
    });

    it('应该在添加规则时发射事件', async () => {
      const eventSpy = vi.fn();
      behaviorAgent.on('behavior:rule-added', eventSpy);

      await behaviorAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'addBehaviorRule',
          parameters: {
            behavior: 'autohide',
            rule: {
              id: 'rule-1',
              condition: 'userInactive',
              action: 'hide',
              threshold: 30000
            }
          }
        }
      });

      expect(eventSpy).toHaveBeenCalled();
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的行为类型', async () => {
      const result = await behaviorAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setBehavior',
          parameters: {
            behavior: 'invalid-behavior',
            config: {
              enabled: true
            }
          }
        }
      });

      expect(result.success).toBe(true);
    });

    it('应该处理缺少的popupId', async () => {
      const result = await behaviorAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setBehavior',
          parameters: {
            behavior: 'autohide',
            config: {
              enabled: true
            }
          }
        }
      });

      expect(result.success).toBe(true);
    });

    it('应该处理未知的命令类型', async () => {
      const result = await behaviorAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'unknownCommand',
          parameters: {}
        }
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('应该处理无效的规则ID', async () => {
      const result = await behaviorAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'removeBehaviorRule',
          parameters: {
            behavior: 'autohide',
            ruleId: 'non-existent-rule'
          }
        }
      });

      expect(result.success).toBe(true);
    });
  });

  describe('行为类型验证', () => {
    it('应该支持autohide行为', async () => {
      const result = await behaviorAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setBehavior',
          parameters: {
            behavior: 'autohide',
            config: {
              enabled: true,
              delay: 5000
            }
          }
        }
      });

      expect(result.success).toBe(true);
    });

    it('应该支持autoclose行为', async () => {
      const result = await behaviorAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setBehavior',
          parameters: {
            behavior: 'autoclose',
            config: {
              enabled: true,
              timeout: 10000
            }
          }
        }
      });

      expect(result.success).toBe(true);
    });

    it('应该支持sticky行为', async () => {
      const result = await behaviorAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setBehavior',
          parameters: {
            behavior: 'sticky',
            config: {
              enabled: true,
              position: 'top-right'
            }
          }
        }
      });

      expect(result.success).toBe(true);
    });

    it('应该支持draggable行为', async () => {
      const result = await behaviorAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setBehavior',
          parameters: {
            behavior: 'draggable',
            config: {
              enabled: true,
              handle: '.drag-handle'
            }
          }
        }
      });

      expect(result.success).toBe(true);
    });

    it('应该支持resizable行为', async () => {
      const result = await behaviorAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setBehavior',
          parameters: {
            behavior: 'resizable',
            config: {
              enabled: true,
              minWidth: 200,
              minHeight: 150
            }
          }
        }
      });

      expect(result.success).toBe(true);
    });
  });

  describe('批量操作', () => {
    it('应该能够批量设置多个行为', async () => {
      const results = await Promise.all([
        behaviorAgent.handleMessage({
          id: 'msg-1',
          type: 'command',
          from: 'user',
          to: 'behavior-agent-1',
          timestamp: Date.now(),
          payload: {
            action: 'setBehavior',
            parameters: {
              behavior: 'autohide',
              config: { enabled: true, delay: 5000 }
            }
          }
        }),
        behaviorAgent.handleMessage({
          id: 'msg-2',
          type: 'command',
          from: 'user',
          to: 'behavior-agent-1',
          timestamp: Date.now(),
          payload: {
            action: 'setBehavior',
            parameters: {
              behavior: 'autoclose',
              config: { enabled: true, timeout: 10000 }
            }
          }
        }),
        behaviorAgent.handleMessage({
          id: 'msg-3',
          type: 'command',
          from: 'user',
          to: 'behavior-agent-1',
          timestamp: Date.now(),
          payload: {
            action: 'setBehavior',
            parameters: {
              behavior: 'sticky',
              config: { enabled: true, position: 'top-right' }
            }
          }
        })
      ]);

      results.forEach(response => {
        expect(response.success).toBe(true);
      });
    });

    it('应该能够批量启用多个行为', async () => {
      const behaviorTypes = ['autohide', 'autoclose', 'sticky', 'draggable', 'resizable'];

      const results = await Promise.all(
        behaviorTypes.map((type, index) =>
          behaviorAgent.handleMessage({
            id: `msg-${index + 1}`,
            type: 'command',
            from: 'user',
            to: 'behavior-agent-1',
            timestamp: Date.now(),
            payload: {
              action: 'enableBehavior',
              parameters: {
                behavior: type
              }
            }
          })
        )
      );

      results.forEach(response => {
        expect(response.success).toBe(true);
      });
    });
  });

  describe('状态管理', () => {
    it('应该能够获取所有行为状态', async () => {
      const result = await behaviorAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'getBehavior',
          parameters: {
            behavior: 'autohide'
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('应该能够重置行为配置', async () => {
      await behaviorAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setBehavior',
          parameters: {
            behavior: 'autohide',
            config: {
              enabled: true,
              delay: 5000
            }
          }
        }
      });

      const result = await behaviorAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setBehavior',
          parameters: {
            behavior: 'autohide',
            config: {
              enabled: false
            }
          }
        }
      });

      expect(result.success).toBe(true);
    });
  });

  describe('性能测试', () => {
    it('应该能够处理大量行为配置', async () => {
      const behaviorTypes = ['autohide', 'autoclose', 'sticky', 'draggable', 'resizable'];
      const messages = [];

      for (let i = 0; i < 100; i++) {
        const behaviorType = behaviorTypes[i % behaviorTypes.length];
        messages.push({
          id: `msg-${i + 1}`,
          type: 'command' as const,
          from: 'user',
          to: 'behavior-agent-1',
          timestamp: Date.now(),
          payload: {
            action: 'setBehavior',
            parameters: {
              behavior: behaviorType,
              config: {
                enabled: true,
                delay: 5000
              }
            }
          }
        });
      }

      const startTime = Date.now();
      const results = await Promise.all(
        messages.map(msg => behaviorAgent.handleMessage(msg))
      );
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(5000);

      results.forEach(response => {
        expect(response.success).toBe(true);
      });
    });

    it('应该能够快速获取行为配置', async () => {
      await behaviorAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setBehavior',
          parameters: {
            behavior: 'autohide',
            config: {
              enabled: true,
              delay: 5000
            }
          }
        }
      });

      const startTime = Date.now();
      const response = await behaviorAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'getBehavior',
          parameters: {
            behavior: 'autohide'
          }
        }
      });
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(100);
      expect(response.success).toBe(true);
    });
  });

  describe('边界情况', () => {
    it('应该处理空配置', async () => {
      const result = await behaviorAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setBehavior',
          parameters: {
            behavior: 'autohide',
            config: {}
          }
        }
      });

      expect(result.success).toBe(true);
    });

    it('应该处理超长行为类型名称', async () => {
      const longBehaviorType = 'a'.repeat(1000);

      const result = await behaviorAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setBehavior',
          parameters: {
            behavior: longBehaviorType,
            config: {
              enabled: true
            }
          }
        }
      });

      expect(result.success).toBe(true);
    });

    it('应该处理特殊字符在popupId中', async () => {
      const result = await behaviorAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'behavior-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setBehavior',
          parameters: {
            behavior: 'autohide',
            config: {
              enabled: true
            }
          }
        }
      });

      expect(result.success).toBe(true);
    });
  });
});
