import { EventEmitter } from 'events';

export interface TextInput {
  text: string;
  language?: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

export interface SemanticAnalysis {
  text: string;
  language: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  intent: string;
  entities: Entity[];
  keywords: string[];
  topics: string[];
  emotion?: string;
  urgency?: 'low' | 'medium' | 'high';
}

export interface Entity {
  text: string;
  type: string;
  confidence: number;
  start: number;
  end: number;
}

export interface Intent {
  name: string;
  confidence: number;
  slots: Record<string, any>;
}

export interface SemanticModel {
  name: string;
  type: 'sentiment' | 'intent' | 'entity' | 'topic' | 'custom';
  accuracy: number;
  lastTrained: number;
  language: string;
}

export class SemanticUnderstandingEngine extends EventEmitter {
  private models: Map<string, SemanticModel> = new Map();
  private intents: Map<string, Intent> = new Map();
  private entityTypes: Map<string, string[]> = new Map();
  private sentimentLexicon: Map<string, number> = new Map();
  private readonly CONFIDENCE_THRESHOLD = 0.6;

  constructor() {
    super();
    this.initializeModels();
    this.initializeIntents();
    this.initializeEntityTypes();
    this.initializeSentimentLexicon();
  }

  private initializeModels(): void {
    this.models.set('sentiment_zh', {
      name: 'sentiment_zh',
      type: 'sentiment',
      accuracy: 0.85,
      lastTrained: Date.now(),
      language: 'zh'
    });

    this.models.set('sentiment_en', {
      name: 'sentiment_en',
      type: 'sentiment',
      accuracy: 0.87,
      lastTrained: Date.now(),
      language: 'en'
    });

    this.models.set('intent_zh', {
      name: 'intent_zh',
      type: 'intent',
      accuracy: 0.82,
      lastTrained: Date.now(),
      language: 'zh'
    });

    this.models.set('entity_zh', {
      name: 'entity_zh',
      type: 'entity',
      accuracy: 0.88,
      lastTrained: Date.now(),
      language: 'zh'
    });

    this.models.set('topic_zh', {
      name: 'topic_zh',
      type: 'topic',
      accuracy: 0.80,
      lastTrained: Date.now(),
      language: 'zh'
    });
  }

  private initializeIntents(): void {
    this.intents.set('greeting', {
      name: 'greeting',
      confidence: 0.9,
      slots: {}
    });

    this.intents.set('query', {
      name: 'query',
      confidence: 0.85,
      slots: {
        query_type: '',
        subject: '',
        time_range: ''
      }
    });

    this.intents.set('request', {
      name: 'request',
      confidence: 0.88,
      slots: {
        action: '',
        target: '',
        parameters: {}
      }
    });

    this.intents.set('complaint', {
      name: 'complaint',
      confidence: 0.86,
      slots: {
        issue: '',
        severity: '',
        urgency: ''
      }
    });

    this.intents.set('feedback', {
      name: 'feedback',
      confidence: 0.84,
      slots: {
        rating: '',
        category: '',
        details: ''
      }
    });

    this.intents.set('support', {
      name: 'support',
      confidence: 0.87,
      slots: {
        problem: '',
        context: '',
        priority: ''
      }
    });
  }

