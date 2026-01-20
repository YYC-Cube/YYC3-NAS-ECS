/**
 * @file MultimodalContextUnderstanding.ts
 * @description 多模态上下文理解器 - 理解多种输入模式的上下文
 */

import { InputEvent, FusedInput, ContextState, InputModality } from './MultimodalProtocol'

export interface ContextPattern {
    id: string
    name: string
    modalities: InputModality[]
    temporalPattern: {
        minInterval: number
        maxInterval: number
        sequence?: string[]
    }
    spatialPattern?: {
        proximity: number
        relativePosition?: 'above' | 'below' | 'left' | 'right'
    }
    semanticPattern?: {
        keywords: string[]
        intents: string[]
    }
    action: (events: InputEvent[], context: ContextState) => {
        intent: string
        confidence: number
        explanation: string
    }
}

export interface ContextUnderstandingResult {
    intent: string
    confidence: number
    modalities: InputModality[]
    explanation: string
    patterns: string[]
    suggestions: string[]
    alternatives: Array<{
        intent: string
        confidence: number
        explanation: string
    }>
}

export class MultimodalContextUnderstanding {
    private contextPatterns: ContextPattern[] = []
    private history: Array<{
        event: InputEvent
        timestamp: number
        processed: boolean
    }> = []
    private maxHistorySize: number = 100
    private learningEnabled: boolean = true
    private learnedPatterns: Map<string, ContextPattern> = new Map()

    constructor() {
        this.setupDefaultPatterns()
        this.loadLearnedPatterns()
    }

    /**
     * 设置默认模式
     */
    private setupDefaultPatterns(): void {
        // 模式1：语音描述 + 手势指向
        this.addContextPattern({
            id: 'describe-and-point',
            name: '描述并指向',
            modalities: ['voice', 'gesture'],
            temporalPattern: {
                minInterval: 0,
                maxInterval: 2000,
                sequence: ['voice', 'gesture']
            },
            spatialPattern: {
                proximity: 150
            },
            semanticPattern: {
                keywords: ['这个', '那个', '这里', '那里'],
                intents: ['select', 'identify', 'refer']
            },
            action: (events, context) => {
                const voiceEvent = events.find(e => e.modality === 'voice')!
                const gestureEvent = events.find(e => e.modality === 'gesture')!

                return {
                    intent: 'refer_to_object',
                    confidence: (voiceEvent.confidence + gestureEvent.confidence) / 2,
                    explanation: '用户正在通过语音描述并用手势指向特定对象'
                }
            }
        })

        // 模式2：多步骤操作（例如：选择 + 命令）
        this.addContextPattern({
            id: 'select-then-command',
            name: '选择后命令',
            modalities: ['touch', 'voice'],
            temporalPattern: {
                minInterval: 100,
                maxInterval: 3000,
                sequence: ['touch', 'voice']
            },
            semanticPattern: {
                keywords: ['移动', '删除', '复制', '编辑'],
                intents: ['modify', 'transform', 'edit']
            },
            action: (events, context) => {
                const touchEvent = events.find(e => e.modality === 'touch')!
                const voiceEvent = events.find(e => e.modality === 'voice')!

                const action = this.extractActionFromSpeech(voiceEvent.data?.transcript || '')

                return {
                    intent: `${action}_selected`,
                    confidence: Math.min(touchEvent.confidence, voiceEvent.confidence),
                    explanation: `用户选择了对象并发出"${action}"命令`
                }
            }
        })

        // 模式3：手势序列（例如：拖动 + 放置）
        this.addContextPattern({
            id: 'drag-and-drop',
            name: '拖放操作',
            modalities: ['gesture', 'touch'],
            temporalPattern: {
                minInterval: 50,
                maxInterval: 5000,
                sequence: ['gesture:start', 'gesture:end']
            },
            spatialPattern: {
                proximity: 50
            },
            action: (events, context) => {
                const startEvent = events.find(e => e.type.includes('start'))!
                const endEvent = events.find(e => e.type.includes('end'))!

                const distance = this.calculateEventDistance(startEvent, endEvent)

                return {
                    intent: distance > 10 ? 'move_object' : 'adjust_position',
                    confidence: Math.min(startEvent.confidence, endEvent.confidence),
                    explanation: distance > 10 ?
                        '用户执行了拖放操作' :
                        '用户微调了对象位置'
                }
            }
        })

        // 模式4：键盘快捷键 + 语音描述
        this.addContextPattern({
            id: 'shortcut-with-description',
            name: '快捷键加描述',
            modalities: ['keyboard', 'voice'],
            temporalPattern: {
                minInterval: 0,
                maxInterval: 1500
            },
            semanticPattern: {
                keywords: ['所有', '全部', '选中', '取消'],
                intents: ['batch', 'select_all', 'deselect']
            },
            action: (events, context) => {
                const keyboardEvent = events.find(e => e.modality === 'keyboard')!
                const voiceEvent = events.find(e => e.modality === 'voice')!

                const shortcut = keyboardEvent.data?.shortcut || ''
                const description = voiceEvent.data?.transcript || ''

                return {
                    intent: this.mapShortcutToIntent(shortcut, description),
                    confidence: (keyboardEvent.confidence + voiceEvent.confidence) / 2,
                    explanation: `用户使用快捷键 ${shortcut} 并描述为 "${description}"`
                }
            }
        })
    }

