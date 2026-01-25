/**
 * @file EmailList组件 - 邮件列表展示组件（优化版）
 * @description 遵循五高标准和五标规范的邮件列表系统
 * @features 3D边框视觉、边线阴影系统、四态交互、主题色彩映射
 * @module components/email
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CheckCircle2, Star, Trash2, Mail, Tag } from 'lucide-react';

// 邮件项接口
interface EmailItem {
  id: string;
  sender: {
    name: string;
    email: string;
    avatar?: string;
    department?: string;
  };
  subject: string;
  preview: string;
  date: string;
  isRead: boolean;
  isStarred: boolean;
  attachments?: number;
  priority?: 'high' | 'normal' | 'low';
  hasAIReply?: boolean;
  category?: string;
}

/**
 * 邮件列表组件 - 优化版
 * 特性：
 * - 3D边框视觉效果
 * - 边线阴影系统（3px/4px/5px层次）
 * - 四态交互（静态、悬浮、选中、激活）
 * - 响应式设计
 */
export const EmailList: React.FC = () => {
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  // 模拟获取邮件列表数据
  useEffect(() => {
    const mockEmails: EmailItem[] = [
      {
        id: '1',
        sender: { 
          name: '李明华', 
          email: 'li.minghua@company.com',
          department: '产品部'
        },
        subject: '[紧急] Q4产品路线图评审会议',
        preview: '各位同事，本周五下午2点将在3楼会议室举行Q4产品路线图评审会议，请携带相关数据分析报告...',
        date: '今天 10:30',
        isRead: false,
        isStarred: true,
        attachments: 3,
        priority: 'high',
        hasAIReply: true,
        category: '工作'
      },
      {
        id: '2',
        sender: { 
          name: '人力资源部', 
          email: 'hr@company.com',
          department: '人力资源部'
        },
        subject: '【通知】2024年度绩效考核启动通知',
        preview: '各部门负责人：2024年度绩效考核工作即将启动，请于12月31日前完成部门员工初评工作。详情请查看附件...',
        date: '今天 09:15',
        isRead: true,
        isStarred: false,
        attachments: 2,
        priority: 'normal',
        category: '工作'
      },
      {
        id: '3',
        sender: { 
          name: '张伟', 
          email: 'zhang.wei@company.com',
          department: '技术部'
        },
        subject: 'Re: 微服务架构升级方案讨论',
        preview: 'Hi team, 关于昨天讨论的微服务架构升级方案，我已完成技术调研，发现Kubernetes + Istio的组合方案更适合我们现有的业务场景...',
        date: '今天 08:45',
        isRead: false,
        isStarred: false,
        attachments: 1,
        priority: 'normal',
        hasAIReply: true,
        category: '工作'
      },
      {
        id: '4',
        sender: { 
          name: '王芳', 
          email: 'wang.fang@company.com',
          department: '设计部'
        },
        subject: '【设计评审】移动端UI界面设计稿V3.0',
        preview: '大家好，最新版本的移动端UI设计稿已经完成，主要优化了用户注册流程和个人中心页面，请各位查看并提出宝贵意见...',
        date: '昨天 16:45',
        isRead: false,
        isStarred: true,
        attachments: 5,
        priority: 'high',
        category: '工作'
      },
      {
        id: '5',
        sender: { 
          name: 'IT服务台', 
          email: 'itservicedesk@company.com',
          department: 'IT支持部'
        },
        subject: '【维护通知】周六凌晨2:00-6:00系统升级维护',
        preview: '尊敬的用户：为提升系统性能和用户体验，我们将于本周六凌晨2:00-6:00进行系统升级维护，期间邮件服务器、OA系统将暂停服务...',
        date: '昨天 14:20',
        isRead: true,
        isStarred: false,
        priority: 'normal',
        category: '工作'
      },
      {
        id: '6',
        sender: { 
          name: '陈杰', 
          email: 'chen.jie@company.com',
          department: '财务部'
        },
        subject: '[审批] 第四季度市场推广预算申请',
        preview: '各位领导：现申请第四季度市场推广预算总计120万元，用于新产品发布会、线上广告投放及KOL合作等项目...',
        date: '昨天 11:30',
        isRead: false,
        isStarred: false,
        attachments: 4,
        priority: 'high',
        category: '财务'
      },
      {
        id: '7',
        sender: { 
          name: 'GitHub Notifications', 
          email: 'noreply@github.com',
          department: '外部系统'
        },
        subject: '[company/backend] Pull Request #324: Optimize database query performance',
        preview: '@zhangwei mentioned you in a pull request: 已完成数据库查询性能优化，通过添加索引和优化SQL语句，响应时间从350ms降至45ms...',
        date: '前天 18:20',
        isRead: true,
        isStarred: false,
        priority: 'normal',
        hasAIReply: true,
        category: '个人'
      },
      {
        id: '8',
        sender: { 
          name: '行政部', 
          email: 'admin@company.com',
          department: '行政部'
        },
        subject: '【福利】2024年团建活动方案征集',
        preview: '亲爱的同事们：为丰富员工业余生活，增进团队凝聚力，现向全体员工征集2024年度团建活动方案。优秀方案将获得奖励...',
        date: '前天 15:00',
        isRead: true,
        isStarred: true,
        priority: 'low',
        category: '个人'
      },
    ];

    setTimeout(() => {
      setEmails(mockEmails);
      setLoading(false);
    }, 500);
  }, []);

  // 切换邮件选中状态
  const toggleEmailSelection = (emailId: string) => {
    setSelectedEmails(prev => 
      prev.includes(emailId) 
        ? prev.filter(id => id !== emailId)
        : [...prev, emailId]
    );
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedEmails.length === emails.length) {
      setSelectedEmails([]);
    } else {
      setSelectedEmails(emails.map(email => email.id));
    }
  };

  // 切换邮件星标状态
  const toggleStarStatus = (emailId: string) => {
    setEmails(prev => 
      prev.map(email => 
        email.id === emailId 
          ? { ...email, isStarred: !email.isStarred }
          : email
      )
    );
  };

  if (loading) {
    return (
      <div 
        className="flex justify-center items-center h-64 bg-white rounded-lg"
        style={{
          borderTop: '1px solid rgba(0, 0, 0, 0.05)',
          borderLeft: '4px solid var(--module-cpu-primary)',
          borderRight: '1px solid rgba(0, 0, 0, 0.05)',
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
        }}
      >
        <div className="text-center">
          <div 
            className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
            style={{ color: 'var(--module-cpu-primary)' }}
            role="status"
          >
            <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
              加载中...
            </span>
          </div>
          <p className="mt-2 text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="bg-white rounded-lg overflow-hidden"
      style={{
        /* 完整四边边框系统 - 优化为阴影灰 */
        borderTop: '1px solid rgba(0, 0, 0, 0.05)',
        borderLeft: '4px solid var(--module-cpu-primary)',
        borderRight: '1px solid rgba(0, 0, 0, 0.05)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
      }}
    >
      {/* 邮件列表工具栏 - 灰色系优化 */}
      <div 
        className="flex items-center justify-between p-3"
        style={{
          borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
          backgroundColor: '#f9fafb', // gray-50
        }}
      >
        <div className="flex items-center space-x-2">
          <ToolbarButton
            icon={selectedEmails.length > 0 && selectedEmails.length === emails.length ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <div className={`h-5 w-5 rounded border-2 ${selectedEmails.length > 0 ? 'border-[var(--module-cpu-primary)] bg-[rgba(42,110,187,0.1)]' : 'border-gray-300'}`}></div>
            )}
            onClick={toggleSelectAll}
            isActive={selectedEmails.length > 0}
            aria-label="全选"
          />
          <ToolbarButton
            icon={<Trash2 className="h-4 w-4" />}
            onClick={() => {}}
            disabled={selectedEmails.length === 0}
            aria-label="删除"
          />
          <ToolbarButton
            icon={<Mail className="h-4 w-4" />}
            onClick={() => {}}
            disabled={selectedEmails.length === 0}
            aria-label="标记为已读"
          />
          <ToolbarButton
            icon={<Tag className="h-4 w-4" />}
            onClick={() => {}}
            disabled={selectedEmails.length === 0}
            aria-label="添加标签"
          />
        </div>
        <div className="text-sm text-gray-500">
          {selectedEmails.length > 0 ? `已选 ${selectedEmails.length} / ` : ''}
          {emails.length} 封邮件
        </div>
      </div>

      {/* 邮件列表 */}
      <div>
        {emails.map((email, index) => (
          <EmailRow
            key={email.id}
            email={email}
            isSelected={selectedEmails.includes(email.id)}
            onToggleSelect={() => toggleEmailSelection(email.id)}
            onToggleStar={() => toggleStarStatus(email.id)}
            index={index}
          />
        ))}
      </div>
    </div>
  );
};

