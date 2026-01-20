/**
 * @file AdaptiveInteractionManager.ts
 * @description 自适应交互模式管理器 - 根据用户行为和上下文调整交互方式
 */

import { InputModality, ContextState } from './MultimodalProtocol'

export interface InteractionMode {
    id: string
    name: string
    description: string
    modalities: InputModality[]
    priority: number
    enabled: boolean
    conditions: (context: ContextState) => boolean
    configuration: Record<string, any>
}

export interface AdaptationRule {
    id: string
    name: string
    condition: (context: ContextState, history: any[]) => boolean
    action: (context: ContextState) => void
    priority: number
}

export interface UserProfile {
    id?: string
    modalityPreferences: Record<InputModality, number>
    interactionPatterns: Array<{
        pattern: string
        frequency: number
        successRate: number
        lastUsed: number
    }>
    learningRate: number
    adaptationLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
}

export class AdaptiveInteractionManager {
    private interactionModes: Map<string, InteractionMode> = new Map()
    private adaptationRules: AdaptationRule[] = []
    private userProfile: UserProfile
    private currentMode: string = 'balanced'
    private modeHistory: Array<{
        mode: string
        startTime: number
        endTime?: number
        reason: string
    }> = []
    private adaptationHistory: Array<{
        rule: string
        timestamp: number
        context: ContextState
        result: any
    }> = []
    private learningEnabled: boolean = true
    private predictionModel: any = null

    constructor() {
        this.initializeUserProfile()
        this.setupDefaultModes()
        this.setupAdaptationRules()
        this.startAdaptationMonitoring()
    }

    /**
     * 初始化用户档案
     */
    private initializeUserProfile(): void {
        this.userProfile = {
            modalityPreferences: {
                voice: 0.3,
                gesture: 0.25,
                touch: 0.2,
                keyboard: 0.15,
                mouse: 0.1,
                pen: 0,
                gaze: 0
            },
            interactionPatterns: [],
            learningRate: 0.1,
            adaptationLevel: 'intermediate'
        }

        this.loadUserProfile()
    }

    /**
     * 加载用户档案
     */
    private loadUserProfile(): void {
        try {
            const saved = localStorage.getItem('adaptive_interaction_profile')
            if (saved) {
                const profile = JSON.parse(saved)
                this.userProfile = { ...this.userProfile, ...profile }
            }
        } catch (error) {
            console.error('加载用户档案失败:', error)
        }
    }

    /**
     * 保存用户档案
     */
    private saveUserProfile(): void {
        try {
            localStorage.setItem(
                'adaptive_interaction_profile',
                JSON.stringify(this.userProfile)
            )
        } catch (error) {
            console.error('保存用户档案失败:', error)
        }
    }

