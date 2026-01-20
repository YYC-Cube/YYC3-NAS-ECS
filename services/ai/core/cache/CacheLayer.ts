export enum CacheLevel {
  L1 = 'memory',
  L2 = 'shared',
  L3 = 'persistent',
  L4 = 'remote',
}

export enum CacheStrategy {
  LRU = 'lru',
  LFU = 'lfu',
  ARC = 'arc',
  MRU = 'mru',
  FIFO = 'fifo',
  TTL = 'ttl',
  HYBRID = 'hybrid',
}

export interface CacheConfig {
  l1Size?: number;
  l1TTL?: number;
  l2Size?: string;
  l2Policy?: string;
  l3Size?: string;
  l4TTL?: number;
  persistentPath?: string;
  redisConfig?: any;
  cdnProvider?: string;
  cdnBucket?: string;
  cdnRegion?: string;
  edgeLocations?: string[];
  enableCompression?: boolean;
  writeThrough?: boolean;
  writeBehind?: boolean;
  prefetchThreshold?: number;
  clusteringEnabled?: boolean;
  writeBufferSize?: number;
  strategy?: CacheStrategy;
}

export interface CacheGetOptions {
  loader?: () => Promise<any>;
  ttl?: number;
  strategy?: CacheStrategy;
  forceRefresh?: boolean;
}

export interface CacheSetOptions {
  ttl?: number;
  strategy?: CacheStrategy;
  tags?: string[];
  metadata?: Record<string, any>;
  persist?: boolean;
}

export interface CacheResult<T> {
  value: T;
  hit: boolean;
  source: string;
  metadata?: {
    loadTime?: number;
    missTime?: number;
    size?: number;
    timestamp: Date;
  };
}

export interface CacheEntry<T> {
  key: string;
  value: T;
  ttl: number;
  createdAt: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
  tags?: string[];
  metadata?: Record<string, any>;
  size: number;
}

export interface CacheMetrics {
  hits: number;
  misses: number;
  hitRate: number;
  totalOperations: number;
  averageAccessTime: number;
  size: number;
  entries: number;
  evictions: number;
  errors: number;
}

export interface CacheHealthStatus {
  level: CacheLevel;
  status: 'healthy' | 'degraded' | 'unhealthy';
  memoryUsage: number;
  memoryLimit: number;
  hitRate: number;
  errorRate: number;
  lastCheck: Date;
}

export class IntelligentCacheLayer {
  private l1Cache: Map<string, CacheEntry<any>>;
  private l2Cache: Map<string, CacheEntry<any>>;
  private l3Cache: Map<string, CacheEntry<any>>;
  private l4Cache: Map<string, CacheEntry<any>>;

  private config: Required<CacheConfig>;
  private metrics: Map<CacheLevel, CacheMetrics>;
  private healthStatus: Map<CacheLevel, CacheHealthStatus>;
  private strategy: CacheStrategy;
  private maxSize: Map<CacheLevel, number>;
  private currentSize: Map<CacheLevel, number>;

  constructor(config: CacheConfig = {}) {
    this.config = {
      l1Size: config.l1Size ?? 1000,
      l1TTL: config.l1TTL ?? 60000,
      l2Size: config.l2Size ?? '1gb',
      l2Policy: config.l2Policy ?? 'allkeys-lru',
      l3Size: config.l3Size ?? '10gb',
      l4TTL: config.l4TTL ?? 86400000,
      persistentPath: config.persistentPath ?? './cache',
      redisConfig: config.redisConfig ?? {},
      cdnProvider: config.cdnProvider ?? 'aws',
      cdnBucket: config.cdnBucket ?? 'default',
      cdnRegion: config.cdnRegion ?? 'us-east-1',
      edgeLocations: config.edgeLocations ?? [],
      enableCompression: config.enableCompression ?? true,
      writeThrough: config.writeThrough ?? false,
      writeBehind: config.writeBehind ?? true,
      prefetchThreshold: config.prefetchThreshold ?? 0.8,
      clusteringEnabled: config.clusteringEnabled ?? false,
      writeBufferSize: config.writeBufferSize ?? 1024 * 1024,
    };

    this.l1Cache = new Map();
    this.l2Cache = new Map();
    this.l3Cache = new Map();
    this.l4Cache = new Map();

    this.strategy = config.strategy ?? CacheStrategy.LRU;

    this.maxSize = new Map([
      [CacheLevel.L1, this.config.l1Size],
      [CacheLevel.L2, 1024 * 1024 * 1024],
      [CacheLevel.L3, 10 * 1024 * 1024 * 1024],
      [CacheLevel.L4, 100 * 1024 * 1024 * 1024],
    ]);

    this.currentSize = new Map([
      [CacheLevel.L1, 0],
      [CacheLevel.L2, 0],
      [CacheLevel.L3, 0],
      [CacheLevel.L4, 0],
    ]);

    this.metrics = new Map();
    this.healthStatus = new Map();

    this.initializeMetrics();
    this.initializeHealthStatus();
    this.startHealthCheck();
  }