  private initializeEntityTypes(): void {
    this.entityTypes.set('person', ['用户', '客户', '管理员', '开发者']);
    this.entityTypes.set('organization', ['公司', '部门', '团队', '机构']);
    this.entityTypes.set('location', ['北京', '上海', '广州', '深圳']);
    this.entityTypes.set('time', ['今天', '明天', '昨天', '本周', '本月', '今年']);
    this.entityTypes.set('number', ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十']);
    this.entityTypes.set('product', ['产品', '服务', '系统', '应用', '平台']);
    this.entityTypes.set('action', ['查询', '创建', '删除', '更新', '修改', '添加']);
  }

  private initializeSentimentLexicon(): void {
    const positiveWords = ['好', '优秀', '满意', '喜欢', '棒', '赞', '感谢', '不错', '完美', '出色'];
    const negativeWords = ['差', '糟糕', '不满', '讨厌', '差劲', '失望', '糟糕', '错误', '失败', '问题'];

    positiveWords.forEach(word => this.sentimentLexicon.set(word, 1));
    negativeWords.forEach(word => this.sentimentLexicon.set(word, -1));
  }

  async analyze(input: TextInput): Promise<SemanticAnalysis> {
    const startTime = Date.now();

    try {
      const language = this.detectLanguage(input.text);
      
      const [sentiment, intent, entities, keywords, topics] = await Promise.all([
        this.analyzeSentiment(input.text, language),
        this.analyzeIntent(input.text, language),
        this.extractEntities(input.text, language),
        this.extractKeywords(input.text, language),
        this.extractTopics(input.text, language)
      ]);

      const analysis: SemanticAnalysis = {
        text: input.text,
        language,
        sentiment: sentiment.sentiment,
        confidence: sentiment.confidence,
        intent: intent.name,
        entities,
        keywords,
        topics,
        emotion: this.detectEmotion(input.text, sentiment.sentiment),
        urgency: this.detectUrgency(input.text, intent.name, sentiment.sentiment)
      };

      this.emit('analysis_completed', {
        input,
        analysis,
        processingTime: Date.now() - startTime
      });

      return analysis;
    } catch (error) {
      this.emit('analysis_error', { input, error });
      throw error;
    }
  }

  private detectLanguage(text: string): string {
    const chinesePattern = /[\u4e00-\u9fa5]/;
    const englishPattern = /[a-zA-Z]/;

    const chineseCount = (text.match(chinesePattern) || []).length;
    const englishCount = (text.match(englishPattern) || []).length;

    if (chineseCount > englishCount) {
      return 'zh';
    } else if (englishCount > chineseCount) {
      return 'en';
    } else {
      return 'zh';
    }
  }

  private async analyzeSentiment(text: string, language: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
  }> {
    let score = 0;
    let matchCount = 0;

    for (const [word, value] of this.sentimentLexicon.entries()) {
      if (text.includes(word)) {
        score += value;
        matchCount++;
      }
    }

    if (matchCount === 0) {
      return { sentiment: 'neutral', confidence: 0.5 };
    }

    const avgScore = score / matchCount;
    const confidence = Math.min(1, 0.5 + Math.abs(avgScore) * 0.5);

    if (avgScore > 0.2) {
      return { sentiment: 'positive', confidence };
    } else if (avgScore < -0.2) {
      return { sentiment: 'negative', confidence };
    } else {
      return { sentiment: 'neutral', confidence };
    }
  }

  private async analyzeIntent(text: string, language: string): Promise<Intent> {
    const intentScores: Map<string, number> = new Map();

    for (const [intentName, intent] of this.intents.entries()) {
      const score = this.calculateIntentScore(text, intentName);
      intentScores.set(intentName, score);
    }

    const sortedIntents = Array.from(intentScores.entries())
      .sort((a, b) => b[1] - a[1]);

    const [bestIntent, confidence] = sortedIntents[0];

    return {
      name: bestIntent,
      confidence,
      slots: this.extractSlots(text, bestIntent)
    };
  }

  private calculateIntentScore(text: string, intentName: string): number {
    const intentPatterns: Record<string, string[]> = {
      greeting: ['你好', '您好', '早上好', '晚上好', 'hello', 'hi'],
      query: ['查询', '搜索', '找', '问', 'query', 'search', 'find'],
      request: ['请', '帮我', '能否', '可以', 'please', 'help', 'can'],
      complaint: ['投诉', '不满', '问题', '错误', 'complaint', 'issue', 'error'],
      feedback: ['反馈', '评价', '建议', '意见', 'feedback', 'review', 'suggestion'],
      support: ['帮助', '支持', '协助', 'support', 'help', 'assist']
    };

    const patterns = intentPatterns[intentName] || [];
    let score = 0;

    for (const pattern of patterns) {
      if (text.includes(pattern)) {
        score += 0.3;
      }
    }

    return Math.min(1, score);
  }

  private extractSlots(text: string, intentName: string): Record<string, any> {
    const slots: Record<string, any> = {};

    if (intentName === 'query') {
      slots.query_type = this.extractQueryType(text);
      slots.subject = this.extractSubject(text);
      slots.time_range = this.extractTimeRange(text);
    } else if (intentName === 'request') {
      slots.action = this.extractAction(text);
      slots.target = this.extractTarget(text);
      slots.parameters = this.extractParameters(text);
    } else if (intentName === 'complaint') {
      slots.issue = this.extractIssue(text);
      slots.severity = this.extractSeverity(text);
      slots.urgency = this.extractUrgency(text);
    }

    return slots;
  }

  private extractQueryType(text: string): string {
    if (text.includes('用户')) return 'user';
    if (text.includes('订单')) return 'order';
    if (text.includes('产品')) return 'product';
    if (text.includes('系统')) return 'system';
    return 'general';
  }

  private extractSubject(text: string): string {
    const subjects = ['用户', '订单', '产品', '服务', '系统', '数据'];
    for (const subject of subjects) {
      if (text.includes(subject)) {
        return subject;
      }
    }
    return '';
  }

  private extractTimeRange(text: string): string {
    if (text.includes('今天')) return 'today';
    if (text.includes('本周')) return 'week';
    if (text.includes('本月')) return 'month';
    if (text.includes('今年')) return 'year';
    return 'all';
  }

  private extractAction(text: string): string {
    const actions = ['创建', '删除', '更新', '修改', '添加', '查询'];
    for (const action of actions) {
      if (text.includes(action)) {
        return action;
      }
    }
    return '';
  }

  private extractTarget(text: string): string {
    return this.extractSubject(text);
  }

  private extractParameters(text: string): Record<string, any> {
    const params: Record<string, any> = {};
    const numberMatch = text.match(/\d+/);
    if (numberMatch) {
      params.number = parseInt(numberMatch[0]);
    }
    return params;
  }

  private extractIssue(text: string): string {
    const issues = ['性能', '安全', '功能', '界面', '数据'];
    for (const issue of issues) {
      if (text.includes(issue)) {
        return issue;
      }
    }
    return '';
  }

  private extractSeverity(text: string): string {
    if (text.includes('严重') || text.includes('紧急')) return 'high';
    if (text.includes('一般') || text.includes('普通')) return 'medium';
    return 'low';
  }

  private extractUrgency(text: string): string {
    return this.extractSeverity(text);
  }

  private async extractEntities(text: string, language: string): Promise<Entity[]> {
    const entities: Entity[] = [];

    for (const [entityType, patterns] of this.entityTypes.entries()) {
      for (const pattern of patterns) {
        const index = text.indexOf(pattern);
        if (index !== -1) {
          entities.push({
            text: pattern,
            type: entityType,
            confidence: 0.8,
            start: index,
            end: index + pattern.length
          });
        }
      }
    }

    return entities;
  }

  private async extractKeywords(text: string, language: string): Promise<string[]> {
    const stopWords = ['的', '了', '是', '在', '和', '有', '我', '你', '他', '她', 'the', 'a', 'an', 'is', 'are', 'was', 'were'];
    const words = text.split(/[\s,，。.!?！?]+/);
    
    const keywords = words
      .filter(word => word.length > 1 && !stopWords.includes(word))
      .slice(0, 10);

    return keywords;
  }

  private async extractTopics(text: string, language: string): Promise<string[]> {
    const topicKeywords: Record<string, string[]> = {
      '技术': ['技术', '开发', '编程', '代码', '系统'],
      '产品': ['产品', '功能', '特性', '需求'],
      '服务': ['服务', '支持', '帮助', '客户'],
      '性能': ['性能', '速度', '响应', '延迟'],
      '安全': ['安全', '权限', '认证', '加密'],
      '数据': ['数据', '信息', '统计', '分析']
    };

    const topics: string[] = [];

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      for (const keyword of keywords) {
        if (text.includes(keyword)) {
          topics.push(topic);
          break;
        }
      }
    }

    return topics;
  }

