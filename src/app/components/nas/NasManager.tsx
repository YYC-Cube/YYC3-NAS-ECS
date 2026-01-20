/**
 * @file NasManager组件
 * @description NAS服务管理器，用于管理NAS存储、共享配置和系统状态
 * @component NasManager
 * @author YYC³
 * @version 1.0.0
 * @created 2025-01-05
 */

import React, { useState, useEffect } from 'react';
import { ModuleCard } from '../ModuleCard';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  HardDrive,
  Server,
  Share2,
  Users,
  Activity,
  CheckCircle,
  XCircle,
  RefreshCw,
  Play,
  Square,
  FolderOpen,
  Settings,
  Shield,
  Upload,
  Download,
  Clock,
  Network,
  Lock,
  Unlock
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

// NAS 系统状态接口
interface NASSystemStatus {
  running: boolean;
  status: 'online' | 'offline' | 'maintenance';
  uptime: string;
  version: string;
  cpuUsage: number;
  memoryUsage: number;
  temperature: number;
}

// 存储卷信息接口
interface VolumeInfo {
  id: string;
  name: string;
  type: string;
  total: number;
  used: number;
  available: number;
  health: 'healthy' | 'warning' | 'error';
  mountPoint: string;
}

// 文件共享配置接口
interface FileShare {
  id: string;
  name: string;
  path: string;
  type: 'smb' | 'nfs' | 'webdav' | 'ftp';
  enabled: boolean;
  users: string[];
  permissions: 'read' | 'write' | 'full';
  status: 'active' | 'inactive' | 'error';
}

