/**
 * @file HelpService - 帮助中心服务
 * @description 提供FAQ、使用指南、技术支持等帮助功能
 * @module services/help
 * @author YYC³
 * @version 1.0.0
 * @created 2026-01-24
 */

import { FAQ, Guide, SupportTicket, SupportResponse, ContactInfo } from '../types/help';
import { logger } from '../utils/logger';

class HelpService {
  private faqs: FAQ[] = [];
  private guides: Guide[] = [];
  private tickets: SupportTicket[] = [];
  private contactInfo!: ContactInfo;
  private storageKey = 'yyc3-help-data';

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.loadFromStorage();
    this.ensureDefaultData();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const data = JSON.parse(stored);
        this.faqs = data.faqs || [];
        this.guides = data.guides || [];
        this.tickets = data.tickets || [];
        this.contactInfo = data.contactInfo || this.getDefaultContactInfo();
      }
    } catch (error) {
      logger.error('Failed to load help data:', error);
    }
  }

  private saveToStorage(): void {
    try {
      const data = {
        faqs: this.faqs,
        guides: this.guides,
        tickets: this.tickets,
        contactInfo: this.contactInfo
      };
      localStorage.setItem(this.storageKey, JSON.stringify(data));
    } catch (error) {
      logger.error('Failed to save help data:', error);
    }
  }

  private getDefaultContactInfo(): ContactInfo {
    return {
      email: 'support@0379.email',
      phone: '+86-400-xxx-xxxx',
      website: 'https://yyc3.0379.email',
      address: '中国 · 洛阳',
      workingHours: '周一至周五 9:00-18:00'
    };
  }

  private ensureDefaultData(): void {
    if (this.faqs.length === 0) {
      const defaultFAQs: FAQ[] = [
        {
          id: 'faq-001',
          category: '账户与登录',
          question: '如何重置密码？',
          answer: '您可以通过以下步骤重置密码：\n1. 点击登录页面的"忘记密码"链接\n2. 输入您的注册邮箱\n3. 查收邮件并点击重置链接\n4. 设置新密码并确认\n\n如果您没有收到重置邮件，请检查垃圾邮件文件夹或联系技术支持。',
          tags: ['密码', '重置', '登录'],
          helpful: 42,
          notHelpful: 3,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'faq-002',
          category: '系统设置',
          question: '如何修改系统主题？',
          answer: '修改系统主题的步骤：\n1. 登录系统后，点击右上角的用户头像\n2. 选择"设置"选项\n3. 在"外观设置"分类中，选择您喜欢的主题\n4. 点击"保存设置"按钮\n\n系统支持浅色、深色和自动主题，自动主题会根据系统时间自动切换。',
          tags: ['主题', '外观', '设置'],
          helpful: 38,
          notHelpful: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'faq-003',
          category: '备份与恢复',
          question: '如何创建系统备份？',
          answer: '创建系统备份的方法：\n\n**手动备份：**\n1. 进入"备份管理"模块\n2. 点击"新建配置"创建备份配置\n3. 点击"立即备份"按钮执行备份\n\n**自动备份：**\n1. 在备份配置中设置备份计划（Cron表达式）\n2. 启用自动备份功能\n3. 系统将按照计划自动执行备份\n\n建议定期检查备份状态，确保备份成功完成。',
          tags: ['备份', '恢复', '数据'],
          helpful: 35,
          notHelpful: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'faq-004',
          category: '权限管理',
          question: '如何分配用户权限？',
          answer: '分配用户权限的步骤：\n1. 进入"权限管理"模块\n2. 点击"添加用户"创建新用户\n3. 在创建用户时选择相应的角色\n4. 系统会自动为该角色分配对应的权限\n\n**角色说明：**\n- 超级管理员：拥有所有权限\n- 管理员：拥有大部分管理权限\n- 操作员：拥有基本操作权限\n- 用户：拥有基本查看权限\n- 访客：拥有有限查看权限',
          tags: ['权限', '用户', '角色'],
          helpful: 30,
          notHelpful: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'faq-005',
          category: '监控与告警',
          question: '如何配置系统告警？',
          answer: '配置系统告警的方法：\n1. 进入"实时监控"模块\n2. 点击"告警配置"按钮\n3. 设置告警规则（CPU、内存、磁盘等）\n4. 配置告警通知方式（邮件、短信等）\n5. 保存配置\n\n告警触发后，系统会立即发送通知。您可以在"告警历史"中查看所有告警记录。',
          tags: ['监控', '告警', '通知'],
          helpful: 28,
          notHelpful: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'faq-006',
          category: 'FRP内网穿透',
          question: '如何配置FRP内网穿透？',
          answer: '配置FRP内网穿透的步骤：\n1. 进入"FRP服务"模块\n2. 点击"添加隧道"按钮\n3. 选择隧道类型（TCP/UDP/HTTP/HTTPS）\n4. 配置本地端口和远程端口\n5. 设置加密和访问控制（可选）\n6. 保存配置\n\n**注意事项：**\n- 确保本地服务已启动并监听指定端口\n- 远程端口需要在防火墙中开放\n- 建议使用加密传输提高安全性',
          tags: ['FRP', '内网穿透', '隧道'],
          helpful: 25,
          notHelpful: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'faq-007',
          category: 'DDNS服务',
          question: '如何配置DDNS动态域名解析？',
          answer: '配置DDNS动态域名解析的步骤：\n1. 进入"DDNS服务"模块\n2. 添加域名解析记录\n3. 选择DNS服务商（阿里云、腾讯云等）\n4. 输入API密钥和域名信息\n5. 设置更新间隔（建议5-10分钟）\n6. 启用自动更新\n\n系统会定期检测IP变化并自动更新DNS记录。',
          tags: ['DDNS', '域名', 'DNS'],
          helpful: 22,
          notHelpful: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'faq-008',
          category: '邮箱服务',
          question: '如何配置邮箱服务？',
          answer: '配置邮箱服务的步骤：\n1. 进入"设置"模块\n2. 选择"通知设置"分类\n3. 启用邮件通知\n4. 配置SMTP服务器信息\n5. 输入发件人邮箱和SMTP凭据\n6. 测试邮件发送\n\n**支持的SMTP服务商：**\n- Gmail\n- Outlook\n- 企业邮箱\n- 其他标准SMTP服务器',
          tags: ['邮箱', 'SMTP', '邮件'],
          helpful: 20,
          notHelpful: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      this.faqs = defaultFAQs;
    }

    if (this.guides.length === 0) {
      const defaultGuides: Guide[] = [
        {
          id: 'guide-001',
          title: '快速入门指南',
          description: '了解如何快速开始使用YYC³ NAS-ECS平台',
          category: '入门',
          content: `# 快速入门指南

## 系统概述

YYC³ NAS-ECS 是一个企业级智能管理平台，专为NAS（网络附加存储）和ECS（云服务器）环境设计。平台集成了实时监控、邮箱服务、内网穿透配置、日志管理、AI智能助手等核心功能。

## 系统要求

- Node.js >= 18.0.0
- Python >= 3.11
- PostgreSQL >= 14
- Redis >= 6.0
- Docker >= 20.10

## 快速开始

### 1. 系统登录

1. 打开浏览器，访问系统地址
2. 输入用户名和密码
3. 点击"登录"按钮

### 2. 首次使用

首次登录后，建议您：

1. 修改默认密码
2. 配置系统基本信息
3. 设置时区和语言
4. 配置邮件通知

### 3. 主要功能介绍

#### 实时监控
- 查看CPU、内存、磁盘、网络实时数据
- 设置告警阈值
- 查看历史趋势

#### 邮箱服务
- 管理收件箱、发件箱、草稿箱
- 发送和接收邮件
- AI辅助邮件分类

#### FRP内网穿透
- 配置TCP/UDP/HTTP/HTTPS隧道
- 监控隧道状态
- 管理访问控制

#### 日志管理
- 查看系统日志
- 筛选和搜索日志
- 导出日志文件

#### AI智能助手
- 自然语言交互
- 系统管理操作
- 智能推荐建议

### 4. 获取帮助

如果您在使用过程中遇到问题，可以：

1. 查看本帮助中心的FAQ
2. 阅读用户指南
3. 提交技术支持工单
4. 联系技术支持

## 下一步

建议您进一步阅读：

- [权限管理指南](#guide-002)
- [备份恢复指南](#guide-003)
- [安全设置指南](#guide-004)`,
          estimatedTime: '15分钟',
          difficulty: 'beginner',
          tags: ['入门', '快速开始', '新手'],
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'guide-002',
          title: '权限管理指南',
          description: '了解如何管理系统用户和权限',
          category: '管理',
          content: `# 权限管理指南

## 角色与权限

YYC³ NAS-ECS 采用基于角色的访问控制（RBAC）模型，通过角色来管理用户权限。

## 预定义角色

### 超级管理员
- **权限范围**: 所有权限
- **适用场景**: 系统管理员、技术负责人
- **特点**: 拥有系统的完全控制权

### 管理员
- **权限范围**: 大部分管理权限
- **适用场景**: 部门经理、运维负责人
- **特点**: 可以管理用户、配置、监控等

### 操作员
- **适用场景**: 日常运维人员
- **特点**: 可以查看和操作基本功能

### 用户
- **权限范围**: 基本查看权限
- **适用场景**: 普通用户
- **特点**: 可以查看监控、日志等信息

### 访客
- **权限范围**: 有限查看权限
- **适用场景**: 临时访问人员
- **特点**: 只能查看监控面板

## 用户管理

### 创建用户

1. 进入"权限管理"模块
2. 点击"添加用户"按钮
3. 填写用户信息：
   - 用户名
   - 邮箱
   - 密码
   - 角色
4. 点击"创建"按钮

### 修改用户

1. 在用户列表中找到目标用户
2. 点击"编辑"按钮
3. 修改用户信息
4. 保存更改

### 删除用户

1. 在用户列表中找到目标用户
2. 点击"删除"按钮
3. 确认删除操作

### 分配角色

1. 在用户列表中找到目标用户
2. 在角色下拉菜单中选择新角色
3. 系统自动应用对应权限

## 权限配置

### 查看权限

1. 进入"权限管理"模块
2. 点击"权限配置"按钮
3. 查看各角色的权限列表

### 自定义角色

如需创建自定义角色，请联系系统管理员。

## 审计日志

系统会记录所有权限相关操作：

- 用户创建/修改/删除
- 角色分配
- 权限变更

您可以在"审计日志"中查看所有操作记录。

## 最佳实践

1. **最小权限原则**: 只授予用户完成工作所需的最小权限
2. **定期审查**: 定期审查用户权限，及时撤销不必要的权限
3. **密码策略**: 强制使用强密码，定期更换密码
4. **多因素认证**: 为重要账户启用双因素认证
5. **离职处理**: 员工离职时，及时禁用或删除其账户`,
          estimatedTime: '20分钟',
          difficulty: 'intermediate',
          tags: ['权限', '用户', 'RBAC'],
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'guide-003',
          title: '备份恢复指南',
          description: '了解如何创建和管理系统备份',
          category: '管理',
          content: `# 备份恢复指南

## 备份概述

YYC³ NAS-ECS 提供完善的备份和恢复功能，确保您的数据安全。

## 备份类型

### 完整备份
- **说明**: 备份所有选定的数据
- **优点**: 恢复简单，独立完整
- **缺点**: 备份时间长，占用空间大
- **适用场景**: 定期完整备份

### 增量备份
- **说明**: 只备份自上次备份后修改的数据
- **优点**: 备份速度快，节省空间
- **缺点**: 恢复需要多个备份文件
- **适用场景**: 频繁备份

### 差异备份
- **说明**: 备份自上次完整备份后修改的数据
- **优点**: 平衡备份速度和恢复复杂度
- **缺点**: 需要定期完整备份
- **适用场景**: 日常备份

## 创建备份

### 手动备份

1. 进入"备份管理"模块
2. 点击"新建配置"创建备份配置
3. 配置备份参数：
   - 备份类型
   - 存储方式
   - 包含路径
   - 排除路径
   - 压缩和加密选项
4. 点击"立即备份"按钮

### 自动备份

1. 在备份配置中设置备份计划
2. 使用Cron表达式定义备份时间：
   - \`0 2 * * *\`: 每天凌晨2点
   - \`0 */6 * * *\`: 每6小时
   - \`0 0 * * 0\`: 每周日凌晨
3. 启用自动备份功能

## 存储方式

### 本地存储
- **说明**: 备份到本地磁盘
- **优点**: 速度快，无需网络
- **缺点**: 受限于本地存储空间

### 云存储
- **AWS S3**: 亚马逊云存储
- **阿里云OSS**: 阿里云对象存储
- **FTP/SFTP**: 远程文件传输

## 恢复备份

1. 进入"备份管理"模块
2. 点击"备份记录"查看所有备份
3. 选择要恢复的备份
4. 点击"恢复"按钮
5. 选择恢复路径
6. 确认恢复操作

**注意**: 恢复操作会覆盖现有数据，请谨慎操作。

## 备份管理

### 查看备份

- 备份记录显示所有备份历史
- 可以查看备份大小、文件数、状态等信息

### 删除备份

1. 选择要删除的备份
2. 点击"删除"按钮
3. 确认删除操作

### 清理过期备份

系统支持自动清理过期备份：

1. 在备份配置中设置保留天数
2. 系统会自动删除超过保留期的备份
3. 也可以手动点击"清理过期"按钮

## 最佳实践

1. **3-2-1原则**: 保留3份备份，2份在不同介质，1份异地
2. **定期测试**: 定期测试备份恢复流程
3. **加密备份**: 对敏感数据启用加密
4. **监控备份**: 监控备份状态，确保备份成功
5. **文档记录**: 记录备份策略和恢复流程`,
          estimatedTime: '25分钟',
          difficulty: 'intermediate',
          tags: ['备份', '恢复', '数据'],
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'guide-004',
          title: '安全设置指南',
          description: '了解如何提高系统安全性',
          category: '安全',
          content: `# 安全设置指南

## 安全概述

YYC³ NAS-ECS 提供多层次的安全保护，确保您的系统和数据安全。

## 账户安全

### 密码策略

建议设置强密码策略：

1. **最小长度**: 至少8个字符
2. **包含大写字母**: A-Z
3. **包含小写字母**: a-z
4. **包含数字**: 0-9
5. **包含特殊字符**: !@#$%^&*

**示例**: \`MyP@ssw0rd123\`

### 双因素认证（2FA）

启用双因素认证可以大幅提高账户安全性：

1. 进入"设置"模块
2. 选择"安全设置"分类
3. 启用"双因素认证"
4. 扫描二维码或输入密钥
5. 验证设备

**支持的2FA应用**:
- Google Authenticator
- Microsoft Authenticator
- Authy
- 其他TOTP应用

### 会话管理

设置合理的会话超时时间：

- **推荐**: 30分钟
- **高安全**: 15分钟
- **低安全**: 60分钟

超时后需要重新登录，防止未授权访问。

## 网络安全

### HTTPS配置

1. 进入"设置"模块
2. 选择"网络设置"分类
3. 配置HTTPS端口（默认3443）
4. 上传SSL证书
5. 启用HTTPS

### IP白名单

限制特定IP访问系统：

1. 进入"设置"模块
2. 选择"安全设置"分类
3. 添加允许的IP地址
4. 保存配置

### 防火墙规则

确保防火墙规则正确配置：

- 只开放必要的端口
- 限制外部访问
- 定期审查规则

## 数据安全

### 数据加密

启用数据加密：

1. 进入"备份管理"模块
2. 在备份配置中启用加密
3. 系统会使用AES-256加密备份数据

### 敏感数据保护

- 不要在日志中记录敏感信息
- 使用环境变量存储密钥
- 定期轮换API密钥

### 数据备份

参考[备份恢复指南](#guide-003)建立完善的备份策略。

## 系统安全

### 及时更新

- 定期检查系统更新
- 及时安装安全补丁
- 关注安全公告

### 日志审计

1. 进入"日志管理"模块
2. 定期查看系统日志
3. 关注异常登录尝试
4. 监控权限变更

### 访问控制

- 使用最小权限原则
- 定期审查用户权限
- 及时禁用离职员工账户

## 安全检查清单

定期执行以下安全检查：

- [ ] 检查所有用户密码强度
- [ ] 验证双因素认证启用状态
- [ ] 审查系统访问日志
- [ ] 检查防火墙规则
- [ ] 验证SSL证书有效期
- [ ] 测试备份恢复流程
- [ ] 审查用户权限
- [ ] 检查系统更新

## 应急响应

如发现安全事件：

1. **立即隔离**: 隔离受影响的系统
2. **评估影响**: 评估事件影响范围
3. **通知相关人员**: 通知团队和管理层
4. **收集证据**: 保存日志和证据
5. **恢复系统**: 从备份恢复系统
6. **事后分析**: 分析事件原因，改进安全措施

## 联系支持

如需安全方面的帮助：

- 邮箱: security@0379.email
- 工单: 提交技术支持工单`,
          estimatedTime: '30分钟',
          difficulty: 'advanced',
          tags: ['安全', '加密', '防护'],
          lastUpdated: new Date().toISOString()
        }
      ];
      this.guides = defaultGuides;
    }

    this.contactInfo = this.getDefaultContactInfo();
    this.saveToStorage();
  }

  getFAQs(category?: string, searchTerm?: string): FAQ[] {
    let faqs = [...this.faqs];

    if (category) {
      faqs = faqs.filter(f => f.category === category);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      faqs = faqs.filter(f => 
        f.question.toLowerCase().includes(term) ||
        f.answer.toLowerCase().includes(term) ||
        f.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    return faqs.sort((a, b) => b.helpful - a.helpful);
  }

  getFAQById(id: string): FAQ | undefined {
    return this.faqs.find(f => f.id === id);
  }

  rateFAQ(id: string, helpful: boolean): void {
    const faq = this.faqs.find(f => f.id === id);
    if (faq) {
      if (helpful) {
        faq.helpful++;
      } else {
        faq.notHelpful++;
      }
      faq.updatedAt = new Date().toISOString();
      this.saveToStorage();
    }
  }

  getGuides(category?: string, searchTerm?: string): Guide[] {
    let guides = [...this.guides];

    if (category) {
      guides = guides.filter(g => g.category === category);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      guides = guides.filter(g => 
        g.title.toLowerCase().includes(term) ||
        g.description.toLowerCase().includes(term) ||
        g.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    return guides.sort((a, b) => 
      new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
    );
  }

  getGuideById(id: string): Guide | undefined {
    return this.guides.find(g => g.id === id);
  }

  getTickets(userId?: string, status?: string): SupportTicket[] {
    let tickets = [...this.tickets];

    if (userId) {
      tickets = tickets.filter(t => t.createdBy === userId);
    }

    if (status) {
      tickets = tickets.filter(t => t.status === status);
    }

    return tickets.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getTicketById(id: string): SupportTicket | undefined {
    return this.tickets.find(t => t.id === id);
  }

  createTicket(ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'responses'>): SupportTicket {
    const newTicket: SupportTicket = {
      ...ticket,
      id: `ticket-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      responses: []
    };

    this.tickets.push(newTicket);
    this.saveToStorage();
    return newTicket;
  }

  updateTicket(id: string, updates: Partial<SupportTicket>): SupportTicket | null {
    const index = this.tickets.findIndex(t => t.id === id);
    if (index === -1) {
      return null;
    }

    this.tickets[index] = { ...this.tickets[index], ...updates, updatedAt: new Date().toISOString() };
    this.saveToStorage();
    return this.tickets[index];
  }

  addResponse(ticketId: string, response: Omit<SupportResponse, 'id' | 'createdAt'>): SupportResponse {
    const ticket = this.tickets.find(t => t.id === ticketId);
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const newResponse: SupportResponse = {
      ...response,
      id: `response-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    ticket.responses.push(newResponse);
    ticket.updatedAt = new Date().toISOString();
    this.saveToStorage();
    return newResponse;
  }

  getContactInfo(): ContactInfo {
    return { ...this.contactInfo };
  }

  searchAll(query: string): { faqs: FAQ[]; guides: Guide[] } {
    const term = query.toLowerCase();

    return {
      faqs: this.faqs.filter(f => 
        f.question.toLowerCase().includes(term) ||
        f.answer.toLowerCase().includes(term) ||
        f.tags.some(tag => tag.toLowerCase().includes(term))
      ),
      guides: this.guides.filter(g => 
        g.title.toLowerCase().includes(term) ||
        g.description.toLowerCase().includes(term) ||
        g.tags.some(tag => tag.toLowerCase().includes(term))
      )
    };
  }

  getCategories(): string[] {
    const faqCategories = [...new Set(this.faqs.map(f => f.category))];
    const guideCategories = [...new Set(this.guides.map(g => g.category))];
    return [...new Set([...faqCategories, ...guideCategories])];
  }
}

export const helpService = new HelpService();
