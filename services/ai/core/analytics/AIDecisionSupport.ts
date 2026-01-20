// analytics/AIDecisionSupport.ts
import {
  IntelligentRecommendations,
  ScenarioAnalysis,
  RecommendationEngine,
  ScenarioSimulator2
} from './types';

export class AIDecisionSupport {
  private recommendationEngine: RecommendationEngine;
  private scenarioSimulator: ScenarioSimulator2;

  constructor() {
    this.recommendationEngine = new RecommendationEngine();
    this.scenarioSimulator = new ScenarioSimulator2();
  }

  async provideIntelligentRecommendations(): Promise<IntelligentRecommendations> {
    const recommendations = await this.recommendationEngine.generate({});

    return {
      recommendations: recommendations.recommendations,
      confidence: recommendations.confidence,
      reasoning: recommendations.reasoning,
      alternatives: recommendations.alternatives
    };
  }

  async simulateBusinessScenarios(): Promise<ScenarioAnalysis[]> {
    return await this.scenarioSimulator.simulate({});
  }
}