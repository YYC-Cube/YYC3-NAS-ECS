/**
 * @file UI组件类型定义
 * @description 定义YYC³ AI系统所有UI组件的接口和类型
 * @module ui/types
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
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
  format: ExportFormat;
  content: string;
  metadata: {
    exportedAt: number;
    messageCount: number;
    sessionName: string;
  };
}

export type ExportFormat = 'json' | 'markdown' | 'html' | 'pdf' | 'txt';

export type AudioBlob = Blob & { type: 'audio/webm' | 'audio/mp3' };
export type ImageBlob = Blob & { type: 'image/jpeg' | 'image/png' | 'image/webp' };
export type ScreenShareStream = MediaStream;

export type ChatTheme = 'light' | 'dark' | 'auto' | 'custom';
export type ChatLayout = 'default' | 'compact' | 'expanded' | 'sidebar';

export interface ChatThemeConfig {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  messageBackgroundColor: string;
  accentColor: string;
}

export interface IChatInterface {
  sendMessage(message: ChatMessage): Promise<string>;
  editMessage(messageId: string, newContent: string): Promise<void>;
  deleteMessage(messageId: string): Promise<void>;
  getMessageHistory(options?: HistoryOptions): ChatMessage[];
  clearHistory(): Promise<void>;
  createNewSession(template?: SessionTemplate): string;
  switchSession(sessionId: string): Promise<void>;
  getCurrentSession(): ChatSession;
  listSessions(): ChatSession[];
  renameSession(sessionId: string, newName: string): void;
  suggestReplies(context: ReplyContext): Promise<SuggestedReply[]>;
  translateMessage(messageId: string, targetLanguage: string): Promise<string>;
  summarizeConversation(): Promise<string>;
  exportConversation(format: ExportFormat): Promise<ExportedConversation>;
  uploadAttachment(file: File): Promise<Attachment>;
  recordVoice(): Promise<AudioBlob>;
  takePicture(): Promise<ImageBlob>;
  shareScreen(): Promise<ScreenShareStream>;
  startTypingIndicator(): void;
  stopTypingIndicator(): void;
  markMessageAsRead(messageId: string): void;
  getUnreadCount(): number;
  show(): void;
  hide(): void;
  minimize(): void;
  maximize(): void;
  setTheme(theme: ChatTheme): void;
  setLayout(layout: ChatLayout): void;
}

export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  enabled: boolean;
  status?: 'enabled' | 'disabled' | 'error';
  config?: Record<string, any>;
  parameters?: {
    type: 'object';
    properties: Record<string, any>;
    required: string[];
  };
  usageCount?: number;
  execute: (params: any) => Promise<any>;
}

export interface ToolCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  tools: Tool[];
}

export interface IToolboxPanel {
  registerTool(tool: Tool): void;
  unregisterTool(toolId: string): void;
  getTool(toolId: string): Tool | undefined;
  listTools(category?: string): Tool[];
  listCategories(): ToolCategory[];
  executeTool(toolId: string, params: any): Promise<any>;
  toggleTool(toolId: string): void;
  searchTools(query: string): Tool[];
  show(): void;
  hide(): void;
  toggle(): void;
}

export interface MetricData {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
  timestamp: number;
}

export interface ChartData {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  title: string;
  data: any[];
  config?: Record<string, any>;
}

export interface Insight {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  title: string;
  description: string;
  timestamp: number;
  actions?: InsightAction[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface InsightAction {
  label: string;
  action: () => void | Promise<void>;
  style?: 'primary' | 'secondary' | 'danger';
}

export interface IInsightsDashboard {
  addMetric(metric: MetricData): void;
  removeMetric(metricId: string): void;
  getMetrics(): MetricData[];
  addChart(chart: ChartData): void;
  removeChart(chartId: string): void;
  getCharts(): ChartData[];
  addInsight(insight: Insight): void;
  removeInsight(insightId: string): void;
  getInsights(): Insight[];
  refresh(): Promise<void>;
  exportData(format: ExportFormat): Promise<any>;
  show(): void;
  hide(): void;
}

export interface WorkflowNode {
  id: string;
  type: 'start' | 'end' | 'process' | 'decision' | 'ai' | 'tool' | 'data';
  name: string;
  description?: string;
  position: { x: number; y: number };
  config?: Record<string, any>;
  inputs: WorkflowPort[];
  outputs: WorkflowPort[];
}

export interface WorkflowPort {
  id: string;
  name: string;
  type: 'data' | 'control';
  dataType?: string;
  connectedTo?: string;
}

export interface WorkflowEdge {
  id: string;
  sourceNodeId: string;
  sourcePortId: string;
  targetNodeId: string;
  targetPortId: string;
  condition?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  variables?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface IWorkflowDesigner {
  createWorkflow(name: string): Workflow;
  loadWorkflow(workflowId: string): Workflow;
  saveWorkflow(workflow: Workflow): Promise<void>;
  deleteWorkflow(workflowId: string): Promise<void>;
  addNode(node: WorkflowNode): void;
  removeNode(nodeId: string): void;
  updateNode(nodeId: string, updates: Partial<WorkflowNode>): void;
  addEdge(edge: WorkflowEdge): void;
  removeEdge(edgeId: string): void;
  validateWorkflow(workflow: Workflow): ValidationResult;
  executeWorkflow(workflow: Workflow): Promise<WorkflowExecutionResult>;
  exportWorkflow(workflow: Workflow, format: ExportFormat): Promise<any>;
  importWorkflow(data: any): Workflow;
  show(): void;
  hide(): void;
}

export interface ValidationResult {
  valid: boolean;
  errors: WorkflowValidationError[];
  warnings: ValidationWarning[];
}

export interface WorkflowValidationError {
  nodeId?: string;
  message: string;
  severity: 'error';
}

export interface ValidationWarning {
  nodeId?: string;
  message: string;
  severity: 'warning';
}

export interface WorkflowExecutionResult {
  success: boolean;
  outputs: Record<string, any>;
  logs: ExecutionLog[];
  executionTime: number;
  error?: string;
}

export interface ExecutionLog {
  timestamp: number;
  nodeId: string;
  message: string;
  level: 'info' | 'warning' | 'error';
}

export interface UIEvent {
  type: string;
  payload: any;
  timestamp: number;
}

export interface UIEventHandler {
  (event: UIEvent): void | Promise<void>;
}

export interface IUIManager {
  registerEventHandler(eventType: string, handler: UIEventHandler): void;
  unregisterEventHandler(eventType: string, handler: UIEventHandler): void;
  emitEvent(event: UIEvent): void;
  showNotification(notification: Notification): void;
  showModal(modal: Modal): void;
  closeModal(modalId: string): void;
  showLoading(message?: string): void;
  hideLoading(): void;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary';
}

export interface Modal {
  id: string;
  title: string;
  content: string | JSX.Element;
  size?: 'small' | 'medium' | 'large';
  closable?: boolean;
  actions?: ModalAction[];
}

export interface ModalAction {
  label: string;
  action: () => void;
  style?: 'primary' | 'secondary' | 'danger';
}