    /**
     * 添加上下文模式
     */
    addContextPattern(pattern: ContextPattern): void {
        this.contextPatterns.push(pattern)
    }

    /**
     * 理解事件
     */
    understandEvents(
        events: InputEvent[],
        context: ContextState
    ): ContextUnderstandingResult {
        // 添加到历史
        this.addToHistory(events)

        // 分析事件关系
        const analysis = this.analyzeEvents(events, context)

        // 匹配模式
        const matchedPatterns = this.matchPatterns(events, context)

        // 生成理解结果
        if (matchedPatterns.length > 0) {
            const bestPattern = matchedPatterns[0]
            const patternResult = bestPattern.action(events, context)

            const suggestions = this.generateSuggestions(events, context, patternResult.intent)
            const alternatives = this.generateAlternatives(events, context)

            return {
                intent: patternResult.intent,
                confidence: patternResult.confidence,
                modalities: [...new Set(events.map(e => e.modality))],
                explanation: patternResult.explanation,
                patterns: matchedPatterns.map(p => p.name),
                suggestions,
                alternatives
            }
        }

        // 如果没有匹配模式，使用通用理解
        return this.generalUnderstanding(events, context)
    }

    /**
     * 添加到历史
     */
    private addToHistory(events: InputEvent[]): void {
        events.forEach(event => {
            this.history.push({
                event,
                timestamp: Date.now(),
                processed: false
            })
        })

        // 限制历史大小
        if (this.history.length > this.maxHistorySize) {
            this.history = this.history.slice(-this.maxHistorySize)
        }
    }

