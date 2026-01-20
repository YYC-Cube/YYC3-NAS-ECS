/**
 * @file SpeechRecognitionEngine.ts
 * @description 语音识别引擎 - 支持多语言实时语音识别
 */

export interface SpeechRecognitionConfig {
  language: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  noiseSuppression: boolean
  autoGainControl: boolean
  echoCancellation: boolean
  speechRecognitionService?: 'web' | 'azure' | 'google' | 'whisper'
  apiKey?: string
  endpoint?: string
}

export interface SpeechRecognitionResult {
  transcript: string
  confidence: number
  isFinal: boolean
  alternatives: Array<{
    transcript: string
    confidence: number
  }>
  timestamp: number
  language: string
}

export interface SpeechRecognitionEvent {
  type: 'start' | 'result' | 'end' | 'error' | 'no-speech' | 'audio-start' | 'audio-end'
  data?: any
  timestamp: number
}

export class SpeechRecognitionEngine {
  private recognition: any = null
  private config: SpeechRecognitionConfig
  private isListening: boolean = false
  private isInitialized: boolean = false
  private audioContext: AudioContext | null = null
  private mediaStream: MediaStream | null = null
  private speechBuffer: Float32Array[] = []
  private lastResultTime: number = 0
  private silenceTimeout: NodeJS.Timeout | null = null
  
  private listeners: Map<string, Function[]> = new Map()
  private resultHistory: SpeechRecognitionResult[] = []
  private maxHistorySize: number = 100

  private readonly SILENCE_TIMEOUT = 2000 // 2秒无语音自动停止
  private readonly MIN_CONFIDENCE = 0.6 // 最低置信度
  private readonly SAMPLE_RATE = 16000 // 音频采样率

  constructor(config?: Partial<SpeechRecognitionConfig>) {
    this.config = {
      language: 'zh-CN',
      continuous: true,
      interimResults: true,
      maxAlternatives: 3,
      noiseSuppression: true,
      autoGainControl: true,
      echoCancellation: true,
      speechRecognitionService: 'web',
      ...config
    }
  }

