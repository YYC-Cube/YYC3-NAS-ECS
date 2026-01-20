/**
 * @file 核心工具集定义
 * @description 提供系统核心工具集，包括搜索、计算器、代码解释器等基础工具
 * @module tools/core-tools
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { AITool } from './types';

/**
 * 搜索工具
 * 用于执行网络搜索获取信息
 */
export const searchTool: AITool = {
  name: 'search',
  description: '执行网络搜索，获取最新信息和数据',
  version: '1.0.0',
  group: 'information',
  author: 'YYC³',
  parameters: [
    {
      name: 'query',
      type: 'string',
      description: '搜索查询词',
      required: true,
      validation: {
        minLength: 1,
        maxLength: 500
      }
    },
    {
      name: 'numResults',
      type: 'number',
      description: '返回结果数量',
      required: false,
      default: 5,
      validation: {
        min: 1,
        max: 20
      }
    },
    {
      name: 'language',
      type: 'string',
      description: '搜索语言',
      required: false,
      default: 'zh-CN'
    }
  ],
  async execute(params, context) {
    const startTime = Date.now();
    const { query, numResults = 5, language = 'zh-CN' } = params;

    try {
      // 模拟搜索结果
      // 实际实现中应该调用搜索引擎API
      const mockResults = Array.from({ length: numResults }, (_, i) => ({
        title: `搜索结果 ${i + 1}: ${query}`,
        url: `https://example.com/search?q=${encodeURIComponent(query)}&result=${i + 1}`,
        snippet: `这是关于"${query}"的搜索结果摘要 ${i + 1}。包含相关信息和数据。`
      }));

      const content = `搜索结果 (${language}):\n\n${mockResults.map((result, index) => 
        `${index + 1}. ${result.title}\n   ${result.url}\n   ${result.snippet}`
      ).join('\n\n')}`;

      return {
        success: true,
        content,
        data: mockResults,
        executionTime: Date.now() - startTime,
        toolName: 'search',
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        content: '',
        error: `搜索失败: ${error instanceof Error ? error.message : String(error)}`,
        executionTime: Date.now() - startTime,
        toolName: 'search',
        timestamp: Date.now()
      };
    }
  },
  examples: [
    {
      name: '搜索天气',
      description: '搜索当前天气信息',
      params: {
        query: '北京今天天气',
        numResults: 3,
        language: 'zh-CN'
      },
      result: {
        success: true,
        content: '搜索结果 (zh-CN):\n\n1. 北京今天天气 - 晴 25°C\n   https://example.com/weather/beijing\n   北京今日天气晴朗，气温25°C，适合户外活动。\n\n2. 北京天气预报 - 未来7天\n   https://example.com/weather/beijing/7days\n   北京未来7天天气以晴为主，气温22-28°C。\n\n3. 北京空气质量指数\n   https://example.com/aqi/beijing\n   北京今日空气质量优，AQI为35。',
        data: [],
        executionTime: 150,
        toolName: 'search',
        timestamp: Date.now()
      }
    }
  ],
  metadata: {
    tags: ['search', 'information', 'web'],
    icon: '🔍',
    documentationUrl: 'https://docs.example.com/tools/search',
    dependencies: [],
    permissions: []
  }
};

/**
 * 计算器工具
 * 用于执行数学计算
 */
