/**
 * @file DDNSService组件
 * @description 处理DDNS服务的配置、状态监控和管理功能
 * @component DDNSService
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-30
 */

import React, { useState, useEffect } from 'react';
import { ModuleCard } from '../ModuleCard';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Play, Square, RefreshCw, Logs, Activity, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';

interface DDNSStatus {
  running: boolean;
  serviceStatus?: {
    active: boolean;
    enabled: boolean;
    lastTriggered?: string;
  };
  timerStatus?: {
    active: boolean;
    enabled: boolean;
    lastTriggered?: string;
    nextTrigger?: string;
  };
  domain?: string;
  ip?: string;
  error?: string;
}

interface MonitorStatus {
  running: boolean;
  serviceStatus?: {
    active: boolean;
    enabled: boolean;
    lastTriggered?: string;
  };
  timerStatus?: {
    active: boolean;
    enabled: boolean;
    lastTriggered?: string;
    nextTrigger?: string;
  };
  lastCheck?: {
    timestamp: string;
    result: boolean;
    message?: string;
  };
  error?: string;
}

interface ReportStatus {
  running: boolean;
  serviceStatus?: {
    active: boolean;
    enabled: boolean;
    lastTriggered?: string;
  };
  timerStatus?: {
    active: boolean;
    enabled: boolean;
    lastTriggered?: string;
    nextTrigger?: string;
  };
  lastReport?: string;
  error?: string;
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  service: 'ddns' | 'monitor' | 'report';
}