  /**
   * 初始化语音识别
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true

    try {
      // 检查浏览器支持
      if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
        throw new Error('浏览器不支持语音识别API')
      }

      // 获取麦克风权限
      await this.requestMicrophonePermission()

      // 创建语音识别实例
      const SpeechRecognition = (window as any).webkitSpeechRecognition || 
                               (window as any).SpeechRecognition
      
      this.recognition = new SpeechRecognition()
      
      // 配置识别器
      this.recognition.lang = this.config.language
      this.recognition.continuous = this.config.continuous
      this.recognition.interimResults = this.config.interimResults
      this.recognition.maxAlternatives = this.config.maxAlternatives

      // 设置音频处理参数
      if (this.recognition.audioContext) {
        const audioContext = this.recognition.audioContext
        const source = audioContext.createMediaStreamSource(this.mediaStream!)
        
        // 创建滤波器降噪
        const filter = audioContext.createBiquadFilter()
        filter.type = 'bandpass'
        filter.frequency.value = 300
        filter.Q.value = 1
        
        // 创建增益控制器
        const gainNode = audioContext.createGain()
        gainNode.gain.value = 2.0
        
        source.connect(filter)
        filter.connect(gainNode)
        gainNode.connect(audioContext.destination)
      }

      // 绑定事件处理器
      this.setupEventHandlers()

      this.isInitialized = true
      this.emit('initialized', { timestamp: Date.now() })
      
      console.log('语音识别引擎初始化成功')
      return true

    } catch (error) {
      console.error('语音识别引擎初始化失败:', error)
      this.emit('error', { 
        type: 'initialization', 
        error: error.message,
        timestamp: Date.now()
      })
      return false
    }
  }

  /**
   * 请求麦克风权限
   */
  private async requestMicrophonePermission(): Promise<void> {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: this.config.echoCancellation,
          noiseSuppression: this.config.noiseSuppression,
          autoGainControl: this.config.autoGainControl,
          sampleRate: this.SAMPLE_RATE,
          channelCount: 1
        }
      })
      
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: this.SAMPLE_RATE
      })
      
    } catch (error) {
      throw new Error(`麦克风权限获取失败: ${error.message}`)
    }
  }

  /**
   * 设置事件处理器
   */
  private setupEventHandlers(): void {
    if (!this.recognition) return

    // 语音开始
    this.recognition.onstart = () => {
      this.isListening = true
      this.lastResultTime = Date.now()
      this.emit('start', { timestamp: Date.now() })
      
      // 开始静音检测
      this.startSilenceDetection()
    }

    // 语音结果
    this.recognition.onresult = (event: any) => {
      this.lastResultTime = Date.now()
      
      const results = Array.from(event.results)
      const lastResult = results[results.length - 1]
      
      const recognitionResult: SpeechRecognitionResult = {
        transcript: lastResult[0].transcript,
        confidence: lastResult[0].confidence,
        isFinal: lastResult.isFinal,
        alternatives: Array.from(lastResult).map((alt: any) => ({
          transcript: alt.transcript,
          confidence: alt.confidence
        })),
        timestamp: Date.now(),
        language: this.config.language
      }

      // 过滤低置信度结果
      if (recognitionResult.confidence < this.MIN_CONFIDENCE && !recognitionResult.isFinal) {
        return
      }

      // 保存到历史
      this.resultHistory.push(recognitionResult)
      if (this.resultHistory.length > this.maxHistorySize) {
        this.resultHistory.shift()
      }

      // 发射结果事件
      this.emit('result', recognitionResult)

      // 如果是最终结果，发射final事件
      if (recognitionResult.isFinal) {
        this.emit('final', recognitionResult)
        
        // 处理语音命令
        this.processVoiceCommand(recognitionResult.transcript)
      }
    }

    // 语音结束
    this.recognition.onend = () => {
      this.isListening = false
      this.stopSilenceDetection()
      this.emit('end', { timestamp: Date.now() })
    }

    // 错误处理
    this.recognition.onerror = (event: any) => {
      const error = event.error || 'unknown'
      console.error('语音识别错误:', error)
      
      this.emit('error', { 
        type: 'recognition', 
        error,
        timestamp: Date.now()
      })

      // 自动重启（如果是网络错误）
      if (error === 'network') {
        setTimeout(() => {
          if (!this.isListening) {
            this.start()
          }
        }, 1000)
      }
    }

    // 无语音检测
    this.recognition.onspeechend = () => {
      this.emit('no-speech', { timestamp: Date.now() })
    }

    // 音频开始
    this.recognition.onaudiostart = () => {
      this.emit('audio-start', { timestamp: Date.now() })
    }

    // 音频结束
    this.recognition.onaudioend = () => {
      this.emit('audio-end', { timestamp: Date.now() })
    }
  }

  /**
   * 开始语音识别
   */
  async start(): Promise<boolean> {
    if (!this.isInitialized) {
      const initialized = await this.initialize()
      if (!initialized) return false
    }

    if (this.isListening) {
      console.warn('语音识别已经在进行中')
      return true
    }

    try {
      this.recognition.start()
      return true
    } catch (error) {
      console.error('启动语音识别失败:', error)
      this.emit('error', { 
        type: 'start', 
        error: error.message,
        timestamp: Date.now()
      })
      return false
    }
  }

  /**
   * 停止语音识别
   */
  stop(): void {
    if (!this.isListening || !this.recognition) return

    try {
      this.recognition.stop()
    } catch (error) {
      console.error('停止语音识别失败:', error)
    }
  }

  /**
   * 切换语言
   */
  setLanguage(language: string): void {
    this.config.language = language
    if (this.recognition) {
      this.recognition.lang = language
    }
    
    this.emit('language-changed', { 
      language,
      timestamp: Date.now()
    })
  }

  /**
   * 开始静音检测
   */
  private startSilenceDetection(): void {
    this.stopSilenceDetection()
    
    this.silenceTimeout = setTimeout(() => {
      if (this.isListening && Date.now() - this.lastResultTime > this.SILENCE_TIMEOUT) {
        console.log('检测到静音，自动停止识别')
        this.stop()
        this.emit('silence-timeout', { timestamp: Date.now() })
      } else if (this.isListening) {
        this.startSilenceDetection()
      }
    }, this.SILENCE_TIMEOUT)
  }

  /**
   * 停止静音检测
   */
  private stopSilenceDetection(): void {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout)
      this.silenceTimeout = null
    }
  }

  /**
   * 处理语音命令
   */
  private processVoiceCommand(transcript: string): void {
    // 转换为小写并去除标点
    const cleanTranscript = transcript.toLowerCase()
      .replace(/[.,!?;:]/g, '')
      .trim()

    // 发射命令事件
    this.emit('command', {
      transcript: cleanTranscript,
      original: transcript,
      timestamp: Date.now()
    })

    // 保存命令历史
    this.saveCommandHistory(cleanTranscript)
  }

  /**
   * 保存命令历史
   */
  private saveCommandHistory(command: string): void {
    const history = JSON.parse(localStorage.getItem('voice_command_history') || '[]')
    history.push({
      command,
      timestamp: Date.now(),
      language: this.config.language
    })
    
    // 只保留最近的100条记录
    if (history.length > 100) {
      history.shift()
    }
    
    localStorage.setItem('voice_command_history', JSON.stringify(history))
  }

  /**
   * 获取支持的语言列表
   */
  static getSupportedLanguages(): Array<{
    code: string
    name: string
    nativeName: string
  }> {
    return [
      { code: 'zh-CN', name: 'Chinese (Simplified)', nativeName: '简体中文' },
      { code: 'zh-TW', name: 'Chinese (Traditional)', nativeName: '繁體中文' },
      { code: 'en-US', name: 'English (US)', nativeName: 'English' },
      { code: 'en-GB', name: 'English (UK)', nativeName: 'English' },
      { code: 'ja-JP', name: 'Japanese', nativeName: '日本語' },
      { code: 'ko-KR', name: 'Korean', nativeName: '한국어' },
      { code: 'fr-FR', name: 'French', nativeName: 'Français' },
      { code: 'de-DE', name: 'German', nativeName: 'Deutsch' },
      { code: 'es-ES', name: 'Spanish', nativeName: 'Español' },
      { code: 'ru-RU', name: 'Russian', nativeName: 'Русский' },
      { code: 'ar-SA', name: 'Arabic', nativeName: 'العربية' },
      { code: 'hi-IN', name: 'Hindi', nativeName: 'हिन्दी' }
    ]
  }

  /**
   * 获取识别历史
   */
  getHistory(): SpeechRecognitionResult[] {
    return [...this.resultHistory]
  }

  /**
   * 清空历史
   */
  clearHistory(): void {
    this.resultHistory = []
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isListening: this.isListening,
      language: this.config.language,
      historySize: this.resultHistory.length,
      lastResultTime: this.lastResultTime
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
    this.stop()
    this.stopSilenceDetection()
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
      this.mediaStream = null
    }
    
    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    
    this.listeners.clear()
    this.resultHistory = []
    this.isInitialized = false
    this.isListening = false
  }
}
```

### **5.1.2 语音合成引擎**

**src/core/voice/SpeechSynthesisEngine.ts:**

```typescript
/**
 * @file SpeechSynthesisEngine.ts
 * @description 语音合成引擎 - 支持多语言TTS
 */

