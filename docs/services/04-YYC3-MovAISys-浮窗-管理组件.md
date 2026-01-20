# YYC³可插拔式拖拽移动AI系统：基于“五标五高五化”的多维度深化设计指导,YYC³可插拔式拖拽移动AI系统完整代码实施方案

## 📚 第四章：交互功能组件深度设计

- **DragManager**：完整的拖拽管理系统
- **PositionOptimizer**：智能位置优化系统
- **ResizeController**：窗口大小调整控制器
- **ThemeManager**：主题和样式管理系统
- **NotificationCenter**：通知中心组件

### 4.1 DragManager（拖拽管理系统）

#### 4.1.1 设计理念

目标：提供流畅、自然、跨平台的拖拽体验，支持复杂拖拽场景和自定义行为。
核心思想：将拖拽抽象为状态机，通过事件驱动管理拖拽生命周期。
特性：支持多指触控、惯性拖拽、拖拽约束、拖拽手柄、拖拽预览等。

#### 4.1.2 完整架构设计

typescript

```plaintext
// ================================================
// 1. 拖拽状态机定义
// ================================================

export enum DragState {
  IDLE = 'idle',          // 空闲状态
  PREPARING = 'preparing', // 准备拖拽（如长按触发）
  DRAGGING = 'dragging',  // 拖拽中
  DROPPING = 'dropping',  // 正在放置
  CANCELLED = 'cancelled', // 拖拽取消
  COMPLETED = 'completed' // 拖拽完成
}

export interface DragSession {
  id: string;                     // 会话ID
  state: DragState;               // 当前状态
  source: DragSource;             // 拖拽源
  data: any;                      // 拖拽数据
  position: { x: number, y: number }; // 当前位置（相对视口）
  startPosition: { x: number, y: number }; // 开始位置
  startTime: Date;                // 开始时间
  lastUpdated: Date;              // 最后更新时间
  velocity: { x: number, y: number }; // 当前速度（用于惯性）
  constraints?: DragConstraints;  // 约束条件
  dropTarget?: DropTarget;        // 当前悬停的放置目标
}

// ================================================
// 2. 拖拽管理器核心
// ================================================

export class DragManager {
  private sessions: Map<string, DragSession> = new Map();
  private activeSessionId: string | null = null;
  private eventEmitter: EventEmitter = new EventEmitter();
  private config: DragManagerConfig;
  private inertiaSimulator: InertiaSimulator;
  private gestureRecognizer: GestureRecognizer;
  private dropTargetManager: DropTargetManager;
  
  // 拖拽约束函数类型
  private constraintFunctions: Map<string, ConstraintFunction> = new Map();
  
  constructor(config: Partial<DragManagerConfig> = {}) {
    this.config = {
      dragThreshold: 5,           // 拖拽阈值（像素）
      longPressDuration: 500,     // 长按触发拖拽的时长（ms）
      inertiaDeceleration: 0.95,  // 惯性减速度
      defaultConstraint: 'none',  // 默认约束
      ...config
    };
    
    this.inertiaSimulator = new InertiaSimulator(this.config);
    this.gestureRecognizer = new GestureRecognizer(this.config);
    this.dropTargetManager = new DropTargetManager();
    
    // 注册内置约束
    this.registerConstraint('none', this.noConstraint);
    this.registerConstraint('horizontal', this.horizontalConstraint);
    this.registerConstraint('vertical', this.verticalConstraint);
    this.registerConstraint('parentBoundary', this.parentBoundaryConstraint);
    this.registerConstraint('grid', this.gridConstraint);
    
    // 初始化事件监听
    this.setupEventListeners();
  }
  
  /**
   * 开始拖拽会话
   */
  startDrag(source: DragSource, data: any, options: DragOptions = {}): string {
    const sessionId = generateSessionId();
    
    const session: DragSession = {
      id: sessionId,
      state: DragState.PREPARING,
      source,
      data,
      position: source.getInitialPosition(),
      startPosition: source.getInitialPosition(),
      startTime: new Date(),
      lastUpdated: new Date(),
      velocity: { x: 0, y: 0 },
      constraints: options.constraints,
    };
    
    this.sessions.set(sessionId, session);
    this.activeSessionId = sessionId;
    
    // 触发开始事件
    this.eventEmitter.emit('dragStart', { session });
    
    // 根据触发方式处理
    if (options.trigger === 'immediate') {
      this.transitionToState(sessionId, DragState.DRAGGING);
    } else if (options.trigger === 'longPress') {
      // 启动长按计时器
      this.startLongPressTimer(sessionId);
    }
    
    return sessionId;
  }
  
  /**
   * 更新拖拽位置
   */
  updateDrag(sessionId: string, newPosition: { x: number, y: number }): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.state !== DragState.DRAGGING) return;
    
    // 计算速度
    const now = new Date();
    const deltaTime = now.getTime() - session.lastUpdated.getTime();
    if (deltaTime > 0) {
      const deltaX = newPosition.x - session.position.x;
      const deltaY = newPosition.y - session.position.y;
      session.velocity = {
        x: deltaX / deltaTime,
        y: deltaY / deltaTime
      };
    }
    
    // 应用约束
    let constrainedPosition = newPosition;
    if (session.constraints) {
      constrainedPosition = this.applyConstraints(session, newPosition);
    }
    
    // 更新会话
    session.position = constrainedPosition;
    session.lastUpdated = now;
    
    // 检测放置目标
    const dropTarget = this.dropTargetManager.findDropTarget(constrainedPosition, session.data);
    if (dropTarget !== session.dropTarget) {
      // 放置目标改变
      if (session.dropTarget) {
        this.eventEmitter.emit('dragLeave', { session, dropTarget: session.dropTarget });
      }
      if (dropTarget) {
        this.eventEmitter.emit('dragEnter', { session, dropTarget });
      }
    }
    session.dropTarget = dropTarget;
    
    // 发出更新事件
    this.eventEmitter.emit('dragMove', { session });
    
    // 更新拖拽视觉反馈
    this.updateDragPreview(session);
  }
  
  /**
   * 结束拖拽
   */
  endDrag(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    // 如果是拖拽状态，尝试放置
    if (session.state === DragState.DRAGGING) {
      this.drop(sessionId);
    } else {
      this.cancelDrag(sessionId);
    }
  }
  
  /**
   * 放置操作
   */
  private async drop(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    this.transitionToState(sessionId, DragState.DROPPING);
    
    try {
      // 如果有放置目标，执行放置逻辑
      if (session.dropTarget) {
        const success = await session.dropTarget.onDrop(session.data, session.position);
        
        if (success) {
          this.transitionToState(sessionId, DragState.COMPLETED);
          this.eventEmitter.emit('dropSuccess', { session, dropTarget: session.dropTarget });
        } else {
          throw new Error('Drop rejected by target');
        }
      } else {
        // 没有放置目标，取消拖拽
        throw new Error('No drop target');
      }
    } catch (error) {
      this.cancelDrag(sessionId);
    }
  }
  
  /**
   * 取消拖拽
   */
  cancelDrag(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    this.transitionToState(sessionId, DragState.CANCELLED);
    
    // 触发取消事件
    this.eventEmitter.emit('dragCancel', { session });
    
    // 清理会话
    this.cleanupSession(sessionId);
  }
  
  /**
   * 状态转移
   */
  private transitionToState(sessionId: string, newState: DragState): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    const oldState = session.state;
    session.state = newState;
    
    // 触发状态变化事件
    this.eventEmitter.emit('stateChange', { session, oldState, newState });
    
    // 状态特定的处理
    switch (newState) {
      case DragState.DRAGGING:
        this.onStartDragging(session);
        break;
      case DragState.COMPLETED:
        this.onDragCompleted(session);
        break;
      case DragState.CANCELLED:
        this.onDragCancelled(session);
        break;
    }
  }
  
  /**
   * 应用约束
   */
  private applyConstraints(session: DragSession, position: { x: number, y: number }): { x: number, y: number } {
    let result = { ...position };
    
    // 应用每个约束
    if (session.constraints) {
      if (session.constraints.function) {
        const constraintFunc = this.constraintFunctions.get(session.constraints.function);
        if (constraintFunc) {
          result = constraintFunc(result, session);
        }
      }
      
      // 应用边界约束
      if (session.constraints.boundary) {
        result = this.applyBoundaryConstraint(result, session.constraints.boundary);
      }
      
      // 应用网格约束
      if (session.constraints.grid) {
        result = this.applyGridConstraint(result, session.constraints.grid);
      }
    }
    
    return result;
  }
  
  /**
   * 注册自定义约束函数
   */
  registerConstraint(name: string, constraintFunc: ConstraintFunction): void {
    this.constraintFunctions.set(name, constraintFunc);
  }
  
  /**
   * 内置约束函数
   */
  private noConstraint(position: { x: number, y: number }, session: DragSession): { x: number, y: number } {
    return position;
  }
  
  private horizontalConstraint(position: { x: number, y: number }, session: DragSession): { x: number, y: number } {
    return { x: position.x, y: session.startPosition.y };
  }
  
  private verticalConstraint(position: { x: number, y: number }, session: DragSession): { x: number, y: number } {
    return { x: session.startPosition.x, y: position.y };
  }
  
  private parentBoundaryConstraint(position: { x: number, y: number }, session: DragSession): { x: number, y: number } {
    const parentRect = session.source.getParentRect();
    const elementRect = session.source.getElementRect();
    
    return {
      x: Math.max(parentRect.left, Math.min(position.x, parentRect.right - elementRect.width)),
      y: Math.max(parentRect.top, Math.min(position.y, parentRect.bottom - elementRect.height))
    };
  }
  
  private gridConstraint(position: { x: number, y: number }, session: DragSession, gridSize: number = 10): { x: number, y: number } {
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize
    };
  }
  
  /**
   * 惯性拖拽
   */
  private startInertia(session: DragSession): void {
    if (this.config.enableInertia && (Math.abs(session.velocity.x) > 0.1 || Math.abs(session.velocity.y) > 0.1)) {
      this.inertiaSimulator.start(session, (position) => {
        this.updateDrag(session.id, position);
      });
    }
  }
  
  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    // 鼠标事件
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // 触摸事件
    document.addEventListener('touchstart', this.handleTouchStart.bind(this));
    document.addEventListener('touchmove', this.handleTouchMove.bind(this));
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    
    // 键盘事件（用于取消拖拽）
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }
  
  // 事件处理函数
  private handleMouseDown(event: MouseEvent): void {
    // 找到拖拽源并开始拖拽
    const source = this.findDragSource(event.target as HTMLElement);
    if (source) {
      event.preventDefault();
      this.startDrag(source, source.getData(), { trigger: 'longPress' });
    }
  }
  
  // 其他事件处理函数...
}

// ================================================
// 3. 拖拽源接口
// ================================================

export interface DragSource {
  // 获取拖拽数据
  getData(): any;
  
  // 获取初始位置
  getInitialPosition(): { x: number, y: number };
  
  // 获取元素矩形
  getElementRect(): DOMRect;
  
  // 获取父元素矩形
  getParentRect(): DOMRect;
  
  // 拖拽开始时的回调
  onDragStart?(session: DragSession): void;
  
  // 拖拽结束时的回调
  onDragEnd?(session: DragSession): void;
  
  // 拖拽取消时的回调
  onDragCancel?(session: DragSession): void;
}

// ================================================
// 4. 放置目标接口
// ================================================

export interface DropTarget {
  // 判断点是否在目标内
  contains(point: { x: number, y: number }): boolean;
  
  // 放置数据
  onDrop(data: any, position: { x: number, y: number }): Promise<boolean>;
  
  // 拖拽进入时的回调
  onDragEnter?(session: DragSession): void;
  
  // 拖拽离开时的回调
  onDragLeave?(session: DragSession): void;
  
  // 拖拽在目标上移动时的回调
  onDragOver?(session: DragSession): void;
}
```text

### 4.2 PositionOptimizer（智能位置优化系统）

#### 4.2.1 设计理念

目标：基于用户行为、屏幕布局和上下文信息，智能推荐组件的最佳位置。
核心思想：机器学习 + 启发式规则，平衡可访问性、效率和美观。
特性：学习用户偏好、避让关键区域、多屏适配、上下文感知。

#### 4.2.2 完整架构设计

typescript

