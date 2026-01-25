/**
 * @file 聊天类型定义
 * @description 定义AI聊天组件的类型接口
 * @module types/chat
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-25
 */

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  attachments?: Attachment[];
  metadata?: Record<string, any>;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error';
  reactions?: MessageReaction[];
}

export interface Attachment {
  id: string;
  type: 'image' | 'audio' | 'video' | 'document' | 'code';
  name: string;
  url: string;
  size?: number;
  mimeType?: string;
  thumbnail?: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface ChatSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
  model?: string;
  template?: SessionTemplate;
}

export interface SessionTemplate {
  id: string;
  name: string;
  description: string;
  systemPrompt?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  tools?: string[];
}

export interface HistoryOptions {
  limit?: number;
  before?: number;
  after?: number;
  includeSystem?: boolean;
}

export interface ReplyContext {
  lastMessage: string;
  conversationSummary?: string;
  userIntent?: string;
}

export interface SuggestedReply {
  text: string;
  confidence: number;
  category?: string;
}

export interface ExportedConversation {
  format: 'json' | 'markdown' | 'txt';
  content: string;
  metadata: {
    exportedAt: number;
    messageCount: number;
    sessionName: string;
  };
}

export interface VoiceRecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  echoCancellation: boolean;
  speechRecognitionService?: 'web' | 'azure' | 'google' | 'whisper';
  apiKey?: string;
  endpoint?: string;
}

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives: Array<{
    transcript: string;
    confidence: number;
  }>;
  timestamp: number;
  language: string;
}

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: () => void;
}

export interface ChatTheme {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  messageBackgroundColor: string;
  accentColor: string;
}

export interface ChatLayout {
  type: 'default' | 'compact' | 'expanded';
  showHeader: boolean;
  showTimestamps: boolean;
  showAvatars: boolean;
}
