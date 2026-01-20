/**
 * @file core/closed-loop/types.ts
 * @description 闭环系统类型定义
 */

export interface ClosedLoopMetrics {
  cycleEfficiency: number;
  improvementImpact: number;
  learningVelocity: number;
  overallEffectiveness: number;
  dataQuality?: number;
  userSatisfaction?: number;
  businessValue?: number;
}
