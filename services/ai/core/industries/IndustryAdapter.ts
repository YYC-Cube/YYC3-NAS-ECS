import { NotFoundError, ValidationError } from '../error-handler/ErrorTypes';

export class IndustryAdapter {
  private industryConfigs: Map<string, IndustryConfiguration> = new Map();

  constructor() {
    this.initializeIndustryConfigs();
  }

  private initializeIndustryConfigs(): void {
    // 经 - 经营管理
    this.industryConfigs.set('business_management', {
      id: 'business_management',
      name: '经营管理',
      description: '企业战略、运营、财务、人力资源等管理场景',
      personas: ['ceo', 'cfo', 'coo', 'hr_director', 'project_manager'],
      capabilities: ['strategic_planning', 'financial_analysis', 'kpi_tracking', 'resource_optimization'],
      tools: this.getManagementTools(),
      dataSources: this.getManagementDataSources(),
      successMetrics: this.getManagementMetrics()
    });

    // 管 - 运维分析
    this.industryConfigs.set('operations_analysis', {
      id: 'operations_analysis',
      name: '运维分析',
      description: '系统监控、性能分析、故障预测、容量规划',
      personas: ['devops_engineer', 'system_analyst', 'it_manager', 'security_analyst'],
      capabilities: ['monitoring', 'performance_analysis', 'anomaly_detection', 'capacity_planning'],
      tools: this.getOperationsTools(),
      dataSources: this.getOperationsDataSources(),
      successMetrics: this.getOperationsMetrics()
    });
  }

  async createIndustryAI(industry: string, userPersona: string): Promise<AIWidgetInstance> {
    const config = this.industryConfigs.get(industry);
    if (!config) {
      throw new NotFoundError('industry', industry, {
        additionalData: { availableIndustries: Array.from(this.industryConfigs.keys()) }
      });
    }

    const personaConfig = await this.getPersonaConfiguration(userPersona, config);

    return createAutonomousAIWidget({
      apiType: 'internal',
      modelName: 'yyc3-industry-specialized',
      enableLearning: true,
      enableMemory: true,
      businessContext: {
        industry: config.id,
        userRole: userPersona,
        domainKnowledge: config.capabilities,
        operationalConstraints: await this.getOperationalConstraints(industry)
      },
      customTools: config.tools,
      dataSources: config.dataSources,
      uiConfig: await this.getIndustryUIConfig(industry, userPersona)
    });
  }
}
