/**
 * @file 智能呼叫工作流测试
 * @description 测试智能呼叫工作流的核心功能
 * @module __tests__/unit/workflows/IntelligentCallingWorkflow.test
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IntelligentCallingWorkflow } from '@/workflows/IntelligentCallingWorkflow';

describe('IntelligentCallingWorkflow', () => {
  let workflow: IntelligentCallingWorkflow;

  beforeEach(() => {
    workflow = new IntelligentCallingWorkflow();
  });

  describe('executeEndToEndCalling', () => {
    it('应该成功执行端到端呼叫流程', async () => {
      const customer = { id: 'cust-001', name: '测试客户' };
      const campaign = { id: 'camp-001', name: '测试活动' };

      const result = await workflow.executeEndToEndCalling(customer, campaign);

      expect(result).toBeDefined();
      expect(result.preparation).toBeDefined();
      expect(result.execution).toBeDefined();
      expect(result.postCall).toBeDefined();
      expect(result.optimization).toBeDefined();
      expect(result.businessOutcome).toBeDefined();
    });

    it('应该包含完整的呼叫前准备信息', async () => {
      const customer = { id: 'cust-001', name: '测试客户' };
      const campaign = { id: 'camp-001', name: '测试活动' };

      const result = await workflow.executeEndToEndCalling(customer, campaign);

      expect(result.preparation.customerInsights).toBeDefined();
      expect(result.preparation.strategy).toBeDefined();
      expect(result.preparation.readiness).toBeDefined();
    });

    it('应该包含完整的呼叫中辅助信息', async () => {
      const customer = { id: 'cust-001', name: '测试客户' };
      const campaign = { id: 'camp-001', name: '测试活动' };

      const result = await workflow.executeEndToEndCalling(customer, campaign);

      expect(result.execution.realTimeAI).toBeDefined();
      expect(result.execution.agentAssistance).toBeDefined();
      expect(result.execution.qualityAssurance).toBeDefined();
    });

    it('应该包含呼叫后处理和优化信息', async () => {
      const customer = { id: 'cust-001', name: '测试客户' };
      const campaign = { id: 'camp-001', name: '测试活动' };

      const result = await workflow.executeEndToEndCalling(customer, campaign);

      expect(result.postCall).toBeDefined();
      expect(result.optimization).toBeDefined();
      expect(result.businessOutcome).toBeDefined();
    });
  });

  describe('preCallIntelligence', () => {
    it('应该生成客户洞察', async () => {
      const customer = { id: 'cust-001', name: '测试客户' };
      const campaign = { id: 'camp-001', name: '测试活动' };

      const preparation = await workflow.executeEndToEndCalling(customer, campaign);

      expect(preparation.preparation.customerInsights.profile).toBeDefined();
      expect(preparation.preparation.customerInsights.behavior).toBeDefined();
      expect(preparation.preparation.customerInsights.sentiment).toBeDefined();
      expect(preparation.preparation.customerInsights.value).toBeDefined();
    });

    it('应该生成呼叫策略', async () => {
      const customer = { id: 'cust-001', name: '测试客户' };
      const campaign = { id: 'camp-001', name: '测试活动' };

      const preparation = await workflow.executeEndToEndCalling(customer, campaign);

      expect(preparation.preparation.strategy.optimalTiming).toBeDefined();
      expect(preparation.preparation.strategy.conversationStrategy).toBeDefined();
      expect(preparation.preparation.strategy.objectionHandling).toBeDefined();
      expect(preparation.preparation.strategy.goalAlignment).toBeDefined();
    });

    it('应该验证系统就绪状态', async () => {
      const customer = { id: 'cust-001', name: '测试客户' };
      const campaign = { id: 'camp-001', name: '测试活动' };

      const preparation = await workflow.executeEndToEndCalling(customer, campaign);

      expect(preparation.preparation.readiness.systemCheck).toBeDefined();
      expect(preparation.preparation.readiness.agentPreparation).toBeDefined();
      expect(preparation.preparation.readiness.complianceVerification).toBeDefined();
    });
  });

  describe('duringCallAssistance', () => {
    it('应该提供实时AI辅助', async () => {
      const customer = { id: 'cust-001', name: '测试客户' };
      const campaign = { id: 'camp-001', name: '测试活动' };

      const result = await workflow.executeEndToEndCalling(customer, campaign);

      expect(result.execution.realTimeAI.speechToText).toBeDefined();
      expect(result.execution.realTimeAI.sentimentAnalysis).toBeDefined();
      expect(result.execution.realTimeAI.intentRecognition).toBeDefined();
      expect(result.execution.realTimeAI.nextBestAction).toBeDefined();
    });

    it('应该提供坐席辅助', async () => {
      const customer = { id: 'cust-001', name: '测试客户' };
      const campaign = { id: 'camp-001', name: '测试活动' };

      const result = await workflow.executeEndToEndCalling(customer, campaign);

      expect(result.execution.agentAssistance.scriptGuidance).toBeDefined();
      expect(result.execution.agentAssistance.knowledgeSupport).toBeDefined();
      expect(result.execution.agentAssistance.emotionCoaching).toBeDefined();
    });

    it('应该进行质量保证监控', async () => {
      const customer = { id: 'cust-001', name: '测试客户' };
      const campaign = { id: 'camp-001', name: '测试活动' };

      const result = await workflow.executeEndToEndCalling(customer, campaign);

      expect(result.execution.qualityAssurance.complianceMonitoring).toBeDefined();
      expect(result.execution.qualityAssurance.qualityScoring).toBeDefined();
      expect(result.execution.qualityAssurance.interventionTriggers).toBeDefined();
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的客户ID', async () => {
      const customer = { id: '', name: '' };
      const campaign = { id: 'camp-001', name: '测试活动' };

      await expect(workflow.executeEndToEndCalling(customer, campaign)).rejects.toThrow();
    });

    it('应该处理无效的活动ID', async () => {
      const customer = { id: 'cust-001', name: '测试客户' };
      const campaign = { id: '', name: '' };

      await expect(workflow.executeEndToEndCalling(customer, campaign)).rejects.toThrow();
    });
  });

  describe('业务结果测量', () => {
    it('应该测量业务结果', async () => {
      const customer = { id: 'cust-001', name: '测试客户' };
      const campaign = { id: 'camp-001', name: '测试活动' };

      const result = await workflow.executeEndToEndCalling(customer, campaign);

      expect(result.businessOutcome).toBeDefined();
    });
  });
});