```plaintext
export class PositionOptimizer {
  private heatmap: Heatmap;
  private preferenceLearner: PreferenceLearner;
  private ruleEngine: RuleEngine;
  private screenAnalyzer: ScreenAnalyzer;
  private contextManager: ContextManager;
  
  // 位置记忆
  private positionMemory: Map<string, PositionMemory> = new Map();
  
  constructor(config: PositionOptimizerConfig) {
    this.heatmap = new Heatmap(config.heatmapResolution);
    this.preferenceLearner = new PreferenceLearner(config.learningRate);
    this.ruleEngine = new RuleEngine(config.rules);
    this.screenAnalyzer = new ScreenAnalyzer();
    this.contextManager = new ContextManager();
    
    // 加载历史数据
    this.loadHistoricalData();
  }
  
  /**
   * 为组件推荐最佳位置
   */
  async recommendPosition(
    component: UIComponent,
    constraints: PositionConstraints = {}
  ): Promise<RecommendedPosition> {
    // 1. 收集上下文信息
    const context = await this.collectContext(component);
    
    // 2. 获取候选位置
    const candidates = await this.generateCandidates(component, constraints, context);
    
    // 3. 评估每个候选位置
    const scoredCandidates = await this.scoreCandidates(candidates, context);
    
    // 4. 选择最佳位置
    const bestCandidate = this.selectBestCandidate(scoredCandidates);
    
    // 5. 记录决策
    await this.recordDecision(component, bestCandidate, context);
    
    return {
      ...bestCandidate.position,
      confidence: bestCandidate.score,
      reason: bestCandidate.reasons,
      alternatives: scoredCandidates.slice(1, 4).map(c => ({
        position: c.position,
        score: c.score
      }))
    };
  }
  
  /**
   * 生成候选位置
   */
  private async generateCandidates(
    component: UIComponent,
    constraints: PositionConstraints,
    context: OptimizationContext
  ): Promise<CandidatePosition[]> {
    const candidates: CandidatePosition[] = [];
    
    // 1. 用户偏好位置
    const preferred = await this.getPreferredPositions(component, context);
    candidates.push(...preferred);
    
    // 2. 基于规则的位置
    const ruleBased = this.ruleEngine.generatePositions(component, constraints, context);
    candidates.push(...ruleBased);
    
    // 3. 基于热点的位置
    const heatBased = this.generateHeatBasedPositions(component, context);
    candidates.push(...heatBased);
    
    // 4. 避让关键区域的位置
    const avoidBased = this.generateAvoidancePositions(component, context);
    candidates.push(...avoidBased);
    
    // 去重
    return this.deduplicateCandidates(candidates);
  }
  
  /**
   * 评估候选位置
   */
  private async scoreCandidates(
    candidates: CandidatePosition[],
    context: OptimizationContext
  ): Promise<ScoredCandidate[]> {
    const scored = await Promise.all(
      candidates.map(async candidate => {
        const scores = await this.calculateScores(candidate, context);
        const totalScore = this.combineScores(scores);
        
        return {
          position: candidate.position,
          scores,
          totalScore,
          reasons: this.generateReasons(scores)
        };
      })
    );
    
    // 按总分排序
    return scored.sort((a, b) => b.totalScore - a.totalScore);
  }
  
  /**
   * 计算多个维度的分数
   */
  private async calculateScores(
    candidate: CandidatePosition,
    context: OptimizationContext
  ): Promise<ScoreBreakdown> {
    const [
      accessibilityScore,
      efficiencyScore,
      aestheticsScore,
      stabilityScore,
      personalizationScore
    ] = await Promise.all([
      this.scoreAccessibility(candidate, context),
      this.scoreEfficiency(candidate, context),
      this.scoreAesthetics(candidate, context),
      this.scoreStability(candidate, context),
      this.scorePersonalization(candidate, context)
    ]);
    
    return {
      accessibility: accessibilityScore,
      efficiency: efficiencyScore,
      aesthetics: aestheticsScore,
      stability: stabilityScore,
      personalization: personalizationScore
    };
  }
  
  /**
   * 可访问性评分：确保组件易于访问
   */
  private async scoreAccessibility(
    candidate: CandidatePosition,
    context: OptimizationContext
  ): Promise<number> {
    const factors = [];
    
    // 1. 距离屏幕边缘的距离（太近不好访问）
    const edgeDistance = this.calculateEdgeDistance(candidate.position, context.screen);
    factors.push(this.normalizeEdgeDistance(edgeDistance));
    
    // 2. 与当前焦点的距离
    const focusDistance = this.calculateFocusDistance(candidate.position, context.focusElement);
    factors.push(this.normalizeFocusDistance(focusDistance));
    
    // 3. 手势可达性（特别是移动设备）
    const reachability = this.calculateReachability(candidate.position, context.deviceType);
    factors.push(reachability);
    
    // 4. 视觉层次（不要遮挡重要内容）
    const visualHierarchy = this.calculateVisualHierarchy(candidate.position, context.visibleElements);
    factors.push(visualHierarchy);
    
    return this.averageFactors(factors);
  }
  
  /**
   * 效率评分：最小化用户交互成本
   */
  private async scoreEfficiency(
    candidate: CandidatePosition,
    context: OptimizationContext
  ): Promise<number> {
    const factors = [];
    
    // 1. 与预期交互区域的距离
    const interactionDistance = this.calculateInteractionDistance(candidate.position, context.interactionZones);
    factors.push(this.normalizeInteractionDistance(interactionDistance));
    
    // 2. 操作路径优化（费茨定律）
    const fittsScore = this.calculateFittsLawScore(candidate.position, context.lastInteraction);
    factors.push(fittsScore);
    
    // 3. 减少视线移动
    const eyeMovement = this.calculateEyeMovement(candidate.position, context.attentionAreas);
    factors.push(eyeMovement);
    
    return this.averageFactors(factors);
  }
  
  /**
   * 学习用户偏好
   */
  async learnFromInteraction(
    componentId: string,
    position: { x: number, y: number },
    context: InteractionContext
  ): Promise<void> {
    // 1. 记录本次交互
    await this.recordInteraction(componentId, position, context);
    
    // 2. 更新热图
    this.heatmap.recordInteraction(position, context.interactionType);
    
    // 3. 更新用户偏好模型
    await this.preferenceLearner.update(componentId, position, context);
    
    // 4. 调整规则权重
    this.ruleEngine.adjustWeights(context.success);
    
    // 5. 定期重新训练模型
    if (this.shouldRetrain()) {
      await this.retrainModels();
    }
  }
  
  /**
   * 上下文感知优化
   */
  private async collectContext(component: UIComponent): Promise<OptimizationContext> {
    return {
      // 设备信息
      deviceType: this.detectDeviceType(),
      screen: this.screenAnalyzer.getScreenInfo(),
      
      // 用户状态
      userAttention: await this.detectUserAttention(),
      currentTask: await this.inferCurrentTask(),
      
      // 界面状态
      visibleElements: this.getVisibleElements(),
      focusElement: document.activeElement,
      interactionZones: this.heatmap.getHotZones(),
      attentionAreas: this.getAttentionAreas(),
      
      // 组件特定信息
      componentType: component.type,
      componentPriority: component.priority,
      componentFrequency: component.frequency,
      
      // 时间上下文
      timeOfDay: new Date().getHours(),
      interactionHistory: this.getInteractionHistory(component.id),
      
      // 环境因素
      isDistractedEnvironment: await this.detectDistractions()
    };
  }
  
  /**
   * 多屏适配
   */
  adaptToMultiScreen(position: RecommendedPosition, screens: ScreenInfo[]): MultiScreenPosition {
    if (screens.length <= 1) {
      return { primary: position };
    }
    
    // 根据屏幕使用模式选择最佳屏幕
    const bestScreen = this.selectBestScreen(screens);
    
    // 调整位置到选定屏幕
    const adjustedPosition = this.adjustToScreen(position, bestScreen);
    
    // 考虑跨屏连续性
    const secondaryPositions = this.calculateSecondaryPositions(adjustedPosition, screens);
    
    return {
      primary: adjustedPosition,
      secondary: secondaryPositions,
      screenId: bestScreen.id
    };
  }
}
```text

### 4.3 ResizeController（窗口大小调整控制器）

#### 4.3.1 设计理念

目标：提供自然、灵活的窗口大小调整体验，支持多种调整模式和约束。
核心思想：将调整操作抽象为向量变换，支持多点触控和手势识别。
特性：多种调整手柄、最小/最大限制、比例保持、智能吸附。

#### 4.3.2 完整架构设计

typescript