    /**
     * 设置默认交互模式
     */
    private setupDefaultModes(): void {
        // 均衡模式（默认）
        this.addInteractionMode({
            id: 'balanced',
            name: '均衡模式',
            description: '平衡所有输入方式，适合大多数用户',
            modalities: ['voice', 'gesture', 'touch', 'keyboard', 'mouse'],
            priority: 1,
            enabled: true,
            conditions: (context) => true,
            configuration: {
                voice: { enabled: true, weight: 0.3 },
                gesture: { enabled: true, weight: 0.25 },
                touch: { enabled: true, weight: 0.2 },
                keyboard: { enabled: true, weight: 0.15 },
                mouse: { enabled: true, weight: 0.1 }
            }
        })

        // 语音优先模式
        this.addInteractionMode({
            id: 'voice-first',
            name: '语音优先',
            description: '优先使用语音控制，适合需要快速操作的场景',
            modalities: ['voice', 'gesture', 'touch'],
            priority: 2,
            enabled: true,
            conditions: (context) =>
                context.environment.deviceType === 'mobile' ||
                context.user.behavior.modalityPreference.voice > 0.4,
            configuration: {
                voice: { enabled: true, weight: 0.5 },
                gesture: { enabled: true, weight: 0.3 },
                touch: { enabled: true, weight: 0.2 },
                keyboard: { enabled: false },
                mouse: { enabled: false }
            }
        })

        // 手势优先模式
        this.addInteractionMode({
            id: 'gesture-first',
            name: '手势优先',
            description: '优先使用手势控制，适合触屏设备',
            modalities: ['gesture', 'touch', 'voice'],
            priority: 2,
            enabled: true,
            conditions: (context) =>
                context.environment.deviceType === 'mobile' ||
                context.environment.deviceType === 'tablet' ||
                context.user.behavior.modalityPreference.gesture > 0.4,
            configuration: {
                voice: { enabled: true, weight: 0.2 },
                gesture: { enabled: true, weight: 0.5 },
                touch: { enabled: true, weight: 0.3 },
                keyboard: { enabled: false },
                mouse: { enabled: false }
            }
        })

        // 键盘优先模式
        this.addInteractionMode({
            id: 'keyboard-first',
            name: '键盘优先',
            description: '优先使用键盘控制，适合生产力场景',
            modalities: ['keyboard', 'mouse', 'voice'],
            priority: 2,
            enabled: true,
            conditions: (context) =>
                context.environment.deviceType === 'desktop' &&
                context.user.behavior.modalityPreference.keyboard > 0.4,
            configuration: {
                voice: { enabled: true, weight: 0.1 },
                gesture: { enabled: false },
                touch: { enabled: false },
                keyboard: { enabled: true, weight: 0.6 },
                mouse: { enabled: true, weight: 0.3 }
            }
        })

        // 无障碍模式
        this.addInteractionMode({
            id: 'accessibility',
            name: '无障碍模式',
            description: '优化无障碍访问，支持语音和简化交互',
            modalities: ['voice', 'keyboard'],
            priority: 3,
            enabled: true,
            conditions: (context) =>
                context.user.preferences?.accessibility === true ||
                context.environment.network === 'slow',
            configuration: {
                voice: { enabled: true, weight: 0.7 },
                gesture: { enabled: false },
                touch: { enabled: false },
                keyboard: { enabled: true, weight: 0.3 },
                mouse: { enabled: false },
                gaze: { enabled: context.environment.inputCapabilities.includes('gaze') }
            }
        })

        // 多模态专家模式
        this.addInteractionMode({
            id: 'expert',
            name: '专家模式',
            description: '支持所有输入方式，适合高级用户',
            modalities: ['voice', 'gesture', 'touch', 'keyboard', 'mouse', 'pen', 'gaze'],
            priority: 1,
            enabled: true,
            conditions: (context) =>
                this.userProfile.adaptationLevel === 'expert' ||
                context.user.behavior.successRate.voice > 0.9,
            configuration: {
                voice: { enabled: true, weight: 0.2 },
                gesture: { enabled: true, weight: 0.2 },
                touch: { enabled: true, weight: 0.2 },
                keyboard: { enabled: true, weight: 0.2 },
                mouse: { enabled: true, weight: 0.1 },
                pen: { enabled: true, weight: 0.05 },
                gaze: { enabled: true, weight: 0.05 }
            }
        })
    }

    /**
     * 添加交互模式
     */
    addInteractionMode(mode: InteractionMode): void {
        this.interactionModes.set(mode.id, mode)
    }

