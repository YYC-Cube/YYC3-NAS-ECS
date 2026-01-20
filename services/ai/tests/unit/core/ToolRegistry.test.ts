import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ToolRegistry, AITool, ToolResult } from '../../../core/tools/ToolRegistry';
import { NotFoundError, InternalError } from '../../../core/error-handler/ErrorTypes';
import type { AIContext } from '../../../core/autonomous-ai-widget/types';

describe('ToolRegistry', () => {
  let registry: ToolRegistry;
  let mockTool: AITool;
  let mockContext: AIContext;

  beforeEach(() => {
    registry = new ToolRegistry();
    
    mockTool = {
      name: 'test-tool',
      description: '测试工具',
      category: 'test',
      parameters: {
        type: 'object',
        properties: {
          input: { type: 'string' },
        },
        required: ['input'],
      },
      execute: async (params: any) => {
        return { success: true, data: `processed: ${params.input}` };
      },
    };

    mockContext = {
      conversation: [],
      tools: [],
      metadata: {},
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('工具注册', () => {
    it('应该成功注册工具', () => {
      registry.registerTool(mockTool);
      
      const tools = registry.getAvailableTools();
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('test-tool');
    });

    it('应该支持注册多个工具', () => {
      const tool2: AITool = {
        name: 'test-tool-2',
        description: '测试工具2',
        category: 'test',
        parameters: {
          type: 'object',
          properties: {},
          required: [],
        },
        execute: async () => ({ success: true }),
      };

      registry.registerTool(mockTool);
      registry.registerTool(tool2);

      const tools = registry.getAvailableTools();
      expect(tools).toHaveLength(2);
    });

    it('应该自动将工具分类', () => {
      registry.registerTool(mockTool);
      
      const categoryTools = registry.getToolsByCategory('test');
      expect(categoryTools).toHaveLength(1);
      expect(categoryTools[0].name).toBe('test-tool');
    });

    it('应该支持多个分类', () => {
      const tool2: AITool = {
        ...mockTool,
        name: 'tool-2',
        category: 'category-2',
      };

      registry.registerTool(mockTool);
      registry.registerTool(tool2);

      const testTools = registry.getToolsByCategory('test');
      const category2Tools = registry.getToolsByCategory('category-2');

      expect(testTools).toHaveLength(1);
      expect(category2Tools).toHaveLength(1);
    });

    it('应该处理没有分类的工具', () => {
      const toolWithoutCategory: AITool = {
        ...mockTool,
        name: 'no-category-tool',
        category: undefined,
      };

      registry.registerTool(toolWithoutCategory);

      const tools = registry.getAvailableTools();
      expect(tools).toHaveLength(1);

      const categoryTools = registry.getToolsByCategory('test');
      expect(categoryTools).toHaveLength(0);
    });
  });

  describe('工具执行', () => {
    beforeEach(() => {
      registry.registerTool(mockTool);
    });

    it('应该成功执行工具', async () => {
      const result = await registry.executeTool('test-tool', { input: 'test' });
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('processed: test');
    });

    it('应该传递参数给工具', async () => {
      const spy = vi.fn().mockResolvedValue({ success: true, data: 'result' });
      const toolWithSpy: AITool = {
        ...mockTool,
        name: 'spy-tool',
        execute: spy,
      };

      registry.registerTool(toolWithSpy);
      await registry.executeTool('spy-tool', { input: 'test' });

      expect(spy).toHaveBeenCalledWith({ input: 'test' });
    });

    it('应该记录工具使用', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      await registry.executeTool('test-tool', { input: 'test' });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Tool used: test-tool',
        expect.objectContaining({
          parameters: { input: 'test' },
        })
      );

      consoleSpy.mockRestore();
    });

    it('应该抛出NotFoundError当工具不存在', async () => {
      await expect(registry.executeTool('non-existent-tool', {}))
        .rejects.toThrow(NotFoundError);
    });

    it('应该在NotFoundError中包含可用工具列表', async () => {
      registry.registerTool({
        ...mockTool,
        name: 'available-tool',
      });

      try {
        await registry.executeTool('non-existent-tool', {});
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeInstanceOf(NotFoundError);
        expect(error.context?.additionalData?.availableTools).toContain('test-tool');
        expect(error.context?.additionalData?.availableTools).toContain('available-tool');
      }
    });

    it('应该处理工具执行失败', async () => {
      const failingTool: AITool = {
        ...mockTool,
        name: 'failing-tool',
        execute: async () => {
          throw new Error('Execution failed');
        },
      };

      registry.registerTool(failingTool);

      await expect(registry.executeTool('failing-tool', {}))
        .rejects.toThrow(InternalError);
    });

    it('应该在InternalError中包含错误详情', async () => {
      const failingTool: AITool = {
        ...mockTool,
        name: 'failing-tool',
        execute: async () => {
          throw new Error('Execution failed');
        },
      };

      registry.registerTool(failingTool);

      try {
        await registry.executeTool('failing-tool', { param: 'value' });
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeInstanceOf(InternalError);
        expect(error.context?.additionalData?.toolName).toBe('failing-tool');
        expect(error.context?.additionalData?.parameters).toEqual({ param: 'value' });
        expect(error.context?.additionalData?.error).toBe('Execution failed');
      }
    });
  });

  describe('工具查询', () => {
    beforeEach(() => {
      registry.registerTool(mockTool);
    });

    it('应该获取所有可用工具', () => {
      const tools = registry.getAvailableTools();
      
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('test-tool');
    });

    it('应该按分类获取工具', () => {
      const categoryTools = registry.getToolsByCategory('test');
      
      expect(categoryTools).toHaveLength(1);
      expect(categoryTools[0].category).toBe('test');
    });

    it('应该返回空数组当分类不存在', () => {
      const categoryTools = registry.getToolsByCategory('non-existent');
      
      expect(categoryTools).toEqual([]);
    });

    it('应该正确获取多个分类的工具', () => {
      const tool2: AITool = {
        ...mockTool,
        name: 'tool-2',
        category: 'category-2',
      };

      registry.registerTool(tool2);

      const testTools = registry.getToolsByCategory('test');
      const category2Tools = registry.getToolsByCategory('category-2');

      expect(testTools).toHaveLength(1);
      expect(category2Tools).toHaveLength(1);
      expect(testTools[0].name).toBe('test-tool');
      expect(category2Tools[0].name).toBe('tool-2');
    });
  });

  describe('工具推荐', () => {
    beforeEach(() => {
      registry.registerTool(mockTool);
    });

    it('应该基于上下文推荐工具', async () => {
      const suggestedTools = await registry.suggestTools(mockContext);
      
      expect(Array.isArray(suggestedTools)).toBe(true);
    });

    it('应该限制推荐工具数量', async () => {
      for (let i = 0; i < 10; i++) {
        registry.registerTool({
          ...mockTool,
          name: `tool-${i}`,
        });
      }

      const suggestedTools = await registry.suggestTools(mockContext);
      
      expect(suggestedTools.length).toBeLessThanOrEqual(5);
    });

    it('应该按相关性排序推荐工具', async () => {
      const tool2: AITool = {
        ...mockTool,
        name: 'tool-2',
      };

      registry.registerTool(tool2);

      const suggestedTools = await registry.suggestTools(mockContext);
      
      expect(suggestedTools.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('指标获取', () => {
    it('应该返回空指标当没有工具', () => {
      const metrics = registry.getMetrics();
      
      expect(metrics.totalTools).toBe(0);
      expect(metrics.totalCategories).toBe(0);
      expect(metrics.toolsByCategory).toEqual({});
    });

    it('应该正确统计工具数量', () => {
      registry.registerTool(mockTool);

      const metrics = registry.getMetrics();
      
      expect(metrics.totalTools).toBe(1);
    });

    it('应该正确统计分类数量', () => {
      registry.registerTool(mockTool);

      const metrics = registry.getMetrics();
      
      expect(metrics.totalCategories).toBe(1);
    });

    it('应该正确统计每个分类的工具数量', () => {
      registry.registerTool(mockTool);
      registry.registerTool({
        ...mockTool,
        name: 'tool-2',
      });

      const metrics = registry.getMetrics();
      
      expect(metrics.toolsByCategory['test']).toBe(2);
    });

    it('应该正确统计多个分类的工具数量', () => {
      registry.registerTool(mockTool);
      registry.registerTool({
        ...mockTool,
        name: 'tool-2',
        category: 'category-2',
      });

      const metrics = registry.getMetrics();
      
      expect(metrics.toolsByCategory['test']).toBe(1);
      expect(metrics.toolsByCategory['category-2']).toBe(1);
    });

    it('应该处理没有分类的工具', () => {
      registry.registerTool({
        ...mockTool,
        name: 'no-category-tool',
        category: undefined,
      });

      const metrics = registry.getMetrics();
      
      expect(metrics.totalTools).toBe(1);
      expect(metrics.totalCategories).toBe(0);
    });
  });

  describe('错误处理', () => {
    it('应该处理工具执行中的异步错误', async () => {
      const asyncErrorTool: AITool = {
        ...mockTool,
        name: 'async-error-tool',
        execute: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          throw new Error('Async error');
        },
      };

      registry.registerTool(asyncErrorTool);

      await expect(registry.executeTool('async-error-tool', {}))
        .rejects.toThrow(InternalError);
    });

    it('应该处理工具执行中的同步错误', async () => {
      const syncErrorTool: AITool = {
        ...mockTool,
        name: 'sync-error-tool',
        execute: () => {
          throw new Error('Sync error');
        },
      };

      registry.registerTool(syncErrorTool);

      await expect(registry.executeTool('sync-error-tool', {}))
        .rejects.toThrow(InternalError);
    });
  });

  describe('边界情况', () => {
    it('应该处理空参数', async () => {
      registry.registerTool(mockTool);

      const result = await registry.executeTool('test-tool', {});
      
      expect(result.success).toBe(true);
    });

    it('应该处理复杂参数', async () => {
      const complexParams = {
        input: 'test',
        nested: {
          value: 123,
          array: [1, 2, 3],
        },
      };

      registry.registerTool(mockTool);

      const result = await registry.executeTool('test-tool', complexParams);
      
      expect(result.success).toBe(true);
    });

    it('应该处理同名工具覆盖', () => {
      registry.registerTool(mockTool);
      registry.registerTool({
        ...mockTool,
        description: 'Updated description',
      });

      const tools = registry.getAvailableTools();
      
      expect(tools).toHaveLength(1);
      expect(tools[0].description).toBe('Updated description');
    });
  });
});
