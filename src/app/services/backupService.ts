/**
 * @file BackupService - 备份服务
 * @description 提供数据备份、恢复和调度管理功能
 * @module services/backup
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-24
 */

import { logService } from './logService';
import { LogCategory, LogLevel } from '../types/logs';
import { logger } from '../utils/logger';
import {
  BackupConfig, BackupRecord, RestoreRecord, BackupStats,
  BackupType, BackupStatus, BackupStorage
} from '../types/backup';

class BackupService {
  private configs: BackupConfig[] = [];
  private records: BackupRecord[] = [];
  private restores: RestoreRecord[] = [];
  private storageKey = 'yyc3-backup-data';
  private isLocalStorageAvailable: boolean = false;

  constructor() {
    this.checkLocalStorageAvailability();
    this.initialize();
  }

  private checkLocalStorageAvailability(): void {
    try {
      const testKey = '__yyc3_storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      this.isLocalStorageAvailable = true;
    } catch (error) {
      logger.warn('localStorage is not available:', error);
      this.isLocalStorageAvailable = false;
    }
  }

  private initialize(): void {
    if (this.isLocalStorageAvailable) {
      this.loadFromStorage();
    }
    this.ensureDefaultConfig();
  }

  private loadFromStorage(): void {
    if (!this.isLocalStorageAvailable) {
      return;
    }

    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.configs = data.configs || [];
        this.records = data.records || [];
        this.restores = data.restores || [];
      }
    } catch (error) {
      logger.error('Failed to load backup data:', error);
    }
  }

  private saveToStorage(): void {
    if (!this.isLocalStorageAvailable) {
      return;
    }

    try {
      const data = {
        configs: this.configs,
        records: this.records,
        restores: this.restores
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save backup data:', error);
    }
  }

  private ensureDefaultConfig(): void {
    if (this.configs.length === 0) {
      const defaultConfig: BackupConfig = {
        id: 'backup-config-001',
        name: '系统默认备份',
        type: BackupType.FULL,
        storage: BackupStorage.LOCAL,
        schedule: '0 2 * * *',
        retentionDays: 30,
        compression: true,
        encryption: false,
        storageConfig: {
          localPath: '/backups'
        },
        includedPaths: [
          '/data',
          '/config',
          '/logs'
        ],
        excludedPaths: [
          '/tmp',
          '/cache'
        ],
        isActive: true,
        createdAt: new Date().toISOString()
      };
      this.configs.push(defaultConfig);
      this.saveToStorage();
    }
  }

  getConfigs(): BackupConfig[] {
    return [...this.configs];
  }

  getConfigById(id: string): BackupConfig | undefined {
    return this.configs.find(c => c.id === id);
  }

  createConfig(config: Omit<BackupConfig, 'id' | 'createdAt'>): BackupConfig {
    const newConfig: BackupConfig = {
      ...config,
      id: `backup-config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    this.configs.push(newConfig);
    this.saveToStorage();
    return newConfig;
  }

  updateConfig(id: string, updates: Partial<BackupConfig>): BackupConfig | null {
    const index = this.configs.findIndex(c => c.id === id);
    if (index === -1) {
      return null;
    }

    this.configs[index] = { ...this.configs[index], ...updates };
    this.saveToStorage();
    return this.configs[index];
  }

  deleteConfig(id: string): boolean {
    const index = this.configs.findIndex(c => c.id === id);
    if (index === -1) {
      return false;
    }

    this.configs.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  async createBackup(configId: string, createdBy: string): Promise<BackupRecord> {
    const config = this.configs.find(c => c.id === configId);
    if (!config) {
      throw new Error('Backup configuration not found');
    }

    const record: BackupRecord = {
      id: `backup-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      configId,
      configName: config.name,
      type: config.type,
      status: BackupStatus.IN_PROGRESS,
      startTime: new Date().toISOString(),
      size: 0,
      filesCount: 0,
      storage: config.storage,
      storagePath: `${config.storageConfig.localPath || '/backups'}/${new Date().toISOString().split('T')[0]}`,
      createdBy
    };

    this.records.push(record);
    this.saveToStorage();

    // Add logging for backup start
    logService.addLog({
      category: LogCategory.BACKUP,
      level: LogLevel.INFO,
      service: 'backup-service',
      message: `Backup started: ${record.configName}`,
      details: { configId, backupId: record.id, type: record.type },
      userId: createdBy
    });

    try {
      await this.performBackup(record, config);

      record.status = BackupStatus.COMPLETED;
      record.endTime = new Date().toISOString();

      config.lastBackup = record.endTime;
      this.saveToStorage();

      // Add logging for backup completion
    logService.addLog({
      category: LogCategory.BACKUP,
      level: LogLevel.INFO,
      service: 'backup-service',
      message: `Backup completed: ${record.configName}`,
      details: {
        configId,
        backupId: record.id,
        size: record.size,
        filesCount: record.filesCount
      },
      userId: createdBy
    });

      return record;
    } catch (error) {
      record.status = BackupStatus.FAILED;
      record.endTime = new Date().toISOString();
      record.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.saveToStorage();

      // Add logging for backup failure
      logService.addLog({
        category: LogCategory.BACKUP,
        level: LogLevel.ERROR,
        service: 'backup-service',
        message: `Backup failed: ${record.configName}`,
        details: {
          configId,
          backupId: record.id,
          error: record.errorMessage
        },
        userId: createdBy
      });

      throw error;
    }
  }

  private async performBackup(record: BackupRecord, config: BackupConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      // Shorten delay for testing purposes
      const delay = process.env.NODE_ENV === 'test' ? 100 : 2000;
      setTimeout(() => {
        try {
          const size = Math.floor(Math.random() * 1000000000) + 100000000;
          const filesCount = Math.floor(Math.random() * 10000) + 1000;

          record.size = size;
          record.filesCount = filesCount;

          if (config.compression) {
            record.compressedSize = Math.floor(size * 0.6);
          }

          if (config.encryption) {
            record.checksum = this.generateChecksum();
          }

          this.saveToStorage();
          resolve();
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  }

  private generateChecksum(): string {
    return Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  getRecords(configId?: string, limit?: number): BackupRecord[] {
    let records = [...this.records];

    if (configId) {
      records = records.filter(r => r.configId === configId);
    }

    records.sort((a, b) =>
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    return limit ? records.slice(0, limit) : records;
  }

  getRecordById(id: string): BackupRecord | undefined {
    return this.records.find(r => r.id === id);
  }

  async restoreBackup(backupId: string, restorePath: string, createdBy: string): Promise<RestoreRecord> {
    const backup = this.records.find(r => r.id === backupId);
    if (!backup) {
      throw new Error('Backup record not found');
    }

    const restore: RestoreRecord = {
      id: `restore-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      backupId,
      backupName: backup.configName,
      status: BackupStatus.IN_PROGRESS,
      startTime: new Date().toISOString(),
      restorePath,
      filesRestored: 0,
      createdBy
    };

    this.restores.push(restore);
    this.saveToStorage();

    try {
      await this.performRestore(restore, backup);

      restore.status = BackupStatus.COMPLETED;
      restore.endTime = new Date().toISOString();
      this.saveToStorage();

      return restore;
    } catch (error) {
      restore.status = BackupStatus.FAILED;
      restore.endTime = new Date().toISOString();
      restore.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.saveToStorage();
      throw error;
    }
  }

  private async performRestore(restore: RestoreRecord, backup: BackupRecord): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          restore.filesRestored = backup.filesCount;
          this.saveToStorage();
          resolve();
        } catch (error) {
          reject(error);
        }
      }, 1500);
    });
  }

  getRestores(backupId?: string, limit?: number): RestoreRecord[] {
    let restores = [...this.restores];

    if (backupId) {
      restores = restores.filter(r => r.backupId === backupId);
    }

    restores.sort((a, b) =>
      new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    return limit ? restores.slice(0, limit) : restores;
  }

  deleteRecord(id: string): boolean {
    const index = this.records.findIndex(r => r.id === id);
    if (index === -1) {
      return false;
    }

    this.records.splice(index, 1);
    this.saveToStorage();
    return true;
  }

  getStats(): BackupStats {
    const successfulBackups = this.records.filter(r => r.status === BackupStatus.COMPLETED);
    const failedBackups = this.records.filter(r => r.status === BackupStatus.FAILED);
    const totalSize = successfulBackups.reduce((sum, r) => sum + r.size, 0);
    const lastBackup = successfulBackups[0];

    const storageUsed = totalSize;
    const storageTotal = 10000000000000;
    const storagePercentage = (storageUsed / storageTotal) * 100;

    return {
      totalBackups: this.records.length,
      totalSize,
      successfulBackups: successfulBackups.length,
      failedBackups: failedBackups.length,
      lastBackupTime: lastBackup?.startTime,
      storageUsage: {
        used: storageUsed,
        total: storageTotal,
        percentage: storagePercentage
      }
    };
  }

  getNextBackupTime(configId: string): Date | null {
    const config = this.configs.find(c => c.id === configId);
    if (!config || !config.isActive) {
      return null;
    }

    const cronParts = config.schedule.split(' ');
    const hour = parseInt(cronParts[1]);
    const minute = parseInt(cronParts[0]);

    const now = new Date();
    const nextBackup = new Date(now);
    nextBackup.setHours(hour, minute, 0, 0);

    if (nextBackup <= now) {
      nextBackup.setDate(nextBackup.getDate() + 1);
    }

    return nextBackup;
  }

  cleanupOldBackups(): number {
    const now = new Date();
    let deletedCount = 0;

    this.configs.forEach(config => {
      if (!config.isActive || !config.retentionDays) {
        return;
      }

      const cutoffDate = new Date(now.getTime() - config.retentionDays * 24 * 60 * 60 * 1000);

      const toDelete = this.records.filter(r =>
        r.configId === config.id &&
        new Date(r.startTime) < cutoffDate &&
        r.status === BackupStatus.COMPLETED
      );

      toDelete.forEach(record => {
        const index = this.records.findIndex(r => r.id === record.id);
        if (index !== -1) {
          this.records.splice(index, 1);
          deletedCount++;
        }
      });
    });

    if (deletedCount > 0) {
      this.saveToStorage();
    }

    return deletedCount;
  }

  exportBackupConfig(configId: string): string {
    const config = this.configs.find(c => c.id === configId);
    if (!config) {
      throw new Error('Backup configuration not found');
    }

    return JSON.stringify(config, null, 2);
  }

  importBackupConfig(configJson: string): BackupConfig {
    try {
      const config = JSON.parse(configJson);
      return this.createConfig({
        ...config,
        id: undefined as any,
        createdAt: undefined as any
      });
    } catch (error) {
      throw new Error('Invalid backup configuration format');
    }
  }
}

export { BackupService };
export const backupService = new BackupService();
