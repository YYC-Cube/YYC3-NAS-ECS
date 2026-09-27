/**
 * @file API服务模块 - 支持多环境配置
 * @description 根据环境配置动态选择真实API或模拟数据
 * @module services/api
 * @author YYC³
 * @version 2.0.0
 * @created 2026-01-03
 */

import { envConfig } from '../config/env';
import {
  ApiService,
  DdnsConfig,
  DdnsStatus,
  DetailedSystemStats,
  DnsUpdateRecord,
  Email,
  EmailDraft,
  FrpConfig,
  FrpStatus,
  LLMMessage,
  LogEntry,
  NasFile,
  NasShare,
  NasStatus,
  NasVolume,
  ProcessInfo,
  ScheduledEmail,
  SystemStats,
  User
} from '../types';
import { logger } from '../utils/logger';
import { RateLimiter, sanitizeObject } from '../utils/security/xss-protection';

class ApiClient {
  private baseUrl: string;
  private timeout: number;
  private rateLimiter: RateLimiter;

  constructor() {
    this.baseUrl = envConfig.getCurrentEnvironment().apiBaseUrl;
    this.timeout = parseInt((import.meta as any).env.VITE_API_TIMEOUT || '30000');
    this.rateLimiter = new RateLimiter({
      maxRequests: 100,
      windowMs: 60000,
    });
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const rateLimitResult = this.rateLimiter.check('api-client');

    if (!rateLimitResult.success) {
      throw new Error(
        `Rate limit exceeded. Please wait ${Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000)} seconds before retrying.`
      );
    }

    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // 统一契约：后端以 {success, data} 包装响应，此处解包为裸数据（对齐前端 ApiService 类型）
      if (
        data &&
        typeof data === 'object' &&
        !Array.isArray(data) &&
        'success' in data &&
        'data' in data
      ) {
        return sanitizeObject((data as { data: Record<string, unknown> }).data) as T;
      }

      return sanitizeObject(data);
    } catch (error) {
      clearTimeout(timeoutId);

      if (envConfig.isDebugEnabled()) {
        logger.error('API request error:', error);
      }

      throw error;
    }
  }

  public async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  public async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  public async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

class MockDataService {
  private generateSystemStats = (): SystemStats => ({
    cpuUsage: Math.random() * 100,
    memoryUsage: Math.random() * 100,
    diskUsage: 45 + Math.random() * 10,
    networkIn: Math.random() * 1000,
    networkOut: Math.random() * 500,
    uptime: Date.now() - 1000000,
    timestamp: new Date().toISOString(),
  });

  private generateFrpConfigs = (count = 5): FrpConfig[] => {
    return Array.from({ length: count }).map((_, i) => ({
      id: `frp-${i}`,
      name: `Service ${i + 1}`,
      type: ['tcp', 'udp', 'http', 'https'][Math.floor(Math.random() * 4)] as any,
      localIp: '127.0.0.1',
      localPort: 8000 + i,
      remotePort: 6000 + i,
      status: Math.random() > 0.2 ? 'running' : 'stopped',
    }));
  };

  private generateLogs = (count = 20): LogEntry[] => {
    return Array.from({ length: count }).map((_, i) => ({
      id: `log-${i}`,
      level: ['info', 'warn', 'error', 'debug'][Math.floor(Math.random() * 4)] as any,
      message: `System event ${i}: Operation completed successfully or failed.`,
      source: ['System', 'FRP', 'Network', 'Auth'][Math.floor(Math.random() * 4)],
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
    }));
  };

  private generateEmails = (count = 15): Email[] => {
    return Array.from({ length: count }).map((_, i) => ({
      id: `email-${i}`,
      from: `user${i}@example.com`,
      to: 'me@admin.com',
      subject: `Project Update ${i}`,
      body: `Hello, here is the update for project ${i}. Please review attached documents.`,
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      read: Math.random() > 0.3,
      folder: 'inbox',
    }));
  };

