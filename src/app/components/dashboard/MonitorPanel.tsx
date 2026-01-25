/**
 * @file MonitorPanel - 实时监控面板组件
 * @description 提供系统实时监控功能，包括CPU、内存、磁盘、网络等核心指标展示
 * @module components/dashboard
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-24
 */

import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Link, Activity, Cpu, Shield, HardDrive, MemoryStick, Server, RefreshCw, AlertCircle } from 'lucide-react';
import { StatCard } from './StatCard';
import { useWebSocket } from '../../hooks/useWebSocket';
import { ModuleCard } from '../ModuleCard';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';

export const MonitorPanel: React.FC = () => {
  const { data: stats, chartData, monitoringData, isConnected, connectionMode } = useWebSocket('ws://mock');
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'processes' | 'services'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const getConnectionModeBadge = () => {
    switch (connectionMode) {
      case 'websocket':
        return <Badge variant="default" className="bg-green-100 text-green-800">WebSocket实时</Badge>;
      case 'polling':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">HTTP轮询</Badge>;
      case 'mock':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">模拟数据</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold" style={{ color: 'var(--module-cpu-dark)' }}>实时监控</h2>
          {getConnectionModeBadge()}
          {isConnected && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              已连接
            </div>
          )}
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={refreshing}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          刷新
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            概览
          </TabsTrigger>
          <TabsTrigger value="resources" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            系统资源
          </TabsTrigger>
          <TabsTrigger value="processes" className="flex items-center gap-2">
            <Cpu className="h-4 w-4" />
            进程列表
          </TabsTrigger>
          <TabsTrigger value="services" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            服务状态
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              title="活跃连接" 
              value={stats.connections} 
              icon={Link} 
              color="blue" 
            />
            <StatCard 
              title="网络流量" 
              value={stats.traffic} 
              unit="MB" 
              icon={Activity} 
              color="green" 
            />
            <StatCard 
              title="系统负载" 
              value={stats.load} 
              unit="%" 
              icon={Cpu} 
              color="orange" 
            />
            <StatCard 
              title="安全威胁" 
              value={stats.threats} 
              icon={Shield} 
              color="red" 
            />
          </div>

          <ModuleCard title="实时网络流量" level={1}>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--module-cpu-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--module-cpu-primary)" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.1)" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12, fill: '#666' }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#666' }} 
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.9)',
                      border: '1px solid var(--module-cpu-primary)',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="var(--module-cpu-primary)" 
                    fillOpacity={1} 
                    fill="url(#colorTraffic)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </ModuleCard>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          {monitoringData ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ModuleCard title="CPU使用率" level={2}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold" style={{ color: 'var(--module-cpu-dark)' }}>
                        {monitoringData.cpu.percent.toFixed(1)}%
                      </span>
                      <Cpu className="h-8 w-8" style={{ color: 'var(--module-cpu-primary)' }} />
                    </div>
                    <Progress value={monitoringData.cpu.percent} className="h-2" />
                    <div className="text-sm text-gray-600">
                      核心: {monitoringData.cpu.cores} | 频率: {monitoringData.cpu.model}
                    </div>
                  </div>
                </ModuleCard>

                <ModuleCard title="内存使用率" level={2}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold" style={{ color: 'var(--module-memory-dark)' }}>
                        {monitoringData.memory.percent.toFixed(1)}%
                      </span>
                      <MemoryStick className="h-8 w-8" style={{ color: 'var(--module-memory-primary)' }} />
                    </div>
                    <Progress value={monitoringData.memory.percent} className="h-2" />
                    <div className="text-sm text-gray-600">
                      已用: {formatBytes(monitoringData.memory.used)} / 总量: {formatBytes(monitoringData.memory.total)}
                    </div>
                  </div>
                </ModuleCard>

                <ModuleCard title="磁盘使用率" level={2}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold" style={{ color: 'var(--module-storage-dark)' }}>
                        {monitoringData.disk.percent.toFixed(1)}%
                      </span>
                      <HardDrive className="h-8 w-8" style={{ color: 'var(--module-storage-primary)' }} />
                    </div>
                    <Progress value={monitoringData.disk.percent} className="h-2" />
                    <div className="text-sm text-gray-600">
                      已用: {formatBytes(monitoringData.disk.used)} / 总量: {formatBytes(monitoringData.disk.total)}
                    </div>
                  </div>
                </ModuleCard>

                <ModuleCard title="网络流量" level={2}>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-3xl font-bold" style={{ color: 'var(--module-network-dark)' }}>
                        {formatBytes(monitoringData.network.bytesRecv)}
                      </span>
                      <Activity className="h-8 w-8" style={{ color: 'var(--module-network-primary)' }} />
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div>接收: {formatBytes(monitoringData.network.bytesRecv)}</div>
                      <div>发送: {formatBytes(monitoringData.network.bytesSent)}</div>
                    </div>
                  </div>
                </ModuleCard>
              </div>

              {monitoringData.loadAverage && monitoringData.loadAverage.length > 0 && (
                <ModuleCard title="系统负载" level={1}>
                  <div className="grid grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold" style={{ color: 'var(--module-cpu-dark)' }}>
                        {monitoringData.loadAverage[0]?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-sm text-gray-600 mt-2">1分钟</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold" style={{ color: 'var(--module-cpu-dark)' }}>
                        {monitoringData.loadAverage[1]?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-sm text-gray-600 mt-2">5分钟</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold" style={{ color: 'var(--module-cpu-dark)' }}>
                        {monitoringData.loadAverage[2]?.toFixed(2) || '0.00'}
                      </div>
                      <div className="text-sm text-gray-600 mt-2">15分钟</div>
                    </div>
                  </div>
                </ModuleCard>
              )}
            </>
          ) : (
            <ModuleCard title="系统资源" level={1}>
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <AlertCircle className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-gray-500">正在加载系统资源数据...</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {connectionMode === 'mock' ? '当前使用模拟数据模式' : '连接到后端监控服务'}
                  </p>
                </div>
              </div>
            </ModuleCard>
          )}
        </TabsContent>

        <TabsContent value="processes" className="space-y-6">
          <ModuleCard title="进程列表 (Top 20)" level={1}>
            <div className="text-center py-12">
              <Server className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">进程列表功能开发中...</p>
              <p className="text-sm text-gray-400 mt-2">
                将显示CPU和内存使用率最高的20个进程
              </p>
            </div>
          </ModuleCard>
        </TabsContent>

        <TabsContent value="services" className="space-y-6">
          <ModuleCard title="服务状态" level={1}>
            <div className="text-center py-12">
              <Shield className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">服务状态监控功能开发中...</p>
              <p className="text-sm text-gray-400 mt-2">
                将显示nginx、postgres、redis、api等服务的运行状态
              </p>
            </div>
          </ModuleCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};
