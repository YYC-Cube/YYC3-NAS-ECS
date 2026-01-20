import { EventEmitter } from 'events';
import { SemanticUnderstandingEngine, SemanticAnalysis } from './SemanticUnderstandingEngine';

export interface DialogueTurn {
  id: string;
  userId: string;
  sessionId: string;
  input: string;
  analysis: SemanticAnalysis;
  response: string;
  timestamp: number;
  context: Record<string, any>;
}

export interface DialogueContext {
  userId: string;
  sessionId: string;
  turns: DialogueTurn[];
  currentIntent: string;
  slots: Record<string, any>;
  state: 'active' | 'completed' | 'abandoned';
  startTime: number;
  lastActivity: number;
  metadata: Record<string, any>;
}

export interface DialogueResponse {
  text: string;
  actions: DialogueAction[];
  followUpQuestions?: string[];
  confidence: number;
  requiresConfirmation?: boolean;
}

export interface DialogueAction {
  type: 'query' | 'update' | 'create' | 'delete' | 'notify' | 'custom';
  target: string;
  parameters: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
}

export class DialogueManager extends EventEmitter {
  private semanticEngine: SemanticUnderstandingEngine;
  private contexts: Map<string, DialogueContext> = new Map();
  private responseTemplates: Map<string, string[]> = new Map();
  private dialogueFlows: Map<string, DialogueFlow> = new Map();
  private readonly CONTEXT_TIMEOUT = 1800000; // 30 minutes
  private readonly MAX_TURNS_PER_SESSION = 20;

  constructor(semanticEngine: SemanticUnderstandingEngine) {
    super();
    this.semanticEngine = semanticEngine;
    this.initializeResponseTemplates();
    this.initializeDialogueFlows();
    this.startContextCleanup();
  }

  private initializeResponseTemplates(): void {
    this.responseTemplates.set('greeting', [
      '您好！有什么可以帮助您的吗？',
      '您好！请问有什么可以为您服务的？',
      '您好！很高兴为您服务，请问有什么需求？'
    ]);

    this.responseTemplates.set('query', [
      '好的，我来帮您查询相关信息。',
      '没问题，让我为您查询一下。',
      '收到，正在为您查询...'
    ]);

    this.responseTemplates.set('request', [
      '好的，我来帮您处理这个请求。',
      '收到，正在为您处理...',
      '好的，让我来帮您完成这个操作。'
    ]);

    this.responseTemplates.set('complaint', [
      '非常抱歉给您带来不便，我们立即处理这个问题。',
      '感谢您的反馈，我们会尽快解决这个问题。',
      '很抱歉听到这个消息，我们会立即跟进处理。'
    ]);

    this.responseTemplates.set('feedback', [
      '感谢您的反馈，我们会认真考虑您的建议。',
      '谢谢您的评价，我们会持续改进。',
      '感谢您的宝贵意见！'
    ]);

    this.responseTemplates.set('support', [
      '好的，我来帮您解决这个问题。',
      '别担心，让我来帮您分析一下。',
      '收到，我们一起来解决这个问题。'
    ]);

    this.responseTemplates.set('unknown', [
      '抱歉，我没有完全理解您的意思，能否请您再详细说明一下？',
      '不好意思，我不太明白您的需求，能否提供更多信息？',
      '抱歉，我需要更多信息才能帮助您，请您详细描述一下。'
    ]);

    this.responseTemplates.set('confirmation', [
      '请确认是否继续执行此操作？',
      '您确定要执行此操作吗？',
      '请确认是否继续？'
    ]);

    this.responseTemplates.set('success', [
      '操作已成功完成！',
      '处理完成，感谢您的使用！',
      '操作成功！'
    ]);

    this.responseTemplates.set('error', [
      '抱歉，操作过程中出现了错误，请稍后再试。',
      '处理失败，请检查您的输入后重试。',
      '抱歉，系统出现错误，请联系客服。'
    ]);
  }