  private generateNasFiles = (parentId?: string): NasFile[] => {
    const count = 10;
    return Array.from({ length: count }).map((_, i) => ({
      id: `file-${parentId || 'root'}-${i}`,
      name: i % 3 === 0 ? `Folder ${i}` : `File ${i}.txt`,
      type: i % 3 === 0 ? 'folder' : 'file',
      size: Math.floor(Math.random() * 1000000),
      updatedAt: new Date().toISOString(),
      parentId,
    }));
  };

  public auth = {
    login: async (username: string): Promise<User> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return { id: '1', username, role: 'admin', avatar: 'https://github.com/shadcn.png' };
    },
    logout: async () => { },
  };

  public system = {
    getStats: async (): Promise<SystemStats> => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return this.generateSystemStats();
    },

    getDetailedStats: async (): Promise<DetailedSystemStats> => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return {
        ...this.generateSystemStats(),
        processes: Array.from({ length: 5 }).map((_, i) => ({
          pid: 1000 + i,
          name: ['nginx', 'python', 'postgres', 'redis', 'node'][i],
          cpu: Math.random() * 10,
          memory: Math.random() * 5,
        })),
        diskIO: { readBytes: 1024 * 1024, writeBytes: 512 * 1024 },
        networkConnections: 42,
      };
    },
  };

  public frp = {
    getStatus: async (): Promise<FrpStatus> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        running: true,
        uptime: 1300000,
        connections: 12,
        bytesIn: 1073741824,
        bytesOut: 536870912,
      };
    },
    getConfigs: async (): Promise<FrpConfig[]> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return this.generateFrpConfigs();
    },
    updateConfig: async (config: FrpConfig): Promise<FrpConfig> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return config;
    },

    startClient: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    },

    stopClient: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return;
    }
  };

  public ddns = {
    getStatus: async (): Promise<DdnsStatus> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        enabled: true,
        currentIp: '203.0.113.1',
        domain: 'ddns.0379.email',
        lastUpdate: new Date().toISOString(),
        status: 'success',
      };
    },
    updateConfig: async (config: DdnsConfig): Promise<DdnsConfig> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return config;
    },
    updateDDNS: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    getHistory: async (_limit?: number): Promise<DnsUpdateRecord[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return [
        {
          timestamp: new Date().toISOString(),
          previousIp: '203.0.113.2',
          newIp: '203.0.113.1',
          success: true
        }
      ];
    }
  };

  public nas = {
    getStatus: async (): Promise<NasStatus> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        running: true,
        uptime: 1298400,
        activeConnections: 8,
        totalStorage: 6 * 1024 ** 3,
        usedStorage: Math.floor(6 * 1024 ** 3 * 0.52)
      };
    },
    getVolumes: async (): Promise<NasVolume[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return [
        {
          id: 'vol-1',
          name: 'Data Volume 1',
          type: 'ext4',
          total: 2 * 1024 ** 3,
          used: Math.floor(2 * 1024 ** 3 * 0.4),
          available: Math.ceil(2 * 1024 ** 3 * 0.6),
          health: 'healthy',
          mountPoint: '/data/vol1'
        },
        {
          id: 'vol-2',
          name: 'Data Volume 2',
          type: 'ext4',
          total: 4 * 1024 ** 3,
          used: Math.floor(4 * 1024 ** 3 * 0.8),
          available: Math.ceil(4 * 1024 ** 3 * 0.2),
          health: 'healthy',
          mountPoint: '/data/vol2'
        }
      ];
    },
    getFiles: async (parentId?: string): Promise<NasFile[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return this.generateNasFiles(parentId);
    },
    getShares: async (): Promise<NasShare[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return [
        {
          id: 'share-1',
          name: 'Documents',
          path: '/data/documents',
          type: 'smb',
          enabled: true,
          permissions: 'read-write',
          users: ['admin', 'user1'],
          status: 'active'
        },
        {
          id: 'share-2',
          name: 'Media',
          path: '/data/media',
          type: 'smb',
          enabled: true,
          permissions: 'read-only',
          users: ['admin', 'user1', 'user2'],
          status: 'active'
        }
      ];
    },
    startService: async (): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    stopService: async (): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 500));
    },
    toggleShare: async (_shareId: string): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 300));
    },
  };

  public monitoring = {
    getStats: async (): Promise<SystemStats> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return this.generateSystemStats();
    },
    getProcesses: async (limit: number = 20, sortBy: string = 'cpu'): Promise<ProcessInfo[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      const processes: ProcessInfo[] = Array.from({ length: limit }).map((_, i) => ({
        pid: 1000 + i,
        name: ['nginx', 'python', 'postgres', 'redis', 'node'][i % 5],
        cpu: Math.random() * 10,
        memory: Math.random() * 5,
        user: 'root',
        status: 'running',
        uptime: 3600 * (i + 1)
      }));
      processes.sort((a, b) =>
        b[sortBy === 'cpu' ? 'cpu' : 'memory'] - a[sortBy === 'cpu' ? 'cpu' : 'memory']
      );
      return processes;
    }
  };

  public logs = {
    getLogs: async (): Promise<LogEntry[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return this.generateLogs();
    },
    clearLogs: async (): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  public mail = {
    getEmails: async (folder: string = 'inbox'): Promise<Email[]> => {
      await new Promise(resolve => setTimeout(resolve, 400));
      const emails = this.generateEmails();
      return emails.map(e => ({ ...e, folder: folder as any }));
    },
    sendEmail: async (to: string, subject: string, body: string, cc?: string[], bcc?: string[], attachments?: File[]): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 800));
      if (envConfig.isDebugEnabled()) {
        logger.debug(`[Mock] Sending email to ${to}`);
        logger.debug(`[Mock] Subject: ${subject}`);
        logger.debug(`[Mock] Body length: ${body.length} characters`);
        logger.debug(`[Mock] CC: ${cc?.join(', ') || 'none'}`);
        logger.debug(`[Mock] BCC: ${bcc?.join(', ') || 'none'}`);
        logger.debug(`[Mock] Attachments: ${attachments?.length || 0}`);
      }
    },
    replyEmail: async (originalEmailId: string, to: string, subject: string, body: string): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 800));
      if (envConfig.isDebugEnabled()) {
        logger.debug(`[Mock] Replying to email ${originalEmailId}`);
        logger.debug(`[Mock] To: ${to}`);
        logger.debug(`[Mock] Subject: ${subject}`);
        logger.debug(`[Mock] Body length: ${body.length} characters`);
      }
    },
    forwardEmail: async (originalEmailId: string, to: string, subject: string, body: string): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 800));
      if (envConfig.isDebugEnabled()) {
        logger.debug(`[Mock] Forwarding email ${originalEmailId}`);
        logger.debug(`[Mock] To: ${to}`);
        logger.debug(`[Mock] Subject: ${subject}`);
        logger.debug(`[Mock] Body length: ${body.length} characters`);
      }
    },
    markEmailRead: async (emailId: string): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 200));
      if (envConfig.isDebugEnabled()) {
        logger.debug(`[Mock] Marking email ${emailId} as read`);
      }
    },
    markEmailUnread: async (emailId: string): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 200));
      if (envConfig.isDebugEnabled()) {
        logger.debug(`[Mock] Marking email ${emailId} as unread`);
      }
    },
    deleteEmail: async (emailId: string): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      if (envConfig.isDebugEnabled()) {
        logger.debug(`[Mock] Deleting email ${emailId}`);
      }
    },
    saveDraft: async (draft: EmailDraft): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (envConfig.isDebugEnabled()) {
        logger.debug(`[Mock] Saving draft`);
        logger.debug(`[Mock] To: ${draft.to.join(', ')}`);
        logger.debug(`[Mock] Subject: ${draft.subject}`);
        logger.debug(`[Mock] Priority: ${draft.priority}`);
      }
    },
    scheduleEmail: async (email: ScheduledEmail): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      if (envConfig.isDebugEnabled()) {
        logger.debug(`[Mock] Scheduling email`);
        logger.debug(`[Mock] To: ${email.to.join(', ')}`);
        logger.debug(`[Mock] Subject: ${email.subject}`);
        logger.debug(`[Mock] Scheduled for: ${email.scheduledTime}`);
        logger.debug(`[Mock] Priority: ${email.priority}`);
      }
    },
    toggleStar: async (emailId: string): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 200));
      if (envConfig.isDebugEnabled()) {
        logger.debug(`[Mock] Toggling star for email ${emailId}`);
      }
    },
    archiveEmail: async (emailId: string): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      if (envConfig.isDebugEnabled()) {
        logger.debug(`[Mock] Archiving email ${emailId}`);
      }
    }
  };

  public llm = {
    sendMessage: async (message: string): Promise<LLMMessage> => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        id: Date.now().toString(),
        role: 'assistant',
        content: `I am the AI assistant. You said: "${message}". How can I help you manage your system today?`,
        timestamp: new Date().toISOString(),
      };
    },
    generate: async (prompt: string, model: string = 'qwen:7b', _stream: boolean = true): Promise<Response> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockResponse = {
        success: true,
        response: `This is a mock response for: "${prompt}". Using model: ${model}`
      };
      return new Response(JSON.stringify(mockResponse), {
        headers: { 'Content-Type': 'application/json' }
      });
    },
    getModels: async (): Promise<{ models: Array<{ name: string; size: string; modified_at: string }> }> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        models: [
          { name: 'qwen:7b', size: '4.7GB', modified_at: '2025-01-20T10:30:00Z' },
          { name: 'qwen:14b', size: '9.2GB', modified_at: '2025-01-20T10:30:00Z' },
          { name: 'llama3:8b', size: '4.9GB', modified_at: '2025-01-18T14:20:00Z' },
          { name: 'llama3:70b', size: '40.2GB', modified_at: '2025-01-18T14:20:00Z' }
        ]
      };
    },
    deleteModel: async (modelName: string): Promise<{ success: boolean; message: string }> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        success: true,
        message: `Model ${modelName} deleted successfully`
      };
    },
    pullModel: async (modelName: string): Promise<Response> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const mockResponse = {
        success: true,
        status: `Pulling model ${modelName}...`
      };
      return new Response(JSON.stringify(mockResponse), {
        headers: { 'Content-Type': 'application/json' }
      });
    },
    chat: async (messages: Array<{ role: string; content: string }>, model: string = 'qwen:7b', _stream: boolean = true): Promise<Response> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      const lastMessage = messages[messages.length - 1];
      const mockResponse = {
        success: true,
        content: `This is a mock chat response for: "${lastMessage.content}". Using model: ${model}`
      };
      return new Response(JSON.stringify(mockResponse), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
  };
}

