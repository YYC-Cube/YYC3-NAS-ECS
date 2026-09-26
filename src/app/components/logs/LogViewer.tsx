/**
 * @file LogViewer - 日志查看器组件
 * @description 提供系统日志的实时查看、过滤、搜索与清理功能
 * @module components/logs/LogViewer
 * @author YYC³
 * @version 1.0.0
 * @created 2026-09-26
 */

import { Download, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { logService } from '../../services/logService';
import { LogLevel, type LogEntry } from '../../types/logs';

const LEVEL_COLORS: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'text-gray-400 bg-gray-100 dark:bg-gray-800',
  [LogLevel.INFO]: 'text-blue-600 bg-blue-50 dark:bg-blue-900/30',
  [LogLevel.WARN]: 'text-amber-600 bg-amber-50 dark:bg-amber-900/30',
  [LogLevel.ERROR]: 'text-red-600 bg-red-50 dark:bg-red-900/30',
  [LogLevel.FATAL]: 'text-red-700 bg-red-100 dark:bg-red-900/50',
};

export function LogViewer() {
  const [keyword, setKeyword] = useState('');
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'ALL'>('ALL');
  const [logs, setLogs] = useState<LogEntry[]>(() => logService.getRecentLogs(200));

  const stats = useMemo(() => logService.getStats(), [logs]);

  const refreshLogs = () => {
    setLogs(logService.getRecentLogs(200));
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (levelFilter !== 'ALL' && log.level !== levelFilter) return false;
      if (keyword && !log.message.toLowerCase().includes(keyword.toLowerCase())) return false;
      return true;
    });
  }, [logs, levelFilter, keyword]);

  const handleClear = () => {
    logService.clearLogs();
    refreshLogs();
  };

  const handleExport = () => {
    logService.downloadLogs({ keyword: keyword || undefined }, { format: 'json', includeDetails: true, compress: false });
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">系统日志</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            共 {stats.total} 条日志 · 错误率 {stats.errorRate.toFixed(2)}%
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshLogs}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title="刷新"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExport}
            className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title="导出"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={handleClear}
            className="p-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="清理"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索日志..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={levelFilter}
          onChange={(e) => setLevelFilter(e.target.value as LogLevel | 'ALL')}
          className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="ALL">全部级别</option>
          {Object.values(LogLevel).map((level) => (
            <option key={level} value={level}>{level}</option>
          ))}
        </select>
      </div>

      <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="max-h-[600px] overflow-auto">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-gray-400">暂无日志记录</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">时间</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">级别</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">分类</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">服务</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600 dark:text-gray-300">消息</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-3 py-2 text-gray-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${LEVEL_COLORS[log.level]}`}>
                        {log.level}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{log.category}</td>
                    <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{log.service}</td>
                    <td className="px-3 py-2 text-gray-700 dark:text-gray-200">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default LogViewer;
