/**
 * @file ai-integration - AI 集成模块（聚合层）
 * @description 统一导出 AI 浮窗相关组件与 Hook，供 App/Layout/AIWidgetDemo 引用
 * @module app/lib/ai-integration
 * @author YYC³
 * @version 1.0.0
 * @created 2026-09-26
 */

import { AIWidgetProvider } from '@/components/ai-floating-widget';
import { IntelligentAIWidget, AIWidgetTrigger } from '@/components/ai-floating-widget/IntelligentAIWidget';
import { useAIWidget } from '@/lib/ai-components';

/**
 * AI 智能助手浮窗包装组件
 * 说明：AIWidgetProvider 内部已渲染 IntelligentAIWidget 与 AIWidgetTrigger，
 * 此处保留为空包装以维持 App 原有结构，避免重复渲染。
 */
export function IntelligentAIWidgetWrapper() {
  return null;
}

export {
  AIWidgetProvider,
  IntelligentAIWidget,
  AIWidgetTrigger,
  useAIWidget,
};

export default {
  AIWidgetProvider,
  IntelligentAIWidget,
  AIWidgetTrigger,
  IntelligentAIWidgetWrapper,
  useAIWidget,
};
