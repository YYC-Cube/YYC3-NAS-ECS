/**
 * @file 知识库系统
 * @description 实现AI知识库管理，支持知识存储、检索、更新等功能
 * @module knowledge-base
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import {
  NotFoundError,
  ValidationError,
  InternalError
} from '../error-handler/ErrorTypes';

export interface KnowledgeItem {
  id: string;
  type: 'fact' | 'rule' | 'pattern' | 'concept' | 'procedure';
  content: any;
  metadata?: Record<string, any>;
  confidence?: number;
  source?: string;
  tags?: string[];
  createdAt: number;
  updatedAt: number;
}

export interface KnowledgeQuery {
  type?: string;
  tags?: string[];
  content?: any;
  minConfidence?: number;
  limit?: number;
  offset?: number;
}

export interface KnowledgeBaseConfig {
  enablePersistence?: boolean;
  enableIndexing?: boolean;
  enableVersioning?: boolean;
  maxItems?: number;
  enableEmbedding?: boolean;
}

export interface KnowledgeMetrics {
  totalItems: number;
  itemsByType: Record<string, number>;
  totalQueries: number;
  averageQueryTime: number;
  hitRate: number;
}

export class KnowledgeBase {
  private config: Required<KnowledgeBaseConfig>;
  private items: Map<string, KnowledgeItem> = new Map();
  private index: Map<string, Set<string>> = new Map();
  private metrics: KnowledgeMetrics;

  constructor(config: KnowledgeBaseConfig = {}) {
    this.config = {
      enablePersistence: config.enablePersistence ?? true,
      enableIndexing: config.enableIndexing ?? true,
      enableVersioning: config.enableVersioning ?? true,
      maxItems: config.maxItems ?? 10000,
      enableEmbedding: config.enableEmbedding ?? false,
    };
    this.metrics = this.initializeMetrics();
  }

  private initializeMetrics(): KnowledgeMetrics {
    return {
      totalItems: 0,
      itemsByType: {},
      totalQueries: 0,
      averageQueryTime: 0,
      hitRate: 0,
    };
  }

  async add(item: Omit<KnowledgeItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const fullItem: KnowledgeItem = {
      ...item,
      id: this.generateItemId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    if (this.items.size >= this.config.maxItems) {
      throw new InternalError('Knowledge base is full', {
        additionalData: { 
          currentSize: this.items.size, 
          maxSize: this.config.maxItems 
        }
      });
    }

    this.items.set(fullItem.id, fullItem);

    if (this.config.enableIndexing) {
      this.indexItem(fullItem);
    }

    this.updateMetrics('added', fullItem);

    if (this.config.enablePersistence) {
      await this.persistItem(fullItem);
    }

    return fullItem.id;
  }

  async update(itemId: string, updates: Partial<Omit<KnowledgeItem, 'id' | 'createdAt'>>): Promise<void> {
    const item = this.items.get(itemId);
    if (!item) {
      throw new NotFoundError('knowledge item', itemId);
    }

    const updatedItem: KnowledgeItem = {
      ...item,
      ...updates,
      updatedAt: Date.now(),
    };

    this.items.set(itemId, updatedItem);

    if (this.config.enableIndexing) {
      this.reindexItem(updatedItem);
    }

    if (this.config.enablePersistence) {
      await this.persistItem(updatedItem);
    }
  }

  async remove(itemId: string): Promise<void> {
    const item = this.items.get(itemId);
    if (!item) {
      throw new NotFoundError('knowledge item', itemId, {
        additionalData: { 
          availableItems: Array.from(this.items.keys()).slice(0, 10) 
        }
      });
    }

    this.items.delete(itemId);

    if (this.config.enableIndexing) {
      this.unindexItem(item);
    }

    this.updateMetrics('removed', item);

    if (this.config.enablePersistence) {
      await this.removeItem(itemId);
    }
  }

  async query(query: KnowledgeQuery): Promise<KnowledgeItem[]> {
    const startTime = Date.now();
    this.metrics.totalQueries++;

    let results = Array.from(this.items.values());

    if (query.type) {
      results = results.filter(item => item.type === query.type);
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter(item => 
        query.tags!.some(tag => item.tags?.includes(tag))
      );
    }

    if (query.content) {
      results = results.filter(item => 
        this.matchContent(item.content, query.content!)
      );
    }

    if (query.minConfidence !== undefined) {
      results = results.filter(item => 
        (item.confidence ?? 0) >= query.minConfidence!
      );
    }

    if (query.offset) {
      results = results.slice(query.offset);
    }

    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    const queryTime = Date.now() - startTime;
    this.updateAverageQueryTime(queryTime);

    if (results.length > 0) {
      this.updateHitRate(true);
    } else {
      this.updateHitRate(false);
    }

    return results;
  }

  async get(itemId: string): Promise<KnowledgeItem | undefined> {
    return this.items.get(itemId);
  }

  async getAll(): Promise<KnowledgeItem[]> {
    return Array.from(this.items.values());
  }

  async getByType(type: string): Promise<KnowledgeItem[]> {
    return Array.from(this.items.values()).filter(item => item.type === type);
  }

  async getByTags(tags: string[]): Promise<KnowledgeItem[]> {
    return Array.from(this.items.values()).filter(item =>
      tags.some(tag => item.tags?.includes(tag))
    );
  }

  async search(query: string, limit: number = 10): Promise<KnowledgeItem[]> {
    const results: Array<{ item: KnowledgeItem; score: number }> = [];

    for (const item of this.items.values()) {
      const score = this.calculateRelevance(item, query);
      if (score > 0) {
        results.push({ item, score });
      }
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, limit).map(r => r.item);
  }

  getMetrics(): KnowledgeMetrics {
    return { ...this.metrics };
  }

  async clear(): Promise<void> {
    this.items.clear();
    this.index.clear();
    this.metrics = this.initializeMetrics();

    if (this.config.enablePersistence) {
      await this.clearPersistence();
    }
  }

  async export(): Promise<string> {
    const data = {
      items: Array.from(this.items.values()),
      exportedAt: Date.now(),
    };

    return JSON.stringify(data, null, 2);
  }

  async import(data: string): Promise<void> {
    const parsed = JSON.parse(data);
    
    for (const item of parsed.items) {
      await this.add(item);
    }
  }

  private indexItem(item: KnowledgeItem): void {
    if (item.tags) {
      for (const tag of item.tags) {
        if (!this.index.has(tag)) {
          this.index.set(tag, new Set());
        }
        this.index.get(tag)!.add(item.id);
      }
    }

    if (item.type) {
      if (!this.index.has(`type:${item.type}`)) {
        this.index.set(`type:${item.type}`, new Set());
      }
      this.index.get(`type:${item.type}`)!.add(item.id);
    }
  }

  private reindexItem(item: KnowledgeItem): void {
    this.unindexItem(item);
    this.indexItem(item);
  }

  private unindexItem(item: KnowledgeItem): void {
    if (item.tags) {
      for (const tag of item.tags) {
        const indexSet = this.index.get(tag);
        if (indexSet) {
          indexSet.delete(item.id);
          if (indexSet.size === 0) {
            this.index.delete(tag);
          }
        }
      }
    }

    if (item.type) {
      const indexSet = this.index.get(`type:${item.type}`);
      if (indexSet) {
        indexSet.delete(item.id);
        if (indexSet.size === 0) {
          this.index.delete(`type:${item.type}`);
        }
      }
    }
  }

  private matchContent(itemContent: any, queryContent: any): boolean {
    const itemStr = JSON.stringify(itemContent).toLowerCase();
    const queryStr = JSON.stringify(queryContent).toLowerCase();
    return itemStr.includes(queryStr);
  }

  private calculateRelevance(item: KnowledgeItem, query: string): number {
    let score = 0;
    const queryLower = query.toLowerCase();

    const contentStr = JSON.stringify(item.content).toLowerCase();
    if (contentStr.includes(queryLower)) {
      score += 1;
    }

    if (item.tags) {
      for (const tag of item.tags) {
        if (tag.toLowerCase().includes(queryLower)) {
          score += 0.5;
        }
      }
    }

    if (item.metadata) {
      const metadataStr = JSON.stringify(item.metadata).toLowerCase();
      if (metadataStr.includes(queryLower)) {
        score += 0.3;
      }
    }

    if (item.confidence) {
      score *= item.confidence;
    }

    return score;
  }

  private updateMetrics(action: 'added' | 'removed', item: KnowledgeItem): void {
    if (action === 'added') {
      this.metrics.totalItems++;
      this.metrics.itemsByType[item.type] = 
        (this.metrics.itemsByType[item.type] || 0) + 1;
    } else if (action === 'removed') {
      this.metrics.totalItems--;
      this.metrics.itemsByType[item.type] = 
        Math.max(0, (this.metrics.itemsByType[item.type] || 0) - 1);
    }
  }

  private updateAverageQueryTime(queryTime: number): void {
    const current = this.metrics.averageQueryTime;
    const count = this.metrics.totalQueries;
    this.metrics.averageQueryTime = 
      (current * (count - 1) + queryTime) / count;
  }

  private updateHitRate(hit: boolean): void {
    const current = this.metrics.hitRate;
    const count = this.metrics.totalQueries;
    this.metrics.hitRate = (current * (count - 1) + (hit ? 1 : 0)) / count;
  }

  private async persistItem(item: KnowledgeItem): Promise<void> {
    try {
      const key = `yyc3_kb_${item.id}`;
      localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
      console.error('[KnowledgeBase] Failed to persist item:', error);
    }
  }

  private async removeItem(itemId: string): Promise<void> {
    try {
      const key = `yyc3_kb_${itemId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('[KnowledgeBase] Failed to remove item:', error);
    }
  }

  private async clearPersistence(): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('yyc3_kb_'));
      for (const key of keys) {
        localStorage.removeItem(key);
      }
    } catch (error) {
      console.error('[KnowledgeBase] Failed to clear persistence:', error);
    }
  }

  private generateItemId(): string {
    return `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  destroy(): void {
    this.clear();
  }
}

export default KnowledgeBase;
