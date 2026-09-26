/**
 * @file APIModule - API服务管理模块
 * @description 提供API接口文档、测试和监控功能
 * @module components/api
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-24
 */

import {
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  Cpu,
  Database,
  Globe,
  HardDrive,
  MemoryStick,
  Network,
  RefreshCw,
  Server,
  Settings,
  ToggleLeft,
  ToggleRight,
  XCircle
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { api } from '../../services/api-v2';
import type {
  DdnsStatus,
  FrpConfig,
  FrpStatus,
  NasStatus,
  NasVolume,
  ProcessInfo,
  SystemStats
} from '../../types';
import { ModuleCard } from '../ModuleCard';

/** DDNS 同步状态中文映射 */
const DDNS_STATUS_TEXT: Record<DdnsStatus['status'], string> = {
  success: '同步成功',
  error: '同步失败',
  pending: '同步中'
};

/** 字节数格式化（自动选择 B/KB/MB/GB 单位） */
const formatBytes = (bytes: number): string => {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(2)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${bytes} B`;
};

/** 运行时长格式化（秒 → 「x天 x小时 x分」） */
const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}天 ${hours}小时 ${minutes}分`;
  if (hours > 0) return `${hours}小时 ${minutes}分`;
  return `${minutes}分`;
};

export const APIModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ddns' | 'nas' | 'monitoring' | 'frp'>('ddns');
  const [loading, setLoading] = useState(false);

  const [ddnsStatus, setDDNSStatus] = useState<DdnsStatus | null>(null);
  const [nasStatus, setNASStatus] = useState<NasStatus | null>(null);
  const [nasVolumes, setNASVolumes] = useState<NasVolume[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [processes, setProcesses] = useState<ProcessInfo[]>([]);
  const [frpStatus, setFRPStatus] = useState<FrpStatus | null>(null);
  const [frpConfigs, setFRPConfigs] = useState<FrpConfig[]>([]);

  const [error, setError] = useState<string | null>(null);

  const fetchDDNSStatus = async () => {
    try {
      setLoading(true);
      const status = await api.ddns.getStatus();
      setDDNSStatus(status);
    } catch (err) {
      setError('DDNS服务请求失败');
      console.error('DDNS error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchNASStatus = async () => {
    try {
      setLoading(true);
      const [status, volumes] = await Promise.all([
        api.nas.getStatus(),
        api.nas.getVolumes()
      ]);
      setNASStatus(status);
      setNASVolumes(volumes);
    } catch (err) {
      setError('NAS服务请求失败');
      console.error('NAS error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStats = async () => {
    try {
      setLoading(true);
      const stats = await api.monitoring.getStats();
      setSystemStats(stats);
    } catch (err) {
      setError('系统监控请求失败');
      console.error('Monitoring error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProcesses = async () => {
    try {
      setLoading(true);
      const list = await api.monitoring.getProcesses(20, 'cpu');
      setProcesses(list);
    } catch (err) {
      setError('进程列表请求失败');
      console.error('Processes error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFRPStatus = async () => {
    try {
      setLoading(true);
      const [status, configs] = await Promise.all([
        api.frp.getStatus(),
        api.frp.getConfigs()
      ]);
      setFRPStatus(status);
      setFRPConfigs(configs);
    } catch (err) {
      setError('FRP服务请求失败');
      console.error('FRP error:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    switch (activeTab) {
      case 'ddns':
        fetchDDNSStatus();
        break;
      case 'nas':
        fetchNASStatus();
        break;
      case 'monitoring':
        fetchSystemStats();
        fetchProcesses();
        break;
      case 'frp':
        fetchFRPStatus();
        break;
    }
  };

  useEffect(() => {
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'ddns':
        return renderDDNSContent();
      case 'nas':
        return renderNASContent();
      case 'monitoring':
        return renderMonitoringContent();
      case 'frp':
        return renderFRPContent();
      default:
        return null;
    }
  };

  const renderDDNSContent = () => {
    if (!ddnsStatus) {
      return (
        <div className="text-center py-12">
          <Globe className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">加载DDNS状态中...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">服务状态</span>
              {ddnsStatus.enabled ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {ddnsStatus.enabled ? '已启用' : '已停用'}
            </p>
          </div>

          <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">域名</span>
              <Server className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-lg font-bold text-gray-800">{ddnsStatus.domain}</p>
          </div>

          <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">当前IP</span>
              <Network className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-lg font-bold text-gray-800">{ddnsStatus.currentIp}</p>
          </div>

          <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">同步状态</span>
              <Globe className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {DDNS_STATUS_TEXT[ddnsStatus.status]}
            </p>
          </div>
        </div>

        <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">上次更新</span>
            <Clock className="w-5 h-5 text-gray-500" />
          </div>
          <p className="text-gray-700">{new Date(ddnsStatus.lastUpdate).toLocaleString()}</p>
        </div>
      </div>
    );
  };

  const renderNASContent = () => {
    if (!nasStatus) {
      return (
        <div className="text-center py-12">
          <Database className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">加载NAS状态中...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">服务状态</span>
              {nasStatus.running ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            <p className="text-lg font-bold text-gray-800">
              {nasStatus.running ? '运行中' : '已停止'}
            </p>
          </div>

          <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">系统运行时间</span>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-lg font-bold text-gray-800">{formatUptime(nasStatus.uptime)}</p>
          </div>

          <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">活跃连接</span>
              <Network className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{nasStatus.activeConnections}</p>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4 flex items-center">
            <HardDrive className="w-5 h-5 mr-2" />
            存储卷
          </h4>
          <div className="space-y-3">
            {nasVolumes.map((volume) => {
              const usagePercent = volume.total > 0 ? (volume.used / volume.total) * 100 : 0;
              return (
                <div key={volume.id} className="bg-white/50 rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-800">{volume.name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${volume.health === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {volume.health === 'healthy' ? '健康' : '异常'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-2">{volume.mountPoint}</p>
                  <div className="mb-2">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{formatBytes(volume.used)} / {formatBytes(volume.total)}</span>
                      <span>{usagePercent.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${usagePercent > 80 ? 'bg-red-500' :
                          usagePercent > 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    可用空间: {formatBytes(volume.available)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderMonitoringContent = () => {
    if (!systemStats) {
      return (
        <div className="text-center py-12">
          <Activity className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">加载系统监控数据中...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">CPU使用率</span>
              <Cpu className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{systemStats.cpuUsage}%</p>
          </div>

          <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">内存使用率</span>
              <MemoryStick className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{systemStats.memoryUsage}%</p>
          </div>

          <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">磁盘使用率</span>
              <HardDrive className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{systemStats.diskUsage}%</p>
          </div>

          <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">系统运行时间</span>
              <Clock className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-xl font-bold text-gray-800">{formatUptime(systemStats.uptime)}</p>
            <p className="text-sm text-gray-600 mt-1">
              采样时间: {new Date(systemStats.timestamp).toLocaleString()}
            </p>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            网络流量
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-medium text-gray-600 mb-2">发送</p>
              <p className="text-xl font-bold text-gray-800">
                {formatBytes(systemStats.networkOut)}
              </p>
            </div>
            <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-medium text-gray-600 mb-2">接收</p>
              <p className="text-xl font-bold text-gray-800">
                {formatBytes(systemStats.networkIn)}
              </p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            进程列表 (Top 20)
          </h4>
          <div className="bg-white/50 rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">PID</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">名称</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">用户</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">CPU %</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">内存 %</th>
                </tr>
              </thead>
              <tbody>
                {processes.map((process, index) => (
                  <tr key={index} className="border-t border-gray-200">
                    <td className="px-4 py-3 text-sm text-gray-800">{process.pid}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{process.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{process.user}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{process.cpu}%</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{process.memory}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderFRPContent = () => {
    if (!frpStatus) {
      return (
        <div className="text-center py-12">
          <Network className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-500">加载FRP状态中...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">客户端状态</span>
              {frpStatus.running ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            <p className="text-xl font-bold text-gray-800">
              {frpStatus.running ? '运行中' : '已停止'}
            </p>
          </div>

          <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">活跃连接</span>
              <Network className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-lg font-bold text-gray-800">{frpStatus.connections ?? 0}</p>
          </div>

          <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">隧道数量</span>
              <Server className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{frpConfigs.length}</p>
          </div>
        </div>

        <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">运行时间</span>
            <Clock className="w-5 h-5 text-gray-500" />
          </div>
          <p className="text-xl font-bold text-gray-800">{formatUptime(frpStatus.uptime ?? 0)}</p>
          {frpStatus.lastError && (
            <p className="mt-2 text-sm text-red-600">最近错误: {frpStatus.lastError}</p>
          )}
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4 flex items-center">
            <Network className="w-5 h-5 mr-2" />
            隧道配置
          </h4>
          <div className="space-y-3">
            {frpConfigs.map((proxy) => (
              <div key={proxy.id} className="bg-white/50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-800">{proxy.name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${proxy.type === 'http' ? 'bg-blue-100 text-blue-800' :
                      proxy.type === 'https' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                      {proxy.type.toUpperCase()}
                    </span>
                    {proxy.status === 'running' ? (
                      <ToggleRight className="w-5 h-5 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {proxy.status === 'running' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <button className="p-2 hover:bg-gray-200 rounded">
                      <Settings className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">本地地址:</span> {proxy.localIp}:{proxy.localPort}
                  </div>
                  <div>
                    <span className="font-medium">远程端口:</span> {proxy.remotePort}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">API 网关管理</h2>
        <button
          onClick={refreshData}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>刷新</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('ddns')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 transition-colors ${activeTab === 'ddns'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <Globe className="w-5 h-5" />
            <span>DDNS</span>
          </button>
          <button
            onClick={() => setActiveTab('nas')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 transition-colors ${activeTab === 'nas'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <Database className="w-5 h-5" />
            <span>NAS</span>
          </button>
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 transition-colors ${activeTab === 'monitoring'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <Activity className="w-5 h-5" />
            <span>监控</span>
          </button>
          <button
            onClick={() => setActiveTab('frp')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 transition-colors ${activeTab === 'frp'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            <Network className="w-5 h-5" />
            <span>FRP</span>
          </button>
        </nav>
      </div>

      <ModuleCard title={activeTab === 'ddns' ? 'DDNS 服务' :
        activeTab === 'nas' ? 'NAS 服务' :
          activeTab === 'monitoring' ? '系统监控' : 'FRP 服务'} level={1}>
        {renderTabContent()}
      </ModuleCard>
    </div>
  );
};
