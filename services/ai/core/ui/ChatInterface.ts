/**
 * @file 聊天界面组件实现
 * @description 实现IChatInterface接口，提供完整的聊天交互功能
 * @module ui/ChatInterface
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { EventEmitter } from 'events';
import {
  IChatInterface,
  ChatMessage,
  ChatSession,
  SessionTemplate,
  HistoryOptions,
  ReplyContext,
  SuggestedReply,
  ExportedConversation,
  ExportFormat,
  Attachment,
  AudioBlob,
  ImageBlob,
  ScreenShareStream,
  ChatTheme,
  ChatLayout,
  ChatThemeConfig,
} from './types';
import {
  NotFoundError,
  ValidationError,
  InternalError,
  YYC3Error
} from '../error-handler/ErrorTypes';
import { ErrorHandler } from '../error-handler/ErrorHandler';
import { ErrorBoundary } from '../error-handler/ErrorBoundary';

export class ChatInterface extends EventEmitter implements IChatInterface {
  private sessions: Map<string, ChatSession>;
  private currentSessionId: string | null;
  private isTyping: boolean;
  private theme: ChatTheme;
  private layout: ChatLayout;
  private themeConfig: ChatThemeConfig;
  private visible: boolean;
  private minimized: boolean;
  private messageQueue: Map<string, ChatMessage[]>;
  private errorHandler: ErrorHandler;
  private errorBoundary: ErrorBoundary;

  constructor(errorHandler?: ErrorHandler) {
    super();
    this.sessions = new Map();
    this.currentSessionId = null;
    this.isTyping = false;
    this.theme = 'auto';
    this.layout = 'default';
    this.visible = true;
    this.minimized = false;
    this.messageQueue = new Map();
    
    this.errorHandler = errorHandler || new ErrorHandler({ enableAutoRecovery: true });
    this.errorBoundary = new ErrorBoundary(this.errorHandler, {
      enableRecovery: true,
      maxRetries: 3,
      retryDelay: 1000
    });
    
    this.initializeDefaultTheme();
    this.setupErrorHandling();
  }

  private setupErrorHandling(): void {
    this.errorBoundary.on('error', (errorInfo) => {
      this.emit('error', errorInfo);
    });

    this.errorBoundary.on('recovery', (recoveryInfo) => {
      this.emit('recovery', recoveryInfo);
    });

    this.on('error', (errorInfo) => {
      console.error('[ChatInterface Error]', errorInfo);
    });
  }

  private initializeDefaultTheme(): void {
    this.themeConfig = {
      primaryColor: '#3b82f6',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      messageBackgroundColor: '#f3f4f6',
      accentColor: '#8b5cf6',
    };
  }

  async sendMessage(message: ChatMessage): Promise<string> {
    return this.errorBoundary.withRetry(async () => {
      const session = this.getCurrentSession();
      if (!session) {
        throw new ValidationError('No active session');
      }

      message.id = message.id || this.generateId();
      message.timestamp = message.timestamp || Date.now();
      message.status = 'sending';

      session.messages.push(message);
      session.updatedAt = Date.now();

      this.emit('message:sending', message);

      try {
        const response = await this.processMessage(message);
        message.status = 'sent';
        this.emit('message:sent', message);
        return response;
      } catch (error) {
        message.status = 'error';
        this.emit('message:error', { message, error });
        throw error;
      }
    }, {
      operation: 'sendMessage',
      sessionId: this.currentSessionId,
      messageId: message.id
    });
  }

  private async processMessage(message: ChatMessage): Promise<string> {
    this.emit('message:processing', message);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        const responseId = this.generateId();
        const response: ChatMessage = {
          id: responseId,
          role: 'assistant',
          content: `这是对消息的响应: ${message.content}`,
          timestamp: Date.now(),
          status: 'sent',
        };
        
        const session = this.getCurrentSession();
        if (session) {
          session.messages.push(response);
          session.updatedAt = Date.now();
        }
        
        this.emit('message:received', response);
        resolve(response.content);
      }, 1000);
    });
  }

  async editMessage(messageId: string, newContent: string): Promise<void> {
    const session = this.getCurrentSession();
    if (!session) {
      throw new ValidationError('No active session');
    }

    const message = session.messages.find(m => m.id === messageId);
    if (!message) {
      throw new NotFoundError('message', messageId);
    }

    const oldContent = message.content;
    message.content = newContent;
    message.timestamp = Date.now();
    session.updatedAt = Date.now();

    this.emit('message:edited', { messageId, oldContent, newContent });
  }

  async deleteMessage(messageId: string): Promise<void> {
    const session = this.getCurrentSession();
    if (!session) {
      throw new ValidationError('No active session');
    }

    const index = session.messages.findIndex(m => m.id === messageId);
    if (index === -1) {
      throw new NotFoundError('message', messageId);
    }

    const deletedMessage = session.messages.splice(index, 1)[0];
    session.updatedAt = Date.now();

    this.emit('message:deleted', { messageId, message: deletedMessage });
  }

  getMessageHistory(options?: HistoryOptions): ChatMessage[] {
    const session = this.getCurrentSession();
    if (!session) {
      return [];
    }

    let messages = [...session.messages];

    if (!options?.includeSystem) {
      messages = messages.filter(m => m.role !== 'system');
    }

    if (options?.before) {
      messages = messages.filter(m => m.timestamp < options.before);
    }

    if (options?.after) {
      messages = messages.filter(m => m.timestamp > options.after);
    }

    if (options?.limit) {
      messages = messages.slice(-options.limit);
    }

    return messages;
  }

  async clearHistory(): Promise<void> {
    const session = this.getCurrentSession();
    if (!session) {
      throw new ValidationError('No active session');
    }

    const clearedMessages = [...session.messages];
    session.messages = [];
    session.updatedAt = Date.now();

    this.emit('history:cleared', { sessionId: session.id, clearedMessages });
  }

  createNewSession(template?: SessionTemplate): string {
    const sessionId = this.generateId();
    const session: ChatSession = {
      id: sessionId,
      name: template?.name || `会话 ${new Date().toLocaleString('zh-CN')}`,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      template,
      model: template?.model,
    };

    if (template?.systemPrompt) {
      session.messages.push({
        id: this.generateId(),
        role: 'system',
        content: template.systemPrompt,
        timestamp: Date.now(),
      });
    }

    this.sessions.set(sessionId, session);
    this.emit('session:created', session);
    
    return sessionId;
  }

  async switchSession(sessionId: string): Promise<void> {
    if (!this.sessions.has(sessionId)) {
      throw new NotFoundError('session', sessionId);
    }

    this.currentSessionId = sessionId;
    const session = this.sessions.get(sessionId);
    this.emit('session:switched', session);
  }

  getCurrentSession(): ChatSession {
    if (!this.currentSessionId) {
      const sessionId = this.createNewSession();
      this.currentSessionId = sessionId;
    }

    const session = this.sessions.get(this.currentSessionId);
    if (!session) {
      throw new InternalError('Current session not found');
    }

    return session;
  }

  listSessions(): ChatSession[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  renameSession(sessionId: string, newName: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundError('session', sessionId);
    }

    const oldName = session.name;
    session.name = newName;
    session.updatedAt = Date.now();

    this.emit('session:renamed', { sessionId, oldName, newName });
  }

  async suggestReplies(context: ReplyContext): Promise<SuggestedReply[]> {
    const suggestions: SuggestedReply[] = [
      {
        text: '请详细说明一下',
        confidence: 0.9,
        category: 'clarification',
      },
      {
        text: '这很有帮助，谢谢',
        confidence: 0.85,
        category: 'gratitude',
      },
      {
        text: '能否提供更多例子',
        confidence: 0.8,
        category: 'request',
      },
    ];

    this.emit('replies:suggested', suggestions);
    return suggestions;
  }

  async translateMessage(messageId: string, targetLanguage: string): Promise<string> {
    const session = this.getCurrentSession();
    const message = session?.messages.find(m => m.id === messageId);
    
    if (!message) {
      throw new NotFoundError('message', messageId);
    }

    const translatedContent = `[翻译到${targetLanguage}] ${message.content}`;
    this.emit('message:translated', { messageId, targetLanguage, translatedContent });
    
    return translatedContent;
  }

  async summarizeConversation(): Promise<string> {
    const session = this.getCurrentSession();
    if (!session || session.messages.length === 0) {
      return '暂无对话内容';
    }

    const summary = `本次对话共包含 ${session.messages.length} 条消息，最后更新于 ${new Date(session.updatedAt).toLocaleString('zh-CN')}`;
    this.emit('conversation:summarized', { sessionId: session.id, summary });
    
    return summary;
  }

  async exportConversation(format: ExportFormat): Promise<ExportedConversation> {
    const session = this.getCurrentSession();
    if (!session) {
      throw new ValidationError('No active session', 'session', {
        additionalData: { format }
      });
    }

    let content = '';
    
    switch (format) {
      case 'json':
        content = JSON.stringify(session, null, 2);
        break;
      case 'markdown':
        content = this.convertToMarkdown(session);
        break;
      case 'txt':
        content = this.convertToText(session);
        break;
      default:
        content = JSON.stringify(session, null, 2);
    }

    const exported: ExportedConversation = {
      format,
      content,
      metadata: {
        exportedAt: Date.now(),
        messageCount: session.messages.length,
        sessionName: session.name,
      },
    };

    this.emit('conversation:exported', exported);
    return exported;
  }

  private convertToMarkdown(session: ChatSession): string {
    let markdown = `# ${session.name}\n\n`;
    markdown += `导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
    markdown += `---\n\n`;

    for (const message of session.messages) {
      const roleLabel = message.role === 'user' ? '用户' : message.role === 'assistant' ? '助手' : '系统';
      markdown += `**${roleLabel}** (${new Date(message.timestamp).toLocaleString('zh-CN')}):\n\n`;
      markdown += `${message.content}\n\n`;
      if (message.attachments && message.attachments.length > 0) {
        markdown += `附件: ${message.attachments.map(a => a.name).join(', ')}\n\n`;
      }
      markdown += `---\n\n`;
    }

    return markdown;
  }

  private convertToText(session: ChatSession): string {
    let text = `${session.name}\n`;
    text += `导出时间: ${new Date().toLocaleString('zh-CN')}\n\n`;

    for (const message of session.messages) {
      const roleLabel = message.role === 'user' ? '用户' : message.role === 'assistant' ? '助手' : '系统';
      text += `[${roleLabel}] ${new Date(message.timestamp).toLocaleString('zh-CN')}\n`;
      text += `${message.content}\n\n`;
    }

    return text;
  }

  async uploadAttachment(file: File): Promise<Attachment> {
    const attachment: Attachment = {
      id: this.generateId(),
      type: this.getAttachmentType(file.type),
      name: file.name,
      url: URL.createObjectURL(file),
      size: file.size,
      mimeType: file.type,
    };

    this.emit('attachment:uploaded', attachment);
    return attachment;
  }

  private getAttachmentType(mimeType: string): Attachment['type'] {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.includes('pdf') || mimeType.includes('document')) return 'document';
    return 'document';
  }

  async recordVoice(): Promise<AudioBlob> {
    return new Promise((resolve, reject) => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        reject(new InternalError('浏览器不支持录音功能', {
          additionalData: { feature: 'getUserMedia' }
        }));
        return;
      }

      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(stream => {
          const mediaRecorder = new MediaRecorder(stream);
          const chunks: BlobPart[] = [];

          mediaRecorder.ondataavailable = (e) => {
            chunks.push(e.data);
          };

          mediaRecorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/webm' }) as AudioBlob;
            stream.getTracks().forEach(track => track.stop());
            this.emit('voice:recorded', blob);
            resolve(blob);
          };

          mediaRecorder.start();
          setTimeout(() => mediaRecorder.stop(), 5000);
        })
        .catch(reject);
    });
  }

  async takePicture(): Promise<ImageBlob> {
    return new Promise((resolve, reject) => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        reject(new InternalError('浏览器不支持拍照功能', {
          additionalData: { feature: 'getUserMedia' }
        }));
        return;
      }

      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          const video = document.createElement('video');
          video.srcObject = stream;
          video.play();

          setTimeout(() => {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            canvas.getContext('2d')?.drawImage(video, 0, 0);
            
            canvas.toBlob((blob) => {
              stream.getTracks().forEach(track => track.stop());
              if (blob) {
                const imageBlob = blob as ImageBlob;
                this.emit('picture:taken', imageBlob);
                resolve(imageBlob);
              } else {
                reject(new Error('Failed to capture image'));
              }
            }, 'image/jpeg');
          }, 100);
        })
        .catch(reject);
    });
  }

  async shareScreen(): Promise<ScreenShareStream> {
    return new Promise((resolve, reject) => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        reject(new InternalError('浏览器不支持屏幕共享功能', {
          additionalData: { feature: 'getDisplayMedia' }
        }));
        return;
      }

      navigator.mediaDevices.getDisplayMedia({ video: true })
        .then(stream => {
          this.emit('screen:shared', stream);
          resolve(stream);
        })
        .catch(reject);
    });
  }

  startTypingIndicator(): void {
    this.isTyping = true;
    this.emit('typing:started');
  }

  stopTypingIndicator(): void {
    this.isTyping = false;
    this.emit('typing:stopped');
  }

  markMessageAsRead(messageId: string): void {
    const session = this.getCurrentSession();
    const message = session?.messages.find(m => m.id === messageId);
    
    if (message) {
      message.status = 'read';
      this.emit('message:read', messageId);
    }
  }

  getUnreadCount(): number {
    const session = this.getCurrentSession();
    if (!session) return 0;
    
    return session.messages.filter(m => 
      m.role === 'assistant' && m.status !== 'read'
    ).length;
  }

  show(): void {
    this.visible = true;
    this.minimized = false;
    this.emit('visibility:changed', { visible: true, minimized: false });
  }

  hide(): void {
    this.visible = false;
    this.emit('visibility:changed', { visible: false, minimized: this.minimized });
  }

  minimize(): void {
    this.minimized = true;
    this.emit('visibility:changed', { visible: this.visible, minimized: true });
  }

  maximize(): void {
    this.minimized = false;
    this.show();
    this.emit('visibility:changed', { visible: true, minimized: false });
  }

  setTheme(theme: ChatTheme): void {
    this.theme = theme;
    this.emit('theme:changed', theme);
  }

  setLayout(layout: ChatLayout): void {
    this.layout = layout;
    this.emit('layout:changed', layout);
  }

  isVisible(): boolean {
    return this.visible;
  }

  isMinimized(): boolean {
    return this.minimized;
  }

  getTheme(): ChatTheme {
    return this.theme;
  }

  getLayout(): ChatLayout {
    return this.layout;
  }

  getThemeConfig(): ChatThemeConfig {
    return this.themeConfig;
  }

  setThemeConfig(config: Partial<ChatThemeConfig>): void {
    this.themeConfig = { ...this.themeConfig, ...config };
    this.emit('themeConfig:changed', this.themeConfig);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
