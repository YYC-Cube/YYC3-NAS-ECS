/**
 * @file EmailSearch - 邮件搜索组件
 * @description 提供邮件搜索和过滤功能
 * @module components/email
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-24
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, X, Filter } from 'lucide-react';
import { Input } from '../ui/input';

export interface EmailFilters {
  query?: string;
  dateRange?: {
    from?: Date;
    to?: Date;
  };
  sender?: string;
  hasAttachment?: boolean;
  isUnread?: boolean;
  isStarred?: boolean;
  tags?: string[];
}

interface EmailSearchProps {
  onSearch: (query: string, filters: EmailFilters) => void;
  onClear: () => void;
}

export const EmailSearch: React.FC<EmailSearchProps> = ({ onSearch, onClear }) => {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<EmailFilters>({});

  const handleSearch = () => {
    onSearch(query, filters);
  };

  const handleClear = () => {
    setQuery('');
    setFilters({});
    onClear();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="搜索邮件..."
          className="pl-10 pr-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{
            backgroundColor: 'var(--module-cpu-light)',
            border: '2px solid transparent',
            color: 'var(--module-cpu-dark)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--module-cpu-primary)';
            e.target.style.boxShadow = '0 0 0 3px rgba(42, 110, 187, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'transparent';
            e.target.style.boxShadow = 'none';
          }}
        />
        {query && (
          <motion.button
            className="absolute right-2 top-1/2 transform -translate-y-1/2"
            onClick={() => setQuery('')}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </motion.button>
        )}
      </div>
      
      <div className="flex gap-2">
        <motion.button
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-200"
          style={{
            backgroundColor: showFilters ? 'var(--module-cpu-primary)' : 'transparent',
            color: showFilters ? '#ffffff' : 'var(--module-cpu-shadow)',
            border: `2px solid ${showFilters ? 'var(--module-cpu-primary)' : 'rgba(42, 110, 187, 0.2)'}`,
          }}
          onClick={() => setShowFilters(!showFilters)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Filter size={14} />
          <span>筛选</span>
        </motion.button>
        
        <motion.button
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-200"
          style={{
            backgroundColor: 'var(--module-cpu-primary)',
            color: '#ffffff',
            border: '2px solid var(--module-cpu-primary)',
          }}
          onClick={handleSearch}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Search size={14} />
          <span>搜索</span>
        </motion.button>
        
        {(query || Object.keys(filters).length > 0) && (
          <motion.button
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-200"
            style={{
              backgroundColor: 'transparent',
              color: 'var(--module-cpu-shadow)',
              border: '2px solid rgba(42, 110, 187, 0.2)',
            }}
            onClick={handleClear}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <X size={14} />
            <span>清除</span>
          </motion.button>
        )}
      </div>
      
      {showFilters && (
        <motion.div
          className="p-4 rounded-lg border space-y-3"
          style={{
            backgroundColor: 'var(--module-cpu-light)',
            borderColor: 'rgba(42, 110, 187, 0.2)',
          }}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div>
            <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--module-cpu-shadow)' }}>
              发件人
            </label>
            <Input
              placeholder="输入发件人..."
              value={filters.sender || ''}
              onChange={(e) => setFilters({ ...filters, sender: e.target.value })}
              className="h-8"
            />
          </div>
          
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasAttachment || false}
                onChange={(e) => setFilters({ ...filters, hasAttachment: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm" style={{ color: 'var(--module-cpu-dark)' }}>有附件</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isUnread || false}
                onChange={(e) => setFilters({ ...filters, isUnread: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm" style={{ color: 'var(--module-cpu-dark)' }}>未读</span>
            </label>
            
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isStarred || false}
                onChange={(e) => setFilters({ ...filters, isStarred: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm" style={{ color: 'var(--module-cpu-dark)' }}>星标</span>
            </label>
          </div>
        </motion.div>
      )}
    </div>
  );
};
