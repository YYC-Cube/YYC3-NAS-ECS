export interface ComputeParadigm {
  type: ParadigmType;
  capabilities: ParadigmCapabilities;
  config: ParadigmConfig;
}

export type ParadigmType = 
  | 'classical'
  | 'quantum'
  | 'neuromorphic'
  | 'hybrid'
  | 'symbolic'
  | 'connectionist'
  | 'evolutionary'
  | 'custom';

export interface ParadigmCapabilities {
  operations: OperationType[];
  dataTypes: DataType[];
  precision: PrecisionType;
  parallelism: ParallelismType;
  scalability: ScalabilityType;
}

export type OperationType = 
  | 'arithmetic'
  | 'logical'
  | 'comparison'
  | 'matrix'
  | 'tensor'
  | 'quantum_gate'
  | 'neural_forward'
  | 'neural_backward'
  | 'evolutionary_mutation'
  | 'symbolic_reasoning'
  | 'custom';

export type DataType = 
  | 'scalar'
  | 'vector'
  | 'matrix'
  | 'tensor'
  | 'qubit'
  | 'spike'
  | 'graph'
  | 'tree'
  | 'custom';

export type PrecisionType = 
  | 'float16'
  | 'float32'
  | 'float64'
  | 'int8'
  | 'int16'
  | 'int32'
  | 'int64'
  | 'quantum'
  | 'custom';

export type ParallelismType = 
  | 'none'
  | 'data'
  | 'task'
  | 'pipeline'
  | 'massive'
  | 'quantum'
  | 'custom';

export type ScalabilityType = 
  | 'linear'
  | 'sublinear'
  | 'superlinear'
  | 'logarithmic'
  | 'constant'
  | 'quantum_exponential'
  | 'custom';

export interface ParadigmConfig {
  resources: ResourceConfig;
  optimization: OptimizationConfig;
  constraints: ConstraintConfig;
}

export interface ResourceConfig {
  cpu?: number;
  gpu?: number;
  tpu?: number;
  quantum?: number;
  neuromorphic?: number;
  memory?: number;
  storage?: number;
  network?: number;
}

export interface OptimizationConfig {
  enableCaching: boolean;
  enableParallelization: boolean;
  enableVectorization: boolean;
  enableQuantization: boolean;
  enablePruning: boolean;
  enableDistillation: boolean;
  customOptimizations?: Record<string, any>;
}

export interface ConstraintConfig {
  maxExecutionTime?: number;
  maxMemoryUsage?: number;
  maxEnergyConsumption?: number;
  maxErrorRate?: number;
  customConstraints?: Record<string, any>;
}

export interface ComputeTask {
  id: string;
  paradigm: ParadigmType;
  operation: OperationType;
  input: ComputeInput;
  output?: ComputeOutput;
  status: TaskStatus;
  config: TaskConfig;
  metrics: TaskMetrics;
  dependencies: string[];
}

export interface ComputeInput {
  data: any;
  type: DataType;
  shape?: number[];
  metadata?: Record<string, any>;
}

export interface ComputeOutput {
  data: any;
  type: DataType;
  shape?: number[];
  metadata?: Record<string, any>;
}

export type TaskStatus = 
  | 'pending'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface TaskConfig {
  priority: TaskPriority;
  timeout?: number;
  retries?: number;
  checkpointing?: boolean;
  checkpointInterval?: number;
}

export type TaskPriority = 
  | 'low'
  | 'normal'
  | 'high'
  | 'critical';

export interface TaskMetrics {
  executionTime: number;
  memoryUsage: number;
  energyConsumption?: number;
  accuracy?: number;
  throughput?: number;
  latency?: number;
  customMetrics?: Record<string, number>;
}

export interface ComputeResult {
  taskId: string;
  paradigm: ParadigmType;
  output: ComputeOutput;
  status: TaskStatus;
  metrics: TaskMetrics;
  timestamp: Date;
}

export interface UnifiedComputeInterface {
  registerParadigm(paradigm: ComputeParadigm): Promise<void>;
  unregisterParadigm(type: ParadigmType): Promise<void>;
  getParadigm(type: ParadigmType): Promise<ComputeParadigm>;
  listParadigms(): Promise<ComputeParadigm[]>;
  
  executeTask(task: ComputeTask): Promise<ComputeResult>;
  executeTasks(tasks: ComputeTask[]): Promise<ComputeResult[]>;
  cancelTask(taskId: string): Promise<void>;
  getTaskStatus(taskId: string): Promise<TaskStatus>;
  
  optimizeTask(task: ComputeTask): Promise<ComputeTask>;
  selectBestParadigm(task: ComputeTask): Promise<ParadigmType>;
  
