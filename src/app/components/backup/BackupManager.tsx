/**
 * @file BackupManager - 备份管理组件
 * @description 提供数据备份、恢复和调度管理功能
 * @module components/backup
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-24
 */

import React, { useState, useEffect } from 'react';
import { ModuleCard } from '../ModuleCard';
import { 
  Database, Play, RefreshCw, Trash2, 
  Settings, Plus, Clock, HardDrive, AlertCircle, 
  CheckCircle2, XCircle, Calendar,
  ChevronDown, ChevronUp, Search
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  BackupConfig, BackupRecord, RestoreRecord, BackupStats,
  BackupType, BackupStatus, BackupStorage
} from '../../types/backup';
import { backupService } from '../../services/backupService';

export const BackupManager: React.FC = () => {
  const [configs, setConfigs] = useState<BackupConfig[]>([]);
  const [records, setRecords] = useState<BackupRecord[]>([]);
  const [restores, setRestores] = useState<RestoreRecord[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [selectedConfig, setSelectedConfig] = useState<BackupConfig | null>(null);
  const [showCreateConfig, setShowCreateConfig] = useState(false);
  const [showRecords, setShowRecords] = useState(false);
  const [showRestores, setShowRestores] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [newConfig, setNewConfig] = useState({
    name: '',
    type: BackupType.FULL,
    storage: BackupStorage.LOCAL,
    schedule: '0 2 * * *',
    retentionDays: 30,
    compression: true,
    encryption: false,
    localPath: '/backups',
    includedPaths: '/data,/config,/logs',
    excludedPaths: '/tmp,/cache'
  });

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = () => {
    setConfigs(backupService.getConfigs());
    setRecords(backupService.getRecords());
    setRestores(backupService.getRestores());
    setStats(backupService.getStats());
  };

  const handleCreateBackup = async (configId: string) => {
    setIsBackingUp(true);
    try {
      await backupService.createBackup(configId, 'current-user');
      toast.success('备份创建成功');
      loadData();
    } catch (error) {
      toast.error('备份创建失败');
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleCreateConfig = () => {
    if (!newConfig.name || !newConfig.localPath) {
      toast.error('请填写完整信息');
      return;
    }

    try {
      backupService.createConfig({
        name: newConfig.name,
        type: newConfig.type,
        storage: newConfig.storage,
        schedule: newConfig.schedule,
        retentionDays: newConfig.retentionDays,
        compression: newConfig.compression,
        encryption: newConfig.encryption,
        storageConfig: {
          localPath: newConfig.localPath
        },
        includedPaths: newConfig.includedPaths.split(',').map(p => p.trim()),
        excludedPaths: newConfig.excludedPaths.split(',').map(p => p.trim()),
        isActive: true
      });

      toast.success('备份配置创建成功');
      setShowCreateConfig(false);
      setNewConfig({
        name: '',
        type: BackupType.FULL,
        storage: BackupStorage.LOCAL,
        schedule: '0 2 * * *',
        retentionDays: 30,
        compression: true,
        encryption: false,
        localPath: '/backups',
        includedPaths: '/data,/config,/logs',
        excludedPaths: '/tmp,/cache'
      });
      loadData();
    } catch (error) {
      toast.error('备份配置创建失败');
    }
  };

  const handleDeleteConfig = (configId: string) => {
    if (confirm('确定要删除此备份配置吗？')) {
      backupService.deleteConfig(configId);
      toast.success('备份配置删除成功');
      loadData();
    }
  };

  const handleCleanup = () => {
    const count = backupService.cleanupOldBackups();
    toast.success(`已清理 ${count} 个过期备份`);
    loadData();
  };

  const getBackupTypeLabel = (type: BackupType): string => {
    switch (type) {
      case BackupType.FULL: return '完整备份';
      case BackupType.INCREMENTAL: return '增量备份';
      case BackupType.DIFFERENTIAL: return '差异备份';
      default: return type;
    }
  };

  const getStorageLabel = (storage: BackupStorage): string => {
    switch (storage) {
      case BackupStorage.LOCAL: return '本地存储';
      case BackupStorage.S3: return 'AWS S3';
      case BackupStorage.ALIYUN_OSS: return '阿里云OSS';
      case BackupStorage.FTP: return 'FTP';
      case BackupStorage.SFTP: return 'SFTP';
      default: return storage;
    }
  };

  const getStatusIcon = (status: BackupStatus) => {
    switch (status) {
      case BackupStatus.PENDING: return <Clock size={16} className="text-gray-400" />;
      case BackupStatus.IN_PROGRESS: return <RefreshCw size={16} className="text-blue-400 animate-spin" />;
      case BackupStatus.COMPLETED: return <CheckCircle2 size={16} className="text-green-400" />;
      case BackupStatus.FAILED: return <XCircle size={16} className="text-red-400" />;
      case BackupStatus.CANCELLED: return <AlertCircle size={16} className="text-yellow-400" />;
      default: return <AlertCircle size={16} className="text-gray-400" />;
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const filteredRecords = records.filter(record =>
    record.configName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.storage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <ModuleCard title="备份管理" level={1}>
      <div className="flex flex-col h-[700px] bg-[#2d3748] rounded-lg border border-gray-600 overflow-hidden shadow-2xl">
        
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600 bg-[#374151]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="搜索备份..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-[#4b5563] border border-gray-500 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-colors w-64"
              />
            </div>
            
            <button
              onClick={() => setShowRecords(!showRecords)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                showRecords ? 'bg-blue-600 text-white' : 'bg-[#4b5563] text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Database size={16} />
              备份记录
              {showRecords ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <button
              onClick={() => setShowRestores(!showRestores)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                showRestores ? 'bg-purple-600 text-white' : 'bg-[#4b5563] text-gray-300 hover:bg-gray-600'
              }`}
            >
              <RefreshCw size={16} />
              恢复记录
              {showRestores ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            <button
              onClick={() => setShowStats(!showStats)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                showStats ? 'bg-green-600 text-white' : 'bg-[#4b5563] text-gray-300 hover:bg-gray-600'
              }`}
            >
              <HardDrive size={16} />
              统计信息
              {showStats ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleCleanup}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-all text-sm font-medium"
            >
              <Trash2 size={16} />
              清理过期
            </button>
            <button 
              onClick={() => setShowCreateConfig(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-sm font-medium"
            >
              <Plus size={16} />
              新建配置
            </button>
          </div>
        </div>

        {/* Stats Panel */}
        {showStats && stats && (
          <div className="p-4 border-b border-gray-600 bg-[#374151]/50">
            <div className="grid grid-cols-5 gap-4">
              <div className="bg-[#4b5563] rounded-lg p-4">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <Database size={14} />
                  总备份数
                </div>
                <div className="text-2xl font-bold text-white">{stats.totalBackups}</div>
              </div>
              <div className="bg-[#4b5563] rounded-lg p-4">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <HardDrive size={14} />
                  总存储大小
                </div>
                <div className="text-2xl font-bold text-blue-400">{formatSize(stats.totalSize)}</div>
              </div>
              <div className="bg-[#4b5563] rounded-lg p-4">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <CheckCircle2 size={14} />
                  成功备份
                </div>
                <div className="text-2xl font-bold text-green-400">{stats.successfulBackups}</div>
              </div>
              <div className="bg-[#4b5563] rounded-lg p-4">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <XCircle size={14} />
                  失败备份
                </div>
                <div className="text-2xl font-bold text-red-400">{stats.failedBackups}</div>
              </div>
              <div className="bg-[#4b5563] rounded-lg p-4">
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
                  <Clock size={14} />
                  存储使用率
                </div>
                <div className="text-2xl font-bold text-yellow-400">
                  {stats.storageUsage.percentage.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Records Panel */}
        {showRecords && (
          <div className="p-4 border-b border-gray-600 bg-[#374151]/50 max-h-64 overflow-auto">
            <h4 className="font-bold text-white mb-3 flex items-center gap-2">
              <Database size={16} />
              最近备份记录
            </h4>
            <div className="space-y-2">
              {filteredRecords.slice(0, 5).map(record => (
                <div key={record.id} className="flex items-center gap-3 bg-[#4b5563] rounded-lg p-3 text-sm">
                  <div className="shrink-0">
                    {getStatusIcon(record.status)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white">{record.configName}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(record.startTime).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-medium text-blue-400">{formatSize(record.size)}</div>
                    <div className="text-xs text-gray-400">{record.filesCount} 文件</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Restores Panel */}
        {showRestores && (
          <div className="p-4 border-b border-gray-600 bg-[#374151]/50 max-h-64 overflow-auto">
            <h4 className="font-bold text-white mb-3 flex items-center gap-2">
              <RefreshCw size={16} />
              最近恢复记录
            </h4>
            <div className="space-y-2">
              {restores.slice(0, 5).map(restore => (
                <div key={restore.id} className="flex items-center gap-3 bg-[#4b5563] rounded-lg p-3 text-sm">
                  <div className="shrink-0">
                    {getStatusIcon(restore.status)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-white">{restore.backupName}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(restore.startTime).toLocaleString('zh-CN')}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-medium text-green-400">{restore.filesRestored} 文件</div>
                    <div className="text-xs text-gray-400">{restore.restorePath}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Configs Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-[#374151] sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">配置名称</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">备份类型</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">存储方式</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">计划</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">保留天数</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">最后备份</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-600">
              {configs.map(config => (
                <tr key={config.id} className="hover:bg-[#374151] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Database size={18} className="text-blue-400" />
                      <span className="text-white font-medium">{config.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm">{getBackupTypeLabel(config.type)}</td>
                  <td className="px-4 py-3 text-gray-300 text-sm">{getStorageLabel(config.storage)}</td>
                  <td className="px-4 py-3 text-gray-300 text-sm">
                    <div className="flex items-center gap-1">
                      <Calendar size={14} className="text-gray-500" />
                      {config.schedule}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-sm">{config.retentionDays} 天</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      config.isActive 
                        ? 'bg-green-500/20 text-green-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {config.isActive ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {config.lastBackup 
                      ? new Date(config.lastBackup).toLocaleString('zh-CN')
                      : '从未备份'
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCreateBackup(config.id)}
                        disabled={isBackingUp || !config.isActive}
                        className="p-1.5 hover:bg-green-700 rounded text-gray-400 hover:text-green-400 transition-colors disabled:opacity-50"
                        title="立即备份"
                      >
                        <Play size={14} />
                      </button>
                      <button
                        onClick={() => setSelectedConfig(config)}
                        className="p-1.5 hover:bg-blue-700 rounded text-gray-400 hover:text-blue-400 transition-colors"
                        title="查看详情"
                      >
                        <Settings size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteConfig(config.id)}
                        className="p-1.5 hover:bg-red-700 rounded text-gray-400 hover:text-red-400 transition-colors"
                        title="删除配置"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create Config Modal */}
        {showCreateConfig && (
          <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50" onClick={() => setShowCreateConfig(false)}>
            <div 
              className="bg-[#2d3748] rounded-lg border border-gray-600 max-w-lg w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-600">
                <h3 className="text-lg font-bold text-white">创建备份配置</h3>
                <button 
                  onClick={() => setShowCreateConfig(false)}
                  className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                >
                  <XCircle size={20} />
                </button>
              </div>
              <div className="p-4 space-y-4 max-h-[60vh] overflow-auto">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">配置名称</label>
                  <input 
                    type="text" 
                    value={newConfig.name}
                    onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                    className="w-full bg-[#4b5563] border border-gray-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                    placeholder="请输入配置名称"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">备份类型</label>
                    <select 
                      value={newConfig.type}
                      onChange={(e) => setNewConfig({ ...newConfig, type: e.target.value as BackupType })}
                      className="w-full bg-[#4b5563] border border-gray-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                    >
                      {Object.values(BackupType).map(type => (
                        <option key={type} value={type}>{getBackupTypeLabel(type)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">存储方式</label>
                    <select 
                      value={newConfig.storage}
                      onChange={(e) => setNewConfig({ ...newConfig, storage: e.target.value as BackupStorage })}
                      className="w-full bg-[#4b5563] border border-gray-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                    >
                      {Object.values(BackupStorage).map(storage => (
                        <option key={storage} value={storage}>{getStorageLabel(storage)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">备份计划 (Cron)</label>
                    <input 
                      type="text" 
                      value={newConfig.schedule}
                      onChange={(e) => setNewConfig({ ...newConfig, schedule: e.target.value })}
                      className="w-full bg-[#4b5563] border border-gray-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                      placeholder="0 2 * * *"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">保留天数</label>
                    <input 
                      type="number" 
                      value={newConfig.retentionDays}
                      onChange={(e) => setNewConfig({ ...newConfig, retentionDays: parseInt(e.target.value) })}
                      className="w-full bg-[#4b5563] border border-gray-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                      min="1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">本地存储路径</label>
                  <input 
                    type="text" 
                    value={newConfig.localPath}
                    onChange={(e) => setNewConfig({ ...newConfig, localPath: e.target.value })}
                    className="w-full bg-[#4b5563] border border-gray-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                    placeholder="/backups"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">包含路径 (逗号分隔)</label>
                    <input 
                      type="text" 
                      value={newConfig.includedPaths}
                      onChange={(e) => setNewConfig({ ...newConfig, includedPaths: e.target.value })}
                      className="w-full bg-[#4b5563] border border-gray-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                      placeholder="/data,/config"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">排除路径 (逗号分隔)</label>
                    <input 
                      type="text" 
                      value={newConfig.excludedPaths}
                      onChange={(e) => setNewConfig({ ...newConfig, excludedPaths: e.target.value })}
                      className="w-full bg-[#4b5563] border border-gray-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                      placeholder="/tmp,/cache"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newConfig.compression}
                      onChange={(e) => setNewConfig({ ...newConfig, compression: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-gray-300">启用压缩</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newConfig.encryption}
                      onChange={(e) => setNewConfig({ ...newConfig, encryption: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm text-gray-300">启用加密</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 p-4 border-t border-gray-600">
                <button 
                  onClick={() => setShowCreateConfig(false)}
                  className="px-4 py-2 bg-[#4b5563] hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={handleCreateConfig}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Config Detail Modal */}
        {selectedConfig && (
          <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50" onClick={() => setSelectedConfig(null)}>
            <div 
              className="bg-[#2d3748] rounded-lg border border-gray-600 max-w-lg w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-600">
                <h3 className="text-lg font-bold text-white">配置详情</h3>
                <button 
                  onClick={() => setSelectedConfig(null)}
                  className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                >
                  <XCircle size={20} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#4b5563] rounded-lg p-3">
                    <label className="block text-xs text-gray-400 mb-1">配置名称</label>
                    <div className="text-sm font-medium text-white">{selectedConfig.name}</div>
                  </div>
                  <div className="bg-[#4b5563] rounded-lg p-3">
                    <label className="block text-xs text-gray-400 mb-1">备份类型</label>
                    <div className="text-sm font-medium text-blue-400">{getBackupTypeLabel(selectedConfig.type)}</div>
                  </div>
                  <div className="bg-[#4b5563] rounded-lg p-3">
                    <label className="block text-xs text-gray-400 mb-1">存储方式</label>
                    <div className="text-sm font-medium text-purple-400">{getStorageLabel(selectedConfig.storage)}</div>
                  </div>
                  <div className="bg-[#4b5563] rounded-lg p-3">
                    <label className="block text-xs text-gray-400 mb-1">保留天数</label>
                    <div className="text-sm font-medium text-green-400">{selectedConfig.retentionDays} 天</div>
                  </div>
                </div>
                <div className="bg-[#4b5563] rounded-lg p-3">
                  <label className="block text-xs text-gray-400 mb-2">备份计划</label>
                  <div className="text-sm font-medium text-white">{selectedConfig.schedule}</div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#4b5563] rounded-lg p-3">
                    <label className="block text-xs text-gray-400 mb-2">包含路径</label>
                    <div className="text-xs text-gray-300 space-y-1">
                      {selectedConfig.includedPaths.map((path, idx) => (
                        <div key={idx} className="bg-[#374151] px-2 py-1 rounded">{path}</div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-[#4b5563] rounded-lg p-3">
                    <label className="block text-xs text-gray-400 mb-2">排除路径</label>
                    <div className="text-xs text-gray-300 space-y-1">
                      {selectedConfig.excludedPaths.map((path, idx) => (
                        <div key={idx} className="bg-[#374151] px-2 py-1 rounded">{path}</div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${selectedConfig.compression ? 'bg-green-400' : 'bg-gray-500'}`} />
                    <span className="text-sm text-gray-300">压缩</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${selectedConfig.encryption ? 'bg-green-400' : 'bg-gray-500'}`} />
                    <span className="text-sm text-gray-300">加密</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${selectedConfig.isActive ? 'bg-green-400' : 'bg-red-400'}`} />
                    <span className="text-sm text-gray-300">{selectedConfig.isActive ? '启用' : '禁用'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModuleCard>
  );
};