  private initializeMetrics(): void {
    for (const level of Object.values(CacheLevel)) {
      this.metrics.set(level as CacheLevel, {
        hits: 0,
        misses: 0,
        hitRate: 0,
        totalOperations: 0,
        averageAccessTime: 0,
        size: 0,
        entries: 0,
        evictions: 0,
        errors: 0,
      });
    }
  }

  private initializeHealthStatus(): void {
    for (const level of Object.values(CacheLevel)) {
      this.healthStatus.set(level as CacheLevel, {
        level: level as CacheLevel,
        status: 'healthy',
        memoryUsage: 0,
        memoryLimit: this.maxSize.get(level as CacheLevel) ?? 0,
        hitRate: 0,
        errorRate: 0,
        lastCheck: new Date(),
      });
    }
  }

  async get<T>(key: string, options: CacheGetOptions = {}): Promise<CacheResult<T>> {
    const startTime = Date.now();

    try {
      if (options.forceRefresh) {
        return this.loadAndCache<T>(key, options, startTime);
      }

      const l1Result = await this.getFromCache<T>(this.l1Cache, key, CacheLevel.L1);
      if (l1Result) {
        this.recordHit(CacheLevel.L1, Date.now() - startTime);
        return { value: l1Result.value, hit: true, source: 'L1', metadata: { timestamp: new Date(), ...l1Result.metadata } };
      }

      const l2Result = await this.getFromCache<T>(this.l2Cache, key, CacheLevel.L2);
      if (l2Result) {
        await this.setCache(this.l1Cache, key, l2Result, CacheLevel.L1);
        this.recordHit(CacheLevel.L2, Date.now() - startTime);
        return { value: l2Result.value, hit: true, source: 'L2', metadata: { timestamp: new Date(), ...l2Result.metadata } };
      }

      const l3Result = await this.getFromCache<T>(this.l3Cache, key, CacheLevel.L3);
      if (l3Result) {
        await Promise.all([
          this.setCache(this.l1Cache, key, l3Result, CacheLevel.L1),
          this.setCache(this.l2Cache, key, l3Result, CacheLevel.L2),
        ]);
        this.recordHit(CacheLevel.L3, Date.now() - startTime);
        return { value: l3Result.value, hit: true, source: 'L3', metadata: { timestamp: new Date(), ...l3Result.metadata } };
      }

      const l4Result = await this.getFromCache<T>(this.l4Cache, key, CacheLevel.L4);
      if (l4Result) {
        await Promise.all([
          this.setCache(this.l1Cache, key, l4Result, CacheLevel.L1),
          this.setCache(this.l2Cache, key, l4Result, CacheLevel.L2),
          this.setCache(this.l3Cache, key, l4Result, CacheLevel.L3),
        ]);
        this.recordHit(CacheLevel.L4, Date.now() - startTime);
        return { value: l4Result.value, hit: true, source: 'L4', metadata: { timestamp: new Date(), ...l4Result.metadata } };
      }

      if (options.loader) {
        return this.loadAndCache<T>(key, options, startTime);
      }

      this.recordMiss(CacheLevel.L1, Date.now() - startTime);
      return { value: null as any, hit: false, source: 'none', metadata: { missTime: Date.now() - startTime, timestamp: new Date() } };
    } catch (error) {
      this.recordError(CacheLevel.L1);
      throw error;
    }
  }