export interface SpeechSynthesisConfig {
  language: string
  voice: string
  volume: number // 0-1
  rate: number // 0.1-10
  pitch: number // 0-2
  enableQueue: boolean
  autoPlay: boolean
  preload: boolean
  speechService?: 'web' | 'azure' | 'google'
  apiKey?: string
  endpoint?: string
}

export interface SpeechSynthesisItem {
  id: string
  text: string
  language: string
  voice: string
  rate: number
  pitch: number
  volume: number
  timestamp: number
  status: 'queued' | 'playing' | 'paused' | 'completed' | 'cancelled' | 'error'
}

export class SpeechSynthesisEngine {
  private config: SpeechSynthesisConfig
  private isInitialized: boolean = false
  private voices: SpeechSynthesisVoice[] = []
  private queue: SpeechSynthesisItem[] = []
  private currentItem: SpeechSynthesisItem | null = null
  private utterance: SpeechSynthesisUtterance | null = null
  
  private listeners: Map<string, Function[]> = new Map()
  private synthesisHistory: SpeechSynthesisItem[] = []
  private maxHistorySize: number = 100

  constructor(config?: Partial<SpeechSynthesisConfig>) {
    this.config = {
      language: 'zh-CN',
      voice: '',
      volume: 1.0,
      rate: 1.0,
      pitch: 1.0,
      enableQueue: true,
      autoPlay: true,
      preload: true,
      speechService: 'web',
      ...config
    }
  }

  /**
   * 初始化语音合成
   */
  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true

