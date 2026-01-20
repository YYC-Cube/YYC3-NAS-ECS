import React, { useState, useEffect, useRef } from 'react'
import {
  Mic, MicOff, Volume2, VolumeX, Globe, Settings,
  MessageSquare, History, Zap, Brain, Download,
  Upload, Play, Pause, StopCircle, ChevronRight,
  ChevronDown, Star, Copy, Trash2, RefreshCw,
  AlertCircle, CheckCircle, XCircle, HelpCircle,
  Languages, Clock, BarChart3, Users, BookOpen
} from 'lucide-react'
import { SpeechRecognitionEngine } from '@/core/voice/SpeechRecognitionEngine'
import { SpeechSynthesisEngine } from '@/core/voice/SpeechSynthesisEngine'
import { VoiceCommandProcessor } from '@/core/voice/VoiceCommandProcessor'
import { MultilingualManager } from '@/core/voice/MultilingualManager'
import { VoiceContextManager } from '@/core/voice/VoiceContextManager'
import { cn } from '@/utils/cn'

export const VoiceControlPanel: React.FC = () => {
  // 引擎实例
  const [recognitionEngine] = useState(() => new SpeechRecognitionEngine({
    language: 'zh-CN',
    continuous: true,
    interimResults: true
  }))
  
  const [synthesisEngine] = useState(() => new SpeechSynthesisEngine({
    language: 'zh-CN',
    rate: 1.0,
    volume: 1.0
  }))
  
  const [commandProcessor] = useState(() => new VoiceCommandProcessor())
  const [multilingualManager] = useState(() => new MultilingualManager())
  const [contextManager] = useState(() => new VoiceContextManager())

  // 状态
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [currentTranscript, setCurrentTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [recognitionResults, setRecognitionResults] = useState<Array<{
    transcript: string
    confidence: number
    isFinal: boolean
    timestamp: number
  }>>([])
  
  const [commandHistory, setCommandHistory] = useState<Array<{
    text: string
    intent: string
    executed: boolean
    timestamp: number
  }>>([])
  
  const [contextHistory, setContextHistory] = useState<Array<{
    topic: string
    turnCount: number
    lastUpdated: number
  }>>([])
  
  const [currentLanguage, setCurrentLanguage] = useState('zh-CN')
  const [availableLanguages, setAvailableLanguages] = useState<Array<{
    code: string
    name: string
    nativeName: string
  }>>([])
  
  const [availableVoices, setAvailableVoices] = useState<Array<{
    voiceURI: string
    name: string
    lang: string
  }>>([])
  
  const [selectedVoice, setSelectedVoice] = useState('')
  const [voiceSettings, setVoiceSettings] = useState({
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0
  })
  
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showContextPanel, setShowContextPanel] = useState(false)
  const [showLanguagePanel, setShowLanguagePanel] = useState(false)
  
  const [stats, setStats] = useState({
    totalRecognitions: 0,
    successfulCommands: 0,
    failedCommands: 0,
    totalSpeechTime: 0,
    languageChanges: 0
  })

  const recognitionRef = useRef(recognitionEngine)
  const synthesisRef = useRef(synthesisEngine)
  const processorRef = useRef(commandProcessor)

  // 初始化
  useEffect(() => {
    const initialize = async () => {
      // 初始化语音识别
      await recognitionRef.current.initialize()
      
      // 初始化语音合成
      await synthesisRef.current.initialize()
      
      // 加载支持的语言
      const languages = SpeechRecognitionEngine.getSupportedLanguages()
      setAvailableLanguages(languages)
      
      // 加载可用语音
      const voices = synthesisRef.current.getVoices()
      setAvailableVoices(voices)
      
      if (voices.length > 0) {
        setSelectedVoice(voices[0].voiceURI)
      }
      
      // 设置事件监听
      setupEventListeners()
      
      // 加载历史数据
      loadHistoryData()
    }

    initialize()

    return () => {
      cleanup()
    }
  }, [])

  // 设置事件监听
  const setupEventListeners = () => {
    const recognition = recognitionRef.current
    const synthesis = synthesisRef.current
    const processor = processorRef.current

    // 语音识别事件
    recognition.on('start', () => {
      setIsListening(true)
      setCurrentTranscript('')
      setInterimTranscript('')
    })

    recognition.on('result', (result: any) => {
      if (result.isFinal) {
        setCurrentTranscript(result.transcript)
        setRecognitionResults(prev => [...prev, {
          transcript: result.transcript,
          confidence: result.confidence,
          isFinal: true,
          timestamp: Date.now()
        }])
        
        // 处理命令
        processor.processSpeechResult(result)
      } else {
        setInterimTranscript(result.transcript)
      }
    })

    recognition.on('end', () => {
      setIsListening(false)
    })

    recognition.on('error', (error: any) => {
      console.error('语音识别错误:', error)
      setIsListening(false)
    })

    // 语音合成事件
    synthesis.on('started', () => {
      setIsSpeaking(true)
    })

    synthesis.on('completed', () => {
      setIsSpeaking(false)
    })

    synthesis.on('error', (error: any) => {
      console.error('语音合成错误:', error)
      setIsSpeaking(false)
    })

    // 命令处理器事件
    processor.on('command-recognized', (command: any) => {
      setCommandHistory(prev => [{
        text: command.text,
        intent: command.intent,
        executed: command.executed,
        timestamp: command.timestamp
      }, ...prev.slice(0, 49)])
      
      // 更新统计
      setStats(prev => ({
        ...prev,
        totalRecognitions: prev.totalRecognitions + 1
      }))
    })

    processor.on('command-executed', (data: any) => {
      setStats(prev => ({
        ...prev,
        successfulCommands: prev.successfulCommands + 1
      }))
      
      // 语音反馈
      speakFeedback('命令执行成功')
    })

    processor.on('command-failed', (data: any) => {
      setStats(prev => ({
        ...prev,
        failedCommands: prev.failedCommands + 1
      }))
      
      // 语音反馈
      speakFeedback('命令执行失败')
    })

    // 多语言管理器事件
    multilingualManager.on('language-changed', (data: any) => {
      setCurrentLanguage(data.newLanguage)
      setStats(prev => ({
        ...prev,
        languageChanges: prev.languageChanges + 1
      }))
      
      // 更新语音识别语言
      recognition.setLanguage(data.newLanguage)
      
      // 更新语音合成语言
      synthesis.setLanguage(data.newLanguage)
      
      // 语音反馈
      speakFeedback(`已切换至${data.languageInfo.nativeName}`)
    })

    // 上下文管理器事件
    contextManager.on('context-updated', () => {
      updateContextHistory()
    })
  }

  // 加载历史数据
  const loadHistoryData = () => {
    try {
      const savedHistory = localStorage.getItem('voice_command_history')
      if (savedHistory) {
        const history = JSON.parse(savedHistory)
        setCommandHistory(history.slice(0, 50).map((item: any) => ({
          text: item.command,
          intent: 'unknown',
          executed: true,
          timestamp: item.timestamp
        })))
      }
    } catch (error) {
      console.error('加载历史数据失败:', error)
    }
  }

  // 更新上下文历史
  const updateContextHistory = () => {
    const contexts = contextManager.getAllContexts()
    setContextHistory(
      contexts.map(ctx => ({
        topic: ctx.topic,
        turnCount: ctx.metadata.turnCount,
        lastUpdated: ctx.metadata.updatedAt
      })).sort((a, b) => b.lastUpdated - a.lastUpdated)
      .slice(0, 10)
    )
  }

  // 开始/停止语音识别
  const toggleListening = async () => {
    if (isListening) {
      recognitionRef.current.stop()
    } else {
      const started = await recognitionRef.current.start()
      if (!started) {
        speakFeedback('无法启动语音识别，请检查麦克风权限')
      }
    }
  }

  // 语音反馈
  const speakFeedback = (text: string) => {
    synthesisRef.current.speak(text, {
      rate: voiceSettings.rate,
      pitch: voiceSettings.pitch,
      volume: voiceSettings.volume
    })
  }

  // 测试语音合成
  const testSpeech = () => {
    const testText = currentLanguage === 'zh-CN' 
      ? '语音系统测试，一切正常'
      : 'Voice system test, everything is working'
    
    synthesisRef.current.speak(testText, {
      voice: selectedVoice,
      rate: voiceSettings.rate,
      pitch: voiceSettings.pitch,
      volume: voiceSettings.volume
    })
  }

  // 切换语言
  const changeLanguage = (languageCode: string) => {
    multilingualManager.setLanguage(languageCode)
    setShowLanguagePanel(false)
  }

  // 切换语音
  const changeVoice = (voiceURI: string) => {
    setSelectedVoice(voiceURI)
    synthesisRef.current.setVoice(voiceURI)
  }

  // 更新语音设置
  const updateVoiceSetting = (key: 'rate' | 'pitch' | 'volume', value: number) => {
    setVoiceSettings(prev => ({ ...prev, [key]: value }))
  }

  // 执行命令
  const executeCommand = async (command: string) => {
    const result = await processorRef.current.processSpeechResult({
      transcript: command,
      confidence: 1.0,
      isFinal: true,
      alternatives: [],
      timestamp: Date.now(),
      language: currentLanguage
    })
    
    if (result.intent !== 'unknown') {
      speakFeedback(`正在执行：${command}`)
    }
  }

  // 清理
  const cleanup = () => {
    recognitionRef.current.destroy()
    synthesisRef.current.destroy()
    processorRef.current.destroy()
    multilingualManager.destroy()
    contextManager.destroy()
  }

  // 获取语言名称
  const getLanguageName = (code: string) => {
    const lang = availableLanguages.find(l => l.code === code)
    return lang ? lang.nativeName : code
  }

  // 获取语音名称
  const getVoiceName = (voiceURI: string) => {
    const voice = availableVoices.find(v => v.voiceURI === voiceURI)
    return voice ? voice.name : voiceURI
  }

  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="fixed top-24 right-4 z-40 w-96 bg-gray-900/95 backdrop-blur-lg rounded-2xl border border-gray-700/50 shadow-2xl">
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-3 h-3 rounded-full animate-pulse",
              isListening ? "bg-green-500" : "bg-gray-500"
            )} />
            <Mic className="w-5 h-5 text-cyan-500" />
            <h3 className="font-semibold text-white">语音交互系统</h3>
            <span className="px-2 py-0.5 text-xs bg-cyan-500/20 text-cyan-400 rounded">
              {currentLanguage === 'zh-CN' ? '中文' : getLanguageName(currentLanguage)}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowLanguagePanel(!showLanguagePanel)}
              className="p-1.5 hover:bg-gray-800 rounded-lg transition"
              title="语言设置"
            >
              <Globe className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowContextPanel(!showContextPanel)}
              className="p-1.5 hover:bg-gray-800 rounded-lg transition"
              title="上下文"
            >
              <Brain className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="p-1.5 hover:bg-gray-800 rounded-lg transition"
              title="高级设置"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
      
      <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
        {/* 语音状态 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-gray-800/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-gray-400">语音识别</span>
              </div>
              <span className={cn(
                "px-2 py-1 text-xs rounded",
                isListening ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
              )}>
                {isListening ? '监听中' : '已停止'}
              </span>
            </div>
            <button
              onClick={toggleListening}
              className={cn(
                "w-full py-2 rounded-lg font-medium transition",
                isListening
                  ? "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500"
                  : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500"
              )}
            >
              {isListening ? (
                <>
                  <MicOff className="w-4 h-4 inline mr-2" />
                  停止监听
                </>
              ) : (
                <>
                  <Mic className="w-4 h-4 inline mr-2" />
                  开始监听
                </>
              )}
            </button>
          </div>
          
          <div className="p-4 bg-gray-800/30 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-purple-400" />
                <span className="text-sm text-gray-400">语音合成</span>
              </div>
              <span className={cn(
                "px-2 py-1 text-xs rounded",
                isSpeaking ? "bg-purple-500/20 text-purple-400" : "bg-gray-500/20 text-gray-400"
              )}>
                {isSpeaking ? '播报中' : '空闲'}
              </span>
            </div>
            <button
              onClick={testSpeech}
              disabled={isSpeaking}
              className={cn(
                "w-full py-2 rounded-lg font-medium transition",
                isSpeaking
                  ? "bg-gray-700 cursor-not-allowed"
                  : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              )}
            >
              <Play className="w-4 h-4 inline mr-2" />
              测试语音
            </button>
          </div>
        </div>
        
        {/* 当前识别结果 */}
        {(currentTranscript || interimTranscript) && (
          <div className="p-4 bg-gray-800/30 rounded-lg">
            <div className="text-sm text-gray-400 mb-2">语音识别结果</div>
            {currentTranscript && (
              <div className="mb-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 mt-0.5 text-green-400" />
                  <div className="flex-1">
                    <div className="text-green-100">{currentTranscript}</div>
                    <div className="text-xs text-green-400/70 mt-1">
                      最终结果 • {formatTime(Date.now())}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {interimTranscript && !currentTranscript && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 text-blue-400" />
                  <div className="flex-1">
                    <div className="text-blue-100">{interimTranscript}</div>
                    <div className="text-xs text-blue-400/70 mt-1">
                      临时结果 • 识别中...
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* 语言面板 */}
        {showLanguagePanel && (
          <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-300 flex items-center gap-2">
                <Languages className="w-4 h-4" />
                语言设置
              </h4>
              <button
                onClick={() => setShowLanguagePanel(false)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              {availableLanguages.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={cn(
                    "w-full p-3 rounded-lg border text-left transition",
                    currentLanguage === lang.code
                      ? "border-cyan-500/50 bg-cyan-500/10"
                      : "border-gray-700/50 bg-gray-800/30 hover:bg-gray-800/50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">{lang.nativeName}</div>
                      <div className="text-sm text-gray-400">{lang.name}</div>
                    </div>
                    {currentLanguage === lang.code && (
                      <CheckCircle className="w-5 h-5 text-cyan-400" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* 上下文面板 */}
        {showContextPanel && (
          <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-300 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                对话上下文
              </h4>
              <button
                onClick={() => setShowContextPanel(false)}
                className="p-1 hover:bg-gray-700 rounded"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-2">
              {contextHistory.length > 0 ? (
                contextHistory.map((ctx, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-800/50 rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-medium text-white">
                        {ctx.topic === 'general' ? '通用对话' : ctx.topic}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatTime(ctx.lastUpdated)}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400">
                      对话轮次: {ctx.turnCount}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                  <p>暂无上下文记录</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* 高级设置 */}
        {showAdvanced && (
          <div className="space-y-4">
            {/* 语音设置 */}
            <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
              <h4 className="font-medium text-gray-300 mb-3">语音设置</h4>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    语音选择
                  </label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => changeVoice(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white"
                  >
                    {availableVoices.map(voice => (
                      <option key={voice.voiceURI} value={voice.voiceURI}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    语速: {voiceSettings.rate.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={voiceSettings.rate}
                    onChange={(e) => updateVoiceSetting('rate', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    音调: {voiceSettings.pitch.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={voiceSettings.pitch}
                    onChange={(e) => updateVoiceSetting('pitch', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    音量: {voiceSettings.volume.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={voiceSettings.volume}
                    onChange={(e) => updateVoiceSetting('volume', parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>
            </div>
            
            {/* 统计信息 */}
            <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
              <h4 className="font-medium text-gray-300 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                使用统计
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-800/50 rounded-lg text-center">
                  <div className="text-xs text-gray-400">识别次数</div>
                  <div className="text-2xl font-bold text-white">
                    {stats.totalRecognitions}
                  </div>
                </div>
                
                <div className="p-3 bg-gray-800/50 rounded-lg text-center">
                  <div className="text-xs text-gray-400">成功命令</div>
                  <div className="text-2xl font-bold text-green-400">
                    {stats.successfulCommands}
                  </div>
                </div>
                
                <div className="p-3 bg-gray-800/50 rounded-lg text-center">
                  <div className="text-xs text-gray-400">语言切换</div>
                  <div className="text-2xl font-bold text-blue-400">
                    {stats.languageChanges}
                  </div>
                </div>
                
                <div className="p-3 bg-gray-800/50 rounded-lg text-center">
                  <div className="text-xs text-gray-400">失败命令</div>
                  <div className="text-2xl font-bold text-red-400">
                    {stats.failedCommands}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 命令历史 */}
        <div>
          <h4 className="font-medium text-gray-300 mb-3 flex items-center gap-2">
            <History className="w-4 h-4" />
            命令历史
          </h4>
          
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {commandHistory.map((cmd, index) => (
              <div
                key={index}
                className="p-3 bg-gray-800/30 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="text-white mb-1">{cmd.text}</div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 bg-gray-700 rounded">
                        {cmd.intent}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(cmd.timestamp)}
                      </span>
                    </div>
                  </div>
                  {cmd.executed ? (
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                  )}
                </div>
              </div>
            ))}
            
            {commandHistory.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                <MessageSquare className="w-8 h-8 mx-auto mb-2" />
                <p>暂无命令历史</p>
                <p className="text-sm mt-1">开始语音交互后，命令会显示在这里</p>
              </div>
            )}
          </div>
        </div>
        
        {/* 快速命令 */}
        <div>
          <h4 className="font-medium text-gray-300 mb-3">快速命令</h4>
          
          <div className="grid grid-cols-2 gap-2">
            {[
              { text: '创建弹窗', icon: <MessageSquare className="w-4 h-4" /> },
              { text: '排列弹窗', icon: <Zap className="w-4 h-4" /> },
              { text: '关闭弹窗', icon: <XCircle className="w-4 h-4" /> },
              { text: '显示帮助', icon: <HelpCircle className="w-4 h-4" /> }
            ].map((cmd, index) => (
              <button
                key={index}
                onClick={() => executeCommand(cmd.text)}
                className="p-3 bg-gray-800/30 hover:bg-gray-800/50 rounded-lg border border-gray-700/50 transition flex items-center justify-center gap-2"
              >
                {cmd.icon}
                <span className="text-sm">{cmd.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* 底部状态 */}
      <div className="p-3 border-t border-gray-700/50">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-2 h-2 rounded-full",
              isListening ? "animate-pulse bg-green-500" : "bg-gray-500"
            )} />
            <span>状态: {isListening ? '监听中' : '待命'}</span>
          </div>
          <span>语言: {getLanguageName(currentLanguage)}</span>
        </div>
      </div>
    </div>
  )
}