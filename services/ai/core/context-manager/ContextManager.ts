/**
 * @file 上下文管理器
 * @description 管理系统上下文信息
 * @module context-manager
 * @author YYC³
 * @version 1.0.0
 * @created 2025-12-30
 */

export interface ContextData {
  timestamp: Date;
  user?: string;
  pageContext?: any;
  conversationHistory?: any[];
  userPreferences?: any;
  businessContext?: any;
}

export class ContextManager {
  private context: ContextData;

  constructor() {
    this.context = {
      timestamp: new Date(),
    };
  }

  async getPageContext(): Promise<any> {
    return {
      url: window?.location?.href || 'unknown',
      title: document?.title || 'unknown',
      timestamp: new Date(),
    };
  }

  updateContext(updates: Partial<ContextData>): void {
    this.context = {
      ...this.context,
      ...updates,
      timestamp: new Date(),
    };
  }

  getContext(): ContextData {
    return this.context;
  }

  getMetrics(): any {
    return {
      contextSize: Object.keys(this.context).length,
      lastUpdated: this.context.timestamp,
    };
  }
}
