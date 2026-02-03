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

export interface DetailedSystemStats extends SystemStats {
  processes?: Array<{
    pid: number;
    name: string;
    cpu: number;
    memory: number;
  }>;
  diskIO?: {
    readBytes: number;
    writeBytes: number;
  };
  networkConnections?: number;
}

export interface SystemService {
  getStats(): Promise<SystemStats>;
  getDetailedStats(): Promise<DetailedSystemStats>;
}

export interface FrpStatus {
  running: boolean;
  uptime?: number;
  connections?: number;
  bytesIn?: number;
  bytesOut?: number;
  lastError?: string;
}

export interface FrpService {
  getConfigs(): Promise<FrpConfig[]>;
  updateConfig(config: FrpConfig): Promise<FrpConfig>;
  getStatus(): Promise<FrpStatus>;
  startClient(): Promise<void>;
  stopClient(): Promise<void>;
}

export interface DdnsStatus {
  enabled: boolean;
  currentIp: string;
  domain: string;
  lastUpdate: string;
  status: 'success' | 'error' | 'pending';
}

export interface DdnsConfig {
  provider: string;
  domain: string;
  username: string;
  password: string;
  updateInterval: number;
}

export interface DnsUpdateRecord {
  timestamp: string;
  previousIp: string;
  newIp: string;
  success: boolean;
  errorMessage?: string;
}

export interface DdnsService {
  getStatus(): Promise<DdnsStatus>;
  updateConfig(config: DdnsConfig): Promise<DdnsConfig>;
  updateDDNS(): Promise<void>;
  getHistory(limit?: number): Promise<DnsUpdateRecord[]>;
}

export interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;
  memory: number;
  user: string;
  status: string;
  uptime: number;
}

export interface MonitoringService {
  getStats(): Promise<SystemStats>;
  getProcesses(limit: number, sortBy: string): Promise<ProcessInfo[]>;
}

export interface LogsService {
  getLogs(): Promise<LogEntry[]>;
  clearLogs(): Promise<void>;
}

export interface EmailSearchParams {
  search?: string;
  startDate?: string;
  endDate?: string;
  unreadOnly?: boolean;
  starredOnly?: boolean;
  tags?: string[];
}

export interface EmailDraft {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  attachments?: File[];
  priority?: 'low' | 'normal' | 'high';
}

export interface ScheduledEmail extends EmailDraft {
  scheduledTime: string;
}

export interface MailService {
  getEmails(folder?: string, params?: EmailSearchParams): Promise<Email[]>;
  sendEmail(to: string, subject: string, body: string): Promise<void>;
  saveDraft(draft: EmailDraft): Promise<void>;
  scheduleEmail(email: ScheduledEmail): Promise<void>;
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

export interface NasStatus {
  running: boolean;
  uptime: number;
  activeConnections: number;
  totalStorage: number;
  usedStorage: number;
}

export type NasVolumeAlias = NasVolume;

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

export interface NasService {
  getStatus(): Promise<NasStatus>;
  getVolumes(): Promise<NasVolume[]>;
  getFiles(parentId?: string): Promise<NasFile[]>;
  getShares(): Promise<NasShare[]>;
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