export const NasManager: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<NASSystemStatus>({
    running: false,
    status: 'offline',
    uptime: '0天 0小时 0分钟',
    version: 'DSM 7.2.1-69057 Update 3',
    cpuUsage: 0,
    memoryUsage: 0,
    temperature: 0
  });

  const [volumes, setVolumes] = useState<VolumeInfo[]>([]);
  const [fileShares, setFileShares] = useState<FileShare[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // 加载NAS状态
  const loadNasStatus = async () => {
    setIsLoading(true);
    try {
      // 模拟API请求
      const response = await fetch('/api/nas/status');
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data.systemStatus || systemStatus);
        setVolumes(data.volumes || []);
        setFileShares(data.fileShares || []);
      } else {
        // 使用模拟数据
        setSystemStatus({
          running: true,
          status: 'online',
          uptime: '15天 3小时 45分钟',
          version: 'DSM 7.2.1-69057 Update 3',
          cpuUsage: 12.5,
          memoryUsage: 45.3,
          temperature: 42
        });
        setVolumes([
          {
            id: 'vol1',
            name: 'Volume 1',
            type: 'Btrfs',
            total: 16000,
            used: 8750,
            available: 7250,
            health: 'healthy',
            mountPoint: '/volume1'
          },
          {
            id: 'vol2',
            name: 'Volume 2',
            type: 'EXT4',
            total: 8000,
            used: 3200,
            available: 4800,
            health: 'healthy',
            mountPoint: '/volume2'
          }
        ]);
        setFileShares([
          {
            id: 'share1',
            name: 'Documents',
            path: '/volume1/documents',
            type: 'smb',
            enabled: true,
            users: ['admin', 'user1', 'user2'],
            permissions: 'full',
            status: 'active'
          },
          {
            id: 'share2',
            name: 'Media',
            path: '/volume1/media',
            type: 'webdav',
            enabled: true,
            users: ['admin', 'media_user'],
            permissions: 'read',
            status: 'active'
          },
          {
            id: 'share3',
            name: 'Backups',
            path: '/volume2/backups',
            type: 'nfs',
            enabled: false,
            users: ['admin'],
            permissions: 'full',
            status: 'inactive'
          }
        ]);
      }
    } catch (error) {
      toast.error('加载NAS状态失败: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // 刷新状态
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadNasStatus();
    setRefreshing(false);
    toast.success('NAS状态已刷新');
  };

  // 启动NAS服务
  const handleStart = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/nas/start', { method: 'POST' });
      if (response.ok) {
        toast.success('NAS服务已启动');
        await loadNasStatus();
      }
    } catch (error) {
      toast.error('启动NAS服务失败: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // 停止NAS服务
  const handleStop = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/nas/stop', { method: 'POST' });
      if (response.ok) {
        toast.success('NAS服务已停止');
        await loadNasStatus();
      }
    } catch (error) {
      toast.error('停止NAS服务失败: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // 切换共享状态
  const toggleShare = async (shareId: string) => {
    const share = fileShares.find(s => s.id === shareId);
    if (!share) return;

    setIsLoading(true);
    try {
      const action = share.enabled ? 'disable' : 'enable';
      const response = await fetch(`/api/nas/shares/${shareId}/${action}`, { method: 'POST' });
      if (response.ok) {
        toast.success(`文件共享 "${share.name}" 已${share.enabled ? '禁用' : '启用'}`);
        await loadNasStatus();
      }
    } catch (error) {
      toast.error('切换共享状态失败: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // 格式化存储大小
  const formatStorage = (gb: number) => {
    if (gb >= 1000) {
      return `${(gb / 1024).toFixed(2)} TB`;
    }
    return `${gb.toFixed(2)} GB`;
  };

  useEffect(() => {
    loadNasStatus();
  }, []);

  return (
    <div className="space-y-6">
      {/* 系统状态卡片 */}
      <ModuleCard title="NAS 服务状态" level={1}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* 运行状态 */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                服务状态
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {systemStatus.running ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-lg font-bold text-green-600">在线</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="text-lg font-bold text-red-600">离线</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* CPU使用率 */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Server className="h-4 w-4" />
                CPU 使用率
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {systemStatus.cpuUsage.toFixed(1)}%
              </div>
              <Progress value={systemStatus.cpuUsage} className="mt-2" />
            </CardContent>
          </Card>

          {/* 内存使用率 */}
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                内存使用率
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {systemStatus.memoryUsage.toFixed(1)}%
              </div>
              <Progress value={systemStatus.memoryUsage} className="mt-2" />
            </CardContent>
          </Card>

          {/* 系统温度 */}
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                系统温度
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {systemStatus.temperature}°C
              </div>
              <div className="text-xs text-gray-500 mt-1">正常运行范围</div>
            </CardContent>
          </Card>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          {!systemStatus.running ? (
            <Button
              onClick={handleStart}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-2" />
              启动 NAS
            </Button>
          ) : (
            <Button
              onClick={handleStop}
              disabled={isLoading}
              variant="destructive"
            >
              <Square className="h-4 w-4 mr-2" />
              停止 NAS
            </Button>
          )}
          <Button
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            刷新状态
          </Button>
          <div className="ml-auto flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>运行时间: {systemStatus.uptime}</span>
          </div>
        </div>
      </ModuleCard>

      {/* 存储管理 */}
      <Tabs defaultValue="volumes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="volumes" className="flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            存储卷
          </TabsTrigger>
          <TabsTrigger value="shares" className="flex items-center gap-2">
            <Share2 className="h-4 w-4" />
            文件共享
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            系统配置
          </TabsTrigger>
        </TabsList>

        {/* 存储卷标签页 */}
        <TabsContent value="volumes" className="space-y-4">
          <ModuleCard title="存储卷管理" level={1}>
            <div className="space-y-4">
              {volumes.map((volume) => (
                <motion.div
                  key={volume.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <FolderOpen className="h-5 w-5" />
                            {volume.name}
                          </CardTitle>
                          <CardDescription>
                            {volume.type} · {volume.mountPoint}
                          </CardDescription>
                        </div>
                        <Badge
                          variant={volume.health === 'healthy' ? 'default' : 'destructive'}
                          className="flex items-center gap-1"
                        >
                          <Shield className="h-3 w-3" />
                          {volume.health === 'healthy' ? '健康' : '警告'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">已使用</span>
                            <span className="font-medium">
                              {formatStorage(volume.used)} / {formatStorage(volume.total)}
                              ({((volume.used / volume.total) * 100).toFixed(1)}%)
                            </span>
                          </div>
                          <Progress
                            value={(volume.used / volume.total) * 100}
                            className="h-2"
                          />
                        </div>
                        <div className="flex gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Upload className="h-4 w-4" />
                            可用空间: {formatStorage(volume.available)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Download className="h-4 w-4" />
                            总容量: {formatStorage(volume.total)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Settings className="h-4 w-4 mr-2" />
                        管理
                      </Button>
                      <Button size="sm" variant="outline">
                        <Shield className="h-4 w-4 mr-2" />
                        检查
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </ModuleCard>
        </TabsContent>

        {/* 文件共享标签页 */}
        <TabsContent value="shares" className="space-y-4">
          <ModuleCard title="文件共享配置" level={1}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>共享名称</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>路径</TableHead>
                  <TableHead>权限</TableHead>
                  <TableHead>用户数</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fileShares.map((share) => (
                  <TableRow key={share.id}>
                    <TableCell className="font-medium">{share.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{share.type.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{share.path}</TableCell>
                    <TableCell>
                      <Badge
                        variant={share.permissions === 'full' ? 'default' : 'secondary'}
                        className="flex items-center gap-1 w-fit"
                      >
                        {share.permissions === 'full' ? (
                          <Unlock className="h-3 w-3" />
                        ) : (
                          <Lock className="h-3 w-3" />
                        )}
                        {share.permissions}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-gray-500" />
                        {share.users.length}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={share.status === 'active' ? 'default' : 'secondary'}
                        className={
                          share.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }
                      >
                        {share.status === 'active' ? '活跃' : '未活跃'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={share.enabled ? 'destructive' : 'default'}
                          onClick={() => toggleShare(share.id)}
                          disabled={isLoading}
                        >
                          {share.enabled ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ModuleCard>
        </TabsContent>

        {/* 系统配置标签页 */}
        <TabsContent value="system" className="space-y-4">
          <ModuleCard title="系统配置" level={1}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 基本信息 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    基本信息
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>DSM 版本</Label>
                    <Input value={systemStatus.version} readOnly />
                  </div>
                  <div>
                    <Label>主机名</Label>
                    <Input value="YYC3-NAS" readOnly />
                  </div>
                  <div>
                    <Label>IP 地址</Label>
                    <Input value="192.168.1.100" readOnly />
                  </div>
                </CardContent>
              </Card>

              {/* 网络配置 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5" />
                    网络配置
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>网络接口</Label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option>eth0 - 1 Gbps</option>
                      <option>eth1 - 1 Gbps</option>
                    </select>
                  </div>
                  <div>
                    <Label>网络类型</Label>
                    <select className="w-full px-3 py-2 border border-gray-300 rounded-md">
                      <option>DHCP 自动获取</option>
                      <option>静态 IP</option>
                    </select>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button className="w-full">保存配置</Button>
                </CardFooter>
              </Card>
            </div>
          </ModuleCard>
        </TabsContent>
      </Tabs>
    </div>
  );
};
