/**
 * @file 环境切换组件
 * @description 提供开发环境切换功能，用于测试多环境配置
 * @component EnvironmentSwitcher
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-03
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { envConfig } from '../config/env';

export const EnvironmentSwitcher = () => {
  const [currentEnv, setCurrentEnv] = useState(envConfig.getCurrentEnvironment());

  const handleSwitchEnvironment = (envName: string) => {
    if (envConfig.setEnvironment(envName)) {
      setCurrentEnv(envConfig.getCurrentEnvironment());
      window.location.reload();
    }
  };

  const environments = envConfig.getAllEnvironments();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>环境配置管理</CardTitle>
        <CardDescription>
          当前环境: <Badge variant="outline">{currentEnv.name}</Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h4 className="text-sm font-medium">可用环境</h4>
          <div className="flex gap-2 flex-wrap">
            {Object.entries(environments).map(([name, env]) => (
              <Button
                key={name}
                variant={currentEnv.name === name ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSwitchEnvironment(name)}
              >
                {name}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">当前配置</h4>
          <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">API Base URL:</span>
              <span className="font-mono">{currentEnv.apiBaseUrl}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mail API URL:</span>
              <span className="font-mono">{currentEnv.mailApiUrl}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">LLM API URL:</span>
              <span className="font-mono">{currentEnv.llmApiUrl}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">FRP API URL:</span>
              <span className="font-mono">{currentEnv.frpApiUrl}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">WebSocket URL:</span>
              <span className="font-mono">{currentEnv.wsUrl}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mock Data:</span>
              <Badge variant={currentEnv.enableMockData ? 'default' : 'secondary'}>
                {currentEnv.enableMockData ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Debug Mode:</span>
              <Badge variant={currentEnv.enableDebug ? 'default' : 'secondary'}>
                {currentEnv.enableDebug ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Log Level:</span>
              <Badge variant="outline">{currentEnv.logLevel}</Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="text-sm font-medium">环境特性</h4>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-muted p-2 rounded text-center">
              <div className="text-xs text-muted-foreground">开发模式</div>
              <div className="font-semibold">{envConfig.isDevelopment() ? '是' : '否'}</div>
            </div>
            <div className="bg-muted p-2 rounded text-center">
              <div className="text-xs text-muted-foreground">预发布</div>
              <div className="font-semibold">{envConfig.isStaging() ? '是' : '否'}</div>
            </div>
            <div className="bg-muted p-2 rounded text-center">
              <div className="text-xs text-muted-foreground">生产环境</div>
              <div className="font-semibold">{envConfig.isProduction() ? '是' : '否'}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