class RealApiService {
  private client: ApiClient;
  private mock: MockDataService;

  constructor() {
    this.client = new ApiClient();
    this.mock = new MockDataService();
    // auth/mail/llm/logs 后端尚未提供端点（404），统一降级为模拟数据并明示告警
    this.auth = this.withFallback('auth', this.auth, this.mock.auth);
    this.mail = this.withFallback('mail', this.mail, this.mock.mail);
    this.llm = this.withFallback('llm', this.llm, this.mock.llm);
    this.logs = this.withFallback('logs', this.logs, this.mock.logs);
  }

  /**
   * 为领域服务包装 Mock 降级：真实请求失败时回退到 MockDataService 并输出告警
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private withFallback<D extends Record<string, any>>(domain: string, real: D, mock: D): D {
    const wrapped: Record<string, unknown> = {};
    for (const key of Object.keys(real) as Array<keyof D & string>) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      wrapped[key] = async (...args: any[]) => {
        try {
          return await real[key](...args);
        } catch (error) {
          logger.warn(`[API] ${domain}.${key} 后端不可用，已降级为模拟数据（mock fallback）`, error);
          return mock[key](...args);
        }
      };
    }
    return wrapped as D;
  }

  public auth = {
    login: async (username: string): Promise<User> => {
      return this.client.post<User>('/auth/login', { username });
    },
    logout: async () => {
      return this.client.post<void>('/auth/logout', {});
    },
  };

  public system = {
    getStats: async (): Promise<SystemStats> => {
      // 后端真实数据端点（原 /system/stats 不存在，曾致真实模式 404）
      return this.client.get<SystemStats>('/api/v2/monitoring/stats');
    },

    getDetailedStats: async (): Promise<DetailedSystemStats> => {
      return this.client.get<DetailedSystemStats>('/api/v2/monitoring/stats');
    },
  };

  public frp = {
    getStatus: async (): Promise<FrpStatus> => {
      return this.client.get<FrpStatus>('/api/v2/frp/status');
    },
    getConfigs: async (): Promise<FrpConfig[]> => {
      return this.client.get<FrpConfig[]>('/api/v2/frp/configs');
    },
    updateConfig: async (config: FrpConfig): Promise<FrpConfig> => {
      return this.client.put<FrpConfig>(`/api/v2/frp/configs/${config.id}`, config);
    },

    startClient: async () => {
      await this.client.post('/api/v2/frp/client/start', {});
    },

    stopClient: async () => {
      await this.client.post('/api/v2/frp/client/stop', {});
    }
  };

  public ddns = {
    getStatus: async (): Promise<DdnsStatus> => {
      return this.client.get<DdnsStatus>('/api/v2/ddns/status');
    },
    updateConfig: async (config: DdnsConfig): Promise<DdnsConfig> => {
      // 后端为 PUT /config（原 POST 不存在，曾致 405/404）
      return this.client.put<DdnsConfig>('/api/v2/ddns/config', config);
    },
    updateDDNS: async (): Promise<void> => {
      await this.client.post('/api/v2/ddns/update', {});
    },
    getHistory: async (limit?: number): Promise<DnsUpdateRecord[]> => {
      const params = limit ? `?limit=${limit}` : '';
      return this.client.get<DnsUpdateRecord[]>(`/api/v2/ddns/history${params}`);
    }
  };

  public nas = {
    getStatus: async (): Promise<NasStatus> => {
      return this.client.get<NasStatus>('/api/v2/nas/info');
    },
    getVolumes: async (): Promise<NasVolume[]> => {
      return this.client.get<NasVolume[]>('/api/v2/nas/volumes');
    },
    getFiles: async (parentId?: string): Promise<NasFile[]> => {
      const params = parentId ? `?parentId=${parentId}` : '';
      return this.client.get<NasFile[]>(`/api/v2/nas/files${params}`);
    },
    getShares: async (): Promise<any[]> => {
      return this.client.get('/api/v2/nas/shares');
    },
    startService: async (): Promise<void> => {
      // 后端路由为 /nas/start|stop（原 /nas/service/* 不存在）
      await this.client.post('/api/v2/nas/start', {});
    },
    stopService: async (): Promise<void> => {
      await this.client.post('/api/v2/nas/stop', {});
    },
    toggleShare: async (shareId: string): Promise<void> => {
      await this.client.post(`/api/v2/nas/shares/${shareId}/toggle`, {});
    },
  };

  public monitoring = {
    getStats: async (): Promise<SystemStats> => {
      return this.client.get<SystemStats>('/api/v2/monitoring/stats');
    },
    getProcesses: async (limit: number = 20, sortBy: string = 'cpu'): Promise<ProcessInfo[]> => {
      return this.client.get<ProcessInfo[]>(`/api/v2/monitoring/processes?limit=${limit}&sort_by=${sortBy}`);
    }
  };

  public logs = {
    getLogs: async (): Promise<LogEntry[]> => {
      return this.client.get<LogEntry[]>('/logs');
    },
    clearLogs: async (): Promise<void> => {
      await this.client.delete('/logs');
    },
  };

  public mail = {
    getEmails: async (folder: string = 'inbox'): Promise<Email[]> => {
      return this.client.get<Email[]>(`/mail/emails?folder=${folder}`);
    },
    sendEmail: async (to: string, subject: string, body: string, cc?: string[], bcc?: string[], attachments?: File[]): Promise<void> => {
      return this.client.post<void>('/mail/send', { to, subject, body, cc, bcc, attachments });
    },
    replyEmail: async (originalEmailId: string, to: string, subject: string, body: string): Promise<void> => {
      return this.client.post<void>('/mail/reply', { original_email_id: originalEmailId, to, subject, body });
    },
    forwardEmail: async (originalEmailId: string, to: string, subject: string, body: string): Promise<void> => {
      return this.client.post<void>('/mail/forward', { original_email_id: originalEmailId, to, subject, body });
    },
    markEmailRead: async (emailId: string): Promise<void> => {
      return this.client.put<void>(`/mail/emails/${emailId}/read`, {});
    },
    markEmailUnread: async (emailId: string): Promise<void> => {
      return this.client.put<void>(`/mail/emails/${emailId}/unread`, {});
    },
    deleteEmail: async (emailId: string): Promise<void> => {
      return this.client.delete<void>(`/mail/emails/${emailId}`);
    },
    saveDraft: async (draft: EmailDraft): Promise<void> => {
      return this.client.post<void>('/mail/drafts', draft);
    },
    scheduleEmail: async (email: ScheduledEmail): Promise<void> => {
      return this.client.post<void>('/mail/schedule', email);
    },
    archiveEmail: async (emailId: string): Promise<void> => {
      return this.client.put<void>(`/mail/emails/${emailId}/archive`, {});
    },
    toggleStar: async (emailId: string): Promise<void> => {
      return this.client.post<void>(`/mail/emails/${emailId}/star`, {});
    },
  };

  public llm = {
    sendMessage: async (message: string): Promise<LLMMessage> => {
      return this.client.post<LLMMessage>('/llm/chat', { message });
    },
    generate: async (prompt: string, model: string = 'qwen:7b', stream: boolean = true): Promise<Response> => {
      return this.client.post<Response>('/llm/generate', { prompt, model, stream });
    },
    getModels: async (): Promise<{ models: Array<{ name: string; size: string; modified_at: string }> }> => {
      return this.client.get('/llm/tags');
    },
    deleteModel: async (modelName: string): Promise<{ success: boolean; message: string }> => {
      return this.client.delete(`/llm/models/${modelName}`);
    },
    pullModel: async (modelName: string): Promise<Response> => {
      return this.client.post('/llm/pull', { name: modelName });
    },
    chat: async (messages: Array<{ role: string; content: string }>, model: string = 'qwen:7b', stream: boolean = true): Promise<Response> => {
      return this.client.post('/llm/chat', { messages, model, stream });
    }
  };
}

class ApiServiceFactory {
  private static instance: ApiService | null;
  private mockService: MockDataService;
  private realService: RealApiService;

  constructor() {
    this.mockService = new MockDataService();
    this.realService = new RealApiService();
  }

  private getService(): ApiService {
    const useMock = envConfig.shouldUseMockData();

    if (envConfig.isDebugEnabled()) {
      logger.debug(`[API Service] Using ${useMock ? 'MOCK' : 'REAL'} API service`);
      logger.debug(`[API Service] Environment: ${envConfig.getCurrentEnvironment().name}`);
      logger.debug(`[API Service] Base URL: ${envConfig.getCurrentEnvironment().apiBaseUrl}`);
    }

    return useMock ? this.mockService : this.realService;
  }

  public static getInstance(): ApiService {
    if (!ApiServiceFactory.instance) {
      const factory = new ApiServiceFactory();
      ApiServiceFactory.instance = factory.getService();
    }
    return ApiServiceFactory.instance;
  }

  public static resetInstance(): void {
    ApiServiceFactory.instance = null;
  }
}

export const api: ApiService = ApiServiceFactory.getInstance();

export { ApiClient, ApiServiceFactory, MockDataService, RealApiService };
