import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Settings, 
  Download, 
  Upload, 
  RefreshCw, 
  Check, 
  X, 
  AlertTriangle,
  Shield,
  Globe,
  Zap,
  Database,
  Palette,
  FileText,
  Network,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { configManager, Environment, ConfigCategory, ConfigDiff, ConfigValidationResult } from '@/services/configService';

export const ConfigManagerComponent: React.FC = () => {
  const [currentEnvironment, setCurrentEnvironment] = useState<Environment>(configManager.getEnvironment());
  const [categories, setCategories] = useState<ConfigCategory[]>([]);
  const [validationResult, setValidationResult] = useState<ConfigValidationResult | null>(null);
  const [diffs, setDiffs] = useState<ConfigDiff[]>([]);
  const [compareEnv1, setCompareEnv1] = useState<Environment>(Environment.DEVELOPMENT);
  const [compareEnv2, setCompareEnv2] = useState<Environment>(Environment.STAGING);
  const [exportedConfig, setExportedConfig] = useState<string>('');
  const [importedConfig, setImportedConfig] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [currentEnvironment]);

  const loadData = () => {
    configManager.setEnvironment(currentEnvironment);
    setCategories(configManager.getConfigCategories());
    validateConfig();
  };

  const validateConfig = () => {
    const result = configManager.validate();
    setValidationResult(result);
  };

  const handleEnvironmentChange = (env: Environment) => {
    setCurrentEnvironment(env);
    toast.success(`已切换到${env === Environment.DEVELOPMENT ? '开发' : env === Environment.STAGING ? '测试' : '生产'}环境`);
  };

  const handleConfigChange = (key: string, value: string) => {
    configManager.set(key, value);
    loadData();
    toast.success('配置已更新');
  };

  const handleExport = () => {
    const exported = configManager.export();
    setExportedConfig(exported);
    const blob = new Blob([exported], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `config-${currentEnvironment}-${new Date().toISOString().split('T')[0]}.env`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('配置已导出');
  };

  const handleImport = () => {
    if (importedConfig.trim()) {
      const success = configManager.import(importedConfig);
      if (success) {
        loadData();
        toast.success('配置已导入');
        setImportedConfig('');
      } else {
        toast.error('配置导入失败，请检查格式');
      }
    }
  };

  const handleCompare = () => {
    const diff = configManager.compare(compareEnv1, compareEnv2);
    setDiffs(diff);
    toast.success('配置比较完成');
  };

  const handleResetToDefault = () => {
    if (confirm('确定要重置为默认配置吗？')) {
      configManager.setEnvironment(currentEnvironment);
      loadData();
      toast.success('配置已重置');
    }
  };

  const getCategoryIcon = (name: string) => {
    switch (name) {
      case '应用配置':
        return <Globe className="h-5 w-5" />;
      case 'API配置':
        return <Network className="h-5 w-5" />;
      case '认证配置':
        return <Shield className="h-5 w-5" />;
      case '功能开关':
        return <Zap className="h-5 w-5" />;
      case '日志配置':
        return <FileText className="h-5 w-5" />;
      case '性能配置':
        return <Database className="h-5 w-5" />;
      case 'UI配置':
        return <Palette className="h-5 w-5" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">配置管理</h1>
          <p className="text-muted-foreground">管理系统配置和环境变量</p>
        </div>
        <div className="flex gap-2">
          <Select value={currentEnvironment} onValueChange={(value) => handleEnvironmentChange(value as Environment)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={Environment.DEVELOPMENT}>开发环境</SelectItem>
              <SelectItem value={Environment.STAGING}>测试环境</SelectItem>
              <SelectItem value={Environment.PRODUCTION}>生产环境</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            导出配置
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('import-input')?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            导入配置
          </Button>
          <Button variant="outline" onClick={handleResetToDefault}>
            <RefreshCw className="h-4 w-4 mr-2" />
            重置默认
          </Button>
        </div>
      </div>

      <input
        id="import-input"
        type="file"
        accept=".env,.json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
              const content = event.target?.result as string;
              setImportedConfig(content);
              handleImport();
            };
            reader.readAsText(file);
          }
        }}
      />

      {validationResult && !validationResult.isValid && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>配置验证失败</AlertTitle>
          <AlertDescription>
            <ul className="list-disc list-inside mt-2">
              {validationResult.errors.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">配置管理</TabsTrigger>
          <TabsTrigger value="compare">配置比较</TabsTrigger>
          <TabsTrigger value="export">导入导出</TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          {categories.map((category) => (
            <Card key={category.name}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getCategoryIcon(category.name)}
                  {category.name}
                </CardTitle>
                <CardDescription>{category.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(category.configs).map(([key, configValue]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor={key} className="flex items-center gap-2">
                        {key}
                        {configValue.required && <Badge variant="destructive">必填</Badge>}
                        {configValue.isSecret && <Lock className="h-3 w-3 text-muted-foreground" />}
                      </Label>
                      {configValue.type === 'boolean' && (
                        <Switch
                          checked={configValue.value === 'true'}
                          onCheckedChange={(checked) => handleConfigChange(key, checked ? 'true' : 'false')}
                        />
                      )}
                    </div>
                    {configValue.type === 'boolean' ? (
                      <p className="text-sm text-muted-foreground">{configValue.description}</p>
                    ) : configValue.type === 'url' ? (
                      <Input
                        id={key}
                        type="url"
                        value={configValue.isSecret ? '***' : configValue.value}
                        onChange={(e) => handleConfigChange(key, e.target.value)}
                        placeholder={configValue.description}
                      />
                    ) : configValue.type === 'number' ? (
                      <Input
                        id={key}
                        type="number"
                        value={configValue.isSecret ? '***' : configValue.value}
                        onChange={(e) => handleConfigChange(key, e.target.value)}
                        placeholder={configValue.description}
                      />
                    ) : (
                      <Input
                        id={key}
                        type={configValue.isSecret ? 'password' : 'text'}
                        value={configValue.isSecret ? '***' : configValue.value}
                        onChange={(e) => handleConfigChange(key, e.target.value)}
                        placeholder={configValue.description}
                      />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="compare" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>配置比较</CardTitle>
              <CardDescription>比较不同环境之间的配置差异</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>环境 1</Label>
                  <Select value={compareEnv1} onValueChange={(value) => setCompareEnv1(value as Environment)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Environment.DEVELOPMENT}>开发环境</SelectItem>
                      <SelectItem value={Environment.STAGING}>测试环境</SelectItem>
                      <SelectItem value={Environment.PRODUCTION}>生产环境</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>环境 2</Label>
                  <Select value={compareEnv2} onValueChange={(value) => setCompareEnv2(value as Environment)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={Environment.DEVELOPMENT}>开发环境</SelectItem>
                      <SelectItem value={Environment.STAGING}>测试环境</SelectItem>
                      <SelectItem value={Environment.PRODUCTION}>生产环境</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleCompare} className="w-full">
                <RefreshCw className="h-4 w-4 mr-2" />
                比较配置
              </Button>

              {diffs.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold">比较结果</h3>
                  <div className="border rounded-lg divide-y">
                    {diffs.map((diff, index) => (
                      <div key={index} className="p-3 flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium">{diff.key}</p>
                          <div className="flex gap-4 text-sm text-muted-foreground">
                            <span>{compareEnv1}: {diff.env1Value || '(空)'}</span>
                            <span>{compareEnv2}: {diff.env2Value || '(空)'}</span>
                          </div>
                        </div>
                        {diff.isDifferent ? (
                          <Badge variant="destructive">
                            <X className="h-3 w-3 mr-1" />
                            不同
                          </Badge>
                        ) : (
                          <Badge variant="default">
                            <Check className="h-3 w-3 mr-1" />
                            相同
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>导出配置</CardTitle>
              <CardDescription>导出当前环境的配置到文件</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleExport} className="w-full">
                <Download className="h-4 w-4 mr-2" />
                导出当前环境配置
              </Button>
              {exportedConfig && (
                <div className="mt-4">
                  <Label>导出内容预览</Label>
                  <Textarea
                    value={exportedConfig}
                    readOnly
                    className="mt-2 font-mono text-sm"
                    rows={20}
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>导入配置</CardTitle>
              <CardDescription>从文件导入配置到当前环境</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="粘贴配置内容..."
                value={importedConfig}
                onChange={(e) => setImportedConfig(e.target.value)}
                rows={10}
              />
              <Button onClick={handleImport} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                导入配置
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ConfigManagerComponent;
