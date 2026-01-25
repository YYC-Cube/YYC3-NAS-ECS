/**
 * @file 帮助服务测试
 * @description 测试帮助中心服务的核心功能
 * @module __tests__/services/helpService.test
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-25
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { helpService } from '../helpService';
import { logger } from '../../utils/logger';

vi.mock('../../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}));

describe('HelpService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('FAQ功能', () => {
    it('应该获取所有FAQ', () => {
      const faqs = helpService.getFAQs();
      expect(faqs).toBeDefined();
      expect(Array.isArray(faqs)).toBe(true);
      expect(faqs.length).toBeGreaterThan(0);
    });

    it('应该能够按类别筛选FAQ', () => {
      const faqs = helpService.getFAQs('账户与登录');
      expect(faqs.every(f => f.category === '账户与登录')).toBe(true);
    });

    it('应该能够按搜索词筛选FAQ', () => {
      const faqs = helpService.getFAQs(undefined, '密码');
      expect(faqs.length).toBeGreaterThan(0);
      expect(faqs.every(f => 
        f.question.toLowerCase().includes('密码') ||
        f.answer.toLowerCase().includes('密码') ||
        f.tags.some(tag => tag.toLowerCase().includes('密码'))
      )).toBe(true);
    });

    it('应该能够按类别和搜索词同时筛选FAQ', () => {
      const faqs = helpService.getFAQs('账户与登录', '密码');
      expect(faqs.every(f => f.category === '账户与登录')).toBe(true);
      expect(faqs.every(f => 
        f.question.toLowerCase().includes('密码') ||
        f.answer.toLowerCase().includes('密码') ||
        f.tags.some(tag => tag.toLowerCase().includes('密码'))
      )).toBe(true);
    });

    it('应该能够按ID获取FAQ', () => {
      const faq = helpService.getFAQById('faq-001');
      expect(faq).toBeDefined();
      expect(faq?.id).toBe('faq-001');
    });

    it('获取不存在的FAQ应该返回undefined', () => {
      const faq = helpService.getFAQById('non-existent');
      expect(faq).toBeUndefined();
    });

    it('应该能够对FAQ进行有帮助的评分', () => {
      const faqId = 'faq-001';
      const originalFAQ = helpService.getFAQById(faqId);
      const originalHelpful = originalFAQ?.helpful || 0;

      helpService.rateFAQ(faqId, true);
      
      const updatedFAQ = helpService.getFAQById(faqId);
      expect(updatedFAQ?.helpful).toBe(originalHelpful + 1);
    });

    it('应该能够对FAQ进行无帮助的评分', () => {
      const faqId = 'faq-002';
      const originalFAQ = helpService.getFAQById(faqId);
      const originalNotHelpful = originalFAQ?.notHelpful || 0;

      helpService.rateFAQ(faqId, false);
      
      const updatedFAQ = helpService.getFAQById(faqId);
      expect(updatedFAQ?.notHelpful).toBe(originalNotHelpful + 1);
    });

    it('FAQ应该按有帮助的数量排序', () => {
      const faqs = helpService.getFAQs();
      for (let i = 0; i < faqs.length - 1; i++) {
        expect(faqs[i].helpful).toBeGreaterThanOrEqual(faqs[i + 1].helpful);
      }
    });

    it('应该处理空搜索词', () => {
      const faqs = helpService.getFAQs(undefined, '');
      expect(faqs.length).toBeGreaterThan(0);
    });

    it('应该处理大小写不敏感的搜索', () => {
      const faqs1 = helpService.getFAQs(undefined, '密码');
      const faqs2 = helpService.getFAQs(undefined, '密码'.toUpperCase());
      const faqs3 = helpService.getFAQs(undefined, '密码'.toLowerCase());
      expect(faqs1.length).toBe(faqs2.length);
      expect(faqs2.length).toBe(faqs3.length);
    });
  });

  describe('指南功能', () => {
    it('应该获取所有指南', () => {
      const guides = helpService.getGuides();
      expect(guides).toBeDefined();
      expect(Array.isArray(guides)).toBe(true);
      expect(guides.length).toBeGreaterThan(0);
    });

    it('应该能够按类别筛选指南', () => {
      const guides = helpService.getGuides('入门');
      expect(guides.every(g => g.category === '入门')).toBe(true);
    });

    it('应该能够按搜索词筛选指南', () => {
      const guides = helpService.getGuides(undefined, '权限');
      expect(guides.length).toBeGreaterThan(0);
      expect(guides.every(g => 
        g.title.toLowerCase().includes('权限') ||
        g.description.toLowerCase().includes('权限') ||
        g.tags.some(tag => tag.toLowerCase().includes('权限'))
      )).toBe(true);
    });

    it('应该能够按类别和搜索词同时筛选指南', () => {
      const guides = helpService.getGuides('管理', '备份');
      expect(guides.every(g => g.category === '管理')).toBe(true);
      expect(guides.every(g => 
        g.title.toLowerCase().includes('备份') ||
        g.description.toLowerCase().includes('备份') ||
        g.tags.some(tag => tag.toLowerCase().includes('备份'))
      )).toBe(true);
    });

    it('应该能够按ID获取指南', () => {
      const guide = helpService.getGuideById('guide-001');
      expect(guide).toBeDefined();
      expect(guide?.id).toBe('guide-001');
    });

    it('获取不存在的指南应该返回undefined', () => {
      const guide = helpService.getGuideById('non-existent');
      expect(guide).toBeUndefined();
    });

    it('指南应该按更新时间排序', () => {
      const guides = helpService.getGuides();
      for (let i = 0; i < guides.length - 1; i++) {
        const date1 = new Date(guides[i].lastUpdated).getTime();
        const date2 = new Date(guides[i + 1].lastUpdated).getTime();
        expect(date1).toBeGreaterThanOrEqual(date2);
      }
    });

    it('指南应该包含预计时间', () => {
      const guide = helpService.getGuideById('guide-001');
      expect(guide?.estimatedTime).toBeDefined();
      expect(typeof guide?.estimatedTime).toBe('string');
    });

    it('指南应该包含难度级别', () => {
      const guide = helpService.getGuideById('guide-001');
      expect(guide?.difficulty).toBeDefined();
      expect(['beginner', 'intermediate', 'advanced']).toContain(guide?.difficulty);
    });

    it('应该处理空搜索词', () => {
      const guides = helpService.getGuides(undefined, '');
      expect(guides.length).toBeGreaterThan(0);
    });

    it('应该处理大小写不敏感的搜索', () => {
      const guides1 = helpService.getGuides(undefined, '权限');
      const guides2 = helpService.getGuides(undefined, '权限'.toUpperCase());
      const guides3 = helpService.getGuides(undefined, '权限'.toLowerCase());
      expect(guides1.length).toBe(guides2.length);
      expect(guides2.length).toBe(guides3.length);
    });
  });

  describe('工单功能', () => {
    it('应该能够创建工单', () => {
      const ticket = helpService.createTicket({
        title: '测试工单',
        description: '这是一个测试工单',
        category: '技术支持',
        priority: 'high',
        createdBy: 'test-user',
        status: 'open'
      });

      expect(ticket).toBeDefined();
      expect(ticket.id).toBeDefined();
      expect(ticket.title).toBe('测试工单');
      expect(ticket.status).toBe('open');
      expect(ticket.createdAt).toBeDefined();
      expect(ticket.responses).toEqual([]);
    });

    it('应该能够获取所有工单', () => {
      helpService.createTicket({
        title: '测试工单1',
        description: '测试描述1',
        category: '技术支持',
        priority: 'medium',
        createdBy: 'user1',
        status: 'open'
      });

      const tickets = helpService.getTickets();
      expect(tickets.length).toBeGreaterThan(0);
    });

    it('应该能够按用户ID筛选工单', () => {
      const userId = 'test-user-123';
      helpService.createTicket({
        title: '用户工单',
        description: '用户描述',
        category: '技术支持',
        priority: 'medium',
        createdBy: userId,
        status: 'open'
      });

      const tickets = helpService.getTickets(userId);
      expect(tickets.every(t => t.createdBy === userId)).toBe(true);
    });

    it('应该能够按状态筛选工单', () => {
      helpService.createTicket({
        title: '开放工单',
        description: '开放描述',
        category: '技术支持',
        priority: 'medium',
        createdBy: 'user1',
        status: 'open'
      });

      helpService.createTicket({
        title: '关闭工单',
        description: '关闭描述',
        category: '技术支持',
        priority: 'low',
        createdBy: 'user1',
        status: 'closed'
      });

      const openTickets = helpService.getTickets(undefined, 'open');
      expect(openTickets.every(t => t.status === 'open')).toBe(true);
    });

    it('应该能够按用户ID和状态同时筛选工单', () => {
      const userId = 'test-user-456';
      helpService.createTicket({
        title: '用户开放工单',
        description: '用户开放描述',
        category: '技术支持',
        priority: 'high',
        createdBy: userId,
        status: 'open'
      });

      helpService.createTicket({
        title: '用户关闭工单',
        description: '用户关闭描述',
        category: '技术支持',
        priority: 'low',
        createdBy: userId,
        status: 'closed'
      });

      const tickets = helpService.getTickets(userId, 'open');
      expect(tickets.every(t => t.createdBy === userId && t.status === 'open')).toBe(true);
    });

    it('应该能够按ID获取工单', () => {
      const createdTicket = helpService.createTicket({
        title: '测试工单',
        description: '测试描述',
        category: '技术支持',
        priority: 'medium',
        createdBy: 'user1',
        status: 'open'
      });

      const ticket = helpService.getTicketById(createdTicket.id);
      expect(ticket).toBeDefined();
      expect(ticket?.id).toBe(createdTicket.id);
    });

    it('获取不存在的工单应该返回undefined', () => {
      const ticket = helpService.getTicketById('non-existent');
      expect(ticket).toBeUndefined();
    });

    it('应该能够更新工单', () => {
      const createdTicket = helpService.createTicket({
        title: '原始标题',
        description: '原始描述',
        category: '技术支持',
        priority: 'medium',
        createdBy: 'user1',
        status: 'open'
      });

      const updatedTicket = helpService.updateTicket(createdTicket.id, {
        title: '更新标题',
        status: 'in_progress'
      });

      expect(updatedTicket).toBeDefined();
      expect(updatedTicket?.title).toBe('更新标题');
      expect(updatedTicket?.status).toBe('in_progress');
      expect(updatedTicket?.description).toBe('原始描述');
    });

    it('更新不存在的工单应该返回null', () => {
      const result = helpService.updateTicket('non-existent', { title: '更新' });
      expect(result).toBeNull();
    });

    it('应该能够为工单添加回复', () => {
      const createdTicket = helpService.createTicket({
        title: '测试工单',
        description: '测试描述',
        category: '技术支持',
        priority: 'medium',
        createdBy: 'user1',
        status: 'open'
      });

      const response = helpService.addResponse(createdTicket.id, {
        message: '这是回复消息',
        author: 'support',
        authorType: 'support'
      });

      expect(response).toBeDefined();
      expect(response.id).toBeDefined();
      expect(response.message).toBe('这是回复消息');
      expect(response.createdAt).toBeDefined();

      const updatedTicket = helpService.getTicketById(createdTicket.id);
      expect(updatedTicket?.responses).toHaveLength(1);
      expect(updatedTicket?.responses[0].id).toBe(response.id);
    });

    it('为不存在的工单添加回复应该抛出错误', () => {
      expect(() => {
        helpService.addResponse('non-existent', {
          message: '回复消息',
          author: 'support',
          authorType: 'support'
        });
      }).toThrow('Ticket not found');
    });

    it('工单应该按创建时间排序', () => {
      helpService.createTicket({
        title: '工单1',
        description: '描述1',
        category: '技术支持',
        priority: 'medium',
        createdBy: 'user1',
        status: 'open'
      });

      helpService.createTicket({
        title: '工单2',
        description: '描述2',
        category: '技术支持',
        priority: 'medium',
        createdBy: 'user1',
        status: 'open'
      });

      const tickets = helpService.getTickets();
      for (let i = 0; i < tickets.length - 1; i++) {
        const date1 = new Date(tickets[i].createdAt).getTime();
        const date2 = new Date(tickets[i + 1].createdAt).getTime();
        expect(date1).toBeGreaterThanOrEqual(date2);
      }
    });

    it('更新工单应该更新updatedAt时间', () => {
      const createdTicket = helpService.createTicket({
        title: '测试工单',
        description: '测试描述',
        category: '技术支持',
        priority: 'medium',
        createdBy: 'user1',
        status: 'open'
      });

      const originalUpdatedAt = createdTicket.updatedAt;

      setTimeout(() => {
        helpService.updateTicket(createdTicket.id, { status: 'in_progress' });
        const updatedTicket = helpService.getTicketById(createdTicket.id);
        expect(updatedTicket?.updatedAt).not.toBe(originalUpdatedAt);
      }, 100);
    });
  });

  describe('联系信息功能', () => {
    it('应该获取联系信息', () => {
      const contactInfo = helpService.getContactInfo();
      expect(contactInfo).toBeDefined();
      expect(contactInfo.email).toBeDefined();
      expect(contactInfo.phone).toBeDefined();
      expect(contactInfo.website).toBeDefined();
      expect(contactInfo.address).toBeDefined();
      expect(contactInfo.workingHours).toBeDefined();
    });

    it('联系信息应该包含默认值', () => {
      const contactInfo = helpService.getContactInfo();
      expect(contactInfo.email).toBe('support@0379.email');
      expect(contactInfo.website).toContain('yyc3.0379.email');
    });

    it('返回的联系信息应该是副本', () => {
      const contactInfo1 = helpService.getContactInfo();
      const contactInfo2 = helpService.getContactInfo();
      expect(contactInfo1).not.toBe(contactInfo2);
      expect(contactInfo1).toEqual(contactInfo2);
    });
  });

  describe('搜索功能', () => {
    it('应该能够在FAQ和指南中搜索', () => {
      const results = helpService.searchAll('密码');
      expect(results.faqs).toBeDefined();
      expect(results.guides).toBeDefined();
      expect(results.faqs.length).toBeGreaterThan(0);
    });

    it('搜索应该返回匹配的FAQ', () => {
      const results = helpService.searchAll('主题');
      expect(results.faqs.length).toBeGreaterThan(0);
      expect(results.faqs.every(f => 
        f.question.toLowerCase().includes('主题') ||
        f.answer.toLowerCase().includes('主题') ||
        f.tags.some(tag => tag.toLowerCase().includes('主题'))
      )).toBe(true);
    });

    it('搜索应该返回匹配的指南', () => {
      const results = helpService.searchAll('备份');
      expect(results.guides.length).toBeGreaterThan(0);
      expect(results.guides.every(g => 
        g.title.toLowerCase().includes('备份') ||
        g.description.toLowerCase().includes('备份') ||
        g.tags.some(tag => tag.toLowerCase().includes('备份'))
      )).toBe(true);
    });

    it('搜索应该处理空查询', () => {
      const results = helpService.searchAll('');
      expect(results.faqs).toBeDefined();
      expect(results.guides).toBeDefined();
    });

    it('搜索应该处理大小写不敏感', () => {
      const results1 = helpService.searchAll('密码');
      const results2 = helpService.searchAll('密码'.toUpperCase());
      expect(results1.faqs.length).toBe(results2.faqs.length);
    });

    it('搜索应该处理不存在的查询', () => {
      const results = helpService.searchAll('不存在的关键词xyz123');
      expect(results.faqs).toBeDefined();
      expect(results.guides).toBeDefined();
    });
  });

  describe('分类功能', () => {
    it('应该获取所有分类', () => {
      const categories = helpService.getCategories();
      expect(categories).toBeDefined();
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    it('分类应该包含FAQ分类', () => {
      const categories = helpService.getCategories();
      const faqCategories = ['账户与登录', '系统设置', '备份与恢复', '权限管理', '监控与告警', 'FRP内网穿透', 'DDNS服务', '邮箱服务'];
      faqCategories.forEach(category => {
        expect(categories).toContain(category);
      });
    });

    it('分类应该包含指南分类', () => {
      const categories = helpService.getCategories();
      const guideCategories = ['入门', '管理', '安全'];
      guideCategories.forEach(category => {
        expect(categories).toContain(category);
      });
    });

    it('分类不应该重复', () => {
      const categories = helpService.getCategories();
      const uniqueCategories = [...new Set(categories)];
      expect(categories.length).toBe(uniqueCategories.length);
    });
  });

  describe('数据持久化', () => {
    it('应该将数据保存到localStorage', () => {
      helpService.createTicket({
        title: '持久化测试',
        description: '测试描述',
        category: '技术支持',
        priority: 'medium',
        createdBy: 'user1',
        status: 'open'
      });

      const storedData = localStorage.getItem('yyc3-help-data');
      expect(storedData).toBeDefined();
      const parsedData = JSON.parse(storedData || '{}');
      expect(parsedData.tickets).toBeDefined();
      expect(parsedData.tickets.length).toBeGreaterThan(0);
    });

    it('应该处理localStorage读取错误', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => helpService.getFAQs()).not.toThrow();

      localStorage.getItem = originalGetItem;
    });

    it('应该处理localStorage写入错误', () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage error');
      });

      expect(() => helpService.createTicket({
        title: '测试',
        description: '测试',
        category: '技术支持',
        priority: 'medium',
        createdBy: 'user1',
        status: 'open'
      })).not.toThrow();

      localStorage.setItem = originalSetItem;
    });
  });

  describe('边界情况', () => {
    it('应该处理空的类别筛选', () => {
      const faqs = helpService.getFAQs('');
      expect(faqs).toBeDefined();
      expect(Array.isArray(faqs)).toBe(true);
    });

    it('应该处理不存在的类别', () => {
      const faqs = helpService.getFAQs('不存在的类别');
      expect(faqs).toEqual([]);
    });

    it('应该处理特殊字符搜索', () => {
      const results = helpService.searchAll('!@#$%^&*()');
      expect(results).toBeDefined();
      expect(results.faqs).toBeDefined();
      expect(results.guides).toBeDefined();
    });

    it('应该处理超长搜索词', () => {
      const longQuery = 'a'.repeat(1000);
      const results = helpService.searchAll(longQuery);
      expect(results).toBeDefined();
    });

    it('应该处理Unicode字符', () => {
      const results = helpService.searchAll('中文测试');
      expect(results).toBeDefined();
    });

    it('应该处理空的用户ID筛选', () => {
      const tickets = helpService.getTickets('');
      expect(tickets).toBeDefined();
      expect(Array.isArray(tickets)).toBe(true);
    });

    it('应该处理空的状态筛选', () => {
      const tickets = helpService.getTickets(undefined, '');
      expect(tickets).toBeDefined();
      expect(Array.isArray(tickets)).toBe(true);
    });
  });

  describe('性能测试', () => {
    it('应该在合理时间内获取FAQ', () => {
      const startTime = performance.now();
      helpService.getFAQs();
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('应该在合理时间内搜索', () => {
      const startTime = performance.now();
      helpService.searchAll('测试');
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(100);
    });

    it('应该在合理时间内创建工单', () => {
      const startTime = performance.now();
      helpService.createTicket({
        title: '性能测试',
        description: '测试描述',
        category: '技术支持',
        priority: 'medium',
        createdBy: 'user1',
        status: 'open'
      });
      const endTime = performance.now();
      expect(endTime - startTime).toBeLessThan(50);
    });
  });
});