```plaintext
export class ResizeController {
  private resizeState: ResizeState = ResizeState.IDLE;
  private currentSession: ResizeSession | null = null;
  private config: ResizeConfig;
  private constraints: ResizeConstraints;
  private gestureDetector: GestureDetector;
  private animationController: AnimationController;
  
  // 调整手柄定义
  private handles: ResizeHandle[] = [
    { position: 'top-left', cursor: 'nw-resize', vector: { x: -1, y: -1 } },
    { position: 'top', cursor: 'n-resize', vector: { x: 0, y: -1 } },
    { position: 'top-right', cursor: 'ne-resize', vector: { x: 1, y: -1 } },
    { position: 'right', cursor: 'e-resize', vector: { x: 1, y: 0 } },
    { position: 'bottom-right', cursor: 'se-resize', vector: { x: 1, y: 1 } },
    { position: 'bottom', cursor: 's-resize', vector: { x: 0, y: 1 } },
    { position: 'bottom-left', cursor: 'sw-resize', vector: { x: -1, y: 1 } },
    { position: 'left', cursor: 'w-resize', vector: { x: -1, y: 0 } }
  ];
  
  constructor(config: Partial<ResizeConfig> = {}) {
    this.config = {
      minWidth: 100,
      minHeight: 100,
      maxWidth: 2000,
      maxHeight: 2000,
      keepAspectRatio: false,
      snapThreshold: 10,
      snapToGrid: false,
      gridSize: 10,
      enableInertia: true,
      ...config
    };
    
    this.constraints = new ResizeConstraints(this.config);
    this.gestureDetector = new GestureDetector();
    this.animationController = new AnimationController();
    
    this.initializeHandles();
  }
  
  /**
   * 开始调整大小
   */
  startResize(
    element: HTMLElement,
    handlePosition: HandlePosition,
    startEvent: MouseEvent | TouchEvent
  ): ResizeSession {
    if (this.currentSession) {
      this.endResize();
    }
    
    const session: ResizeSession = {
      id: generateSessionId(),
      element,
      handle: this.getHandle(handlePosition),
      startRect: element.getBoundingClientRect(),
      startPosition: this.getEventPosition(startEvent),
      currentRect: element.getBoundingClientRect(),
      state: ResizeState.RESIZING,
      constraints: this.constraints.getForElement(element),
      aspectRatio: this.config.keepAspectRatio ? 
        element.offsetWidth / element.offsetHeight : null
    };
    
    this.currentSession = session;
    this.resizeState = ResizeState.RESIZING;
    
    // 添加临时样式
    this.addResizingStyles(element);
    
    // 触发开始事件
    this.dispatchEvent('resizeStart', { session });
    
    return session;
  }
  
  /**
   * 更新调整大小
   */
  updateResize(currentEvent: MouseEvent | TouchEvent): void {
    if (!this.currentSession || this.resizeState !== ResizeState.RESIZING) {
      return;
    }
    
    const session = this.currentSession;
    const currentPosition = this.getEventPosition(currentEvent);
    
    // 计算鼠标移动距离
    const deltaX = currentPosition.x - session.startPosition.x;
    const deltaY = currentPosition.y - session.startPosition.y;
    
    // 根据手柄方向计算新尺寸
    const newRect = this.calculateNewRect(
      session.startRect,
      session.handle.vector,
      deltaX,
      deltaY,
      session.aspectRatio
    );
    
    // 应用约束
    const constrainedRect = this.constraints.apply(newRect, session.constraints);
    
    // 应用智能吸附
    const snappedRect = this.applySnapping(constrainedRect);
    
    // 更新会话状态
    session.currentRect = snappedRect;
    session.lastUpdate = new Date();
    
    // 更新元素尺寸
    this.updateElementSize(session.element, snappedRect);
    
    // 触发更新事件
    this.dispatchEvent('resizeUpdate', { session, rect: snappedRect });
  }
  
  /**
   * 结束调整大小
   */
  endResize(endEvent?: MouseEvent | TouchEvent): ResizeResult {
    if (!this.currentSession) {
      throw new Error('No active resize session');
    }
    
    const session = this.currentSession;
    
    // 如果有结束事件，最后一次更新
    if (endEvent) {
      this.updateResize(endEvent);
    }
    
    // 计算惯性（如果启用）
    if (this.config.enableInertia && endEvent) {
      this.applyInertia(session, endEvent);
    } else {
      this.finalizeResize(session);
    }
    
    const result: ResizeResult = {
      sessionId: session.id,
      finalRect: session.currentRect,
      startRect: session.startRect,
      duration: new Date().getTime() - session.startTime.getTime(),
      success: true
    };
    
    // 清理
    this.cleanupSession(session);
    this.currentSession = null;
    this.resizeState = ResizeState.IDLE;
    
    // 触发结束事件
    this.dispatchEvent('resizeEnd', { result });
    
    return result;
  }
  
  /**
   * 计算新矩形
   */
  private calculateNewRect(
    startRect: DOMRect,
    vector: { x: number, y: number },
    deltaX: number,
    deltaY: number,
    aspectRatio: number | null
  ): DOMRect {
    let newRect = { ...startRect };
    
    // 根据手柄方向调整
    if (vector.x === -1) {
      // 左侧调整
      newRect.x = startRect.x + deltaX;
      newRect.width = startRect.width - deltaX;
    } else if (vector.x === 1) {
      // 右侧调整
      newRect.width = startRect.width + deltaX;
    }
    
    if (vector.y === -1) {
      // 顶部调整
      newRect.y = startRect.y + deltaY;
      newRect.height = startRect.height - deltaY;
    } else if (vector.y === 1) {
      // 底部调整
      newRect.height = startRect.height + deltaY;
    }
    
    // 保持宽高比
    if (aspectRatio) {
      newRect = this.maintainAspectRatio(newRect, vector, aspectRatio);
    }
    
    return newRect;
  }
  
  /**
   * 保持宽高比
   */
  private maintainAspectRatio(
    rect: DOMRect,
    vector: { x: number, y: number },
    aspectRatio: number
  ): DOMRect {
    const newRect = { ...rect };
    
    // 根据调整方向决定保持哪条边
    if (vector.x !== 0 && vector.y !== 0) {
      // 角落调整：同时调整宽高
      if (Math.abs(newRect.width / newRect.height - aspectRatio) > 0.01) {
        // 以宽度为准调整高度
        newRect.height = newRect.width / aspectRatio;
        
        // 根据手柄方向调整位置
        if (vector.y === -1) {
          newRect.y = rect.y - (newRect.height - rect.height);
        }
      }
    } else if (vector.x !== 0) {
      // 水平调整：调整高度以保持比例
      newRect.height = newRect.width / aspectRatio;
    } else if (vector.y !== 0) {
      // 垂直调整：调整宽度以保持比例
      newRect.width = newRect.height * aspectRatio;
    }
    
    return newRect;
  }
  
  /**
   * 应用智能吸附
   */
  private applySnapping(rect: DOMRect): DOMRect {
    let snapped = { ...rect };
    
    if (this.config.snapToGrid) {
      snapped = this.snapToGrid(snapped);
    }
    
    // 吸附到其他元素
    snapped = this.snapToElements(snapped);
    
    // 吸附到屏幕边缘
    snapped = this.snapToScreenEdges(snapped);
    
    return snapped;
  }
  
  /**
   * 网格吸附
   */
  private snapToGrid(rect: DOMRect): DOMRect {
    return {
      x: Math.round(rect.x / this.config.gridSize) * this.config.gridSize,
      y: Math.round(rect.y / this.config.gridSize) * this.config.gridSize,
      width: Math.round(rect.width / this.config.gridSize) * this.config.gridSize,
      height: Math.round(rect.height / this.config.gridSize) * this.config.gridSize,
      top: 0, right: 0, bottom: 0, left: 0 // DOMRect需要这些属性
    } as DOMRect;
  }
  
  /**
   * 多点触控调整
   */
  handleMultiTouch(touches: TouchList): void {
    if (touches.length === 2) {
      // 双指缩放
      this.handlePinchZoom(touches);
    } else if (touches.length === 3) {
      // 三指旋转（如果支持）
      this.handleRotation(touches);
    }
  }
  
  /**
   * 双指缩放处理
   */
  private handlePinchZoom(touches: TouchList): void {
    if (!this.currentSession) return;
    
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    // 计算当前距离
    const currentDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
    
    if (this.currentSession.lastPinchDistance) {
      // 计算缩放比例
      const scale = currentDistance / this.currentSession.lastPinchDistance;
      
      // 计算中心点
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      // 应用缩放
      this.applyPinchZoom(scale, centerX, centerY);
    }
    
    // 更新距离
    this.currentSession.lastPinchDistance = currentDistance;
  }
  
  /**
   * 应用双指缩放
   */
  private applyPinchZoom(scale: number, centerX: number, centerY: number): void {
    if (!this.currentSession) return;
    
    const session = this.currentSession;
    const element = session.element;
    const rect = session.currentRect;
    
    // 计算相对于中心点的缩放
    const newWidth = rect.width * scale;
    const newHeight = rect.height * scale;
    
    // 计算位置调整（使中心点保持不变）
    const deltaWidth = newWidth - rect.width;
    const deltaHeight = newHeight - rect.height;
    
    const newRect: DOMRect = {
      ...rect,
      x: rect.x - (deltaWidth * (centerX - rect.x) / rect.width),
      y: rect.y - (deltaHeight * (centerY - rect.y) / rect.height),
      width: newWidth,
      height: newHeight
    } as DOMRect;
    
    // 应用约束
    const constrainedRect = this.constraints.apply(newRect, session.constraints);
    
    // 更新元素
    session.currentRect = constrainedRect;
    this.updateElementSize(element, constrainedRect);
    
    // 触发事件
    this.dispatchEvent('resizeUpdate', { session, rect: constrainedRect });
  }
  
  /**
   * 惯性调整
   */
  private applyInertia(session: ResizeSession, endEvent: MouseEvent | TouchEvent): void {
    // 计算结束速度
    const velocity = this.calculateEndVelocity(session, endEvent);
    
    if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1) {
      // 启动惯性动画
      this.animationController.startInertia(
        session.currentRect,
        velocity,
        (newRect) => {
          const constrainedRect = this.constraints.apply(newRect, session.constraints);
          this.updateElementSize(session.element, constrainedRect);
          this.dispatchEvent('resizeUpdate', { session, rect: constrainedRect });
        },
        () => {
          this.finalizeResize(session);
        }
      );
    } else {
      this.finalizeResize(session);
    }
  }
  
  /**
   * 添加调整模式
   */
  addResizeMode(mode: ResizeMode): void {
    // 实现自定义调整模式
    this.resizeModes.set(mode.name, mode);
  }
  
  /**
   * 设置调整约束
   */
  setConstraints(constraints: Partial<ResizeConstraints>): void {
    this.constraints.update(constraints);
  }
}
```text

### 4.4 ThemeManager（主题和样式管理系统）

#### 4.4.1 设计理念

目标：提供灵活、可扩展的主题系统，支持动态主题切换和个性化定制。
核心思想：CSS变量 + 设计令牌 + 主题继承，实现样式与逻辑分离。
特性：多主题支持、动态切换、样式隔离、设计系统集成。

#### 4.4.2 完整架构设计

typescript

```plaintext
export class ThemeManager {
  private currentTheme: Theme;
  private themes: Map<string, Theme> = new Map();
  private designTokens: DesignTokens;
  private styleInjector: StyleInjector;
  private themeObserver: MutationObserver;
  private preferenceManager: PreferenceManager;
  
  // 主题状态
  private state: ThemeState = {
    theme: 'light',
    mode: 'light',
    contrast: 'normal',
    saturation: 'normal',
    fontSize: 'medium',
    reducedMotion: false
  };
  
  constructor(config: ThemeManagerConfig) {
    this.designTokens = new DesignTokens(config.tokens);
    this.styleInjector = new StyleInjector();
    this.preferenceManager = new PreferenceManager();
    
    // 加载内置主题
    this.loadBuiltinThemes();
    
    // 监听系统主题变化
    this.setupSystemListeners();
    
    // 恢复用户偏好
    this.restoreUserPreferences();
  }
  
  /**
   * 注册新主题
   */
  registerTheme(name: string, theme: ThemeDefinition): void {
    const compiledTheme = this.compileTheme(theme);
    this.themes.set(name, compiledTheme);
    
    // 如果这是第一个主题，设置为当前主题
    if (this.themes.size === 1) {
      this.setTheme(name);
    }
  }
  
  /**
   * 设置当前主题
   */
  async setTheme(name: string, transition: boolean = true): Promise<void> {
    if (!this.themes.has(name)) {
      throw new Error(`Theme "${name}" not found`);
    }
    
    const oldTheme = this.currentTheme;
    const newTheme = this.themes.get(name)!;
    
    // 更新状态
    this.state.theme = name;
    this.state.mode = newTheme.mode;
    
    // 触发主题切换前事件
    await this.dispatchEvent('themeWillChange', { 
      oldTheme, 
      newTheme,
      transition 
    });
    
    // 应用主题切换
    if (transition && this.config.enableTransitions) {
      await this.applyThemeWithTransition(newTheme);
    } else {
      this.applyThemeImmediately(newTheme);
    }
    
    this.currentTheme = newTheme;
    
    // 保存偏好
    this.saveUserPreferences();
    
    // 触发主题切换后事件
    await this.dispatchEvent('themeChanged', { 
      oldTheme, 
      newTheme 
    });
  }
  
  /**
   * 动态更新主题变量
   */
  updateThemeVariable(
    category: TokenCategory,
    token: string,
    value: string
  ): void {
    if (!this.currentTheme) return;
    
    // 更新设计令牌
    this.designTokens.update(category, token, value);
    
    // 重新编译当前主题
    const updatedTheme = this.compileTheme({
      ...this.currentTheme.definition,
      [category]: {
        ...this.currentTheme.definition[category],
        [token]: value
      }
    });
    
    // 更新主题
    this.themes.set(this.state.theme, updatedTheme);
    
    // 重新应用主题
    this.applyThemeImmediately(updatedTheme);
    this.currentTheme = updatedTheme;
    
    // 触发变量更新事件
    this.dispatchEvent('themeVariableUpdated', {
      category,
      token,
      value,
      theme: this.state.theme
    });
  }
  
  /**
   * 编译主题
   */
  private compileTheme(definition: ThemeDefinition): Theme {
    const compiled: Theme = {
      name: definition.name,
      mode: definition.mode || 'light',
      definition,
      cssVariables: {},
      styles: {}
    };
    
    // 生成CSS变量
    compiled.cssVariables = this.generateCSSVariables(definition);
    
    // 生成CSS样式
    compiled.styles = this.generateStyles(compiled.cssVariables);
    
    return compiled;
  }
  
  /**
   * 生成CSS变量
   */
  private generateCSSVariables(definition: ThemeDefinition): Record<string, string> {
    const variables: Record<string, string> = {};
    
    // 遍历所有设计令牌类别
    Object.entries(definition).forEach(([category, tokens]) => {
      if (typeof tokens === 'object') {
        Object.entries(tokens).forEach(([token, value]) => {
          const variableName = `--theme-${category}-${token}`;
          variables[variableName] = this.resolveTokenValue(value);
        });
      }
    });
    
    // 添加模式变量
    variables['--theme-mode'] = definition.mode || 'light';
    variables['--theme-contrast'] = this.state.contrast;
    
    return variables;
  }
  
  /**
   * 应用主题（带过渡动画）
   */
  private async applyThemeWithTransition(theme: Theme): Promise<void> {
    return new Promise((resolve) => {
      // 添加过渡样式
      this.styleInjector.injectTransitionStyles();
      
      // 应用新主题变量
      this.applyCSSVariables(theme.cssVariables);
      
      // 等待过渡完成
      setTimeout(() => {
        this.styleInjector.removeTransitionStyles();
        resolve();
      }, this.config.transitionDuration);
    });
  }
  
  /**
   * 响应系统主题变化
   */
  private setupSystemListeners(): void {
    // 监听系统主题变化
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkModeQuery.addEventListener('change', (e) => {
        if (this.config.followSystem) {
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
    
    // 监听系统对比度设置
    const contrastQuery = window.matchMedia('(prefers-contrast: more)');
    contrastQuery.addEventListener('change', (e) => {
      this.state.contrast = e.matches ? 'high' : 'normal';
      this.updateContrast(this.state.contrast);
    });
    
    // 监听减少动画设置
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionQuery.addEventListener('change', (e) => {
      this.state.reducedMotion = e.matches;
      this.updateMotionPreferences(this.state.reducedMotion);
    });
  }
  
  /**
   * 主题派生系统
   */
  createDerivedTheme(
    baseThemeName: string,
    overrides: Partial<ThemeDefinition>,
    newThemeName: string
  ): Theme {
    const baseTheme = this.themes.get(baseThemeName);
    if (!baseTheme) {
      throw new Error(`Base theme "${baseThemeName}" not found`);
    }
    
    // 合并主题定义
    const derivedDefinition: ThemeDefinition = {
      ...baseTheme.definition,
      ...overrides,
      name: newThemeName,
      base: baseThemeName
    };
    
    // 编译派生主题
    const derivedTheme = this.compileTheme(derivedDefinition);
    
    // 注册新主题
    this.registerTheme(newThemeName, derivedDefinition);
    
    return derivedTheme;
  }
  
  /**
   * 样式隔离
   */
  createScopedTheme(scope: string, themeName: string): ScopedTheme {
    const theme = this.themes.get(themeName);
    if (!theme) {
      throw new Error(`Theme "${themeName}" not found`);
    }
    
    // 生成作用域CSS变量
    const scopedVariables = this.scopeCSSVariables(theme.cssVariables, scope);
    
    // 创建作用域样式
    const scopedStyles = this.generateScopedStyles(scopedVariables, scope);
    
    return {
      scope,
      theme: themeName,
      variables: scopedVariables,
      styles: scopedStyles,
      apply: () => this.applyScopedTheme(scope, scopedStyles),
      remove: () => this.removeScopedTheme(scope)
    };
  }
  
  /**
   * 主题导出和导入
   */
  exportTheme(name: string): ThemeExport {
    const theme = this.themes.get(name);
    if (!theme) {
      throw new Error(`Theme "${name}" not found`);
    }
    
    return {
      version: '1.0',
      name: theme.name,
      definition: theme.definition,
      tokens: this.designTokens.getForTheme(theme),
      metadata: {
        exportedAt: new Date(),
        exporter: 'ThemeManager',
        format: 'theme-json'
      }
    };
  }
  
  importTheme(exportData: ThemeExport): void {
    // 验证数据格式
    this.validateThemeExport(exportData);
    
    // 注册主题
    this.registerTheme(exportData.name, exportData.definition);
    
    // 导入设计令牌
    if (exportData.tokens) {
      this.designTokens.import(exportData.tokens);
    }
  }
  
  /**
   * 生成主题调色板
   */
  generateColorPalette(baseColor: string): ColorPalette {
    return {
      primary: this.generateColorVariants(baseColor),
      secondary: this.generateColorVariants(this.adjustHue(baseColor, 30)),
      accent: this.generateColorVariants(this.adjustHue(baseColor, 60)),
      neutral: this.generateNeutralPalette(),
      semantic: this.generateSemanticColors(baseColor)
    };
  }
  
  /**
   * 无障碍支持
   */
  ensureAccessibility(theme: Theme): AccessibilityReport {
    const tests = [
      this.testColorContrast(theme),
      this.testTextSizes(theme),
      this.testInteractiveElements(theme),
      this.testFocusIndicators(theme)
    ];
    
    const report: AccessibilityReport = {
      passed: tests.every(test => test.passed),
      tests,
      score: this.calculateAccessibilityScore(tests),
      recommendations: this.generateAccessibilityRecommendations(tests)
    };
    
    return report;
  }
}
```text

