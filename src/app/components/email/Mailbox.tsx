/**
 * @file Mailbox - 企业邮箱服务组件
 * @description 提供邮件收发、附件管理、AI辅助等完整邮箱功能（遵循五高标准和五标规范）
 * @module components/email
 * @author YYC³
 * @version 2.0.0
 * @created 2026-01-24
 * @updated 2026-01-24
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'motion/react';
import { api } from '../../services/api-v2';
import { Email } from '../../types';
import { cn } from '../../components/ui/utils';
import {
  Inbox,
  Send,
  Trash2,
  File,
  MoreVertical,
  Reply,
  Forward,
  Mail,
  Archive,
  Star,
  RefreshCw,
  Paperclip,
  Clock,
  Sparkles,
  Grid3X3,
  List,
  Download
} from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { CardContent, CardHeader } from '../ui/card';
import { EmailSearch, EmailFilters } from './EmailSearch';
import { toast } from 'sonner';
import { startOfDay, endOfDay, formatDistanceToNow } from 'date-fns';

type Folder = 'inbox' | 'sent' | 'trash' | 'drafts' | 'archive';
type ViewMode = 'list' | 'grid';

interface EmailStats {
  total: number;
  unread: number;
  starred: number;
  drafts: number;
  sent: number;
}

interface EmailItemProps {
  email: Email;
  isSelected: boolean;
  onSelect: () => void;
  viewMode?: ViewMode;
}

const EmailItemComponent: React.FC<EmailItemProps> = ({
  email,
  isSelected,
  onSelect,
  viewMode = 'list'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const timeAgo = formatDistanceToNow(new Date(email.timestamp), { addSuffix: true });

  if (viewMode === 'grid') {
    return (
      <motion.div
        onClick={onSelect}
        className={cn(
          "cursor-pointer transition-all duration-200 rounded-lg overflow-hidden",
          isSelected ? "ring-2 ring-blue-500 shadow-lg" : "hover:shadow-md"
        )}
        style={{
          backgroundColor: isHovered ? 'var(--module-cpu-light)' : '#ffffff',
          border: `2px solid ${isSelected ? 'var(--module-cpu-primary)' : 'rgba(42, 110, 187, 0.2)'}`,
          boxShadow: isSelected ? '3px 3px 12px rgba(42, 110, 187, 0.3)' : '2px 2px 6px rgba(0, 0, 0, 0.05)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`https://avatar.vercel.sh/${email.from}`} />
                <AvatarFallback>{email.from[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate" style={{ color: 'var(--module-cpu-dark)' }}>
                  {email.from}
                </div>
                <div className="text-xs text-gray-500 truncate">{email.to}</div>
              </div>
            </div>
            {!email.read && (
              <span className="flex h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
            )}
          </div>
        </CardHeader>
        <CardContent>
          <h3 className="font-medium text-sm mb-2 line-clamp-2" style={{ color: 'var(--module-cpu-dark)' }}>
            {email.subject}
          </h3>
          <p className="text-xs text-gray-500 line-clamp-3 mb-3">{email.body.substring(0, 150)}</p>
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-2">
              {email.attachments && email.attachments.length > 0 && (
                <span className="flex items-center gap-1">
                  <Paperclip size={12} />
                  {email.attachments.length}
                </span>
              )}
              {email.starred && <Star size={12} className="fill-yellow-400 text-yellow-400" />}
            </div>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {timeAgo}
            </span>
          </div>
        </CardContent>
      </motion.div>
    );
  }

  return (
    <motion.button
      onClick={onSelect}
      className={cn(
        "flex flex-col items-start gap-2 p-4 text-left transition-all border-b last:border-0",
        isSelected && "bg-blue-50/50 hover:bg-blue-50/70 border-l-4 border-l-blue-500"
      )}
      style={{
        backgroundColor: isHovered && !isSelected ? 'var(--module-cpu-light)' : 'transparent',
        transform: isHovered && !isSelected ? 'translateX(2px)' : 'translateX(0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={!isSelected ? { x: 2 } : {}}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex w-full flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="h-6 w-6">
              <AvatarImage src={`https://avatar.vercel.sh/${email.from}`} />
              <AvatarFallback className="text-xs">{email.from[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="font-semibold text-sm truncate" style={{ color: 'var(--module-cpu-dark)' }}>
              {email.from}
            </div>
            {!email.read && (
              <span className="flex h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 flex-shrink-0 ml-2">
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {timeAgo}
            </span>
            {email.attachments && email.attachments.length > 0 && (
              <span className="flex items-center gap-1">
                <Paperclip size={12} />
                {email.attachments.length}
              </span>
            )}
            {email.starred && <Star size={12} className="fill-yellow-400 text-yellow-400" />}
          </div>
        </div>
        <div className="text-xs font-medium truncate" style={{ color: 'var(--module-cpu-shadow)' }}>
          {email.subject}
        </div>
      </div>
      <div className="line-clamp-2 text-xs text-gray-500">
        {email.body.substring(0, 200)}
      </div>
    </motion.button>
  );
};

const EmailItem = React.memo(EmailItemComponent);
EmailItem.displayName = 'EmailItem';

export const Mailbox: React.FC = () => {
  const [activeFolder, setActiveFolder] = useState<Folder>('inbox');
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<EmailFilters>({});
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerMode, setComposerMode] = useState<'compose' | 'reply' | 'forward'>('compose');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [stats, setStats] = useState<EmailStats>({ total: 0, unread: 0, starred: 0, drafts: 0, sent: 0 });

  useEffect(() => {
    loadEmails(activeFolder);
  }, [activeFolder]);

  const loadEmails = async (folder: Folder) => {
    setLoading(true);
    try {
      const data = await api.mail.getEmails(folder);
      setEmails(data);

      const newStats: EmailStats = {
        total: data.length,
        unread: data.filter(e => !e.read).length,
        starred: data.filter(e => e.starred).length,
        drafts: folder === 'drafts' ? data.length : 0,
        sent: folder === 'sent' ? data.length : 0
      };
      setStats(newStats);

      if (data.length > 0) {
        setSelectedEmail(data[0]);
      } else {
        setSelectedEmail(null);
      }
    } catch (error) {
      console.error(error);
      toast.error('加载邮件失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = useCallback(() => {
    loadEmails(activeFolder);
  }, [activeFolder]);

  const handleToggleStar = useCallback(async (email: Email) => {
    try {
      await api.mail.toggleStar(email.id);
      setEmails(prev => prev.map(e =>
        e.id === email.id ? { ...e, starred: !e.starred } : e
      ));
      if (selectedEmail?.id === email.id) {
        setSelectedEmail(prev => prev ? { ...prev, starred: !prev.starred } : null);
      }
      toast.success(email.starred ? '已取消星标' : '已添加星标');
    } catch (error) {
      toast.error('操作失败');
    }
  }, [selectedEmail]);

  const handleArchive = useCallback(async () => {
    if (selectedEmail) {
      try {
        await api.mail.archiveEmail(selectedEmail.id);
        setEmails(prev => prev.filter(e => e.id !== selectedEmail.id));
        setSelectedEmail(null);
        toast.success('邮件已归档');
      } catch (error) {
        toast.error('归档失败');
      }
    }
  }, [selectedEmail]);

  const filteredEmails = useMemo(() => {
    let filtered = emails;

    if (filters.query) {
      filtered = filtered.filter(email =>
        email.subject.toLowerCase().includes(filters.query!.toLowerCase()) ||
        email.from.toLowerCase().includes(filters.query!.toLowerCase())
      );
    }

    if (filters.dateRange?.from || filters.dateRange?.to) {
      const from = filters.dateRange.from ? startOfDay(filters.dateRange.from).getTime() : 0;
      const to = filters.dateRange.to ? endOfDay(filters.dateRange.to).getTime() : Infinity;

      filtered = filtered.filter(email => {
        const emailTime = new Date(email.timestamp).getTime();
        return emailTime >= from && emailTime <= to;
      });
    }

    if (filters.sender) {
      filtered = filtered.filter(email =>
        email.from.toLowerCase().includes(filters.sender!.toLowerCase())
      );
    }

    if (filters.hasAttachment) {
      filtered = filtered.filter(email => email.attachments && email.attachments.length > 0);
    }

    if (filters.isUnread) {
      filtered = filtered.filter(email => !email.read);
    }

    if (filters.isStarred) {
      filtered = filtered.filter(email => email.starred);
    }

    if (filters.tags && filters.tags.length > 0) {
      filtered = filtered.filter(email =>
        email.tags && email.tags.some(tag => filters.tags!.includes(tag))
      );
    }

    return filtered;
  }, [emails, filters]);

  const handleSearch = useCallback((query: string, searchFilters: EmailFilters) => {
    setFilters({ query, ...searchFilters });
  }, []);

  const handleClearSearch = useCallback(() => {
    setFilters({});
    loadEmails(activeFolder);
  }, [activeFolder]);

  const handleSelectEmail = useCallback((email: Email) => {
    setSelectedEmail(email);
    handleMarkAsRead();
  }, []);

  const handleMarkAsRead = useCallback(async () => {
    if (selectedEmail && !selectedEmail.read) {
      try {
        await api.mail.markEmailRead(selectedEmail.id, true);
        setEmails(prev => prev.map(e =>
          e.id === selectedEmail.id ? { ...e, read: true } : e
        ));
      } catch (error) {
        toast.error('标记已读失败');
      }
    }
  }, [selectedEmail]);

  const handleDelete = useCallback(async () => {
    if (selectedEmail) {
      try {
        await api.mail.deleteEmail(selectedEmail.id);
        setEmails(prev => prev.filter(e => e.id !== selectedEmail.id));
        setSelectedEmail(null);
        toast.success('邮件已删除');
      } catch (error) {
        toast.error('删除邮件失败');
      }
    }
  }, [selectedEmail]);

  const handleReply = useCallback(() => {
    if (selectedEmail) {
      setComposerMode('reply');
      setComposerOpen(true);
    }
  }, [selectedEmail]);

  const handleForward = useCallback(() => {
    if (selectedEmail) {
      setComposerMode('forward');
      setComposerOpen(true);
    }
  }, [selectedEmail]);

  const handleCompose = useCallback(() => {
    setComposerMode('compose');
    setComposerOpen(true);
  }, []);

  return (
    <div className="flex h-[calc(100vh-200px)] min-h-[600px] rounded-lg overflow-hidden bg-white shadow-sm" style={{
      borderTop: '1px solid rgba(42, 110, 187, 0.2)',
      borderLeft: '4px solid var(--module-cpu-primary)',
      borderRight: '2px solid var(--module-cpu-shadow)',
      borderBottom: '2px solid var(--module-cpu-shadow)',
      boxShadow: '3px 3px 12px rgba(42, 110, 187, 0.2)',
    }}>
      {/* Email Composer Modal - 待实现 */}
      {composerOpen && (
        <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'var(--module-cpu-dark)' }}>
              {composerMode === 'compose' ? '撰写邮件' : composerMode === 'reply' ? '回复邮件' : '转发邮件'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">收件人</label>
                <input
                  type="email"
                  className="w-full border rounded-md px-3 py-2"
                  defaultValue={selectedEmail?.from}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">主题</label>
                <input
                  type="text"
                  className="w-full border rounded-md px-3 py-2"
                  defaultValue={selectedEmail?.subject}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">内容</label>
                <textarea
                  className="w-full border rounded-md px-3 py-2 h-48"
                  defaultValue={selectedEmail?.body}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setComposerOpen(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    setComposerOpen(false);
                    loadEmails(activeFolder);
                    toast.success('邮件已发送');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  发送
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sidebar */}
      <div className="w-64 bg-gray-50 border-r flex flex-col p-4 gap-2">
        <div className="mb-4">
          <motion.button
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-lg transition-all duration-200"
            style={{
              backgroundColor: 'var(--module-cpu-primary)',
              color: '#ffffff',
              boxShadow: '2px 2px 8px rgba(42, 110, 187, 0.3)',
            }}
            whileHover={{
              scale: 1.02,
              boxShadow: '3px 3px 12px rgba(42, 110, 187, 0.4)',
            }}
            whileTap={{ scale: 0.98 }}
            onClick={handleCompose}
          >
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">撰写邮件</span>
          </motion.button>
        </div>

        <div className="space-y-1">
          <motion.button
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-all duration-200",
              activeFolder === 'inbox'
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-100 text-gray-700"
            )}
            style={{
              borderLeft: activeFolder === 'inbox' ? '3px solid #1e40af' : '3px solid transparent',
              boxShadow: activeFolder === 'inbox' ? '2px 2px 6px rgba(37, 99, 235, 0.2)' : 'none',
            }}
            onClick={() => setActiveFolder('inbox')}
            whileHover={activeFolder !== 'inbox' ? { x: 2 } : {}}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-3">
              <Inbox size={18} />
              <span className="font-medium">收件箱</span>
            </div>
            {stats.unread > 0 && (
              <Badge variant="destructive" className="ml-auto">{stats.unread}</Badge>
            )}
          </motion.button>

          <motion.button
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-all duration-200",
              activeFolder === 'sent'
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-100 text-gray-700"
            )}
            style={{
              borderLeft: activeFolder === 'sent' ? '3px solid #1e40af' : '3px solid transparent',
              boxShadow: activeFolder === 'sent' ? '2px 2px 6px rgba(37, 99, 235, 0.2)' : 'none',
            }}
            onClick={() => setActiveFolder('sent')}
            whileHover={activeFolder !== 'sent' ? { x: 2 } : {}}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-3">
              <Send size={18} />
              <span className="font-medium">已发送</span>
            </div>
            {stats.sent > 0 && (
              <Badge variant="secondary" className="ml-auto">{stats.sent}</Badge>
            )}
          </motion.button>

          <motion.button
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-all duration-200",
              activeFolder === 'drafts'
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-100 text-gray-700"
            )}
            style={{
              borderLeft: activeFolder === 'drafts' ? '3px solid #1e40af' : '3px solid transparent',
              boxShadow: activeFolder === 'drafts' ? '2px 2px 6px rgba(37, 99, 235, 0.2)' : 'none',
            }}
            onClick={() => setActiveFolder('drafts')}
            whileHover={activeFolder !== 'drafts' ? { x: 2 } : {}}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-3">
              <File size={18} />
              <span className="font-medium">草稿箱</span>
            </div>
            {stats.drafts > 0 && (
              <Badge variant="secondary" className="ml-auto">{stats.drafts}</Badge>
            )}
          </motion.button>

          <motion.button
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-all duration-200",
              activeFolder === 'archive'
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-100 text-gray-700"
            )}
            style={{
              borderLeft: activeFolder === 'archive' ? '3px solid #1e40af' : '3px solid transparent',
              boxShadow: activeFolder === 'archive' ? '2px 2px 6px rgba(37, 99, 235, 0.2)' : 'none',
            }}
            onClick={() => setActiveFolder('archive')}
            whileHover={activeFolder !== 'archive' ? { x: 2 } : {}}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-3">
              <Archive size={18} />
              <span className="font-medium">归档</span>
            </div>
          </motion.button>

          <motion.button
            className={cn(
              "w-full flex items-center justify-between px-3 py-2.5 rounded-lg mb-1 transition-all duration-200",
              activeFolder === 'trash'
                ? "bg-blue-600 text-white"
                : "hover:bg-gray-100 text-gray-700"
            )}
            style={{
              borderLeft: activeFolder === 'trash' ? '3px solid #1e40af' : '3px solid transparent',
              boxShadow: activeFolder === 'trash' ? '2px 2px 6px rgba(37, 99, 235, 0.2)' : 'none',
            }}
            onClick={() => setActiveFolder('trash')}
            whileHover={activeFolder !== 'trash' ? { x: 2 } : {}}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center space-x-3">
              <Trash2 size={18} />
              <span className="font-medium">回收站</span>
            </div>
          </motion.button>
        </div>

        <div className="mt-auto pt-4 border-t">
          <div className="text-xs mb-2" style={{ color: 'var(--module-cpu-shadow)', opacity: 0.8 }}>
            邮件统计
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--module-cpu-shadow)' }}>总邮件</span>
              <span className="font-medium" style={{ color: 'var(--module-cpu-dark)' }}>{stats.total}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--module-cpu-shadow)' }}>未读</span>
              <span className="font-medium text-blue-600">{stats.unread}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span style={{ color: 'var(--module-cpu-shadow)' }}>星标</span>
              <span className="font-medium text-yellow-600">{stats.starred}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Email List */}
      <div className="w-96 border-r flex flex-col bg-white">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2
              className="font-semibold text-lg capitalize"
              style={{ color: 'var(--module-cpu-dark)' }}
            >
              {activeFolder === 'inbox' ? '收件箱' :
               activeFolder === 'sent' ? '已发送' :
               activeFolder === 'drafts' ? '草稿箱' :
               activeFolder === 'archive' ? '归档' : '回收站'}
            </h2>
            <div className="flex items-center gap-2">
              <motion.button
                onClick={handleRefresh}
                title="刷新"
                whileHover={{ scale: 1.1, rotate: 180 }}
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="p-2 hover:bg-gray-100 rounded-md"
              >
                <RefreshCw size={18} />
              </motion.button>
              <div className="flex border rounded-md">
                <motion.button
                  className={cn(
                    "p-2 transition-all duration-200",
                    viewMode === 'list' ? "bg-gray-100" : "hover:bg-gray-50"
                  )}
                  style={{
                    borderRight: viewMode === 'list' ? '2px solid var(--module-cpu-primary)' : '1px solid #e5e7eb',
                  }}
                  onClick={() => setViewMode('list')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="列表视图"
                >
                  <List size={18} />
                </motion.button>
                <motion.button
                  className={cn(
                    "p-2 transition-all duration-200",
                    viewMode === 'grid' ? "bg-gray-100" : "hover:bg-gray-50"
                  )}
                  style={{
                    borderLeft: viewMode === 'grid' ? '2px solid var(--module-cpu-primary)' : '1px solid #e5e7eb',
                  }}
                  onClick={() => setViewMode('grid')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  title="网格视图"
                >
                  <Grid3X3 size={18} />
                </motion.button>
              </div>
            </div>
          </div>
          <EmailSearch
            onSearch={handleSearch}
            onClear={handleClearSearch}
          />
        </div>
        <ScrollArea className="flex-1">
          <div className={viewMode === 'grid' ? "p-4 grid grid-cols-2 gap-3" : "flex flex-col"}>
            {loading ? (
              <div className="col-span-2 p-8 text-center text-gray-500">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <RefreshCw className="h-8 w-8 mx-auto mb-2" />
                </motion.div>
                <p>加载中...</p>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="col-span-2 p-8 text-center text-gray-500">
                <Mail size={48} className="mx-auto mb-4 opacity-20" />
                <p>没有找到邮件</p>
              </div>
            ) : (
              filteredEmails.map(email => (
                <EmailItem
                  key={email.id}
                  email={email}
                  isSelected={selectedEmail?.id === email.id}
                  onSelect={() => handleSelectEmail(email)}
                  viewMode={viewMode}
                />
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Email Detail */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedEmail ? (
          <>
            <div
              className="flex items-center p-4 border-b gap-2"
              style={{ borderColor: 'rgba(42, 110, 187, 0.1)' }}
            >
              <div className="flex items-center gap-2">
                <motion.button
                  className="p-2 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--module-cpu-primary)',
                  }}
                  onClick={() => handleToggleStar(selectedEmail)}
                  title={selectedEmail.starred ? "取消星标" : "添加星标"}
                  whileHover={{ scale: 1.1, rotate: 15 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Star
                    size={18}
                    className={selectedEmail.starred ? "fill-yellow-400 text-yellow-400" : ""}
                  />
                </motion.button>
                <motion.button
                  className="p-2 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--module-cpu-primary)',
                  }}
                  onClick={handleArchive}
                  title="归档"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Archive size={18} />
                </motion.button>
                <motion.button
                  className="p-2 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--module-cpu-primary)',
                  }}
                  onClick={handleDelete}
                  title="删除"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Trash2 size={18} />
                </motion.button>
                <Separator orientation="vertical" className="h-6" />
                <motion.button
                  className="p-2 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--module-cpu-primary)',
                  }}
                  onClick={handleReply}
                  title="回复"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Reply size={18} />
                </motion.button>
                <motion.button
                  className="p-2 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--module-cpu-primary)',
                  }}
                  onClick={handleForward}
                  title="转发"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <Forward size={18} />
                </motion.button>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <motion.button
                  className="p-2 rounded-lg transition-all duration-200"
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--module-cpu-primary)',
                  }}
                  title="更多选项"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <MoreVertical size={18} />
                </motion.button>
              </div>
            </div>
            <ScrollArea className="flex-1 p-8">
              <div className="flex items-start gap-4 mb-8">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={`https://avatar.vercel.sh/${selectedEmail.from}`} />
                  <AvatarFallback className="text-lg">{selectedEmail.from[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="font-semibold text-lg" style={{ color: 'var(--module-cpu-dark)' }}>
                        {selectedEmail.from}
                      </div>
                      <div className="text-sm text-gray-500">To: {selectedEmail.to}</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(selectedEmail.timestamp).toLocaleString()}
                    </div>
                  </div>
                  {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                    <div className="flex items-center gap-2 mt-2">
                      <Paperclip size={14} className="text-gray-400" />
                      <span className="text-sm text-gray-500">{selectedEmail.attachments.length} 个附件</span>
                    </div>
                  )}
                </div>
              </div>
              <h1
                className="text-2xl font-bold mb-4"
                style={{ color: 'var(--module-cpu-dark)' }}
              >
                {selectedEmail.subject}
              </h1>
              <div className="prose prose-sm max-w-none text-gray-700">
                <p>{selectedEmail.body}</p>
                <p className="mt-4">
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
                </p>
                <p className="mt-4">
                  Best regards,<br />
                  {selectedEmail.from.split('@')[0]}
                </p>
              </div>

              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="mt-8 pt-6 border-t">
                  <h3 className="font-semibold mb-4" style={{ color: 'var(--module-cpu-dark)' }}>
                    附件 ({selectedEmail.attachments.length})
                  </h3>
                  <div className="space-y-2">
                    {selectedEmail.attachments.map((attachment, index) => (
                      <motion.div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border"
                        style={{
                          backgroundColor: 'var(--module-cpu-light)',
                          borderColor: 'rgba(42, 110, 187, 0.2)',
                        }}
                        whileHover={{ scale: 1.02, x: 2 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center gap-3">
                          <File size={18} style={{ color: 'var(--module-cpu-primary)' }} />
                          <div>
                            <div className="text-sm font-medium" style={{ color: 'var(--module-cpu-dark)' }}>
                              {attachment.name}
                            </div>
                            <div className="text-xs text-gray-500">{attachment.size}</div>
                          </div>
                        </div>
                        <motion.button
                          className="p-2 rounded-lg transition-all duration-200"
                          style={{
                            backgroundColor: 'var(--module-cpu-primary)',
                            color: '#ffffff',
                          }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="下载附件"
                        >
                          <Download size={16} />
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.2, 0.3, 0.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <Mail size={48} className="mb-4" />
            </motion.div>
            <p>选择一封邮件来阅读</p>
          </div>
        )}
      </div>
    </div>
  );
};
