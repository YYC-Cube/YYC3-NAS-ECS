/**
 * @file HelpCenter - 帮助中心组件
 * @description 提供FAQ、使用指南、技术支持等帮助功能
 * @module components/help
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-24
 */

import React, { useState, useEffect } from 'react';
import { ModuleCard } from '../ModuleCard';
import { 
  HelpCircle, BookOpen, MessageSquare, Search, ChevronDown,
  ThumbsUp, ThumbsDown, Clock, ExternalLink,
  Send, Plus, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { FAQ, Guide, SupportTicket } from '../../types/help';
import { helpService } from '../../services/helpService';

export const HelpCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'faq' | 'guides' | 'support'>('faq');
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [guides, setGuides] = useState<Guide[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | null>(null);
  const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: '技术问题',
    priority: 'medium' as const
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setFaqs(helpService.getFAQs());
    setGuides(helpService.getGuides());
    setTickets(helpService.getTickets());
  };

  const handleRateFAQ = (faqId: string, helpful: boolean) => {
    helpService.rateFAQ(faqId, helpful);
    toast.success('感谢您的反馈！');
    loadData();
  };

  const handleSubmitTicket = () => {
    if (!newTicket.title || !newTicket.description) {
      toast.error('请填写完整信息');
      return;
    }

    helpService.createTicket({
      title: newTicket.title,
      description: newTicket.description,
      category: newTicket.category,
      priority: newTicket.priority,
      status: 'open',
      createdBy: 'current-user'
    });

    toast.success('工单提交成功');
    setShowNewTicket(false);
    setNewTicket({
      title: '',
      description: '',
      category: '技术问题',
      priority: 'medium'
    });
    loadData();
  };

  const getDifficultyColor = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/20 text-green-400';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400';
      case 'advanced': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getDifficultyLabel = (difficulty: string): string => {
    switch (difficulty) {
      case 'beginner': return '初级';
      case 'intermediate': return '中级';
      case 'advanced': return '高级';
      default: return difficulty;
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'low': return 'bg-gray-500/20 text-gray-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'urgent': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'open': return 'bg-blue-500/20 text-blue-400';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400';
      case 'resolved': return 'bg-green-500/20 text-green-400';
      case 'closed': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'open': return '待处理';
      case 'in_progress': return '处理中';
      case 'resolved': return '已解决';
      case 'closed': return '已关闭';
      default: return status;
    }
  };

  const categories = helpService.getCategories();

  return (
    <ModuleCard title="帮助中心" level={1}>
      <div className="flex flex-col h-[700px] bg-[#2d3748] rounded-lg border border-gray-600 overflow-hidden shadow-2xl">
        
        {/* Tabs */}
        <div className="flex items-center gap-2 p-4 border-b border-gray-600 bg-[#374151]">
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
              activeTab === 'faq' ? 'bg-blue-600 text-white' : 'bg-[#4b5563] text-gray-300 hover:bg-gray-600'
            }`}
          >
            <HelpCircle size={16} />
            常见问题
          </button>
          <button
            onClick={() => setActiveTab('guides')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
              activeTab === 'guides' ? 'bg-blue-600 text-white' : 'bg-[#4b5563] text-gray-300 hover:bg-gray-600'
            }`}
          >
            <BookOpen size={16} />
            用户指南
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
              activeTab === 'support' ? 'bg-blue-600 text-white' : 'bg-[#4b5563] text-gray-300 hover:bg-gray-600'
            }`}
          >
            <MessageSquare size={16} />
            技术支持
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'faq' && (
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="搜索问题..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#4b5563] border border-gray-500 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <select 
                  className="bg-[#4b5563] border border-gray-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">全部分类</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-3">
                {faqs
                  .filter(faq => 
                    (!selectedCategory || faq.category === selectedCategory) &&
                    (!searchTerm || 
                      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                  )
                  .map(faq => (
                    <div 
                      key={faq.id}
                      className="bg-[#4b5563] rounded-lg p-4 cursor-pointer hover:bg-[#374151] transition-colors"
                      onClick={() => setSelectedFAQ(faq)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                              {faq.category}
                            </span>
                            <h3 className="font-medium text-white">{faq.question}</h3>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                              <ThumbsUp size={12} />
                              {faq.helpful}
                            </div>
                            <div className="flex items-center gap-1">
                              <ThumbsDown size={12} />
                              {faq.notHelpful}
                            </div>
                          </div>
                        </div>
                        <ChevronDown size={20} className="text-gray-500" />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'guides' && (
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="搜索指南..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-[#4b5563] border border-gray-500 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <select 
                  className="bg-[#4b5563] border border-gray-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="">全部分类</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {guides
                  .filter(guide => 
                    (!selectedCategory || guide.category === selectedCategory) &&
                    (!searchTerm || 
                      guide.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      guide.description.toLowerCase().includes(searchTerm.toLowerCase())
                    )
                  )
                  .map(guide => (
                    <div 
                      key={guide.id}
                      className="bg-[#4b5563] rounded-lg p-4 cursor-pointer hover:bg-[#374151] transition-colors"
                      onClick={() => setSelectedGuide(guide)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-white flex-1">{guide.title}</h3>
                        <ExternalLink size={16} className="text-gray-500" />
                      </div>
                      <p className="text-sm text-gray-400 mb-3">{guide.description}</p>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 rounded ${getDifficultyColor(guide.difficulty)}`}>
                          {getDifficultyLabel(guide.difficulty)}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock size={12} />
                          {guide.estimatedTime}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-white">我的工单</h2>
                <button
                  onClick={() => setShowNewTicket(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all text-sm font-medium"
                >
                  <Plus size={16} />
                  提交工单
                </button>
              </div>

              <div className="space-y-3">
                {tickets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <MessageSquare size={48} className="mb-4 opacity-50" />
                    <p className="text-lg">暂无工单</p>
                    <p className="text-sm mt-2">点击"提交工单"创建新的支持请求</p>
                  </div>
                ) : (
                  tickets.map(ticket => (
                    <div key={ticket.id} className="bg-[#4b5563] rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-white">{ticket.title}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded ${getStatusColor(ticket.status)}`}>
                              {getStatusLabel(ticket.status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400 mb-2">{ticket.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>{ticket.category}</span>
                            <span>{new Date(ticket.createdAt).toLocaleString('zh-CN')}</span>
                            <span>{ticket.responses.length} 条回复</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* FAQ Detail Modal */}
        {selectedFAQ && (
          <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50" onClick={() => setSelectedFAQ(null)}>
            <div 
              className="bg-[#2d3748] rounded-lg border border-gray-600 max-w-2xl w-full mx-4 max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-600">
                <h3 className="text-lg font-bold text-white">问题详情</h3>
                <button 
                  onClick={() => setSelectedFAQ(null)}
                  className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                >
                  <AlertCircle size={20} />
                </button>
              </div>
              <div className="p-4">
                <div className="mb-4">
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                    {selectedFAQ.category}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mb-4">{selectedFAQ.question}</h2>
                <div className="text-gray-300 whitespace-pre-wrap mb-6">{selectedFAQ.answer}</div>
                <div className="flex items-center gap-4 pt-4 border-t border-gray-600">
                  <span className="text-sm text-gray-400">这个回答有帮助吗？</span>
                  <button
                    onClick={() => handleRateFAQ(selectedFAQ.id, true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded transition-colors"
                  >
                    <ThumbsUp size={16} />
                    有帮助 ({selectedFAQ.helpful})
                  </button>
                  <button
                    onClick={() => handleRateFAQ(selectedFAQ.id, false)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                  >
                    <ThumbsDown size={16} />
                    没帮助 ({selectedFAQ.notHelpful})
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Guide Detail Modal */}
        {selectedGuide && (
          <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50" onClick={() => setSelectedGuide(null)}>
            <div 
              className="bg-[#2d3748] rounded-lg border border-gray-600 max-w-4xl w-full mx-4 max-h-[80vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-600">
                <h3 className="text-lg font-bold text-white">{selectedGuide.title}</h3>
                <button 
                  onClick={() => setSelectedGuide(null)}
                  className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                >
                  <AlertCircle size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className={`text-xs px-2 py-0.5 rounded ${getDifficultyColor(selectedGuide.difficulty)}`}>
                    {getDifficultyLabel(selectedGuide.difficulty)}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={12} />
                    {selectedGuide.estimatedTime}
                  </div>
                  <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                    {selectedGuide.category}
                  </span>
                </div>
                <div className="text-gray-300 whitespace-pre-wrap prose prose-invert max-w-none">
                  {selectedGuide.content}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* New Ticket Modal */}
        {showNewTicket && (
          <div className="fixed inset-0 bg-gray-900/50 flex items-center justify-center z-50" onClick={() => setShowNewTicket(false)}>
            <div 
              className="bg-[#2d3748] rounded-lg border border-gray-600 max-w-lg w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-600">
                <h3 className="text-lg font-bold text-white">提交工单</h3>
                <button 
                  onClick={() => setShowNewTicket(false)}
                  className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white"
                >
                  <AlertCircle size={20} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">标题</label>
                  <input 
                    type="text" 
                    value={newTicket.title}
                    onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                    className="w-full bg-[#4b5563] border border-gray-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                    placeholder="请输入工单标题"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">描述</label>
                  <textarea 
                    value={newTicket.description}
                    onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                    className="w-full bg-[#4b5563] border border-gray-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500 min-h-[120px]"
                    placeholder="请详细描述您的问题"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">分类</label>
                    <select 
                      value={newTicket.category}
                      onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                      className="w-full bg-[#4b5563] border border-gray-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="技术问题">技术问题</option>
                      <option value="功能建议">功能建议</option>
                      <option value="账户问题">账户问题</option>
                      <option value="其他">其他</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">优先级</label>
                    <select 
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value as any })}
                      className="w-full bg-[#4b5563] border border-gray-500 rounded-lg py-2 px-4 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="low">低</option>
                      <option value="medium">中</option>
                      <option value="high">高</option>
                      <option value="urgent">紧急</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 p-4 border-t border-gray-600">
                <button 
                  onClick={() => setShowNewTicket(false)}
                  className="px-4 py-2 bg-[#4b5563] hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  取消
                </button>
                <button 
                  onClick={handleSubmitTicket}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Send size={16} />
                  提交
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ModuleCard>
  );
};
