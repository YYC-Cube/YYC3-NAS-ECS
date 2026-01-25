import React, { useState, useCallback } from 'react';
import { Sparkles, AlertTriangle, CheckCircle, Info, Zap, Shield, TrendingUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { useLLM } from '../../hooks/useLLM';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

interface ConfigIssue {
  type: 'error' | 'warning' | 'info' | 'suggestion';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  location?: string;
  fix?: string;
}

interface ConfigOptimization {
  category: 'performance' | 'security' | 'reliability' | 'best-practices';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  original: string;
  optimized: string;
  reason: string;
}

interface AIAnalysisResult {
  issues: ConfigIssue[];
  optimizations: ConfigOptimization[];
  score: number;
  summary: string;
}

export const FRPAIConfigOptimizer: React.FC = () => {
  const [config, setConfig] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null);
  const [_selectedOptimization, setSelectedOptimization] = useState<ConfigOptimization | null>(null);
  const [applyProgress, setApplyProgress] = useState(0);
  const { generateResponse, isGenerating } = useLLM();

  const analyzeConfig = useCallback(async () => {
    if (!config.trim()) {
      toast.error('请输入FRP配置内容');
      return;
    }

    setIsAnalyzing(true);
    try {
      const prompt = `请分析以下FRP配置文件，并提供详细的优化建议：

配置内容：
\`\`\`
${config}
\`\`\`

请以JSON格式返回分析结果，包含以下字段：
1. issues: 问题列表，每个问题包含type（error/warning/info/suggestion）、severity（critical/high/medium/low）、message、location、fix
2. optimizations: 优化建议列表，每个建议包含category（performance/security/reliability/best-practices）、title、description、impact（high/medium/low）、original、optimized、reason
3. score: 配置评分（0-100）
4. summary: 总体分析摘要

请确保返回的是有效的JSON格式。`;

      const response = await generateResponse(prompt);
      
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          setAnalysisResult(result);
          toast.success('配置分析完成');
        } else {
          throw new Error('无法解析分析结果');
        }
      } catch (parseError) {
        console.error('解析错误:', parseError);
        toast.error('解析分析结果失败，请重试');
      }
    } catch (error) {
      console.error('分析错误:', error);
      toast.error('配置分析失败: ' + (error as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  }, [config, generateResponse]);

  const applyOptimization = useCallback(async (optimization: ConfigOptimization) => {
    setSelectedOptimization(optimization);
    setApplyProgress(0);

    try {
      const response = await fetch('/api/frp/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: config.replace(optimization.original, optimization.optimized)
        }),
      });

      if (response.ok) {
        for (let i = 0; i <= 100; i += 10) {
          setApplyProgress(i);
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        toast.success('优化已应用');
        setConfig(config.replace(optimization.original, optimization.optimized));
      } else {
        toast.error('应用优化失败');
      }
    } catch (error) {
      console.error('应用优化错误:', error);
      toast.error('应用优化失败: ' + (error as Error).message);
    } finally {
      setApplyProgress(0);
      setSelectedOptimization(null);
    }
  }, [config]);

  const applyAllOptimizations = useCallback(async () => {
    if (!analysisResult) return;

    let newConfig = config;
    setApplyProgress(0);

    try {
      for (let i = 0; i < analysisResult.optimizations.length; i++) {
        const opt = analysisResult.optimizations[i];
        newConfig = newConfig.replace(opt.original, opt.optimized);
        setApplyProgress(Math.round(((i + 1) / analysisResult.optimizations.length) * 100));
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      const response = await fetch('/api/frp/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newConfig }),
      });

      if (response.ok) {
        toast.success('所有优化已应用');
        setConfig(newConfig);
      } else {
        toast.error('应用优化失败');
      }
    } catch (error) {
      console.error('应用优化错误:', error);
      toast.error('应用优化失败: ' + (error as Error).message);
    } finally {
      setApplyProgress(0);
    }
  }, [analysisResult, config]);

  const getIssueIcon = useCallback((type: ConfigIssue['type']) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'suggestion':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  }, []);

  const getIssueBadgeColor = useCallback((severity: ConfigIssue['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
    }
  }, []);

  const getCategoryIcon = useCallback((category: ConfigOptimization['category']) => {
    switch (category) {
      case 'performance':
        return <Zap className="h-4 w-4 text-yellow-500" />;
      case 'security':
        return <Shield className="h-4 w-4 text-green-500" />;
      case 'reliability':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'best-practices':
        return <TrendingUp className="h-4 w-4 text-purple-500" />;
    }
  }, []);

  const getImpactBadgeColor = useCallback((impact: ConfigOptimization['impact']) => {
    switch (impact) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
    }
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            AI配置优化器
          </CardTitle>
          <CardDescription>
            使用AI分析FRP配置，提供智能优化建议
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="config-input">FRP配置内容</Label>
              <Textarea
                id="config-input"
                placeholder="在此粘贴FRP配置内容..."
                value={config}
                onChange={(e) => setConfig(e.target.value)}
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
            <Button
              onClick={analyzeConfig}
              disabled={isAnalyzing || isGenerating}
              className="w-full"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {isAnalyzing || isGenerating ? '分析中...' : '开始分析'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AnimatePresence>
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle>分析结果</CardTitle>
                <CardDescription>
                  配置评分: <span className="text-2xl font-bold text-purple-600">{analysisResult.score}</span>/100
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">{analysisResult.summary}</p>
              </CardContent>
            </Card>

            <Tabs defaultValue="issues" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="issues">
                  问题列表 ({analysisResult.issues.length})
                </TabsTrigger>
                <TabsTrigger value="optimizations">
                  优化建议 ({analysisResult.optimizations.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="issues" className="space-y-4">
                {analysisResult.issues.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                      <p className="text-lg font-medium">未发现配置问题</p>
                      <p className="text-sm text-gray-500">您的配置看起来很健康！</p>
                    </CardContent>
                  </Card>
                ) : (
                  analysisResult.issues.map((issue, index) => (
                    <Card key={index}>
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          {getIssueIcon(issue.type)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium">{issue.message}</span>
                              <Badge className={getIssueBadgeColor(issue.severity)}>
                                {issue.severity}
                              </Badge>
                            </div>
                            {issue.location && (
                              <p className="text-sm text-gray-500 mb-2">位置: {issue.location}</p>
                            )}
                            {issue.fix && (
                              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                                <p className="text-sm font-medium mb-1">修复建议:</p>
                                <code className="text-sm">{issue.fix}</code>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="optimizations" className="space-y-4">
                {analysisResult.optimizations.length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                      <p className="text-lg font-medium">暂无优化建议</p>
                      <p className="text-sm text-gray-500">您的配置已经很优秀了！</p>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    <div className="flex justify-end gap-2">
                      <Button
                        onClick={applyAllOptimizations}
                        disabled={applyProgress > 0}
                        variant="default"
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        应用所有优化
                      </Button>
                    </div>
                    {applyProgress > 0 && (
                      <div className="space-y-2">
                        <Progress value={applyProgress} />
                        <p className="text-sm text-gray-500 text-center">应用优化中... {applyProgress}%</p>
                      </div>
                    )}
                    {analysisResult.optimizations.map((opt, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="space-y-4">
                            <div className="flex items-start gap-3">
                              {getCategoryIcon(opt.category)}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium">{opt.title}</span>
                                  <Badge className={getImpactBadgeColor(opt.impact)}>
                                    {opt.impact} impact
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{opt.description}</p>
                                <p className="text-sm text-gray-500 mb-3">{opt.reason}</p>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm font-medium mb-1">原始配置:</p>
                                <code className="block p-3 bg-red-50 rounded-lg text-sm">{opt.original}</code>
                              </div>
                              <div>
                                <p className="text-sm font-medium mb-1">优化后配置:</p>
                                <code className="block p-3 bg-green-50 rounded-lg text-sm">{opt.optimized}</code>
                              </div>
                            </div>
                            <Button
                              onClick={() => applyOptimization(opt)}
                              disabled={applyProgress > 0}
                              variant="outline"
                              className="w-full"
                            >
                              <Sparkles className="h-4 w-4 mr-2" />
                              应用此优化
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