/* ==================== 子组件 ==================== */

/**
 * 工具栏按钮组件 - 四态交互
 */
interface ToolbarButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  'aria-label': string;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ 
  icon, 
  onClick, 
  isActive, 
  disabled,
  'aria-label': ariaLabel 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  return (
    <motion.button
      className="p-2 rounded transition-all duration-200"
      style={{
        backgroundColor: isActive 
          ? 'var(--module-cpu-primary)' 
          : isHovered && !disabled 
            ? 'rgba(0, 0, 0, 0.05)' 
            : 'transparent',
        color: isActive 
          ? '#ffffff' 
          : disabled 
            ? '#d1d5db' 
            : '#4b5563', // gray-600
        border: `2px solid ${isActive ? 'var(--module-cpu-primary)' : 'transparent'}`,
        boxShadow: isPressed && !disabled 
          ? 'inset 0 1px 2px rgba(0, 0, 0, 0.1)' 
          : isHovered && !disabled 
            ? '0 1px 2px rgba(0, 0, 0, 0.05)' 
            : 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={() => !disabled && setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => !disabled && setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={() => !disabled && onClick()}
      disabled={disabled}
      aria-label={ariaLabel}
      whileHover={!disabled ? { rotate: 5 } : {}}
      whileTap={!disabled ? { rotate: -5 } : {}}
      initial={false}
      animate={{
        scale: !disabled ? (isPressed ? 0.95 : isHovered ? 1.05 : 1) : 1
      }}
    >
      {icon}
    </motion.button>
  );
};

/**
 * 邮件行组件 - 四态交互
 */
interface EmailRowProps {
  email: EmailItem;
  isSelected: boolean;
  onToggleSelect: () => void;
  onToggleStar: () => void;
  index: number;
}

const EmailRow: React.FC<EmailRowProps> = ({ 
  email, 
  isSelected, 
  onToggleSelect, 
  onToggleStar,
  index 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  return (
    <motion.div
      className="flex items-center p-4 cursor-pointer transition-all duration-200 relative"
      style={{
        backgroundColor: isSelected 
          ? 'rgba(42, 110, 187, 0.08)' 
          : isHovered 
            ? '#f9fafb' // gray-50
            : '#ffffff',
        borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
        borderLeft: `3px solid ${isSelected ? 'var(--module-cpu-primary)' : 'transparent'}`,
        boxShadow: isSelected 
          ? '0 2px 4px rgba(0, 0, 0, 0.05)' 
          : 'none',
        transform: isPressed ? 'translateX(2px)' : isHovered ? 'translateX(-1px)' : 'translateX(0)',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsPressed(false);
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onClick={(e) => {
        if (!(e.target as HTMLElement).closest('button')) {
          onToggleSelect();
        }
      }}
    >
      {/* 选择框 */}
      <button 
        className="mr-3 shrink-0"
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelect();
        }}
      >
        {isSelected ? (
          <CheckCircle2 className="h-5 w-5" style={{ color: 'var(--module-cpu-primary)' }} />
        ) : (
          <div 
            className={`h-5 w-5 rounded border-2 transition-all duration-200`}
            style={{
              borderColor: email.isRead ? '#d1d5db' : 'var(--module-cpu-primary)',
              backgroundColor: email.isRead ? 'transparent' : 'rgba(42, 110, 187, 0.05)',
            }}
          />
        )}
      </button>
      
      {/* 星标按钮 */}
      <StarButton isStarred={email.isStarred} onClick={onToggleStar} />
      
      {/* 邮件内容 */}
      <div className={`flex-1 min-w-0`}>
        <div className="flex justify-between mb-1">
          <div 
            className="truncate max-w-xs"
            style={{ 
              color: 'var(--module-cpu-dark)',
              fontWeight: email.isRead ? 400 : 500,
            }}
          >
            {email.sender.name}
          </div>
          <div 
            className="text-sm whitespace-nowrap ml-4 text-gray-500"
          >
            {email.date}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div 
            className="truncate mr-4"
            style={{ 
              color: 'var(--module-cpu-primary)',
              fontWeight: email.isRead ? 400 : 500,
            }}
          >
            {email.subject}
          </div>
          {email.attachments && (
            <div 
              className="text-xs whitespace-nowrap mr-2 px-2 py-0.5 rounded"
              style={{ 
                color: 'var(--module-cpu-primary)',
                backgroundColor: 'rgba(42, 110, 187, 0.1)',
                border: '1px solid var(--module-cpu-primary)',
              }}
            >
              📎 {email.attachments}
            </div>
          )}
        </div>
        <div 
          className="truncate text-sm max-w-2xl mt-1 text-gray-400"
        >
          {email.preview}
        </div>
      </div>
    </motion.div>
  );
};

/**
 * 星标按钮组件 - 四态交互
 */
interface StarButtonProps {
  isStarred: boolean;
  onClick: () => void;
}

const StarButton: React.FC<StarButtonProps> = ({ isStarred, onClick }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.button
      className="mr-3 shrink-0 transition-all duration-200"
      style={{
        color: isStarred ? '#F39C12' : isHovered ? '#F39C12' : '#d1d5db',
        transform: isHovered ? 'scale(1.2) rotate(15deg)' : 'scale(1) rotate(0deg)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      whileHover={{ scale: 1.2, rotate: 15 }}
      whileTap={{ scale: 0.9, rotate: -15 }}
    >
      <Star 
        className={`h-4 w-4 ${isStarred ? 'fill-current' : ''}`}
      />
    </motion.button>
  );
};

export default EmailList;