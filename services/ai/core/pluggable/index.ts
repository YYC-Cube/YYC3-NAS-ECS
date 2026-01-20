/**
 * @file 可插拔式拖拽移动AI系统导出
 * @description 导出可插拔式拖拽移动AI系统的所有核心组件
 * @module core/pluggable
 * @author YYC³
 * @version 1.0.0
 * @created 2025-12-30
 */

export * from './types';
export * from './AutonomousAIEngine';
export * from './ModelAdapter';

import { AutonomousAIEngine } from './AutonomousAIEngine';
import { ModelAdapter, OpenAIAdapter, AnthropicAdapter, LocalModelAdapter } from './ModelAdapter';

export const createEngine = (config?: any) => new AutonomousAIEngine(config);

export const createModelAdapter = (type: 'openai' | 'anthropic' | 'local' = 'openai') => {
  switch (type) {
    case 'openai':
      return new OpenAIAdapter();
    case 'anthropic':
      return new AnthropicAdapter();
    case 'local':
      return new LocalModelAdapter();
    default:
      return new ModelAdapter('default-adapter');
  }
};
