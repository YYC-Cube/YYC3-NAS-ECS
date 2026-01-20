import React, { useState, useEffect, useRef } from 'react'
import {
    Layers, Zap, Brain, Settings, History,
    BarChart3, Users, Cpu, Activity, Target,
    TrendingUp, Globe, Clock, Star, Filter,
    Play, Pause, RefreshCw, Download, Upload,
    ChevronRight, ChevronDown, Eye, EyeOff,
    MessageSquare, Hand, Keyboard, Mouse,
    Volume2, Touchpad, Eye as EyeIcon
} from 'lucide-react'
import { MultimodalInputManager } from '@/core/multimodal/MultimodalInputManager'
import { MultimodalContextUnderstanding } from '@/core/multimodal/MultimodalContextUnderstanding'
import { AdaptiveInteractionManager } from '@/core/multimodal/AdaptiveInteractionManager'
import { InputModality } from '@/core/multimodal/MultimodalProtocol'
import { cn } from '@/utils/cn'

export const MultimodalControlPanel: React.FC = () => {
    // 管理器实例
    const [inputManager] = useState(() => new MultimodalInputManager())
    const [contextUnderstanding] = useState(() => new MultimodalContextUnderstanding())
    const [adaptiveManager] = useState(() => new AdaptiveInteractionManager())

    // 状态
    const [isActive, setIsActive] = useState(true)
    const [showDetails, setShowDetails] = useState(false)
    const [showHistory, setShowHistory] = useState(false)
    const [selectedModality, setSelectedModality] = useState<InputModality | null>(null)

    const [stats, setStats] = useState({
        totalEvents: 0,
        successfulFusions: 0,
        modalityConflicts: 0,
        averageFusionTime: 0
    })

    const [modalityUsage, setModalityUsage] = useState<Record<InputModality, number>>({
        voice: 0,
        gesture: 0,
        touch: 0,
        keyboard: 0,
        mouse: 0,
        pen: 0,
        gaze: 0
    })

    const [currentMode, setCurrentMode] = useState('balanced')
    const [modeSuggestions, setModeSuggestions] = useState<Array<{
        modality: InputModality
        suggestion: string
        priority: 'low' | 'medium' | 'high'
    }>>([])

    const [recentFusions, setRecentFusions] = useState<Array<{
        id: string
        intent: string
        modalities: InputModality[]
        confidence: number
        timestamp: number
    }>>([])

    const [contextResults, setContextResults] = useState<Array<{
        intent: string
        confidence: number
        explanation: string
        timestamp: number
    }>>([])

    // 引用
    const managerRef = useRef(inputManager)
    const understandingRef = useRef(contextUnderstanding)
    const adaptiveRef = useRef(adaptiveManager)

    // 初始化
    useEffect(() => {
        const manager = managerRef.current
        const understanding = understandingRef.current
        const adaptive = adaptiveRef.current

        // 设置事件监听
        manager.on('fused-input', (fusedInput: any) => {
            setRecentFusions(prev => [{
                id: fusedInput.id,
                intent: fusedInput.intent,
                modalities: fusedInput.modalities,
                confidence: fusedInput.confidence,
                timestamp: fusedInput.timestamp
            }, ...prev.slice(0, 9)])
        })

        manager.on('modality-conflict', () => {
            setStats(prev => ({
                ...prev,
                modalityConflicts: prev.modalityConflicts + 1
            }))
        })

        // 更新统计
        const updateStats = () => {
            const status = manager.getStatus()
            setStats({
                totalEvents: Object.values(status.statistics.totalEvents).reduce((a, b) => a + b, 0),
                successfulFusions: status.statistics.successfulFusions,
                modalityConflicts: status.statistics.modalityConflicts,
                averageFusionTime: status.statistics.averageFusionTime
            })

            setModalityUsage(status.context.session.modalityUsage)
        }

        // 更新模式
        const updateMode = () => {
            const mode = adaptive.getCurrentMode()
            if (mode) {
                setCurrentMode(mode.id)

                const context = adaptive.getDefaultContext()
                const suggestions = adaptive.getSuggestions(context)
                setModeSuggestions(suggestions)
            }
        }

        const interval = setInterval(() => {
            updateStats()
            updateMode()
        }, 1000)

        // 模拟输入事件（测试用）
        const simulateTestInput = () => {
            if (Math.random() > 0.7) {
                const testEvent = {
                    id: `test-${Date.now()}`,
                    modality: ['voice', 'gesture', 'touch'][Math.floor(Math.random() * 3)] as InputModality,
                    type: 'test',
                    timestamp: Date.now(),
                    confidence: 0.7 + Math.random() * 0.3,
                    data: { test: true }
                }

                manager.processInput(testEvent)
            }
        }

        const testInterval = setInterval(simulateTestInput, 3000)

        return () => {
            clearInterval(interval)
            clearInterval(testInterval)
            manager.destroy()
            understanding.destroy()
            adaptive.destroy()
        }
    }, [])

    // 获取模态图标
    const getModalityIcon = (modality: InputModality) => {
        switch (modality) {
            case 'voice':
                return <Volume2 className="w-4 h-4" />
            case 'gesture':
                return <Hand className="w-4 h-4" />
            case 'touch':
                return <Touchpad className="w-4 h-4" />
            case 'keyboard':
                return <Keyboard className="w-4 h-4" />
            case 'mouse':
                return <Mouse className="w-4 h-4" />
            case 'pen':
                return <MessageSquare className="w-4 h-4" />
            case 'gaze':
                return <EyeIcon className="w-4 h-4" />
            default:
                return <Activity className="w-4 h-4" />
        }
    }

    // 获取模态颜色
    const getModalityColor = (modality: InputModality) => {
        const colors: Record<InputModality, string> = {
            voice: 'text-blue-400',
            gesture: 'text-green-400',
            touch: 'text-yellow-400',
            keyboard: 'text-purple-400',
            mouse: 'text-pink-400',
            pen: 'text-cyan-400',
            gaze: 'text-orange-400'
        }
        return colors[modality] || 'text-gray-400'
    }

    // 获取模态背景色
    const getModalityBgColor = (modality: InputModality) => {
        const colors: Record<InputModality, string> = {
            voice: 'bg-blue-500/20',
            gesture: 'bg-green-500/20',
            touch: 'bg-yellow-500/20',
            keyboard: 'bg-purple-500/20',
            mouse: 'bg-pink-500/20',
            pen: 'bg-cyan-500/20',
            gaze: 'bg-orange-500/20'
        }
        return colors[modality] || 'bg-gray-500/20'
    }

    // 获取模式信息
    const getModeInfo = (modeId: string) => {
        const modes: Record<string, { name: string; description: string; color: string }> = {
            balanced: { name: '均衡模式', description: '平衡所有输入方式', color: 'from-blue-500 to-cyan-500' },
            'voice-first': { name: '语音优先', description: '优先使用语音控制', color: 'from-green-500 to-emerald-500' },
            'gesture-first': { name: '手势优先', description: '优先使用手势控制', color: 'from-yellow-500 to-orange-500' },
            'keyboard-first': { name: '键盘优先', description: '优先使用键盘控制', color: 'from-purple-500 to-pink-500' },
            accessibility: { name: '无障碍模式', description: '优化无障碍访问', color: 'from-gray-500 to-gray-700' },
            expert: { name: '专家模式', description: '支持所有输入方式', color: 'from-red-500 to-orange-500' }
        }
        return modes[modeId] || { name: modeId, description: '未知模式', color: 'from-gray-500 to-gray-700' }
    }

    // 切换模式
    const switchMode = (modeId: string) => {
        adaptiveRef.current.switchMode(modeId, '手动切换')
    }

    // 格式化时间
    const formatTime = (timestamp: number) => {
        return new Date(timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    // 获取优先级颜色
    const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
        switch (priority) {
            case 'high':
                return 'text-red-400 bg-red-500/10'
            case 'medium':
                return 'text-yellow-400 bg-yellow-500/10'
            case 'low':
                return 'text-blue-400 bg-blue-500/10'
        }
    }

    return (
        <div className="fixed top-44 right-4 z-40 w-96 bg-gray-900/95 backdrop-blur-lg rounded-2xl border border-gray-700/50 shadow-2xl">
            <div className="p-4 border-b border-gray-700/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Layers className="w-5 h-5 text-cyan-500" />
                        <h3 className="font-semibold text-white">多模态输入</h3>
                        <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded">
                            {currentMode ? getModeInfo(currentMode).name : '未知'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className={cn(
                                "p-1.5 rounded-lg transition",
                                showHistory
                                    ? "bg-purple-500/20 text-purple-400"
                                    : "hover:bg-gray-800"
                            )}
                            title="显示历史"
                        >
                            <History className="w-4 h-4" />
                        </button>

                        <button
                            onClick={() => setShowDetails(!showDetails)}
                            className={cn(
                                "p-1.5 rounded-lg transition",
                                showDetails
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "hover:bg-gray-800"
                            )}
                            title="显示详情"
                        >
                            {showDetails ? (
                                <EyeOff className="w-4 h-4" />
                            ) : (
                                <Eye className="w-4 h-4" />
                            )}
                        </button>

                        <button
                            onClick={() => setIsActive(!isActive)}
                            className={cn(
                                "p-1.5 rounded-lg transition",
                                isActive
                                    ? "bg-green-500/20 text-green-400"
                                    : "bg-gray-800 text-gray-400"
                            )}
                            title={isActive ? "禁用" : "启用"}
                        >
                            <Zap className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* 当前模式 */}
                <div className="p-4 bg-gray-800/30 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-gray-300 flex items-center gap-2">
                            <Brain className="w-4 h-4" />
                            当前交互模式
                        </h4>
                        <span className="text-xs text-gray-500">自适应</span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                        {Object.entries(modalityUsage)
                            .filter(([_, count]) => count > 0)
                            .map(([modality, count]) => (
                                <div
                                    key={modality}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg flex items-center gap-2",
                                        getModalityBgColor(modality as InputModality)
                                    )}
                                >
                                    {getModalityIcon(modality as InputModality)}
                                    <span className={cn("text-sm font-medium", getModalityColor(modality as InputModality))}>
                                        {modality === 'voice' ? '语音' :
                                            modality === 'gesture' ? '手势' :
                                                modality === 'touch' ? '触摸' :
                                                    modality === 'keyboard' ? '键盘' :
                                                        modality === 'mouse' ? '鼠标' :
                                                            modality === 'pen' ? '笔' : '注视'}
                                    </span>
                                    <span className="text-xs text-gray-400">{count}</span>
                                </div>
                            ))}
                    </div>

                    <div className="text-sm text-gray-400">
                        {getModeInfo(currentMode).description}
                    </div>
                </div>

                {/* 统计信息 */}
                {showDetails && (
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                        <h4 className="font-medium text-gray-300 mb-3 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4" />
                            统计信息
                        </h4>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-gray-800/50 rounded-lg text-center">
                                <div className="text-xs text-gray-400">总事件</div>
                                <div className="text-2xl font-bold text-white">
                                    {stats.totalEvents}
                                </div>
                            </div>

                            <div className="p-3 bg-gray-800/50 rounded-lg text-center">
                                <div className="text-xs text-gray-400">融合成功</div>
                                <div className="text-2xl font-bold text-green-400">
                                    {stats.successfulFusions}
                                </div>
                            </div>

                            <div className="p-3 bg-gray-800/50 rounded-lg text-center">
                                <div className="text-xs text-gray-400">平均耗时</div>
                                <div className="text-2xl font-bold text-blue-400">
                                    {stats.averageFusionTime.toFixed(0)}ms
                                </div>
                            </div>

                            <div className="p-3 bg-gray-800/50 rounded-lg text-center">
                                <div className="text-xs text-gray-400">模态冲突</div>
                                <div className="text-2xl font-bold text-red-400">
                                    {stats.modalityConflicts}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 模式切换 */}
                <div>
                    <h4 className="font-medium text-gray-300 mb-3">交互模式</h4>

                    <div className="grid grid-cols-2 gap-2">
                        {['balanced', 'voice-first', 'gesture-first', 'keyboard-first', 'accessibility', 'expert'].map(modeId => {
                            const info = getModeInfo(modeId)
                            const isActive = currentMode === modeId

                            return (
                                <button
                                    key={modeId}
                                    onClick={() => switchMode(modeId)}
                                    className={cn(
                                        "p-3 rounded-lg border transition text-left",
                                        isActive
                                            ? `border-cyan-500/50 bg-gradient-to-br ${info.color}/20`
                                            : "border-gray-700/50 bg-gray-800/30 hover:bg-gray-800/50"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="font-medium text-white">{info.name}</div>
                                            <div className="text-xs text-gray-400">{info.description}</div>
                                        </div>
                                        {isActive && (
                                            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse" />
                                        )}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* 建议 */}
                {modeSuggestions.length > 0 && (
                    <div className="p-4 bg-gray-800/30 rounded-lg">
                        <h4 className="font-medium text-gray-300 mb-3 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            交互建议
                        </h4>

                        <div className="space-y-2">
                            {modeSuggestions.map((suggestion, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "p-3 rounded-lg border",
                                        getPriorityColor(suggestion.priority),
                                        "border-current/30"
                                    )}
                                >
                                    <div className="flex items-start gap-2">
                                        <div className="mt-0.5">
                                            {getModalityIcon(suggestion.modality)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="text-sm">{suggestion.suggestion}</div>
                                            <div className="text-xs opacity-70 mt-1">
                                                优先级: {suggestion.priority === 'high' ? '高' :
                                                    suggestion.priority === 'medium' ? '中' : '低'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 历史记录 */}
                {showHistory && (
                    <div className="space-y-4">
                        {/* 最近融合 */}
                        <div>
                            <h4 className="font-medium text-gray-300 mb-3">最近融合</h4>

                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {recentFusions.map(fusion => (
                                    <div
                                        key={fusion.id}
                                        className="p-3 bg-gray-800/30 rounded-lg"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="font-medium text-white">{fusion.intent}</div>
                                            <div className="text-xs text-gray-500">
                                                {formatTime(fusion.timestamp)}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1">
                                                {fusion.modalities.map(modality => (
                                                    <div
                                                        key={modality}
                                                        className={cn(
                                                            "px-2 py-0.5 rounded text-xs flex items-center gap-1",
                                                            getModalityBgColor(modality)
                                                        )}
                                                    >
                                                        {getModalityIcon(modality)}
                                                        <span className={getModalityColor(modality)}>
                                                            {modality === 'voice' ? '语' :
                                                                modality === 'gesture' ? '手' :
                                                                    modality === 'touch' ? '触' :
                                                                        modality === 'keyboard' ? '键' :
                                                                            modality === 'mouse' ? '鼠' :
                                                                                modality === 'pen' ? '笔' : '注'}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className={cn(
                                                "text-xs px-2 py-0.5 rounded",
                                                fusion.confidence > 0.8
                                                    ? "bg-green-500/20 text-green-400"
                                                    : fusion.confidence > 0.6
                                                        ? "bg-yellow-500/20 text-yellow-400"
                                                        : "bg-red-500/20 text-red-400"
                                            )}>
                                                {(fusion.confidence * 100).toFixed(0)}%
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {recentFusions.length === 0 && (
                                    <div className="text-center py-4 text-gray-500">
                                        <Activity className="w-8 h-8 mx-auto mb-2" />
                                        <p>暂无融合记录</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 上下文理解 */}
                        <div>
                            <h4 className="font-medium text-gray-300 mb-3">上下文理解</h4>

                            <div className="space-y-2 max-h-40 overflow-y-auto">
                                {contextResults.map((result, index) => (
                                    <div
                                        key={index}
                                        className="p-3 bg-gray-800/30 rounded-lg"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="font-medium text-white">{result.intent}</div>
                                            <div className="text-xs text-gray-500">
                                                {formatTime(result.timestamp)}
                                            </div>
                                        </div>

                                        <div className="text-sm text-gray-400 mb-2">
                                            {result.explanation}
                                        </div>

                                        <div className={cn(
                                            "text-xs px-2 py-0.5 rounded inline-block",
                                            result.confidence > 0.8
                                                ? "bg-green-500/20 text-green-400"
                                                : result.confidence > 0.6
                                                    ? "bg-yellow-500/20 text-yellow-400"
                                                    : "bg-red-500/20 text-red-400"
                                        )}>
                                            置信度: {(result.confidence * 100).toFixed(0)}%
                                        </div>
                                    </div>
                                ))}

                                {contextResults.length === 0 && (
                                    <div className="text-center py-4 text-gray-500">
                                        <Brain className="w-8 h-8 mx-auto mb-2" />
                                        <p>暂无上下文理解记录</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* 控制按钮 */}
                <div className="grid grid-cols-2 gap-2 pt-4 border-t border-gray-700/50">
                    <button
                        onClick={() => {
                            managerRef.current.clearHistory()
                            setRecentFusions([])
                            setContextResults([])
                        }}
                        className="py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition"
                    >
                        <Trash2 className="w-4 h-4 inline mr-2" />
                        清空历史
                    </button>

                    <button
                        onClick={() => {
                            adaptiveRef.current.resetUserProfile()
                        }}
                        className="py-2 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition"
                    >
                        <RefreshCw className="w-4 h-4 inline mr-2" />
                        重置学习
                    </button>
                </div>
            </div>

            {/* 底部状态 */}
            <div className="p-3 border-t border-gray-700/50">
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "w-2 h-2 rounded-full",
                            isActive ? "animate-pulse bg-green-500" : "bg-gray-500"
                        )} />
                        <span>状态: {isActive ? '活跃' : '暂停'}</span>
                    </div>
                    <span>融合: {stats.successfulFusions}</span>
                </div>
            </div>
        </div>
    )
}