### 4.5 NotificationCenter（通知中心组件）

#### 4.5.1 设计理念

目标：提供统一、可配置、用户友好的通知系统，支持多种通知类型和交互。
核心思想：优先级队列 + 智能分组 + 用户偏好学习。
特性：多级别通知、智能排序、交互式通知、勿扰模式、通知历史。

#### 4.5.2 完整架构设计

typescript

```plaintext
export class NotificationCenter {
  private notifications: Map<string, Notification> = new Map();
  private queue: PriorityQueue<Notification>;
  private displayManager: DisplayManager;
  private historyManager: HistoryManager;
  private preferenceManager: PreferenceManager;
  private groupingEngine: GroupingEngine;
  
  // 状态
  private state: NotificationState = {
    isVisible: false,
    doNotDisturb: false,
    unreadCount: 0,
    settings: {
      maxVisible: 5,
      autoDismiss: true,
      dismissDuration: 5000,
      groupSimilar: true,
      playSounds: true
    }
  };
  
  constructor(config: NotificationConfig) {
    this.queue = new PriorityQueue<Notification>(
      this.compareNotifications.bind(this)
    );
    
    this.displayManager = new DisplayManager(config.display);
    this.historyManager = new HistoryManager(config.history);
    this.preferenceManager = new PreferenceManager(config.preferences);
    this.groupingEngine = new GroupingEngine(config.grouping);
    
    // 初始化UI
    this.initializeUI();
    
    // 加载历史通知
    this.loadNotificationHistory();
    
    // 设置自动清理
    this.setupAutoCleanup();
  }
  
  /**
   * 发送通知
   */
  async send(notification: NotificationInput): Promise<string> {
    // 1. 创建通知对象
    const notification = this.createNotification(notification);
    
    // 2. 检查勿扰模式
    if (this.shouldSuppressNotification(notification)) {
      await this.handleSuppressedNotification(notification);
      return notification.id;
    }
    
    // 3. 应用用户偏好
    const personalized = await this.personalizeNotification(notification);
    
    // 4. 添加到队列
    this.queue.enqueue(personalized);
    this.notifications.set(personalized.id, personalized);
    
    // 5. 更新未读计数
    this.updateUnreadCount();
    
    // 6. 触发发送事件
    await this.dispatchEvent('notificationSent', { notification: personalized });
    
    // 7. 尝试显示
    this.tryDisplayNotifications();
    
    return personalized.id;
  }
  
  /**
   * 智能通知排序
   */
  private compareNotifications(a: Notification, b: Notification): number {
    // 计算综合评分
    const scoreA = this.calculateNotificationScore(a);
    const scoreB = this.calculateNotificationScore(b);
    
    // 分数高的优先级高
    return scoreB - scoreA;
  }
  
  /**
   * 计算通知评分
   */
  private calculateNotificationScore(notification: Notification): number {
    const weights = {
      priority: 0.4,
      relevance: 0.3,
      timeliness: 0.2,
      userInterest: 0.1
    };
    
    const scores = {
      priority: this.getPriorityScore(notification.priority),
      relevance: await this.calculateRelevance(notification),
      timeliness: this.calculateTimeliness(notification),
      userInterest: await this.calculateUserInterest(notification)
    };
    
    // 加权平均
    return Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (scores[key as keyof typeof scores] * weight);
    }, 0);
  }
  
  /**
   * 显示通知
   */
  private async displayNotification(notification: Notification): Promise<void> {
    // 1. 检查是否已显示
    if (notification.state === 'displayed') return;
    
    // 2. 创建通知UI
    const notificationUI = this.createNotificationUI(notification);
    
    // 3. 添加到显示管理器
    this.displayManager.add(notificationUI);
    
    // 4. 更新通知状态
    notification.state = 'displayed';
    notification.displayedAt = new Date();
    
    // 5. 设置自动消失（如果启用）
    if (this.state.settings.autoDismiss && notification.dismissible) {
      this.setupAutoDismiss(notification);
    }
    
    // 6. 播放声音（如果启用）
    if (this.state.settings.playSounds && notification.sound) {
      this.playNotificationSound(notification);
    }
    
    // 7. 触发显示事件
    await this.dispatchEvent('notificationDisplayed', { notification });
  }
  
  /**
   * 通知分组
   */
  private groupNotifications(notifications: Notification[]): NotificationGroup[] {
    return this.groupingEngine.group(notifications);
  }
  
  /**
   * 交互式通知
   */
  private createInteractiveNotification(notification: Notification): InteractiveNotification {
    const baseUI = this.createNotificationUI(notification);
    
    // 添加操作按钮
    const actions = notification.actions?.map(action => ({
      ...action,
      handler: async () => {
        try {
          // 执行操作
          const result = await action.handler(notification);
          
          // 标记通知为已操作
          notification.state = 'acted';
          notification.actionResult = result;
          
          // 触发操作事件
          await this.dispatchEvent('notificationAction', {
            notification,
            action: action.label,
            result
          });
          
          // 关闭通知
          this.dismissNotification(notification.id);
          
          return result;
        } catch (error) {
          await this.dispatchEvent('notificationActionFailed', {
            notification,
            action: action.label,
            error
          });
          throw error;
        }
      }
    })) || [];
    
    // 添加快速回复（对于消息通知）
    let quickReply: QuickReply | undefined;
    if (notification.type === 'message') {
      quickReply = {
        placeholder: '快速回复...',
        onSubmit: async (text: string) => {
          await this.handleQuickReply(notification, text);
        }
      };
    }
    
    return {
      ...baseUI,
      actions,
      quickReply,
      interactive: true
    };
  }
  
  /**
   * 勿扰模式
   */
  enableDoNotDisturb(rules: DNDRule[]): void {
    this.state.doNotDisturb = true;
    this.state.dndRules = rules;
    
    // 隐藏所有当前通知
    this.displayManager.clearAll();
    
    // 触发勿扰模式事件
    this.dispatchEvent('doNotDisturbEnabled', { rules });
  }
  
  disableDoNotDisturb(): void {
    this.state.doNotDisturb = false;
    
    // 重新显示通知
    this.tryDisplayNotifications();
    
    // 触发事件
    this.dispatchEvent('doNotDisturbDisabled', {});
  }
  
  /**
   * 通知历史
   */
  getNotificationHistory(filter: HistoryFilter = {}): NotificationHistory {
    return this.historyManager.getHistory(filter);
  }
  
  clearHistory(options: ClearHistoryOptions = {}): void {
    const cleared = this.historyManager.clear(options);
    
    // 触发清理事件
    this.dispatchEvent('historyCleared', { 
      count: cleared.count,
      options 
    });
  }
  
  /**
   * 用户偏好学习
   */
  private async learnFromInteraction(interaction: NotificationInteraction): Promise<void> {
    // 更新用户偏好模型
    await this.preferenceManager.recordInteraction(interaction);
    
    // 调整通知排序权重
    this.adjustScoringWeights(interaction);
    
    // 如果用户经常忽略某类通知，降低其优先级
    if (interaction.type === 'dismiss' && interaction.duration < 1000) {
      await this.adjustNotificationPriority(interaction.notification, -0.1);
    }
    
    // 如果用户经常点击某类通知，提高其优先级
    if (interaction.type === 'click') {
      await this.adjustNotificationPriority(interaction.notification, 0.2);
    }
  }
  
  /**
   * 通知分析报告
   */
  generateAnalyticsReport(timeframe: Timeframe): AnalyticsReport {
    const history = this.getNotificationHistory({ timeframe });
    
    return {
      timeframe,
      totals: {
        sent: history.notifications.length,
        displayed: history.notifications.filter(n => n.displayedAt).length,
        clicked: history.notifications.filter(n => n.clickedAt).length,
        dismissed: history.notifications.filter(n => n.dismissedAt).length,
        acted: history.notifications.filter(n => n.actionResult).length
      },
      engagement: {
        displayRate: this.calculateRate(history.notifications, 'displayed'),
        clickThroughRate: this.calculateRate(history.notifications, 'clicked'),
        actionRate: this.calculateRate(history.notifications, 'acted'),
        averageDisplayTime: this.calculateAverageDisplayTime(history.notifications)
      },
      byType: this.aggregateByType(history.notifications),
      byPriority: this.aggregateByPriority(history.notifications),
      trends: this.calculateTrends(history.notifications),
      recommendations: this.generateRecommendations(history.notifications)
    };
  }
  
  /**
   * 跨设备同步
   */
  async syncAcrossDevices(deviceId: string): Promise<void> {
    // 获取当前状态
    const state = this.getSyncState();
    
    // 同步到服务器
    await this.syncService.sync(state, deviceId);
    
    // 从服务器获取其他设备的通知
    const remoteNotifications = await this.syncService.getRemoteNotifications();
    
    // 合并通知
    this.mergeRemoteNotifications(remoteNotifications);
    
    // 触发同步完成事件
    this.dispatchEvent('syncComplete', {
      deviceId,
      localCount: state.notifications.length,
      remoteCount: remoteNotifications.length
    });
  }
  
  /**
   * 通知模板系统
   */
  registerTemplate(name: string, template: NotificationTemplate): void {
    this.templateManager.register(name, template);
  }
  
  createNotificationFromTemplate(
    templateName: string,
    data: any
  ): Notification {
    const template = this.templateManager.get(templateName);
    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }
    
    return this.templateManager.render(template, data);
  }
}
```text

---
总结：
交互功能组件是用户与AI系统直接交互的桥梁，设计的好坏直接决定了用户体验的质量。记住以下几个核心原则：

1. 流畅性：交互必须流畅自然，60fps是最低要求
2. 反馈性：用户的每个操作都应该有即时、明确的反馈
3. 一致性：相似的交互应该有相似的行为
4. 可访问性：确保所有用户都能无障碍使用
5. 智能性：系统应该学习用户习惯，越用越好用
这些组件不仅仅是技术实现，更是对用户心理和行为的深入理解。在实现时，要始终站在用户的角度思考：