  async set<T>(key: string, value: T, options: CacheSetOptions = {}): Promise<void> {
    const ttl = options.ttl ?? this.config.l1TTL;
    const now = Date.now();

    const entry: CacheEntry<T> = {
      key,
      value,
      ttl,
      createdAt: now,
      expiresAt: now + ttl,
      accessCount: 0,
      lastAccessed: now,
      tags: options.tags,
      metadata: options.metadata,
      size: this.calculateSize(value),
    };

    await Promise.all([
      this.setCache(this.l1Cache, key, entry, CacheLevel.L1),
      this.setCache(this.l2Cache, key, entry, CacheLevel.L2),
      this.setCache(this.l3Cache, key, entry, CacheLevel.L3),
    ]);

    if (options.persist) {
      await this.setCache(this.l4Cache, key, entry, CacheLevel.L4);
    }
  }

  async delete(key: string): Promise<void> {
    this.l1Cache.delete(key);
    this.l2Cache.delete(key);
    this.l3Cache.delete(key);
    this.l4Cache.delete(key);
  }

  async clear(level?: CacheLevel): Promise<void> {
    if (level) {
      switch (level) {
        case CacheLevel.L1:
          this.l1Cache.clear();
          this.currentSize.set(CacheLevel.L1, 0);
          break;
        case CacheLevel.L2:
          this.l2Cache.clear();
          this.currentSize.set(CacheLevel.L2, 0);
          break;
        case CacheLevel.L3:
          this.l3Cache.clear();
          this.currentSize.set(CacheLevel.L3, 0);
          break;
        case CacheLevel.L4:
          this.l4Cache.clear();
          this.currentSize.set(CacheLevel.L4, 0);
          break;
      }
      this.updateMetrics(level, 'delete');
    } else {
      this.l1Cache.clear();
      this.l2Cache.clear();
      this.l3Cache.clear();
      this.l4Cache.clear();
      this.currentSize.set(CacheLevel.L1, 0);
      this.currentSize.set(CacheLevel.L2, 0);
      this.currentSize.set(CacheLevel.L3, 0);
      this.currentSize.set(CacheLevel.L4, 0);
      for (const level of Object.values(CacheLevel)) {
        this.updateMetrics(level as CacheLevel, 'delete');
      }
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    const invalidate = (cache: Map<string, CacheEntry<any>>) => {
      for (const [key, entry] of cache.entries()) {
        if (entry.tags?.includes(tag)) {
          cache.delete(key);
        }
      }
    };

    invalidate(this.l1Cache);
    invalidate(this.l2Cache);
    invalidate(this.l3Cache);
    invalidate(this.l4Cache);
  }

  getMetrics(level?: CacheLevel): CacheMetrics | Map<CacheLevel, CacheMetrics> {
    if (level) {
      return { ...this.metrics.get(level)! };
    }
    return new Map(this.metrics);
  }

  getHealthStatus(level?: CacheLevel): CacheHealthStatus | Map<CacheLevel, CacheHealthStatus> {
    if (level) {
      return { ...this.healthStatus.get(level)! };
    }
    return new Map(this.healthStatus);
  }

  async warmUp(keys: string[], loader: (key: string) => Promise<any>): Promise<void> {
    const promises = keys.map(async (key) => {
      const value = await loader(key);
      await this.set(key, value);
    });

    await Promise.all(promises);
  }

  private async getFromCache<T>(
    cache: Map<string, CacheEntry<any>>,
    key: string,
    _level: CacheLevel
  ): Promise<CacheEntry<T> | null> {
    const entry = cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      cache.delete(key);
      return null;
    }

    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry as CacheEntry<T>;
  }

  private async setCache<T>(
    cache: Map<string, CacheEntry<any>>,
    key: string,
    entry: CacheEntry<T>,
    level: CacheLevel
  ): Promise<void> {
    const maxSize = this.maxSize.get(level) ?? 0;
    const currentSize = this.currentSize.get(level) ?? 0;

    if (currentSize + entry.size > maxSize) {
      await this.evict(cache, level, entry.size);
    }

    cache.set(key, entry);
    this.currentSize.set(level, currentSize + entry.size);

    this.updateMetrics(level, 'set');
  }

