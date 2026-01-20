/**
 * @file MultimodalInputManager.ts
 * @description 多模态输入管理器 - 协调手势、语音、文本等多种输入方式
 */

import {
    InputEvent, FusedInput, ModalityConfig,
    MultimodalConfig, ContextState, FusionRule, InputModality
} from './MultimodalProtocol'
import { EventEmitter } from '../utils/EventEmitter'

export class MultimodalInputManager extends EventEmitter {
    private config: MultimodalConfig
    private context: ContextState
    private eventBuffer: Map<string, InputEvent[]> = new Map()
    private fusionRules: FusionRule[] = []
    private modalityHandlers: Map<InputModality, Function> = new Map()
    private history: FusedInput[] = []
    private learningData: Array<{
        input: FusedInput
        outcome: 'success' | 'partial' | 'failure'
        feedback?: any
        timestamp: number
    }> = []

    private activeFusions: Map<string, {
        timeout: NodeJS.Timeout
        events: InputEvent[]
        startTime: number
    }> = new Map()

    private statistics: {
        totalEvents: Record<InputModality, number>
        successfulFusions: number
        failedFusions: number
        modalityConflicts: number
        averageFusionTime: number
    }

    constructor(config?: Partial<MultimodalConfig>) {
        super()

        this.config = {
            modalities: {
                voice: { enabled: true, priority: 3, confidenceThreshold: 0.6, timeout: 3000, weight: 0.4 },
                gesture: { enabled: true, priority: 2, confidenceThreshold: 0.7, timeout: 2000, weight: 0.3 },
                touch: { enabled: true, priority: 1, confidenceThreshold: 0.8, timeout: 1000, weight: 0.2 },
                keyboard: { enabled: true, priority: 4, confidenceThreshold: 0.9, timeout: 500, weight: 0.1 },
                mouse: { enabled: true, priority: 2, confidenceThreshold: 0.8, timeout: 1000, weight: 0.2 },
                pen: { enabled: false, priority: 2, confidenceThreshold: 0.7, timeout: 1500, weight: 0.2 },
                gaze: { enabled: false, priority: 1, confidenceThreshold: 0.6, timeout: 2000, weight: 0.1 }
            },
            fusionStrategy: 'contextual',
            timeout: 2000,
            requireConfirmation: false,
            enableLearning: true,
            maxHistorySize: 1000,
            ...config
        }

        this.initializeContext()
        this.initializeStatistics()
        this.setupDefaultFusionRules()
        this.startCleanupTask()
    }

    /**
     * 初始化上下文
     */
    private initializeContext(): void {
        this.context = {
            user: {
                preferences: {},
                behavior: {
                    modalityPreference: {
                        voice: 0.3,
                        gesture: 0.25,
                        touch: 0.2,
                        keyboard: 0.15,
                        mouse: 0.1,
                        pen: 0,
                        gaze: 0
                    },
                    averageConfidence: {
                        voice: 0.7,
                        gesture: 0.75,
                        touch: 0.8,
                        keyboard: 0.9,
                        mouse: 0.85,
                        pen: 0,
                        gaze: 0
                    },
                    successRate: {
                        voice: 0.8,
                        gesture: 0.85,
                        touch: 0.9,
                        keyboard: 0.95,
                        mouse: 0.9,
                        pen: 0,
                        gaze: 0
                    }
                }
            },
            environment: {
                deviceType: this.detectDeviceType(),
                inputCapabilities: this.detectInputCapabilities(),
                screenSize: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                network: navigator.onLine ? 'online' : 'offline'
            },
            session: {
                startTime: Date.now(),
                modalityUsage: {
                    voice: 0,
                    gesture: 0,
                    touch: 0,
                    keyboard: 0,
                    mouse: 0,
                    pen: 0,
                    gaze: 0
                },
                recentIntents: []
            }
        }

        this.loadUserPreferences()
    }

    /**
     * 初始化统计
     */
    private initializeStatistics(): void {
        this.statistics = {
            totalEvents: {
                voice: 0,
                gesture: 0,
                touch: 0,
                keyboard: 0,
                mouse: 0,
                pen: 0,
                gaze: 0
            },
            successfulFusions: 0,
            failedFusions: 0,
            modalityConflicts: 0,
            averageFusionTime: 0
        }
    }