- 🤔 这个拖拽操作是否自然？
- 👀 这个通知是否吸引了不必要的注意？
- 🎨 这个主题切换是否平滑？
- 📱 在移动设备上是否同样好用？
- ♿ 残障人士能否正常使用？
现在，把这些组件集成到你的系统中，开始创造令人惊艳的用户体验吧！记住，好的交互设计是"隐形"的——用户感受不到它的存在，却能流畅自然地完成任务。
下一步任务：

1. ✅ 完成拖拽管理系统的实现和测试
2. ✅ 集成位置优化器的学习功能
3. ✅ 实现响应式窗口调整
4. ✅ 创建主题设计系统
5. ✅ 构建完整的通知中心

## 第四章：交互功能组件深度设计

### 4.1 DragManager（拖拽管理系统）

#### 4.1.1 设计理念

目标：提供流畅、自然、跨平台的拖拽体验，支持复杂拖拽场景和自定义行为。
核心思想：将拖拽抽象为状态机，通过事件驱动管理拖拽生命周期。
特性：支持多指触控、惯性拖拽、拖拽约束、拖拽手柄、拖拽预览等。

#### 4.1.2 完整架构设计

typescript

```plaintext
// ================================================
// 1. 拖拽状态机定义
// ================================================

export enum DragState {
  IDLE = 'idle',          // 空闲状态
  PREPARING = 'preparing', // 准备拖拽（如长按触发）
  DRAGGING = 'dragging',  // 拖拽中
  DROPPING = 'dropping',  // 正在放置
  CANCELLED = 'cancelled', // 拖拽取消
  COMPLETED = 'completed' // 拖拽完成
}

export interface DragSession {
  id: string;                     // 会话ID
  state: DragState;               // 当前状态
  source: DragSource;             // 拖拽源
  data: any;                      // 拖拽数据
  position: { x: number, y: number }; // 当前位置（相对视口）
  startPosition: { x: number, y: number }; // 开始位置
  startTime: Date;                // 开始时间
  lastUpdated: Date;              // 最后更新时间
  velocity: { x: number, y: number }; // 当前速度（用于惯性）
  constraints?: DragConstraints;  // 约束条件
  dropTarget?: DropTarget;        // 当前悬停的放置目标
}

// ================================================
// 2. 拖拽管理器核心
// ================================================

export class DragManager {
  private sessions: Map<string, DragSession> = new Map();
  private activeSessionId: string | null = null;
  private eventEmitter: EventEmitter = new EventEmitter();
  private config: DragManagerConfig;
  private inertiaSimulator: InertiaSimulator;
  private gestureRecognizer: GestureRecognizer;
  private dropTargetManager: DropTargetManager;
  
  // 拖拽约束函数类型
  private constraintFunctions: Map<string, ConstraintFunction> = new Map();
  
  constructor(config: Partial<DragManagerConfig> = {}) {
    this.config = {
      dragThreshold: 5,           // 拖拽阈值（像素）
      longPressDuration: 500,     // 长按触发拖拽的时长（ms）
      inertiaDeceleration: 0.95,  // 惯性减速度
      defaultConstraint: 'none',  // 默认约束
      ...config
    };
    
    this.inertiaSimulator = new InertiaSimulator(this.config);
    this.gestureRecognizer = new GestureRecognizer(this.config);
    this.dropTargetManager = new DropTargetManager();
    
    // 注册内置约束
    this.registerConstraint('none', this.noConstraint);
    this.registerConstraint('horizontal', this.horizontalConstraint);
    this.registerConstraint('vertical', this.verticalConstraint);
    this.registerConstraint('parentBoundary', this.parentBoundaryConstraint);
    this.registerConstraint('grid', this.gridConstraint);
    
    // 初始化事件监听
    this.setupEventListeners();
  }
  
  /**
   * 开始拖拽会话
   */
  startDrag(source: DragSource, data: any, options: DragOptions = {}): string {
    const sessionId = generateSessionId();
    
    const session: DragSession = {
      id: sessionId,
      state: DragState.PREPARING,
      source,
      data,
      position: source.getInitialPosition(),
      startPosition: source.getInitialPosition(),
      startTime: new Date(),
      lastUpdated: new Date(),
      velocity: { x: 0, y: 0 },
      constraints: options.constraints,
    };
    
    this.sessions.set(sessionId, session);
    this.activeSessionId = sessionId;
    
    // 触发开始事件
    this.eventEmitter.emit('dragStart', { session });
    
    // 根据触发方式处理
    if (options.trigger === 'immediate') {
      this.transitionToState(sessionId, DragState.DRAGGING);
    } else if (options.trigger === 'longPress') {
      // 启动长按计时器
      this.startLongPressTimer(sessionId);
    }
    
    return sessionId;
  }
  
  /**
   * 更新拖拽位置
   */
  updateDrag(sessionId: string, newPosition: { x: number, y: number }): void {
    const session = this.sessions.get(sessionId);
    if (!session || session.state !== DragState.DRAGGING) return;
    
    // 计算速度
    const now = new Date();
    const deltaTime = now.getTime() - session.lastUpdated.getTime();
    if (deltaTime > 0) {
      const deltaX = newPosition.x - session.position.x;
      const deltaY = newPosition.y - session.position.y;
      session.velocity = {
        x: deltaX / deltaTime,
        y: deltaY / deltaTime
      };
    }
    
    // 应用约束
    let constrainedPosition = newPosition;
    if (session.constraints) {
      constrainedPosition = this.applyConstraints(session, newPosition);
    }
    
    // 更新会话
    session.position = constrainedPosition;
    session.lastUpdated = now;
    
    // 检测放置目标
    const dropTarget = this.dropTargetManager.findDropTarget(constrainedPosition, session.data);
    if (dropTarget !== session.dropTarget) {
      // 放置目标改变
      if (session.dropTarget) {
        this.eventEmitter.emit('dragLeave', { session, dropTarget: session.dropTarget });
      }
      if (dropTarget) {
        this.eventEmitter.emit('dragEnter', { session, dropTarget });
      }
    }
    session.dropTarget = dropTarget;
    
    // 发出更新事件
    this.eventEmitter.emit('dragMove', { session });
    
    // 更新拖拽视觉反馈
    this.updateDragPreview(session);
  }
  
  /**
   * 结束拖拽
   */
  endDrag(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    // 如果是拖拽状态，尝试放置
    if (session.state === DragState.DRAGGING) {
      this.drop(sessionId);
    } else {
      this.cancelDrag(sessionId);
    }
  }
  
  /**
   * 放置操作
   */
  private async drop(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    this.transitionToState(sessionId, DragState.DROPPING);
    
    try {
      // 如果有放置目标，执行放置逻辑
      if (session.dropTarget) {
        const success = await session.dropTarget.onDrop(session.data, session.position);
        
        if (success) {
          this.transitionToState(sessionId, DragState.COMPLETED);
          this.eventEmitter.emit('dropSuccess', { session, dropTarget: session.dropTarget });
        } else {
          throw new Error('Drop rejected by target');
        }
      } else {
        // 没有放置目标，取消拖拽
        throw new Error('No drop target');
      }
    } catch (error) {
      this.cancelDrag(sessionId);
    }
  }
  
  /**
   * 取消拖拽
   */
  cancelDrag(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    this.transitionToState(sessionId, DragState.CANCELLED);
    
    // 触发取消事件
    this.eventEmitter.emit('dragCancel', { session });
    
    // 清理会话
    this.cleanupSession(sessionId);
  }
  
  /**
   * 状态转移
   */
  private transitionToState(sessionId: string, newState: DragState): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    const oldState = session.state;
    session.state = newState;
    
    // 触发状态变化事件
    this.eventEmitter.emit('stateChange', { session, oldState, newState });
    
    // 状态特定的处理
    switch (newState) {
      case DragState.DRAGGING:
        this.onStartDragging(session);
        break;
      case DragState.COMPLETED:
        this.onDragCompleted(session);
        break;
      case DragState.CANCELLED:
        this.onDragCancelled(session);
        break;
    }
  }
  
  /**
   * 应用约束
   */
  private applyConstraints(session: DragSession, position: { x: number, y: number }): { x: number, y: number } {
    let result = { ...position };
    
    // 应用每个约束
    if (session.constraints) {
      if (session.constraints.function) {
        const constraintFunc = this.constraintFunctions.get(session.constraints.function);
        if (constraintFunc) {
          result = constraintFunc(result, session);
        }
      }
      
      // 应用边界约束
      if (session.constraints.boundary) {
        result = this.applyBoundaryConstraint(result, session.constraints.boundary);
      }
      
      // 应用网格约束
      if (session.constraints.grid) {
        result = this.applyGridConstraint(result, session.constraints.grid);
      }
    }
    
    return result;
  }
  
  /**
   * 注册自定义约束函数
   */
  registerConstraint(name: string, constraintFunc: ConstraintFunction): void {
    this.constraintFunctions.set(name, constraintFunc);
  }
  
  /**
   * 内置约束函数
   */
  private noConstraint(position: { x: number, y: number }, session: DragSession): { x: number, y: number } {
    return position;
  }
  
  private horizontalConstraint(position: { x: number, y: number }, session: DragSession): { x: number, y: number } {
    return { x: position.x, y: session.startPosition.y };
  }
  
  private verticalConstraint(position: { x: number, y: number }, session: DragSession): { x: number, y: number } {
    return { x: session.startPosition.x, y: position.y };
  }
  
  private parentBoundaryConstraint(position: { x: number, y: number }, session: DragSession): { x: number, y: number } {
    const parentRect = session.source.getParentRect();
    const elementRect = session.source.getElementRect();
    
    return {
      x: Math.max(parentRect.left, Math.min(position.x, parentRect.right - elementRect.width)),
      y: Math.max(parentRect.top, Math.min(position.y, parentRect.bottom - elementRect.height))
    };
  }
  
  private gridConstraint(position: { x: number, y: number }, session: DragSession, gridSize: number = 10): { x: number, y: number } {
    return {
      x: Math.round(position.x / gridSize) * gridSize,
      y: Math.round(position.y / gridSize) * gridSize
    };
  }
  
  /**
   * 惯性拖拽
   */
  private startInertia(session: DragSession): void {
    if (this.config.enableInertia && (Math.abs(session.velocity.x) > 0.1 || Math.abs(session.velocity.y) > 0.1)) {
      this.inertiaSimulator.start(session, (position) => {
        this.updateDrag(session.id, position);
      });
    }
  }
  
  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    // 鼠标事件
    document.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // 触摸事件
    document.addEventListener('touchstart', this.handleTouchStart.bind(this));
    document.addEventListener('touchmove', this.handleTouchMove.bind(this));
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    
    // 键盘事件（用于取消拖拽）
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
  }
  
  // 事件处理函数
  private handleMouseDown(event: MouseEvent): void {
    // 找到拖拽源并开始拖拽
    const source = this.findDragSource(event.target as HTMLElement);
    if (source) {
      event.preventDefault();
      this.startDrag(source, source.getData(), { trigger: 'longPress' });
    }
  }
  
  // 其他事件处理函数...
}

// ================================================
// 3. 拖拽源接口
// ================================================

export interface DragSource {
  // 获取拖拽数据
  getData(): any;
  
  // 获取初始位置
  getInitialPosition(): { x: number, y: number };
  
  // 获取元素矩形
  getElementRect(): DOMRect;
  
  // 获取父元素矩形
  getParentRect(): DOMRect;
  
  // 拖拽开始时的回调
  onDragStart?(session: DragSession): void;
  
  // 拖拽结束时的回调
  onDragEnd?(session: DragSession): void;
  
  // 拖拽取消时的回调
  onDragCancel?(session: DragSession): void;
}

// ================================================
// 4. 放置目标接口
// ================================================

export interface DropTarget {
  // 判断点是否在目标内
  contains(point: { x: number, y: number }): boolean;
  
  // 放置数据
  onDrop(data: any, position: { x: number, y: number }): Promise<boolean>;
  
  // 拖拽进入时的回调
  onDragEnter?(session: DragSession): void;
  
  // 拖拽离开时的回调
  onDragLeave?(session: DragSession): void;
  
  // 拖拽在目标上移动时的回调
  onDragOver?(session: DragSession): void;
}
```text

### 4.2 PositionOptimizer（智能位置优化系统）

#### 4.2.1 设计理念

目标：基于用户行为、屏幕布局和上下文信息，智能推荐组件的最佳位置。
核心思想：机器学习 + 启发式规则，平衡可访问性、效率和美观。
特性：学习用户偏好、避让关键区域、多屏适配、上下文感知。

#### 4.2.2 完整架构设计

typescript

