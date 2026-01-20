import { EventEmitter } from 'events';
import { SemanticUnderstandingEngine, SemanticAnalysis } from './semantic-understanding/SemanticUnderstandingEngine';
import { DialogueManager, DialogueResponse } from './dialogue/DialogueManager';

export interface NLPSConfig {
  enableSemanticAnalysis?: boolean;
  enableDialogueManagement?: boolean;
  defaultLanguage?: string;
  confidenceThreshold?: number;
  maxDialogueTurns?: number;
}

export class NLPSystem extends EventEmitter {
  private semanticEngine: SemanticUnderstandingEngine;
  private dialogueManager: DialogueManager;
  private config: NLPSConfig;
  private isRunning: boolean = false;

  constructor(config: NLPSConfig = {}) {
    super();
    this.config = {
      enableSemanticAnalysis: true,
      enableDialogueManagement: true,
      defaultLanguage: 'zh',
      confidenceThreshold: 0.6,
      maxDialogueTurns: 20,
      ...config
    };

    this.semanticEngine = new SemanticUnderstandingEngine();
    this.dialogueManager = new DialogueManager(this.semanticEngine);

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.semanticEngine.on('analysis_completed', (data) => {
      this.emit('semantic_analysis_completed', data);
    });

    this.semanticEngine.on('analysis_error', (data) => {
      this.emit('semantic_analysis_error', data);
    });

    this.dialogueManager.on('dialogue_processed', (data) => {
      this.emit('dialogue_processed', data);
    });

    this.dialogueManager.on('dialogue_completed', (data) => {
      this.emit('dialogue_completed', data);
    });

    this.dialogueManager.on('dialogue_error', (data) => {
      this.emit('dialogue_error', data);
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    this.emit('system_started', { timestamp: Date.now() });
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;
    this.emit('system_stopped', { timestamp: Date.now() });
  }

  async analyzeText(text: string, options?: {
    language?: string;
    context?: Record<string, any>;
    userId?: string;
    sessionId?: string;
  }): Promise<SemanticAnalysis> {
    if (!this.config.enableSemanticAnalysis) {
      throw new Error('Semantic analysis is disabled');
    }

    return await this.semanticEngine.analyze({
      text,
      language: options?.language || this.config.defaultLanguage,
      context: options?.context,
      userId: options?.userId,
      sessionId: options?.sessionId
    });
  }

  async processDialogue(
    userId: string,
    sessionId: string,
    input: string,
    context?: Record<string, any>
  ): Promise<DialogueResponse> {
    if (!this.config.enableDialogueManagement) {
      throw new Error('Dialogue management is disabled');
    }

    return await this.dialogueManager.processDialogue(userId, sessionId, input, context);
  }

  async confirmDialogueAction(userId: string, sessionId: string): Promise<DialogueResponse> {
    return await this.dialogueManager.confirmAction(userId, sessionId);
  }

  async cancelDialogue(userId: string, sessionId: string): Promise<void> {
    await this.dialogueManager.cancelDialogue(userId, sessionId);
  }

  getDialogueContext(userId: string, sessionId: string): any {
    return this.dialogueManager.getContext(userId, sessionId);
  }

  getAllDialogueContexts(userId?: string): any[] {
    return this.dialogueManager.getAllContexts(userId);
  }

  async clearDialogueContext(userId: string, sessionId: string): Promise<void> {
    await this.dialogueManager.clearContext(userId, sessionId);
  }

  getSemanticModel(modelName: string): any {
    return this.semanticEngine.getModel(modelName);
  }

  getSemanticModels(): any[] {
    return this.semanticEngine.getModels();
  }

  getIntent(intentName: string): any {
    return this.semanticEngine.getIntent(intentName);
  }

  getIntents(): any[] {
    return this.semanticEngine.getIntents();
  }

  async addCustomIntent(intent: any): Promise<void> {
    await this.semanticEngine.addCustomIntent(intent);
  }

  async removeIntent(intentName: string): Promise<void> {
    await this.semanticEngine.removeIntent(intentName);
  }

  async addEntityType(type: string, patterns: string[]): Promise<void> {
    await this.semanticEngine.addEntityType(type, patterns);
  }

  async addSentimentWord(word: string, score: number): Promise<void> {
    await this.semanticEngine.addSentimentWord(word, score);
  }

  async addResponseTemplate(intent: string, templates: string[]): Promise<void> {
    await this.dialogueManager.addResponseTemplate(intent, templates);
  }

  async addDialogueFlow(flow: any): Promise<void> {
    await this.dialogueManager.addDialogueFlow(flow);
  }

  getSystemStatus(): {
    isRunning: boolean;
    config: NLPSConfig;
    semanticModels: number;
    intents: number;
    dialogueContexts: number;
    dialogueStatistics: any;
  } {
    return {
      isRunning: this.isRunning,
      config: this.config,
      semanticModels: this.semanticEngine.getModels().length,
      intents: this.semanticEngine.getIntents().length,
      dialogueContexts: this.dialogueManager.getAllContexts().length,
      dialogueStatistics: this.dialogueManager.getDialogueStatistics()
    };
  }

  getSemanticEngine(): SemanticUnderstandingEngine {
    return this.semanticEngine;
  }

  getDialogueManager(): DialogueManager {
    return this.dialogueManager;
  }
}