    /**
     * 分析事件
     */
    private analyzeEvents(events: InputEvent[], context: ContextState): {
        temporal: {
            duration: number
            intervals: number[]
            isSequential: boolean
        }
        spatial: {
            hasPositions: boolean
            averageDistance: number
            clusterSize: number
        }
        semantic: {
            keywordOverlap: number
            intentConsistency: number
            modalityDiversity: number
        }
    } {
        if (events.length === 0) {
            return {
                temporal: { duration: 0, intervals: [], isSequential: false },
                spatial: { hasPositions: false, averageDistance: 0, clusterSize: 0 },
                semantic: { keywordOverlap: 0, intentConsistency: 0, modalityDiversity: 0 }
            }
        }

        // 时间分析
        const timestamps = events.map(e => e.timestamp).sort()
        const duration = timestamps[timestamps.length - 1] - timestamps[0]
        const intervals: number[] = []
        for (let i = 1; i < timestamps.length; i++) {
            intervals.push(timestamps[i] - timestamps[i - 1])
        }
        const isSequential = intervals.every(interval => interval > 0 && interval < 1000)

        // 空间分析
        const positions = events
            .filter(e => e.data?.position)
            .map(e => e.data.position)

        let averageDistance = 0
        let clusterSize = 0

        if (positions.length > 1) {
            let totalDistance = 0
            let pairCount = 0

            for (let i = 0; i < positions.length; i++) {
                for (let j = i + 1; j < positions.length; j++) {
                    totalDistance += this.calculateDistance(positions[i], positions[j])
                    pairCount++
                }
            }

            averageDistance = pairCount > 0 ? totalDistance / pairCount : 0
            clusterSize = this.calculateClusterSize(positions)
        }

        // 语义分析
        const keywords = events.map(e => this.extractKeywords(e))
        const keywordOverlap = this.calculateKeywordOverlap(keywords)

        const intents = events.map(e => e.type)
        const intentConsistency = this.calculateIntentConsistency(intents)

        const modalities = events.map(e => e.modality)
        const modalityDiversity = new Set(modalities).size / modalities.length

        return {
            temporal: { duration, intervals, isSequential },
            spatial: {
                hasPositions: positions.length > 0,
                averageDistance,
                clusterSize
            },
            semantic: { keywordOverlap, intentConsistency, modalityDiversity }
        }
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
     * 计算事件距离
     */
    private calculateEventDistance(event1: InputEvent, event2: InputEvent): number {
        if (event1.data?.position && event2.data?.position) {
            return this.calculateDistance(event1.data.position, event2.data.position)
        }
        return 0
    }

    /**
     * 计算聚类大小
     */
    private calculateClusterSize(positions: Array<{ x: number; y: number }>): number {
        if (positions.length <= 1) return positions.length

        // 简单实现：检查是否在特定半径内
        const radius = 100
        let maxCluster = 1

        positions.forEach((pos, i) => {
            let clusterSize = 1
            positions.forEach((otherPos, j) => {
                if (i !== j && this.calculateDistance(pos, otherPos) <= radius) {
                    clusterSize++
                }
            })
            maxCluster = Math.max(maxCluster, clusterSize)
        })

        return maxCluster
    }

    /**
     * 提取关键词
     */
    private extractKeywords(event: InputEvent): string[] {
        const keywords: string[] = []

        if (event.modality === 'voice' && event.data?.transcript) {
            const transcript = event.data.transcript.toLowerCase()
            const commonWords = ['创建', '关闭', '移动', '选择', '删除', '这个', '那个']
            keywords.push(...commonWords.filter(word => transcript.includes(word)))
        }

        if (event.type) {
            keywords.push(event.type)
        }

        return [...new Set(keywords)]
    }

    /**
     * 计算关键词重叠
     */
    private calculateKeywordOverlap(keywordLists: string[][]): number {
        if (keywordLists.length <= 1) return 1

        let totalOverlap = 0
        let totalPairs = 0

        for (let i = 0; i < keywordLists.length; i++) {
            for (let j = i + 1; j < keywordLists.length; j++) {
                const set1 = new Set(keywordLists[i])
                const set2 = new Set(keywordLists[j])
                const intersection = new Set([...set1].filter(x => set2.has(x)))
                const union = new Set([...set1, ...set2])

                totalOverlap += union.size > 0 ? intersection.size / union.size : 0
                totalPairs++
            }
        }

        return totalPairs > 0 ? totalOverlap / totalPairs : 0
    }

    /**
     * 计算意图一致性
     */
    private calculateIntentConsistency(intents: string[]): number {
        if (intents.length <= 1) return 1

        const intentCounts: Record<string, number> = {}
        intents.forEach(intent => {
            intentCounts[intent] = (intentCounts[intent] || 0) + 1
        })

        const maxCount = Math.max(...Object.values(intentCounts))
        return maxCount / intents.length
    }

    /**
     * 匹配模式
     */
    private matchPatterns(events: InputEvent[], context: ContextState): ContextPattern[] {
        const matchedPatterns: Array<{
            pattern: ContextPattern
            score: number
        }> = []

        for (const pattern of this.contextPatterns) {
            const score = this.calculatePatternScore(pattern, events, context)
            if (score > 0.5) {
                matchedPatterns.push({ pattern, score })
            }
        }

        // 添加学习到的模式
        for (const pattern of this.learnedPatterns.values()) {
            const score = this.calculatePatternScore(pattern, events, context)
            if (score > 0.5) {
                matchedPatterns.push({ pattern, score })
            }
        }

        // 按分数排序
        matchedPatterns.sort((a, b) => b.score - a.score)

        return matchedPatterns.map(mp => mp.pattern)
    }

    /**
     * 计算模式分数
     */
    private calculatePatternScore(
        pattern: ContextPattern,
        events: InputEvent[],
        context: ContextState
    ): number {
        let score = 0
        let totalWeight = 0

        // 模态匹配（权重：0.3）
        const eventModalities = events.map(e => e.modality)
        const modalityMatch = this.calculateModalityMatch(pattern.modalities, eventModalities)
        score += modalityMatch * 0.3
        totalWeight += 0.3

        // 时间模式匹配（权重：0.3）
        if (pattern.temporalPattern) {
            const temporalMatch = this.checkTemporalPattern(pattern.temporalPattern, events)
            score += temporalMatch * 0.3
            totalWeight += 0.3
        }

        // 空间模式匹配（权重：0.2）
        if (pattern.spatialPattern) {
            const spatialMatch = this.checkSpatialPattern(pattern.spatialPattern, events)
            score += spatialMatch * 0.2
            totalWeight += 0.2
        }

        // 语义模式匹配（权重：0.2）
        if (pattern.semanticPattern) {
            const semanticMatch = this.checkSemanticPattern(pattern.semanticPattern, events)
            score += semanticMatch * 0.2
            totalWeight += 0.2
        }

        return totalWeight > 0 ? score / totalWeight : 0
    }

    /**
     * 计算模态匹配
     */
    private calculateModalityMatch(
        patternModalities: InputModality[],
        eventModalities: InputModality[]
    ): number {
        if (patternModalities.length === 0) return 1

        const patternSet = new Set(patternModalities)
        const eventSet = new Set(eventModalities)

        const intersection = new Set([...patternSet].filter(x => eventSet.has(x)))
        const union = new Set([...patternSet, ...eventSet])

        return union.size > 0 ? intersection.size / union.size : 0
    }

    /**
     * 检查时间模式
     */
    private checkTemporalPattern(
        pattern: ContextPattern['temporalPattern'],
        events: InputEvent[]
    ): number {
        if (events.length <= 1) return 1

        const timestamps = events.map(e => e.timestamp).sort()
        const duration = timestamps[timestamps.length - 1] - timestamps[0]

        // 检查时间间隔
        if (duration < pattern.minInterval || duration > pattern.maxInterval) {
            return 0.3
        }

        // 检查序列
        if (pattern.sequence && pattern.sequence.length > 0) {
            const eventSequence = events
                .sort((a, b) => a.timestamp - b.timestamp)
                .map(e => {
                    if (pattern.sequence![0].includes(':')) {
                        return `${e.modality}:${e.type}`
                    }
                    return e.modality
                })

            const sequenceMatch = this.calculateSequenceMatch(pattern.sequence, eventSequence)
            return 0.3 + sequenceMatch * 0.7
        }

        return 1
    }

    /**
     * 计算序列匹配
     */
    private calculateSequenceMatch(patternSeq: string[], eventSeq: string[]): number {
        if (eventSeq.length < patternSeq.length) return 0

        let matchCount = 0
        for (let i = 0; i < patternSeq.length && i < eventSeq.length; i++) {
            if (this.matchesSequenceElement(patternSeq[i], eventSeq[i])) {
                matchCount++
            }
        }

        return matchCount / patternSeq.length
    }

    /**
     * 匹配序列元素
     */
    private matchesSequenceElement(pattern: string, actual: string): boolean {
        if (pattern === actual) return true
        if (pattern.includes(':')) {
            const [modality, type] = pattern.split(':')
            const [actualModality, actualType] = actual.split(':')
            if (actualModality === modality) {
                if (type === '*' || actualType?.includes(type)) {
                    return true
                }
            }
        }
        return false
    }

    /**
     * 检查空间模式
     */
    private checkSpatialPattern(
        pattern: ContextPattern['spatialPattern'],
        events: InputEvent[]
    ): number {
        if (!pattern || events.length <= 1) return 1

        const positions = events
            .filter(e => e.data?.position)
            .map(e => e.data.position)

        if (positions.length <= 1) return 0.5

        // 检查接近度
        let withinProximity = true
        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                const distance = this.calculateDistance(positions[i], positions[j])
                if (distance > pattern.proximity) {
                    withinProximity = false
                    break
                }
            }
            if (!withinProximity) break
        }

