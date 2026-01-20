/**
 * @file 工具注册表
 * @description 用于管理AI工具注册、执行和推荐的核心组件
 * @module core/tools/ToolRegistry
 * @author YYC³ Team
 * @version 1.0.0
 * @created 2025-01-30
 */

import { NotFoundError, InternalError } from '../error-handler/ErrorTypes';
import type { AIContext } from '../autonomous-ai-widget/types';

// 工具定义
export interface AITool {
  name: string;
  description: string;
  category?: string;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  execute: (parameters: any) => Promise<ToolResult>;
}

// 工具执行结果
export interface ToolResult {
  success: boolean;
  data?: any;
  insights?: any;
  error?: string;
}

export class ToolRegistry {
  private tools: Map<string, AITool> = new Map();
  private toolGroups: Map<string, string[]> = new Map();
  
  registerTool(tool: AITool): void {
    this.tools.set(tool.name, tool);
    
    // 自动分组
    if (tool.category) {
      if (!this.toolGroups.has(tool.category)) {
        this.toolGroups.set(tool.category, []);
      }
      this.toolGroups.get(tool.category)!.push(tool.name);
    }
  }
  
  async executeTool(toolName: string, parameters: any): Promise<ToolResult> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new NotFoundError('tool', toolName, {
        additionalData: { availableTools: Array.from(this.tools.keys()) }
      });
    }
    
    try {
      const result = await tool.execute(parameters);
      
      // 记录工具使用
      await this.recordToolUsage(toolName, parameters, result);
      
      return result;
    } catch (error) {
      throw new InternalError(`Tool execution failed: ${error.message}`, {
        additionalData: { toolName, parameters, error: error.message }
      }, error);
    }
  }
  
  getToolsByCategory(category: string): AITool[] {
    const toolNames = this.toolGroups.get(category) || [];
    return toolNames.map(name => this.tools.get(name)!);
  }

  getAvailableTools(): AITool[] {
    return Array.from(this.tools.values());
  }

  async suggestTools(context: AIContext): Promise<AITool[]> {
    const relevantTools: AITool[] = [];
    const toolRelevanceMap = new Map<AITool, number>();
    
    await Promise.all(Array.from(this.tools.values()).map(async (tool) => {
      const relevance = await this.calculateToolRelevance(tool, context);
      toolRelevanceMap.set(tool, relevance);
      if (relevance > 0.7) {
        relevantTools.push(tool);
      }
    }));
    
    return relevantTools.sort((a, b) => {
      const relevanceA = toolRelevanceMap.get(a) || 0;
      const relevanceB = toolRelevanceMap.get(b) || 0;
      return relevanceB - relevanceA;
    }).slice(0, 5);
  }
  
  private async recordToolUsage(toolName: string, parameters: any, result: ToolResult): Promise<void> {
    // 实现工具使用记录逻辑
    console.log(`Tool used: ${toolName}`, { parameters, result });
  }
  
  private async calculateToolRelevance(tool: AITool, context: AIContext): Promise<number> {
    // 实现工具相关性计算逻辑
    return Math.random(); // 临时实现，需要根据实际上下文优化
  }

  /**
   * 获取工具注册表指标
   */
  getMetrics(): {
    totalTools: number;
    totalCategories: number;
    toolsByCategory: Record<string, number>;
  } {
    const toolsByCategory: Record<string, number> = {};
    Array.from(this.toolGroups.entries()).forEach(([category, tools]) => {
      toolsByCategory[category] = tools.length;
    });
    
    return {
      totalTools: this.tools.size,
      totalCategories: this.toolGroups.size,
      toolsByCategory,
    };
  }
}