/**
 * @file 流程设计器组件实现
 * @description 实现IWorkflowDesigner接口，提供工作流设计和管理功能
 * @module ui/WorkflowDesigner
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import { EventEmitter } from 'events';
import {
  IWorkflowDesigner,
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  WorkflowPort,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  WorkflowExecutionResult,
  ExecutionLog,
  ExportFormat,
} from './types';
import {
  NotFoundError,
  ConflictError,
  ValidationError as YYC3ValidationError,
} from '../error-handler/ErrorTypes';

export class WorkflowDesigner extends EventEmitter implements IWorkflowDesigner {
  private workflows: Map<string, Workflow>;
  private currentWorkflowId: string | null;
  private visible: boolean;
  private nodeTypes: Map<string, WorkflowNode>;

  constructor() {
    super();
    this.workflows = new Map();
    this.currentWorkflowId = null;
    this.visible = true;
    this.nodeTypes = new Map();
    this.initializeNodeTypes();
  }

  private initializeNodeTypes(): void {
    const startNode: WorkflowNode = {
      id: 'start',
      type: 'start',
      name: '开始',
      description: '工作流的起始节点',
      position: { x: 0, y: 0 },
      inputs: [],
      outputs: [
        {
          id: 'start-out',
          name: '开始',
          type: 'control',
        },
      ],
    };

    const endNode: WorkflowNode = {
      id: 'end',
      type: 'end',
      name: '结束',
      description: '工作流的结束节点',
      position: { x: 0, y: 0 },
      inputs: [
        {
          id: 'end-in',
          name: '结束',
          type: 'control',
        },
      ],
      outputs: [],
    };

    this.nodeTypes.set('start', startNode);
    this.nodeTypes.set('end', endNode);
  }

  createWorkflow(name: string): Workflow {
    const workflowId = this.generateId();
    const workflow: Workflow = {
      id: workflowId,
      name,
      description: '',
      nodes: [],
      edges: [],
      variables: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.workflows.set(workflowId, workflow);
    this.currentWorkflowId = workflowId;
    this.emit('workflow:created', workflow);

    return workflow;
  }

  loadWorkflow(workflowId: string): Workflow {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new NotFoundError('workflow', workflowId, {
        additionalData: { availableWorkflows: Array.from(this.workflows.keys()) }
      });
    }

    this.currentWorkflowId = workflowId;
    this.emit('workflow:loaded', workflow);
    return workflow;
  }

  async saveWorkflow(workflow: Workflow): Promise<void> {
    workflow.updatedAt = Date.now();
    this.workflows.set(workflow.id, workflow);
    this.emit('workflow:saved', workflow);
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId);
    if (!workflow) {
      throw new NotFoundError('workflow', workflowId, {
        additionalData: { availableWorkflows: Array.from(this.workflows.keys()) }
      });
    }

    this.workflows.delete(workflowId);
    if (this.currentWorkflowId === workflowId) {
      this.currentWorkflowId = null;
    }
    this.emit('workflow:deleted', workflowId);
  }

  addNode(node: WorkflowNode): void {
    const workflow = this.getCurrentWorkflow();
    if (!workflow) {
      throw new YYC3ValidationError('No active workflow', 'workflow', {
        additionalData: { currentWorkflowId: this.currentWorkflowId }
      });
    }

    if (workflow.nodes.find(n => n.id === node.id)) {
      throw new ConflictError('Node with this id already exists', 'node', {
        additionalData: { nodeId: node.id, existingNodes: workflow.nodes.map(n => n.id) }
      });
    }

    workflow.nodes.push(node);
    workflow.updatedAt = Date.now();
    this.emit('node:added', { workflowId: workflow.id, node });
  }

  removeNode(nodeId: string): void {
    const workflow = this.getCurrentWorkflow();
    if (!workflow) {
      throw new YYC3ValidationError('No active workflow', 'workflow', {
        additionalData: { currentWorkflowId: this.currentWorkflowId }
      });
    }

    const index = workflow.nodes.findIndex(n => n.id === nodeId);
    if (index === -1) {
      throw new NotFoundError('node', nodeId, {
        additionalData: { availableNodes: workflow.nodes.map(n => n.id) }
      });
    }

    const removedNode = workflow.nodes.splice(index, 1)[0];
    
    workflow.edges = workflow.edges.filter(e => 
      e.sourceNodeId !== nodeId && e.targetNodeId !== nodeId
    );
    
    workflow.updatedAt = Date.now();
    this.emit('node:removed', { workflowId: workflow.id, nodeId, node: removedNode });
  }

  updateNode(nodeId: string, updates: Partial<WorkflowNode>): void {
    const workflow = this.getCurrentWorkflow();
    if (!workflow) {
      throw new YYC3ValidationError('No active workflow', 'workflow', {
        additionalData: { currentWorkflowId: this.currentWorkflowId }
      });
    }

    const node = workflow.nodes.find(n => n.id === nodeId);
    if (!node) {
      throw new NotFoundError('node', nodeId);
    }

    Object.assign(node, updates);
    workflow.updatedAt = Date.now();
    this.emit('node:updated', { workflowId: workflow.id, nodeId, updates });
  }

  addEdge(edge: WorkflowEdge): void {
    const workflow = this.getCurrentWorkflow();
    if (!workflow) {
      throw new YYC3ValidationError('No active workflow', 'workflow', {
        additionalData: { currentWorkflowId: this.currentWorkflowId }
      });
    }

    if (workflow.edges.find(e => e.id === edge.id)) {
      throw new ConflictError('Edge with this id already exists', 'edge', {
        additionalData: { edgeId: edge.id, existingEdges: workflow.edges.map(e => e.id) }
      });
    }

    this.validateEdgeConnection(workflow, edge);
    
    workflow.edges.push(edge);
    workflow.updatedAt = Date.now();
    this.emit('edge:added', { workflowId: workflow.id, edge });
  }

  private validateEdgeConnection(workflow: Workflow, edge: WorkflowEdge): void {
    const sourceNode = workflow.nodes.find(n => n.id === edge.sourceNodeId);
    const targetNode = workflow.nodes.find(n => n.id === edge.targetNodeId);

    if (!sourceNode || !targetNode) {
      throw new NotFoundError('node', edge.sourceNodeId || edge.targetNodeId, {
        additionalData: { edgeId: edge.id, sourceNodeId: edge.sourceNodeId, targetNodeId: edge.targetNodeId }
      });
    }

    const sourcePort = sourceNode.outputs.find(p => p.id === edge.sourcePortId);
    const targetPort = targetNode.inputs.find(p => p.id === edge.targetPortId);

    if (!sourcePort || !targetPort) {
      throw new NotFoundError('port', edge.sourcePortId || edge.targetPortId, {
        additionalData: { edgeId: edge.id, sourcePortId: edge.sourcePortId, targetPortId: edge.targetPortId }
      });
    }

    if (sourcePort.type !== targetPort.type) {
      throw new YYC3ValidationError('Port types do not match', 'port', {
        additionalData: { sourcePortType: sourcePort.type, targetPortType: targetPort.type }
      });
    }
  }

  removeEdge(edgeId: string): void {
    const workflow = this.getCurrentWorkflow();
    if (!workflow) {
      throw new YYC3ValidationError('No active workflow', 'workflow', {
        additionalData: { currentWorkflowId: this.currentWorkflowId }
      });
    }

    const index = workflow.edges.findIndex(e => e.id === edgeId);
    if (index === -1) {
      throw new NotFoundError('edge', edgeId, {
        additionalData: { availableEdges: workflow.edges.map(e => e.id) }
      });
    }

    const removedEdge = workflow.edges.splice(index, 1)[0];
    workflow.updatedAt = Date.now();
    this.emit('edge:removed', { workflowId: workflow.id, edgeId, edge: removedEdge });
  }

  validateWorkflow(workflow: Workflow): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    if (workflow.nodes.length === 0) {
      errors.push({
        message: '工作流必须包含至少一个节点',
        severity: 'error',
      });
    }

    const startNodes = workflow.nodes.filter(n => n.type === 'start');
    const endNodes = workflow.nodes.filter(n => n.type === 'end');

    if (startNodes.length === 0) {
      errors.push({
        message: '工作流必须包含一个开始节点',
        severity: 'error',
      });
    } else if (startNodes.length > 1) {
      warnings.push({
        message: '工作流包含多个开始节点，只有第一个会被使用',
        severity: 'warning',
      });
    }

    if (endNodes.length === 0) {
      warnings.push({
        message: '工作流没有结束节点',
        severity: 'warning',
      });
    }

    for (const edge of workflow.edges) {
      const sourceNode = workflow.nodes.find(n => n.id === edge.sourceNodeId);
      const targetNode = workflow.nodes.find(n => n.id === edge.targetNodeId);

      if (!sourceNode || !targetNode) {
        errors.push({
          nodeId: edge.sourceNodeId,
          message: `边 ${edge.id} 连接到不存在的节点`,
          severity: 'error',
        });
      }
    }

    for (const node of workflow.nodes) {
      const incomingEdges = workflow.edges.filter(e => e.targetNodeId === node.id);
      const outgoingEdges = workflow.edges.filter(e => e.sourceNodeId === node.id);

      if (node.type !== 'start' && incomingEdges.length === 0) {
        warnings.push({
          nodeId: node.id,
          message: `节点 ${node.name} 没有输入连接`,
          severity: 'warning',
        });
      }

      if (node.type !== 'end' && outgoingEdges.length === 0) {
        warnings.push({
          nodeId: node.id,
          message: `节点 ${node.name} 没有输出连接`,
          severity: 'warning',
        });
      }
    }

    const result: ValidationResult = {
      valid: errors.length === 0,
      errors,
      warnings,
    };

    this.emit('workflow:validated', { workflowId: workflow.id, result });
    return result;
  }

  async executeWorkflow(workflow: Workflow): Promise<WorkflowExecutionResult> {
    const validation = this.validateWorkflow(workflow);
    
    if (!validation.valid) {
      return {
        success: false,
        outputs: {},
        logs: [],
        executionTime: 0,
        error: '工作流验证失败',
      };
    }

    this.emit('workflow:executing', { workflowId: workflow.id });
    const startTime = Date.now();
    const logs: ExecutionLog[] = [];

    try {
      const outputs = await this.executeNodes(workflow, logs);
      const executionTime = Date.now() - startTime;

      const result: WorkflowExecutionResult = {
        success: true,
        outputs,
        logs,
        executionTime,
      };

      this.emit('workflow:executed', { workflowId: workflow.id, result });
      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const result: WorkflowExecutionResult = {
        success: false,
        outputs: {},
        logs,
        executionTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.emit('workflow:error', { workflowId: workflow.id, result });
      return result;
    }
  }

  private async executeNodes(workflow: Workflow, logs: ExecutionLog[]): Promise<Record<string, any>> {
    const outputs: Record<string, any> = {};
    const startNode = workflow.nodes.find(n => n.type === 'start');
    
    if (!startNode) {
      throw new NotFoundError('node', 'start');
    }

    const visitedNodes = new Set<string>();
    const nodeQueue: WorkflowNode[] = [startNode];

    while (nodeQueue.length > 0) {
      const currentNode = nodeQueue.shift()!;
      
      if (visitedNodes.has(currentNode.id)) {
        continue;
      }

      visitedNodes.add(currentNode.id);

      logs.push({
        timestamp: Date.now(),
        nodeId: currentNode.id,
        message: `执行节点: ${currentNode.name}`,
        level: 'info',
      });

      const nodeOutput = await this.executeNode(currentNode, workflow.variables);
      outputs[currentNode.id] = nodeOutput;

      const outgoingEdges = workflow.edges.filter(e => e.sourceNodeId === currentNode.id);
      
      for (const edge of outgoingEdges) {
        const targetNode = workflow.nodes.find(n => n.id === edge.targetNodeId);
        if (targetNode && !visitedNodes.has(targetNode.id)) {
          nodeQueue.push(targetNode);
        }
      }
    }

    return outputs;
  }

  private async executeNode(node: WorkflowNode, variables: Record<string, any>): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    switch (node.type) {
      case 'start':
        return { started: true };
      case 'end':
        return { finished: true };
      case 'ai':
        return { response: `AI处理结果: ${node.name}` };
      case 'tool':
        return { result: `工具执行结果: ${node.name}` };
      case 'data':
        return { data: `数据处理结果: ${node.name}` };
      case 'process':
        return { processed: true };
      case 'decision':
        return { decision: true };
      default:
        return {};
    }
  }

  async exportWorkflow(workflow: Workflow, format: ExportFormat): Promise<any> {
    switch (format) {
      case 'json':
        return JSON.stringify(workflow, null, 2);
      case 'markdown':
        return this.convertToMarkdown(workflow);
      case 'txt':
        return this.convertToText(workflow);
      default:
        return JSON.stringify(workflow, null, 2);
    }
  }

  private convertToMarkdown(workflow: Workflow): string {
    let markdown = `# ${workflow.name}\n\n`;
    markdown += `创建时间: ${new Date(workflow.createdAt).toLocaleString('zh-CN')}\n`;
    markdown += `更新时间: ${new Date(workflow.updatedAt).toLocaleString('zh-CN')}\n\n`;

    if (workflow.description) {
      markdown += `## 描述\n\n${workflow.description}\n\n`;
    }

    markdown += `## 节点 (${workflow.nodes.length})\n\n`;
    for (const node of workflow.nodes) {
      markdown += `### ${node.name} (${node.type})\n`;
      markdown += `- ID: ${node.id}\n`;
      markdown += `- 位置: (${node.position.x}, ${node.position.y})\n`;
      if (node.description) {
        markdown += `- 描述: ${node.description}\n`;
      }
      markdown += `\n`;
    }

    markdown += `## 连接 (${workflow.edges.length})\n\n`;
    for (const edge of workflow.edges) {
      markdown += `- ${edge.sourceNodeId} -> ${edge.targetNodeId}\n`;
    }

    return markdown;
  }

  private convertToText(workflow: Workflow): string {
    let text = `${workflow.name}\n`;
    text += `创建时间: ${new Date(workflow.createdAt).toLocaleString('zh-CN')}\n\n`;

    text += `节点:\n`;
    for (const node of workflow.nodes) {
      text += `- ${node.name} (${node.type})\n`;
    }

    text += `\n连接:\n`;
    for (const edge of workflow.edges) {
      text += `- ${edge.sourceNodeId} -> ${edge.targetNodeId}\n`;
    }

    return text;
  }

  importWorkflow(data: any): Workflow {
    let workflow: Workflow;

    if (typeof data === 'string') {
      workflow = JSON.parse(data);
    } else {
      workflow = data;
    }

    workflow.id = this.generateId();
    workflow.createdAt = Date.now();
    workflow.updatedAt = Date.now();

    this.workflows.set(workflow.id, workflow);
    this.currentWorkflowId = workflow.id;
    this.emit('workflow:imported', workflow);

    return workflow;
  }

  show(): void {
    this.visible = true;
    this.emit('visibility:changed', { visible: true });
  }

  hide(): void {
    this.visible = false;
    this.emit('visibility:changed', { visible: false });
  }

  getCurrentWorkflow(): Workflow | null {
    if (!this.currentWorkflowId) {
      return null;
    }

    return this.workflows.get(this.currentWorkflowId) || null;
  }

  listWorkflows(): Workflow[] {
    return Array.from(this.workflows.values())
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