```plaintext
export class PositionOptimizer {
  private heatmap: Heatmap;
  private preferenceLearner: PreferenceLearner;
  private ruleEngine: RuleEngine;
  private screenAnalyzer: ScreenAnalyzer;
  private contextManager: ContextManager;
  
  // 位置记忆
  private positionMemory: Map<string, PositionMemory> = new Map();
  
  constructor(config: PositionOptimizerConfig) {
    this.heatmap = new Heatmap(config.heatmapResolution);
    this.preferenceLearner = new PreferenceLearner(config.learningRate);
    this.ruleEngine = new RuleEngine(config.rules);
    this.screenAnalyzer = new ScreenAnalyzer();
    this.contextManager = new ContextManager();
    
    // 加载历史数据
    this.loadHistoricalData();
  }
  
  /**
   * 为组件推荐最佳位置
   */
  async recommendPosition(
    component: UIComponent,
    constraints: PositionConstraints = {}
  ): Promise<RecommendedPosition> {
    // 1. 收集上下文信息
    const context = await this.collectContext(component);
    
    // 2. 获取候选位置
    const candidates = await this.generateCandidates(component, constraints, context);
    
    // 3. 评估每个候选位置
    const scoredCandidates = await this.scoreCandidates(candidates, context);
    
    // 4. 选择最佳位置
    const bestCandidate = this.selectBestCandidate(scoredCandidates);
    
    // 5. 记录决策
    await this.recordDecision(component, bestCandidate, context);
    
    return {
      ...bestCandidate.position,
      confidence: bestCandidate.score,
      reason: bestCandidate.reasons,
      alternatives: scoredCandidates.slice(1, 4).map(c => ({
        position: c.position,
        score: c.score
      }))
    };
  }
  
  /**
   * 生成候选位置
   */
  private async generateCandidates(
    component: UIComponent,
    constraints: PositionConstraints,
    context: OptimizationContext
  ): Promise<CandidatePosition[]> {
    const candidates: CandidatePosition[] = [];
    
    // 1. 用户偏好位置
    const preferred = await this.getPreferredPositions(component, context);
    candidates.push(...preferred);
    
    // 2. 基于规则的位置
    const ruleBased = this.ruleEngine.generatePositions(component, constraints, context);
    candidates.push(...ruleBased);
    
    // 3. 基于热点的位置
    const heatBased = this.generateHeatBasedPositions(component, context);
    candidates.push(...heatBased);
    
    // 4. 避让关键区域的位置
    const avoidBased = this.generateAvoidancePositions(component, context);
    candidates.push(...avoidBased);
    
    // 去重
    return this.deduplicateCandidates(candidates);
  }
  
  /**
   * 评估候选位置
   */
  private async scoreCandidates(
    candidates: CandidatePosition[],
    context: OptimizationContext
  ): Promise<ScoredCandidate[]> {
    const scored = await Promise.all(
      candidates.map(async candidate => {
        const scores = await this.calculateScores(candidate, context);
        const totalScore = this.combineScores(scores);
        
        return {
          position: candidate.position,
          scores,
          totalScore,
          reasons: this.generateReasons(scores)
        };
      })
    );
    
    // 按总分排序
    return scored.sort((a, b) => b.totalScore - a.totalScore);
  }
  
  /**
   * 计算多个维度的分数
   */
  private async calculateScores(
    candidate: CandidatePosition,
    context: OptimizationContext
  ): Promise<ScoreBreakdown> {
    const [
      accessibilityScore,
      efficiencyScore,
      aestheticsScore,
      stabilityScore,
      personalizationScore
    ] = await Promise.all([
      this.scoreAccessibility(candidate, context),
      this.scoreEfficiency(candidate, context),
      this.scoreAesthetics(candidate, context),
      this.scoreStability(candidate, context),
      this.scorePersonalization(candidate, context)
    ]);
    
    return {
      accessibility: accessibilityScore,
      efficiency: efficiencyScore,
      aesthetics: aestheticsScore,
      stability: stabilityScore,
      personalization: personalizationScore
    };
  }
  
  /**
   * 可访问性评分：确保组件易于访问
   */
  private async scoreAccessibility(
    candidate: CandidatePosition,
    context: OptimizationContext
  ): Promise<number> {
    const factors = [];
    
    // 1. 距离屏幕边缘的距离（太近不好访问）
    const edgeDistance = this.calculateEdgeDistance(candidate.position, context.screen);
    factors.push(this.normalizeEdgeDistance(edgeDistance));
    
    // 2. 与当前焦点的距离
    const focusDistance = this.calculateFocusDistance(candidate.position, context.focusElement);
    factors.push(this.normalizeFocusDistance(focusDistance));
    
    // 3. 手势可达性（特别是移动设备）
    const reachability = this.calculateReachability(candidate.position, context.deviceType);
    factors.push(reachability);
    
    // 4. 视觉层次（不要遮挡重要内容）
    const visualHierarchy = this.calculateVisualHierarchy(candidate.position, context.visibleElements);
    factors.push(visualHierarchy);
    
    return this.averageFactors(factors);
  }
  
  /**
   * 效率评分：最小化用户交互成本
   */
  private async scoreEfficiency(
    candidate: CandidatePosition,
    context: OptimizationContext
  ): Promise<number> {
    const factors = [];
    
    // 1. 与预期交互区域的距离
    const interactionDistance = this.calculateInteractionDistance(candidate.position, context.interactionZones);
    factors.push(this.normalizeInteractionDistance(interactionDistance));
    
    // 2. 操作路径优化（费茨定律）
    const fittsScore = this.calculateFittsLawScore(candidate.position, context.lastInteraction);
    factors.push(fittsScore);
    
    // 3. 减少视线移动
    const eyeMovement = this.calculateEyeMovement(candidate.position, context.attentionAreas);
    factors.push(eyeMovement);
    
    return this.averageFactors(factors);
  }
  
  /**
   * 学习用户偏好
   */
  async learnFromInteraction(
    componentId: string,
    position: { x: number, y: number },
    context: InteractionContext
  ): Promise<void> {
    // 1. 记录本次交互
    await this.recordInteraction(componentId, position, context);
    
    // 2. 更新热图
    this.heatmap.recordInteraction(position, context.interactionType);
    
    // 3. 更新用户偏好模型
    await this.preferenceLearner.update(componentId, position, context);
    
    // 4. 调整规则权重
    this.ruleEngine.adjustWeights(context.success);
    
    // 5. 定期重新训练模型
    if (this.shouldRetrain()) {
      await this.retrainModels();
    }
  }
  
  /**
   * 上下文感知优化
   */
  private async collectContext(component: UIComponent): Promise<OptimizationContext> {
    return {
      // 设备信息
      deviceType: this.detectDeviceType(),
      screen: this.screenAnalyzer.getScreenInfo(),
      
      // 用户状态
      userAttention: await this.detectUserAttention(),
      currentTask: await this.inferCurrentTask(),
      
      // 界面状态
      visibleElements: this.getVisibleElements(),
      focusElement: document.activeElement,
      interactionZones: this.heatmap.getHotZones(),
      attentionAreas: this.getAttentionAreas(),
      
      // 组件特定信息
      componentType: component.type,
      componentPriority: component.priority,
      componentFrequency: component.frequency,
      
      // 时间上下文
      timeOfDay: new Date().getHours(),
      interactionHistory: this.getInteractionHistory(component.id),
      
      // 环境因素
      isDistractedEnvironment: await this.detectDistractions()
    };
  }
  
  /**
   * 多屏适配
   */
  adaptToMultiScreen(position: RecommendedPosition, screens: ScreenInfo[]): MultiScreenPosition {
    if (screens.length <= 1) {
      return { primary: position };
    }
    
    // 根据屏幕使用模式选择最佳屏幕
    const bestScreen = this.selectBestScreen(screens);
    
    // 调整位置到选定屏幕
    const adjustedPosition = this.adjustToScreen(position, bestScreen);
    
    // 考虑跨屏连续性
    const secondaryPositions = this.calculateSecondaryPositions(adjustedPosition, screens);
    
    return {
      primary: adjustedPosition,
      secondary: secondaryPositions,
      screenId: bestScreen.id
    };
  }
}
```text

### 4.3 ResizeController（窗口大小调整控制器）

#### 4.3.1 设计理念

目标：提供自然、灵活的窗口大小调整体验，支持多种调整模式和约束。
核心思想：将调整操作抽象为向量变换，支持多点触控和手势识别。
特性：多种调整手柄、最小/最大限制、比例保持、智能吸附。

#### 4.3.2 完整架构设计

typescript

