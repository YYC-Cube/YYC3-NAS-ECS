/**
 * @file VoiceContextManager.ts
 * @description 语音上下文管理器 - 理解语音对话的上下文
 */

export interface ConversationContext {
  id: string
  language: string
  topic: string
  entities: Array<{
    type: string
    value: any
    confidence: number
    timestamp: number
  }>
  history: Array<{
    role: 'user' | 'system' | 'assistant'
    content: string
    timestamp: number
  }>
  state: Record<string, any>
  metadata: {
    createdAt: number
    updatedAt: number
    turnCount: number
  }
}

export interface ContextRule {
  pattern: RegExp
  action: (context: ConversationContext, match: RegExpMatchArray) => void
  priority: number
}

export class VoiceContextManager {
  private contexts: Map<string, ConversationContext> = new Map()
  private currentContextId: string | null = null
  private contextRules: ContextRule[] = []
  private entityExtractors: Map<string, (text: string) => any[]> = new Map()
  
  private listeners: Map<string, Function[]> = new Map()
  private maxHistoryPerContext: number = 50
  private contextTimeout: number = 300000 // 5分钟

  constructor() {
    this.setupDefaultRules()
    this.setupEntityExtractors()
    this.startContextCleanup()
  }

  /**
   * 设置默认规则
   */
  private setupDefaultRules(): void {
    // 问候语规则
    this.addContextRule({
      pattern: /^(你好|嗨|hello|hi|早上好|下午好|晚上好)/i,
      action: (context, match) => {
        context.topic = 'greeting'
        context.state.lastGreeting = match[0]
        context.state.greetingCount = (context.state.greetingCount || 0) + 1
      },
      priority: 1
    })

    // 弹窗相关规则
    this.addContextRule({
      pattern: /(弹窗|窗口)/i,
      action: (context, match) => {
        context.topic = 'popup'
        if (!context.state.popupMentions) {
          context.state.popupMentions = []
        }
        context.state.popupMentions.push({
          mention: match[0],
          timestamp: Date.now()
        })
      },
      priority: 2
    })

    // 布局相关规则
    this.addContextRule({
      pattern: /(布局|排列|整理|网格|圆形)/i,
      action: (context, match) => {
        context.topic = 'layout'
        context.state.layoutType = match[0]
      },
      priority: 2
    })

    // 数字规则
    this.addContextRule({
      pattern: /(\d+)/g,
      action: (context, match) => {
        const numbers = match.map(m => parseInt(m))
        if (context.topic === 'popup' && numbers.length > 0) {
          context.state.popupCount = numbers[0]
        }
      },
      priority: 3
    })

    // 方向规则
    this.addContextRule({
      pattern: /(左|右|上|下|前|后)/,
      action: (context, match) => {
        context.state.direction = match[0]
      },
      priority: 3
    })

    // 颜色规则
    this.addContextRule({
      pattern: /(红|橙|黄|绿|青|蓝|紫|黑|白|灰)/,
      action: (context, match) => {
        context.state.color = match[0]
      },
      priority: 3
    })

    // 问题规则
    this.addContextRule({
      pattern: /[?？]/,
      action: (context) => {
        context.topic = 'question'
        context.state.isQuestion = true
      },
      priority: 2
    })

    // 命令规则
    this.addContextRule({
      pattern: /(创建|关闭|打开|删除|添加|移除)/i,
      action: (context, match) => {
        context.state.action = match[0]
      },
      priority: 2
    })
  }

