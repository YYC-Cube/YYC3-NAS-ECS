/**
 * @file API服务模块 - 支持多环境配置
 * @description 根据环境配置动态选择真实API或模拟数据
 * @module services/api
 * @author YYC³
 * @version 2.0.0
 * @created 2026-01-03
 */

import {
  User,
  SystemStats,
  FrpConfig,
  LogEntry,
  Email,
  LLMMessage,
  NasFile,
  ApiService
} from '../types';
import { envConfig } from '../config/env';

class ApiClient {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = envConfig.getCurrentEnvironment().apiBaseUrl;
    this.timeout = parseInt((import.meta as any).env.VITE_API_TIMEOUT || '30000');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (envConfig.isDebugEnabled()) {
        console.error('API request error:', error);
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
    logout: async () => {},
  };

  public system = {
    getStats: async (): Promise<SystemStats> => {
      await new Promise(resolve => setTimeout(resolve, 200));
      return this.generateSystemStats();
    },
  };

  public frp = {
    getStatus: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        data: {
          client: {
            running: true,
            connected: true,
            serverAddr: '8.152.195.33',
            serverPort: 7001,
            proxyCount: 5,
            uptime: '15天 3小时 45分钟'
          },
          proxies: this.generateFrpConfigs(),
          timestamp: new Date().toISOString()
        }
      };
    },
    getConfigs: async (): Promise<FrpConfig[]> => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return this.generateFrpConfigs();
    },
    updateConfig: async (config: FrpConfig): Promise<FrpConfig> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return config;
    }
  };

  public ddns = {
    getStatus: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        data: {
          running: true,
          enabled: true,
          provider: 'aliyun',
          domain: 'ddns.0379.email',
          currentIP: '8.152.195.33',
          expectedIP: '8.152.195.33',
          lastUpdate: new Date().toISOString(),
          nextUpdate: Date.now() + 300,
          updateInterval: 300,
          status: 'success',
          message: 'DDNS运行正常'
        }
      };
    },
    updateConfig: async (config: any) => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { success: true, data: config };
    }
  };

  public nas = {
    getStatus: async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        success: true,
        data: {
          system: {
            uptime: '15天 3小时 45分钟',
            cpuUsage: 25.5,
            memoryUsage: 45.2,
            temperature: '45°C'
          },
          volumes: [
            {
              id: 'vol-1',
              name: 'Data Volume 1',
              type: 'ext4',
              capacity: '2 TB',
              used: '800 GB',
              available: '1.2 TB',
              usagePercent: 40,
              status: 'healthy'
            },
            {
              id: 'vol-2',
              name: 'Data Volume 2',
              type: 'ext4',
              capacity: '4 TB',
              used: '3.2 TB',
              available: '800 GB',
              usagePercent: 80,
              status: 'healthy'
            }
          ],
          services: [
            { name: 'SMB Service', status: 'running', uptime: '15天 3小时 45分钟' },
            { name: 'FTP Service', status: 'running', uptime: '15天 3小时 45分钟' },
            { name: 'NFS Service', status: 'running', uptime: '15天 3小时 45分钟' },
            { name: 'WebDAV Service', status: 'stopped', uptime: '0天 0小时 0分钟' }
          ]
        }
      };
    },
    getVolumes: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        success: true,
        data: [
          {
            id: 'vol-1',
            name: 'Data Volume 1',
            type: 'ext4',
            capacity: '2 TB',
            used: '800 GB',
            available: '1.2 TB',
            usagePercent: 40,
            status: 'healthy'
          },
          {
            id: 'vol-2',
            name: 'Data Volume 2',
            type: 'ext4',
            capacity: '4 TB',
            used: '3.2 TB',
            available: '800 GB',
            usagePercent: 80,
            status: 'healthy'
          }
        ]
      };
    },
    getFiles: async (parentId?: string): Promise<NasFile[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return this.generateNasFiles(parentId);
    },
  };

  public monitoring = {
    getStats: async () => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return {
        success: true,
        data: {
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
        }
      };
    },
    getProcesses: async (limit: number = 20, sortBy: string = 'cpu') => {
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
        success: true,
        data: {
          processes: processes,
          total: limit
        }
      };
    }
  };

  public logs = {
    getLogs: async (): Promise<LogEntry[]> => {
      await new Promise(resolve => setTimeout(resolve, 300));
      return this.generateLogs();
    },
  };

  public mail = {
    getEmails: async (folder: string = 'inbox'): Promise<Email[]> => {
      await new Promise(resolve => setTimeout(resolve, 400));
      const emails = this.generateEmails();
      return emails.map(e => ({...e, folder: folder as any}));
    },
    sendEmail: async (to: string, subject: string, body: string): Promise<void> => {
      await new Promise(resolve => setTimeout(resolve, 800));
      if (envConfig.isDebugEnabled()) {
        console.log(`[Mock] Sending email to ${to}`);
        console.log(`[Mock] Subject: ${subject}`);
        console.log(`[Mock] Body length: ${body.length} characters`);
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
  };
}

class RealApiService {
  private client: ApiClient;

  constructor() {
    this.client = new ApiClient();
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
      return this.client.get<SystemStats>('/system/stats');
    },
  };

  public frp = {
    getStatus: async () => {
      return this.client.get('/api/v2/frp/status');
    },
    getConfigs: async (): Promise<FrpConfig[]> => {
      return this.client.get<FrpConfig[]>('/api/v2/frp/configs');
    },
    updateConfig: async (config: FrpConfig): Promise<FrpConfig> => {
      return this.client.put<FrpConfig>(`/api/v2/frp/configs/${config.id}`, config);
    }
  };

  public ddns = {
    getStatus: async () => {
      return this.client.get('/api/v2/ddns/status');
    },
    updateConfig: async (config: any) => {
      return this.client.post('/api/v2/ddns/config', config);
    }
  };

  public nas = {
    getStatus: async () => {
      return this.client.get('/api/v2/nas/info');
    },
    getVolumes: async () => {
      return this.client.get('/api/v2/nas/volumes');
    },
    getFiles: async (parentId?: string): Promise<NasFile[]> => {
      const params = parentId ? `?parentId=${parentId}` : '';
      return this.client.get<NasFile[]>(`/nas/files${params}`);
    },
  };

  public monitoring = {
    getStats: async () => {
      return this.client.get('/api/v2/monitoring/stats');
    },
    getProcesses: async (limit: number = 20, sortBy: string = 'cpu') => {
      return this.client.get(`/api/v2/monitoring/processes?limit=${limit}&sort_by=${sortBy}`);
    }
  };

  public logs = {
    getLogs: async (): Promise<LogEntry[]> => {
      return this.client.get<LogEntry[]>('/logs');
    },
  };

  public mail = {
    getEmails: async (folder: string = 'inbox'): Promise<Email[]> => {
      return this.client.get<Email[]>(`/mail/emails?folder=${folder}`);
    },
    sendEmail: async (to: string, subject: string, body: string): Promise<void> => {
      return this.client.post<void>('/mail/send', { to, subject, body });
    }
  };

  public llm = {
    sendMessage: async (message: string): Promise<LLMMessage> => {
      return this.client.post<LLMMessage>('/llm/chat', { message });
    },
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
      console.log(`[API Service] Using ${useMock ? 'MOCK' : 'REAL'} API service`);
      console.log(`[API Service] Environment: ${envConfig.getCurrentEnvironment().name}`);
      console.log(`[API Service] Base URL: ${envConfig.getCurrentEnvironment().apiBaseUrl}`);
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

export { ApiClient, MockDataService, RealApiService, ApiServiceFactory };
