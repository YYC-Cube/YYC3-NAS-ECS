/**
 * @file core/closed-loop/business-value/ROICalculator.ts
 * @description ROI计算器 - 计算投资回报率
 */

import type { AutonomousAIConfig } from '../../autonomous-ai-widget/types';

export class ROIcalculator {
  private config: AutonomousAIConfig;

  constructor(config: AutonomousAIConfig) {
    this.config = config;
  }

  /**
   * 计算ROI
   * @param businessValue 业务价值数据
   */
  async calculateROI(businessValue: any): Promise<any> {
    const investment = this.config.initialInvestment || 100000;
    const returns = businessValue.totalBusinessValue * investment;
    const roi = ((returns - investment) / investment) * 100;

    return {
      investment,
      returns,
      roi,
      paybackPeriod: await this.calculatePaybackPeriod(returns, investment),
      insights: await this.generateROIInsights(roi, businessValue)
    };
  }

  /**
   * 计算投资回收期
   */
  private async calculatePaybackPeriod(returns: number, investment: number): Promise<number> {
    const monthlyReturns = returns / 12;
    return investment / monthlyReturns;
  }

  /**
   * 生成ROI洞察
   */
  private async generateROIInsights(roi: number, businessValue: any): Promise<string[]> {
    const insights: string[] = [];

    if (roi > 100) {
      insights.push('投资回报率超过100%，项目非常成功');
    } else if (roi > 50) {
      insights.push('投资回报率良好，项目表现优秀');
    } else if (roi > 0) {
      insights.push('投资回报率为正，项目有盈利');
    } else {
      insights.push('投资回报率为负，需要优化项目');
    }

    if (businessValue.customerSatisfaction > 0.8) {
      insights.push('客户满意度高，有助于长期收益');
    }

    return insights;
  }
}
