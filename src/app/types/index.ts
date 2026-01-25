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
  details?: string;
  stackTrace?: string;
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
  attachments?: File[];
  starred?: boolean;
  tags?: string[];
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

export interface NasVolume {
  id: string;
  name: string;
  type: string;
  total: number;
  used: number;
  available: number;
  health: string;
  mountPoint: string;
}

export interface NasShare {
  id: string;
  name: string;
  path: string;
  type: string;
  enabled: boolean;
  users: string[];
  permissions: string;
  status: string;
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
  getDetailedStats(): Promise<any>;
}

export interface FrpService {
  getConfigs(): Promise<FrpConfig[]>;
  updateConfig(config: FrpConfig): Promise<FrpConfig>;
  getStatus(): Promise<any>;
  startClient(): Promise<void>;
  stopClient(): Promise<void>;
}

export interface DdnsService {
  getStatus(): Promise<any>;
  updateConfig(config: any): Promise<any>;
  updateDDNS(): Promise<void>;
  getHistory(limit?: number): Promise<any[]>;
}

export interface MonitoringService {
  getStats(): Promise<any>;
  getProcesses(limit: number, sortBy: string): Promise<any>;
}

export interface LogsService {
  getLogs(): Promise<LogEntry[]>;
  clearLogs(): Promise<void>;
}

export interface MailService {
  getEmails(folder?: string, params?: any): Promise<Email[]>;
  sendEmail(to: string, subject: string, body: string): Promise<void>;
  saveDraft(draft: { to: string[]; cc: string[]; bcc: string[]; subject: string; body: string; attachments: File[]; priority: string }): Promise<void>;
  scheduleEmail(email: { to: string[]; cc: string[]; bcc: string[]; subject: string; body: string; attachments: File[]; priority: string; scheduledTime: string }): Promise<void>;
  replyEmail(originalEmailId: string, to: string, subject: string, body: string): Promise<void>;
  forwardEmail(originalEmailId: string, to: string, subject: string, body: string): Promise<void>;
  markEmailRead(emailId: string, read: boolean): Promise<void>;
  markEmailUnread(emailId: string): Promise<void>;
  deleteEmail(emailId: string): Promise<void>;
  toggleStar(emailId: string): Promise<void>;
  archiveEmail(emailId: string): Promise<void>;
}

export interface LLMService {
  sendMessage(message: string): Promise<LLMMessage>;
  generate(prompt: string, model?: string, stream?: boolean): Promise<Response>;
  getModels(): Promise<{ models: Array<{ name: string; size: string; modified_at: string }> }>;
  deleteModel(modelName: string): Promise<{ success: boolean; message: string }>;
  pullModel(modelName: string): Promise<Response>;
  chat(messages: Array<{ role: string; content: string }>, model?: string, stream?: boolean): Promise<Response>;
}

export interface NasService {
  getStatus(): Promise<any>;
  getVolumes(): Promise<any>;
  getFiles(parentId?: string): Promise<NasFile[]>;
  getShares(): Promise<any[]>;
  startService(): Promise<void>;
  stopService(): Promise<void>;
  toggleShare(shareId: string): Promise<void>;
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
