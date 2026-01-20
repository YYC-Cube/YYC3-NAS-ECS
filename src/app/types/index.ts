export interface User {
  id: string;
  username: string;
  role: 'admin' | 'user' | 'guest';
  avatar?: string;
}

export interface SystemStats {
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
  networkIn: number;
  networkOut: number;
  uptime: number;
  timestamp: string;
}

export interface FrpConfig {
  id: string;
  name: string;
  type: 'tcp' | 'udp' | 'http' | 'https';
  localIp: string;
  localPort: number;
  remotePort: number;
  status: 'running' | 'stopped' | 'error';
}

export interface LogEntry {
  id: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  source: string;
  timestamp: string;
}

export interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
  folder: 'inbox' | 'sent' | 'trash' | 'drafts';
}

export interface LLMMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface NasFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size: number;
  updatedAt: string;
  parentId?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export interface AuthService {
  login(username: string): Promise<User>;
  logout(): Promise<void>;
}

export interface SystemService {
  getStats(): Promise<SystemStats>;
}

export interface FrpService {
  getConfigs(): Promise<FrpConfig[]>;
  updateConfig(config: FrpConfig): Promise<FrpConfig>;
  getStatus(): Promise<any>;
}

export interface DdnsService {
  getStatus(): Promise<any>;
  updateConfig(config: any): Promise<any>;
}

export interface MonitoringService {
  getStats(): Promise<any>;
  getProcesses(limit: number, sortBy: string): Promise<any>;
}

export interface LogsService {
  getLogs(): Promise<LogEntry[]>;
}

export interface MailService {
  getEmails(folder?: string): Promise<Email[]>;
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

export interface LLMService {
  sendMessage(message: string): Promise<LLMMessage>;
}

export interface NasService {
  getStatus(): Promise<any>;
  getVolumes(): Promise<any>;
  getFiles(parentId?: string): Promise<NasFile[]>;
}

export interface ApiService {
  auth: AuthService;
  system: SystemService;
  frp: FrpService;
  ddns: DdnsService;
  monitoring: MonitoringService;
  logs: LogsService;
  mail: MailService;
  llm: LLMService;
  nas: NasService;
}