  private async evict(
    cache: Map<string, CacheEntry<any>>,
    level: CacheLevel,
    requiredSize: number
  ): Promise<void> {
    const entries = Array.from(cache.entries());
    let freedSize = 0;

    switch (this.strategy) {
      case CacheStrategy.LRU:
        entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
        break;
      case CacheStrategy.LFU:
        entries.sort((a, b) => a[1].accessCount - b[1].accessCount);
        break;
      case CacheStrategy.FIFO:
        entries.sort((a, b) => a[1].createdAt - b[1].createdAt);
        break;
      case CacheStrategy.MRU:
        entries.sort((a, b) => b[1].lastAccessed - a[1].lastAccessed);
        break;
      default:
        entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    }

    for (const [key, entry] of entries) {
      if (freedSize >= requiredSize) {
        break;
      }

      cache.delete(key);
      freedSize += entry.size;

      const metrics = this.metrics.get(level)!;
      metrics.evictions++;
    }

    const currentSize = this.currentSize.get(level) ?? 0;
    this.currentSize.set(level, Math.max(0, currentSize - freedSize));
  }

  private async loadAndCache<T>(
    key: string,
    options: CacheGetOptions,
    startTime: number
  ): Promise<CacheResult<T>> {
    const data = await options.loader!();
    await this.set(key, data, { ttl: options.ttl });

    const metrics = this.metrics.get(CacheLevel.L1)!;
    metrics.misses++;

    return {
      value: data,
      hit: false,
      source: 'loader',
      metadata: {
        loadTime: Date.now() - startTime,
        size: this.calculateSize(data),
        timestamp: new Date(),
      },
    };
  }

  private recordHit(level: CacheLevel, accessTime: number): void {
    const metrics = this.metrics.get(level)!;
    metrics.hits++;
    metrics.totalOperations++;

    const totalTime = metrics.averageAccessTime * (metrics.totalOperations - 1);
    metrics.averageAccessTime = (totalTime + accessTime) / metrics.totalOperations;

    metrics.hitRate = metrics.hits / metrics.totalOperations;
  }

  private recordMiss(level: CacheLevel, accessTime: number): void {
    const metrics = this.metrics.get(level)!;
    metrics.misses++;
    metrics.totalOperations++;

    const totalTime = metrics.averageAccessTime * (metrics.totalOperations - 1);
    metrics.averageAccessTime = (totalTime + accessTime) / metrics.totalOperations;

    metrics.hitRate = metrics.hits / metrics.totalOperations;
  }

  private recordError(level: CacheLevel): void {
    const metrics = this.metrics.get(level)!;
    metrics.errors++;
  }

  private updateMetrics(level: CacheLevel, _operation: 'get' | 'set' | 'delete'): void {
    const metrics = this.metrics.get(level)!;
    metrics.size = this.currentSize.get(level) ?? 0;
    metrics.entries = this.getCacheSize(level);
  }

  private getCacheSize(level: CacheLevel): number {
    switch (level) {
      case CacheLevel.L1:
        return this.l1Cache.size;
      case CacheLevel.L2:
        return this.l2Cache.size;
      case CacheLevel.L3:
        return this.l3Cache.size;
      case CacheLevel.L4:
        return this.l4Cache.size;
    }
  }

  private calculateSize(value: any): number {
    if (value === undefined) return 0;
    return JSON.stringify(value).length * 2;
  }

  private startHealthCheck(): void {
    setInterval(() => {
      this.checkHealth();
    }, 60000);
  }

  private checkHealth(): void {
    for (const level of Object.values(CacheLevel)) {
      const metrics = this.metrics.get(level as CacheLevel)!;
      const health = this.healthStatus.get(level as CacheLevel)!;

      health.memoryUsage = this.currentSize.get(level as CacheLevel) ?? 0;
      health.hitRate = metrics.hitRate;
      health.errorRate = metrics.errors / metrics.totalOperations;
      health.lastCheck = new Date();

      if (health.errorRate > 0.1) {
        health.status = 'unhealthy';
      } else if (health.errorRate > 0.05 || health.hitRate < 0.5) {
        health.status = 'degraded';
      } else {
        health.status = 'healthy';
      }
    }
  }

  destroy(): void {
    this.l1Cache.clear();
    this.l2Cache.clear();
    this.l3Cache.clear();
    this.l4Cache.clear();
    this.metrics.clear();
    this.healthStatus.clear();
  }
}