  /**
   * 设置实体提取器
   */
  private setupEntityExtractors(): void {
    // 时间实体提取器
    this.addEntityExtractor('time', (text) => {
      const entities = []
      
      // 匹配时间格式
      const timePatterns = [
        { pattern: /(\d{1,2}):(\d{2})/, type: 'time' },
        { pattern: /(\d+)\s*(分钟|小时|天|周|月)/, type: 'duration' },
        { pattern: /(现在|马上|立即)/, type: 'immediate' }
      ]
      
      timePatterns.forEach(({ pattern, type }) => {
        const matches = text.matchAll(pattern)
        for (const match of matches) {
          entities.push({
            type,
            value: match[0],
            start: match.index || 0,
            end: (match.index || 0) + match[0].length,
            confidence: 0.8
          })
        }
      })
      
      return entities
    })

    // 日期实体提取器
    this.addEntityExtractor('date', (text) => {
      const entities = []
      
      const datePatterns = [
        { pattern: /(今天|明天|后天|昨天)/, type: 'relative_date' },
        { pattern: /(\d{4})年(\d{1,2})月(\d{1,2})日/, type: 'absolute_date' },
        { pattern: /(\d{1,2})月(\d{1,2})日/, type: 'month_day' }
      ]
      
      datePatterns.forEach(({ pattern, type }) => {
        const matches = text.matchAll(pattern)
        for (const match of matches) {
          entities.push({
            type,
            value: match[0],
            start: match.index || 0,
            end: (match.index || 0) + match[0].length,
            confidence: 0.7
          })
        }
      })
      
      return entities
    })

    // 数字实体提取器
    this.addEntityExtractor('number', (text) => {
      const entities = []
      
      const matches = text.matchAll(/\d+/g)
      for (const match of matches) {
        entities.push({
          type: 'number',
          value: parseInt(match[0]),
          start: match.index || 0,
          end: (match.index || 0) + match[0].length,
          confidence: 1.0
        })
      }
      
      return entities
    })
  }

  /**
   * 添加上下文规则
   */
  addContextRule(rule: ContextRule): void {
    this.contextRules.push(rule)
    this.contextRules.sort((a, b) => b.priority - a.priority) // 按优先级排序
  }

  /**
   * 添加实体提取器
   */
  addEntityExtractor(type: string, extractor: (text: string) => any[]): void {
    this.entityExtractors.set(type, extractor)
  }

