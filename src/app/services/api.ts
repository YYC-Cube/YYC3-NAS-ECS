/**
 * @file API服务模块
 * @description 提供API接口调用和数据处理功能
 * @module services/api
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-24
 */

import {
  User,
  SystemStats,
  FrpConfig,
  LogEntry,
  Email,
  LLMMessage,
  NasFile,
  NasVolume,
  NasShare,
  ApiService
} from '../types';
import { envConfig } from '../config/env';
import { logger } from '../utils/logger';

// API 基础 URL
const API_BASE_URL = envConfig.getCurrentEnvironment().apiBaseUrl;

// 统一的请求函数
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  // 如果使用真实API，添加认证
  if (!envConfig.shouldUseMockData()) {
    const token = localStorage.getItem('auth_token');
    if (token) {
      defaultOptions.headers = {
        ...defaultOptions.headers,
        'Authorization': `Bearer ${token}`,
      };
    }
  }

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '请求失败' }));
    throw new Error(error.message || '网络请求失败');
  }

  return response.json();
}

// --- API Service Object ---

export const apiV2: ApiService = {
  // ========== 认证接口 ==========
  auth: {
    login: async (username: string): Promise<User> => {
      if (envConfig.shouldUseMockData()) {
        // Mock数据
        await new Promise(resolve => setTimeout(resolve, 500));
        return { id: '1', username, role: 'admin', avatar: 'https://github.com/shadcn.png' };
      }

      // 真实API
      const response = await request<{ success: boolean; data: User }>('/api/v2/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username }),
      });
      return response.data;
    },

    logout: async () => {
      if (envConfig.shouldUseMockData()) {
        return;
      }

      // 真实API
      await request('/api/v2/auth/logout', { method: 'POST' });
      localStorage.removeItem('auth_token');
    },
  },

  // ========== 系统监控接口 ==========
  system: {
    getStats: async (): Promise<SystemStats> => {
      if (envConfig.shouldUseMockData()) {
        // Mock数据
        await new Promise(resolve => setTimeout(resolve, 200));
        return {
          cpuUsage: Math.random() * 100,
          memoryUsage: Math.random() * 100,
          diskUsage: 45 + Math.random() * 10,
          networkIn: Math.random() * 1000,
          networkOut: Math.random() * 500,
          uptime: Date.now() - 1000000,
          timestamp: new Date().toISOString(),
        };
      }

      // 真实API - 使用新接口
      const response = await request<SystemStats>('/api/v2/system/stats');
      return response;
    },

    getDetailedStats: async () => {
      if (envConfig.shouldUseMockData()) {
        return {
          cpu: { usage: 12.5, cores: 4 },
          memory: { usage: 45.3, total: 16, used: 7.25 },
          disk: { usage: 35.5, total: 1000, used: 355 },
          network: { in: 1024, out: 512 },
          system: { uptime: '15天 3小时 45分钟', hostname: 'nas-0379' }
        };
      }

      // 真实API - 获取详细统计
      const response = await request<any>('/api/v2/monitoring/stats');
      return response.data;
    },
  },

  // ========== FRP管理接口 ==========
  frp: {
    getConfigs: async (): Promise<FrpConfig[]> => {
      if (envConfig.shouldUseMockData()) {
        // Mock数据
        await new Promise(resolve => setTimeout(resolve, 500));
        return Array.from({ length: 7 }).map((_, i) => ({
          id: `frp-${i}`,
          name: `Service ${i + 1}`,
          type: ['tcp', 'udp', 'http', 'https'][Math.floor(Math.random() * 4)] as any,
          localIp: '127.0.0.1',
          localPort: 8000 + i,
          remotePort: 6000 + i,
          status: Math.random() > 0.2 ? 'running' : 'stopped',
        }));
      }

      // 真实API
      const response = await request<{ success: boolean; data: FrpConfig[] }>('/api/v2/frp/configs');
      return response.data;
    },

    getStatus: async () => {
      if (envConfig.shouldUseMockData()) {
        return {
          running: true,
          connected: true,
          proxyCount: 7,
          uptime: '15天 3小时 45分钟'
        };
      }

      // 真实API
      const response = await request<{ success: boolean; data: any }>('/api/v2/frp/status');
      return response.data;
    },

    updateConfig: async (config: FrpConfig): Promise<FrpConfig> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return config;
      }

      // 真实API
      const response = await request<{ success: boolean; data: FrpConfig }>(`/api/v2/frp/configs/${config.id}`, {
        method: 'PUT',
        body: JSON.stringify(config),
      });
      return response.data;
    },

    startClient: async () => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return;
      }

      // 真实API
      await request('/api/v2/frp/client/start', { method: 'POST' });
    },

    stopClient: async () => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return;
      }

      // 真实API
      await request('/api/v2/frp/client/stop', { method: 'POST' });
    },
  },

  // ========== 日志接口 ==========
  logs: {
    getLogs: async (params?: any): Promise<LogEntry[]> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return Array.from({ length: 20 }).map((_, i) => ({
          id: `log-${i}`,
          level: ['info', 'warn', 'error', 'debug'][Math.floor(Math.random() * 4)] as any,
          message: `System event ${i}: Operation completed successfully or failed.`,
          source: ['System', 'FRP', 'Network', 'Auth'][Math.floor(Math.random() * 4)],
          timestamp: new Date(Date.now() - i * 60000).toISOString(),
        }));
      }

      const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
      const response = await request<{ success: boolean; data: LogEntry[] }>(`/api/v2/logs${queryString}`);
      return response.data;
    },

    clearLogs: async (): Promise<void> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return;
      }

      await request('/api/v2/logs', { method: 'DELETE' });
    },
  },

  // ========== 监控接口 ==========
  monitoring: {
    getStats: async () => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return {
          cpu: { usage: 12.5, cores: 4 },
          memory: { usage: 45.3, total: 16, used: 7.25 },
          disk: { usage: 35.5, total: 1000, used: 355 },
          network: { in: 1024, out: 512 },
          system: { uptime: '15天 3小时 45分钟', hostname: 'nas-0379' }
        };
      }

      const response = await request<any>('/api/v2/monitoring/stats');
      return response.data;
    },

    getProcesses: async (limit: number = 20, sortBy: string = 'cpu') => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return Array.from({ length: limit }).map((_, i) => ({
          pid: 1000 + i,
          name: ['node', 'nginx', 'mysql', 'redis', 'postgres'][i % 5],
          cpu: Math.random() * 10,
          memory: Math.random() * 100,
          user: 'root',
        }));
      }

      const response = await request<any>(`/api/v2/monitoring/processes?limit=${limit}&sort_by=${sortBy}`);
      return response.data;
    },
  },

  // ========== 邮件接口 ==========
  mail: {
    getEmails: async (folder: string = 'inbox', _params?: any): Promise<Email[]> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 400));
        return Array.from({ length: 15 }).map((_, i) => ({
          id: `email-${i}`,
          from: `user${i}@example.com`,
          to: 'me@admin.com',
          subject: `Project Update ${i}`,
          body: `Hello, here is update for project ${i}. Please review attached documents.`,
          timestamp: new Date(Date.now() - i * 3600000).toISOString(),
          read: Math.random() > 0.3,
          folder: folder as any,
        }));
      }

      const response = await request<{ success: boolean; data: Email[] }>(`/api/v2/mail/${folder}`);
      return response.data;
    },

    sendEmail: async (to: string, subject: string, body: string): Promise<void> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 800));
        logger.debug(`[Mock] Sending email to ${to}: ${subject}`);
        return;
      }

      await request('/api/v2/mail/send', {
        method: 'POST',
        body: JSON.stringify({ to, subject, body }),
      });
    },

    saveDraft: async (draft: { to: string[]; cc: string[]; bcc: string[]; subject: string; body: string; attachments: File[]; priority: string }): Promise<void> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return;
      }
      await request('/api/v2/mail/drafts', {
        method: 'POST',
        body: JSON.stringify(draft),
      });
    },

    scheduleEmail: async (email: { to: string[]; cc: string[]; bcc: string[]; subject: string; body: string; attachments: File[]; priority: string; scheduledTime: string }): Promise<void> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return;
      }
      await request('/api/v2/mail/schedule', {
        method: 'POST',
        body: JSON.stringify(email),
      });
    },

    replyEmail: async (originalEmailId: string, to: string, subject: string, body: string): Promise<void> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return;
      }
      await request('/api/v2/mail/reply', {
        method: 'POST',
        body: JSON.stringify({ original_email_id: originalEmailId, to, subject, body }),
      });
    },

    forwardEmail: async (originalEmailId: string, to: string, subject: string, body: string): Promise<void> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return;
      }
      await request('/api/v2/mail/forward', {
        method: 'POST',
        body: JSON.stringify({ original_email_id: originalEmailId, to, subject, body }),
      });
    },

    markEmailRead: async (emailId: string, _read: boolean): Promise<void> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 200));
        return;
      }
      await request(`/api/v2/mail/emails/${emailId}/read`, { method: 'PUT' });
    },

    markEmailUnread: async (emailId: string): Promise<void> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 200));
        return;
      }
      await request(`/api/v2/mail/emails/${emailId}/unread`, { method: 'PUT' });
    },

    deleteEmail: async (emailId: string): Promise<void> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return;
      }
      await request(`/api/v2/mail/emails/${emailId}`, { method: 'DELETE' });
    },

    toggleStar: async (emailId: string): Promise<void> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 200));
        return;
      }
      await request(`/api/v2/mail/emails/${emailId}/star`, { method: 'PUT' });
    },

    archiveEmail: async (emailId: string): Promise<void> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return;
      }
      await request(`/api/v2/mail/emails/${emailId}/archive`, { method: 'PUT' });
    },
  },

  // ========== LLM接口 ==========
  llm: {
    sendMessage: async (message: string): Promise<LLMMessage> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
          id: Date.now().toString(),
          role: 'assistant',
          content: `我是AI助手。您说："${message}"。今天有什么可以帮助您的吗？`,
          timestamp: new Date().toISOString(),
        };
      }

      const response = await request<{ success: boolean; data: LLMMessage }>('/api/v2/llm/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      return response.data;
    },

    generate: async (prompt: string, model: string = 'qwen:7b', _stream: boolean = true): Promise<Response> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockResponse = {
          success: true,
          response: `This is a mock response for: "${prompt}". Using model: ${model}`
        };
        return new Response(JSON.stringify(mockResponse), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return await request('/api/v2/llm/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt, model, stream: _stream }),
      });
    },

    getModels: async (): Promise<{ models: Array<{ name: string; size: string; modified_at: string }> }> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return {
          models: [
            { name: 'qwen:7b', size: '4.7GB', modified_at: '2025-01-20T10:30:00Z' },
            { name: 'qwen:14b', size: '9.2GB', modified_at: '2025-01-20T10:30:00Z' },
            { name: 'llama3:8b', size: '4.9GB', modified_at: '2025-01-18T14:20:00Z' },
            { name: 'llama3:70b', size: '40.2GB', modified_at: '2025-01-18T14:20:00Z' }
          ]
        };
      }
      return await request('/api/v2/llm/tags');
    },

    deleteModel: async (modelName: string): Promise<{ success: boolean; message: string }> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return {
          success: true,
          message: `Model ${modelName} deleted successfully`
        };
      }
      return await request(`/llm/models/${modelName}`, { method: 'DELETE' });
    },

    pullModel: async (modelName: string): Promise<Response> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockResponse = {
          success: true,
          status: `Pulling model ${modelName}...`
        };
        return new Response(JSON.stringify(mockResponse), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      return await request('/llm/pull', {
        method: 'POST',
        body: JSON.stringify({ name: modelName }),
      });
    },

    chat: async (messages: Array<{ role: string; content: string }>, model: string = 'qwen:7b', _stream: boolean = true): Promise<Response> => {
      if (envConfig.shouldUseMockData()) {
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
      return await request('/llm/chat', {
        method: 'POST',
        body: JSON.stringify({ messages, model, stream: _stream }),
      });
    },
  },

  // ========== NAS接口 ==========
  nas: {
    getFiles: async (parentId?: string): Promise<NasFile[]> => {
      if (envConfig.shouldUseMockData()) {
        // Mock数据
        await new Promise(resolve => setTimeout(resolve, 300));
        const count = 10;
        return Array.from({ length: count }).map((_, i) => ({
          id: `file-${parentId || 'root'}-${i}`,
          name: i % 3 === 0 ? `Folder ${i}` : `File ${i}.txt`,
          type: i % 3 === 0 ? 'folder' : 'file',
          size: Math.floor(Math.random() * 1000000),
          updatedAt: new Date().toISOString(),
          parentId,
        }));
      }

      // 真实API
      const queryString = parentId ? `?parent_id=${parentId}` : '';
      const response = await request<{ success: boolean; data: NasFile[] }>(`/api/v2/nas/files${queryString}`);
      return response.data;
    },

    getStatus: async () => {
      if (envConfig.shouldUseMockData()) {
        return {
          running: true,
          status: 'online',
          uptime: '15天 3小时 45分钟',
          version: 'DSM 7.2.1-69057 Update 3',
          cpuUsage: 12.5,
          memoryUsage: 45.3,
          temperature: 42,
        };
      }

      // 真实API
      const response = await request<{ success: boolean; data: any }>('/api/v2/nas/status');
      return response.data;
    },

    getVolumes: async (): Promise<NasVolume[]> => {
      if (envConfig.shouldUseMockData()) {
        return [
          {
            id: 'vol1',
            name: 'Volume 1',
            type: 'Btrfs',
            total: 16000,
            used: 8750,
            available: 7250,
            health: 'healthy',
            mountPoint: '/volume1',
          },
          {
            id: 'vol2',
            name: 'Volume 2',
            type: 'EXT4',
            total: 8000,
            used: 3200,
            available: 4800,
            health: 'healthy',
            mountPoint: '/volume2',
          },
        ];
      }

      // 真实API
      const response = await request<{ success: boolean; data: NasVolume[] }>('/api/v2/nas/volumes');
      return response.data;
    },

    getShares: async (): Promise<NasShare[]> => {
      if (envConfig.shouldUseMockData()) {
        return [
          {
            id: 'share1',
            name: 'Documents',
            path: '/volume1/documents',
            type: 'smb',
            enabled: true,
            users: ['admin', 'user1', 'user2'],
            permissions: 'full',
            status: 'active',
          },
          {
            id: 'share2',
            name: 'Media',
            path: '/volume1/media',
            type: 'webdav',
            enabled: true,
            users: ['admin', 'media_user'],
            permissions: 'read',
            status: 'active',
          },
        ];
      }

      // 真实API
      const response = await request<{ success: boolean; data: NasShare[] }>('/api/v2/nas/shares');
      return response.data;
    },

    startService: async () => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return;
      }

      // 真实API
      await request('/api/v2/nas/start', { method: 'POST' });
    },

    stopService: async () => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return;
      }

      // 真实API
      await request('/api/v2/nas/stop', { method: 'POST' });
    },

    toggleShare: async (shareId: string) => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return;
      }

      // 真实API
      await request(`/api/v2/nas/shares/${shareId}/toggle`, { method: 'POST' });
    },
  },

  // ========== DDNS接口 ==========
  ddns: {
    getStatus: async () => {
      if (envConfig.shouldUseMockData()) {
        return {
          running: true,
          enabled: true,
          provider: 'aliyun',
          domain: 'ddns.0379.email',
          currentIP: '8.152.195.33',
          lastUpdate: new Date().toISOString(),
          status: 'success',
        };
      }

      const response = await request<{ success: boolean; data: any }>('/api/v2/ddns/status');
      return response.data;
    },

    updateConfig: async (config: any): Promise<any> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return { success: true };
      }

      return await request('/api/v2/ddns/config', {
        method: 'POST',
        body: JSON.stringify(config),
      });
    },

    updateDDNS: async () => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return;
      }

      await request('/api/v2/ddns/update', { method: 'POST' });
    },

    getHistory: async (limit: number = 20) => {
      if (envConfig.shouldUseMockData()) {
        return Array.from({ length: limit }).map((_, i) => ({
          id: String(i),
          timestamp: new Date(Date.now() - i * 300000).toISOString(),
          oldIP: '8.152.195.33',
          newIP: '8.152.195.33',
          status: 'success',
          message: 'IP未变化，无需更新',
        }));
      }

      // 真实API
      const response = await request<{ success: boolean; data: any[] }>(`/api/v2/ddns/history?limit=${limit}`);
      return response.data;
    },
  },
};

// 导出兼容旧版本的api
export { apiV2 as api };
