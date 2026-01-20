/**
 * @file VoiceCommandProcessor.ts
 * @description 语音命令处理器 - 智能解析和执行语音命令
 */

import { SpeechRecognitionResult } from './SpeechRecognitionEngine'
import { AgentManager } from '../ai/AgentManager'
import { PopupEnhancedManager } from '../popup/enhanced/PopupEnhancedManager'

export interface VoiceCommand {
  id: string
  text: string
  intent: string
  confidence: number
  parameters: Record<string, any>
  timestamp: number
  executed: boolean
  result?: any
}

export interface IntentPattern {
  intent: string
  patterns: RegExp[]
  parameters?: Record<string, string>
  description: string
  example: string[]
  action: (params: Record<string, any>) => Promise<any>
}

export interface VoiceCommandConfig {
  enableAutoExecution: boolean
  requireConfirmation: boolean
  confirmationText: string
  language: string
  timeout: number
  maxRetries: number
  enableLearning: boolean
}

export class VoiceCommandProcessor {
  private intentPatterns: IntentPattern[] = []
  private commandHistory: VoiceCommand[] = []
  private context: Map<string, any> = new Map()
  private config: VoiceCommandConfig
  private agentManager: AgentManager
  private popupManager: PopupEnhancedManager
  
  private listeners: Map<string, Function[]> = new Map()
  private maxHistorySize: number = 100
  private learningData: Array<{
    text: string
    intent: string
    parameters: Record<string, any>
    timestamp: number
  }> = []

  constructor(config?: Partial<VoiceCommandConfig>) {
    this.config = {
      enableAutoExecution: true,
      requireConfirmation: false,
      confirmationText: '确认执行吗？',
      language: 'zh-CN',
      timeout: 5000,
      maxRetries: 3,
      enableLearning: true,
      ...config
    }
    
    this.agentManager = AgentManager.getInstance()
    this.popupManager = PopupEnhancedManager.getInstance()
    
    this.setupDefaultIntents()
    this.loadLearningData()
  }

