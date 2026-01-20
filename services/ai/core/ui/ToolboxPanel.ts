/**
 * @file 工具箱面板组件实现
 * @description 实现IToolboxPanel接口，提供工具管理和执行功能
 * @module ui/ToolboxPanel
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { EventEmitter } from 'events';
import {
  IToolboxPanel,
  Tool,
  ToolCategory,
} from './types';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../error-handler/ErrorTypes';

export class ToolboxPanel extends EventEmitter implements IToolboxPanel {
  private tools: Map<string, Tool>;
  private categories: Map<string, ToolCategory>;
  private visible: boolean;

  constructor() {
    super();
    this.tools = new Map();
    this.categories = new Map();
    this.visible = true;
    this.initializeDefaultTools();
  }

  private initializeDefaultTools(): void {
    this.registerCategory({
      id: 'ai',
      name: 'AI工具',
      description: '人工智能相关工具',
      icon: '🤖',
      tools: [],
    });

    this.registerCategory({
      id: 'data',
      name: '数据处理',
      description: '数据分析和处理工具',
      icon: '📊',
      tools: [],
    });

    this.registerCategory({
      id: 'productivity',
      name: '生产力',
      description: '提升工作效率的工具',
      icon: '⚡',
      tools: [],
    });

    this.registerCategory({
      id: 'integration',
      name: '集成',
      description: '第三方服务集成工具',
      icon: '🔗',
      tools: [],
    });
  }

  registerTool(tool: Tool): void {
    if (this.tools.has(tool.id)) {
      throw new ConflictError(`Tool with id ${tool.id} already exists`);
    }

    this.tools.set(tool.id, tool);
    this.addToolToCategory(tool);
    this.emit('tool:registered', tool);
  }

  private addToolToCategory(tool: Tool): void {
    let category = this.categories.get(tool.category);

    if (!category) {
      category = {
        id: tool.category,
        name: tool.category,
        description: `${tool.category}工具`,
        tools: [],
      };
      this.categories.set(tool.category, category);
    }

    category.tools.push(tool);
  }

  unregisterTool(toolId: string): void {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new NotFoundError('tool', toolId);
    }

    this.tools.delete(toolId);
    this.removeToolFromCategory(tool);
    this.emit('tool:unregistered', toolId);
  }

  private removeToolFromCategory(tool: Tool): void {
    const category = this.categories.get(tool.category);
    if (category) {
      category.tools = category.tools.filter(t => t.id !== tool.id);
    }
  }

  getTool(toolId: string): Tool | undefined {
    return this.tools.get(toolId);
  }

  listTools(category?: string): Tool[] {
    if (category) {
      const cat = this.categories.get(category);
      return cat ? [...cat.tools] : [];
    }

    return Array.from(this.tools.values());
  }

  listCategories(): ToolCategory[] {
    return Array.from(this.categories.values());
  }

  getAllCategories(): ToolCategory[] {
    return Array.from(this.categories.values());
  }

  getCategory(categoryId: string): ToolCategory | undefined {
    return this.categories.get(categoryId);
  }

  getToolsByCategory(categoryId: string): Tool[] {
    const category = this.categories.get(categoryId);
    return category ? [...category.tools] : [];
  }

  deleteCategory(categoryId: string): void {
    const category = this.categories.get(categoryId);
    if (!category) {
      throw new NotFoundError('category', categoryId);
    }

    for (const tool of category.tools) {
      this.tools.delete(tool.id);
    }

    this.categories.delete(categoryId);
    this.emit('category:deleted', categoryId);
  }

  async executeTool(toolId: string, params: any): Promise<any> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      return { success: false, error: 'Tool not found' };
    }

    if (!tool.enabled) {
      return { success: false, error: 'Tool is disabled' };
    }

    this.emit('tool:executing', { toolId, params });

    try {
      const result = await tool.execute(params);
      tool.usageCount = (tool.usageCount || 0) + 1;
      this.emit('tool:executed', { toolId, params, result });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.emit('tool:error', { toolId, params, error });
      return { success: false, error: errorMessage };
    }
  }

  toggleTool(toolId: string): void {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new NotFoundError('tool', toolId);
    }

    tool.enabled = !tool.enabled;
    this.emit('tool:toggled', { toolId, enabled: tool.enabled });
  }

  enableTool(toolId: string): void {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new NotFoundError('tool', toolId);
    }

    tool.enabled = true;
    tool.status = 'enabled';
    this.emit('tool:enabled', toolId);
  }

  disableTool(toolId: string): void {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new NotFoundError('tool', toolId);
    }

    tool.enabled = false;
    tool.status = 'disabled';
    this.emit('tool:disabled', toolId);
  }

  getToolStatus(toolId: string): { enabled: boolean; usageCount: number } | string | undefined {
    const tool = this.tools.get(toolId);
    if (!tool) {
      return undefined;
    }

    if (tool.status) {
      return tool.status;
    }

    return {
      enabled: tool.enabled,
      usageCount: tool.usageCount || 0,
    };
  }

  setToolStatus(toolId: string, status: string): void {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new NotFoundError('tool', toolId);
    }

    if (status === 'disabled') {
      tool.enabled = false;
      tool.status = 'disabled';
    } else if (status === 'enabled') {
      tool.enabled = true;
      tool.status = 'enabled';
    }

    this.emit('tool:status:changed', { toolId, status });
  }

  getToolStats(): {
    totalExecutions: number;
    toolExecutions: Record<string, number>;
  } {
    const toolExecutions: Record<string, number> = {};
    let totalExecutions = 0;

    for (const [id, tool] of this.tools.entries()) {
      const count = tool.usageCount || 0;
      toolExecutions[id] = count;
      totalExecutions += count;
    }

    return {
      totalExecutions,
      toolExecutions,
    };
  }

  getToolCount(): number {
    return this.tools.size;
  }

  getToolCountByCategory(category: string): number {
    const cat = this.categories.get(category);
    return cat ? cat.tools.length : 0;
  }

  getAllTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  getExecutionStats(): {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
  } {
    let totalExecutions = 0;
    let successfulExecutions = 0;
    let failedExecutions = 0;

    for (const tool of this.tools.values()) {
      const count = tool.usageCount || 0;
      totalExecutions += count;
      successfulExecutions += count;
    }

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      averageExecutionTime: 0,
    };
  }

  getMostUsedTools(limit: number = 5): Tool[] {
    return Array.from(this.tools.values())
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, limit);
  }

  getRecentTools(limit: number = 5): Tool[] {
    return Array.from(this.tools.values())
      .filter(tool => (tool.usageCount || 0) > 0)
      .sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
      .slice(0, limit);
  }

  searchTools(query: string): Tool[] {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.tools.values()).filter(tool =>
      tool.name.toLowerCase().includes(lowerQuery) ||
      tool.description.toLowerCase().includes(lowerQuery) ||
      tool.category.toLowerCase().includes(lowerQuery)
    );
  }

  registerCategory(category: ToolCategory): void {
    if (this.categories.has(category.id)) {
      throw new ConflictError(`Category with id ${category.id} already exists`);
    }

    this.categories.set(category.id, category);
    this.emit('category:registered', category);
  }

  show(): void {
    this.visible = true;
    this.emit('visibility:changed', { visible: true });
  }

  hide(): void {
    this.visible = false;
    this.emit('visibility:changed', { visible: false });
  }

  toggle(): void {
    this.visible = !this.visible;
    this.emit('visibility:changed', { visible: this.visible });
  }

  isVisible(): boolean {
    return this.visible;
  }

  sortTools(criteria: 'name' | 'usage' | 'category', order: 'asc' | 'desc' = 'asc'): void {
    const tools = Array.from(this.tools.values());

    tools.sort((a, b) => {
      let comparison = 0;

      switch (criteria) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'usage':
          comparison = (a.usageCount || 0) - (b.usageCount || 0);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }

      return order === 'asc' ? comparison : -comparison;
    });

    this.tools.clear();
    tools.forEach(tool => this.tools.set(tool.id, tool));
    this.emit('tools:sorted', { criteria, order });
  }

  validateToolParameters(toolId: string, parameters: any): boolean {
    const tool = this.tools.get(toolId);
    if (!tool) {
      return false;
    }

    const requiredParams = tool.parameters?.required || [];
    for (const param of requiredParams) {
      if (!(param in parameters)) {
        return false;
      }
    }

    return true;
  }

  getToolParameters(toolId: string): Tool['parameters'] | undefined {
    const tool = this.tools.get(toolId);
    return tool?.parameters;
  }

  registerTools(tools: Tool[]): void {
    for (const tool of tools) {
      this.registerTool(tool);
    }
    this.emit('tools:registered', tools);
  }

  async executeTools(toolRequests: Array<{ toolId: string; params: any }>): Promise<any[]> {
    const results: any[] = [];

    for (const request of toolRequests) {
      try {
        const result = await this.executeTool(request.toolId, request.params);
        results.push({ success: true, toolId: request.toolId, result });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        results.push({ success: false, toolId: request.toolId, error: errorMessage });
      }
    }

    this.emit('tools:executed', { results });
    return results;
  }
}