export const DDNSService: React.FC = () => {
  const [ddnsStatus, setDDNSStatus] = useState<DDNSStatus>({ running: false });
  const [monitorStatus, setMonitorStatus] = useState<MonitorStatus>({ running: false });
  const [reportStatus, setReportStatus] = useState<ReportStatus>({ running: false });
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 模拟从服务器加载状态
  useEffect(() => {
    loadStatus();
    loadLogs();
    const interval = setInterval(() => {
      loadStatus();
      loadLogs();
    }, 10000); // 每10秒刷新一次状态

    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      // 实际项目中，这里应该是API请求来获取服务状态
      const ddnsResponse = await fetch('/api/ddns/status');
      const monitorResponse = await fetch('/api/ddns/monitor/status');
      const reportResponse = await fetch('/api/ddns/report/status');

      if (ddnsResponse.ok) {
        const status = await ddnsResponse.json();
        setDDNSStatus(status);
      }

      if (monitorResponse.ok) {
        const status = await monitorResponse.json();
        setMonitorStatus(status);
      }

      if (reportResponse.ok) {
        const status = await reportResponse.json();
        setReportStatus(status);
      }
    } catch (error) {
      // 模拟状态数据
      setDDNSStatus({
        running: true,
        serviceStatus: { active: true, enabled: true, lastTriggered: '2025-01-30 10:15:30' },
        timerStatus: { active: true, enabled: true, lastTriggered: '2025-01-30 10:15:30', nextTrigger: '2025-01-30 10:20:30' },
        domain: 'nas.0379.email',
        ip: '8.152.195.33'
      });

      setMonitorStatus({
        running: true,
        serviceStatus: { active: true, enabled: true, lastTriggered: '2025-01-30 10:00:00' },
        timerStatus: { active: true, enabled: true, lastTriggered: '2025-01-30 10:00:00', nextTrigger: '2025-01-30 10:30:00' },
        lastCheck: {
          timestamp: '2025-01-30 10:00:00',
          result: true,
          message: 'All checks passed'
        }
      });

      setReportStatus({
        running: true,
        serviceStatus: { active: true, enabled: true, lastTriggered: '2025-01-30 00:00:00' },
        timerStatus: { active: true, enabled: true, lastTriggered: '2025-01-30 00:00:00', nextTrigger: '2025-01-31 00:00:00' },
        lastReport: '2025-01-30 00:00:00'
      });
    }
  };

  const loadLogs = async () => {
    try {
      // 实际项目中，这里应该是API请求来获取日志
      const response = await fetch('/api/ddns/logs');
      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
      }
    } catch (error) {
      // 模拟日志数据
      setLogs([
        { timestamp: '2025-01-30 10:15:30', level: 'success', message: 'DDNS update successful: nas.0379.email -> 8.152.195.33', service: 'ddns' },
        { timestamp: '2025-01-30 10:00:00', level: 'info', message: 'Monitor check passed: DNS resolution, HTTP service, system resources', service: 'monitor' },
        { timestamp: '2025-01-30 09:50:30', level: 'success', message: 'DDNS update successful: nas.0379.email -> 8.152.195.33', service: 'ddns' },
        { timestamp: '2025-01-30 09:40:30', level: 'success', message: 'DDNS update successful: nas.0379.email -> 8.152.195.33', service: 'ddns' },
        { timestamp: '2025-01-30 09:30:30', level: 'success', message: 'DDNS update successful: nas.0379.email -> 8.152.195.33', service: 'ddns' },
        { timestamp: '2025-01-30 09:20:00', level: 'info', message: 'Monitor check passed: DNS resolution, HTTP service, system resources', service: 'monitor' },
        { timestamp: '2025-01-30 09:20:30', level: 'success', message: 'DDNS update successful: nas.0379.email -> 8.152.195.33', service: 'ddns' },
        { timestamp: '2025-01-30 00:00:00', level: 'info', message: 'Daily report generated and sent', service: 'report' },
      ]);
    }
  };

  const toggleService = async (service: 'ddns' | 'monitor' | 'report', action: 'start' | 'stop') => {
    setIsLoading(true);
    try {
      // 实际项目中，这里应该是API请求来控制服务
      const response = await fetch(`/api/ddns/${service}/${action}`, { method: 'POST' });
      if (response.ok) {
        toast.success(`${service.toUpperCase()} 服务${action === 'start' ? '已启动' : '已停止'}`);
        await loadStatus();
      } else {
        toast.error(`${service.toUpperCase()} 服务${action === 'start' ? '启动' : '停止'}失败`);
      }
    } catch (error) {
      toast.error(`${service.toUpperCase()} 服务${action === 'start' ? '启动' : '停止'}失败: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const restartService = async (service: 'ddns' | 'monitor' | 'report') => {
    setIsLoading(true);
    try {
      // 实际项目中，这里应该是API请求来重启服务
      const response = await fetch(`/api/ddns/${service}/restart`, { method: 'POST' });
      if (response.ok) {
        toast.success(`${service.toUpperCase()} 服务已重启`);
        await loadStatus();
      } else {
        toast.error(`${service.toUpperCase()} 服务重启失败`);
      }
    } catch (error) {
      toast.error(`${service.toUpperCase()} 服务重启失败: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runNow = async (service: 'ddns' | 'monitor' | 'report') => {
    setIsLoading(true);
    try {
      // 实际项目中，这里应该是API请求来立即执行服务
      const response = await fetch(`/api/ddns/${service}/run-now`, { method: 'POST' });
      if (response.ok) {
        toast.success(`${service.toUpperCase()} 服务已立即执行`);
        await loadStatus();
        await loadLogs();
      } else {
        toast.error(`${service.toUpperCase()} 服务执行失败`);
      }
    } catch (error) {
      toast.error(`${service.toUpperCase()} 服务执行失败: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getLevelIcon = (level: LogEntry['level']) => {
    switch (level) {
      case 'info':
        return <Activity className="text-blue-500" size={16} />;
      case 'warn':
        return <AlertCircle className="text-yellow-500" size={16} />;
      case 'error':
        return <XCircle className="text-red-500" size={16} />;
      case 'success':
        return <CheckCircle className="text-green-500" size={16} />;
      default:
        return <Activity className="text-gray-500" size={16} />;
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      {/* 顶部状态和操作栏 */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Badge variant={ddnsStatus.running ? "default" : "destructive"}>
            DDNS 服务: {ddnsStatus.running ? "运行中" : "已停止"}
          </Badge>
          <Badge variant={monitorStatus.running ? "default" : "destructive"}>
            监控服务: {monitorStatus.running ? "运行中" : "已停止"}
          </Badge>
          <Badge variant={reportStatus.running ? "default" : "destructive"}>
            报告服务: {reportStatus.running ? "运行中" : "已停止"}
          </Badge>
          {ddnsStatus.domain && (
            <span className="text-sm text-gray-500">
              域名: {ddnsStatus.domain} | IP: {ddnsStatus.ip}
            </span>
          )}
        </div>
      </div>

      {/* 主体内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Tabs defaultValue="status" className="h-full">
          <TabsList className="mb-4">
            <TabsTrigger value="status">服务状态</TabsTrigger>
            <TabsTrigger value="logs">日志记录</TabsTrigger>
          </TabsList>

          <TabsContent value="status" className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* DDNS Service */}
              <Card>
                <CardHeader className="bg-blue-50 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="text-blue-600" size={18} />
                    DDNS 服务
                  </CardTitle>
                  <CardDescription>
                    动态域名解析服务 (5分钟更新一次)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">服务状态:</span>
                      <Badge variant={ddnsStatus.running ? "default" : "destructive"}>
                        {ddnsStatus.running ? "运行中" : "已停止"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="text-gray-500" size={14} />
                          <span className="text-sm font-medium">Timer Status</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">激活:</span>
                          <Badge variant={ddnsStatus.timerStatus?.active ? "default" : "secondary"}>
                            {ddnsStatus.timerStatus?.active ? "是" : "否"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">启用:</span>
                          <Badge variant={ddnsStatus.timerStatus?.enabled ? "default" : "secondary"}>
                            {ddnsStatus.timerStatus?.enabled ? "是" : "否"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">下次触发:</span>
                          <span className="text-xs">{ddnsStatus.timerStatus?.nextTrigger || '-'}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Activity className="text-gray-500" size={14} />
                          <span className="text-sm font-medium">服务状态</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">激活:</span>
                          <Badge variant={ddnsStatus.serviceStatus?.active ? "default" : "secondary"}>
                            {ddnsStatus.serviceStatus?.active ? "是" : "否"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">启用:</span>
                          <Badge variant={ddnsStatus.serviceStatus?.enabled ? "default" : "secondary"}>
                            {ddnsStatus.serviceStatus?.enabled ? "是" : "否"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">上次触发:</span>
                          <span className="text-xs">{ddnsStatus.timerStatus?.lastTriggered || '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="text-gray-500" size={14} />
                        <span className="text-sm font-medium">域名信息</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">域名:</span>
                        <span className="text-xs font-mono">{ddnsStatus.domain || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">当前IP:</span>
                        <span className="text-xs font-mono">{ddnsStatus.ip || '-'}</span>
                      </div>
                    </div>

                    {ddnsStatus.error && (
                      <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
                        <AlertCircle size={14} className="inline mr-1" />
                        错误: {ddnsStatus.error}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  {!ddnsStatus.running ? (
                    <Button onClick={() => toggleService('ddns', 'start')} disabled={isLoading} className="flex items-center gap-2 flex-1">
                      <Play size={14} />
                      启动
                    </Button>
                  ) : (
                    <Button onClick={() => toggleService('ddns', 'stop')} disabled={isLoading} className="flex items-center gap-2 flex-1">
                      <Square size={14} />
                      停止
                    </Button>
                  )}
                  <Button onClick={() => restartService('ddns')} disabled={isLoading} className="flex items-center gap-2">
                    <RefreshCw size={14} />
                    重启
                  </Button>
                  <Button onClick={() => runNow('ddns')} disabled={isLoading} variant="secondary" className="flex items-center gap-2">
                    <Clock size={14} />
                    立即执行
                  </Button>
                </CardFooter>
              </Card>

              {/* Monitor Service */}
              <Card>
                <CardHeader className="bg-green-50 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="text-green-600" size={18} />
                    监控服务
                  </CardTitle>
                  <CardDescription>
                    系统监控服务 (30分钟检查一次)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">服务状态:</span>
                      <Badge variant={monitorStatus.running ? "default" : "destructive"}>
                        {monitorStatus.running ? "运行中" : "已停止"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="text-gray-500" size={14} />
                          <span className="text-sm font-medium">Timer Status</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">激活:</span>
                          <Badge variant={monitorStatus.timerStatus?.active ? "default" : "secondary"}>
                            {monitorStatus.timerStatus?.active ? "是" : "否"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">启用:</span>
                          <Badge variant={monitorStatus.timerStatus?.enabled ? "default" : "secondary"}>
                            {monitorStatus.timerStatus?.enabled ? "是" : "否"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">下次触发:</span>
                          <span className="text-xs">{monitorStatus.timerStatus?.nextTrigger || '-'}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Activity className="text-gray-500" size={14} />
                          <span className="text-sm font-medium">服务状态</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">激活:</span>
                          <Badge variant={monitorStatus.serviceStatus?.active ? "default" : "secondary"}>
                            {monitorStatus.serviceStatus?.active ? "是" : "否"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">启用:</span>
                          <Badge variant={monitorStatus.serviceStatus?.enabled ? "default" : "secondary"}>
                            {monitorStatus.serviceStatus?.enabled ? "是" : "否"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">上次触发:</span>
                          <span className="text-xs">{monitorStatus.timerStatus?.lastTriggered || '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="text-gray-500" size={14} />
                        <span className="text-sm font-medium">上次检查</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">时间:</span>
                        <span className="text-xs">{monitorStatus.lastCheck?.timestamp || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">结果:</span>
                        <Badge variant={monitorStatus.lastCheck?.result ? "default" : "destructive"}>
                          {monitorStatus.lastCheck?.result ? "成功" : "失败"}
                        </Badge>
                      </div>
                      {monitorStatus.lastCheck?.message && (
                        <div className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                          {monitorStatus.lastCheck.message}
                        </div>
                      )}
                    </div>

                    {monitorStatus.error && (
                      <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
                        <AlertCircle size={14} className="inline mr-1" />
                        错误: {monitorStatus.error}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  {!monitorStatus.running ? (
                    <Button onClick={() => toggleService('monitor', 'start')} disabled={isLoading} className="flex items-center gap-2 flex-1">
                      <Play size={14} />
                      启动
                    </Button>
                  ) : (
                    <Button onClick={() => toggleService('monitor', 'stop')} disabled={isLoading} className="flex items-center gap-2 flex-1">
                      <Square size={14} />
                      停止
                    </Button>
                  )}
                  <Button onClick={() => restartService('monitor')} disabled={isLoading} className="flex items-center gap-2">
                    <RefreshCw size={14} />
                    重启
                  </Button>
                  <Button onClick={() => runNow('monitor')} disabled={isLoading} variant="secondary" className="flex items-center gap-2">
                    <Clock size={14} />
                    立即执行
                  </Button>
                </CardFooter>
              </Card>

              {/* Report Service */}
              <Card>
                <CardHeader className="bg-purple-50 border-b">
                  <CardTitle className="flex items-center gap-2">
                    <Logs className="text-purple-600" size={18} />
                    报告服务
                  </CardTitle>
                  <CardDescription>
                    每日报告服务 (每天生成一次)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">服务状态:</span>
                      <Badge variant={reportStatus.running ? "default" : "destructive"}>
                        {reportStatus.running ? "运行中" : "已停止"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="text-gray-500" size={14} />
                          <span className="text-sm font-medium">Timer Status</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">激活:</span>
                          <Badge variant={reportStatus.timerStatus?.active ? "default" : "secondary"}>
                            {reportStatus.timerStatus?.active ? "是" : "否"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">启用:</span>
                          <Badge variant={reportStatus.timerStatus?.enabled ? "default" : "secondary"}>
                            {reportStatus.timerStatus?.enabled ? "是" : "否"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">下次触发:</span>
                          <span className="text-xs">{reportStatus.timerStatus?.nextTrigger || '-'}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Activity className="text-gray-500" size={14} />
                          <span className="text-sm font-medium">服务状态</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">激活:</span>
                          <Badge variant={reportStatus.serviceStatus?.active ? "default" : "secondary"}>
                            {reportStatus.serviceStatus?.active ? "是" : "否"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">启用:</span>
                          <Badge variant={reportStatus.serviceStatus?.enabled ? "default" : "secondary"}>
                            {reportStatus.serviceStatus?.enabled ? "是" : "否"}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">上次触发:</span>
                          <span className="text-xs">{reportStatus.timerStatus?.lastTriggered || '-'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Logs className="text-gray-500" size={14} />
                        <span className="text-sm font-medium">报告信息</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">上次报告:</span>
                        <span className="text-xs">{reportStatus.lastReport || '-'}</span>
                      </div>
                    </div>

                    {reportStatus.error && (
                      <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
                        <AlertCircle size={14} className="inline mr-1" />
                        错误: {reportStatus.error}
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  {!reportStatus.running ? (
                    <Button onClick={() => toggleService('report', 'start')} disabled={isLoading} className="flex items-center gap-2 flex-1">
                      <Play size={14} />
                      启动
                    </Button>
                  ) : (
                    <Button onClick={() => toggleService('report', 'stop')} disabled={isLoading} className="flex items-center gap-2 flex-1">
                      <Square size={14} />
                      停止
                    </Button>
                  )}
                  <Button onClick={() => restartService('report')} disabled={isLoading} className="flex items-center gap-2">
                    <RefreshCw size={14} />
                    重启
                  </Button>
                  <Button onClick={() => runNow('report')} disabled={isLoading} variant="secondary" className="flex items-center gap-2">
                    <Clock size={14} />
                    立即执行
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="logs" className="flex-1 overflow-y-auto">
            <ModuleCard title="日志记录" level={1} className="h-full flex flex-col">
              <div className="flex-1 overflow-hidden">
                <Table className="h-full">
                  <TableHeader className="sticky top-0 bg-white">
                    <TableRow>
                      <TableHead className="w-[180px]">时间</TableHead>
                      <TableHead className="w-[100px]">服务</TableHead>
                      <TableHead className="w-[80px]">级别</TableHead>
                      <TableHead className="min-w-[300px]">消息</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y">
                    {logs.map((log, index) => (
                      <TableRow key={index} className="hover:bg-gray-50">
                        <TableCell className="text-sm text-gray-500">
                          {log.timestamp}
                        </TableCell>
                        <TableCell className="text-sm">
                          <Badge variant={
                            log.service === 'ddns' ? 'default' :
                            log.service === 'monitor' ? 'secondary' : 'outline'
                          }>
                            {log.service.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="flex items-center gap-1">
                            {getLevelIcon(log.level)}
                            <span className={
                              log.level === 'info' ? 'text-blue-600' :
                              log.level === 'warn' ? 'text-yellow-600' :
                              log.level === 'error' ? 'text-red-600' :
                              'text-green-600'
                            }>
                              {log.level.toUpperCase()}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.message}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ModuleCard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
