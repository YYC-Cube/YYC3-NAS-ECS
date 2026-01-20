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