  benchmark(paradigm: ParadigmType, tasks: ComputeTask[]): Promise<BenchmarkResult>;
  compareParadigms(paradigms: ParadigmType[], tasks: ComputeTask[]): Promise<ComparisonResult>;
}

export interface BenchmarkResult {
  paradigm: ParadigmType;
  tasks: TaskBenchmark[];
  summary: BenchmarkSummary;
  timestamp: Date;
}

export interface TaskBenchmark {
  taskId: string;
  executionTime: number;
  memoryUsage: number;
  accuracy?: number;
  throughput?: number;
  latency?: number;
}

export interface BenchmarkSummary {
  avgExecutionTime: number;
  avgMemoryUsage: number;
  avgAccuracy?: number;
  avgThroughput?: number;
  avgLatency?: number;
  totalTasks: number;
  successRate: number;
}

export interface ComparisonResult {
  paradigms: ParadigmComparison[];
  bestParadigm: ParadigmType;
  recommendation: string;
  timestamp: Date;
}

export interface ParadigmComparison {
  paradigm: ParadigmType;
  summary: BenchmarkSummary;
  score: number;
  strengths: string[];
  weaknesses: string[];
}

export interface ClassicalCompute implements ComputeParadigm {
  type: 'classical';
  capabilities: ParadigmCapabilities;
  config: ParadigmConfig;
}

export interface QuantumCompute implements ComputeParadigm {
  type: 'quantum';
  capabilities: ParadigmCapabilities;
  config: ParadigmConfig;
  qubits: number;
  gates: QuantumGate[];
}

export interface QuantumGate {
  name: string;
  type: 'single' | 'multi';
  qubits: number[];
  parameters?: number[];
}

export interface NeuromorphicCompute implements ComputeParadigm {
  type: 'neuromorphic';
  capabilities: ParadigmCapabilities;
  config: ParadigmConfig;
  neurons: number;
  synapses: number;
  architecture: NeuromorphicArchitecture;
}

export type NeuromorphicArchitecture = 
  | 'spiking_neural_network'
  | 'memristor_based'
  | 'brain_inspired'
  | 'custom';

export interface HybridCompute implements ComputeParadigm {
  type: 'hybrid';
  capabilities: ParadigmCapabilities;
  config: ParadigmConfig;
  components: HybridComponent[];
  orchestration: OrchestrationStrategy;
}

export interface HybridComponent {
  paradigm: ParadigmType;
  weight: number;
  responsibilities: string[];
}

export type OrchestrationStrategy = 
  | 'sequential'
  | 'parallel'
  | 'adaptive'
  | 'custom';

export interface SymbolicCompute implements ComputeParadigm {
  type: 'symbolic';
  capabilities: ParadigmCapabilities;
  config: ParadigmConfig;
  reasoningEngine: ReasoningEngine;
  knowledgeBase: KnowledgeBase;
}

export interface ReasoningEngine {
  type: 'forward' | 'backward' | 'bidirectional' | 'custom';
  algorithm: string;
  inferenceRules: Rule[];
}

export interface Rule {
  id: string;
  conditions: Condition[];
  actions: Action[];
  priority: number;
}

export interface Condition {
  type: string;
  operator: string;
  value: any;
}

export interface Action {
  type: string;
  parameters: Record<string, any>;
}

export interface KnowledgeBase {
  facts: Fact[];
  rules: Rule[];
  ontologies: Ontology[];
}

export interface Fact {
  id: string;
  predicate: string;
  arguments: any[];
  confidence: number;
}

export interface Ontology {
  id: string;
  classes: Class[];
  properties: Property[];
  relations: Relation[];
}

export interface Class {
  id: string;
  name: string;
  superClass?: string;
  properties: string[];
}

export interface Property {
  id: string;
  name: string;
  domain: string;
  range: string;
}

export interface Relation {
  id: string;
  name: string;
  domain: string;
  range: string;
}

export interface ConnectionistCompute implements ComputeParadigm {
  type: 'connectionist';
  capabilities: ParadigmCapabilities;
  config: ParadigmConfig;
  network: NeuralNetwork;
  training: TrainingConfig;
}

export interface NeuralNetwork {
  architecture: NetworkArchitecture;
  layers: Layer[];
  connections: Connection[];
}

export type NetworkArchitecture = 
  | 'feedforward'
  | 'recurrent'
  | 'convolutional'
  | 'transformer'
  | 'graph'
  | 'custom';

export interface Layer {
  id: string;
  type: LayerType;
  size: number;
  activation?: string;
  parameters?: Record<string, any>;
}

export type LayerType = 
  | 'dense'
  | 'conv2d'
  | 'lstm'
  | 'attention'
  | 'embedding'
  | 'custom';