export const calculatorTool: AITool = {
  name: 'calculator',
  description: '执行数学计算，支持基本运算和复杂表达式',
  version: '1.0.0',
  group: 'utilities',
  author: 'YYC³',
  parameters: [
    {
      name: 'expression',
      type: 'string',
      description: '数学表达式',
      required: true,
      validation: {
        minLength: 1,
        maxLength: 200
      }
    },
    {
      name: 'precision',
      type: 'number',
      description: '结果精度（小数位数）',
      required: false,
      default: 4,
      validation: {
        min: 0,
        max: 15
      }
    }
  ],
  async execute(params, context) {
    const startTime = Date.now();
    const { expression, precision = 4 } = params;

    try {
      // 安全的数学表达式计算
      // 实际实现中应该使用更安全的表达式解析库
      const sanitizedExpression = expression
        .replace(/[^0-9+\-*/().\s]/g, '')
        .replace(/\s+/g, '');

      // 使用Function构造函数计算表达式（注意安全风险）
      // 生产环境中应该使用更安全的方式
      const result = Function(`"use strict"; return (${sanitizedExpression});`)();
      const formattedResult = Number(result).toFixed(precision);

      return {
        success: true,
        content: `计算结果:\n\n表达式: ${expression}\n结果: ${formattedResult}`,
        data: { expression, result: Number(result), formattedResult },
        executionTime: Date.now() - startTime,
        toolName: 'calculator',
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        content: '',
        error: `计算失败: ${error instanceof Error ? error.message : String(error)}`,
        executionTime: Date.now() - startTime,
        toolName: 'calculator',
        timestamp: Date.now()
      };
    }
  },
  examples: [
    {
      name: '基本运算',
      description: '执行基本数学运算',
      params: {
        expression: '2 + 3 * 4',
        precision: 2
      },
      result: {
        success: true,
        content: '计算结果:\n\n表达式: 2 + 3 * 4\n结果: 14.00',
        data: { expression: '2 + 3 * 4', result: 14, formattedResult: '14.00' },
        executionTime: 10,
        toolName: 'calculator',
        timestamp: Date.now()
      }
    },
    {
      name: '复杂表达式',
      description: '执行复杂数学表达式',
      params: {
        expression: '(10 + 5) * 2 / 3',
        precision: 3
      },
      result: {
        success: true,
        content: '计算结果:\n\n表达式: (10 + 5) * 2 / 3\n结果: 10.000',
        data: { expression: '(10 + 5) * 2 / 3', result: 10, formattedResult: '10.000' },
        executionTime: 12,
        toolName: 'calculator',
        timestamp: Date.now()
      }
    }
  ],
  metadata: {
    tags: ['calculator', 'math', 'utilities'],
    icon: '🧮',
    documentationUrl: 'https://docs.example.com/tools/calculator',
    dependencies: [],
    permissions: []
  }
};

/**
 * 代码解释器工具
 * 用于执行和解释代码
 */
export const codeInterpreterTool: AITool = {
  name: 'code_interpreter',
  description: '执行和解释代码，支持多种编程语言',
  version: '1.0.0',
  group: 'development',
  author: 'YYC³',
  parameters: [
    {
      name: 'code',
      type: 'string',
      description: '要执行的代码',
      required: true,
      validation: {
        minLength: 1
      }
    },
    {
      name: 'language',
      type: 'string',
      description: '编程语言',
      required: true,
      validation: {
        enum: ['javascript', 'python', 'typescript', 'java', 'csharp']
      }
    },
    {
      name: 'timeout',
      type: 'number',
      description: '执行超时时间（毫秒）',
      required: false,
      default: 5000,
      validation: {
        min: 1000,
        max: 30000
      }
    }
  ],
  async execute(params, context) {
    const startTime = Date.now();
    const { code, language, timeout = 5000 } = params;

    try {
      // 模拟代码执行
      // 实际实现中应该使用安全的代码执行环境
      let output = '';

      if (language === 'javascript' || language === 'typescript') {
        // 简单的JavaScript代码执行
        const safeCode = code.replace(/require|import|eval|Function/g, '');
        output = `JavaScript执行结果:\n\n${safeCode}\n\n输出: "模拟JavaScript执行结果"`;
      } else if (language === 'python') {
        output = `Python执行结果:\n\n${code}\n\n输出: "模拟Python执行结果"`;
      } else {
        output = `${language}执行结果:\n\n${code}\n\n输出: "模拟${language}执行结果"`;
      }

      return {
        success: true,
        content: output,
        data: { language, code, output },
        executionTime: Date.now() - startTime,
        toolName: 'code_interpreter',
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        content: '',
        error: `代码执行失败: ${error instanceof Error ? error.message : String(error)}`,
        executionTime: Date.now() - startTime,
        toolName: 'code_interpreter',
        timestamp: Date.now()
      };
    }
  },
  examples: [
    {
      name: 'JavaScript代码执行',
      description: '执行简单的JavaScript代码',
      params: {
        code: 'console.log("Hello, World!");\nconst sum = 2 + 3;\nsum;',
        language: 'javascript',
        timeout: 2000
      },
      result: {
        success: true,
        content: 'JavaScript执行结果:\n\nconsole.log("Hello, World!");\nconst sum = 2 + 3;\nsum;\n\n输出: Hello, World!\n5',
        data: {
          language: 'javascript',
          code: 'console.log("Hello, World!");\nconst sum = 2 + 3;\nsum;',
          output: 'Hello, World!\n5'
        },
        executionTime: 150,
        toolName: 'code_interpreter',
        timestamp: Date.now()
      }
    }
  ],
  metadata: {
    tags: ['code', 'development', 'execution'],
    icon: '💻',
    documentationUrl: 'https://docs.example.com/tools/code-interpreter',
    dependencies: [],
    permissions: []
  }
};

/**
 * 核心工具集
 */
export const coreTools: AITool[] = [searchTool, calculatorTool, codeInterpreterTool];
