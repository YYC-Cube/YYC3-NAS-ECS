/**
 * 技术路线图
 * @file core/closed-loop/technical-evolution/TechnologyRoadmap.ts
 * @description 实现技术演进维度的技术路线图规划和管理功能
 */

import type { AutonomousAIConfig } from '../../autonomous-ai-widget/types';

export interface ClosedLoopMetrics {
  cycleEfficiency: any;
  improvementImpact: any;
  learningVelocity: any;
  overallEffectiveness: number;
}

/**
 * 技术里程碑接口
 */
interface TechnologyMilestone {
  id: string;
  name: string;
  description: string;
  domainId: string;
  targetCompletionDate: Date;
  currentStatus: 'planned' | 'in_progress' | 'completed' | 'delayed';
  completionPercentage: number;
  dependencies: string[];
  resourcesRequired: string[];
  businessValue: number;
}

/**
 * 技术路线图阶段
 */
enum RoadmapPhase {
  FOUNDATION = 'foundation',
  ENHANCEMENT = 'enhancement',
  OPTIMIZATION = 'optimization',
  INNOVATION = 'innovation'
}

export class TechnologyRoadmap {
  private config: AutonomousAIConfig;
  private milestones: TechnologyMilestone[] = [];
  private currentPhase: RoadmapPhase;

  constructor(_config: AutonomousAIConfig) {
    this.config = _config;
    this.currentPhase = RoadmapPhase.FOUNDATION;
    this.initializeMilestones();
  }

  /**
   * 初始化技术里程碑
   */
  private initializeMilestones(): void {
    // 初始化技术里程碑
    this.milestones = [
      {
        id: 'milestone-1',
        name: 'AI模型基础架构搭建',
        description: '搭建AI模型训练和推理的基础架构',
        domainId: 'domain-1',
        targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30天后
        currentStatus: 'planned',
        completionPercentage: 0,
        dependencies: [],
        resourcesRequired: ['AI工程师', '云资源'],
        businessValue: 0.8
      },
      {
        id: 'milestone-2',
        name: '核心功能开发',
        description: '开发系统的核心功能模块',
        domainId: 'domain-2',
        targetCompletionDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60天后
        currentStatus: 'planned',
        completionPercentage: 0,
        dependencies: ['milestone-1'],
        resourcesRequired: ['全栈开发工程师', '产品经理'],
        businessValue: 0.9
      },
      {
        id: 'milestone-3',
        name: '数据管理系统构建',
        description: '构建完善的数据管理系统',
        domainId: 'domain-3',
        targetCompletionDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45天后
        currentStatus: 'planned',
        completionPercentage: 0,
        dependencies: ['milestone-1'],
        resourcesRequired: ['数据工程师', '数据库管理员'],
        businessValue: 0.7
      },
      {
        id: 'milestone-4',
        name: '自动化工具开发',
        description: '开发自动化测试和部署工具',
        domainId: 'domain-4',
        targetCompletionDate: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000), // 75天后
        currentStatus: 'planned',
        completionPercentage: 0,
        dependencies: ['milestone-2'],
        resourcesRequired: ['DevOps工程师', '自动化测试工程师'],
        businessValue: 0.6
      }
    ];
  }

  /**
   * 更新技术路线图
   * @param metrics 闭环系统指标数据
   */
  async updateRoadmap(metrics: ClosedLoopMetrics): Promise<void> {
    // 根据最新的指标数据更新技术路线图
    this.milestones = this.milestones.map(milestone => {
      // 更新里程碑的完成百分比
      const completionPercentage = this.calculateCompletionPercentage(milestone, metrics);
      const currentStatus = this.determineMilestoneStatus(milestone, completionPercentage);

      return {
        ...milestone,
        completionPercentage,
        currentStatus
      };
    });

    // 更新当前技术路线图阶段
    this.updateCurrentPhase();

    // 记录技术路线图更新结果
    console.log('TechnologyRoadmap: Roadmap updated:', this.milestones);
    console.log('TechnologyRoadmap: Current phase:', this.currentPhase);
  }

  /**
   * 计算里程碑的完成百分比
   */
  private calculateCompletionPercentage(milestone: TechnologyMilestone, _metrics: ClosedLoopMetrics): number {
    const daysRemaining = (milestone.targetCompletionDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000);
    const totalDays = (milestone.targetCompletionDate.getTime() - Date.now() + 30 * 24 * 60 * 60 * 1000) / (24 * 60 * 60 * 1000);
    const timeProgress = Math.max(0, Math.min(1, 1 - daysRemaining / totalDays));
    
    return Math.round(timeProgress * 100);
  }

  /**
   * 确定里程碑状态
   */
  private determineMilestoneStatus(milestone: TechnologyMilestone, completionPercentage: number): TechnologyMilestone['currentStatus'] {
    if (completionPercentage >= 100) {
      return 'completed';
    } else if (completionPercentage >= 50) {
      return 'in_progress';
    } else if (Date.now() > milestone.targetCompletionDate.getTime()) {
      return 'delayed';
    } else {
      return 'planned';
    }
  }

  /**
   * 更新当前技术路线图阶段
   */
  private updateCurrentPhase(): void {
    // 根据里程碑完成情况更新当前阶段
    const completedMilestones = this.milestones.filter(m => m.currentStatus === 'completed').length;
    const totalMilestones = this.milestones.length;
    const completionRate = completedMilestones / totalMilestones;

    if (completionRate >= 0.75) {
      this.currentPhase = RoadmapPhase.INNOVATION;
    } else if (completionRate >= 0.5) {
      this.currentPhase = RoadmapPhase.OPTIMIZATION;
    } else if (completionRate >= 0.25) {
      this.currentPhase = RoadmapPhase.ENHANCEMENT;
    } else {
      this.currentPhase = RoadmapPhase.FOUNDATION;
    }
  }

  /**
   * 获取技术路线图
   */
  async getRoadmap(): Promise<{
    milestones: TechnologyMilestone[];
    currentPhase: RoadmapPhase;
    completionRate: number;
  }> {
    const completedMilestones = this.milestones.filter(m => m.currentStatus === 'completed').length;
    const totalMilestones = this.milestones.length;
    const completionRate = completedMilestones / totalMilestones;

    return {
      milestones: this.milestones,
      currentPhase: this.currentPhase,
      completionRate
    };
  }

  /**
   * 获取系统状态
   */
  async getStatus(): Promise<{
    currentPhase: RoadmapPhase;
    milestones: TechnologyMilestone[];
    milestoneStatusDistribution: Record<TechnologyMilestone['currentStatus'], number>;
    overallCompletionRate: number;
  }> {
    const completedMilestones = this.milestones.filter(m => m.currentStatus === 'completed').length;
    const totalMilestones = this.milestones.length;
    const overallCompletionRate = completedMilestones / totalMilestones;

    const milestoneStatusDistribution: Record<TechnologyMilestone['currentStatus'], number> = {
      planned: 0,
      in_progress: 0,
      completed: 0,
      delayed: 0
    };

    this.milestones.forEach(milestone => {
      milestoneStatusDistribution[milestone.currentStatus]++;
    });

    return {
      currentPhase: this.currentPhase,
      milestones: this.milestones,
      milestoneStatusDistribution,
      overallCompletionRate
    };
  }
}