export interface Connection {
  from: string;
  to: string;
  weight: number;
  trainable: boolean;
}

export interface TrainingConfig {
  optimizer: string;
  learningRate: number;
  batchSize: number;
  epochs: number;
  lossFunction: string;
  metrics: string[];
}

export interface EvolutionaryCompute implements ComputeParadigm {
  type: 'evolutionary';
  capabilities: ParadigmCapabilities;
  config: ParadigmConfig;
  population: Population;
  evolution: EvolutionConfig;
}

export interface Population {
  individuals: Individual[];
  size: number;
  generation: number;
}

export interface Individual {
  id: string;
  genotype: any;
  phenotype: any;
  fitness: number;
  age: number;
}

export interface EvolutionConfig {
  selectionMethod: SelectionMethod;
  crossoverMethod: CrossoverMethod;
  mutationMethod: MutationMethod;
  mutationRate: number;
  crossoverRate: number;
  elitism: number;
}

export type SelectionMethod = 
  | 'tournament'
  | 'roulette_wheel'
  | 'rank'
  | 'custom';

export type CrossoverMethod = 
  | 'single_point'
  | 'multi_point'
  | 'uniform'
  | 'custom';

export type MutationMethod = 
  | 'bit_flip'
  | 'gaussian'
  | 'uniform'
  | 'custom';

export interface ComputeScheduler {
  schedule(task: ComputeTask): Promise<ScheduleResult>;
  reschedule(taskId: string): Promise<ScheduleResult>;
  getSchedule(): Promise<Schedule>;
  optimizeSchedule(): Promise<Schedule>;
}

export interface ScheduleResult {
  taskId: string;
  paradigm: ParadigmType;
  startTime: Date;
  estimatedEndTime: Date;
  priority: TaskPriority;
}

export interface Schedule {
  tasks: ScheduleResult[];
  utilization: UtilizationMetrics;
  bottlenecks: Bottleneck[];
}

export interface UtilizationMetrics {
  cpu: number;
  gpu: number;
  memory: number;
  quantum?: number;
  neuromorphic?: number;
}

export interface Bottleneck {
  resource: string;
  severity: 'low' | 'medium' | 'high';
  affectedTasks: string[];
  recommendation: string;
}

export interface ComputeMonitor {
  monitorTask(taskId: string): Promise<void>;
  stopMonitoring(taskId: string): Promise<void>;
  getTaskMetrics(taskId: string): Promise<TaskMetrics>;
  getSystemMetrics(): Promise<SystemMetrics>;
  getAlerts(): Promise<ComputeAlert[]>;
}

export interface SystemMetrics {
  cpu: ResourceMetrics;
  memory: ResourceMetrics;
  gpu?: ResourceMetrics;
  quantum?: ResourceMetrics;
  neuromorphic?: ResourceMetrics;
  network: NetworkMetrics;
}

export interface ResourceMetrics {
  used: number;
  total: number;
  percentage: number;
  available: number;
}

export interface NetworkMetrics {
  bandwidth: number;
  latency: number;
  packetLoss: number;
  connections: number;
}

export interface ComputeAlert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  taskId?: string;
  paradigm?: ParadigmType;
  timestamp: Date;
  resolved: boolean;
}

export type AlertType = 
  | 'task_timeout'
  | 'resource_exhaustion'
  | 'performance_degradation'
  | 'paradigm_failure'
  | 'custom';

export type AlertSeverity = 
  | 'info'
  | 'warning'
  | 'error'
  | 'critical';

export interface ComputeOptimizer {
  optimizeTask(task: ComputeTask): Promise<OptimizedTask>;
  optimizeSchedule(schedule: Schedule): Promise<OptimizedSchedule>;
  optimizeParadigm(paradigm: ComputeParadigm): Promise<OptimizedParadigm>;
}

export interface OptimizedTask {
  task: ComputeTask;
  optimizations: Optimization[];
  estimatedImprovement: ImprovementEstimate;
}

export interface Optimization {
  type: OptimizationType;
  description: string;
  impact: string;
}

export type OptimizationType = 
  | 'caching'
  | 'parallelization'
  | 'vectorization'
  | 'quantization'
  | 'pruning'
  | 'distillation'
  | 'custom';

export interface ImprovementEstimate {
  executionTime: number;
  memoryUsage: number;
  accuracy?: number;
  energyConsumption?: number;
}

export interface OptimizedSchedule {
  schedule: Schedule;
  optimizations: Optimization[];
  estimatedImprovement: ImprovementEstimate;
}

export interface OptimizedParadigm {
  paradigm: ComputeParadigm;
  optimizations: Optimization[];
  estimatedImprovement: ImprovementEstimate;
}
