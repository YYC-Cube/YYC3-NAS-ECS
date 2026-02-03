/**
 * @file AI Widget类型定义
 * @description 定义业务管理AI系统所需的类型
 * @module industries/business-management/AITypes
 * @author YYC³
 * @version 1.0.0
 */

export interface AIWidgetInstance {
  id: string;
  config: AIWidgetConfig;
  initialize(): Promise<void>;
  sendMessage(message: string): Promise<string>;
  executeTool(toolId: string, params: any): Promise<any>;
  destroy(): void;
}

export interface AIWidgetConfig {
  id?: string;
  title?: string;
  businessContext?: BusinessContext;
  customTools?: AITool[];
  learningConfig?: LearningConfig;
  theme?: 'light' | 'dark' | 'auto';
  enablePersistence?: boolean;
  enableSync?: boolean;
}

export interface BusinessContext {
  industry: string;
  userRole: string;
  availableFeatures: string[];
  decisionSupportLevel: string;
}

export interface LearningConfig {
  enableLearning: boolean;
  learningFocus: string[];
  knowledgeDomains: string[];
}

export interface AITool {
  id: string;
  name: string;
  description: string;
  category: string;
  parameters?: any;
  execute?: (params: any) => any;
}

export interface AIToolConfig {
  name: string;
  description: string;
  category: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
  execute: (params: any) => any;
}

export interface BusinessPerformanceReport {
  kpi: {
    financial: number[];
    operational: number[];
    customer: number[];
    employee: number[];
  };
  trends: {
    increasing: string[];
    decreasing: string[];
    stable: string[];
  };
  recommendations: string[];
  period: string;
}

export interface StrategicInsight {
  marketPosition: string;
  competitiveAdvantage: string[];
  risks: string[];
  opportunities: string[];
  recommendations: string[];
  timeHorizon: string;
}

export interface StrategicContext {
  industry: string;
  companySize: string;
  marketPosition: string;
  targetMarkets: string[];
  coreCompetencies: string[];
  strategicGoals: string[];
}

/**
 * 创建自主AI Widget的工厂函数
 */
export async function createAutonomousAIWidget(config: AIWidgetConfig): Promise<AIWidgetInstance> {
  const instance: AIWidgetInstance = {
    id: config.id || `ai-widget-${Date.now()}`,
    config,
    async initialize(): Promise<void> {
      // 初始化逻辑
      console.log(`AI Widget ${this.id} initialized`);
    },
    async sendMessage(message: string): Promise<string> {
      // 消息处理逻辑
      return `Response to: ${message}`;
    },
    async executeTool(toolId: string, params: any): Promise<any> {
      // 工具执行逻辑
      return { toolId, params, result: 'executed' };
    },
    destroy(): void {
      // 清理逻辑
      console.log(`AI Widget ${this.id} destroyed`);
    }
  };

  await instance.initialize();
  return instance;
}

/**
 * 创建AI工具的工厂函数
 */
export function createAITool(config: AIToolConfig): AITool {
  return {
    id: config.name.toLowerCase().replace(/\s+/g, '_'),
    name: config.name,
    description: config.description,
    category: config.category,
    parameters: config.parameters,
    execute: config.execute
  };
}

/**
 * 创建战略上下文
 */
export function createStrategicContext(config: Partial<StrategicContext> = {}): StrategicContext {
  return {
    industry: config.industry || 'business_management',
    companySize: config.companySize || 'medium',
    marketPosition: config.marketPosition || 'growing',
    targetMarkets: config.targetMarkets || [],
    coreCompetencies: config.coreCompetencies || [],
    strategicGoals: config.strategicGoals || []
  };
}