    /**
     * 设置适应规则
     */
    private setupAdaptationRules(): void {
        // 规则1：根据设备类型适应
        this.addAdaptationRule({
            id: 'device-adaptation',
            name: '设备适应',
            priority: 1,
            condition: (context, history) => {
                const lastMode = history[history.length - 1]
                if (!lastMode) return true

                const mode = this.interactionModes.get(lastMode.mode)
                if (!mode) return true

                // 检查当前模式是否适合设备
                const isMobile = context.environment.deviceType === 'mobile'
                const isTablet = context.environment.deviceType === 'tablet'
                const isDesktop = context.environment.deviceType === 'desktop'

                if (isMobile && !mode.modalities.includes('touch')) return true
                if (isDesktop && !mode.modalities.includes('keyboard')) return true

                return false
            },
            action: (context) => {
                let newMode = 'balanced'

                switch (context.environment.deviceType) {
                    case 'mobile':
                        newMode = 'gesture-first'
                        break
                    case 'tablet':
                        newMode = 'balanced'
                        break
                    case 'desktop':
                        newMode = 'keyboard-first'
                        break
                }

                this.switchMode(newMode, '设备类型适应')
            }
        })

        // 规则2：根据用户偏好适应
        this.addAdaptationRule({
            id: 'preference-adaptation',
            name: '偏好适应',
            priority: 2,
            condition: (context, history) => {
                const preferences = context.user.behavior.modalityPreference
                const maxPrefModality = Object.entries(preferences).reduce((a, b) =>
                    a[1] > b[1] ? a : b
                )[0] as InputModality

                const currentMode = this.interactionModes.get(this.currentMode)
                if (!currentMode) return true

                // 检查当前模式是否支持用户偏好的模态
                return !currentMode.modalities.includes(maxPrefModality)
            },
            action: (context) => {
                const preferences = context.user.behavior.modalityPreference
                const maxPrefModality = Object.entries(preferences).reduce((a, b) =>
                    a[1] > b[1] ? a : b
                )[0] as InputModality

                // 查找支持该模态的模式
                for (const [modeId, mode] of this.interactionModes.entries()) {
                    if (mode.enabled && mode.modalities.includes(maxPrefModality)) {
                        this.switchMode(modeId, '用户偏好适应')
                        break
                    }
                }
            }
        })

        // 规则3：根据成功率适应
        this.addAdaptationRule({
            id: 'success-adaptation',
            name: '成功率适应',
            priority: 3,
            condition: (context, history) => {
                const successRates = context.user.behavior.successRate

                // 检查是否有模态成功率过低
                const lowSuccessModalities = Object.entries(successRates)
                    .filter(([_, rate]) => rate < 0.5)
                    .map(([modality]) => modality as InputModality)

                if (lowSuccessModalities.length === 0) return false

                const currentMode = this.interactionModes.get(this.currentMode)
                if (!currentMode) return true

                // 检查当前模式是否包含低成功率模态
                return lowSuccessModalities.some(modality =>
                    currentMode.modalities.includes(modality)
                )
            },
            action: (context) => {
                const successRates = context.user.behavior.successRate
                const highSuccessModalities = Object.entries(successRates)
                    .filter(([_, rate]) => rate > 0.7)
                    .map(([modality]) => modality as InputModality)

                if (highSuccessModalities.length === 0) return

                // 查找支持高成功率模态的模式
                for (const [modeId, mode] of this.interactionModes.entries()) {
                    if (!mode.enabled) continue

                    const supportsHighSuccess = highSuccessModalities.some(modality =>
                        mode.modalities.includes(modality)
                    )

                    if (supportsHighSuccess) {
                        this.switchMode(modeId, '成功率优化')
                        break
                    }
                }
            }
        })

        // 规则4：根据网络状况适应
        this.addAdaptationRule({
            id: 'network-adaptation',
            name: '网络适应',
            priority: 4,
            condition: (context, history) => {
                if (context.environment.network === 'slow') {
                    const currentMode = this.interactionModes.get(this.currentMode)
                    return currentMode?.id !== 'accessibility'
                }
                return false
            },
            action: () => {
                this.switchMode('accessibility', '网络状况适应')
            }
        })

        // 规则5：根据任务复杂度适应
        this.addAdaptationRule({
            id: 'task-complexity-adaptation',
            name: '任务复杂度适应',
            priority: 2,
            condition: (context, history) => {
                if (!context.session.currentTask) return false

                const task = context.session.currentTask.toLowerCase()
                const isComplex = task.includes('edit') ||
                    task.includes('create') ||
                    task.includes('arrange')

                if (isComplex && this.currentMode === 'voice-first') {
                    return true
                }

                return false
            },
            action: () => {
                this.switchMode('expert', '复杂任务适应')
            }
        })
    }

    /**
     * 添加适应规则
     */
    addAdaptationRule(rule: AdaptationRule): void {
        this.adaptationRules.push(rule)
        this.adaptationRules.sort((a, b) => b.priority - a.priority)
    }

    /**
     * 启动适应监控
     */
    private startAdaptationMonitoring(): void {
        setInterval(() => {
            this.evaluateAdaptation()
        }, 10000) // 每10秒评估一次
    }

