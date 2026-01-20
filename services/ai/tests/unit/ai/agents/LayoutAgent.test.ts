/**
 * @file LayoutAgent.test.ts
 * @description LayoutAgent单元测试
 * @module tests/unit/ai/agents
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LayoutAgent } from '@/ai/agents/LayoutAgent';
import { PopupInstance } from '@/ai/BaseAgent';
import { ValidationError as YYC3ValidationError } from '@/error-handler/ErrorTypes';

describe('LayoutAgent', () => {
  let layoutAgent: LayoutAgent;
  let mockPopup: PopupInstance;

  beforeEach(() => {
    mockPopup = {
      id: 'popup-1',
      title: '测试弹窗',
      content: { title: '测试', body: '内容' },
      position: { x: 100, y: 100 },
      size: { width: 400, height: 300 },
      zIndex: 1000,
      visible: true,
      minimized: false,
      maximized: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    } as PopupInstance;

    layoutAgent = new LayoutAgent({
      id: 'layout-agent-1',
      name: '布局智能体',
      description: '布局管理智能体',
      capabilities: [],
      type: 'layout',
      version: '1.0.0'
    });

    layoutAgent.bindToPopup(mockPopup);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('初始化', () => {
    it('应该正确初始化LayoutAgent', () => {
      expect(layoutAgent).toBeDefined();
      expect(layoutAgent.config.id).toBe('layout-agent-1');
      expect(layoutAgent.config.name).toBe('布局智能体');
      expect(layoutAgent.config.type).toBe('layout');
    });

    it('应该设置正确的能力', () => {
      const capabilities = layoutAgent.config.capabilities;
      expect(capabilities.length).toBe(5);
    });

    it('应该包含位置控制能力', () => {
      const capabilities = layoutAgent.config.capabilities;
      const positionCapability = capabilities.find(c => c.id === 'layout-position');
      expect(positionCapability).toBeDefined();
      expect(positionCapability?.name).toBe('位置控制');
    });

    it('应该包含尺寸控制能力', () => {
      const capabilities = layoutAgent.config.capabilities;
      const sizeCapability = capabilities.find(c => c.id === 'layout-size');
      expect(sizeCapability).toBeDefined();
      expect(sizeCapability?.name).toBe('尺寸控制');
    });

    it('应该包含层级控制能力', () => {
      const capabilities = layoutAgent.config.capabilities;
      const zIndexCapability = capabilities.find(c => c.id === 'layout-zindex');
      expect(zIndexCapability).toBeDefined();
      expect(zIndexCapability?.name).toBe('层级控制');
    });

    it('应该包含最小化能力', () => {
      const capabilities = layoutAgent.config.capabilities;
      const minimizeCapability = capabilities.find(c => c.id === 'layout-minimize');
      expect(minimizeCapability).toBeDefined();
      expect(minimizeCapability?.name).toBe('最小化');
    });

    it('应该包含最大化能力', () => {
      const capabilities = layoutAgent.config.capabilities;
      const maximizeCapability = capabilities.find(c => c.id === 'layout-maximize');
      expect(maximizeCapability).toBeDefined();
      expect(maximizeCapability?.name).toBe('最大化');
    });
  });

  describe('位置移动', () => {
    it('应该能够移动弹窗', async () => {
      const newPosition = { x: 200, y: 300 };

      const result = await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'move',
          parameters: {
            x: newPosition.x,
            y: newPosition.y
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.success).toBe(true);
      expect(result.data.position).toEqual(newPosition);
      expect(mockPopup.position).toEqual(newPosition);
    });

    it('应该支持动画移动', async () => {
      const newPosition = { x: 250, y: 350 };
      const moveSpy = vi.spyOn(layoutAgent, 'emit');

      await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'move',
          parameters: {
            x: newPosition.x,
            y: newPosition.y,
            animate: true
          }
        }
      });

      expect(moveSpy).toHaveBeenCalledWith('layout:moved', expect.objectContaining({
        animate: true
      }));
    });

    it('应该处理负坐标', async () => {
      const negativePosition = { x: -50, y: -100 };

      const result = await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'move',
          parameters: negativePosition
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.position).toEqual(negativePosition);
    });
  });

  describe('尺寸调整', () => {
    it('应该能够调整弹窗尺寸', async () => {
      const newSize = { width: 600, height: 400 };

      const result = await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'resize',
          parameters: {
            width: newSize.width,
            height: newSize.height
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.success).toBe(true);
      expect(result.data.size).toEqual(newSize);
      expect(mockPopup.size).toEqual(newSize);
    });

    it('应该支持动画调整尺寸', async () => {
      const newSize = { width: 800, height: 600 };
      const resizeSpy = vi.spyOn(layoutAgent, 'emit');

      await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'resize',
          parameters: {
            width: newSize.width,
            height: newSize.height,
            animate: true
          }
        }
      });

      expect(resizeSpy).toHaveBeenCalledWith('layout:resized', expect.objectContaining({
        animate: true
      }));
    });

    it('应该处理最小尺寸', async () => {
      const minSize = { width: 100, height: 50 };

      const result = await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'resize',
          parameters: minSize
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.size).toEqual(minSize);
    });
  });

  describe('层级控制', () => {
    it('应该能够设置弹窗层级', async () => {
      const newZIndex = 2000;

      const result = await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setZIndex',
          parameters: {
            zIndex: newZIndex
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.success).toBe(true);
      expect(result.data.zIndex).toBe(newZIndex);
      expect(mockPopup.zIndex).toBe(newZIndex);
    });

    it('应该支持负层级', async () => {
      const negativeZIndex = -1;

      const result = await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setZIndex',
          parameters: {
            zIndex: negativeZIndex
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.zIndex).toBe(negativeZIndex);
    });

    it('应该支持零层级', async () => {
      const zeroZIndex = 0;

      const result = await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setZIndex',
          parameters: {
            zIndex: zeroZIndex
          }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.zIndex).toBe(zeroZIndex);
    });
  });

  describe('最小化', () => {
    it('应该能够最小化弹窗', async () => {
      const result = await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'minimize',
          parameters: {}
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.success).toBe(true);
      expect(result.data.minimized).toBe(true);
    });

    it('应该在最小化时发射事件', async () => {
      const minimizeSpy = vi.spyOn(layoutAgent, 'emit');

      await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'minimize',
          parameters: {}
        }
      });

      expect(minimizeSpy).toHaveBeenCalledWith('layout:minimized', expect.objectContaining({
        popupId: 'popup-1'
      }));
    });
  });

  describe('最大化', () => {
    it('应该能够最大化弹窗', async () => {
      const result = await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'maximize',
          parameters: {}
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.success).toBe(true);
      expect(result.data.maximized).toBe(true);
    });

    it('应该在最大化时发射事件', async () => {
      const maximizeSpy = vi.spyOn(layoutAgent, 'emit');

      await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'maximize',
          parameters: {}
        }
      });

      expect(maximizeSpy).toHaveBeenCalledWith('layout:maximized', expect.objectContaining({
        popupId: 'popup-1'
      }));
    });
  });

  describe('恢复', () => {
    it('应该能够恢复弹窗', async () => {
      const result = await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'restore',
          parameters: {}
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.success).toBe(true);
      expect(result.data.restored).toBe(true);
    });

    it('应该在恢复时发射事件', async () => {
      const restoreSpy = vi.spyOn(layoutAgent, 'emit');

      await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'restore',
          parameters: {}
        }
      });

      expect(restoreSpy).toHaveBeenCalledWith('layout:restored', expect.objectContaining({
        popupId: 'popup-1'
      }));
    });
  });

  describe('居中', () => {
    it('应该能够居中弹窗', async () => {
      const result = await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'center',
          parameters: {}
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.success).toBe(true);
      expect(result.data.position).toBeDefined();
      expect(result.data.position.x).toBeGreaterThan(0);
      expect(result.data.position.y).toBeGreaterThan(0);
    });

    it('应该在居中时发射事件', async () => {
      const centerSpy = vi.spyOn(layoutAgent, 'emit');

      await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'center',
          parameters: {}
        }
      });

      expect(centerSpy).toHaveBeenCalledWith('layout:centered', expect.objectContaining({
        popupId: 'popup-1'
      }));
    });

    it('应该根据屏幕尺寸计算居中位置', async () => {
      const result = await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'center',
          parameters: {}
        }
      });

      const screenWidth = window.innerWidth;
      const screenHeight = window.innerHeight;

      const expectedX = (screenWidth - mockPopup.size.width) / 2;
      const expectedY = (screenHeight - mockPopup.size.height) / 2;

      expect(result.data.position.x).toBe(expectedX);
      expect(result.data.position.y).toBe(expectedY);
    });
  });

  describe('事件发射', () => {
    it('应该在移动时发射事件', async () => {
      const moveSpy = vi.spyOn(layoutAgent, 'emit');

      await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'move',
          parameters: { x: 200, y: 300 }
        }
      });

      expect(moveSpy).toHaveBeenCalledWith('layout:moved', expect.objectContaining({
        popupId: 'popup-1',
        position: { x: 200, y: 300 }
      }));
    });

    it('应该在调整尺寸时发射事件', async () => {
      const resizeSpy = vi.spyOn(layoutAgent, 'emit');

      await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'resize',
          parameters: { width: 600, height: 400 }
        }
      });

      expect(resizeSpy).toHaveBeenCalledWith('layout:resized', expect.objectContaining({
        popupId: 'popup-1',
        size: { width: 600, height: 400 }
      }));
    });

    it('应该在设置层级时发射事件', async () => {
      const zIndexSpy = vi.spyOn(layoutAgent, 'emit');

      await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setZIndex',
          parameters: { zIndex: 2000 }
        }
      });

      expect(zIndexSpy).toHaveBeenCalledWith('layout:zindex-changed', expect.objectContaining({
        popupId: 'popup-1',
        zIndex: 2000
      }));
    });
  });

  describe('错误处理', () => {
    it('当智能体未绑定到弹窗时移动应该返回错误', async () => {
      const unboundAgent = new LayoutAgent({
        id: 'layout-agent-2',
        name: '未绑定布局智能体',
        description: '未绑定布局智能体',
        capabilities: [],
        type: 'layout',
        version: '1.0.0'
      });

      const result = await unboundAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-2',
        timestamp: Date.now(),
        payload: {
          action: 'move',
          parameters: { x: 200, y: 300 }
        }
      });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('COMMAND_EXECUTION_FAILED');
      expect(result.error.message).toContain('智能体未绑定到弹窗');
    });

    it('当智能体未绑定到弹窗时调整尺寸应该返回错误', async () => {
      const unboundAgent = new LayoutAgent({
        id: 'layout-agent-2',
        name: '未绑定布局智能体',
        description: '未绑定布局智能体',
        capabilities: [],
        type: 'layout',
        version: '1.0.0'
      });

      const result = await unboundAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-2',
        timestamp: Date.now(),
        payload: {
          action: 'resize',
          parameters: { width: 600, height: 400 }
        }
      });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('COMMAND_EXECUTION_FAILED');
      expect(result.error.message).toContain('智能体未绑定到弹窗');
    });

    it('当智能体未绑定到弹窗时设置层级应该返回错误', async () => {
      const unboundAgent = new LayoutAgent({
        id: 'layout-agent-2',
        name: '未绑定布局智能体',
        description: '未绑定布局智能体',
        capabilities: [],
        type: 'layout',
        version: '1.0.0'
      });

      const result = await unboundAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-2',
        timestamp: Date.now(),
        payload: {
          action: 'setZIndex',
          parameters: { zIndex: 2000 }
        }
      });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('COMMAND_EXECUTION_FAILED');
      expect(result.error.message).toContain('智能体未绑定到弹窗');
    });

    it('当智能体未绑定到弹窗时最小化应该返回错误', async () => {
      const unboundAgent = new LayoutAgent({
        id: 'layout-agent-2',
        name: '未绑定布局智能体',
        description: '未绑定布局智能体',
        capabilities: [],
        type: 'layout',
        version: '1.0.0'
      });

      const result = await unboundAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-2',
        timestamp: Date.now(),
        payload: {
          action: 'minimize',
          parameters: {}
        }
      });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('COMMAND_EXECUTION_FAILED');
      expect(result.error.message).toContain('智能体未绑定到弹窗');
    });

    it('当智能体未绑定到弹窗时最大化应该返回错误', async () => {
      const unboundAgent = new LayoutAgent({
        id: 'layout-agent-2',
        name: '未绑定布局智能体',
        description: '未绑定布局智能体',
        capabilities: [],
        type: 'layout',
        version: '1.0.0'
      });

      const result = await unboundAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-2',
        timestamp: Date.now(),
        payload: {
          action: 'maximize',
          parameters: {}
        }
      });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('COMMAND_EXECUTION_FAILED');
      expect(result.error.message).toContain('智能体未绑定到弹窗');
    });

    it('当智能体未绑定到弹窗时恢复应该返回错误', async () => {
      const unboundAgent = new LayoutAgent({
        id: 'layout-agent-2',
        name: '未绑定布局智能体',
        description: '未绑定布局智能体',
        capabilities: [],
        type: 'layout',
        version: '1.0.0'
      });

      const result = await unboundAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-2',
        timestamp: Date.now(),
        payload: {
          action: 'restore',
          parameters: {}
        }
      });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('COMMAND_EXECUTION_FAILED');
      expect(result.error.message).toContain('智能体未绑定到弹窗');
    });

    it('当智能体未绑定到弹窗时居中应该返回错误', async () => {
      const unboundAgent = new LayoutAgent({
        id: 'layout-agent-2',
        name: '未绑定布局智能体',
        description: '未绑定布局智能体',
        capabilities: [],
        type: 'layout',
        version: '1.0.0'
      });

      const result = await unboundAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-2',
        timestamp: Date.now(),
        payload: {
          action: 'center',
          parameters: {}
        }
      });

      expect(result.success).toBe(false);
      expect(result.error.code).toBe('COMMAND_EXECUTION_FAILED');
      expect(result.error.message).toContain('智能体未绑定到弹窗');
    });
  });

  describe('边界情况', () => {
    it('应该处理零尺寸', async () => {
      const result = await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'resize',
          parameters: { width: 0, height: 0 }
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.size).toEqual({ width: 0, height: 0 });
    });

    it('应该处理超大尺寸', async () => {
      const hugeSize = { width: 99999, height: 99999 };

      const result = await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'resize',
          parameters: hugeSize
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.size).toEqual(hugeSize);
    });

    it('应该处理超大坐标', async () => {
      const hugePosition = { x: 99999, y: 99999 };

      const result = await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'move',
          parameters: hugePosition
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.position).toEqual(hugePosition);
    });

    it('应该处理负尺寸', async () => {
      const negativeSize = { width: -100, height: -200 };

      const result = await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'resize',
          parameters: negativeSize
        }
      });

      expect(result.success).toBe(true);
      expect(result.data.size).toEqual(negativeSize);
    });
  });

  describe('性能测试', () => {
    it('应该能够快速移动弹窗', async () => {
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        await layoutAgent.handleMessage({
          id: `msg-${i}`,
          type: 'command',
          from: 'user',
          to: 'layout-agent-1',
          timestamp: Date.now(),
          payload: {
            action: 'move',
            parameters: { x: i * 10, y: i * 10 }
          }
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('应该能够快速调整尺寸', async () => {
      const startTime = performance.now();

      for (let i = 0; i < 100; i++) {
        await layoutAgent.handleMessage({
          id: `msg-${i}`,
          type: 'command',
          from: 'user',
          to: 'layout-agent-1',
          timestamp: Date.now(),
          payload: {
            action: 'resize',
            parameters: { width: 400 + i * 10, height: 300 + i * 10 }
          }
        });
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('组合操作', () => {
    it('应该能够连续执行多个布局操作', async () => {
      await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'move',
          parameters: { x: 200, y: 200 }
        }
      });

      await layoutAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'resize',
          parameters: { width: 600, height: 400 }
        }
      });

      await layoutAgent.handleMessage({
        id: 'msg-3',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'setZIndex',
          parameters: { zIndex: 2000 }
        }
      });

      expect(mockPopup.position).toEqual({ x: 200, y: 200 });
      expect(mockPopup.size).toEqual({ width: 600, height: 400 });
      expect(mockPopup.zIndex).toBe(2000);
    });

    it('应该能够在最小化后恢复', async () => {
      await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'minimize',
          parameters: {}
        }
      });

      const restoreResult = await layoutAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'restore',
          parameters: {}
        }
      });

      expect(restoreResult.success).toBe(true);
      expect(restoreResult.data.restored).toBe(true);
    });

    it('应该能够在最大化后恢复', async () => {
      await layoutAgent.handleMessage({
        id: 'msg-1',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'maximize',
          parameters: {}
        }
      });

      const restoreResult = await layoutAgent.handleMessage({
        id: 'msg-2',
        type: 'command',
        from: 'user',
        to: 'layout-agent-1',
        timestamp: Date.now(),
        payload: {
          action: 'restore',
          parameters: {}
        }
      });

      expect(restoreResult.success).toBe(true);
      expect(restoreResult.data.restored).toBe(true);
    });
  });
});
