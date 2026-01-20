/**
 * @file API Key管理服务实现
 * @description 实现API Key的安全存储、管理和加密功能
 * @module services/APIKeyManagementService
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-19
 */

import { EventEmitter } from 'events';

export interface APIKey {
  id: string;
  name: string;
  provider: string;
  key: string;
  createdAt: number;
  updatedAt: number;
  lastUsed: number;
  usageCount: number;
  isActive: boolean;
  description?: string;
  metadata?: Record<string, any>;
}

export interface APIKeyTestResult {
  success: boolean;
  provider: string;
  message: string;
  timestamp: number;
}

export interface APIKeyStatistics {
  totalKeys: number;
  activeKeys: number;
  keysByProvider: Map<string, number>;
  totalUsage: number;
  mostUsedKey?: APIKey;
}

export class APIKeyManagementService extends EventEmitter {
  private apiKeys: Map<string, APIKey> = new Map();
  private storageKey: string = 'yyc3-api-keys';
  private encryptionKey: string = 'yyc3-encryption-key';
  private isInitialized: boolean = false;

  constructor(storageKey?: string, encryptionKey?: string) {
    super();
    if (storageKey) {
      this.storageKey = storageKey;
    }
    if (encryptionKey) {
      this.encryptionKey = encryptionKey;
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    await this.loadFromStorage();
    this.isInitialized = true;
    this.emit('initialized');
  }

  async addKey(keyData: Omit<APIKey, 'id' | 'createdAt' | 'updatedAt' | 'lastUsed' | 'usageCount'>): Promise<APIKey> {
    const newKey: APIKey = {
      ...keyData,
      id: this.generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastUsed: 0,
      usageCount: 0,
    };

    const encryptedKey = this.encrypt(newKey.key);
    newKey.key = encryptedKey;

    this.apiKeys.set(newKey.id, newKey);
    await this.saveToStorage();

    this.emit('key:added', newKey);
    return newKey;
  }

  async updateKey(id: string, updates: Partial<APIKey>): Promise<APIKey> {
    const key = this.apiKeys.get(id);
    if (!key) {
      throw new Error(`API Key not found: ${id}`);
    }

    const updatedKey: APIKey = {
      ...key,
      ...updates,
      id: key.id,
      createdAt: key.createdAt,
      updatedAt: Date.now(),
    };

    if (updates.key) {
      updatedKey.key = this.encrypt(updates.key);
    }

    this.apiKeys.set(id, updatedKey);
    await this.saveToStorage();

    this.emit('key:updated', updatedKey);
    return updatedKey;
  }

  async deleteKey(id: string): Promise<void> {
    const key = this.apiKeys.get(id);
    if (!key) {
      throw new Error(`API Key not found: ${id}`);
    }

    this.apiKeys.delete(id);
    await this.saveToStorage();

    this.emit('key:deleted', key);
  }

  getKey(id: string): APIKey | undefined {
    const key = this.apiKeys.get(id);
    if (!key) return undefined;

    return {
      ...key,
      key: this.decrypt(key.key),
    };
  }

  getKeys(provider?: string): APIKey[] {
    let keys = Array.from(this.apiKeys.values());

    if (provider) {
      keys = keys.filter(k => k.provider === provider);
    }

    return keys.map(key => ({
      ...key,
      key: this.decrypt(key.key),
    }));
  }

  getActiveKeys(provider?: string): APIKey[] {
    return this.getKeys(provider).filter(k => k.isActive);
  }

  async testKey(id: string): Promise<APIKeyTestResult> {
    const key = this.getKey(id);
    if (!key) {
      throw new Error(`API Key not found: ${id}`);
    }

    const result: APIKeyTestResult = {
      success: false,
      provider: key.provider,
      message: '',
      timestamp: Date.now(),
    };

    try {
      let success = false;

      if (key.provider === 'openai') {
        success = await this.testOpenAIKey(key.key);
      } else if (key.provider === 'anthropic') {
        success = await this.testAnthropicKey(key.key);
      } else if (key.provider === 'ollama') {
        success = await this.testOllamaConnection();
      }

      result.success = success;
      result.message = success ? 'API Key验证成功' : 'API Key验证失败';

      if (success) {
        await this.updateKey(id, {
          lastUsed: Date.now(),
          usageCount: key.usageCount + 1,
        });
      }
    } catch (error) {
      result.success = false;
      result.message = error instanceof Error ? error.message : '未知错误';
    }

    this.emit('key:tested', { keyId: id, result });
    return result;
  }

  private async testOpenAIKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to test OpenAI key:', error);
      return false;
    }
  }

  private async testAnthropicKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1,
          messages: [{ role: 'user', content: 'Hi' }],
        }),
      });

      return response.ok || response.status === 400;
    } catch (error) {
      console.error('Failed to test Anthropic key:', error);
      return false;
    }
  }

  private async testOllamaConnection(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      return response.ok;
    } catch (error) {
      console.error('Failed to test Ollama connection:', error);
      return false;
    }
  }

  async testAllKeys(): Promise<APIKeyTestResult[]> {
    const results: APIKeyTestResult[] = [];

    for (const keyId of this.apiKeys.keys()) {
      try {
        const result = await this.testKey(keyId);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          provider: this.getKey(keyId)?.provider || 'unknown',
          message: error instanceof Error ? error.message : '未知错误',
          timestamp: Date.now(),
        });
      }
    }

    this.emit('keys:tested', results);
    return results;
  }

  async activateKey(id: string): Promise<APIKey> {
    return this.updateKey(id, { isActive: true });
  }

  async deactivateKey(id: string): Promise<APIKey> {
    return this.updateKey(id, { isActive: false });
  }

  async rotateKey(id: string, newKey: string): Promise<APIKey> {
    const oldKey = this.getKey(id);
    if (!oldKey) {
      throw new Error(`API Key not found: ${id}`);
    }

    const rotatedKey = await this.updateKey(id, {
      key: newKey,
      updatedAt: Date.now(),
    });

    this.emit('key:rotated', { oldKey: oldKey.key, newKey: rotatedKey.key });
    return rotatedKey;
  }

  getKeyForProvider(provider: string): APIKey | undefined {
    const activeKeys = this.getActiveKeys(provider);
    return activeKeys.length > 0 ? activeKeys[0] : undefined;
  }

  getStatistics(): APIKeyStatistics {
    const keysByProvider = new Map<string, number>();
    let totalUsage = 0;
    let mostUsedKey: APIKey | undefined;

    for (const key of this.apiKeys.values()) {
      const count = keysByProvider.get(key.provider) || 0;
      keysByProvider.set(key.provider, count + 1);
      totalUsage += key.usageCount;

      if (!mostUsedKey || key.usageCount > mostUsedKey.usageCount) {
        mostUsedKey = key;
      }
    }

    const activeKeys = Array.from(this.apiKeys.values()).filter(k => k.isActive);

    return {
      totalKeys: this.apiKeys.size,
      activeKeys: activeKeys.length,
      keysByProvider,
      totalUsage,
      mostUsedKey: mostUsedKey ? this.getKey(mostUsedKey.id) : undefined,
    };
  }

  async exportKeys(includeSecrets: boolean = false): Promise<APIKey[]> {
    const keys = Array.from(this.apiKeys.values());

    if (!includeSecrets) {
      return keys.map(key => ({
        ...key,
        key: '***REDACTED***',
      }));
    }

    return keys.map(key => ({
      ...key,
      key: this.decrypt(key.key),
    }));
  }

  async importKeys(keys: Omit<APIKey, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<void> {
    for (const keyData of keys) {
      const existingKey = Array.from(this.apiKeys.values()).find(
        k => k.name === keyData.name && k.provider === keyData.provider
      );

      if (existingKey) {
        await this.updateKey(existingKey.id, keyData);
      } else {
        await this.addKey(keyData);
      }
    }

    this.emit('keys:imported', { count: keys.length });
  }

  async backupKeys(): Promise<string> {
    const keys = await this.exportKeys(true);
    const backupData = {
      version: '1.0.0',
      exportedAt: Date.now(),
      keys,
    };

    const backupString = JSON.stringify(backupData, null, 2);
    const encryptedBackup = this.encrypt(backupString);

    this.emit('keys:backed-up', { keyCount: keys.length });
    return encryptedBackup;
  }

  async restoreKeys(backupData: string): Promise<void> {
    try {
      const decryptedBackup = this.decrypt(backupData);
      const parsed = JSON.parse(decryptedBackup);

      if (!parsed.keys || !Array.isArray(parsed.keys)) {
        throw new Error('Invalid backup format');
      }

      this.apiKeys.clear();
      for (const keyData of parsed.keys) {
        const encryptedKey = this.encrypt(keyData.key);
        const key: APIKey = {
          ...keyData,
          key: encryptedKey,
        };
        this.apiKeys.set(key.id, key);
      }

      await this.saveToStorage();
      this.emit('keys:restored', { keyCount: parsed.keys.length });
    } catch (error) {
      throw new Error(`Failed to restore keys: ${error}`);
    }
  }

  async clearAllKeys(): Promise<void> {
    const keyCount = this.apiKeys.size;
    this.apiKeys.clear();
    await this.saveToStorage();

    this.emit('keys:cleared', { keyCount });
  }

  private encrypt(text: string): string {
    try {
      let encrypted = '';
      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i);
        const keyChar = this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
        encrypted += String.fromCharCode(charCode ^ keyChar);
      }
      return btoa(encrypted);
    } catch (error) {
      console.error('Encryption failed:', error);
      return text;
    }
  }

  private decrypt(encryptedText: string): string {
    try {
      const decoded = atob(encryptedText);
      let decrypted = '';
      for (let i = 0; i < decoded.length; i++) {
        const charCode = decoded.charCodeAt(i);
        const keyChar = this.encryptionKey.charCodeAt(i % this.encryptionKey.length);
        decrypted += String.fromCharCode(charCode ^ keyChar);
      }
      return decrypted;
    } catch (error) {
      console.error('Decryption failed:', error);
      return encryptedText;
    }
  }

  private async saveToStorage(): Promise<void> {
    try {
      const data = Array.from(this.apiKeys.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save API keys to storage:', error);
    }
  }

  private async loadFromStorage(): Promise<void> {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        const parsed = JSON.parse(data);
        this.apiKeys = new Map(parsed);
      }
    } catch (error) {
      console.error('Failed to load API keys from storage:', error);
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  isInitialized(): boolean {
    return this.isInitialized;
  }

  setEncryptionKey(key: string): void {
    this.encryptionKey = key;
    this.emit('encryption-key:updated', key);
  }

  getEncryptionKey(): string {
    return this.encryptionKey;
  }
}