  /**
   * 设置默认意图
   */
  private setupDefaultIntents(): void {
    // 弹窗控制命令
    this.addIntent({
      intent: 'create_popup',
      patterns: [
        /创建.*(弹窗|窗口)/,
        /新建.*(弹窗|窗口)/,
        /打开.*(弹窗|窗口)/,
        /添加.*(弹窗|窗口)/
      ],
      description: '创建新弹窗',
      example: ['创建弹窗', '新建一个窗口', '打开新弹窗'],
      action: async (params) => {
        return this.createPopup(params)
      }
    })

    this.addIntent({
      intent: 'close_popup',
      patterns: [
        /关闭.*(弹窗|窗口)/,
        /删除.*(弹窗|窗口)/,
        /移除.*(弹窗|窗口)/,
        /隐藏.*(弹窗|窗口)/
      ],
      description: '关闭弹窗',
      example: ['关闭弹窗', '删除这个窗口', '移除弹窗'],
      action: async (params) => {
        return this.closePopup(params)
      }
    })

    this.addIntent({
      intent: 'arrange_popups',
      patterns: [
        /排列.*(弹窗|窗口)/,
        /整理.*(弹窗|窗口)/,
        /布局.*(弹窗|窗口)/,
        /整理.*所有/
      ],
      description: '排列所有弹窗',
      example: ['排列弹窗', '整理所有窗口', '优化布局'],
      action: async (params) => {
        return this.arrangePopups(params)
      }
    })

    // 布局命令
    this.addIntent({
      intent: 'layout_grid',
      patterns: [
        /网格.*布局/,
        /格子.*排列/,
        /整齐.*排列/
      ],
      description: '网格布局',
      example: ['网格布局', '使用网格排列', '格子布局'],
      action: async (params) => {
        return this.applyLayout('grid', params)
      }
    })

    this.addIntent({
      intent: 'layout_circular',
      patterns: [
        /圆形.*布局/,
        /环形.*排列/,
        /围绕.*排列/
      ],
      description: '圆形布局',
      example: ['圆形布局', '环形排列', '围绕中心排列'],
      action: async (params) => {
        return this.applyLayout('circular', params)
      }
    })

    // 智能体命令
    this.addIntent({
      intent: 'create_agent',
      patterns: [
        /创建.*智能体/,
        /添加.*助手/,
        /绑定.*智能体/
      ],
      description: '创建智能体',
      example: ['创建智能体', '添加助手', '绑定布局智能体'],
      action: async (params) => {
        return this.createAgent(params)
      }
    })

    this.addIntent({
      intent: 'ask_agent',
      patterns: [
        /问.*智能体/,
        /咨询.*助手/,
        /告诉.*我/
      ],
      description: '询问智能体',
      example: ['问智能体怎么布局', '咨询助手', '告诉我如何创建弹窗'],
      action: async (params) => {
        return this.askAgent(params)
      }
    })

    // 系统命令
    this.addIntent({
      intent: 'help',
      patterns: [
        /帮助/,
        /怎么用/,
        /如何使用/,
        /功能介绍/
      ],
      description: '显示帮助',
      example: ['帮助', '怎么使用', '功能介绍'],
      action: async (params) => {
        return this.showHelp(params)
      }
    })

    this.addIntent({
      intent: 'clear_all',
      patterns: [
        /清空.*所有/,
        /关闭.*所有/,
        /删除.*全部/
      ],
      description: '清空所有',
      example: ['清空所有', '关闭所有弹窗', '删除全部'],
      action: async (params) => {
        return this.clearAll(params)
      }
    })

    // 控制命令
    this.addIntent({
      intent: 'start_voice',
      patterns: [
        /开始.*语音/,
        /启用.*语音/,
        /打开.*语音/
      ],
      description: '开始语音识别',
      example: ['开始语音', '启用语音识别', '打开语音'],
      action: async (params) => {
        return { action: 'start_voice' }
      }
    })

    this.addIntent({
      intent: 'stop_voice',
      patterns: [
        /停止.*语音/,
        /关闭.*语音/,
        /禁用.*语音/
      ],
      description: '停止语音识别',
      example: ['停止语音', '关闭语音识别', '禁用语音'],
      action: async (params) => {
        return { action: 'stop_voice' }
      }
    })

    // 确认命令
    this.addIntent({
      intent: 'confirm',
      patterns: [
        /确认/,
        /是的/,
        /对的/,
        /正确/,
        /好的/
      ],
      description: '确认操作',
      example: ['确认', '是的', '好的'],
      action: async (params) => {
        return { action: 'confirm' }
      }
    })

    this.addIntent({
      intent: 'cancel',
      patterns: [
        /取消/,
        /不/,
        /算了/,
        /停止/
      ],
      description: '取消操作',
      example: ['取消', '不要', '算了'],
      action: async (params) => {
        return { action: 'cancel' }
      }
    })

    // 导航命令
    this.addIntent({
      intent: 'go_back',
      patterns: [
        /返回/,
        /后退/,
        /上一页/
      ],
      description: '返回',
      example: ['返回', '后退', '回到上一页'],
      action: async (params) => {
        return { action: 'go_back' }
      }
    })

    this.addIntent({
      intent: 'go_home',
      patterns: [
        /首页/,
        /主页/,
        /主界面/
      ],
      description: '返回首页',
      example: ['首页', '主页', '回到主界面'],
      action: async (params) => {
        return { action: 'go_home' }
      }
    })
  }

  /**
   * 添加意图
   */
  addIntent(intent: IntentPattern): void {
    this.intentPatterns.push(intent)
    
    this.emit('intent-added', {
      intent: intent.intent,
      patternCount: intent.patterns.length,
      timestamp: Date.now()
    })
  }

