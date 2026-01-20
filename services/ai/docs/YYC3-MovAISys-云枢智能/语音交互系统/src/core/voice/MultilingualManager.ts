/**
 * @file MultilingualManager.ts
 * @description 多语言管理器 - 统一管理语音识别和合成的语言设置
 */

export interface LanguageInfo {
  code: string
  name: string
  nativeName: string
  voiceSupport: boolean
  recognitionSupport: boolean
  ttsVoices: Array<{
    voiceURI: string
    name: string
    gender: 'male' | 'female' | 'neutral'
    localService: boolean
  }>
}

export interface LanguageConfig {
  defaultLanguage: string
  fallbackLanguage: string
  autoDetect: boolean
  saveUserPreference: boolean
  supportedLanguages: string[]
}

export class MultilingualManager {
  private config: LanguageConfig
  private languages: Map<string, LanguageInfo> = new Map()
  private currentLanguage: string
  private userPreference: string | null = null
  private detectionHistory: Array<{
    language: string
    confidence: number
    timestamp: number
  }> = []
  
  private listeners: Map<string, Function[]> = new Map()

  constructor(config?: Partial<LanguageConfig>) {
    this.config = {
      defaultLanguage: 'zh-CN',
      fallbackLanguage: 'en-US',
      autoDetect: true,
      saveUserPreference: true,
      supportedLanguages: ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'fr-FR', 'de-DE', 'es-ES'],
      ...config
    }
    