    /**
     * 评估适应
     */
    evaluateAdaptation(context?: ContextState): void {
        const evaluationContext = context || this.getDefaultContext()
        const recentHistory = this.modeHistory.slice(-10)

        // 应用适应规则
        for (const rule of this.adaptationRules) {
            if (rule.condition(evaluationContext, recentHistory)) {
                try {
                    rule.action(evaluationContext)

                    this.adaptationHistory.push({
                        rule: rule.id,
                        timestamp: Date.now(),
                        context: evaluationContext,
                        result: { switchedTo: this.currentMode }
                    })

                    break // 只应用一个规则
                } catch (error) {
                    console.error(`适应规则 ${rule.id} 执行失败:`, error)
                }
            }
        }
    }

    /**
     * 获取默认上下文
     */
    private getDefaultContext(): ContextState {
        return {
            user: {
                preferences: this.userProfile.modalityPreferences,
                behavior: {
                    modalityPreference: this.userProfile.modalityPreferences,
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

        if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
            capabilities.push('touch')
        }

        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            capabilities.push('voice')
        }

        if (window.PointerEvent && 'maxTouchPoints' in navigator) {
            capabilities.push('pen')
        }

        if ('getUserMedia' in navigator.mediaDevices) {
            capabilities.push('gaze')
        }

        return capabilities
    }

    /**
     * 切换模式
     */
    switchMode(modeId: string, reason: string): boolean {
        const mode = this.interactionModes.get(modeId)
        if (!mode || !mode.enabled) {
            console.warn(`交互模式 ${modeId} 不可用`)
            return false
        }

        // 结束当前模式
        if (this.modeHistory.length > 0) {
            const lastEntry = this.modeHistory[this.modeHistory.length - 1]
            if (!lastEntry.endTime) {
                lastEntry.endTime = Date.now()
            }
        }

        // 开始新模式
        this.currentMode = modeId
        this.modeHistory.push({
            mode: modeId,
            startTime: Date.now(),
            reason
        })

        // 限制历史大小
        if (this.modeHistory.length > 50) {
            this.modeHistory.shift()
        }

        // 发射模式切换事件
        this.emit('mode-switched', {
            oldMode: this.modeHistory.length > 1 ? this.modeHistory[this.modeHistory.length - 2].mode : null,
            newMode: modeId,
            reason,
            timestamp: Date.now()
        })

        console.log(`交互模式切换为: ${mode.name} (${reason})`)
        return true
    }

    /**
     * 获取当前模式
     */
    getCurrentMode(): InteractionMode | null {
        return this.interactionModes.get(this.currentMode) || null
    }

    /**
     * 获取模式配置
     */
    getModeConfiguration(modeId?: string): Record<string, any> {
        const mode = modeId ? this.interactionModes.get(modeId) : this.getCurrentMode()
        return mode?.configuration || {}
    }

    /**
     * 更新用户行为
     */
    updateUserBehavior(
        modality: InputModality,
        success: boolean,
        confidence?: number
    ): void {
        if (!this.learningEnabled) return

        // 更新模态偏好
        const currentPref = this.userProfile.modalityPreferences[modality]
        const increment = success ? 0.05 : -0.02
        this.userProfile.modalityPreferences[modality] = Math.max(0, Math.min(1, currentPref + increment))

        // 更新交互模式
        const patternKey = `${modality}_${success ? 'success' : 'failure'}`
        const existingPattern = this.userProfile.interactionPatterns.find(
            p => p.pattern === patternKey
        )

        if (existingPattern) {
            existingPattern.frequency++
            existingPattern.successRate = success ?
                (existingPattern.successRate * (existingPattern.frequency - 1) + 1) / existingPattern.frequency :
                (existingPattern.successRate * (existingPattern.frequency - 1)) / existingPattern.frequency
            existingPattern.lastUsed = Date.now()
        } else {
            this.userProfile.interactionPatterns.push({
                pattern: patternKey,
                frequency: 1,
                successRate: success ? 1 : 0,
                lastUsed: Date.now()
            })
        }

        // 更新适应等级
        this.updateAdaptationLevel()

        // 保存更新
        this.saveUserProfile()

        // 触发适应评估
        this.evaluateAdaptation()
    }

    /**
     * 更新适应等级
     */
    private updateAdaptationLevel(): void {
        const totalInteractions = this.userProfile.interactionPatterns.reduce(
            (sum, p) => sum + p.frequency, 0
        )

        const successRate = this.userProfile.interactionPatterns.reduce(
            (sum, p) => sum + p.successRate * p.frequency, 0
        ) / totalInteractions

        const modalityDiversity = Object.values(this.userProfile.modalityPreferences)
            .filter(pref => pref > 0.1).length

        let newLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'

        if (totalInteractions < 10) {
            newLevel = 'beginner'
        } else if (successRate < 0.7 || modalityDiversity < 2) {
            newLevel = 'intermediate'
        } else if (successRate < 0.9 || modalityDiversity < 3) {
            newLevel = 'advanced'
        } else {
            newLevel = 'expert'
        }

        if (newLevel !== this.userProfile.adaptationLevel) {
            this.userProfile.adaptationLevel = newLevel

            this.emit('adaptation-level-changed', {
                oldLevel: this.userProfile.adaptationLevel,
                newLevel,
                timestamp: Date.now()
            })
        }
    }

    /**
     * 预测最佳模式
     */
    predictBestMode(context: ContextState): {
        mode: string
        confidence: number
        reasons: string[]
    } {
        const scores: Array<{
            modeId: string
            score: number
            reasons: string[]
        }> = []

        // 评估每个模式
        for (const [modeId, mode] of this.interactionModes.entries()) {
            if (!mode.enabled) continue

            let score = 0
            const reasons: string[] = []

            // 检查条件
            if (mode.conditions(context)) {
                score += 0.3
                reasons.push('满足基本条件')
            }

            // 设备匹配度
            const deviceScore = this.calculateDeviceMatch(mode, context)
            score += deviceScore * 0.2
            if (deviceScore > 0.5) {
                reasons.push('适合当前设备')
            }

            // 用户偏好匹配度
            const preferenceScore = this.calculatePreferenceMatch(mode, context)
            score += preferenceScore * 0.3
            if (preferenceScore > 0.5) {
                reasons.push('符合用户偏好')
            }

            // 历史表现
            const historyScore = this.calculateHistoryScore(modeId)
            score += historyScore * 0.2
            if (historyScore > 0.5) {
                reasons.push('历史表现良好')
            }

            scores.push({ modeId, score, reasons })
        }

        // 选择最高分
        scores.sort((a, b) => b.score - a.score)

        const best = scores[0]
        if (!best) {
            return {
                mode: 'balanced',
                confidence: 0.5,
                reasons: ['使用默认模式']
            }
        }

        return {
            mode: best.modeId,
            confidence: best.score,
            reasons: best.reasons.slice(0, 3)
        }
    }

    /**
     * 计算设备匹配度
     */
    private calculateDeviceMatch(mode: InteractionMode, context: ContextState): number {
        const { deviceType, inputCapabilities } = context.environment

        // 检查模式支持的模态是否在设备能力范围内
        const supportedModalities = mode.modalities.filter(modality =>
            inputCapabilities.includes(modality)
        )

        const modalityMatch = supportedModalities.length / mode.modalities.length

        // 设备类型权重
        let deviceWeight = 1
        switch (deviceType) {
            case 'mobile':
                if (mode.modalities.includes('touch')) deviceWeight = 1.2
                break
            case 'desktop':
                if (mode.modalities.includes('keyboard')) deviceWeight = 1.2
                break
        }

        return modalityMatch * deviceWeight
    }

    /**
     * 计算偏好匹配度
     */
    private calculatePreferenceMatch(mode: InteractionMode, context: ContextState): number {
        const preferences = context.user.behavior.modalityPreference

        let totalPreference = 0
        let totalWeight = 0

        mode.modalities.forEach(modality => {
            const preference = preferences[modality] || 0
            const config = mode.configuration[modality]
            const weight = config?.weight || 0.1

            totalPreference += preference * weight
            totalWeight += weight
        })

        return totalWeight > 0 ? totalPreference / totalWeight : 0
    }

    /**
     * 计算历史分数
     */
    private calculateHistoryScore(modeId: string): number {
        const modeHistory = this.modeHistory.filter(entry => entry.mode === modeId)
        if (modeHistory.length === 0) return 0.5

        // 计算平均使用时长
        const durations = modeHistory.map(entry =>
            (entry.endTime || Date.now()) - entry.startTime
        )
        const avgDuration = durations.reduce((sum, dur) => sum + dur, 0) / durations.length

        // 计算最近使用
        const lastUsed = modeHistory[modeHistory.length - 1].startTime
        const timeSinceLastUse = Date.now() - lastUsed

        // 归一化分数
        const durationScore = Math.min(1, avgDuration / 60000) // 1分钟基准
        const recencyScore = Math.max(0, 1 - timeSinceLastUse / 3600000) // 1小时衰减

        return (durationScore * 0.6 + recencyScore * 0.4)
    }

    /**
     * 获取建议
     */
    getSuggestions(context: ContextState): Array<{
        modality: InputModality
        suggestion: string
        priority: 'low' | 'medium' | 'high'
    }> {
        const suggestions: Array<{
            modality: InputModality
            suggestion: string
            priority: 'low' | 'medium' | 'high'
        }> = []

        const currentMode = this.getCurrentMode()
        if (!currentMode) return suggestions

        // 分析当前使用情况
        const usage = context.session.modalityUsage
        const totalUsage = Object.values(usage).reduce((sum, count) => sum + count, 0)

        if (totalUsage === 0) {
            // 初始建议
            suggestions.push({
                modality: currentMode.modalities[0],
                suggestion: `尝试使用${this.getModalityName(currentMode.modalities[0])}开始交互`,
                priority: 'high'
            })
            return suggestions
        }

        // 检查未充分利用的模态
        currentMode.modalities.forEach(modality => {
            const usageRatio = usage[modality] / totalUsage
            const expectedRatio = currentMode.configuration[modality]?.weight || 0.1

            if (usageRatio < expectedRatio * 0.5) {
                suggestions.push({
                    modality,
                    suggestion: `尝试更多使用${this.getModalityName(modality)}`,
                    priority: usageRatio === 0 ? 'high' : 'medium'
                })
            }
        })

        // 基于设备建议
        if (context.environment.deviceType === 'mobile') {
            if (!suggestions.some(s => s.modality === 'touch')) {
                suggestions.push({
                    modality: 'touch',
                    suggestion: '在移动设备上，触摸操作更加自然',
                    priority: 'medium'
                })
            }
        } else if (context.environment.deviceType === 'desktop') {
            if (!suggestions.some(s => s.modality === 'keyboard')) {
                suggestions.push({
                    modality: 'keyboard',
                    suggestion: '使用键盘快捷键可以提高效率',
                    priority: 'medium'
                })
            }
        }

        return suggestions.slice(0, 5) // 最多5条建议
    }

    /**
     * 获取模态名称
     */
    private getModalityName(modality: InputModality): string {
        const names: Record<InputModality, string> = {
            voice: '语音',
            gesture: '手势',
            touch: '触摸',
            keyboard: '键盘',
            mouse: '鼠标',
            pen: '笔',
            gaze: '注视'
        }
        return names[modality] || modality
    }

    /**
     * 获取状态
     */
    getStatus() {
        return {
            currentMode: this.currentMode,
            totalModes: this.interactionModes.size,
            adaptationRules: this.adaptationRules.length,
            modeHistory: this.modeHistory.length,
            adaptationHistory: this.adaptationHistory.length,
            userProfile: this.userProfile,
            learningEnabled: this.learningEnabled
        }
    }

    /**
     * 获取模式历史
     */
    getModeHistory(limit?: number): Array<{
        mode: string
        duration: number
        reason: string
        startTime: number
    }> {
        const history = this.modeHistory.map(entry => ({
            mode: entry.mode,
            duration: (entry.endTime || Date.now()) - entry.startTime,
            reason: entry.reason,
            startTime: entry.startTime
        }))

        return limit ? history.slice(-limit) : history
    }

    /**
     * 启用/禁用学习
     */
    setLearningEnabled(enabled: boolean): void {
        this.learningEnabled = enabled
    }

    /**
     * 重置用户档案
     */
    resetUserProfile(): void {
        this.initializeUserProfile()
        this.saveUserProfile()

        this.emit('profile-reset', {
            timestamp: Date.now()
        })
    }

    /**
     * 事件发射器
     */
    private listeners: Map<string, Function[]> = new Map()

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
        this.saveUserProfile()
        this.listeners.clear()
    }
}