/**
 * @file API服务模块 (新版)
 * @description 提供API接口调用和数据处理功能
 * @module services/api-new
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
        // Mock数据
        await new Promise(resolve => setTimeout(resolve, 300));
        return Array.from({ length: 20 }).map((_, i) => ({
          id: `log-${i}`,
          level: ['info', 'warn', 'error', 'debug'][Math.floor(Math.random() * 4)] as any,
          message: `System event ${i}: Operation completed successfully or failed.`,
          source: ['System', 'FRP', 'Network', 'Auth'][Math.floor(Math.random() * 4)],
          timestamp: new Date(Date.now() - i * 60000).toISOString(),
        }));
      }
      
      // 真实API
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

  // ========== 邮件接口 ==========
  mail: {
    getEmails: async (folder: string = 'inbox'): Promise<Email[]> => {
      if (envConfig.shouldUseMockData()) {
        // Mock数据
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
      
      // 真实API
      const response = await request<{ success: boolean; data: Email[] }>(`/api/v2/mail/${folder}`);
      return response.data;
    },
    
    sendEmail: async (to: string, subject: string, body: string): Promise<void> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 800));
        logger.debug(`[Mock] Sending email to ${to}: ${subject}`);
        return;
      }
      
      // 真实API
      await request('/api/v2/mail/send', {
        method: 'POST',
        body: JSON.stringify({ to, subject, body }),
      });
    },
    
    saveDraft: async (draft: { to: string[]; cc: string[]; bcc: string[]; subject: string; body: string; attachments: File[]; priority: string }): Promise<void> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        logger.debug(`[Mock] Saving draft: ${draft.subject}`);
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
        logger.debug(`[Mock] Scheduling email: ${email.subject} at ${email.scheduledTime}`);
        return;
      }
      
      await request('/api/v2/mail/schedule', {
        method: 'POST',
        body: JSON.stringify(email),
      });
    },
    
    replyEmail: async (originalEmailId: string, to: string, subject: string, body: string): Promise<void> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 800));
        logger.debug(`[Mock] Replying to email ${originalEmailId}`);
        return;
      }
      
      await request(`/api/v2/mail/${originalEmailId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ to, subject, body }),
      });
    },
    
    forwardEmail: async (originalEmailId: string, to: string, subject: string, body: string): Promise<void> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 800));
        logger.debug(`[Mock] Forwarding email ${originalEmailId}`);
        return;
      }
      
      await request(`/api/v2/mail/${originalEmailId}/forward`, {
        method: 'POST',
        body: JSON.stringify({ to, subject, body }),
      });
    },
    
    markEmailRead: async (emailId: string, read: boolean): Promise<void> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 200));
        logger.debug(`[Mock] Marking email ${emailId} as ${read ? 'read' : 'unread'}`);
        return;
      }
      
      await request(`/api/v2/mail/${emailId}/read`, {
        method: 'PUT',
        body: JSON.stringify({ read }),
      });
    },
    
    markEmailUnread: async (emailId: string): Promise<void> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 200));
        logger.debug(`[Mock] Marking email ${emailId} as unread`);
        return;
      }
      
      await request(`/api/v2/mail/${emailId}/unread`, {
        method: 'PUT',
      });
    },
    
    deleteEmail: async (emailId: string): Promise<void> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 300));
        logger.debug(`[Mock] Deleting email ${emailId}`);
        return;
      }
      
      await request(`/api/v2/mail/${emailId}`, {
        method: 'DELETE',
      });
    },
    
    toggleStar: async (emailId: string): Promise<void> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 200));
        logger.debug(`[Mock] Toggling star for email ${emailId}`);
        return;
      }
      
      await request(`/api/v2/mail/${emailId}/star`, {
        method: 'POST',
      });
    },
    
    archiveEmail: async (emailId: string): Promise<void> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 200));
        logger.debug(`[Mock] Archiving email ${emailId}`);
        return;
      }
      
      await request(`/api/v2/mail/${emailId}/archive`, {
        method: 'POST',
      });
    },
  },

  // ========== LLM接口 ==========
  llm: {
    sendMessage: async (message: string): Promise<LLMMessage> => {
      if (envConfig.shouldUseMockData()) {
        // Mock数据
        await new Promise(resolve => setTimeout(resolve, 1000));
        return {
          id: Date.now().toString(),
          role: 'assistant',
          content: `我是AI助手。您说："${message}"。今天有什么可以帮助您的吗？`,
          timestamp: new Date().toISOString(),
        };
      }
      
      // 真实API
      const response = await request<{ success: boolean; data: LLMMessage }>('/api/v2/llm/chat', {
        method: 'POST',
        body: JSON.stringify({ message }),
      });
      return response.data;
    },
    
    generate: async (prompt: string, model: string = 'qwen:7b', stream: boolean = true): Promise<Response> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return new Response(JSON.stringify({
          success: true,
          data: {
            response: `Generated response for: ${prompt}`,
            model: model,
            stream: stream
          }
        }));
      }
      
      return request('/api/v2/llm/generate', {
        method: 'POST',
        body: JSON.stringify({ prompt, model, stream }),
      });
    },
    
    getModels: async (): Promise<{ models: Array<{ name: string; size: string; modified_at: string }> }> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
          models: [
            { name: 'qwen:7b', size: '4.2GB', modified_at: '2024-01-15' },
            { name: 'qwen:14b', size: '8.5GB', modified_at: '2024-01-10' },
            { name: 'llama2:7b', size: '3.8GB', modified_at: '2024-01-08' },
          ]
        };
      }
      
      return request<{ success: boolean; data: { models: Array<{ name: string; size: string; modified_at: string }> } }>('/api/v2/llm/models').then(r => r.data);
    },
    
    deleteModel: async (modelName: string): Promise<{ success: boolean; message: string }> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 800));
        logger.debug(`[Mock] Deleting model: ${modelName}`);
        return { success: true, message: `Model ${modelName} deleted successfully` };
      }
      
      return request<{ success: boolean; message: string }>(`/api/v2/llm/models/${modelName}`, {
        method: 'DELETE',
      });
    },
    
    pullModel: async (modelName: string): Promise<Response> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        logger.debug(`[Mock] Pulling model: ${modelName}`);
        return new Response(JSON.stringify({
          success: true,
          message: `Model ${modelName} pulled successfully`
        }));
      }
      
      return request(`/api/v2/llm/models/pull`, {
        method: 'POST',
        body: JSON.stringify({ model: modelName }),
      });
    },
    
    chat: async (messages: Array<{ role: string; content: string }>, model: string = 'qwen:7b', stream: boolean = true): Promise<Response> => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 1200));
        return new Response(JSON.stringify({
          success: true,
          data: {
            response: `Chat response for ${messages.length} messages`,
            model: model,
            stream: stream
          }
        }));
      }
      
      return request('/api/v2/llm/chat', {
        method: 'POST',
        body: JSON.stringify({ messages, model, stream }),
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

  // ========== 监控接口 ==========
  monitoring: {
    getStats: async () => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 300));
        return {
          cpu: {
            usage: 25.5,
            cores: 8,
            model: 'Intel(R) Xeon(R) CPU E5-2680 v4'
          },
          memory: {
            total: 32768,
            used: 14800,
            available: 17968,
            percent: 45.2
          },
          disk: {
            total: 6291456,
            used: 3276800,
            available: 3014656,
            percent: 52.1
          },
          network: {
            bytesSent: 1073741824,
            bytesRecv: 2147483648,
            packetsSent: 1000000,
            packetsRecv: 2000000
          },
          loadAverage: [0.5, 0.8, 1.2],
          uptime: 1298400
        };
      }
      
      const response = await request<{ success: boolean; data: any }>('/api/v2/monitoring/stats');
      return response.data;
    },
    
    getProcesses: async (limit: number = 20, sortBy: string = 'cpu') => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 300));
        const processes = Array.from({ length: limit }).map((_, i) => ({
          pid: 1000 + i,
          name: ['nginx', 'python', 'postgres', 'redis', 'node'][i % 5],
          username: 'root',
          cpu_percent: Math.random() * 10,
          memory_percent: Math.random() * 5
        }));
        processes.sort((a, b) => b[sortBy === 'cpu' ? 'cpu_percent' : 'memory_percent'] - a[sortBy === 'cpu' ? 'cpu_percent' : 'memory_percent']);
        return {
          processes,
          total: processes.length
        };
      }
      
      const response = await request<{ success: boolean; data: any }>(`/api/v2/monitoring/processes?limit=${limit}&sort_by=${sortBy}`);
      return response.data;
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
      
      // 真实API
      const response = await request<{ success: boolean; data: any }>('/api/v2/ddns/status');
      return response.data;
    },
    
    updateConfig: async (config: any) => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 300));
        logger.debug(`[Mock] Updating DDNS config`);
        return config;
      }
      
      // 真实API
      const response = await request<{ success: boolean; data: any }>('/api/v2/ddns/config', {
        method: 'POST',
        body: JSON.stringify(config),
      });
      return response.data;
    },
    
    updateDDNS: async () => {
      if (envConfig.shouldUseMockData()) {
        await new Promise(resolve => setTimeout(resolve, 500));
        return;
      }
      
      // 真实API
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
