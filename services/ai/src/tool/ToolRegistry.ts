import { EventEmitter } from 'events';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  category: string;
  parameters: ToolParameter[];
  execute: (params: Record<string, any>) => Promise<ToolResult>;
  validate?: (params: Record<string, any>) => ValidationResult;
}

export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description: string;
  default?: any;
  enum?: any[];
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: Error;
  executionTime: number;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

export interface ToolRegistrationResult {
  success: boolean;
  toolId?: string;
  errors?: string[];
}

export class ToolRegistry extends EventEmitter {
  private tools: Map<string, ToolDefinition> = new Map();
  private toolCategories: Map<string, string[]> = new Map();

  async registerTool(tool: ToolDefinition): Promise<ToolRegistrationResult> {
    try {
      const validation = this.validateToolDefinition(tool);
      if (!validation.valid) {
        return {
          success: false,
          errors: validation.errors
        };
      }

      if (this.tools.has(tool.id)) {
        return {
          success: false,
          errors: [`Tool with ID ${tool.id} already exists`]
        };
      }

      this.tools.set(tool.id, tool);

      if (!this.toolCategories.has(tool.category)) {
        this.toolCategories.set(tool.category, []);
      }
      this.toolCategories.get(tool.category)!.push(tool.id);

      this.emit('tool:registered', { toolId: tool.id, tool });

      return {
        success: true,
        toolId: tool.id
      };

    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  async unregisterTool(toolId: string): Promise<void> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      throw new Error(`Tool ${toolId} not found`);
    }

    this.tools.delete(toolId);

    const category = this.toolCategories.get(tool.category);
    if (category) {
      const index = category.indexOf(toolId);
      if (index > -1) {
        category.splice(index, 1);
      }
    }

    this.emit('tool:unregistered', { toolId, tool });
  }

  async executeTool(toolId: string, parameters: Record<string, any>): Promise<ToolResult> {
    const tool = this.tools.get(toolId);
    if (!tool) {
      return {
        success: false,
        error: new Error(`Tool ${toolId} not found`),
        executionTime: 0
      };
    }

    const startTime = Date.now();

    try {
      if (tool.validate) {
        const validation = tool.validate(parameters);
        if (!validation.valid) {
          return {
            success: false,
            error: new Error(`Parameter validation failed: ${validation.errors?.join(', ')}`),
            executionTime: Date.now() - startTime
          };
        }
      }

      const result = await tool.execute(parameters);

      return {
        success: true,
        data: result,
        executionTime: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        executionTime: Date.now() - startTime
      };
    }
  }

  getTool(toolId: string): ToolDefinition | undefined {
    return this.tools.get(toolId);
  }

  listTools(category?: string): ToolDefinition[] {
    if (category) {
      const toolIds = this.toolCategories.get(category);
      if (!toolIds) return [];

      return toolIds
        .map(id => this.tools.get(id))
        .filter((tool): tool is ToolDefinition => tool !== undefined);
    }

    return Array.from(this.tools.values());
  }

  searchTools(query: string): ToolDefinition[] {
    const lowerQuery = query.toLowerCase();

    return Array.from(this.tools.values()).filter(tool =>
      tool.name.toLowerCase().includes(lowerQuery) ||
      tool.description.toLowerCase().includes(lowerQuery) ||
      tool.id.toLowerCase().includes(lowerQuery)
    );
  }

  private validateToolDefinition(tool: ToolDefinition): ValidationResult {
    const errors: string[] = [];

    if (!tool.id) errors.push('Tool ID is required');
    if (!tool.name) errors.push('Tool name is required');
    if (!tool.description) errors.push('Tool description is required');
    if (!tool.category) errors.push('Tool category is required');
    if (!tool.execute) errors.push('Tool execute function is required');
    if (!tool.parameters) errors.push('Tool parameters are required');
    else {
      tool.parameters.forEach((param, index) => {
        if (!param.name) errors.push(`Parameter ${index}: name is required`);
        if (!param.type) errors.push(`Parameter ${index}: type is required`);
        if (param.required === undefined) errors.push(`Parameter ${index}: required is required`);
      });
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}

export const createTextAnalysisTool = (): ToolDefinition => ({
  id: 'text-analysis',
  name: 'Text Analysis',
  description: '分析文本的基本特征，如字数、词数、句子数等',
  version: '1.0.0',
  category: 'text',
  parameters: [
    {
      name: 'text',
      type: 'string',
      required: true,
      description: '要分析的文本'
    }
  ],
  validate: (params) => {
    if (!params.text || typeof params.text !== 'string') {
      return {
        valid: false,
        errors: ['text parameter is required and must be a string']
      };
    }
    return { valid: true };
  },
  execute: async (params) => {
    const text = params.text as string;
    const startTime = Date.now();

    const result = {
      characterCount: text.length,
      wordCount: text.split(/\s+/).filter(word => word.length > 0).length,
      sentenceCount: text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length,
      paragraphCount: text.split(/\n\n+/).filter(para => para.trim().length > 0).length
    };

    return {
      success: true,
      data: result,
      executionTime: Date.now() - startTime
    };
  }
});

export const createCalculatorTool = (): ToolDefinition => ({
  id: 'calculator',
  name: 'Calculator',
  description: '执行基本数学运算',
  version: '1.0.0',
  category: 'math',
  parameters: [
    {
      name: 'operation',
      type: 'string',
      required: true,
      description: '要执行的运算 (add, subtract, multiply, divide)',
      enum: ['add', 'subtract', 'multiply', 'divide']
    },
    {
      name: 'a',
      type: 'number',
      required: true,
      description: '第一个操作数'
    },
    {
      name: 'b',
      type: 'number',
      required: true,
      description: '第二个操作数'
    }
  ],
  validate: (params) => {
    const errors: string[] = [];

    if (params.operation === undefined || typeof params.operation !== 'string') {
      errors.push('operation parameter is required and must be a string');
    } else if (!['add', 'subtract', 'multiply', 'divide'].includes(params.operation)) {
      errors.push('operation must be one of: add, subtract, multiply, divide');
    }

    if (params.a === undefined || typeof params.a !== 'number') {
      errors.push('a parameter is required and must be a number');
    }

    if (params.b === undefined || typeof params.b !== 'number') {
      errors.push('b parameter is required and must be a number');
    }

    if (params.operation === 'divide' && params.b === 0) {
      errors.push('Division by zero is not allowed');
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  },
  execute: async (params) => {
    const { operation, a, b } = params;

    switch (operation) {
      case 'add':
        return a + b;
      case 'subtract':
        return a - b;
      case 'multiply':
        return a * b;
      case 'divide':
        return a / b;
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  }
});