  private detectEmotion(text: string, sentiment: string): string {
    const emotionPatterns: Record<string, string[]> = {
      'happy': ['开心', '高兴', '快乐', '满意', 'happy', 'glad', 'pleased'],
      'angry': ['生气', '愤怒', '恼火', 'angry', 'furious', 'mad'],
      'sad': ['难过', '伤心', '失望', 'sad', 'disappointed', 'upset'],
      'fear': ['担心', '害怕', '恐惧', 'worried', 'afraid', 'scared'],
      'surprise': ['惊讶', '意外', 'surprised', 'unexpected', 'shocked']
    };

    for (const [emotion, patterns] of Object.entries(emotionPatterns)) {
      for (const pattern of patterns) {
        if (text.includes(pattern)) {
          return emotion;
        }
      }
    }

    if (sentiment === 'positive') return 'happy';
    if (sentiment === 'negative') return 'sad';
    return 'neutral';
  }

  private detectUrgency(text: string, intent: string, sentiment: string): 'low' | 'medium' | 'high' {
    const urgencyPatterns = {
      high: ['紧急', '立即', '马上', 'urgent', 'immediately', 'asap'],
      medium: ['尽快', '及时', 'promptly', 'soon']
    };

    for (const pattern of urgencyPatterns.high) {
      if (text.includes(pattern)) {
        return 'high';
      }
    }

    for (const pattern of urgencyPatterns.medium) {
      if (text.includes(pattern)) {
        return 'medium';
      }
    }

    if (intent === 'complaint' && sentiment === 'negative') {
      return 'high';
    }

    return 'low';
  }

  getModel(modelName: string): SemanticModel | undefined {
    return this.models.get(modelName);
  }

  getModels(): SemanticModel[] {
    return Array.from(this.models.values());
  }

  getIntent(intentName: string): Intent | undefined {
    return this.intents.get(intentName);
  }

  getIntents(): Intent[] {
    return Array.from(this.intents.values());
  }

  async addCustomIntent(intent: Intent): Promise<void> {
    this.intents.set(intent.name, intent);
    this.emit('intent_added', intent);
  }

  async removeIntent(intentName: string): Promise<void> {
    this.intents.delete(intentName);
    this.emit('intent_removed', intentName);
  }

  async addEntityType(type: string, patterns: string[]): Promise<void> {
    this.entityTypes.set(type, patterns);
    this.emit('entity_type_added', { type, patterns });
  }

  async addSentimentWord(word: string, score: number): Promise<void> {
    this.sentimentLexicon.set(word, score);
    this.emit('sentiment_word_added', { word, score });
  }
}