  private initializeDialogueFlows(): void {
    this.dialogueFlows.set('query_flow', {
      name: 'query_flow',
      steps: [
        {
          step: 1,
          intent: 'query',
          requiredSlots: ['query_type', 'subject'],
          prompts: ['请问您想查询什么？', '请提供查询的具体信息。']
        },
        {
          step: 2,
          intent: 'query',
          requiredSlots: ['time_range'],
          prompts: ['请问您想查询哪个时间段的数据？']
        }
      ],
      completionActions: [
        {
          type: 'query',
          target: 'database',
          parameters: {},
          priority: 'medium'
        }
      ]
    });

    this.dialogueFlows.set('request_flow', {
      name: 'request_flow',
      steps: [
        {
          step: 1,
          intent: 'request',
          requiredSlots: ['action', 'target'],
          prompts: ['请问您想执行什么操作？', '请提供操作的具体信息。']
        },
        {
          step: 2,
          intent: 'request',
          requiredSlots: ['parameters'],
          prompts: ['请提供必要的参数信息。']
        }
      ],
      completionActions: [
        {
          type: 'update',
          target: 'system',
          parameters: {},
          priority: 'high'
        }
      ]
    });

    this.dialogueFlows.set('complaint_flow', {
      name: 'complaint_flow',
      steps: [
        {
          step: 1,
          intent: 'complaint',
          requiredSlots: ['issue'],
          prompts: ['请问您遇到了什么问题？', '请详细描述您遇到的问题。']
        },
        {
          step: 2,
          intent: 'complaint',
          requiredSlots: ['severity', 'urgency'],
          prompts: ['请问问题的严重程度如何？是否紧急？']
        }
      ],
      completionActions: [
        {
          type: 'notify',
          target: 'support_team',
          parameters: {},
          priority: 'high'
        }
      ]
    });
  }