    try {
      // 检查浏览器支持
      if (!('speechSynthesis' in window)) {
        throw new Error('浏览器不支持语音合成API')
      }

      // 等待语音列表加载完成
      await this.loadVoices()

      // 设置默认语音
      if (!this.config.voice) {
        this.config.voice = this.getDefaultVoice(this.config.language)
      }

      this.isInitialized = true
      this.emit('initialized', { 
        timestamp: Date.now(),
        voices: this.voices.length
      })
      
      console.log('语音合成引擎初始化成功，可用语音数:', this.voices.length)
      return true

    } catch (error) {
      console.error('语音合成引擎初始化失败:', error)
      this.emit('error', { 
        type: 'initialization', 
        error: error.message,
        timestamp: Date.now()
      })
      return false
    }
  }

  /**
   * 加载语音列表
   */
  private loadVoices(): Promise<void> {
    return new Promise((resolve) => {
      // 检查是否已有语音
      const voices = speechSynthesis.getVoices()
      if (voices.length > 0) {
        this.voices = voices
        resolve()
        return
      }

      // 等待语音加载
      const onVoicesChanged = () => {
        this.voices = speechSynthesis.getVoices()
        if (this.voices.length > 0) {
          speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
          resolve()
        }
      }

      speechSynthesis.addEventListener('voiceschanged', onVoicesChanged)

      // 超时处理
      setTimeout(() => {
        if (this.voices.length === 0) {
          speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
          console.warn('语音加载超时')
          resolve()
        }
      }, 5000)
    })
  }

  /**
   * 获取默认语音
   */
  private getDefaultVoice(language: string): string {
    // 优先选择匹配语言的语音
    const languageVoices = this.voices.filter(voice => 
      voice.lang.startsWith(language)
    )
    
    if (languageVoices.length > 0) {
      // 优先选择本地语音
      const localVoice = languageVoices.find(voice => voice.localService)
      if (localVoice) return localVoice.voiceURI
      
      // 选择默认语音
      return languageVoices[0].voiceURI
    }

    // 如果找不到匹配语言的语音，使用英语
    const englishVoices = this.voices.filter(voice => 
      voice.lang.startsWith('en')
    )
    
    if (englishVoices.length > 0) {
      return englishVoices[0].voiceURI
    }

    // 如果还没有，使用第一个可用语音
    if (this.voices.length > 0) {
      return this.voices[0].voiceURI
    }

    return ''
  }

  /**
   * 朗读文本
   */
  async speak(text: string, options?: Partial<SpeechSynthesisItem>): Promise<string> {
    if (!this.isInitialized) {
      const initialized = await this.initialize()
      if (!initialized) throw new Error('语音合成引擎未初始化')
    }

    const item: SpeechSynthesisItem = {
      id: `tts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text,
      language: options?.language || this.config.language,
      voice: options?.voice || this.config.voice,
      rate: options?.rate ?? this.config.rate,
      pitch: options?.pitch ?? this.config.pitch,
      volume: options?.volume ?? this.config.volume,
      timestamp: Date.now(),
      status: 'queued'
    }

    // 保存到历史
    this.synthesisHistory.push(item)
    if (this.synthesisHistory.length > this.maxHistorySize) {
      this.synthesisHistory.shift()
    }

    if (this.config.enableQueue && this.currentItem) {
      // 加入队列
      this.queue.push(item)
      this.emit('queued', item)
      return item.id
    }

    // 直接播放
    return this.playItem(item)
  }

  /**
   * 播放项目
   */
  private async playItem(item: SpeechSynthesisItem): Promise<string> {
    // 停止当前播放
    this.stop()

    // 创建语音合成实例
    this.utterance = new SpeechSynthesisUtterance(item.text)
    this.currentItem = item
    item.status = 'playing'

    // 设置语音参数
    this.utterance.lang = item.language
    this.utterance.volume = item.volume
    this.utterance.rate = item.rate
    this.utterance.pitch = item.pitch

    // 设置语音
    const voice = this.voices.find(v => v.voiceURI === item.voice)
    if (voice) {
      this.utterance.voice = voice
    }

    // 设置事件监听
    this.setupUtteranceEvents()

    // 开始播放
    speechSynthesis.speak(this.utterance)
    
    this.emit('started', item)
    return item.id
  }

  /**
   * 设置语音合成事件
   */
  private setupUtteranceEvents(): void {
    if (!this.utterance || !this.currentItem) return

    const item = this.currentItem

    this.utterance.onstart = () => {
      item.status = 'playing'
      this.emit('playing', item)
    }

    this.utterance.onend = () => {
      item.status = 'completed'
      this.emit('completed', item)
      
      // 播放队列中的下一个
      this.currentItem = null
      this.utterance = null
      
      if (this.queue.length > 0 && this.config.enableQueue) {
        const nextItem = this.queue.shift()!
        this.playItem(nextItem)
      }
    }

    this.utterance.onerror = (event) => {
      item.status = 'error'
      this.emit('error', {
        type: 'synthesis',
        error: event.error,
        item,
        timestamp: Date.now()
      })
      
      // 继续播放队列中的下一个
      this.currentItem = null
      this.utterance = null
      
      if (this.queue.length > 0 && this.config.enableQueue) {
        const nextItem = this.queue.shift()!
        this.playItem(nextItem)
      }
    }

    this.utterance.onpause = () => {
      item.status = 'paused'
      this.emit('paused', item)
    }

    this.utterance.onresume = () => {
      item.status = 'playing'
      this.emit('resumed', item)
    }

    this.utterance.onboundary = (event) => {
      this.emit('boundary', {
        item,
        charIndex: event.charIndex,
        charLength: event.charLength,
        name: event.name,
        timestamp: Date.now()
      })
    }

    this.utterance.onmark = (event) => {
      this.emit('mark', {
        item,
        name: event.name,
        timestamp: Date.now()
      })
    }
  }

  /**
   * 暂停播放
   */
  pause(): boolean {
    if (speechSynthesis.speaking && !speechSynthesis.paused) {
      speechSynthesis.pause()
      
      if (this.currentItem) {
        this.currentItem.status = 'paused'
        this.emit('paused', this.currentItem)
      }
      
      return true
    }
    return false
  }

  /**
   * 恢复播放
   */
  resume(): boolean {
    if (speechSynthesis.paused) {
      speechSynthesis.resume()
      
      if (this.currentItem) {
        this.currentItem.status = 'playing'
        this.emit('resumed', this.currentItem)
      }
      
      return true
    }
    return false
  }

  /**
   * 停止播放
   */
  stop(): boolean {
    if (speechSynthesis.speaking) {
      speechSynthesis.cancel()
      
      if (this.currentItem) {
        this.currentItem.status = 'cancelled'
        this.emit('cancelled', this.currentItem)
      }
      
      this.currentItem = null
      this.utterance = null
      return true
    }
    return false
  }

  /**
   * 清除队列
   */
  clearQueue(): void {
    this.queue.forEach(item => {
      item.status = 'cancelled'
      this.emit('cancelled', item)
    })
    
    this.queue = []
    this.emit('queue-cleared', { timestamp: Date.now() })
  }

  /**
   * 设置语音
   */
  setVoice(voiceURI: string): boolean {
    const voice = this.voices.find(v => v.voiceURI === voiceURI)
    if (!voice) {
      console.warn(`语音不存在: ${voiceURI}`)
      return false
    }
    
    this.config.voice = voiceURI
    
    this.emit('voice-changed', { 
      voice: voiceURI,
      voiceName: voice.name,
      timestamp: Date.now()
    })
    
    return true
  }

  /**
   * 设置语言
   */
  setLanguage(language: string): void {
    this.config.language = language
    
    // 自动选择该语言的语音
    const defaultVoice = this.getDefaultVoice(language)
    if (defaultVoice) {
      this.config.voice = defaultVoice
    }
    
    this.emit('language-changed', { 
      language,
      voice: this.config.voice,
      timestamp: Date.now()
    })
  }

  /**
   * 获取可用语音
   */
  getVoices(): Array<{
    voiceURI: string
    name: string
    lang: string
    localService: boolean
    default: boolean
  }> {
    return this.voices.map(voice => ({
      voiceURI: voice.voiceURI,
      name: voice.name,
      lang: voice.lang,
      localService: voice.localService,
      default: voice.default
    }))
  }

  /**
   * 按语言获取语音
   */
  getVoicesByLanguage(language: string): Array<{
    voiceURI: string
    name: string
    localService: boolean
    default: boolean
  }> {
    return this.voices
      .filter(voice => voice.lang.startsWith(language))
      .map(voice => ({
        voiceURI: voice.voiceURI,
        name: voice.name,
        localService: voice.localService,
        default: voice.default
      }))
  }

  /**
   * 获取状态
   */
  getStatus() {
    return {
      isInitialized: this.isInitialized,
      isSpeaking: speechSynthesis.speaking,
      isPaused: speechSynthesis.paused,
      currentItem: this.currentItem,
      queueLength: this.queue.length,
      historySize: this.synthesisHistory.length,
      config: { ...this.config }
    }
  }

  /**
   * 获取队列
   */
  getQueue(): SpeechSynthesisItem[] {
    return [...this.queue]
  }

  /**
   * 获取历史
   */
  getHistory(): SpeechSynthesisItem[] {
    return [...this.synthesisHistory]
  }

  /**
   * 清空历史
   */
  clearHistory(): void {
    this.synthesisHistory = []
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
    this.stop()
    this.clearQueue()
    this.clearHistory()
    this.listeners.clear()
    this.isInitialized = false
  }
}