        let relativePositionMatch = 1
        if (pattern.relativePosition && positions.length === 2) {
            const [pos1, pos2] = positions
            const actualRelative = this.getRelativePosition(pos1, pos2)
            relativePositionMatch = actualRelative === pattern.relativePosition ? 1 : 0.5
        }

        return (withinProximity ? 0.7 : 0.3) * relativePositionMatch
    }

    /**
     * 获取相对位置
     */
    private getRelativePosition(pos1: { x: number; y: number }, pos2: { x: number; y: number }): string {
        const dx = pos2.x - pos1.x
        const dy = pos2.y - pos1.y

        if (Math.abs(dx) > Math.abs(dy)) {
            return dx > 0 ? 'right' : 'left'
        } else {
            return dy > 0 ? 'below' : 'above'
        }
    }

    /**
     * 检查语义模式
     */
    private checkSemanticPattern(
        pattern: ContextPattern['semanticPattern'],
        events: InputEvent[]
    ): number {
        if (!pattern) return 1

        let keywordMatch = 1
        if (pattern.keywords && pattern.keywords.length > 0) {
            const eventKeywords = events.flatMap(e => this.extractKeywords(e))
            const matchedKeywords = pattern.keywords.filter(kw =>
                eventKeywords.some(ekw => ekw.includes(kw) || kw.includes(ekw))
            )
            keywordMatch = matchedKeywords.length / pattern.keywords.length
        }

        let intentMatch = 1
        if (pattern.intents && pattern.intents.length > 0) {
            const eventIntents = events.map(e => this.mapTypeToIntent(e.type))
            const matchedIntents = pattern.intents.filter(intent =>
                eventIntents.includes(intent)
            )
            intentMatch = matchedIntents.length / pattern.intents.length
        }

        return (keywordMatch + intentMatch) / 2
    }

    /**
     * 生成建议
     */
    private generateSuggestions(
        events: InputEvent[],
        context: ContextState,
        intent: string
    ): string[] {
        const suggestions: string[] = []
        const modalities = [...new Set(events.map(e => e.modality))]

        // 基于模态的建议
        if (modalities.includes('voice') && modalities.includes('gesture')) {
            suggestions.push('可以同时使用语音和手势进行更精确的操作')
        }

        if (modalities.includes('touch') && !modalities.includes('voice')) {
            suggestions.push('尝试添加语音命令来明确操作意图')
        }

        // 基于意图的建议
        switch (intent) {
            case 'select_object':
                suggestions.push('选中后，可以说"移动这里"或"删除"来继续操作')
                break
            case 'move_object':
                suggestions.push('移动过程中，可以说"放在这里"来确认位置')
                break
            case 'create_popup':
                suggestions.push('创建后，可以使用手势调整大小和位置')
                break
        }

        // 基于上下文的建议
        if (context.environment.deviceType === 'mobile') {
            suggestions.push('在移动设备上，推荐使用语音和触摸组合操作')
        } else if (context.environment.deviceType === 'desktop') {
            suggestions.push('在桌面设备上，推荐使用键盘快捷键提高效率')
        }

        return suggestions.slice(0, 3) // 最多3条建议
    }

    /**
     * 生成替代理解
     */
    private generateAlternatives(
        events: InputEvent[],
        context: ContextState
    ): Array<{
        intent: string
        confidence: number
        explanation: string
    }> {
        const alternatives: Array<{
            intent: string
            confidence: number
            explanation: string
        }> = []

        // 基于单一模态的理解
        const singleModalityIntents = this.understandSingleModality(events)
        alternatives.push(...singleModalityIntents)

        // 基于部分事件的理解
        if (events.length > 2) {
            const partialIntents = this.understandPartialEvents(events)
            alternatives.push(...partialIntents)
        }

        // 基于历史的理解
        const historicalIntents = this.understandFromHistory(events, context)
        alternatives.push(...historicalIntents)

        // 去重并排序
        const uniqueAlternatives = Array.from(
            new Map(alternatives.map(alt => [alt.intent, alt])).values()
        ).sort((a, b) => b.confidence - a.confidence)

        return uniqueAlternatives.slice(0, 5) // 最多5个替代理解
    }

    /**
     * 理解单一模态
     */
    private understandSingleModality(events: InputEvent[]): Array<{
        intent: string
        confidence: number
        explanation: string
    }> {
        const results: Array<{
            intent: string
            confidence: number
            explanation: string
        }> = []

        // 按模态分组
        const eventsByModality = new Map<InputModality, InputEvent[]>()
        events.forEach(event => {
            if (!eventsByModality.has(event.modality)) {
                eventsByModality.set(event.modality, [])
            }
            eventsByModality.get(event.modality)!.push(event)
        })

        // 分析每个模态
        eventsByModality.forEach((modalityEvents, modality) => {
            if (modalityEvents.length === 1) {
                const event = modalityEvents[0]
                results.push({
                    intent: this.mapTypeToIntent(event.type),
                    confidence: event.confidence * 0.8,
                    explanation: `基于${modality}输入的理解`
                })
            } else {
                // 多个同模态事件
                const intent = this.analyzeModalitySequence(modalityEvents)
                const avgConfidence = modalityEvents.reduce((sum, e) => sum + e.confidence, 0) / modalityEvents.length
                results.push({
                    intent,
                    confidence: avgConfidence * 0.7,
                    explanation: `基于${modality}序列的理解`
                })
            }
        })

        return results
    }

    /**
     * 分析模态序列
     */
    private analyzeModalitySequence(events: InputEvent[]): string {
        const types = events.map(e => e.type)

        if (types.includes('drag_start') && types.includes('drag_end')) {
            return 'move_object'
        }

        if (types.includes('pinch_start') && types.includes('pinch_end')) {
            return 'resize_object'
        }

        if (types.includes('tap') && types.includes('double_tap')) {
            return 'select_and_open'
        }

        return 'complex_sequence'
    }

    /**
     * 理解部分事件
     */
    private understandPartialEvents(events: InputEvent[]): Array<{
        intent: string
        confidence: number
        explanation: string
    }> {
        if (events.length <= 2) return []

        const results: Array<{
            intent: string
            confidence: number
            explanation: string
        }> = []

        // 取前两个事件
        const firstTwo = events.slice(0, 2)
        if (firstTwo.length === 2) {
            const intent = this.guessIntentFromPair(firstTwo[0], firstTwo[1])
            const confidence = (firstTwo[0].confidence + firstTwo[1].confidence) / 2 * 0.6
            results.push({
                intent,
                confidence,
                explanation: '基于前两个事件的理解'
            })
        }

        // 取后两个事件
        const lastTwo = events.slice(-2)
        if (lastTwo.length === 2 && lastTwo[0] !== firstTwo[0]) {
            const intent = this.guessIntentFromPair(lastTwo[0], lastTwo[1])
            const confidence = (lastTwo[0].confidence + lastTwo[1].confidence) / 2 * 0.6
            results.push({
                intent,
                confidence,
                explanation: '基于后两个事件的理解'
            })
        }

        return results
    }

    /**
     * 从事件对猜测意图
     */
    private guessIntentFromPair(event1: InputEvent, event2: InputEvent): string {
        const modalities = [event1.modality, event2.modality].sort().join('-')

        const intentMap: Record<string, string> = {
            'gesture-touch': 'interact_with_object',
            'keyboard-voice': 'command_with_description',
            'mouse-voice': 'point_and_describe',
            'touch-voice': 'select_and_command',
            'gesture-voice': 'gesture_with_instruction'
        }

        return intentMap[modalities] || 'combined_action'
    }

    /**
     * 从历史理解
     */
    private understandFromHistory(
        events: InputEvent[],
        context: ContextState
    ): Array<{
        intent: string
        confidence: number
        explanation: string
    }> {
        const results: Array<{
            intent: string
            confidence: number
            explanation: string
        }> = []

        const recentHistory = this.history
            .filter(h => !h.processed && Date.now() - h.timestamp < 30000)
            .slice(-10)
            .map(h => h.event)

        if (recentHistory.length === 0) return results

        // 检查是否与历史事件相似
        const currentModalities = [...new Set(events.map(e => e.modality))]
        const historicalModalities = [...new Set(recentHistory.map(e => e.modality))]

        const modalityOverlap = this.calculateModalityMatch(currentModalities, historicalModalities)
        if (modalityOverlap > 0.5) {
            // 猜测可能是连续操作
            const lastIntent = context.session.recentIntents[context.session.recentIntents.length - 1]
            if (lastIntent) {
                results.push({
                    intent: `continue_${lastIntent}`,
                    confidence: 0.6,
                    explanation: '基于历史操作的连续动作'
                })
            }
        }

        return results
    }

    /**
     * 通用理解
     */
    private generalUnderstanding(
        events: InputEvent[],
        context: ContextState
    ): ContextUnderstandingResult {
        const modalities = [...new Set(events.map(e => e.modality))]
        const avgConfidence = events.reduce((sum, e) => sum + e.confidence, 0) / events.length

        // 基于事件数量猜测
        let intent = 'unknown'
        let explanation = '无法确定具体意图'

        if (events.length === 1) {
            intent = this.mapTypeToIntent(events[0].type)
            explanation = `单${events[0].modality}输入`
        } else if (events.length === 2) {
            intent = this.guessIntentFromPair(events[0], events[1])
            explanation = `双模态输入: ${events[0].modality} + ${events[1].modality}`
        } else {
            intent = 'complex_multimodal_action'
            explanation = `多模态复杂操作 (${modalities.length}种输入方式)`
        }

        const suggestions = this.generateGeneralSuggestions(modalities, context)
        const alternatives = this.generateAlternatives(events, context)

        return {
            intent,
            confidence: avgConfidence * 0.5,
            modalities,
            explanation,
            patterns: [],
            suggestions,
            alternatives
        }
    }

    /**
     * 生成通用建议
     */
    private generateGeneralSuggestions(
        modalities: InputModality[],
        context: ContextState
    ): string[] {
        const suggestions: string[] = []

        if (modalities.length === 1) {
            const modality = modalities[0]
            switch (modality) {
                case 'voice':
                    suggestions.push('尝试添加手势或触摸来明确操作目标')
                    break
                case 'gesture':
                    suggestions.push('尝试添加语音命令来明确操作意图')
                    break
                case 'touch':
                    suggestions.push('尝试添加语音描述或使用手势进行精确操作')
                    break
            }
        } else if (modalities.length >= 2) {
            suggestions.push('多模态输入已启用，可以组合使用提高效率')
        }

        return suggestions
    }

    /**
     * 从语音中提取动作
     */
    private extractActionFromSpeech(transcript: string): string {
        const actions: Record<string, string> = {
            '移动': 'move',
            '删除': 'delete',
            '复制': 'copy',
            '粘贴': 'paste',
            '编辑': 'edit',
            '保存': 'save',
            '关闭': 'close',
            '打开': 'open'
        }

        for (const [chinese, english] of Object.entries(actions)) {
            if (transcript.includes(chinese)) {
                return english
            }
        }

        return 'modify'
    }

    /**
     * 映射快捷键到意图
     */
    private mapShortcutToIntent(shortcut: string, description: string): string {
        const shortcutMap: Record<string, string> = {
            'Ctrl+A': 'select_all',
            'Ctrl+C': 'copy',
            'Ctrl+V': 'paste',
            'Ctrl+X': 'cut',
            'Ctrl+Z': 'undo',
            'Ctrl+Y': 'redo',
            'Ctrl+S': 'save'
        }

        const baseIntent = shortcutMap[shortcut] || 'keyboard_action'

        if (description.includes('所有') || description.includes('全部')) {
            return `${baseIntent}_all`
        }

        return baseIntent
    }

    /**
     * 映射类型到意图
     */
    private mapTypeToIntent(type: string): string {
        const intentMap: Record<string, string> = {
            'tap': 'select',
            'double_tap': 'open',
            'long_press': 'context_menu',
            'drag_start': 'begin_move',
            'drag_end': 'end_move',
            'pinch_start': 'begin_resize',
            'pinch_end': 'end_resize',
            'rotate': 'rotate',
            'swipe': 'navigate',
            'speech': 'voice_command',
            'keypress': 'keyboard_input',
            'click': 'mouse_click'
        }

        return intentMap[type] || type
    }

    /**
     * 学习新模式
     */
    learnNewPattern(events: InputEvent[], confirmedIntent: string): void {
        if (!this.learningEnabled || events.length < 2) return

        // 创建新模式
        const patternId = `learned-${Date.now()}`
        const modalities = [...new Set(events.map(e => e.modality))]

        const pattern: ContextPattern = {
            id: patternId,
            name: `学习到的模式-${confirmedIntent}`,
            modalities,
            temporalPattern: {
                minInterval: 0,
                maxInterval: 5000
            },
            action: (events, context) => ({
                intent: confirmedIntent,
                confidence: 0.7,
                explanation: `学习到的多模态模式：${confirmedIntent}`
            })
        }

        // 添加到学习模式
        this.learnedPatterns.set(patternId, pattern)

        // 保存学习到的模式
        this.saveLearnedPatterns()

        this.emit('pattern-learned', {
            patternId,
            intent: confirmedIntent,
            modalities,
            timestamp: Date.now()
        })
    }

    /**
     * 加载学习到的模式
     */
    private loadLearnedPatterns(): void {
        try {
            const saved = localStorage.getItem('learned_context_patterns')
            if (saved) {
                const patterns = JSON.parse(saved)
                patterns.forEach((pattern: any) => {
                    this.learnedPatterns.set(pattern.id, pattern)
                })
            }
        } catch (error) {
            console.error('加载学习模式失败:', error)
        }
    }

    /**
     * 保存学习到的模式
     */
    private saveLearnedPatterns(): void {
        try {
            const patterns = Array.from(this.learnedPatterns.values())
            localStorage.setItem('learned_context_patterns', JSON.stringify(patterns))
        } catch (error) {
            console.error('保存学习模式失败:', error)
        }
    }

    /**
     * 获取状态
     */
    getStatus() {
        return {
            totalPatterns: this.contextPatterns.length + this.learnedPatterns.size,
            historySize: this.history.length,
            learningEnabled: this.learningEnabled
        }
    }

    /**
     * 启用/禁用学习
     */
    setLearningEnabled(enabled: boolean): void {
        this.learningEnabled = enabled
    }

    /**
     * 清空历史
     */
    clearHistory(): void {
        this.history = []
    }

    /**
     * 事件监听器（继承自EventEmitter）
     */
    private emit(event: string, data?: any): void {
        // EventEmitter的实现
        const listeners = (this as any).listeners?.get(event)
        if (listeners) {
            listeners.forEach((callback: Function) => callback(data))
        }
    }
}