  /**
   * 处理语音结果
   */
  async processSpeechResult(result: SpeechRecognitionResult): Promise<VoiceCommand> {
    const command: VoiceCommand = {
      id: `cmd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: result.transcript,
      intent: '',
      confidence: result.confidence,
      parameters: {},
      timestamp: Date.now(),
      executed: false
    }

    // 识别意图
    const intentMatch = this.matchIntent(result.transcript)
    
    if (intentMatch) {
      command.intent = intentMatch.intent
      command.parameters = intentMatch.parameters || {}
      command.confidence = Math.min(1, result.confidence + 0.2) // 提高置信度
    } else {
      // 使用AI智能体识别意图
      const aiIntent = await this.recognizeIntentWithAI(result.transcript)
      if (aiIntent) {
        command.intent = aiIntent.intent
        command.parameters = aiIntent.parameters
        command.confidence = aiIntent.confidence
        
        // 学习新的意图
        if (this.config.enableLearning) {
          this.learnNewIntent(result.transcript, aiIntent)
        }
      } else {
        command.intent = 'unknown'
        command.confidence = 0.3
      }
    }

    // 保存到历史
    this.commandHistory.push(command)
    if (this.commandHistory.length > this.maxHistorySize) {
      this.commandHistory.shift()
    }

    // 发射命令识别事件
    this.emit('command-recognized', command)

    // 自动执行
    if (this.config.enableAutoExecution && 
        command.intent !== 'unknown' && 
        command.confidence > 0.6) {
      
      if (this.config.requireConfirmation) {
        // 需要确认
        this.emit('confirmation-required', {
          command,
          text: this.config.confirmationText
        })
      } else {
        // 直接执行
        await this.executeCommand(command)
      }
    }

    return command
  }

  /**
   * 匹配意图
   */
  private matchIntent(text: string): {
    intent: string
    parameters?: Record<string, any>
    confidence: number
  } | null {
    const lowerText = text.toLowerCase()
    
    for (const intent of this.intentPatterns) {
      for (const pattern of intent.patterns) {
        if (pattern.test(lowerText)) {
          // 提取参数
          const parameters = this.extractParameters(lowerText, intent.parameters)
          
          return {
            intent: intent.intent,
            parameters,
            confidence: 0.8 // 基础置信度
          }
        }
      }
    }
    
    return null
  }

  /**
   * 提取参数
   */
  private extractParameters(text: string, paramDefs?: Record<string, string>): Record<string, any> {
    if (!paramDefs) return {}
    
    const parameters: Record<string, any> = {}
    
    Object.entries(paramDefs).forEach(([key, patternStr]) => {
      const pattern = new RegExp(patternStr, 'i')
      const match = text.match(pattern)
      if (match) {
        parameters[key] = match[1] || match[0]
      }
    })
    
    return parameters
  }

  /**
   * 使用AI识别意图
   */
  private async recognizeIntentWithAI(text: string): Promise<{
    intent: string
    parameters: Record<string, any>
    confidence: number
  } | null> {
    try {
      // 尝试使用助手智能体
      const agents = this.agentManager.getAllAgents()
      const assistantAgent = agents.find(agent => 
        agent.constructor.name === 'AssistantAgent'
      )
      
      if (assistantAgent) {
        const response = await assistantAgent.handleMessage({
          id: `intent-${Date.now()}`,
          type: 'query',
          from: 'voice-processor',
          to: assistantAgent['config'].id,
          timestamp: Date.now(),
          payload: {
            action: 'recognize_intent',
            parameters: { text }
          }
        })
        
        if (response.success && response.data) {
          return {
            intent: response.data.intent || 'unknown',
            parameters: response.data.parameters || {},
            confidence: response.data.confidence || 0.5
          }
        }
      }
      
      // 使用简单的规则匹配作为备选
      return this.simpleIntentRecognition(text)
      
    } catch (error) {
      console.error('AI意图识别失败:', error)
      return null
    }
  }

  /**
   * 简单意图识别
   */
  private simpleIntentRecognition(text: string): {
    intent: string
    parameters: Record<string, any>
    confidence: number
  } | null {
    const lowerText = text.toLowerCase()
    
    // 检测数字
    const numberMatch = lowerText.match(/(\d+)/)
    if (numberMatch) {
      return {
        intent: 'specify_number',
        parameters: { number: parseInt(numberMatch[1]) },
        confidence: 0.7
      }
    }
    
    // 检测方向
    if (/(左|右|上|下|前|后)/.test(lowerText)) {
      return {
        intent: 'move_direction',
        parameters: { direction: lowerText.match(/(左|右|上|下|前|后)/)![0] },
        confidence: 0.6
      }
    }
    
    // 检测颜色
    const colors = ['红', '橙', '黄', '绿', '青', '蓝', '紫', '黑', '白', '灰']
    for (const color of colors) {
      if (lowerText.includes(color)) {
        return {
          intent: 'set_color',
          parameters: { color },
          confidence: 0.7
        }
      }
    }
    
    return null
  }

  /**
   * 学习新意图
   */
  private learnNewIntent(text: string, intent: any): void {
    this.learningData.push({
      text,
      intent: intent.intent,
      parameters: intent.parameters,
      timestamp: Date.now()
    })
    
    // 保存学习数据
    if (this.learningData.length % 10 === 0) {
      this.saveLearningData()
    }
    
    // 如果相似文本多次出现，创建新意图
    const similarTexts = this.learningData.filter(
      data => data.intent === intent.intent
    )
    
    if (similarTexts.length >= 3) {
      // 提取共同模式
      const patterns = this.extractPatterns(similarTexts.map(d => d.text))
      
      if (patterns.length > 0) {
        // 添加新意图
        this.addIntent({
          intent: intent.intent,
          patterns: patterns.map(p => new RegExp(p, 'i')),
          description: `学习到的意图: ${intent.intent}`,
          example: similarTexts.slice(0, 3).map(d => d.text),
          action: this.getIntentAction(intent.intent)
        })
        
        console.log(`学习到新意图: ${intent.intent}，模式: ${patterns}`)
      }
    }
  }

  /**
   * 提取模式
   */
  private extractPatterns(texts: string[]): string[] {
    if (texts.length < 2) return []
    
    // 简单的模式提取：查找共同词语
    const words = texts.map(text => 
      text.toLowerCase().split(/[\s,，.。!！?？;；:：]+/)
    )
    
    const commonWords = words[0].filter(word => 
      words.slice(1).every(otherWords => otherWords.includes(word))
    )
    
    if (commonWords.length > 0) {
      // 创建正则表达式模式
      return commonWords.map(word => `.*${word}.*`)
    }
    
    return []
  }

  /**
   * 获取意图动作
   */
  private getIntentAction(intent: string): (params: Record<string, any>) => Promise<any> {
    // 查找现有意图的动作
    const existingIntent = this.intentPatterns.find(i => i.intent === intent)
    if (existingIntent) {
      return existingIntent.action
    }
    
    // 默认动作
    return async (params) => {
      return {
        success: true,
        intent,
        parameters: params,
        message: `执行学习到的意图: ${intent}`
      }
    }
  }

  /**
   * 执行命令
   */
  async executeCommand(command: VoiceCommand): Promise<any> {
    try {
      // 查找意图
      const intent = this.intentPatterns.find(i => i.intent === command.intent)
      
      if (!intent) {
        throw new Error(`未知的意图: ${command.intent}`)
      }

      // 执行动作
      const startTime = Date.now()
      const result = await intent.action(command.parameters)
      const executionTime = Date.now() - startTime

      // 更新命令状态
      command.executed = true
      command.result = result

      // 发射执行完成事件
      this.emit('command-executed', {
        command,
        result,
        executionTime,
        timestamp: Date.now()
      })

      // 更新上下文
      this.updateContext(command.intent, command.parameters, result)

      return result

    } catch (error) {
      console.error(`执行命令失败: ${command.intent}`, error)
      
      this.emit('command-failed', {
        command,
        error: error.message,
        timestamp: Date.now()
      })
      
      throw error
    }
  }

  /**
   * 更新上下文
   */
  private updateContext(intent: string, parameters: Record<string, any>, result: any): void {
    const contextKey = `last-${intent}`
    
    this.context.set(contextKey, {
      intent,
      parameters,
      result,
      timestamp: Date.now()
    })
    
    // 保持上下文数量
    if (this.context.size > 20) {
      const oldestKey = Array.from(this.context.keys())[0]
      this.context.delete(oldestKey)
    }
  }

  /**
   * 获取上下文
   */
  getContext(): Record<string, any> {
    return Object.fromEntries(this.context)
  }

  /**
   * 清除上下文
   */
  clearContext(): void {
    this.context.clear()
    this.emit('context-cleared', { timestamp: Date.now() })
  }

  /**
   * 具体命令实现
   */

  private async createPopup(params: any): Promise<any> {
    const popupManager = this.popupManager
    
    const popup = await popupManager.createPopup({
      title: params.title || '新弹窗',
      content: params.content || '语音创建的弹窗',
      position: {
        x: params.x || 100,
        y: params.y || 100
      },
      size: {
        width: params.width || 400,
        height: params.height || 300
      }
    })
    
    return {
      success: true,
      popupId: popup.id,
      message: '弹窗创建成功'
    }
  }

  private async closePopup(params: any): Promise<any> {
    const popupManager = this.popupManager
    const popups = popupManager.getAllPopups()
    
    if (popups.length === 0) {
      return {
        success: false,
        message: '没有弹窗可以关闭'
      }
    }
    
    // 如果有指定弹窗ID，关闭指定弹窗
    if (params.popupId) {
      const closed = popupManager.closePopup(params.popupId)
      return {
        success: closed,
        message: closed ? '弹窗已关闭' : '弹窗关闭失败'
      }
    }
    
    // 关闭最前面的弹窗
    const frontPopup = popups.sort((a, b) => b.zIndex - a.zIndex)[0]
    const closed = popupManager.closePopup(frontPopup.id)
    
    return {
      success: closed,
      popupId: frontPopup.id,
      message: closed ? '弹窗已关闭' : '弹窗关闭失败'
    }
  }

  private async arrangePopups(params: any): Promise<any> {
    const popupManager = this.popupManager
    const popups = popupManager.getAllPopups()
    
    if (popups.length === 0) {
      return {
        success: false,
        message: '没有弹窗可以排列'
      }
    }
    
    // 使用级联排列
    await popupManager.cascadePopups()
    
    return {
      success: true,
      popupCount: popups.length,
      message: `已排列 ${popups.length} 个弹窗`
    }
  }

  private async applyLayout(layoutType: string, params: any): Promise<any> {
    const popupManager = this.popupManager
    const popups = popupManager.getAllPopups()
    
    if (popups.length === 0) {
      return {
        success: false,
        message: '没有弹窗可以应用布局'
      }
    }
    
    // 获取布局智能体
    const agents = this.agentManager.getAllAgents()
    const layoutAgent = agents.find(agent => 
      agent.constructor.name === 'LayoutAgent'
    )
    
    if (layoutAgent) {
      const response = await layoutAgent.handleMessage({
        id: `layout-${Date.now()}`,
        type: 'command',
        from: 'voice-processor',
        to: layoutAgent['config'].id,
        timestamp: Date.now(),
        payload: {
          action: 'apply_layout',
          parameters: {
            strategy: layoutType,
            ...params
          }
        }
      })
      
      return response
    }
    
    // 如果没有布局智能体，使用默认布局
    await popupManager.cascadePopups()
    
    return {
      success: true,
      layout: layoutType,
      popupCount: popups.length,
      message: `已应用${layoutType}布局`
    }
  }

  private async createAgent(params: any): Promise<any> {
    const popupManager = this.popupManager
    const popups = popupManager.getAllPopups()
    
    if (popups.length === 0) {
      return {
        success: false,
        message: '没有弹窗可以绑定智能体'
      }
    }
    
    const agentType = params.type || 'assistant'
    const popup = popups[0] // 绑定到第一个弹窗
    
    try {
      const agent = await this.agentManager.createAgentForPopup(popup.id, agentType)
      
      return {
        success: true,
        agentId: agent['config'].id,
        popupId: popup.id,
        agentType,
        message: '智能体创建成功'
      }
    } catch (error) {
      return {
        success: false,
        message: `智能体创建失败: ${error.message}`
      }
    }
  }

  private async askAgent(params: any): Promise<any> {
    const question = params.question || '帮助'
    
    const agents = this.agentManager.getAllAgents()
    const assistantAgent = agents.find(agent => 
      agent.constructor.name === 'AssistantAgent'
    )
    
    if (!assistantAgent) {
      return {
        success: false,
        message: '没有可用的助手智能体'
      }
    }
    
    const response = await assistantAgent.handleMessage({
      id: `ask-${Date.now()}`,
      type: 'command',
      from: 'voice-processor',
      to: assistantAgent['config'].id,
      timestamp: Date.now(),
      payload: {
        action: 'process_message',
        parameters: { message: question }
      }
    })
    
    return response
  }

  private async showHelp(params: any): Promise<any> {
    const helpText = `
可用语音命令:
• 创建弹窗 - 创建新弹窗
• 关闭弹窗 - 关闭当前弹窗
• 排列弹窗 - 整理所有弹窗
• 网格布局 - 使用网格布局
• 圆形布局 - 使用圆形布局
• 创建智能体 - 绑定智能体到弹窗
• 问智能体 - 向智能体提问
• 帮助 - 显示帮助信息
• 清空所有 - 清空所有内容
    `.trim()
    
    return {
      success: true,
      message: helpText,
      type: 'help'
    }
  }

  private async clearAll(params: any): Promise<any> {
    const popupManager = this.popupManager
    const popups = popupManager.getAllPopups()
    
    // 关闭所有弹窗
    popups.forEach(popup => {
      popupManager.closePopup(popup.id)
    })
    
    // 清除智能体
    const agents = this.agentManager.getAllAgents()
    agents.forEach(agent => {
      this.agentManager.removeAgent(agent['popup']?.id)
    })
    
    return {
      success: true,
      clearedPopups: popups.length,
      clearedAgents: agents.length,
      message: '已清空所有内容'
    }
  }

  /**
   * 加载学习数据
   */
  private loadLearningData(): void {
    try {
      const saved = localStorage.getItem('voice_command_learning')
      if (saved) {
        this.learningData = JSON.parse(saved)
      }
    } catch (error) {
      console.error('加载学习数据失败:', error)
      this.learningData = []
    }
  }

  /**
   * 保存学习数据
   */
  private saveLearningData(): void {
    try {
      localStorage.setItem(
        'voice_command_learning',
        JSON.stringify(this.learningData.slice(-1000)) // 只保存最近的1000条
      )
    } catch (error) {
      console.error('保存学习数据失败:', error)
    }
  }

  /**
   * 获取命令历史
   */
  getCommandHistory(): VoiceCommand[] {
    return [...this.commandHistory]
  }

  /**
   * 获取意图列表
   */
  getIntents(): Array<{
    intent: string
    description: string
    example: string[]
    patternCount: number
  }> {
    return this.intentPatterns.map(intent => ({
      intent: intent.intent,
      description: intent.description,
      example: intent.example,
      patternCount: intent.patterns.length
    }))
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
    this.saveLearningData()
    this.listeners.clear()
    this.commandHistory = []
    this.learningData = []
    this.context.clear()
  }
}