# YYC³ NAS-ECS 邮件服务使用示例

> ***YanYuCloudCube***
> 言启象限 | 语枢未来
> ***Words Initiate Quadrants, Language Serves as Core for the Future***
> 万象归元于云枢 | 深栈智启新纪元
> ***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***

---

**创建日期**: 2026-01-25  
**作者**: YYC³ Team  
**版本**: 1.0.0

---

## 📋 目录

1. [快速入门](#快速入门)
2. [基础使用示例](#基础使用示例)
3. [高级使用示例](#高级使用示例)
4. [API使用示例](#api使用示例)
5. [AI集成示例](#ai集成示例)
6. [批量操作示例](#批量操作示例)
7. [故障排查示例](#故障排查示例)
8. [最佳实践](#最佳实践)

---

## 快速入门

### 1. 访问邮件服务

**步骤**:
1. 登录YYC³ NAS-ECS系统
2. 点击左侧导航栏的"邮件服务"
3. 进入邮件管理界面

**界面说明**:
```
┌─────────────────────────────────────────────────┐
│  邮件服务              [写邮件] [刷新] [设置]  │
├─────────────────────────────────────────────────┤
│  [收件箱(12)] [已发送(5)] [草稿(2)] [垃圾箱(0)]  │
├─────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────┐   │
│  │ 📧 系统通知                     │   │
│  │ 发件人: admin@0379.email          │   │
│  │ 主题: 系统维护通知               │   │
│  │ 时间: 2026-01-25 10:30          │   │
│  │ 预览: 系统将于今晚进行维护...     │   │
│  └───────────────────────────────────────┘   │
│  ┌───────────────────────────────────────┐   │
│  │ 📧 用户反馈                     │   │
│  │ 发件人: user@example.com           │   │
│  │ 主题: 功能建议                   │   │
│  │ 时间: 2026-01-25 09:15          │   │
│  │ 预览: 建议添加批量导出功能...     │   │
│  └───────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### 2. 配置邮件账户

**步骤**:
1. 点击"设置"按钮
2. 进入邮件账户配置页面
3. 配置IMAP（接收邮件）:
   - IMAP服务器: imap.gmail.com
   - IMAP端口: 993
   - 用户名: your-email@gmail.com
   - 密码: your-app-password
4. 配置SMTP（发送邮件）:
   - SMTP服务器: smtp.gmail.com
   - SMTP端口: 587
   - 用户名: your-email@gmail.com
   - 密码: your-app-password
5. 点击"测试连接"
6. 点击"保存"

**配置示例**:
```typescript
// 邮件账户配置
const emailAccount = {
  imap: {
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    user: 'admin@0379.email',
    password: 'your-app-specific-password',
  },
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: 'admin@0379.email',
    password: 'your-app-specific-password',
  },
};
```

### 3. 发送邮件

**步骤**:
1. 点击"写邮件"按钮
2. 填写邮件信息:
   - 收件人: recipient@example.com
   - 主题: 邮件主题
   - 内容: 邮件内容
3. 添加附件（可选）
4. 点击"发送"

**界面示例**:
```
┌─────────────────────────────────────────────────┐
│  写邮件                          [保存草稿] [发送]  │
├─────────────────────────────────────────────────┤
│  收件人: recipient@example.com             │
│  抄送:                                    │
│  密送:                                    │
│  主题: 项目进度报告                        │
├─────────────────────────────────────────────────┤
│  [加粗] [斜体] [下划线] [链接] [附件]    │
├─────────────────────────────────────────────────┤
│  尊敬的领导：                             │
│                                          │
│  本周项目进展如下：                        │
│  1. 完成了监控面板的开发                  │
│  2. 优化了邮件服务功能                  │
│  3. 修复了若干bug                       │
│                                          │
│  附件: [进度报告.pdf] [截图.png]          │
└─────────────────────────────────────────────────┘
```

### 4. 查看邮件

**邮件列表显示**:
- 未读邮件: 加粗显示，蓝色标记
- 已读邮件: 正常显示
- 已发送: 蓝色标记
- 已删除: 灰色标记

**邮件操作**:
- 点击邮件: 查看详情
- 右键邮件: 显示操作菜单
  - 回复
  - 转发
  - 标记为已读/未读
  - 移动到文件夹
  - 删除
  - 标记

---

## 基础使用示例

### 示例1: 发送简单邮件

```typescript
// 发送简单邮件
const sendSimpleEmail = async (email: Email) => {
  try {
    const response = await fetch('/api/v2/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(email),
    });

    const data = await response.json();

    if (data.success) {
      console.log('邮件发送成功:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('发送邮件失败:', error);
  }
};

// 使用示例
const email = {
  to: 'recipient@example.com',
  subject: '项目进度报告',
  content: '本周项目进展如下：\n1. 完成了监控面板的开发\n2. 优化了邮件服务功能',
  html: '<p>本周项目进展如下：</p><ol><li>完成了监控面板的开发</li><li>优化了邮件服务功能</li></ol>',
};

sendSimpleEmail(email);
```

**请求示例**:
```json
{
  "to": "recipient@example.com",
  "cc": [],
  "bcc": [],
  "subject": "项目进度报告",
  "content": "本周项目进展如下：\n1. 完成了监控面板的开发\n2. 优化了邮件服务功能",
  "html": "<p>本周项目进展如下：</p><ol><li>完成了监控面板的开发</li><li>优化了邮件服务功能</li></ol>",
  "attachments": []
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "email-123456",
    "to": "recipient@example.com",
    "subject": "项目进度报告",
    "status": "sent",
    "sentAt": "2026-01-25T10:30:00Z"
  }
}
```

### 示例2: 发送带附件的邮件

```typescript
// 发送带附件的邮件
const sendEmailWithAttachments = async (email: EmailWithAttachments) => {
  try {
    const formData = new FormData();
    
    // 添加邮件基本信息
    formData.append('to', email.to);
    formData.append('subject', email.subject);
    formData.append('content', email.content);
    formData.append('html', email.html);
    
    // 添加附件
    email.attachments.forEach((attachment, index) => {
      formData.append(`attachment${index}`, attachment.file, attachment.filename);
    });

    const response = await fetch('/api/v2/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      console.log('邮件发送成功:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('发送邮件失败:', error);
  }
};

// 使用示例
const emailWithAttachments = {
  to: 'recipient@example.com',
  subject: '项目进度报告',
  content: '请查看附件中的详细报告',
  html: '<p>请查看附件中的详细报告</p>',
  attachments: [
    {
      file: fileObject,  // File对象
      filename: 'progress-report.pdf',
    },
    {
      file: fileObject,
      filename: 'screenshot.png',
    },
  ],
};

sendEmailWithAttachments(emailWithAttachments);
```

### 示例3: 获取邮件列表

```typescript
// 获取邮件列表
const getEmailList = async (params: EmailListParams) => {
  try {
    const queryParams = new URLSearchParams({
      folder: params.folder || 'inbox',
      page: params.page?.toString() || '1',
      limit: params.limit?.toString() || '20',
      unreadOnly: params.unreadOnly?.toString() || 'false',
    });

    const response = await fetch(`/api/v2/mail/list?${queryParams}`);
    const data = await response.json();

    if (data.success) {
      console.log('邮件列表:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('获取邮件列表失败:', error);
  }
};

// 使用示例 - 获取收件箱的邮件
const emailList = await getEmailList({
  folder: 'inbox',
  page: 1,
  limit: 20,
  unreadOnly: false,
});

console.log('邮件列表:', emailList);
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "total": 12,
    "page": 1,
    "limit": 20,
    "emails": [
      {
        "id": "email-001",
        "from": "admin@0379.email",
        "to": "user@example.com",
        "subject": "系统维护通知",
        "preview": "系统将于今晚进行维护...",
        "timestamp": "2026-01-25T10:30:00Z",
        "read": false,
        "hasAttachment": false
      },
      {
        "id": "email-002",
        "from": "user@example.com",
        "to": "admin@0379.email",
        "subject": "功能建议",
        "preview": "建议添加批量导出功能...",
        "timestamp": "2026-01-25T09:15:00Z",
        "read": true,
        "hasAttachment": true
      }
    ]
  }
}
```

### 示例4: 获取邮件详情

```typescript
// 获取邮件详情
const getEmailDetail = async (emailId: string) => {
  try {
    const response = await fetch(`/api/v2/mail/${emailId}`);
    const data = await response.json();

    if (data.success) {
      console.log('邮件详情:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('获取邮件详情失败:', error);
  }
};

// 使用示例
const emailDetail = await getEmailDetail('email-001');
console.log('邮件详情:', emailDetail);
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": "email-001",
    "from": {
      "name": "系统管理员",
      "email": "admin@0379.email"
    },
    "to": [
      {
        "name": "用户",
        "email": "user@example.com"
      }
    ],
    "cc": [],
    "bcc": [],
    "subject": "系统维护通知",
    "content": "尊敬的用户：\n\n系统将于今晚23:00-01:00进行维护，届时系统将无法访问。请您提前保存工作，避免数据丢失。\n\n感谢您的理解与支持！",
    "html": "<p>尊敬的用户：</p><p>系统将于今晚23:00-01:00进行维护，届时系统将无法访问。请您提前保存工作，避免数据丢失。</p><p>感谢您的理解与支持！</p>",
    "attachments": [],
    "timestamp": "2026-01-25T10:30:00Z",
    "read": false,
    "labels": ["系统通知"],
    "folder": "inbox"
  }
}
```

---

## 高级使用示例

### 示例1: 回复邮件

```typescript
// 回复邮件
const replyEmail = async (emailId: string, reply: ReplyEmail) => {
  try {
    const response = await fetch(`/api/v2/mail/${emailId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(reply),
    });

    const data = await response.json();

    if (data.success) {
      console.log('回复成功:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('回复邮件失败:', error);
  }
};

// 使用示例
const reply = {
  content: '收到，感谢通知！',
  html: '<p>收到，感谢通知！</p>',
  attachments: [],
  includeOriginal: true,  // 是否包含原邮件内容
};

replyEmail('email-001', reply);
```

### 示例2: 转发邮件

```typescript
// 转发邮件
const forwardEmail = async (emailId: string, forward: ForwardEmail) => {
  try {
    const response = await fetch(`/api/v2/mail/${emailId}/forward`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(forward),
    });

    const data = await response.json();

    if (data.success) {
      console.log('转发成功:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('转发邮件失败:', error);
  }
};

// 使用示例
const forward = {
  to: 'another@example.com',
  subject: 'Fwd: 系统维护通知',
  content: '请查看以下邮件',
  html: '<p>请查看以下邮件</p>',
  attachments: [],
};

forwardEmail('email-001', forward);
```

### 示例3: 搜索邮件

```typescript
// 搜索邮件
const searchEmails = async (params: SearchParams) => {
  try {
    const queryParams = new URLSearchParams({
      query: params.query,
      folder: params.folder || 'all',
      dateFrom: params.dateFrom || '',
      dateTo: params.dateTo || '',
      hasAttachment: params.hasAttachment?.toString() || 'false',
      page: params.page?.toString() || '1',
      limit: params.limit?.toString() || '20',
    });

    const response = await fetch(`/api/v2/mail/search?${queryParams}`);
    const data = await response.json();

    if (data.success) {
      console.log('搜索结果:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('搜索邮件失败:', error);
  }
};

// 使用示例 - 搜索包含"项目"的邮件
const searchResults = await searchEmails({
  query: '项目',
  folder: 'all',
  dateFrom: '2026-01-01',
  dateTo: '2026-01-31',
  hasAttachment: false,
  page: 1,
  limit: 20,
});

console.log('搜索结果:', searchResults);
```

### 示例4: 标记邮件

```typescript
// 标记邮件
const markEmail = async (emailId: string, mark: EmailMark) => {
  try {
    const response = await fetch(`/api/v2/mail/${emailId}/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(mark),
    });

    const data = await response.json();

    if (data.success) {
      console.log('标记成功:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('标记邮件失败:', error);
  }
};

// 使用示例 - 标记为已读并添加标签
await markEmail('email-001', {
  read: true,
  labels: ['重要', '待处理'],
  starred: true,
});
```

---

## API使用示例

### 示例1: JavaScript/TypeScript

```typescript
// 创建邮件API客户端
class EmailAPI {
  private baseUrl: string;
  private token: string;

  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers,
      },
    });

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || '请求失败');
    }

    return data.data;
  }

  // 发送邮件
  async sendEmail(email: Email): Promise<EmailResult> {
    return this.request<EmailResult>('/api/v2/mail/send', {
      method: 'POST',
      body: JSON.stringify(email),
    });
  }

  // 获取邮件列表
  async getEmailList(params: EmailListParams): Promise<EmailList> {
    const queryParams = new URLSearchParams(params as any);
    return this.request<EmailList>(`/api/v2/mail/list?${queryParams}`);
  }

  // 获取邮件详情
  async getEmailDetail(emailId: string): Promise<EmailDetail> {
    return this.request<EmailDetail>(`/api/v2/mail/${emailId}`);
  }

  // 回复邮件
  async replyEmail(emailId: string, reply: ReplyEmail): Promise<EmailResult> {
    return this.request<EmailResult>(`/api/v2/mail/${emailId}/reply`, {
      method: 'POST',
      body: JSON.stringify(reply),
    });
  }

  // 转发邮件
  async forwardEmail(emailId: string, forward: ForwardEmail): Promise<EmailResult> {
    return this.request<EmailResult>(`/api/v2/mail/${emailId}/forward`, {
      method: 'POST',
      body: JSON.stringify(forward),
    });
  }

  // 搜索邮件
  async searchEmails(params: SearchParams): Promise<EmailList> {
    const queryParams = new URLSearchParams(params as any);
    return this.request<EmailList>(`/api/v2/mail/search?${queryParams}`);
  }

  // 标记邮件
  async markEmail(emailId: string, mark: EmailMark): Promise<void> {
    return this.request<void>(`/api/v2/mail/${emailId}/mark`, {
      method: 'POST',
      body: JSON.stringify(mark),
    });
  }

  // 删除邮件
  async deleteEmail(emailId: string): Promise<void> {
    return this.request<void>(`/api/v2/mail/${emailId}`, {
      method: 'DELETE',
    });
  }
}

// 使用示例
const api = new EmailAPI('http://localhost:6000', 'your-token-here');

// 发送邮件
await api.sendEmail({
  to: 'recipient@example.com',
  subject: '测试邮件',
  content: '这是一封测试邮件',
});

// 获取邮件列表
const emailList = await api.getEmailList({
  folder: 'inbox',
  page: 1,
  limit: 20,
});

// 获取邮件详情
const emailDetail = await api.getEmailDetail('email-001');

// 回复邮件
await api.replyEmail('email-001', {
  content: '收到，感谢！',
});

// 搜索邮件
const searchResults = await api.searchEmails({
  query: '项目',
  folder: 'all',
});

// 标记邮件
await api.markEmail('email-001', {
  read: true,
  starred: true,
});

// 删除邮件
await api.deleteEmail('email-001');
```

### 示例2: Python

```python
import requests
from typing import Dict, Any, List, Optional

class EmailAPI:
    def __init__(self, base_url: str, token: str):
        self.base_url = base_url
        self.token = token
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {token}'
        }

    def _request(self, endpoint: str, method: str = 'GET', data: Dict = None) -> Any:
        url = f'{self.base_url}{endpoint}'
        response = requests.request(
            method,
            url,
            headers=self.headers,
            json=data
        )
        
        result = response.json()
        
        if not result.get('success'):
            raise Exception(result.get('error', {}).get('message', '请求失败'))
        
        return result.get('data')

    def send_email(self, email: Dict) -> Dict:
        """发送邮件"""
        return self._request(
            '/api/v2/mail/send',
            method='POST',
            data=email
        )

    def get_email_list(self, params: Dict) -> Dict:
        """获取邮件列表"""
        return self._request(f'/api/v2/mail/list?{params}')

    def get_email_detail(self, email_id: str) -> Dict:
        """获取邮件详情"""
        return self._request(f'/api/v2/mail/{email_id}')

    def reply_email(self, email_id: str, reply: Dict) -> Dict:
        """回复邮件"""
        return self._request(
            f'/api/v2/mail/{email_id}/reply',
            method='POST',
            data=reply
        )

    def forward_email(self, email_id: str, forward: Dict) -> Dict:
        """转发邮件"""
        return self._request(
            f'/api/v2/mail/{email_id}/forward',
            method='POST',
            data=forward
        )

    def search_emails(self, params: Dict) -> Dict:
        """搜索邮件"""
        return self._request(f'/api/v2/mail/search?{params}')

    def mark_email(self, email_id: str, mark: Dict) -> None:
        """标记邮件"""
        self._request(
            f'/api/v2/mail/{email_id}/mark',
            method='POST',
            data=mark
        )

    def delete_email(self, email_id: str) -> None:
        """删除邮件"""
        self._request(
            f'/api/v2/mail/{email_id}',
            method='DELETE'
        )

# 使用示例
api = EmailAPI('http://localhost:6000', 'your-token-here')

# 发送邮件
api.send_email({
    'to': 'recipient@example.com',
    'subject': '测试邮件',
    'content': '这是一封测试邮件'
})

# 获取邮件列表
email_list = api.get_email_list({
    'folder': 'inbox',
    'page': '1',
    'limit': '20'
})

# 获取邮件详情
email_detail = api.get_email_detail('email-001')

# 回复邮件
api.reply_email('email-001', {
    'content': '收到，感谢！'
})

# 搜索邮件
search_results = api.search_emails({
    'query': '项目',
    'folder': 'all'
})

# 标记邮件
api.mark_email('email-001', {
    'read': True,
    'starred': True
})

# 删除邮件
api.delete_email('email-001')
```

### 示例3: cURL

```bash
# 发送邮件
curl -X POST \
  -H "Authorization: Bearer your-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "subject": "测试邮件",
    "content": "这是一封测试邮件"
  }' \
  http://localhost:6000/api/v2/mail/send

# 获取邮件列表
curl -X GET \
  -H "Authorization: Bearer your-token-here" \
  "http://localhost:6000/api/v2/mail/list?folder=inbox&page=1&limit=20"

# 获取邮件详情
curl -X GET \
  -H "Authorization: Bearer your-token-here" \
  http://localhost:6000/api/v2/mail/email-001

# 回复邮件
curl -X POST \
  -H "Authorization: Bearer your-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "收到，感谢！",
    "includeOriginal": true
  }' \
  http://localhost:6000/api/v2/mail/email-001/reply

