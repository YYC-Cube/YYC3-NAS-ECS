/**
 * @file AIChatWidget - AI聊天组件
 * @description 提供完整的AI聊天界面，支持语音输入、快捷键、对话导出等功能
 * @module components/AIChatWidget
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-25
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Mic, 
  MicOff, 
  Download, 
  Copy, 
  Trash2, 
  Settings,
  MessageSquare,
  X,
  Keyboard,
  Volume2,
  VolumeX,
  Globe,
  ChevronDown,
  ChevronUp,
  Volume1,
  Play,
  Pause
} from 'lucide-react';
import { ChatMessage, ChatSession, VoiceRecognitionConfig, VoiceRecognitionResult } from '../../types/chat';
import { logService } from '../../services/logService';
import { LogLevel, LogCategory } from '../../types/logs';

interface AIChatWidgetProps {
  className?: string;
  initialMessages?: ChatMessage[];
  onSendMessage?: (message: string) => Promise<string>;
  onExport?: (format: 'json' | 'markdown' | 'txt') => void;
  theme?: 'light' | 'dark';
}

interface VoiceRecognitionState {
  isListening: boolean;
  transcript: string;
  isSupported: boolean;
  error?: string;
  audioLevel: number;
  confidence: number;
}

interface VoiceCommand {
  keyword: string;
  description: string;
  action: () => void;
}

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'zh-CN', name: '中文（简体）' },
  { code: 'zh-TW', name: '中文（繁体）' },
  { code: 'en-US', name: 'English (US)' },
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'ja-JP', name: '日本語' },
  { code: 'ko-KR', name: '한국어' },
  { code: 'fr-FR', name: 'Français' },
  { code: 'de-DE', name: 'Deutsch' },
  { code: 'es-ES', name: 'Español' },
  { code: 'ru-RU', name: 'Русский' }
];

const VOICE_COMMANDS: VoiceCommand[] = [
  { keyword: '发送', description: '发送当前消息', action: () => {} },
  { keyword: '清空', description: '清空输入框', action: () => {} },
  { keyword: '取消', description: '取消语音输入', action: () => {} },
  { keyword: '导出', description: '导出对话', action: () => {} },
  { keyword: '帮助', description: '显示帮助', action: () => {} }
];

export const AIChatWidget: React.FC<AIChatWidgetProps> = ({
  className = '',
  initialMessages = [],
  onSendMessage,
  onExport,
  theme = 'light'
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showVoiceSettings, setShowVoiceSettings] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('zh-CN');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [voiceConfig, setVoiceConfig] = useState<VoiceRecognitionConfig>({
    language: 'zh-CN',
    continuous: true,
    interimResults: true,
    maxAlternatives: 1,
    noiseSuppression: true,
    autoGainControl: true,
    echoCancellation: true
  });
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState(true);
  
  const voiceState = useRef<VoiceRecognitionState>({
    isListening: false,
    transcript: '',
    isSupported: false,
    audioLevel: 0,
    confidence: 0
  });
  
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    initializeVoiceRecognition();
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      
      if (e.ctrlKey && e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
      
      if (e.key === 'Escape') {
        inputRef.current?.blur();
      }
      
      if (e.ctrlKey && e.shiftKey && e.key === '?') {
        e.preventDefault();
        setShowShortcuts(!showShortcuts);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputValue, showShortcuts]);

  const initializeVoiceRecognition = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || 
                             (window as any).SpeechRecognition;
    
    if (!SpeechRecognition) {
      voiceState.current.isSupported = false;
      logService.addLog({
        level: LogLevel.WARN,
        category: LogCategory.LLM,
        service: 'AIChatWidget',
        message: '浏览器不支持语音识别API'
      });
      return;
    }

    voiceState.current.isSupported = true;
    
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = voiceConfig.continuous;
    recognitionRef.current.interimResults = voiceConfig.interimResults;
    recognitionRef.current.lang = voiceConfig.language;
    recognitionRef.current.maxAlternatives = voiceConfig.maxAlternatives;

    recognitionRef.current.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';
      let maxConfidence = 0;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        const confidence = event.results[i][0].confidence || 0;
        
        if (confidence > maxConfidence) {
          maxConfidence = confidence;
        }
        
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
          
          const result: VoiceRecognitionResult = {
            transcript,
            confidence,
            isFinal: true,
            alternatives: [],
            timestamp: Date.now(),
            language: voiceConfig.language
          };
          
          checkVoiceCommands(transcript);
        } else {
          interimTranscript += transcript;
        }
      }

      voiceState.current.confidence = maxConfidence;

      if (finalTranscript) {
        setInputValue(prev => prev + finalTranscript);
        voiceState.current.transcript = '';
        
        logService.addLog({
          level: LogLevel.INFO,
          category: LogCategory.LLM,
          service: 'AIChatWidget',
          message: `语音识别完成: ${finalTranscript.substring(0, 50)}...`,
          details: { confidence: maxConfidence, language: voiceConfig.language }
        });
      } else {
        voiceState.current.transcript = interimTranscript;
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('语音识别错误:', event.error);
      voiceState.current.isListening = false;
      voiceState.current.error = event.error;
      
      logService.addLog({
        level: LogLevel.ERROR,
        category: LogCategory.LLM,
        service: 'AIChatWidget',
        message: `语音识别错误: ${event.error}`,
        details: { errorType: event.error }
      });

      if (audioFeedbackEnabled) {
        playErrorSound();
      }
    };

    recognitionRef.current.onend = () => {
      if (voiceState.current.isListening) {
        try {
          recognitionRef.current.start();
        } catch (error) {
          voiceState.current.isListening = false;
          logService.addLog({
            level: LogLevel.WARN,
            category: LogCategory.LLM,
            service: 'AIChatWidget',
            message: '语音识别自动重启失败'
          });
        }
      }
      
      stopAudioMonitoring();
    };

    recognitionRef.current.onstart = () => {
      voiceState.current.isListening = true;
      startAudioMonitoring();
      
      if (audioFeedbackEnabled) {
        playStartSound();
      }
    };
  };

  const checkVoiceCommands = (transcript: string) => {
    const normalizedTranscript = transcript.toLowerCase().trim();
    
    for (const command of VOICE_COMMANDS) {
      if (normalizedTranscript.includes(command.keyword.toLowerCase())) {
        logService.addLog({
          level: LogLevel.INFO,
          category: LogCategory.LLM,
          service: 'AIChatWidget',
          message: `识别到语音命令: ${command.keyword}`
        });

        switch (command.keyword) {
          case '发送':
            handleSendMessage();
            break;
          case '清空':
            setInputValue('');
            break;
          case '取消':
            toggleVoiceRecognition();
            break;
          case '导出':
            handleExportConversation('json');
            break;
          case '帮助':
            setShowShortcuts(true);
            break;
        }
        break;
      }
    }
  };

  const startAudioMonitoring = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      
      const updateAudioLevel = () => {
        if (!voiceState.current.isListening || !analyserRef.current) {
          return;
        }
        
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        voiceState.current.audioLevel = average / 255;
        
        requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('音频监控启动失败:', error);
      logService.addLog({
        level: LogLevel.WARN,
        category: LogCategory.LLM,
        service: 'AIChatWidget',
        message: '音频监控启动失败'
      });
    }
  };

  const stopAudioMonitoring = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    voiceState.current.audioLevel = 0;
  };

  const playStartSound = () => {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  const playStopSound = () => {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 600;
    oscillator.type = 'sine';
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.15);
  };

  const playErrorSound = () => {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 200;
    oscillator.type = 'square';
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const toggleVoiceRecognition = () => {
    if (!voiceState.current.isSupported) {
      alert('您的浏览器不支持语音识别功能');
      return;
    }

    if (voiceState.current.isListening) {
      recognitionRef.current?.stop();
      voiceState.current.isListening = false;
      
      if (audioFeedbackEnabled) {
        playStopSound();
      }
      
      logService.addLog({
        level: LogLevel.INFO,
        category: LogCategory.LLM,
        service: 'AIChatWidget',
        message: '停止语音识别'
      });
    } else {
      try {
        recognitionRef.current?.start();
        voiceState.current.isListening = true;
        
        logService.addLog({
          level: LogLevel.INFO,
          category: LogCategory.LLM,
          service: 'AIChatWidget',
          message: `开始语音识别 (语言: ${voiceConfig.language})`,
          details: { language: voiceConfig.language, config: voiceConfig }
        });
      } catch (error) {
        console.error('启动语音识别失败:', error);
        logService.addLog({
          level: LogLevel.ERROR,
          category: LogCategory.LLM,
          service: 'AIChatWidget',
          message: '启动语音识别失败',
          details: { error: error instanceof Error ? error.message : '未知错误' }
        });
        
        if (audioFeedbackEnabled) {
          playErrorSound();
        }
      }
    }
  };

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    setVoiceConfig(prev => ({ ...prev, language: languageCode }));
    
    if (recognitionRef.current) {
      recognitionRef.current.lang = languageCode;
    }
    
    setShowLanguageDropdown(false);
    
    logService.addLog({
      level: LogLevel.INFO,
      category: LogCategory.LLM,
      service: 'AIChatWidget',
      message: `切换识别语言: ${languageCode}`
    });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    logService.addLog({
      level: LogLevel.INFO,
      category: LogCategory.LLM,
      service: 'AIChatWidget',
      message: `用户发送消息: ${userMessage.content.substring(0, 50)}...`
    });

    try {
      let responseText = '';
      
      if (onSendMessage) {
        responseText = await onSendMessage(userMessage.content);
      } else {
        await new Promise(resolve => setTimeout(resolve, 1000));
        responseText = `这是一个模拟的AI回复: ${userMessage.content}`;
      }

      const aiMessage: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, aiMessage]);

      logService.addLog({
        level: LogLevel.INFO,
        category: LogCategory.LLM,
        service: 'AIChatWidget',
        message: `AI回复消息: ${responseText.substring(0, 50)}...`
      });
    } catch (error) {
      logService.addLog({
        level: LogLevel.ERROR,
        category: LogCategory.LLM,
        service: 'AIChatWidget',
        message: `发送消息失败: ${error instanceof Error ? error.message : '未知错误'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportConversation = (format: 'json' | 'markdown' | 'txt') => {
    const session: ChatSession = {
      id: `session-${Date.now()}`,
      name: 'AI对话',
      messages,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    let content = '';
    let filename = '';
    let mimeType = '';

    switch (format) {
      case 'json':
        content = JSON.stringify(session, null, 2);
        filename = `ai-chat-${Date.now()}.json`;
        mimeType = 'application/json';
        break;
      case 'markdown':
        content = convertToMarkdown(session);
        filename = `ai-chat-${Date.now()}.md`;
        mimeType = 'text/markdown';
        break;
      case 'txt':
        content = convertToText(session);
        filename = `ai-chat-${Date.now()}.txt`;
        mimeType = 'text/plain';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    logService.addLog({
      level: LogLevel.INFO,
      category: LogCategory.LLM,
      service: 'AIChatWidget',
      message: `导出对话: ${format}`
    });

    if (onExport) {
      onExport(format);
    }
  };

  const convertToMarkdown = (session: ChatSession): string => {
    let markdown = `# ${session.name}\n\n`;
    markdown += `导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
    markdown += `---\n\n`;

    for (const message of session.messages) {
      const roleLabel = message.role === 'user' ? '用户' : 'AI助手';
      markdown += `**${roleLabel}** (${new Date(message.timestamp).toLocaleString('zh-CN')}):\n\n`;
      markdown += `${message.content}\n\n`;
      markdown += `---\n\n`;
    }

    return markdown;
  };

  const convertToText = (session: ChatSession): string => {
    let text = `${session.name}\n`;
    text += `导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
    text += `${'='.repeat(50)}\n\n`;

    for (const message of session.messages) {
      const roleLabel = message.role === 'user' ? '用户' : 'AI助手';
      text += `[${roleLabel}] ${new Date(message.timestamp).toLocaleString('zh-CN')}\n`;
      text += `${message.content}\n\n`;
      text += `${'-'.repeat(50)}\n\n`;
    }

    return text;
  };

  const handleCopyMessage = (message: ChatMessage) => {
    navigator.clipboard.writeText(message.content);
    
    logService.addLog({
      level: LogLevel.INFO,
      category: LogCategory.LLM,
      service: 'AIChatWidget',
      message: '复制消息内容'
    });
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    
    logService.addLog({
      level: LogLevel.INFO,
      category: LogCategory.LLM,
      service: 'AIChatWidget',
      message: `删除消息: ${messageId}`
    });
  };

  const handleClearMessages = () => {
    if (confirm('确定要清空所有对话吗？')) {
      setMessages([]);
      
      logService.addLog({
        level: LogLevel.INFO,
        category: LogCategory.LLM,
        service: 'AIChatWidget',
        message: '清空所有对话'
      });
    }
  };

  const handleSpeakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'zh-CN';
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      
      logService.addLog({
        level: LogLevel.INFO,
        category: LogCategory.LLM,
        service: 'AIChatWidget',
        message: '朗读消息'
      });
    }
  };

  const handleStopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      
      logService.addLog({
        level: LogLevel.INFO,
        category: LogCategory.LLM,
        service: 'AIChatWidget',
        message: '停止朗读'
      });
    }
  };

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'k',
      ctrl: true,
      description: '聚焦输入框',
      action: () => inputRef.current?.focus()
    },
    {
      key: 'Enter',
      ctrl: true,
      description: '发送消息',
      action: handleSendMessage
    },
    {
      key: 'Enter',
      ctrl: true,
      shift: true,
      description: '换行',
      action: () => setInputValue(prev => prev + '\n')
    },
    {
      key: 'Escape',
      description: '取消输入',
      action: () => {
        setInputValue('');
        inputRef.current?.blur();
      }
    },
    {
      key: '?',
      ctrl: true,
      shift: true,
      description: '显示/隐藏快捷键',
      action: () => setShowShortcuts(!showShortcuts)
    }
  ];

  const renderAudioLevelIndicator = () => {
    if (!voiceState.current.isListening) return null;
    
    const level = voiceState.current.audioLevel;
    const bars = 10;
    
    return (
      <div className="audio-level-indicator">
        {[...Array(bars)].map((_, i) => {
          const isActive = i < Math.ceil(level * bars);
          return (
            <motion.div
              key={i}
              className={`audio-bar ${isActive ? 'active' : ''}`}
              initial={{ height: 0 }}
              animate={{ height: isActive ? '100%' : '20%' }}
              transition={{ duration: 0.1 }}
            />
          );
        })}
      </div>
    );
  };

  const renderConfidenceIndicator = () => {
    if (!voiceState.current.isListening) return null;
    
    const confidence = voiceState.current.confidence;
    const percentage = Math.round(confidence * 100);
    
    return (
      <div className="confidence-indicator">
        <Volume1 className="w-3 h-3" />
        <span>{percentage}%</span>
      </div>
    );
  };

  return (
    <div className={`ai-chat-widget ${className}`}>
      <div className="chat-header">
        <div className="chat-title">
          <MessageSquare className="w-5 h-5" />
          <span>AI助手</span>
          {voiceState.current.isListening && (
            <motion.div
              className="recording-indicator"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="recording-dot" />
              <span>录音中</span>
            </motion.div>
          )}
        </div>
        <div className="chat-actions">
          <button
            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
            className="icon-button"
            title="语音设置"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowShortcuts(!showShortcuts)}
            className="icon-button"
            title="快捷键"
          >
            <Keyboard className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleExportConversation('json')}
            className="icon-button"
            title="导出JSON"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleClearMessages}
            className="icon-button"
            title="清空对话"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="chat-messages">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`message ${message.role}`}
            >
              <div className="message-content">
                <div className="message-role">
                  {message.role === 'user' ? '用户' : 'AI助手'}
                </div>
                <div className="message-text">{message.content}</div>
                <div className="message-actions">
                  <button
                    onClick={() => handleCopyMessage(message)}
                    className="action-button"
                    title="复制"
                  >
                    <Copy className="w-3 h-3" />
                  </button>
                  {message.role === 'assistant' && (
                    <>
                      {isSpeaking ? (
                        <button
                          onClick={handleStopSpeaking}
                          className="action-button"
                          title="停止朗读"
                        >
                          <VolumeX className="w-3 h-3" />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSpeakMessage(message.content)}
                          className="action-button"
                          title="朗读"
                        >
                          <Volume2 className="w-3 h-3" />
                        </button>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => handleDeleteMessage(message.id)}
                    className="action-button"
                    title="删除"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="message assistant loading"
          >
            <div className="message-content">
              <div className="message-role">AI助手</div>
              <div className="message-text">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <div className="input-wrapper">
          <div className="voice-controls">
            <button
              onClick={() => setShowLanguageDropdown(!showLanguageDropdown)}
              className="language-button"
              title="选择识别语言"
            >
              <Globe className="w-4 h-4" />
              <span>{selectedLanguage.split('-')[0].toUpperCase()}</span>
              {showLanguageDropdown ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
            
            <AnimatePresence>
              {showLanguageDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="language-dropdown"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageChange(lang.code)}
                      className={`language-option ${selectedLanguage === lang.code ? 'selected' : ''}`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="输入消息... (Ctrl+Enter发送)"
            className="input-field"
            rows={1}
          />
          
          <div className="input-actions">
            {renderAudioLevelIndicator()}
            {renderConfidenceIndicator()}
            
            <button
              onClick={toggleVoiceRecognition}
              className={`voice-button ${voiceState.current.isListening ? 'listening' : ''}`}
              title={voiceState.current.isListening ? '停止语音输入' : '开始语音输入'}
              disabled={!voiceState.current.isSupported}
            >
              {voiceState.current.isListening ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
            
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isLoading}
              className="send-button"
              title="发送消息"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {voiceState.current.transcript && (
          <div className="voice-transcript">
            <span className="transcript-label">识别中:</span>
            <span className="transcript-text">{voiceState.current.transcript}</span>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showVoiceSettings && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="voice-settings-panel"
          >
            <div className="settings-header">
              <h3>语音设置</h3>
              <button
                onClick={() => setShowVoiceSettings(false)}
                className="close-button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="settings-content">
              <div className="setting-group">
                <label>识别语言</label>
                <select
                  value={voiceConfig.language}
                  onChange={(e) => {
                    setVoiceConfig(prev => ({ ...prev, language: e.target.value }));
                    setSelectedLanguage(e.target.value);
                    if (recognitionRef.current) {
                      recognitionRef.current.lang = e.target.value;
                    }
                  }}
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="setting-group">
                <label>连续识别</label>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={voiceConfig.continuous}
                    onChange={(e) => setVoiceConfig(prev => ({ ...prev, continuous: e.target.checked }))}
                  />
                  <span className="slider" />
                </div>
              </div>
              
              <div className="setting-group">
                <label>显示临时结果</label>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={voiceConfig.interimResults}
                    onChange={(e) => setVoiceConfig(prev => ({ ...prev, interimResults: e.target.checked }))}
                  />
                  <span className="slider" />
                </div>
              </div>
              
              <div className="setting-group">
                <label>音频反馈</label>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={audioFeedbackEnabled}
                    onChange={(e) => setAudioFeedbackEnabled(e.target.checked)}
                  />
                  <span className="slider" />
                </div>
              </div>
              
              <div className="setting-group">
                <label>语音命令</label>
                <div className="voice-commands-list">
                  {VOICE_COMMANDS.map((command, index) => (
                    <div key={index} className="voice-command-item">
                      <span className="command-keyword">"{command.keyword}"</span>
                      <span className="command-description">{command.description}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="setting-actions">
                <button
                  onClick={() => {
                    setVoiceConfig({
                      language: 'zh-CN',
                      continuous: true,
                      interimResults: true,
                      maxAlternatives: 1,
                      noiseSuppression: true,
                      autoGainControl: true,
                      echoCancellation: true
                    });
                    setSelectedLanguage('zh-CN');
                    setAudioFeedbackEnabled(true);
                  }}
                  className="reset-button"
                >
                  重置默认
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="shortcuts-panel"
          >
            <div className="shortcuts-header">
              <h3>键盘快捷键</h3>
              <button
                onClick={() => setShowShortcuts(false)}
                className="close-button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="shortcuts-list">
              {shortcuts.map((shortcut, index) => (
                <div key={index} className="shortcut-item">
                  <div className="shortcut-keys">
                    {shortcut.ctrl && <kbd>Ctrl</kbd>}
                    {shortcut.shift && <kbd>Shift</kbd>}
                    {shortcut.alt && <kbd>Alt</kbd>}
                    <kbd>{shortcut.key}</kbd>
                  </div>
                  <div className="shortcut-description">
                    {shortcut.description}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
