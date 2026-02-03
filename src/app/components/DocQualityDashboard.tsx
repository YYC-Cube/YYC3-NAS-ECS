/**
 * @file 文档质量监控仪表板
 * @description 实时监控文档质量指标和统计数据
 * @module components/DocQualityDashboard
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-31
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  TrendingDown, 
  Clock,
  Target,
  Activity,
  BarChart3,
  PieChart
} from 'lucide-react';

export interface QualityMetrics {
  overallScore: number;
  accuracy: number;
  readability: number;
  completeness: number;
  consistency: number;
  usability: number;
}

export interface IssueStats {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface TrendData {
  date: string;
  score: number;
  issues: number;
}

export interface DocQualityDashboardProps {
  metrics: QualityMetrics;
  issues: IssueStats;
  trends: TrendData[];
  lastCheckTime: Date;
  docCount: number;
  checkHistory: Array<{
    date: Date;
    score: number;
    issues: number;
  }>;
}

export const DocQualityDashboard: React.FC<DocQualityDashboardProps> = ({
  metrics,
  issues,
  trends,
  lastCheckTime,
  docCount,
  checkHistory
}) => {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const filteredTrends = useMemo(() => {
    const days = selectedPeriod === '7d' ? 7 : selectedPeriod === '30d' ? 30 : 90;
    return trends.slice(-days);
  }, [trends, selectedPeriod]);

  const scoreTrend = useMemo(() => {
    if (filteredTrends.length < 2) return 0;
    const recent = filteredTrends[filteredTrends.length - 1].score;
    const previous = filteredTrends[0].score;
    return ((recent - previous) / previous) * 100;
  }, [filteredTrends]);

  const issueTrend = useMemo(() => {
    if (filteredTrends.length < 2) return 0;
    const recent = filteredTrends[filteredTrends.length - 1].issues;
    const previous = filteredTrends[0].issues;
    return ((recent - previous) / previous) * 100;
  }, [filteredTrends]);

  const getScoreColor = (score: number): string => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-blue-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number): string => {
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 70) return '合格';
    return '需改进';
  };

  const getSeverityColor = (severity: string): string => {
    const colors = {
      critical: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500'
    };
    return colors[severity as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">文档质量监控仪表板</h1>
          <p className="text-muted-foreground mt-1">
            最后更新: {lastCheckTime.toLocaleString('zh-CN')}
          </p>
        </div>
        <Tabs value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as any)}>
          <TabsList>
            <TabsTrigger value="7d">近7天</TabsTrigger>
            <TabsTrigger value="30d">近30天</TabsTrigger>
            <TabsTrigger value="90d">近90天</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总体评分</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              <span className={getScoreColor(metrics.overallScore)}>
                {metrics.overallScore.toFixed(1)}
              </span>
              <span className="text-lg text-muted-foreground ml-1">/100</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <Badge variant="outline">{getScoreBadge(metrics.overallScore)}</Badge>
              {scoreTrend !== 0 && (
                <div className={`flex items-center text-sm ${scoreTrend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {scoreTrend > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {Math.abs(scoreTrend).toFixed(1)}%
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">文档总数</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{docCount}</div>
            <p className="text-xs text-muted-foreground mt-2">
              已检查 {checkHistory.length} 次
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">问题总数</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{issues.total}</div>
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-1">
                {issues.critical > 0 && (
                  <div className={`w-2 h-2 rounded-full ${getSeverityColor('critical')}`} title={`严重: ${issues.critical}`} />
                )}
                {issues.high > 0 && (
                  <div className={`w-2 h-2 rounded-full ${getSeverityColor('high')}`} title={`重要: ${issues.high}`} />
                )}
                {issues.medium > 0 && (
                  <div className={`w-2 h-2 rounded-full ${getSeverityColor('medium')}`} title={`一般: ${issues.medium}`} />
                )}
                {issues.low > 0 && (
                  <div className={`w-2 h-2 rounded-full ${getSeverityColor('low')}`} title={`建议: ${issues.low}`} />
                )}
              </div>
              {issueTrend !== 0 && (
                <div className={`flex items-center text-sm ${issueTrend > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {issueTrend > 0 ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {Math.abs(issueTrend).toFixed(1)}%
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">检查频率</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">每日</div>
            <p className="text-xs text-muted-foreground mt-2">
              自动检查已启用
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              质量维度评分
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">准确性</span>
                <span className={`text-sm font-bold ${getScoreColor(metrics.accuracy)}`}>
                  {metrics.accuracy.toFixed(1)}
                </span>
              </div>
              <Progress value={metrics.accuracy} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">可读性</span>
                <span className={`text-sm font-bold ${getScoreColor(metrics.readability)}`}>
                  {metrics.readability.toFixed(1)}
                </span>
              </div>
              <Progress value={metrics.readability} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">完整性</span>
                <span className={`text-sm font-bold ${getScoreColor(metrics.completeness)}`}>
                  {metrics.completeness.toFixed(1)}
                </span>
              </div>
              <Progress value={metrics.completeness} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">一致性</span>
                <span className={`text-sm font-bold ${getScoreColor(metrics.consistency)}`}>
                  {metrics.consistency.toFixed(1)}
                </span>
              </div>
              <Progress value={metrics.consistency} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">实用性</span>
                <span className={`text-sm font-bold ${getScoreColor(metrics.usability)}`}>
                  {metrics.usability.toFixed(1)}
                </span>
              </div>
              <Progress value={metrics.usability} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              问题分布
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getSeverityColor('critical')}`} />
                <span className="text-sm">严重问题</span>
              </div>
              <Badge variant="destructive">{issues.critical}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getSeverityColor('high')}`} />
                <span className="text-sm">重要问题</span>
              </div>
              <Badge variant="secondary" className="bg-orange-500">{issues.high}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getSeverityColor('medium')}`} />
                <span className="text-sm">一般问题</span>
              </div>
              <Badge variant="secondary" className="bg-yellow-500">{issues.medium}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${getSeverityColor('low')}`} />
                <span className="text-sm">建议性意见</span>
              </div>
              <Badge variant="secondary" className="bg-green-500">{issues.low}</Badge>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">总计</span>
                <Badge variant="outline">{issues.total}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            质量趋势
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end justify-between gap-2">
            {filteredTrends.map((trend, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                  style={{ 
                    height: `${(trend.score / 100) * 200}px`,
                    opacity: index === filteredTrends.length - 1 ? 1 : 0.7
                  }}
                />
                <div className="text-xs text-muted-foreground mt-2 text-center">
                  {new Date(trend.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            检查历史
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {checkHistory.slice(-10).reverse().map((check, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <div>
                    <div className="text-sm font-medium">检查完成</div>
                    <div className="text-xs text-muted-foreground">
                      {check.date.toLocaleString('zh-CN')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-bold ${getScoreColor(check.score)}`}>
                    {check.score.toFixed(1)} 分
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {check.issues} 个问题
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
