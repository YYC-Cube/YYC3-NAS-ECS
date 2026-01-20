import React, { useState, useEffect } from 'react';
import { ModuleCard } from '../ModuleCard';
import { api } from '../../services/api-v2';
import {
  Globe,
  Database,
  Activity,
  Network,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Server,
  HardDrive,
  Cpu,
  MemoryStick,
  Settings,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';

interface DDNSStatus {
  running: boolean;
  enabled: boolean;
  provider: string;
  domain: string;
  currentIP: string;
  expectedIP: string;
  lastUpdate: string;
  nextUpdate: number;
  updateInterval: number;
  status: string;
  message: string;
}

interface NASVolume {
  id: string;
  name: string;
  type: string;
  capacity: string;
  used: string;
  available: string;
  usagePercent: number;
  status: string;
}

interface NASStatus {
  system: {
    uptime: string;
    cpuUsage: number;
    memoryUsage: number;
    temperature: string;
  };
  volumes: NASVolume[];
  services: Array<{
    name: string;
    status: string;
    uptime: string;
  }>;
}

interface SystemStats {
  cpu: {
    usage: number;
    cores: number;
    model: string;
  };
  memory: {
    total: number;
    used: number;
    available: number;
    percent: number;
  };
  disk: {
    total: number;
    used: number;
    available: number;
    percent: number;
  };
  network: {
    bytesSent: number;
    bytesRecv: number;
    packetsSent: number;
    packetsRecv: number;
  };
  loadAverage: number[];
  uptime: number;
}

interface Process {
  pid: number;
  name: string;
  username: string;
  cpu_percent: number;
  memory_percent: number;
}

interface FRPProxy {
  id: string;
  name: string;
  type: string;
  localIP: string;
  localPort: number;
  subdomain: string;
  enabled: boolean;
  status: string;
}

interface FRPStatus {
  client: {
    running: boolean;
    connected: boolean;
    serverAddr: string;
    serverPort: number;
    proxyCount: number;
    uptime: string;
  };
  proxies: FRPProxy[];
  timestamp: string;
}

export const APIModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ddns' | 'nas' | 'monitoring' | 'frp'>('ddns');
  const [loading, setLoading] = useState(false);

  const [ddnsStatus, setDDNSStatus] = useState<DDNSStatus | null>(null);
  const [nasStatus, setNASStatus] = useState<NASStatus | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [frpStatus, setFRPStatus] = useState<FRPStatus | null>(null);

  const [error, setError] = useState<string | null>(null);

  const fetchDDNSStatus = async () => {
    try {
      setLoading(true);
      const response = await api.ddns.getStatus();
      if (response.success) {
        setDDNSStatus(response.data);
      } else {
        setError('获取DDNS状态失败');
      }
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
      const response = await api.nas.getStatus();
      if (response.success) {
        setNASStatus(response.data);
      } else {
        setError('获取NAS状态失败');
      }
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
      const response = await api.monitoring.getStats();
      if (response.success) {
        setSystemStats(response.data);
      } else {
        setError('获取系统监控数据失败');
      }
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
      const response = await api.monitoring.getProcesses(20, 'cpu');
      if (response.success) {
        setProcesses(response.data.processes);
      } else {
        setError('获取进程列表失败');
      }
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
      const response = await api.frp.getStatus();
      if (response.success) {
        setFRPStatus(response.data);
      } else {
        setError('获取FRP状态失败');
      }
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
              <span className="text-sm font-medium text-gray-600">运行状态</span>
              {ddnsStatus.running ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            <p className="text-2xl font-bold text-gray-800">
              {ddnsStatus.running ? '运行中' : '已停止'}
            </p>
          </div>

          <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">服务提供商</span>
              <Globe className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{ddnsStatus.provider}</p>
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
            <p className="text-lg font-bold text-gray-800">{ddnsStatus.currentIP}</p>
          </div>
        </div>

        <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">状态信息</span>
            {ddnsStatus.status === 'success' ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertCircle className="w-5 h-5 text-yellow-500" />
            )}
          </div>
          <p className="text-gray-700">{ddnsStatus.message}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">上次更新</span>
              <Clock className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-gray-700">{new Date(ddnsStatus.lastUpdate).toLocaleString()}</p>
          </div>

          <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">更新间隔</span>
              <RefreshCw className="w-5 h-5 text-gray-500" />
            </div>
            <p className="text-gray-700">{ddnsStatus.updateInterval} 秒</p>
          </div>
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
              <span className="text-sm font-medium text-gray-600">系统运行时间</span>
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-lg font-bold text-gray-800">{nasStatus.system.uptime}</p>
          </div>

          <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">CPU使用率</span>
              <Cpu className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{nasStatus.system.cpuUsage}%</p>
          </div>

          <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">内存使用率</span>
              <MemoryStick className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-gray-800">{nasStatus.system.memoryUsage}%</p>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4 flex items-center">
            <HardDrive className="w-5 h-5 mr-2" />
            存储卷
          </h4>
          <div className="space-y-3">
            {nasStatus.volumes.map((volume) => (
              <div key={volume.id} className="bg-white/50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{volume.name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    volume.status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {volume.status}
                  </span>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>{volume.used} / {volume.capacity}</span>
                    <span>{volume.usagePercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        volume.usagePercent > 80 ? 'bg-red-500' :
                        volume.usagePercent > 60 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${volume.usagePercent}%` }}
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  可用空间: {volume.available}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4 flex items-center">
            <Server className="w-5 h-5 mr-2" />
            服务状态
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {nasStatus.services.map((service, index) => (
              <div key={index} className="bg-white/50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">{service.name}</span>
                  <div className="flex items-center space-x-2">
                    {service.status === 'running' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span className="text-sm text-gray-600">{service.uptime}</span>
                  </div>
                </div>
              </div>
            ))}
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
            <p className="text-3xl font-bold text-gray-800">{systemStats.cpu.usage}%</p>
            <p className="text-sm text-gray-600 mt-1">{systemStats.cpu.cores} 核心</p>
          </div>

          <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">内存使用率</span>
              <MemoryStick className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{systemStats.memory.percent}%</p>
            <p className="text-sm text-gray-600 mt-1">
              {(systemStats.memory.used / 1024).toFixed(2)} GB / {(systemStats.memory.total / 1024).toFixed(2)} GB
            </p>
          </div>

          <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">磁盘使用率</span>
              <HardDrive className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{systemStats.disk.percent}%</p>
            <p className="text-sm text-gray-600 mt-1">
              {(systemStats.disk.used / 1024).toFixed(2)} GB / {(systemStats.disk.total / 1024).toFixed(2)} GB
            </p>
          </div>

          <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">系统负载</span>
              <Activity className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex space-x-2">
              {systemStats.loadAverage.map((load, index) => (
                <span key={index} className="text-lg font-bold text-gray-800">
                  {load.toFixed(2)}
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-600 mt-1">1分钟 / 5分钟 / 15分钟</p>
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
                {(systemStats.network.bytesSent / 1024 / 1024).toFixed(2)} MB
              </p>
              <p className="text-sm text-gray-600">{systemStats.network.packetsSent} 数据包</p>
            </div>
            <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
              <p className="text-sm font-medium text-gray-600 mb-2">接收</p>
              <p className="text-xl font-bold text-gray-800">
                {(systemStats.network.bytesRecv / 1024 / 1024).toFixed(2)} MB
              </p>
              <p className="text-sm text-gray-600">{systemStats.network.packetsRecv} 数据包</p>
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
                    <td className="px-4 py-3 text-sm text-gray-600">{process.username}</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{process.cpu_percent}%</td>
                    <td className="px-4 py-3 text-sm text-gray-800">{process.memory_percent}%</td>
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
              {frpStatus.client.running ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>
            <p className="text-xl font-bold text-gray-800">
              {frpStatus.client.running ? '运行中' : '已停止'}
            </p>
          </div>

          <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">服务器连接</span>
              <Network className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-lg font-bold text-gray-800">
              {frpStatus.client.serverAddr}:{frpStatus.client.serverPort}
            </p>
          </div>

          <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600">隧道数量</span>
              <Server className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{frpStatus.client.proxyCount}</p>
          </div>
        </div>

        <div className="bg-white/50 rounded-lg p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-600">运行时间</span>
            <Clock className="w-5 h-5 text-gray-500" />
          </div>
          <p className="text-xl font-bold text-gray-800">{frpStatus.client.uptime}</p>
        </div>

        <div>
          <h4 className="text-lg font-semibold mb-4 flex items-center">
            <Network className="w-5 h-5 mr-2" />
            隧道配置
          </h4>
          <div className="space-y-3">
            {frpStatus.proxies.map((proxy) => (
              <div key={proxy.id} className="bg-white/50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-800">{proxy.name}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      proxy.type === 'http' ? 'bg-blue-100 text-blue-800' :
                      proxy.type === 'https' ? 'bg-green-100 text-green-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {proxy.type.toUpperCase()}
                    </span>
                    {proxy.enabled ? (
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
                    <span className="font-medium">本地地址:</span> {proxy.localIP}:{proxy.localPort}
                  </div>
                  <div>
                    <span className="font-medium">子域名:</span> {proxy.subdomain}
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
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 transition-colors ${
              activeTab === 'ddns'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Globe className="w-5 h-5" />
            <span>DDNS</span>
          </button>
          <button
            onClick={() => setActiveTab('nas')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 transition-colors ${
              activeTab === 'nas'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Database className="w-5 h-5" />
            <span>NAS</span>
          </button>
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 transition-colors ${
              activeTab === 'monitoring'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span>监控</span>
          </button>
          <button
            onClick={() => setActiveTab('frp')}
            className={`flex items-center space-x-2 py-4 px-1 border-b-2 transition-colors ${
              activeTab === 'frp'
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