    this.currentLanguage = this.config.defaultLanguage
    this.loadUserPreference()
    this.initializeLanguages()
  }

  /**
   * 初始化语言信息
   */
  private initializeLanguages(): void {
    const languageData: LanguageInfo[] = [
      {
        code: 'zh-CN',
        name: 'Chinese (Simplified)',
        nativeName: '简体中文',
        voiceSupport: true,
        recognitionSupport: true,
        ttsVoices: []
      },
      {
        code: 'zh-TW',
        name: 'Chinese (Traditional)',
        nativeName: '繁體中文',
        voiceSupport: true,
        recognitionSupport: true,
        ttsVoices: []
      },
      {
        code: 'en-US',
        name: 'English (US)',
        nativeName: 'English',
        voiceSupport: true,
        recognitionSupport: true,
        ttsVoices: []
      },
      {
        code: 'en-GB',
        name: 'English (UK)',
        nativeName: 'English',
        voiceSupport: true,
        recognitionSupport: true,
        ttsVoices: []
      },
      {
        code: 'ja-JP',
        name: 'Japanese',
        nativeName: '日本語',
        voiceSupport: true,
        recognitionSupport: true,
        ttsVoices: []
      },
      {
        code: 'ko-KR',
        name: 'Korean',
        nativeName: '한국어',
        voiceSupport: true,
        recognitionSupport: true,
        ttsVoices: []
      },
      {
        code: 'fr-FR',
        name: 'French',
        nativeName: 'Français',
        voiceSupport: true,
        recognitionSupport: true,
        ttsVoices: []
      },
      {
        code: 'de-DE',
        name: 'German',
        nativeName: 'Deutsch',
        voiceSupport: true,
        recognitionSupport: true,
        ttsVoices: []
      },
      {
        code: 'es-ES',
        name: 'Spanish',
        nativeName: 'Español',
        voiceSupport: true,
        recognitionSupport: true,
        ttsVoices: []
      },
      {
        code: 'ru-RU',
        name: 'Russian',
        nativeName: 'Русский',
        voiceSupport: true,
        recognitionSupport: true,
        ttsVoices: []
      },
      {
        code: 'ar-SA',
        name: 'Arabic',
        nativeName: 'العربية',
        voiceSupport: false,
        recognitionSupport: true,
        ttsVoices: []
      },
      {
        code: 'hi-IN',
        name: 'Hindi',
        nativeName: 'हिन्दी',
        voiceSupport: false,
        recognitionSupport: true,
        ttsVoices: []
      }
    ]

    languageData.forEach(lang => {
      this.languages.set(lang.code, lang)
    })
  }

  /**
   * 加载用户偏好
   */
  private loadUserPreference(): void {
    if (!this.config.saveUserPreference) return
    
    try {
      const saved = localStorage.getItem('voice_language_preference')
      if (saved) {
        this.userPreference = saved
        this.currentLanguage = saved
      }
    } catch (error) {
      console.error('加载语言偏好失败:', error)
    }
  }

  /**
   * 保存用户偏好
   */
  private saveUserPreference(): void {
    if (!this.config.saveUserPreference) return
    
    try {
      localStorage.setItem('voice_language_preference', this.currentLanguage)
    } catch (error) {
      console.error('保存语言偏好失败:', error)
    }
  }

  /**
   * 设置当前语言
   */
  setLanguage(languageCode: string): boolean {
    const language = this.languages.get(languageCode)
    if (!language) {
      console.warn(`不支持的语言: ${languageCode}`)
      return false
    }

    const oldLanguage = this.currentLanguage
    this.currentLanguage = languageCode
    
    // 保存用户偏好
    this.saveUserPreference()
    
    // 发射语言变更事件
    this.emit('language-changed', {
      oldLanguage,
      newLanguage: languageCode,
      languageInfo: language,
      timestamp: Date.now()
    })
    
    console.log(`语言已切换为: ${language.nativeName} (${languageCode})`)
    return true
  }

  /**
   * 检测语言
   */
  detectLanguage(text: string): {
    language: string
    confidence: number
    details: any
  } {
    // 简单的语言检测算法
    const scores: Record<string, number> = {}
    
    // 中文检测
    const chineseChars = text.match(/[\u4e00-\u9fff]/g) || []
    if (chineseChars.length > 0) {
      // 判断简繁体
      const hasTraditional = text.match(/[\u4e00-\u9fff]/g)?.some(char => 
        this.isTraditionalChinese(char)
      )
      scores[hasTraditional ? 'zh-TW' : 'zh-CN'] = 
        chineseChars.length / text.length * 100
    }
    
    // 英文检测
    const englishWords = text.match(/\b[a-zA-Z]{2,}\b/g) || []
    if (englishWords.length > 0) {
      scores['en-US'] = englishWords.length / (text.split(/\s+/).length) * 100
    }
    
    // 日文检测
    const japaneseChars = text.match(/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/g) || []
    if (japaneseChars.length > 0) {
      scores['ja-JP'] = japaneseChars.length / text.length * 100
    }
    
    // 韩文检测
    const koreanChars = text.match(/[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/g) || []
    if (koreanChars.length > 0) {
      scores['ko-KR'] = koreanChars.length / text.length * 100
    }
    
    // 如果没有检测到，使用默认语言
    if (Object.keys(scores).length === 0) {
      return {
        language: this.config.defaultLanguage,
        confidence: 0.3,
        details: { method: 'default' }
      }
    }
    
    // 选择最高分数的语言
    let bestLanguage = this.config.defaultLanguage
    let bestScore = 0
    
    for (const [lang, score] of Object.entries(scores)) {
      if (score > bestScore) {
        bestScore = score
        bestLanguage = lang
      }
    }
    
    // 保存检测历史
    this.detectionHistory.push({
      language: bestLanguage,
      confidence: bestScore / 100,
      timestamp: Date.now()
    })
    
    // 限制历史记录大小
    if (this.detectionHistory.length > 100) {
      this.detectionHistory.shift()
    }
    
    return {
      language: bestLanguage,
      confidence: bestScore / 100,
      details: { scores, method: 'character-analysis' }
    }
  }

  /**
   * 判断是否为繁体中文
   */
  private isTraditionalChinese(char: string): boolean {
    // 简化的繁体字检测
    const traditionalChars = [
      '們', '麼', '為', '會', '國', '學', '時', '來', '電', '發',
      '東', '馬', '風', '龍', '鳥', '魚', '點', '體', '書', '寫'
    ]
    return traditionalChars.includes(char)
  }

  /**
   * 自动切换语言
   */
  autoSwitchLanguage(text: string): boolean {
    if (!this.config.autoDetect) return false
    
    const detection = this.detectLanguage(text)
    
    if (detection.confidence > 0.7 && 
        detection.language !== this.currentLanguage &&
        this.config.supportedLanguages.includes(detection.language)) {
      
      return this.setLanguage(detection.language)
    }
    
    return false
  }

  /**
   * 获取语言信息
   */
  getLanguageInfo(languageCode?: string): LanguageInfo | null {
    const code = languageCode || this.currentLanguage
    return this.languages.get(code) || null
  }

  /**
   * 获取当前语言
   */
  getCurrentLanguage(): string {
    return this.currentLanguage
  }

  /**
   * 获取支持的语言列表
   */
  getSupportedLanguages(): LanguageInfo[] {
    return Array.from(this.languages.values()).filter(lang =>
      this.config.supportedLanguages.includes(lang.code)
    )
  }

  /**
   * 获取所有语言
   */
  getAllLanguages(): LanguageInfo[] {
    return Array.from(this.languages.values())
  }

  /**
   * 添加TTS语音
   */
  addTTSVoice(languageCode: string, voice: any): void {
    const language = this.languages.get(languageCode)
    if (!language) return
    
    if (!language.ttsVoices.some(v => v.voiceURI === voice.voiceURI)) {
      language.ttsVoices.push({
        voiceURI: voice.voiceURI,
        name: voice.name,
        gender: this.detectVoiceGender(voice.name),
        localService: voice.localService
      })
      
      this.emit('voice-added', {
        language: languageCode,
        voice: voice.name,
        timestamp: Date.now()
      })
    }
  }

  /**
   * 检测语音性别
   */
  private detectVoiceGender(voiceName: string): 'male' | 'female' | 'neutral' {
    const lowerName = voiceName.toLowerCase()
    
    if (lowerName.includes('female') || lowerName.includes('woman') || 
        lowerName.includes('女') || lowerName.includes('female')) {
      return 'female'
    }
    
    if (lowerName.includes('male') || lowerName.includes('man') || 
        lowerName.includes('男') || lowerName.includes('male')) {
      return 'male'
    }
    
    return 'neutral'
  }

  /**
   * 获取语音列表
   */
  getVoicesForLanguage(languageCode: string): Array<{
    voiceURI: string
    name: string
    gender: 'male' | 'female' | 'neutral'
    localService: boolean
  }> {
    const language = this.languages.get(languageCode)
    if (!language) return []
    
    return [...language.ttsVoices]
  }

  /**
   * 获取推荐语音
   */
  getRecommendedVoice(languageCode: string): string | null {
    const voices = this.getVoicesForLanguage(languageCode)
    if (voices.length === 0) return null
    
    // 优先选择本地服务
    const localVoice = voices.find(v => v.localService)
    if (localVoice) return localVoice.voiceURI
    
    // 优先选择女性语音（通常更清晰）
    const femaleVoice = voices.find(v => v.gender === 'female')
    if (femaleVoice) return femaleVoice.voiceURI
    
    // 返回第一个语音
    return voices[0].voiceURI
  }

  /**
   * 获取检测历史
   */
  getDetectionHistory(): Array<{
    language: string
    confidence: number
    timestamp: number
  }> {
    return [...this.detectionHistory]
  }

  /**
   * 获取语言使用统计
   */
  getLanguageStatistics(): Array<{
    language: string
    count: number
    lastUsed: number
    averageConfidence: number
  }> {
    const stats: Record<string, {
      count: number
      totalConfidence: number
      lastUsed: number
    }> = {}
    
    this.detectionHistory.forEach(detection => {
      if (!stats[detection.language]) {
        stats[detection.language] = {
          count: 0,
          totalConfidence: 0,
          lastUsed: 0
        }
      }
      
      stats[detection.language].count++
      stats[detection.language].totalConfidence += detection.confidence
      stats[detection.language].lastUsed = Math.max(
        stats[detection.language].lastUsed,
        detection.timestamp
      )
    })
    
    return Object.entries(stats).map(([language, data]) => ({
      language,
      count: data.count,
      lastUsed: data.lastUsed,
      averageConfidence: data.totalConfidence / data.count
    })).sort((a, b) => b.count - a.count)
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
    this.saveUserPreference()
    this.listeners.clear()
    this.detectionHistory = []
  }
}