```plaintext
export class ResizeController {
  private resizeState: ResizeState = ResizeState.IDLE;
  private currentSession: ResizeSession | null = null;
  private config: ResizeConfig;
  private constraints: ResizeConstraints;
  private gestureDetector: GestureDetector;
  private animationController: AnimationController;
  
  // 调整手柄定义
  private handles: ResizeHandle[] = [
    { position: 'top-left', cursor: 'nw-resize', vector: { x: -1, y: -1 } },
    { position: 'top', cursor: 'n-resize', vector: { x: 0, y: -1 } },
    { position: 'top-right', cursor: 'ne-resize', vector: { x: 1, y: -1 } },
    { position: 'right', cursor: 'e-resize', vector: { x: 1, y: 0 } },
    { position: 'bottom-right', cursor: 'se-resize', vector: { x: 1, y: 1 } },
    { position: 'bottom', cursor: 's-resize', vector: { x: 0, y: 1 } },
    { position: 'bottom-left', cursor: 'sw-resize', vector: { x: -1, y: 1 } },
    { position: 'left', cursor: 'w-resize', vector: { x: -1, y: 0 } }
  ];
  
  constructor(config: Partial<ResizeConfig> = {}) {
    this.config = {
      minWidth: 100,
      minHeight: 100,
      maxWidth: 2000,
      maxHeight: 2000,
      keepAspectRatio: false,
      snapThreshold: 10,
      snapToGrid: false,
      gridSize: 10,
      enableInertia: true,
      ...config
    };
    
    this.constraints = new ResizeConstraints(this.config);
    this.gestureDetector = new GestureDetector();
    this.animationController = new AnimationController();
    
    this.initializeHandles();
  }
  
  /**
   * 开始调整大小
   */
  startResize(
    element: HTMLElement,
    handlePosition: HandlePosition,
    startEvent: MouseEvent | TouchEvent
  ): ResizeSession {
    if (this.currentSession) {
      this.endResize();
    }
    
    const session: ResizeSession = {
      id: generateSessionId(),
      element,
      handle: this.getHandle(handlePosition),
      startRect: element.getBoundingClientRect(),
      startPosition: this.getEventPosition(startEvent),
      currentRect: element.getBoundingClientRect(),
      state: ResizeState.RESIZING,
      constraints: this.constraints.getForElement(element),
      aspectRatio: this.config.keepAspectRatio ? 
        element.offsetWidth / element.offsetHeight : null
    };
    
    this.currentSession = session;
    this.resizeState = ResizeState.RESIZING;
    
    // 添加临时样式
    this.addResizingStyles(element);
    
    // 触发开始事件
    this.dispatchEvent('resizeStart', { session });
    
    return session;
  }
  
  /**
   * 更新调整大小
   */
  updateResize(currentEvent: MouseEvent | TouchEvent): void {
    if (!this.currentSession || this.resizeState !== ResizeState.RESIZING) {
      return;
    }
    
    const session = this.currentSession;
    const currentPosition = this.getEventPosition(currentEvent);
    
    // 计算鼠标移动距离
    const deltaX = currentPosition.x - session.startPosition.x;
    const deltaY = currentPosition.y - session.startPosition.y;
    
    // 根据手柄方向计算新尺寸
    const newRect = this.calculateNewRect(
      session.startRect,
      session.handle.vector,
      deltaX,
      deltaY,
      session.aspectRatio
    );
    
    // 应用约束
    const constrainedRect = this.constraints.apply(newRect, session.constraints);
    
    // 应用智能吸附
    const snappedRect = this.applySnapping(constrainedRect);
    
    // 更新会话状态
    session.currentRect = snappedRect;
    session.lastUpdate = new Date();
    
    // 更新元素尺寸
    this.updateElementSize(session.element, snappedRect);
    
    // 触发更新事件
    this.dispatchEvent('resizeUpdate', { session, rect: snappedRect });
  }
  
  /**
   * 结束调整大小
   */
  endResize(endEvent?: MouseEvent | TouchEvent): ResizeResult {
    if (!this.currentSession) {
      throw new Error('No active resize session');
    }
    
    const session = this.currentSession;
    
    // 如果有结束事件，最后一次更新
    if (endEvent) {
      this.updateResize(endEvent);
    }
    
    // 计算惯性（如果启用）
    if (this.config.enableInertia && endEvent) {
      this.applyInertia(session, endEvent);
    } else {
      this.finalizeResize(session);
    }
    
    const result: ResizeResult = {
      sessionId: session.id,
      finalRect: session.currentRect,
      startRect: session.startRect,
      duration: new Date().getTime() - session.startTime.getTime(),
      success: true
    };
    
    // 清理
    this.cleanupSession(session);
    this.currentSession = null;
    this.resizeState = ResizeState.IDLE;
    
    // 触发结束事件
    this.dispatchEvent('resizeEnd', { result });
    
    return result;
  }
  
  /**
   * 计算新矩形
   */
  private calculateNewRect(
    startRect: DOMRect,
    vector: { x: number, y: number },
    deltaX: number,
    deltaY: number,
    aspectRatio: number | null
  ): DOMRect {
    let newRect = { ...startRect };
    
    // 根据手柄方向调整
    if (vector.x === -1) {
      // 左侧调整
      newRect.x = startRect.x + deltaX;
      newRect.width = startRect.width - deltaX;
    } else if (vector.x === 1) {
      // 右侧调整
      newRect.width = startRect.width + deltaX;
    }
    
    if (vector.y === -1) {
      // 顶部调整
      newRect.y = startRect.y + deltaY;
      newRect.height = startRect.height - deltaY;
    } else if (vector.y === 1) {
      // 底部调整
      newRect.height = startRect.height + deltaY;
    }
    
    // 保持宽高比
    if (aspectRatio) {
      newRect = this.maintainAspectRatio(newRect, vector, aspectRatio);
    }
    
    return newRect;
  }
  
  /**
   * 保持宽高比
   */
  private maintainAspectRatio(
    rect: DOMRect,
    vector: { x: number, y: number },
    aspectRatio: number
  ): DOMRect {
    const newRect = { ...rect };
    
    // 根据调整方向决定保持哪条边
    if (vector.x !== 0 && vector.y !== 0) {
      // 角落调整：同时调整宽高
      if (Math.abs(newRect.width / newRect.height - aspectRatio) > 0.01) {
        // 以宽度为准调整高度
        newRect.height = newRect.width / aspectRatio;
        
        // 根据手柄方向调整位置
        if (vector.y === -1) {
          newRect.y = rect.y - (newRect.height - rect.height);
        }
      }
    } else if (vector.x !== 0) {
      // 水平调整：调整高度以保持比例
      newRect.height = newRect.width / aspectRatio;
    } else if (vector.y !== 0) {
      // 垂直调整：调整宽度以保持比例
      newRect.width = newRect.height * aspectRatio;
    }
    
    return newRect;
  }
  
  /**
   * 应用智能吸附
   */
  private applySnapping(rect: DOMRect): DOMRect {
    let snapped = { ...rect };
    
    if (this.config.snapToGrid) {
      snapped = this.snapToGrid(snapped);
    }
    
    // 吸附到其他元素
    snapped = this.snapToElements(snapped);
    
    // 吸附到屏幕边缘
    snapped = this.snapToScreenEdges(snapped);
    
    return snapped;
  }
  
  /**
   * 网格吸附
   */
  private snapToGrid(rect: DOMRect): DOMRect {
    return {
      x: Math.round(rect.x / this.config.gridSize) * this.config.gridSize,
      y: Math.round(rect.y / this.config.gridSize) * this.config.gridSize,
      width: Math.round(rect.width / this.config.gridSize) * this.config.gridSize,
      height: Math.round(rect.height / this.config.gridSize) * this.config.gridSize,
      top: 0, right: 0, bottom: 0, left: 0 // DOMRect需要这些属性
    } as DOMRect;
  }
  
  /**
   * 多点触控调整
   */
  handleMultiTouch(touches: TouchList): void {
    if (touches.length === 2) {
      // 双指缩放
      this.handlePinchZoom(touches);
    } else if (touches.length === 3) {
      // 三指旋转（如果支持）
      this.handleRotation(touches);
    }
  }
  
  /**
   * 双指缩放处理
   */
  private handlePinchZoom(touches: TouchList): void {
    if (!this.currentSession) return;
    
    const touch1 = touches[0];
    const touch2 = touches[1];
    
    // 计算当前距离
    const currentDistance = Math.hypot(
      touch2.clientX - touch1.clientX,
      touch2.clientY - touch1.clientY
    );
    
    if (this.currentSession.lastPinchDistance) {
      // 计算缩放比例
      const scale = currentDistance / this.currentSession.lastPinchDistance;
      
      // 计算中心点
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      // 应用缩放
      this.applyPinchZoom(scale, centerX, centerY);
    }
    
    // 更新距离
    this.currentSession.lastPinchDistance = currentDistance;
  }
  
  /**
   * 应用双指缩放
   */
  private applyPinchZoom(scale: number, centerX: number, centerY: number): void {
    if (!this.currentSession) return;
    
    const session = this.currentSession;
    const element = session.element;
    const rect = session.currentRect;
    
    // 计算相对于中心点的缩放
    const newWidth = rect.width * scale;
    const newHeight = rect.height * scale;
    
    // 计算位置调整（使中心点保持不变）
    const deltaWidth = newWidth - rect.width;
    const deltaHeight = newHeight - rect.height;
    
    const newRect: DOMRect = {
      ...rect,
      x: rect.x - (deltaWidth * (centerX - rect.x) / rect.width),
      y: rect.y - (deltaHeight * (centerY - rect.y) / rect.height),
      width: newWidth,
      height: newHeight
    } as DOMRect;
    
    // 应用约束
    const constrainedRect = this.constraints.apply(newRect, session.constraints);
    
    // 更新元素
    session.currentRect = constrainedRect;
    this.updateElementSize(element, constrainedRect);
    
    // 触发事件
    this.dispatchEvent('resizeUpdate', { session, rect: constrainedRect });
  }
  
  /**
   * 惯性调整
   */
  private applyInertia(session: ResizeSession, endEvent: MouseEvent | TouchEvent): void {
    // 计算结束速度
    const velocity = this.calculateEndVelocity(session, endEvent);
    
    if (Math.abs(velocity.x) > 0.1 || Math.abs(velocity.y) > 0.1) {
      // 启动惯性动画
      this.animationController.startInertia(
        session.currentRect,
        velocity,
        (newRect) => {
          const constrainedRect = this.constraints.apply(newRect, session.constraints);
          this.updateElementSize(session.element, constrainedRect);
          this.dispatchEvent('resizeUpdate', { session, rect: constrainedRect });
        },
        () => {
          this.finalizeResize(session);
        }
      );
    } else {
      this.finalizeResize(session);
    }
  }
  
  /**
   * 添加调整模式
   */
  addResizeMode(mode: ResizeMode): void {
    // 实现自定义调整模式
    this.resizeModes.set(mode.name, mode);
  }
  
  /**
   * 设置调整约束
   */
  setConstraints(constraints: Partial<ResizeConstraints>): void {
    this.constraints.update(constraints);
  }
}
```text

### 4.4 ThemeManager（主题和样式管理系统）

#### 4.4.1 设计理念

目标：提供灵活、可扩展的主题系统，支持动态主题切换和个性化定制。
核心思想：CSS变量 + 设计令牌 + 主题继承，实现样式与逻辑分离。
特性：多主题支持、动态切换、样式隔离、设计系统集成。

#### 4.4.2 完整架构设计

typescript

```plaintext
export class ThemeManager {
  private currentTheme: Theme;
  private themes: Map<string, Theme> = new Map();
  private designTokens: DesignTokens;
  private styleInjector: StyleInjector;
  private themeObserver: MutationObserver;
  private preferenceManager: PreferenceManager;
  
  // 主题状态
  private state: ThemeState = {
    theme: 'light',
    mode: 'light',
    contrast: 'normal',
    saturation: 'normal',
    fontSize: 'medium',
    reducedMotion: false
  };
  
  constructor(config: ThemeManagerConfig) {
    this.designTokens = new DesignTokens(config.tokens);
    this.styleInjector = new StyleInjector();
    this.preferenceManager = new PreferenceManager();
    
    // 加载内置主题
    this.loadBuiltinThemes();
    
    // 监听系统主题变化
    this.setupSystemListeners();
    
    // 恢复用户偏好
    this.restoreUserPreferences();
  }
  
  /**
   * 注册新主题
   */
  registerTheme(name: string, theme: ThemeDefinition): void {
    const compiledTheme = this.compileTheme(theme);
    this.themes.set(name, compiledTheme);
    
    // 如果这是第一个主题，设置为当前主题
    if (this.themes.size === 1) {
      this.setTheme(name);
    }
  }
  
  /**
   * 设置当前主题
   */
  async setTheme(name: string, transition: boolean = true): Promise<void> {
    if (!this.themes.has(name)) {
      throw new Error(`Theme "${name}" not found`);
    }
    
    const oldTheme = this.currentTheme;
    const newTheme = this.themes.get(name)!;
    
    // 更新状态
    this.state.theme = name;
    this.state.mode = newTheme.mode;
    
    // 触发主题切换前事件
    await this.dispatchEvent('themeWillChange', { 
      oldTheme, 
      newTheme,
      transition 
    });
    
    // 应用主题切换
    if (transition && this.config.enableTransitions) {
      await this.applyThemeWithTransition(newTheme);
    } else {
      this.applyThemeImmediately(newTheme);
    }
    
    this.currentTheme = newTheme;
    
    // 保存偏好
    this.saveUserPreferences();
    
    // 触发主题切换后事件
    await this.dispatchEvent('themeChanged', { 
      oldTheme, 
      newTheme 
    });
  }
  
  /**
   * 动态更新主题变量
   */
  updateThemeVariable(
    category: TokenCategory,
    token: string,
    value: string
  ): void {
    if (!this.currentTheme) return;
    
    // 更新设计令牌
    this.designTokens.update(category, token, value);
    
    // 重新编译当前主题
    const updatedTheme = this.compileTheme({
      ...this.currentTheme.definition,
      [category]: {
        ...this.currentTheme.definition[category],
        [token]: value
      }
    });
    
    // 更新主题
    this.themes.set(this.state.theme, updatedTheme);
    
    // 重新应用主题
    this.applyThemeImmediately(updatedTheme);
    this.currentTheme = updatedTheme;
    
    // 触发变量更新事件
    this.dispatchEvent('themeVariableUpdated', {
      category,
      token,
      value,
      theme: this.state.theme
    });
  }
  
  /**
   * 编译主题
   */
  private compileTheme(definition: ThemeDefinition): Theme {
    const compiled: Theme = {
      name: definition.name,
      mode: definition.mode || 'light',
      definition,
      cssVariables: {},
      styles: {}
    };
    
    // 生成CSS变量
    compiled.cssVariables = this.generateCSSVariables(definition);
    
    // 生成CSS样式
    compiled.styles = this.generateStyles(compiled.cssVariables);
    
    return compiled;
  }
  
  /**
   * 生成CSS变量
   */
  private generateCSSVariables(definition: ThemeDefinition): Record<string, string> {
    const variables: Record<string, string> = {};
    
    // 遍历所有设计令牌类别
    Object.entries(definition).forEach(([category, tokens]) => {
      if (typeof tokens === 'object') {
        Object.entries(tokens).forEach(([token, value]) => {
          const variableName = `--theme-${category}-${token}`;
          variables[variableName] = this.resolveTokenValue(value);
        });
      }
    });
    
    // 添加模式变量
    variables['--theme-mode'] = definition.mode || 'light';
    variables['--theme-contrast'] = this.state.contrast;
    
    return variables;
  }
  
  /**
   * 应用主题（带过渡动画）
   */
  private async applyThemeWithTransition(theme: Theme): Promise<void> {
    return new Promise((resolve) => {
      // 添加过渡样式
      this.styleInjector.injectTransitionStyles();
      
      // 应用新主题变量
      this.applyCSSVariables(theme.cssVariables);
      
      // 等待过渡完成
      setTimeout(() => {
        this.styleInjector.removeTransitionStyles();
        resolve();
      }, this.config.transitionDuration);
    });
  }
  
  /**
   * 响应系统主题变化
   */
  private setupSystemListeners(): void {
    // 监听系统主题变化
    if (window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      darkModeQuery.addEventListener('change', (e) => {
        if (this.config.followSystem) {
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
    
    // 监听系统对比度设置
    const contrastQuery = window.matchMedia('(prefers-contrast: more)');
    contrastQuery.addEventListener('change', (e) => {
      this.state.contrast = e.matches ? 'high' : 'normal';
      this.updateContrast(this.state.contrast);
    });
    
    // 监听减少动画设置
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotionQuery.addEventListener('change', (e) => {
      this.state.reducedMotion = e.matches;
      this.updateMotionPreferences(this.state.reducedMotion);
    });
  }
  
  /**
   * 主题派生系统
   */
  createDerivedTheme(
    baseThemeName: string,
    overrides: Partial<ThemeDefinition>,
    newThemeName: string
  ): Theme {
    const baseTheme = this.themes.get(baseThemeName);
    if (!baseTheme) {
      throw new Error(`Base theme "${baseThemeName}" not found`);
    }
    
    // 合并主题定义
    const derivedDefinition: ThemeDefinition = {
      ...baseTheme.definition,
      ...overrides,
      name: newThemeName,
      base: baseThemeName
    };
    
    // 编译派生主题
    const derivedTheme = this.compileTheme(derivedDefinition);
    
    // 注册新主题
    this.registerTheme(newThemeName, derivedDefinition);
    
    return derivedTheme;
  }
  
  /**
   * 样式隔离
   */
  createScopedTheme(scope: string, themeName: string): ScopedTheme {
    const theme = this.themes.get(themeName);
    if (!theme) {
      throw new Error(`Theme "${themeName}" not found`);
    }
    
    // 生成作用域CSS变量
    const scopedVariables = this.scopeCSSVariables(theme.cssVariables, scope);
    
    // 创建作用域样式
    const scopedStyles = this.generateScopedStyles(scopedVariables, scope);
    
    return {
      scope,
      theme: themeName,
      variables: scopedVariables,
      styles: scopedStyles,
      apply: () => this.applyScopedTheme(scope, scopedStyles),
      remove: () => this.removeScopedTheme(scope)
    };
  }
  
  /**
   * 主题导出和导入
   */
  exportTheme(name: string): ThemeExport {
    const theme = this.themes.get(name);
    if (!theme) {
      throw new Error(`Theme "${name}" not found`);
    }
    
    return {
      version: '1.0',
      name: theme.name,
      definition: theme.definition,
      tokens: this.designTokens.getForTheme(theme),
      metadata: {
        exportedAt: new Date(),
        exporter: 'ThemeManager',
        format: 'theme-json'
      }
    };
  }
  
  importTheme(exportData: ThemeExport): void {
    // 验证数据格式
    this.validateThemeExport(exportData);
    
    // 注册主题
    this.registerTheme(exportData.name, exportData.definition);
    
    // 导入设计令牌
    if (exportData.tokens) {
      this.designTokens.import(exportData.tokens);
    }
  }
  
  /**
   * 生成主题调色板
   */
  generateColorPalette(baseColor: string): ColorPalette {
    return {
      primary: this.generateColorVariants(baseColor),
      secondary: this.generateColorVariants(this.adjustHue(baseColor, 30)),
      accent: this.generateColorVariants(this.adjustHue(baseColor, 60)),
      neutral: this.generateNeutralPalette(),
      semantic: this.generateSemanticColors(baseColor)
    };
  }
  
  /**
   * 无障碍支持
   */
  ensureAccessibility(theme: Theme): AccessibilityReport {
    const tests = [
      this.testColorContrast(theme),
      this.testTextSizes(theme),
      this.testInteractiveElements(theme),
      this.testFocusIndicators(theme)
    ];
    
    const report: AccessibilityReport = {
      passed: tests.every(test => test.passed),
      tests,
      score: this.calculateAccessibilityScore(tests),
      recommendations: this.generateAccessibilityRecommendations(tests)
    };
    
    return report;
  }
}
```text