    /**
     * 检测设备类型
     */
    private detectDeviceType(): 'mobile' | 'tablet' | 'desktop' | 'mixed' {
        const width = window.innerWidth
        const ua = navigator.userAgent.toLowerCase()

        if (width < 768 || /mobile|android|iphone|ipad|ipod/.test(ua)) {
            return 'mobile'
        } else if (width < 1024) {
            return 'tablet'
        } else {
            return 'desktop'
        }
    }

    /**
     * 检测输入能力
     */
    private detectInputCapabilities(): InputModality[] {
        const capabilities: InputModality[] = ['keyboard', 'mouse']

        // 检测触摸支持
        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            capabilities.push('touch')
        }

        // 检测语音支持
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            capabilities.push('voice')
        }

        // 检测笔支持
        if (window.PointerEvent && 'maxTouchPoints' in navigator) {
            // 检查是否支持笔
            const hasPen = (navigator as any).pointerEnabled ||
                (navigator as any).maxTouchPoints > 1
            if (hasPen) {
                capabilities.push('pen')
            }
        }

        // 检测注视跟踪（简化检测）
        if ('getUserMedia' in navigator.mediaDevices) {
            // 实际应用中需要更复杂的检测
            capabilities.push('gaze')
        }

        return capabilities
    }

    /**
     * 加载用户偏好
     */
    private loadUserPreferences(): void {
        try {
            const saved = localStorage.getItem('multimodal_preferences')
            if (saved) {
                const preferences = JSON.parse(saved)
                this.context.user.preferences = preferences

                // 更新行为数据
                if (preferences.modalityPreference) {
                    this.context.user.behavior.modalityPreference = {
                        ...this.context.user.behavior.modalityPreference,
                        ...preferences.modalityPreference
                    }
                }
            }
        } catch (error) {
            console.error('加载用户偏好失败:', error)
        }
    }

    /**
     * 保存用户偏好
     */
    private saveUserPreferences(): void {
        try {
            localStorage.setItem(
                'multimodal_preferences',
                JSON.stringify(this.context.user.preferences)
            )
        } catch (error) {
            console.error('保存用户偏好失败:', error)
        }
    }

    /**
     * 设置默认融合规则
     */
    private setupDefaultFusionRules(): void {
        // 规则1：语音 + 手势（例如："放在这里" + 拖动手势）
        this.addFusionRule({
            id: 'voice-gesture-place',
            name: '语音手势放置',
            priority: 1,
            condition: (events, context) => {
                const hasVoice = events.some(e => e.modality === 'voice' &&
                    e.data?.transcript?.includes?.('放') ||
                    e.data?.transcript?.includes?.('这里'))
                const hasGesture = events.some(e => e.modality === 'gesture' &&
                    e.type === 'drag_end')
                return hasVoice && hasGesture && events.length === 2
            },
            action: (events, context) => {
                const voiceEvent = events.find(e => e.modality === 'voice')!
                const gestureEvent = events.find(e => e.modality === 'gesture')!

                return {
                    id: `fusion-${Date.now()}`,
                    timestamp: Date.now(),
                    modalities: ['voice', 'gesture'],
                    confidence: (voiceEvent.confidence + gestureEvent.confidence) / 2,
                    intent: 'place_object',
                    parameters: {
                        position: gestureEvent.data.position,
                        object: this.extractObjectFromSpeech(voiceEvent.data.transcript),
                        method: 'drag_and_drop'
                    },
                    rawEvents: events,
                    context: { ...context }
                }
            }
        })

        // 规则2：触摸 + 语音选择（例如："这个" + 点击）
        this.addFusionRule({
            id: 'touch-voice-select',
            name: '触摸语音选择',
            priority: 2,
            condition: (events, context) => {
                const hasTouch = events.some(e => e.modality === 'touch' &&
                    e.type === 'tap')
                const hasVoice = events.some(e => e.modality === 'voice' &&
                    (e.data?.transcript?.includes?.('这个') ||
                        e.data?.transcript?.includes?.('那个')))
                return hasTouch && hasVoice && events.length === 2
            },
            action: (events, context) => {
                const touchEvent = events.find(e => e.modality === 'touch')!
                const voiceEvent = events.find(e => e.modality === 'voice')!

                return {
                    id: `fusion-${Date.now()}`,
                    timestamp: Date.now(),
                    modalities: ['touch', 'voice'],
                    confidence: (touchEvent.confidence + voiceEvent.confidence) / 2,
                    intent: 'select_object',
                    parameters: {
                        position: touchEvent.data.position,
                        reference: this.extractReferenceFromSpeech(voiceEvent.data.transcript),
                        target: this.identifyTargetAtPosition(touchEvent.data.position)
                    },
                    rawEvents: events,
                    context: { ...context }
                }
            }
        })

        // 规则3：键盘快捷键 + 语音确认
        this.addFusionRule({
            id: 'keyboard-voice-confirm',
            name: '键盘语音确认',
            priority: 3,
            condition: (events, context) => {
                const hasKeyboard = events.some(e => e.modality === 'keyboard' &&
                    e.type === 'shortcut')
                const hasVoice = events.some(e => e.modality === 'voice' &&
                    (e.data?.transcript?.includes?.('确认') ||
                        e.data?.transcript?.includes?.('是的')))
                return hasKeyboard && hasVoice && events.length === 2
            },
            action: (events, context) => {
                const keyboardEvent = events.find(e => e.modality === 'keyboard')!
                const voiceEvent = events.find(e => e.modality === 'voice')!

                return {
                    id: `fusion-${Date.now()}`,
                    timestamp: Date.now(),
                    modalities: ['keyboard', 'voice'],
                    confidence: (keyboardEvent.confidence + voiceEvent.confidence) / 2,
                    intent: 'confirm_action',
                    parameters: {
                        action: keyboardEvent.data.action,
                        shortcut: keyboardEvent.data.shortcut,
                        confirmation: voiceEvent.data.transcript
                    },
                    rawEvents: events,
                    context: { ...context }
                }
            }
        })

        // 规则4：多手势组合（例如：捏合 + 旋转）
        this.addFusionRule({
            id: 'multi-gesture-transform',
            name: '多手势变换',
            priority: 1,
            condition: (events, context) => {
                const gestures = events.filter(e => e.modality === 'gesture')
                const hasPinch = gestures.some(g => g.type === 'pinch')
                const hasRotate = gestures.some(g => g.type === 'rotate')
                return hasPinch && hasRotate && gestures.length >= 2
            },
            action: (events, context) => {
                const pinchEvent = events.find(e => e.type === 'pinch')!
                const rotateEvent = events.find(e => e.type === 'rotate')!

                return {
                    id: `fusion-${Date.now()}`,
                    timestamp: Date.now(),
                    modalities: ['gesture'],
                    confidence: Math.min(pinchEvent.confidence, rotateEvent.confidence),
                    intent: 'transform_object',
                    parameters: {
                        scale: pinchEvent.data.scale,
                        rotation: rotateEvent.data.rotation,
                        center: pinchEvent.data.center || rotateEvent.data.center
                    },
                    rawEvents: events,
                    context: { ...context }
                }
            }
        })
    }

    /**
     * 添加融合规则
     */
    addFusionRule(rule: FusionRule): void {
        this.fusionRules.push(rule)
        this.fusionRules.sort((a, b) => b.priority - a.priority) // 按优先级排序

        this.emit('rule-added', {
            ruleId: rule.id,
            priority: rule.priority,
            timestamp: Date.now()
        })
    }

    /**
     * 注册模态处理器
     */
    registerModalityHandler(modality: InputModality, handler: Function): void {
        this.modalityHandlers.set(modality, handler)

        this.emit('handler-registered', {
            modality,
            timestamp: Date.now()
        })
    }

    /**
     * 处理输入事件
     */
    async processInput(event: InputEvent): Promise<void> {
        // 验证事件
        if (!this.validateEvent(event)) {
            return
        }

        // 更新统计
        this.statistics.totalEvents[event.modality]++
        this.context.session.modalityUsage[event.modality]++

        // 发射原始事件
        this.emit('raw-input', event)

        // 添加到缓冲区
        this.addToBuffer(event)

        // 尝试融合事件
        await this.attemptFusion(event)

        // 学习用户行为
        this.learnFromEvent(event)
    }

    /**
     * 验证事件
     */
    private validateEvent(event: InputEvent): boolean {
        const config = this.config.modalities[event.modality]

        if (!config || !config.enabled) {
            console.warn(`模态 ${event.modality} 已禁用`)
            return false
        }

        if (event.confidence < config.confidenceThreshold) {
            console.warn(`事件置信度过低: ${event.confidence} < ${config.confidenceThreshold}`)
            return false
        }

        return true
    }

    /**
     * 添加到缓冲区
     */
    private addToBuffer(event: InputEvent): void {
        const key = this.getBufferKey(event)

        if (!this.eventBuffer.has(key)) {
            this.eventBuffer.set(key, [])
        }

        const buffer = this.eventBuffer.get(key)!
        buffer.push(event)

        // 限制缓冲区大小
        if (buffer.length > 10) {
            buffer.shift()
        }

        // 设置超时清理
        setTimeout(() => {
            this.cleanBuffer(key, event.timestamp)
        }, this.config.timeout)
    }

    /**
     * 获取缓冲区键
     */
    private getBufferKey(event: InputEvent): string {
        // 基于时间和模态创建键
        const timeWindow = Math.floor(event.timestamp / 1000) // 每秒钟一个窗口
        return `${event.modality}-${timeWindow}`
    }

    /**
     * 清理缓冲区
     */
    private cleanBuffer(key: string, timestamp: number): void {
        if (!this.eventBuffer.has(key)) return

        const buffer = this.eventBuffer.get(key)!
        const now = Date.now()

        // 移除超时事件
        const validEvents = buffer.filter(e => now - e.timestamp <= this.config.timeout)

        if (validEvents.length === 0) {
            this.eventBuffer.delete(key)
        } else {
            this.eventBuffer.set(key, validEvents)
        }
    }

    /**
     * 尝试融合事件
     */
    private async attemptFusion(triggerEvent: InputEvent): Promise<void> {
        // 收集相关事件
        const relatedEvents = this.collectRelatedEvents(triggerEvent)

        if (relatedEvents.length <= 1) {
            // 单个事件，直接处理
            await this.processSingleEvent(triggerEvent)
            return
        }

        // 检查融合规则
        for (const rule of this.fusionRules) {
            if (rule.condition(relatedEvents, this.context)) {
                try {
                    const fusedInput = rule.action(relatedEvents, this.context)
                    await this.processFusedInput(fusedInput)
                    return
                } catch (error) {
                    console.error(`融合规则 ${rule.id} 执行失败:`, error)
                    continue
                }
            }
        }

        // 如果没有匹配的规则，尝试基于上下文的融合
        const contextualFusion = this.attemptContextualFusion(relatedEvents)
        if (contextualFusion) {
            await this.processFusedInput(contextualFusion)
            return
        }

        // 处理冲突
        await this.resolveModalityConflict(relatedEvents)
    }

    /**
     * 收集相关事件
     */
    private collectRelatedEvents(triggerEvent: InputEvent): InputEvent[] {
        const now = Date.now()
        const relatedEvents: InputEvent[] = [triggerEvent]

        // 从所有缓冲区收集相关事件
        for (const [key, events] of this.eventBuffer.entries()) {
            const relevant = events.filter(e =>
                now - e.timestamp <= this.config.timeout &&
                this.areEventsRelated(triggerEvent, e)
            )
            relatedEvents.push(...relevant)
        }

        // 去重并按时间排序
        const uniqueEvents = Array.from(
            new Map(relatedEvents.map(e => [e.id, e])).values()
        ).sort((a, b) => a.timestamp - b.timestamp)

        return uniqueEvents
    }

    /**
     * 判断事件是否相关
     */
    private areEventsRelated(event1: InputEvent, event2: InputEvent): boolean {
        if (event1.id === event2.id) return false

        // 时间接近性
        const timeDiff = Math.abs(event1.timestamp - event2.timestamp)
        if (timeDiff > this.config.timeout) return false

        // 空间接近性（如果有位置信息）
        if (event1.data?.position && event2.data?.position) {
            const distance = this.calculateDistance(
                event1.data.position,
                event2.data.position
            )
            if (distance > 100) return false // 100像素阈值
        }

        // 语义相关性
        if (this.areSemanticallyRelated(event1, event2)) {
            return true
        }

        // 模态兼容性
        return this.areModalitiesCompatible(event1.modality, event2.modality)
    }

    /**
     * 计算距离
     */
    private calculateDistance(pos1: { x: number; y: number }, pos2: { x: number; y: number }): number {
        return Math.sqrt(
            Math.pow(pos1.x - pos2.x, 2) +
            Math.pow(pos1.y - pos2.y, 2)
        )
    }

    /**
     * 判断语义相关性
     */
    private areSemanticallyRelated(event1: InputEvent, event2: InputEvent): boolean {
        // 简化实现：检查是否有共同的关键词或意图
        const keywords1 = this.extractKeywords(event1)
        const keywords2 = this.extractKeywords(event2)

        const intersection = keywords1.filter(k => keywords2.includes(k))
        return intersection.length > 0
    }

    /**
     * 提取关键词
     */
    private extractKeywords(event: InputEvent): string[] {
        const keywords: string[] = []

        if (event.modality === 'voice' && event.data?.transcript) {
            const transcript = event.data.transcript.toLowerCase()
            const commonWords = ['创建', '关闭', '移动', '放大', '缩小', '选择', '删除']
            keywords.push(...commonWords.filter(word => transcript.includes(word)))
        }

        if (event.type.includes('create')) keywords.push('create')
        if (event.type.includes('delete')) keywords.push('delete')
        if (event.type.includes('move')) keywords.push('move')
        if (event.type.includes('select')) keywords.push('select')

        return [...new Set(keywords)] // 去重
    }

    /**
     * 判断模态兼容性
     */
    private areModalitiesCompatible(modality1: InputModality, modality2: InputModality): boolean {
        const compatiblePairs: [InputModality, InputModality][] = [
            ['voice', 'gesture'],
            ['voice', 'touch'],
            ['gesture', 'touch'],
            ['keyboard', 'mouse'],
            ['pen', 'touch']
        ]

        return compatiblePairs.some(
            ([m1, m2]) =>
                (modality1 === m1 && modality2 === m2) ||
                (modality1 === m2 && modality2 === m1)
        )
    }

    /**
     * 处理单个事件
     */
    private async processSingleEvent(event: InputEvent): Promise<void> {
        const handler = this.modalityHandlers.get(event.modality)
        if (!handler) {
            console.warn(`没有找到 ${event.modality} 的处理器`)
            return
        }

        try {
            const result = await handler(event)

            this.emit('single-processed', {
                event,
                result,
                timestamp: Date.now()
            })

            // 记录学习数据
            this.recordLearningOutcome({
                input: {
                    id: `single-${event.id}`,
                    timestamp: event.timestamp,
                    modalities: [event.modality],
                    confidence: event.confidence,
                    intent: event.type,
                    parameters: event.data,
                    rawEvents: [event],
                    context: { ...this.context }
                },
                outcome: result.success ? 'success' : 'failure',
                feedback: result,
                timestamp: Date.now()
            })

        } catch (error) {
            console.error(`处理单个事件失败:`, error)
            this.emit('processing-error', {
                event,
                error,
                timestamp: Date.now()
            })
        }
    }

    /**
     * 尝试上下文融合
     */
    private attemptContextualFusion(events: InputEvent[]): FusedInput | null {
        if (events.length < 2) return null

        // 基于上下文和权重的融合
        const modalities = [...new Set(events.map(e => e.modality))]
        const confidence = this.calculateFusionConfidence(events)

        if (confidence < 0.5) {
            return null
        }

        // 基于最近的任务猜测意图
        const intent = this.guessIntentFromContext(events)

        // 合并参数
        const parameters = this.mergeParameters(events)

        return {
            id: `contextual-fusion-${Date.now()}`,
            timestamp: Date.now(),
            modalities,
            confidence,
            intent,
            parameters,
            rawEvents: events,
            context: { ...this.context }
        }
    }

    /**
     * 计算融合置信度
     */
    private calculateFusionConfidence(events: InputEvent[]): number {
        let totalWeight = 0
        let weightedConfidence = 0

        events.forEach(event => {
            const config = this.config.modalities[event.modality]
            const weight = config?.weight || 0.1
            const modalityPref = this.context.user.behavior.modalityPreference[event.modality] || 0.1

            totalWeight += weight * modalityPref
            weightedConfidence += event.confidence * weight * modalityPref
        })

        return totalWeight > 0 ? weightedConfidence / totalWeight : 0
    }

    /**
     * 从上下文猜测意图
     */
    private guessIntentFromContext(events: InputEvent[]): string {
        const recentIntents = this.context.session.recentIntents
        if (recentIntents.length > 0) {
            // 如果最近有类似意图，优先使用
            const lastIntent = recentIntents[recentIntents.length - 1]
            const similarEvents = events.filter(e =>
                this.isRelatedToIntent(e, lastIntent)
            )
            if (similarEvents.length > events.length * 0.5) {
                return lastIntent
            }
        }

        // 基于事件类型猜测
        const typeCounts: Record<string, number> = {}
        events.forEach(event => {
            typeCounts[event.type] = (typeCounts[event.type] || 0) + 1
        })

        const maxType = Object.keys(typeCounts).reduce((a, b) =>
            typeCounts[a] > typeCounts[b] ? a : b
        )

        return this.mapTypeToIntent(maxType)
    }

    /**
     * 判断事件是否与意图相关
     */
    private isRelatedToIntent(event: InputEvent, intent: string): boolean {
        const intentKeywords: Record<string, string[]> = {
            'create_popup': ['创建', '新建', '添加', 'create', 'new'],
            'close_popup': ['关闭', '删除', '移除', 'close', 'delete'],
            'move_popup': ['移动', '拖动', 'move', 'drag'],
            'resize_popup': ['调整大小', '缩放', 'resize', 'scale'],
            'select_popup': ['选择', '点击', 'select', 'click']
        }

        const keywords = intentKeywords[intent] || []
        if (keywords.length === 0) return false

        // 检查语音
        if (event.modality === 'voice' && event.data?.transcript) {
            const transcript = event.data.transcript.toLowerCase()
            return keywords.some(keyword => transcript.includes(keyword))
        }

        // 检查事件类型
        const eventKeywords = this.extractKeywords(event)
        return eventKeywords.some(keyword =>
            keywords.includes(keyword)
        )
    }

    /**
     * 映射类型到意图
     */
    private mapTypeToIntent(type: string): string {
        const mapping: Record<string, string> = {
            'tap': 'select_popup',
            'double_tap': 'open_popup',
            'long_press': 'context_menu',
            'drag_start': 'move_popup',
            'drag_end': 'move_popup',
            'pinch_start': 'resize_popup',
            'pinch_end': 'resize_popup',
            'rotate': 'rotate_popup',
            'swipe': 'navigate',
            'create': 'create_popup',
            'delete': 'close_popup',
            'select': 'select_popup'
        }

        return mapping[type] || 'unknown'
    }

    /**
     * 合并参数
     */
    private mergeParameters(events: InputEvent[]): Record<string, any> {
        const parameters: Record<string, any> = {}

        events.forEach(event => {
            if (event.data) {
                // 合并策略：后到的事件覆盖先到的
                Object.assign(parameters, event.data)
            }
        })

        // 特殊处理位置参数
        if (parameters.position && Array.isArray(parameters.position)) {
            // 如果是多个位置，取平均值
            const positions = parameters.position.filter((p: any) => p && p.x && p.y)
            if (positions.length > 1) {
                const avgX = positions.reduce((sum: number, p: any) => sum + p.x, 0) / positions.length
                const avgY = positions.reduce((sum: number, p: any) => sum + p.y, 0) / positions.length
                parameters.position = { x: avgX, y: avgY }
            }
        }

        return parameters
    }

    /**
     * 处理融合输入
     */
    private async processFusedInput(fusedInput: FusedInput): Promise<void> {
        const startTime = Date.now()

        try {
            // 发射融合事件
            this.emit('fused-input', fusedInput)

            // 更新上下文
            this.context.session.recentIntents.push(fusedInput.intent)
            if (this.context.session.recentIntents.length > 10) {
                this.context.session.recentIntents.shift()
            }

            // 保存到历史
            this.history.push(fusedInput)
            if (this.history.length > this.config.maxHistorySize) {
                this.history.shift()
            }

            // 更新统计
            this.statistics.successfulFusions++
            const fusionTime = Date.now() - startTime
            this.statistics.averageFusionTime =
                (this.statistics.averageFusionTime * (this.statistics.successfulFusions - 1) + fusionTime) /
                this.statistics.successfulFusions

            // 清除已使用的事件
            this.clearUsedEvents(fusedInput.rawEvents)

            // 记录学习数据
            this.recordLearningOutcome({
                input: fusedInput,
                outcome: 'success',
                timestamp: Date.now()
            })

            // 如果需要确认，发射确认事件
            if (this.config.requireConfirmation && fusedInput.confidence < 0.8) {
                this.emit('confirmation-required', {
                    fusedInput,
                    message: '请确认是否执行此操作？',
                    timestamp: Date.now()
                })
            } else {
                // 直接执行
                await this.executeFusedInput(fusedInput)
            }

        } catch (error) {
            console.error('处理融合输入失败:', error)

            this.statistics.failedFusions++

            this.emit('fusion-error', {
                fusedInput,
                error,
                timestamp: Date.now()
            })

            // 记录失败
            this.recordLearningOutcome({
                input: fusedInput,
                outcome: 'failure',
                feedback: { error: error.message },
                timestamp: Date.now()
            })
        }
    }

    /**
     * 执行融合输入
     */
    private async executeFusedInput(fusedInput: FusedInput): Promise<void> {
        // 查找合适的执行器
        const executor = this.findExecutorForIntent(fusedInput.intent)

        if (!executor) {
            throw new Error(`找不到执行器处理意图: ${fusedInput.intent}`)
        }

        const result = await executor(fusedInput)

        this.emit('execution-completed', {
            fusedInput,
            result,
            timestamp: Date.now()
        })
    }

    /**
     * 查找意图执行器
     */
    private findExecutorForIntent(intent: string): Function | null {
        // 在实际应用中，这里应该查找注册的执行器
        // 暂时返回一个模拟执行器
        return async (fusedInput: FusedInput) => {
            console.log(`执行意图: ${intent}`, fusedInput.parameters)
            return { success: true, intent }
        }
    }

    /**
     * 清除已使用的事件
     */
    private clearUsedEvents(events: InputEvent[]): void {
        events.forEach(event => {
            const key = this.getBufferKey(event)
            if (this.eventBuffer.has(key)) {
                const buffer = this.eventBuffer.get(key)!
                const index = buffer.findIndex(e => e.id === event.id)
                if (index > -1) {
                    buffer.splice(index, 1)
                }
                if (buffer.length === 0) {
                    this.eventBuffer.delete(key)
                }
            }
        })
    }

    /**
     * 解决模态冲突
     */
    private async resolveModalityConflict(events: InputEvent[]): Promise<void> {
        this.statistics.modalityConflicts++

        // 按优先级排序
        const sortedEvents = [...events].sort((a, b) => {
            const priorityA = this.config.modalities[a.modality]?.priority || 0
            const priorityB = this.config.modalities[b.modality]?.priority || 0
            return priorityB - priorityA
        })

        // 选择最高优先级的事件
        const primaryEvent = sortedEvents[0]

        this.emit('modality-conflict', {
            events,
            primaryEvent,
            resolved: true,
            timestamp: Date.now()
        })

        // 处理主要事件
        await this.processSingleEvent(primaryEvent)
    }

    /**
     * 从事件学习
     */
    private learnFromEvent(event: InputEvent): void {
        if (!this.config.enableLearning) return

        // 更新模态偏好
        const currentPref = this.context.user.behavior.modalityPreference[event.modality]
        const newPref = currentPref * 0.9 + 0.1 // 逐渐增加
        this.context.user.behavior.modalityPreference[event.modality] = newPref

        // 更新平均置信度
        const currentAvg = this.context.user.behavior.averageConfidence[event.modality]
        const newAvg = currentAvg * 0.9 + event.confidence * 0.1
        this.context.user.behavior.averageConfidence[event.modality] = newAvg

        // 保存更新
        this.saveUserPreferences()
    }

    /**
     * 记录学习结果
     */
    private recordLearningOutcome(data: {
        input: FusedInput
        outcome: 'success' | 'partial' | 'failure'
        feedback?: any
        timestamp: number
    }): void {
        if (!this.config.enableLearning) return

        this.learningData.push(data)

        // 限制学习数据大小
        if (this.learningData.length > 1000) {
            this.learningData.shift()
        }

        // 定期保存
        if (this.learningData.length % 100 === 0) {
            this.saveLearningData()
        }
    }

    /**
     * 保存学习数据
     */
    private saveLearningData(): void {
        try {
            localStorage.setItem(
                'multimodal_learning_data',
                JSON.stringify(this.learningData.slice(-500)) // 只保存最近的500条
            )
        } catch (error) {
            console.error('保存学习数据失败:', error)
        }
    }

    /**
     * 提取语音中的对象
     */
    private extractObjectFromSpeech(transcript: string): string {
        const objects = ['弹窗', '窗口', '文件', '图片', '文本', '按钮', '菜单']
        for (const obj of objects) {
            if (transcript.includes(obj)) {
                return obj
            }
        }
        return '对象'
    }

    /**
     * 提取语音中的引用
     */
    private extractReferenceFromSpeech(transcript: string): string {
        if (transcript.includes('这个')) return 'this'
        if (transcript.includes('那个')) return 'that'
        if (transcript.includes('这里')) return 'here'
        if (transcript.includes('那里')) return 'there'
        return 'unknown'
    }

    /**
     * 识别位置处的目标
     */
    private identifyTargetAtPosition(position: { x: number; y: number }): string | null {
        // 在实际应用中，这里应该查找DOM元素
        const element = document.elementFromPoint(position.x, position.y)
        return element?.getAttribute?.('data-popup-id') || null
    }

    /**
     * 启动清理任务
     */
    private startCleanupTask(): void {
        setInterval(() => {
            this.cleanupOldBuffers()
        }, 5000) // 每5秒清理一次
    }

    /**
     * 清理旧缓冲区
     */
    private cleanupOldBuffers(): void {
        const now = Date.now()
        const oldKeys: string[] = []

        this.eventBuffer.forEach((events, key) => {
            const oldestEvent = events[0]
            if (oldestEvent && now - oldestEvent.timestamp > this.config.timeout * 2) {
                oldKeys.push(key)
            }
        })

        oldKeys.forEach(key => this.eventBuffer.delete(key))

        if (oldKeys.length > 0) {
            console.log(`清理了 ${oldKeys.length} 个旧缓冲区`)
        }
    }

    /**
     * 获取状态
     */
    getStatus() {
        return {
            config: this.config,
            context: this.context,
            statistics: this.statistics,
            bufferSize: Array.from(this.eventBuffer.values()).reduce((sum, events) => sum + events.length, 0),
            historySize: this.history.length,
            learningDataSize: this.learningData.length,
            activeFusions: this.activeFusions.size
        }
    }

    /**
     * 获取历史
     */
    getHistory(limit?: number): FusedInput[] {
        const sorted = [...this.history].sort((a, b) => b.timestamp - a.timestamp)
        return limit ? sorted.slice(0, limit) : sorted
    }

    /**
     * 获取学习数据
     */
    getLearningData(limit?: number): any[] {
        const sorted = [...this.learningData].sort((a, b) => b.timestamp - a.timestamp)
        return limit ? sorted.slice(0, limit) : sorted
    }

    /**
     * 清空历史
     */
    clearHistory(): void {
        this.history = []
        this.learningData = []
        this.eventBuffer.clear()
    }

    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<MultimodalConfig>): void {
        this.config = { ...this.config, ...newConfig }

        this.emit('config-updated', {
            config: this.config,
            timestamp: Date.now()
        })
    }

    /**
     * 销毁
     */
    destroy(): void {
        this.saveUserPreferences()
        this.saveLearningData()
        this.clearHistory()
        this.activeFusions.forEach(fusion => clearTimeout(fusion.timeout))
        this.activeFusions.clear()
    }
}