# 转发邮件
curl -X POST \
  -H "Authorization: Bearer your-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "another@example.com",
    "subject": "Fwd: 测试邮件",
    "content": "请查看以下邮件"
  }' \
  http://localhost:6000/api/v2/mail/email-001/forward

# 搜索邮件
curl -X GET \
  -H "Authorization: Bearer your-token-here" \
  "http://localhost:6000/api/v2/mail/search?query=项目&folder=all"

# 标记邮件
curl -X POST \
  -H "Authorization: Bearer your-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "read": true,
    "starred": true,
    "labels": ["重要"]
  }' \
  http://localhost:6000/api/v2/mail/email-001/mark

# 删除邮件
curl -X DELETE \
  -H "Authorization: Bearer your-token-here" \
  http://localhost:6000/api/v2/mail/email-001
```

---

## AI集成示例

### 示例1: AI自动回复

```typescript
// 使用AI生成自动回复
const generateAIReply = async (emailId: string) => {
  try {
    const response = await fetch(`/api/v2/mail/${emailId}/ai-reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      console.log('AI回复生成成功:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('生成AI回复失败:', error);
  }
};

// 使用示例
const aiReply = await generateAIReply('email-001');
console.log('AI回复:', aiReply.reply);
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "reply": "尊敬的用户：\n\n感谢您的反馈。我们已收到您的建议，并将其纳入我们的改进计划中。如有其他问题，请随时联系我们。\n\n祝好！",
    "confidence": 0.92,
    "suggestions": [
      "感谢您的反馈",
      "我们已收到您的建议",
      "如有其他问题，请随时联系我们"
    ]
  }
}
```

### 示例2: AI智能分类

```typescript
// 使用AI对邮件进行智能分类
const classifyEmail = async (emailId: string) => {
  try {
    const response = await fetch(`/api/v2/mail/${emailId}/classify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      console.log('邮件分类成功:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('邮件分类失败:', error);
  }
};

// 使用示例
const classification = await classifyEmail('email-001');
console.log('分类结果:', classification);
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "category": "工作",
    "subCategory": "项目",
    "priority": "高",
    "confidence": 0.88,
    "suggestedLabels": ["重要", "待处理", "项目"]
  }
}
```

### 示例3: AI摘要生成

```typescript
// 使用AI生成邮件摘要
const generateSummary = async (emailId: string) => {
  try {
    const response = await fetch(`/api/v2/mail/${emailId}/summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      console.log('摘要生成成功:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('生成摘要失败:', error);
  }
};

// 使用示例
const summary = await generateSummary('email-001');
console.log('邮件摘要:', summary.summary);
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "summary": "系统将于今晚23:00-01:00进行维护，届时系统将无法访问。用户需提前保存工作。",
    "keyPoints": [
      "维护时间：今晚23:00-01:00",
      "影响：系统无法访问",
      "建议：提前保存工作"
    ],
    "actionItems": [
      "保存当前工作",
      "避免在维护期间进行重要操作"
    ]
  }
}
```

---

## 批量操作示例

### 示例1: 批量发送邮件

```typescript
// 批量发送邮件
const sendBatchEmails = async (emails: Email[]) => {
  try {
    const response = await fetch('/api/v2/mail/batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ emails }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('批量发送成功:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('批量发送失败:', error);
  }
};

// 使用示例
const emails = [
  {
    to: 'user1@example.com',
    subject: '系统维护通知',
    content: '系统将于今晚进行维护...',
  },
  {
    to: 'user2@example.com',
    subject: '系统维护通知',
    content: '系统将于今晚进行维护...',
  },
  {
    to: 'user3@example.com',
    subject: '系统维护通知',
    content: '系统将于今晚进行维护...',
  },
];

sendBatchEmails(emails);
```

### 示例2: 批量删除邮件

```typescript
// 批量删除邮件
const deleteBatchEmails = async (emailIds: string[]) => {
  try {
    const response = await fetch('/api/v2/mail/batch-delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ emailIds }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('批量删除成功:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('批量删除失败:', error);
  }
};

// 使用示例
const emailIds = ['email-001', 'email-002', 'email-003'];
deleteBatchEmails(emailIds);
```

### 示例3: 批量标记邮件

```typescript
// 批量标记邮件
const markBatchEmails = async (emailIds: string[], mark: EmailMark) => {
  try {
    const response = await fetch('/api/v2/mail/batch-mark', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ emailIds, mark }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('批量标记成功:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('批量标记失败:', error);
  }
};

// 使用示例 - 批量标记为已读
const emailIds = ['email-001', 'email-002', 'email-003'];
markBatchEmails(emailIds, {
  read: true,
});
```

---

## 故障排查示例

### 示例1: 检查邮件服务状态

```typescript
// 检查邮件服务状态
const checkEmailService = async () => {
  try {
    const response = await fetch('/api/v2/mail/health');
    const data = await response.json();

    if (data.success) {
      const health = data.data;
      console.log('邮件服务状态:', health);
      
      // 检查各项服务状态
      if (health.imap === 'healthy') {
        console.log('✅ IMAP服务正常');
      } else {
        console.log('❌ IMAP服务异常');
      }
      
      if (health.smtp === 'healthy') {
        console.log('✅ SMTP服务正常');
      } else {
        console.log('❌ SMTP服务异常');
      }
      
      if (health.database === 'healthy') {
        console.log('✅ 数据库服务正常');
      } else {
        console.log('❌ 数据库服务异常');
      }
      
      return health;
    }
  } catch (error) {
    console.error('检查邮件服务状态失败:', error);
  }
};

checkEmailService();
```

### 示例2: 测试邮件连接

```typescript
// 测试邮件连接
const testEmailConnection = async (config: EmailConfig) => {
  try {
    const response = await fetch('/api/v2/mail/test-connection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(config),
    });

    const data = await response.json();

    if (data.success) {
      console.log('连接测试成功:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('连接测试失败:', error);
  }
};

// 使用示例
const emailConfig = {
  imap: {
    host: 'imap.gmail.com',
    port: 993,
    secure: true,
    user: 'admin@0379.email',
    password: 'your-app-specific-password',
  },
  smtp: {
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    user: 'admin@0379.email',
    password: 'your-app-specific-password',
  },
};

testEmailConnection(emailConfig);
```

### 示例3: 查看邮件发送日志

```typescript
// 查看邮件发送日志
const getEmailLogs = async (params: LogParams) => {
  try {
    const queryParams = new URLSearchParams({
      startDate: params.startDate || '',
      endDate: params.endDate || '',
      status: params.status || '',
      limit: params.limit?.toString() || '100',
    });

    const response = await fetch(`/api/v2/mail/logs?${queryParams}`);
    const data = await response.json();

    if (data.success) {
      console.log('邮件日志:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('获取邮件日志失败:', error);
  }
};

// 使用示例 - 查看最近失败的邮件
const emailLogs = await getEmailLogs({
  status: 'failed',
  limit: 50,
});

console.log('邮件日志:', emailLogs);
```

---

## 最佳实践

### 1. 合理使用邮件标签

**建议**:
- 使用有意义的标签名称
- 避免创建过多标签
- 定期清理不常用的标签
- 使用颜色区分不同类型的标签

**示例**:
```typescript
const recommendedLabels = [
  '重要',
  '待处理',
  '工作',
  '个人',
  '项目',
  '系统通知',
];
```

### 2. 定期清理邮件

**建议**:
- 定期删除不需要的邮件
- 归档重要的邮件
- 清空垃圾箱
- 清理已发送邮件

**示例**:
```typescript
// 归档30天前的邮件
const archiveOldEmails = async () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const oldEmails = await searchEmails({
    query: '',
    dateTo: thirtyDaysAgo.toISOString(),
  });

  await markBatchEmails(
    oldEmails.emails.map(e => e.id),
    { archived: true }
  );
};

archiveOldEmails();
```

### 3. 使用AI功能提高效率

**建议**:
- 使用AI自动回复处理常见问题
- 使用AI智能分类自动整理邮件
- 使用AI摘要快速了解邮件内容
- 定期训练AI模型提高准确性

### 4. 注意邮件安全

**建议**:
- 不要在邮件中发送敏感信息
- 使用加密功能发送重要邮件
- 定期更换邮件密码
- 启用两步验证
- 注意防范钓鱼邮件

### 5. 合理设置邮件过滤规则

**建议**:
- 设置自动分类规则
- 设置垃圾邮件过滤
- 设置自动回复规则
- 设置邮件转发规则

**示例**:
```typescript
const filterRules = [
  {
    name: '自动分类工作邮件',
    condition: {
      from: ['@company.com'],
    },
    action: {
      label: '工作',
      folder: 'work',
    },
  },
  {
    name: '自动标记重要邮件',
    condition: {
      subject: ['紧急', '重要', 'Urgent'],
    },
    action: {
      label: '重要',
      starred: true,
    },
  },
];
```

---

## 常见问题

### Q1: 如何配置多个邮件账户？

**A**: 在邮件设置中添加多个邮件账户，系统会自动管理多个账户的邮件。

### Q2: 如何设置邮件自动转发？

**A**: 在邮件设置中配置自动转发规则，指定转发目标地址和条件。

### Q3: 如何恢复已删除的邮件？

**A**: 已删除的邮件会保留在垃圾箱中30天，可以在垃圾箱中找到并恢复。

### Q4: 如何设置邮件签名？

**A**: 在邮件设置中配置邮件签名，可以在发送邮件时自动添加。

### Q5: 如何使用AI功能？

**A**: 在邮件详情页面点击"AI回复"、"AI分类"、"AI摘要"等按钮即可使用AI功能。

---

**文档版本**: 1.0.0  
**最后更新**: 2026-01-25  
**维护团队**: YYC³ Team

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>

</div>