  async processDialogue(
    userId: string,
    sessionId: string,
    input: string,
    context?: Record<string, any>
  ): Promise<DialogueResponse> {
    const startTime = Date.now();

    try {
      const analysis = await this.semanticEngine.analyze({
        text: input,
        context,
        userId,
        sessionId
      });

      const dialogueContext = this.getOrCreateContext(userId, sessionId, context);
      
      const response = await this.generateResponse(analysis, dialogueContext);
      
      const turn: DialogueTurn = {
        id: `turn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId,
        sessionId,
        input,
        analysis,
        response: response.text,
        timestamp: Date.now(),
        context: dialogueContext.slots
      };

      dialogueContext.turns.push(turn);
      dialogueContext.lastActivity = Date.now();
      dialogueContext.currentIntent = analysis.intent;

      this.emit('dialogue_processed', {
        userId,
        sessionId,
        turn,
        response,
        processingTime: Date.now() - startTime
      });

      return response;
    } catch (error) {
      this.emit('dialogue_error', { userId, sessionId, input, error });
      throw error;
    }
  }

  private getOrCreateContext(
    userId: string,
    sessionId: string,
    context?: Record<string, any>
  ): DialogueContext {
    const contextKey = `${userId}:${sessionId}`;
    let dialogueContext = this.contexts.get(contextKey);

    if (!dialogueContext) {
      dialogueContext = {
        userId,
        sessionId,
        turns: [],
        currentIntent: '',
        slots: context || {},
        state: 'active',
        startTime: Date.now(),
        lastActivity: Date.now(),
        metadata: {}
      };
      this.contexts.set(contextKey, dialogueContext);
      this.emit('context_created', dialogueContext);
    }

    return dialogueContext;
  }

  private async generateResponse(
    analysis: SemanticAnalysis,
    context: DialogueContext
  ): Promise<DialogueResponse> {
    const intent = analysis.intent;
    const templates = this.responseTemplates.get(intent) || this.responseTemplates.get('unknown')!;
    
    const responseText = templates[Math.floor(Math.random() * templates.length)];
    
    const response: DialogueResponse = {
      text: responseText,
      actions: this.generateActions(analysis, context),
      followUpQuestions: this.generateFollowUpQuestions(analysis, context),
      confidence: analysis.confidence,
      requiresConfirmation: this.requiresConfirmation(intent, analysis.urgency)
    };

    return response;
  }

  private generateActions(analysis: SemanticAnalysis, context: DialogueContext): DialogueAction[] {
    const actions: DialogueAction[] = [];

    if (analysis.intent === 'query') {
      actions.push({
        type: 'query',
        target: analysis.entities.find(e => e.type === 'product')?.text || 'system',
        parameters: {
          query_type: analysis.keywords.join(' '),
          time_range: analysis.entities.find(e => e.type === 'time')?.text || 'all'
        },
        priority: analysis.urgency === 'high' ? 'high' : 'medium'
      });
    } else if (analysis.intent === 'request') {
      actions.push({
        type: 'update',
        target: analysis.entities.find(e => e.type === 'product')?.text || 'system',
        parameters: {
          action: analysis.keywords.find(k => ['创建', '删除', '更新', '修改'].includes(k)) || 'update',
          details: analysis.keywords
        },
        priority: analysis.urgency === 'high' ? 'high' : 'medium'
      });
    } else if (analysis.intent === 'complaint') {
      actions.push({
        type: 'notify',
        target: 'support_team',
        parameters: {
          issue: analysis.keywords.join(' '),
          severity: analysis.urgency,
          sentiment: analysis.sentiment
        },
        priority: 'high'
      });
    }

    return actions;
  }

  private generateFollowUpQuestions(
    analysis: SemanticAnalysis,
    context: DialogueContext
  ): string[] | undefined {
    const flow = this.dialogueFlows.get(`${analysis.intent}_flow`);
    if (!flow) {
      return undefined;
    }

    const currentStep = context.turns.length + 1;
    const stepConfig = flow.steps.find(s => s.step === currentStep);

    if (!stepConfig) {
      return undefined;
    }

    const missingSlots = stepConfig.requiredSlots.filter(
      slot => !context.slots[slot]
    );

    if (missingSlots.length === 0) {
      return undefined;
    }

    return stepConfig.prompts;
  }

  private requiresConfirmation(intent: string, urgency: string): boolean {
    const confirmationRequired = ['request', 'delete'];
    return confirmationRequired.includes(intent) || urgency === 'high';
  }

  async confirmAction(userId: string, sessionId: string): Promise<DialogueResponse> {
    const contextKey = `${userId}:${sessionId}`;
    const context = this.contexts.get(contextKey);

    if (!context) {
      throw new Error('Dialogue context not found');
    }

    const successTemplates = this.responseTemplates.get('success')!;
    const responseText = successTemplates[Math.floor(Math.random() * successTemplates.length)];

    context.state = 'completed';
    this.emit('dialogue_completed', context);

    return {
      text: responseText,
      actions: [],
      confidence: 1.0
    };
  }

  async cancelDialogue(userId: string, sessionId: string): Promise<void> {
    const contextKey = `${userId}:${sessionId}`;
    const context = this.contexts.get(contextKey);

    if (context) {
      context.state = 'abandoned';
      this.emit('dialogue_cancelled', context);
    }
  }

  getContext(userId: string, sessionId: string): DialogueContext | undefined {
    const contextKey = `${userId}:${sessionId}`;
    return this.contexts.get(contextKey);
  }

  getAllContexts(userId?: string): DialogueContext[] {
    let contexts = Array.from(this.contexts.values());

    if (userId) {
      contexts = contexts.filter(c => c.userId === userId);
    }

    return contexts.sort((a, b) => b.lastActivity - a.lastActivity);
  }

  async clearContext(userId: string, sessionId: string): Promise<void> {
    const contextKey = `${userId}:${sessionId}`;
    const context = this.contexts.get(contextKey);

    if (context) {
      this.contexts.delete(contextKey);
      this.emit('context_cleared', context);
    }
  }

  async addResponseTemplate(intent: string, templates: string[]): Promise<void> {
    this.responseTemplates.set(intent, templates);
    this.emit('template_added', { intent, templates });
  }

  async addDialogueFlow(flow: DialogueFlow): Promise<void> {
    this.dialogueFlows.set(flow.name, flow);
    this.emit('flow_added', flow);
  }

  private startContextCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const expiredContexts: string[] = [];

      for (const [key, context] of this.contexts.entries()) {
        if (now - context.lastActivity > this.CONTEXT_TIMEOUT) {
          expiredContexts.push(key);
        }
      }

      for (const key of expiredContexts) {
        const context = this.contexts.get(key);
        if (context) {
          this.contexts.delete(key);
          this.emit('context_expired', context);
        }
      }
    }, 60000); // Check every minute
  }

  getDialogueStatistics(): {
    totalContexts: number;
    activeContexts: number;
    completedContexts: number;
    abandonedContexts: number;
    totalTurns: number;
    averageTurnsPerSession: number;
  } {
    const contexts = Array.from(this.contexts.values());

    return {
      totalContexts: contexts.length,
      activeContexts: contexts.filter(c => c.state === 'active').length,
      completedContexts: contexts.filter(c => c.state === 'completed').length,
      abandonedContexts: contexts.filter(c => c.state === 'abandoned').length,
      totalTurns: contexts.reduce((sum, c) => sum + c.turns.length, 0),
      averageTurnsPerSession: contexts.length > 0
        ? contexts.reduce((sum, c) => sum + c.turns.length, 0) / contexts.length
        : 0
    };
  }
}

export interface DialogueFlow {
  name: string;
  steps: DialogueFlowStep[];
  completionActions: DialogueAction[];
}

export interface DialogueFlowStep {
  step: number;
  intent: string;
  requiredSlots: string[];
  prompts: string[];
}