### 4.5 NotificationCenter（通知中心组件）

#### 4.5.1 设计理念

目标：提供统一、可配置、用户友好的通知系统，支持多种通知类型和交互。
核心思想：优先级队列 + 智能分组 + 用户偏好学习。
特性：多级别通知、智能排序、交互式通知、勿扰模式、通知历史。

#### 4.5.2 完整架构设计

typescript

```plaintext
export class NotificationCenter {
  private notifications: Map<string, Notification> = new Map();
  private queue: PriorityQueue<Notification>;
  private displayManager: DisplayManager;
  private historyManager: HistoryManager;
  private preferenceManager: PreferenceManager;
  private groupingEngine: GroupingEngine;
  
  // 状态
  private state: NotificationState = {
    isVisible: false,
    doNotDisturb: false,
    unreadCount: 0,
    settings: {
      maxVisible: 5,
      autoDismiss: true,
      dismissDuration: 5000,
      groupSimilar: true,
      playSounds: true
    }
  };
  
  constructor(config: NotificationConfig) {
    this.queue = new PriorityQueue<Notification>(
      this.compareNotifications.bind(this)
    );
    
    this.displayManager = new DisplayManager(config.display);
    this.historyManager = new HistoryManager(config.history);
    this.preferenceManager = new PreferenceManager(config.preferences);
    this.groupingEngine = new GroupingEngine(config.grouping);
    
    // 初始化UI
    this.initializeUI();
    
    // 加载历史通知
    this.loadNotificationHistory();
    
    // 设置自动清理
    this.setupAutoCleanup();
  }
  
  /**
   * 发送通知
   */
  async send(notification: NotificationInput): Promise<string> {
    // 1. 创建通知对象
    const notification = this.createNotification(notification);
    
    // 2. 检查勿扰模式
    if (this.shouldSuppressNotification(notification)) {
      await this.handleSuppressedNotification(notification);
      return notification.id;
    }
    
    // 3. 应用用户偏好
    const personalized = await this.personalizeNotification(notification);
    
    // 4. 添加到队列
    this.queue.enqueue(personalized);
    this.notifications.set(personalized.id, personalized);
    
    // 5. 更新未读计数
    this.updateUnreadCount();
    
    // 6. 触发发送事件
    await this.dispatchEvent('notificationSent', { notification: personalized });
    
    // 7. 尝试显示
    this.tryDisplayNotifications();
    
    return personalized.id;
  }
  
  /**
   * 智能通知排序
   */
  private compareNotifications(a: Notification, b: Notification): number {
    // 计算综合评分
    const scoreA = this.calculateNotificationScore(a);
    const scoreB = this.calculateNotificationScore(b);
    
    // 分数高的优先级高
    return scoreB - scoreA;
  }
  
  /**
   * 计算通知评分
   */
  private calculateNotificationScore(notification: Notification): number {
    const weights = {
      priority: 0.4,
      relevance: 0.3,
      timeliness: 0.2,
      userInterest: 0.1
    };
    
    const scores = {
      priority: this.getPriorityScore(notification.priority),
      relevance: await this.calculateRelevance(notification),
      timeliness: this.calculateTimeliness(notification),
      userInterest: await this.calculateUserInterest(notification)
    };
    
    // 加权平均
    return Object.entries(weights).reduce((total, [key, weight]) => {
      return total + (scores[key as keyof typeof scores] * weight);
    }, 0);
  }
  
  /**
   * 显示通知
   */
  private async displayNotification(notification: Notification): Promise<void> {
    // 1. 检查是否已显示
    if (notification.state === 'displayed') return;
    
    // 2. 创建通知UI
    const notificationUI = this.createNotificationUI(notification);
    
    // 3. 添加到显示管理器
    this.displayManager.add(notificationUI);
    
    // 4. 更新通知状态
    notification.state = 'displayed';
    notification.displayedAt = new Date();
    
    // 5. 设置自动消失（如果启用）
    if (this.state.settings.autoDismiss && notification.dismissible) {
      this.setupAutoDismiss(notification);
    }
    
    // 6. 播放声音（如果启用）
    if (this.state.settings.playSounds && notification.sound) {
      this.playNotificationSound(notification);
    }
    
    // 7. 触发显示事件
    await this.dispatchEvent('notificationDisplayed', { notification });
  }
  
  /**
   * 通知分组
   */
  private groupNotifications(notifications: Notification[]): NotificationGroup[] {
    return this.groupingEngine.group(notifications);
  }
  
  /**
   * 交互式通知
   */
  private createInteractiveNotification(notification: Notification): InteractiveNotification {
    const baseUI = this.createNotificationUI(notification);
    
    // 添加操作按钮
    const actions = notification.actions?.map(action => ({
      ...action,
      handler: async () => {
        try {
          // 执行操作
          const result = await action.handler(notification);
          
          // 标记通知为已操作
          notification.state = 'acted';
          notification.actionResult = result;
          
          // 触发操作事件
          await this.dispatchEvent('notificationAction', {
            notification,
            action: action.label,
            result
          });
          
          // 关闭通知
          this.dismissNotification(notification.id);
          
          return result;
        } catch (error) {
          await this.dispatchEvent('notificationActionFailed', {
            notification,
            action: action.label,
            error
          });
          throw error;
        }
      }
    })) || [];
    
    // 添加快速回复（对于消息通知）
    let quickReply: QuickReply | undefined;
    if (notification.type === 'message') {
      quickReply = {
        placeholder: '快速回复...',
        onSubmit: async (text: string) => {
          await this.handleQuickReply(notification, text);
        }
      };
    }
    
    return {
      ...baseUI,
      actions,
      quickReply,
      interactive: true
    };
  }
  
  /**
   * 勿扰模式
   */
  enableDoNotDisturb(rules: DNDRule[]): void {
    this.state.doNotDisturb = true;
    this.state.dndRules = rules;
    
    // 隐藏所有当前通知
    this.displayManager.clearAll();
    
    // 触发勿扰模式事件
    this.dispatchEvent('doNotDisturbEnabled', { rules });
  }
  
  disableDoNotDisturb(): void {
    this.state.doNotDisturb = false;
    
    // 重新显示通知
    this.tryDisplayNotifications();
    
    // 触发事件
    this.dispatchEvent('doNotDisturbDisabled', {});
  }
  
  /**
   * 通知历史
   */
  getNotificationHistory(filter: HistoryFilter = {}): NotificationHistory {
    return this.historyManager.getHistory(filter);
  }
  
  clearHistory(options: ClearHistoryOptions = {}): void {
    const cleared = this.historyManager.clear(options);
    
    // 触发清理事件
    this.dispatchEvent('historyCleared', { 
      count: cleared.count,
      options 
    });
  }
  
  /**
   * 用户偏好学习
   */
  private async learnFromInteraction(interaction: NotificationInteraction): Promise<void> {
    // 更新用户偏好模型
    await this.preferenceManager.recordInteraction(interaction);
    
    // 调整通知排序权重
    this.adjustScoringWeights(interaction);
    
    // 如果用户经常忽略某类通知，降低其优先级
    if (interaction.type === 'dismiss' && interaction.duration < 1000) {
      await this.adjustNotificationPriority(interaction.notification, -0.1);
    }
    
    // 如果用户经常点击某类通知，提高其优先级
    if (interaction.type === 'click') {
      await this.adjustNotificationPriority(interaction.notification, 0.2);
    }
  }
  
  /**
   * 通知分析报告
   */
  generateAnalyticsReport(timeframe: Timeframe): AnalyticsReport {
    const history = this.getNotificationHistory({ timeframe });
    
    return {
      timeframe,
      totals: {
        sent: history.notifications.length,
        displayed: history.notifications.filter(n => n.displayedAt).length,
        clicked: history.notifications.filter(n => n.clickedAt).length,
        dismissed: history.notifications.filter(n => n.dismissedAt).length,
        acted: history.notifications.filter(n => n.actionResult).length
      },
      engagement: {
        displayRate: this.calculateRate(history.notifications, 'displayed'),
        clickThroughRate: this.calculateRate(history.notifications, 'clicked'),
        actionRate: this.calculateRate(history.notifications, 'acted'),
        averageDisplayTime: this.calculateAverageDisplayTime(history.notifications)
      },
      byType: this.aggregateByType(history.notifications),
      byPriority: this.aggregateByPriority(history.notifications),
      trends: this.calculateTrends(history.notifications),
      recommendations: this.generateRecommendations(history.notifications)
    };
  }
  
  /**
   * 跨设备同步
   */
  async syncAcrossDevices(deviceId: string): Promise<void> {
    // 获取当前状态
    const state = this.getSyncState();
    
    // 同步到服务器
    await this.syncService.sync(state, deviceId);
    
    // 从服务器获取其他设备的通知
    const remoteNotifications = await this.syncService.getRemoteNotifications();
    
    // 合并通知
    this.mergeRemoteNotifications(remoteNotifications);
    
    // 触发同步完成事件
    this.dispatchEvent('syncComplete', {
      deviceId,
      localCount: state.notifications.length,
      remoteCount: remoteNotifications.length
    });
  }
  
  /**
   * 通知模板系统
   */
  registerTemplate(name: string, template: NotificationTemplate): void {
    this.templateManager.register(name, template);
  }
  
  createNotificationFromTemplate(
    templateName: string,
    data: any
  ): Notification {
    const template = this.templateManager.get(templateName);
    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }
    
    return this.templateManager.render(template, data);
  }
}
```text