  /**
   * 创建新上下文
   */
  createContext(language: string = 'zh-CN'): string {
    const contextId = `context-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const context: ConversationContext = {
      id: contextId,
      language,
      topic: 'general',
      entities: [],
      history: [],
      state: {},
      metadata: {
        createdAt: Date.now(),
        updatedAt: Date.now(),
        turnCount: 0
      }
    }
    
    this.contexts.set(contextId, context)
    this.currentContextId = contextId
    
    this.emit('context-created', { contextId, context })
    
    return contextId
  }

  /**
   * 添加上下文历史
   */
  addToContext(
    contextId: string,
    role: 'user' | 'system' | 'assistant',
    content: string
  ): ConversationContext | null {
    const context = this.contexts.get(contextId)
    if (!context) return null
    
    // 添加历史记录
    context.history.push({
      role,
      content,
      timestamp: Date.now()
    })
    
    // 限制历史记录大小
    if (context.history.length > this.maxHistoryPerContext) {
      context.history.shift()
    }
    
    // 更新元数据
    context.metadata.updatedAt = Date.now()
    context.metadata.turnCount++
    
    // 如果用户发言，提取实体和更新状态
    if (role === 'user') {
      this.extractEntities(context, content)
      this.applyContextRules(context, content)
    }
    
    this.emit('context-updated', { contextId, context, role, content })
    
    return context
  }

  /**
   * 提取实体
   */
  private extractEntities(context: ConversationContext, text: string): void {
    context.entities = []
    
    this.entityExtractors.forEach((extractor, type) => {
      const entities = extractor(text)
      entities.forEach(entity => {
        context.entities.push({
          type,
          value: entity.value,
          confidence: entity.confidence,
          timestamp: Date.now()
        })
      })
    })
    
    // 限制实体数量
    if (context.entities.length > 20) {
      context.entities = context.entities.slice(-20)
    }
  }

  /**
   * 应用上下文规则
   */
  private applyContextRules(context: ConversationContext, text: string): void {
    this.contextRules.forEach(rule => {
      const match = text.match(rule.pattern)
      if (match) {
        try {
          rule.action(context, match)
        } catch (error) {
          console.error('应用上下文规则失败:', error)
        }
      }
    })
  }

  /**
   * 获取上下文
   */
  getContext(contextId?: string): ConversationContext | null {
    const id = contextId || this.currentContextId
    if (!id) return null
    
    return this.contexts.get(id) || null
  }

  /**
   * 获取当前上下文
   */
  getCurrentContext(): ConversationContext | null {
    return this.currentContextId ? this.contexts.get(this.currentContextId) || null : null
  }

  /**
   * 切换上下文
   */
  switchContext(contextId: string): boolean {
    if (!this.contexts.has(contextId)) {
      console.warn(`上下文不存在: ${contextId}`)
      return false
    }
    
    const oldContextId = this.currentContextId
    this.currentContextId = contextId
    
    this.emit('context-switched', {
      oldContextId,
      newContextId: contextId,
      timestamp: Date.now()
    })
    
    return true
  }

  /**
   * 获取上下文摘要
   */
  getContextSummary(contextId?: string): {
    topic: string
    turnCount: number
    entityCount: number
    lastUpdated: number
    state: Record<string, any>
  } | null {
    const context = this.getContext(contextId)
    if (!context) return null
    
    return {
      topic: context.topic,
      turnCount: context.metadata.turnCount,
      entityCount: context.entities.length,
      lastUpdated: context.metadata.updatedAt,
      state: { ...context.state }
    }
  }

  /**
   * 理解用户意图
   */
  understandIntent(
    text: string,
    contextId?: string
  ): {
    intent: string
    confidence: number
    entities: any[]
    context: ConversationContext
    suggestions: string[]
  } | null {
    const context = this.getContext(contextId)
    if (!context) return null
    
    // 分析文本
    const analysis = this.analyzeText(text, context)
    
    // 基于上下文和历史猜测意图
    let intent = 'unknown'
    let confidence = 0.5
    
    if (context.topic === 'greeting') {
      intent = 'greeting'
      confidence = 0.8
    } else if (context.topic === 'popup') {
      if (context.state.action === '创建') {
        intent = 'create_popup'
        confidence = 0.7
      } else if (context.state.action === '关闭') {
        intent = 'close_popup'
        confidence = 0.7
      }
    } else if (context.topic === 'layout') {
      intent = 'arrange_popups'
      confidence = 0.6
    } else if (context.state.isQuestion) {
      intent = 'question'
      confidence = 0.6
    }
    
    // 基于历史提高置信度
    if (context.history.length > 0) {
      const lastUserMessage = context.history
        .filter(h => h.role === 'user')
        .pop()
      
      if (lastUserMessage && this.isRelated(text, lastUserMessage.content)) {
        confidence = Math.min(1, confidence + 0.2)
      }
    }
    
    // 生成建议
    const suggestions = this.generateSuggestions(context, intent)
    
    return {
      intent,
      confidence,
      entities: [...context.entities],
      context,
      suggestions
    }
  }

  /**
   * 分析文本
   */
  private analyzeText(text: string, context: ConversationContext): {
    length: number
    wordCount: number
    hasQuestion: boolean
    hasCommand: boolean
    emotion: 'neutral' | 'positive' | 'negative'
  } {
    const words = text.split(/\s+/)
    const hasQuestion = /[?？]/.test(text)
    const hasCommand = /(创建|关闭|打开|删除|添加|移除)/i.test(text)
    
    // 简单的情感分析
    let emotion: 'neutral' | 'positive' | 'negative' = 'neutral'
    const positiveWords = ['好', '喜欢', '谢谢', '感谢', '很棒', '优秀']
    const negativeWords = ['不好', '讨厌', '糟糕', '错误', '失败', '问题']
    
    if (positiveWords.some(word => text.includes(word))) {
      emotion = 'positive'
    } else if (negativeWords.some(word => text.includes(word))) {
      emotion = 'negative'
    }
    
    return {
      length: text.length,
      wordCount: words.length,
      hasQuestion,
      hasCommand,
      emotion
    }
  }

  /**
   * 判断文本是否相关
   */
  private isRelated(text1: string, text2: string): boolean {
    const words1 = new Set(text1.toLowerCase().split(/\W+/))
    const words2 = new Set(text2.toLowerCase().split(/\W+/))
    
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])
    
    // 计算Jaccard相似度
    const similarity = intersection.size / union.size
    return similarity > 0.3
  }

  /**
   * 生成建议
   */
  private generateSuggestions(context: ConversationContext, intent: string): string[] {
    const suggestions: string[] = []
    
    switch (intent) {
      case 'greeting':
        suggestions.push('您可以创建弹窗或询问如何使用系统')
        break
      case 'create_popup':
        suggestions.push('您可以说"创建弹窗"或指定弹窗内容')
        if (context.state.popupCount) {
          suggestions.push(`您要创建${context.state.popupCount}个弹窗吗？`)
        }
        break
      case 'close_popup':
        suggestions.push('您要关闭所有弹窗还是特定弹窗？')
        break
      case 'question':
        suggestions.push('您可以问关于弹窗、布局或智能体的问题')
        break
      case 'layout':
        suggestions.push('您可以选择网格布局、圆形布局或自动排列')
        break
    }
    
    // 基于上下文状态添加建议
    if (context.state.direction) {
      suggestions.push(`您提到了${context.state.direction}方向`)
    }
    
    if (context.state.color) {
      suggestions.push(`您提到了${context.state.color}色`)
    }
    
    return suggestions.slice(0, 3) // 最多3条建议
  }

  /**
   * 获取相关上下文
   */
  getRelatedContexts(topic: string, limit: number = 5): ConversationContext[] {
    const related: Array<{ context: ConversationContext; score: number }> = []
    
    this.contexts.forEach(context => {
      if (context.topic === topic) {
        // 基于时间加权评分（越近越高分）
        const timeScore = 1 - Math.min(1, (Date.now() - context.metadata.updatedAt) / 3600000)
        const turnScore = Math.min(1, context.metadata.turnCount / 20)
        const score = timeScore * 0.6 + turnScore * 0.4
        
        related.push({ context, score })
      }
    })
    
    // 按评分排序
    related.sort((a, b) => b.score - a.score)
    
    return related.slice(0, limit).map(item => item.context)
  }

  /**
   * 合并上下文
   */
  mergeContexts(sourceId: string, targetId: string): boolean {
    const source = this.contexts.get(sourceId)
    const target = this.contexts.get(targetId)
    
    if (!source || !target) return false
    
    // 合并历史（保留最新的）
    target.history = [...target.history, ...source.history]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-this.maxHistoryPerContext)
    
    // 合并实体
    target.entities = [...target.entities, ...source.entities]
      .sort((a, b) => b.confidence - a.confidence)
      .slice(-20)
    
    // 合并状态
    target.state = { ...source.state, ...target.state }
    
    // 更新元数据
    target.metadata.turnCount = target.history.filter(h => h.role === 'user').length
    target.metadata.updatedAt = Date.now()
    
    // 删除源上下文
    this.contexts.delete(sourceId)
    
    this.emit('contexts-merged', {
      sourceId,
      targetId,
      mergedHistory: target.history.length,
      timestamp: Date.now()
    })
    
    return true
  }

  /**
   * 启动上下文清理
   */
  private startContextCleanup(): void {
    setInterval(() => {
      this.cleanupOldContexts()
    }, 60000) // 每分钟检查一次
  }

  /**
   * 清理旧上下文
   */
  private cleanupOldContexts(): void {
    const now = Date.now()
    let cleanedCount = 0
    
    this.contexts.forEach((context, id) => {
      if (now - context.metadata.updatedAt > this.contextTimeout) {
        // 保留重要上下文（有多次交互的）
        if (context.metadata.turnCount < 3) {
          this.contexts.delete(id)
          cleanedCount++
          
          this.emit('context-cleaned', {
            contextId: id,
            reason: 'timeout',
            age: now - context.metadata.updatedAt,
            timestamp: now
          })
        }
      }
    })
    
    if (cleanedCount > 0) {
      console.log(`清理了 ${cleanedCount} 个旧上下文`)
    }
  }

  /**
   * 获取所有上下文
   */
  getAllContexts(): ConversationContext[] {
    return Array.from(this.contexts.values())
  }

  /**
   * 获取上下文统计
   */
  getContextStatistics(): {
    totalContexts: number
    activeContexts: number
    totalTurns: number
    topics: Record<string, number>
    averageTurns: number
  } {
    const now = Date.now()
    let totalTurns = 0
    const topics: Record<string, number> = {}
    let activeContexts = 0
    
    this.contexts.forEach(context => {
      totalTurns += context.metadata.turnCount
      topics[context.topic] = (topics[context.topic] || 0) + 1
      
      if (now - context.metadata.updatedAt < this.contextTimeout) {
        activeContexts++
      }
    })
    
    return {
      totalContexts: this.contexts.size,
      activeContexts,
      totalTurns,
      topics,
      averageTurns: this.contexts.size > 0 ? totalTurns / this.contexts.size : 0
    }
  }

  /**
   * 事件监听
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(callback)
  }

  off(event: string, callback: Function): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  private emit(event: string, data?: any): void {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach(callback => callback(data))
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    this.listeners.clear()
    this.contexts.clear()
    this.contextRules = []
    this.entityExtractors.clear()
    this.currentContextId = null
  }
}
