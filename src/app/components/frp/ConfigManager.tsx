/**
 * @file ConfigManager - FRP内网穿透配置管理器
 * @description 提供FRP隧道配置的创建、编辑、删除和AI优化功能
 * @module components/frp
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-24
 */

import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { useLLM } from '../../hooks/useLLM';
import { ModuleCard } from '../ModuleCard';
import { Sparkles, Save, Plus, Terminal, Play, Square, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { FRPAIConfigOptimizer } from './FRPAIConfigOptimizer';

interface ProxyConfig {
  name: string;
  content: string;
}

interface FRPGlobalConfig {
  serverAddr: string;
  serverPort: number;
  authMethod: string;
  authToken: string;
  logPath: string;
  logLevel: string;
  tlsEnabled: boolean;
}

interface FRPServiceStatus {
  running: boolean;
  version?: string;
  uptime?: string;
  connections?: number;
  error?: string;
}

interface FRPClientStatus {
  connected: boolean;
  serverAddr?: string;
  user?: string;
  proxies?: number;
  error?: string;
}

export const ConfigManager: React.FC = () => {
  const [proxies, setProxies] = useState<ProxyConfig[]>([
    { name: 'api-0379', content: '[api-0379]\ntype = http\nlocalIP = 127.0.0.1\nlocalPort = 6000\nsubdomain = api' },
    { name: 'mail-0379', content: '[mail-0379]\ntype = http\nlocalIP = 127.0.0.1\nlocalPort = 6003\nsubdomain = mail' },
    { name: 'llm-0379', content: '[llm-0379]\ntype = http\nlocalIP = 127.0.0.1\nlocalPort = 6002\nsubdomain = llm' },
    { name: 'nas-0379', content: '[nas-0379]\ntype = http\nlocalIP = 127.0.0.1\nlocalPort = 6004\nsubdomain = nas' },
    { name: 'admin-0379', content: '[admin-0379]\ntype = http\nlocalIP = 127.0.0.1\nlocalPort = 6001\nsubdomain = admin' },
    { name: 'monitor-0379', content: '[monitor-0379]\ntype = http\nlocalIP = 127.0.0.1\nlocalPort = 6006\nsubdomain = monitor' },
    { name: 'ddns-0379', content: '[ddns-0379]\ntype = http\nlocalIP = 127.0.0.1\nlocalPort = 6007\nsubdomain = ddns' },
  ]);
  
  const [globalConfig, setGlobalConfig] = useState<FRPGlobalConfig>({
    serverAddr: '8.152.195.33',
    serverPort: 7001,
    authMethod: 'token',
    authToken: 'yyc3_nas',
    logPath: '/Volume1/www/frpc/logs/frpc.log',
    logLevel: 'debug',
    tlsEnabled: true
  });
  
  const [currentProxyIndex, setCurrentProxyIndex] = useState(0);
  const [newProxyName, setNewProxyName] = useState('');
  const [serviceStatus, setServiceStatus] = useState<FRPServiceStatus>({ running: false });
  const [clientStatus, setClientStatus] = useState<FRPClientStatus>({ connected: false });
  const [isLoading, setIsLoading] = useState(false);
  const [showBackups, setShowBackups] = useState(false);
  const [backups, setBackups] = useState<any[]>([]);
  const { generateConfig, isGenerating } = useLLM();

  const currentProxy = proxies[currentProxyIndex];

  // 模拟从服务器加载配置
  useEffect(() => {
    loadConfigs();
    checkServiceStatus();
    checkClientStatus();
  }, []);

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      // 实际项目中，这里应该是API请求来获取配置
      const response = await fetch('/api/frp/configs');
      if (response.ok) {
        const data = await response.json();
        if (data.proxies && data.proxies.length > 0) {
          setProxies(data.proxies);
        }
      }
    } catch (error) {
      toast.error('加载配置失败: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const saveConfig = async () => {
    setIsLoading(true);
    try {
      const isValid = await validateConfig(currentProxy.content);
      if (!isValid) {
        return;
      }

      await backupConfig();

      const response = await fetch('/api/frp/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proxies, globalConfig }),
      });

      if (response.ok) {
        toast.success('配置已保存');
        await restartService();
      } else {
        toast.error('保存配置失败');
      }
    } catch (error) {
      toast.error('保存配置失败: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const startService = async () => {
    setIsLoading(true);
    try {
      // 实际项目中，这里应该是API请求来启动服务
      const response = await fetch('/api/frp/service/start', { method: 'POST' });
      if (response.ok) {
        toast.success('FRP服务已启动');
        await checkServiceStatus();
      } else {
        toast.error('启动服务失败');
      }
    } catch (error) {
      toast.error('启动服务失败: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const stopService = async () => {
    setIsLoading(true);
    try {
      // 实际项目中，这里应该是API请求来停止服务
      const response = await fetch('/api/frp/service/stop', { method: 'POST' });
      if (response.ok) {
        toast.success('FRP服务已停止');
        await checkServiceStatus();
      } else {
        toast.error('停止服务失败');
      }
    } catch (error) {
      toast.error('停止服务失败: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const restartService = async () => {
    setIsLoading(true);
    try {
      // 实际项目中，这里应该是API请求来重启服务
      const response = await fetch('/api/frp/service/restart', { method: 'POST' });
      if (response.ok) {
        toast.success('FRP服务已重启');
        await checkServiceStatus();
        await checkClientStatus();
      } else {
        toast.error('重启服务失败');
      }
    } catch (error) {
      toast.error('重启服务失败: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const checkServiceStatus = async () => {
    try {
      // 实际项目中，这里应该是API请求来获取服务状态
      const response = await fetch('/api/frp/service/status');
      if (response.ok) {
        const status = await response.json();
        setServiceStatus(status);
      }
    } catch (error) {
      setServiceStatus({ running: false, error: '无法连接到服务' });
    }
  };

  const checkClientStatus = async () => {
    try {
      // 实际项目中，这里应该是API请求来获取客户端状态
      const response = await fetch('/api/frp/client/status');
      if (response.ok) {
        const status = await response.json();
        setClientStatus(status);
      }
    } catch (error) {
      setClientStatus({ connected: false, error: '客户端未连接' });
    }
  };

  const addProxy = () => {
    if (!newProxyName.trim()) {
      toast.error('代理名称不能为空');
      return;
    }

    if (proxies.some(p => p.name === newProxyName.trim())) {
      toast.error('代理名称已存在');
      return;
    }

    const newProxy: ProxyConfig = {
      name: newProxyName.trim(),
      content: `[${newProxyName.trim()}]\ntype = tcp\nlocal_ip = 127.0.0.1\nlocal_port = \nremote_port = `
    };

    setProxies([...proxies, newProxy]);
    setCurrentProxyIndex(proxies.length);
    setNewProxyName('');
    toast.success('代理已添加');
  };

  const deleteProxy = () => {
    if (proxies.length <= 1) {
      toast.error('至少需要保留一个代理配置');
      return;
    }

    const newProxies = proxies.filter((_, index) => index !== currentProxyIndex);
    setProxies(newProxies);
    setCurrentProxyIndex(0);
    toast.success('代理已删除');
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      const newProxies = [...proxies];
      newProxies[currentProxyIndex].content = value;
      setProxies(newProxies);
    }
  };

  const aiOptimize = async () => {
    toast.info("AI 正在分析并优化配置...");
    const suggestion = await generateConfig(currentProxy.content, "请优化此FRP配置");
    
    const newProxies = [...proxies];
    newProxies[currentProxyIndex].content = suggestion;
    setProxies(newProxies);
    toast.success("配置已由 AI 优化完成！");
  };

  const validateConfig = async (content: string) => {
    try {
      const response = await fetch('/api/frp/configs/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });

      const result = await response.json();
      
      if (result.valid) {
        if (result.warnings.length > 0) {
          toast.warning('配置验证通过，但存在警告: ' + result.warnings.join(', '));
        } else {
          toast.success('配置验证通过');
        }
        return true;
      } else {
        toast.error('配置验证失败: ' + result.errors.join(', '));
        return false;
      }
    } catch (error) {
      toast.error('配置验证失败: ' + (error as Error).message);
      return false;
    }
  };

  const backupConfig = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/frp/configs/backup', {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        toast.success('配置已备份: ' + result.data.backup_file);
        await loadBackups();
      } else {
        toast.error('备份配置失败');
      }
    } catch (error) {
      toast.error('备份配置失败: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBackups = async () => {
    try {
      const response = await fetch('/api/frp/configs/backups');
      if (response.ok) {
        const result = await response.json();
        setBackups(result.data);
      }
    } catch (error) {
      console.error('Load backups error:', error);
    }
  };

  const restoreConfig = async (backupFilename: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/frp/configs/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ backup_file: backupFilename }),
      });

      if (response.ok) {
        toast.success('配置已恢复');
        await loadConfigs();
        await loadBackups();
        await restartService();
      } else {
        toast.error('恢复配置失败');
      }
    } catch (error) {
      toast.error('恢复配置失败: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBackup = async (backupFilename: string) => {
    try {
      const response = await fetch(`/api/frp/configs/backups/${backupFilename}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('备份已删除');
        await loadBackups();
      } else {
        toast.error('删除备份失败');
      }
    } catch (error) {
      toast.error('删除备份失败: ' + (error as Error).message);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col">
      {/* 顶部状态和操作栏 */}
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant={serviceStatus.running ? "default" : "destructive"}>
              {serviceStatus.running ? "服务运行中" : "服务已停止"}
            </Badge>
            <Badge variant={clientStatus.connected ? "default" : "destructive"}>
              {clientStatus.connected ? "客户端已连接" : "客户端未连接"}
            </Badge>
          </div>
          {serviceStatus.running && (
            <span className="text-sm text-gray-500">
              版本: {serviceStatus.version} | 运行时间: {serviceStatus.uptime} | 连接数: {serviceStatus.connections}
            </span>
          )}
          {clientStatus.connected && (
            <span className="text-sm text-gray-500">
              服务器: {clientStatus.serverAddr} | 用户: {clientStatus.user} | 代理数: {clientStatus.proxies}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {!serviceStatus.running ? (
            <Button onClick={startService} disabled={isLoading} className="flex items-center gap-2">
              <Play size={14} />
              启动服务
            </Button>
          ) : (
            <Button onClick={stopService} disabled={isLoading} className="flex items-center gap-2">
              <Square size={14} />
              停止服务
            </Button>
          )}
          <Button onClick={restartService} disabled={isLoading} className="flex items-center gap-2">
            <RefreshCw size={14} />
            重启服务
          </Button>
          <Button 
            onClick={() => setShowBackups(!showBackups)} 
            disabled={isLoading} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw size={14} />
            {showBackups ? '隐藏备份' : '配置备份'}
          </Button>
          <Button onClick={saveConfig} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
            <Save size={14} />
            保存配置
          </Button>
        </div>
      </div>

      {/* 主体内容区域 */}
      <div className="flex-1 flex gap-6 overflow-hidden">
        {/* 左侧边栏：代理列表 */}
        <div className="w-72 flex flex-col gap-4 overflow-y-auto">
          <ModuleCard title="代理列表" level={1}>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="代理名称"
                  value={newProxyName}
                  onChange={(e) => setNewProxyName(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={addProxy} className="flex items-center gap-2">
                  <Plus size={14} />
                  添加
                </Button>
              </div>
              <ul className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {proxies.map((proxy, index) => (
                  <li 
                    key={proxy.name}
                    onClick={() => setCurrentProxyIndex(index)}
                    className={`
                      p-3 rounded-lg cursor-pointer transition flex items-center justify-between
                      ${currentProxyIndex === index 
                        ? 'bg-blue-50 text-blue-600 border border-blue-200 shadow-sm' 
                        : 'hover:bg-gray-50 text-gray-700'}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <Terminal size={14} />
                      <span className="truncate">{proxy.name}</span>
                    </div>
                    {currentProxyIndex === index && (
                      <button 
                        onClick={deleteProxy}
                        className="text-red-500 hover:text-red-700 p-1 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </ModuleCard>

          {/* 系统信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold">系统信息</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">FRP版本:</span>
                  <span>{serviceStatus.version || '未知'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">运行时间:</span>
                  <span>{serviceStatus.uptime || '未运行'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">活跃连接:</span>
                  <span>{serviceStatus.connections || '0'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">客户端状态:</span>
                  <span>{clientStatus.connected ? '已连接' : '未连接'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 配置备份列表 */}
          {showBackups && (
            <ModuleCard title="配置备份" level={1}>
              <div className="space-y-3">
                <Button 
                  onClick={backupConfig} 
                  disabled={isLoading} 
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw size={14} className="mr-2" />
                  创建备份
                </Button>
                {backups.length === 0 ? (
                  <div className="text-center text-gray-500 py-4">
                    暂无备份
                  </div>
                ) : (
                  <ul className="space-y-2 max-h-[300px] overflow-y-auto">
                    {backups.map((backup) => (
                      <li 
                        key={backup.filename}
                        className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">
                            {backup.filename}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(backup.created).toLocaleString()}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => restoreConfig(backup.filename)}
                            title="恢复"
                          >
                            <RefreshCw size={14} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteBackup(backup.filename)}
                            title="删除"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </ModuleCard>
          )}
        </div>

        {/* 右侧主区域：配置编辑器 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="editor" className="h-full">
            <TabsList className="mb-4">
              <TabsTrigger value="editor">配置编辑器</TabsTrigger>
              <TabsTrigger value="global">全局配置</TabsTrigger>
              <TabsTrigger value="status">服务状态</TabsTrigger>
              <TabsTrigger value="ai-optimizer">
                <Sparkles className="h-4 w-4 mr-1" />
                AI优化器
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="editor" className="flex-1 flex flex-col overflow-hidden">
              <ModuleCard title={`${currentProxy.name}.toml`} level={1} className="h-full flex flex-col">
                <div className="flex-1 flex flex-col min-h-[600px]">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                    <span className="text-sm text-gray-500">
                      FRP 代理配置 (TOML 格式)
                    </span>
                    <div className="flex gap-2">
                      <Button 
                        onClick={aiOptimize} 
                        disabled={isGenerating}
                        variant="secondary"
                        className="flex items-center gap-2"
                      >
                        <Sparkles size={14} className={isGenerating ? "animate-spin" : ""} />
                        {isGenerating ? "AI 思考中..." : "AI 优化配置"}
                      </Button>
                    </div>
                  </div>
                  <div className="flex-1 border border-gray-200 rounded-md overflow-hidden shadow-inner">
                    <Editor
                      height="100%"
                      defaultLanguage="ini"
                      value={currentProxy.content}
                      onChange={handleEditorChange}
                      options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                        padding: { top: 16, bottom: 16 },
                      }}
                    />
                  </div>
                </div>
              </ModuleCard>
            </TabsContent>
            
            <TabsContent value="global" className="flex-1">
              <ModuleCard title="全局配置" level={1} className="h-full">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="serverAddr">服务器地址</Label>
                      <Input
                        id="serverAddr"
                        value={globalConfig.serverAddr}
                        onChange={(e) => setGlobalConfig({ ...globalConfig, serverAddr: e.target.value })}
                        placeholder="服务器IP地址"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serverPort">服务器端口</Label>
                      <Input
                        id="serverPort"
                        type="number"
                        value={globalConfig.serverPort}
                        onChange={(e) => setGlobalConfig({ ...globalConfig, serverPort: parseInt(e.target.value) || 7001 })}
                        placeholder="7001"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authMethod">认证方式</Label>
                      <Input
                        id="authMethod"
                        value={globalConfig.authMethod}
                        onChange={(e) => setGlobalConfig({ ...globalConfig, authMethod: e.target.value })}
                        placeholder="token"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="authToken">认证令牌</Label>
                      <Input
                        id="authToken"
                        type="password"
                        value={globalConfig.authToken}
                        onChange={(e) => setGlobalConfig({ ...globalConfig, authToken: e.target.value })}
                        placeholder="认证令牌"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logPath">日志路径</Label>
                      <Input
                        id="logPath"
                        value={globalConfig.logPath}
                        onChange={(e) => setGlobalConfig({ ...globalConfig, logPath: e.target.value })}
                        placeholder="日志文件路径"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="logLevel">日志级别</Label>
                      <Input
                        id="logLevel"
                        value={globalConfig.logLevel}
                        onChange={(e) => setGlobalConfig({ ...globalConfig, logLevel: e.target.value })}
                        placeholder="debug"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="tlsEnabled"
                      checked={globalConfig.tlsEnabled}
                      onChange={(e) => setGlobalConfig({ ...globalConfig, tlsEnabled: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="tlsEnabled">启用TLS加密</Label>
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={saveConfig} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white">
                      保存全局配置
                    </Button>
                  </div>
                </div>
              </ModuleCard>
            </TabsContent>
            
            <TabsContent value="status" className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>FRP服务状态</CardTitle>
                    <CardDescription>服务器端运行信息</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">服务状态:</span>
                        <Badge variant={serviceStatus.running ? "default" : "destructive"}>
                          {serviceStatus.running ? "运行中" : "已停止"}
                        </Badge>
                      </div>
                      {serviceStatus.running && (
                        <>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">版本:</span>
                              <span>{serviceStatus.version}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">运行时间:</span>
                              <span>{serviceStatus.uptime}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">活跃连接数:</span>
                              <span>{serviceStatus.connections}</span>
                            </div>
                          </div>
                        </>
                      )}
                      {serviceStatus.error && (
                        <div className="text-red-500 text-sm">
                          错误: {serviceStatus.error}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>FRP客户端状态</CardTitle>
                    <CardDescription>客户端连接信息</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">连接状态:</span>
                        <Badge variant={clientStatus.connected ? "default" : "destructive"}>
                          {clientStatus.connected ? "已连接" : "未连接"}
                        </Badge>
                      </div>
                      {clientStatus.connected && (
                        <>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">服务器地址:</span>
                              <span>{clientStatus.serverAddr}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">用户:</span>
                              <span>{clientStatus.user}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-gray-500">代理数量:</span>
                              <span>{clientStatus.proxies}</span>
                            </div>
                          </div>
                        </>
                      )}
                      {clientStatus.error && (
                        <div className="text-red-500 text-sm">
                          错误: {clientStatus.error}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="ai-optimizer" className="flex-1 overflow-y-auto">
              <FRPAIConfigOptimizer />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
