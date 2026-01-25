# YYC³ NAS-ECS LLM服务使用示例

**创建日期**: 2026-01-25  
**作者**: YYC³ Team  
**版本**: 1.0.0

---

## 📋 目录

1. [快速入门](#快速入门)
2. [基础使用示例](#基础使用示例)
3. [高级使用示例](#高级使用示例)
4. [API使用示例](#api使用示例)
5. [提示词模板示例](#提示词模板示例)
6. [多模态支持示例](#多模态支持示例)
7. [故障排查示例](#故障排查示例)
8. [最佳实践](#最佳实践)

---

## 快速入门

### 1. 访问LLM服务

**步骤**:
1. 登录YYC³ NAS-ECS系统
2. 点击左侧导航栏的"AI服务" > "LLM对话"
3. 进入AI智能助手界面

**界面说明**:
```
┌─────────────────────────────────────────────────┐
│  AI智能助手              [新对话] [设置] [模型]  │
├─────────────────────────────────────────────────┤
│  对话历史                                    │
│  ┌───────────────────────────────────────┐   │
│  │ 💬 系统优化建议                   │   │
│  │ 时间: 2026-01-25 10:30          │   │
│  │ 预览: 建议优化数据库查询...       │   │
│  └───────────────────────────────────────┘   │
│  ┌───────────────────────────────────────┐   │
│  │ 💬 代码生成                       │   │
│  │ 时间: 2026-01-25 09:15          │   │
│  │ 预览: 生成文件上传功能的代码...     │   │
│  └───────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│  当前对话                                    │
│  ┌───────────────────────────────────────┐   │
│  │ 用户: 帮我优化一下NAS系统性能      │   │
│  │ AI: 我来帮您分析NAS系统性能...     │   │
│  │ 用户: 具体应该怎么做？              │   │
│  │ AI: 以下是具体的优化建议...         │   │
│  └───────────────────────────────────────┘   │
├─────────────────────────────────────────────────┤
│  [输入消息...]                     [发送]    │
│  [📎 附件] [🎤 语音] [📋 模板]           │
└─────────────────────────────────────────────────┘
```

### 2. 选择模型

**可用模型**:
- **qwen:7b** - 轻量级模型，适合快速响应
- **qwen:14b** - 中等规模模型，平衡性能和质量
- **qwen:72b** - 大规模模型，适合复杂任务
- **llama3:8b** - 轻量级模型，通用性强
- **llama3:70b** - 大规模模型，高质量输出

**选择建议**:
- 简单问答: qwen:7b 或 llama3:8b
- 代码生成: qwen:14b
- 文档分析: qwen:72b 或 llama3:70b
- 实时对话: qwen:7b

### 3. 发送消息

**步骤**:
1. 在输入框中输入消息
2. 选择模型（可选）
3. 点击"发送"按钮
4. 等待AI响应

**消息格式**:
```
用户: 帮我分析一下NAS系统的性能
AI: 我来帮您分析NAS系统的性能状况。让我查看一下当前的监控数据...

根据监控数据，我发现以下情况：
1. CPU使用率平均为45%，处于正常范围
2. 内存使用率为62%，建议优化内存使用
3. 磁盘I/O较高，建议优化数据库查询

优化建议：
- 启用数据库查询缓存
- 优化大文件传输机制
- 增加内存容量或优化内存使用

需要我详细说明某个优化方案吗？
```

### 4. 查看对话历史

**步骤**:
1. 点击"历史"按钮
2. 选择要查看的对话
3. 查看完整对话内容
4. 可以继续对话或导出对话

---

## 基础使用示例

### 示例1: 发送简单消息

```typescript
// 发送简单消息
const sendMessage = async (message: string, model?: string) => {
  try {
    const response = await fetch('/api/v2/llm/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: model || 'qwen:7b',
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
        stream: false,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('AI响应:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('发送消息失败:', error);
  }
};

// 使用示例
const response = await sendMessage('帮我分析一下NAS系统的性能');
console.log('AI响应:', response.message);
```

**请求示例**:
```json
{
  "model": "qwen:7b",
  "messages": [
    {
      "role": "user",
      "content": "帮我分析一下NAS系统的性能"
    }
  ],
  "stream": false
}
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "message": "我来帮您分析NAS系统的性能状况。让我查看一下当前的监控数据...\n\n根据监控数据，我发现以下情况：\n1. CPU使用率平均为45%，处于正常范围\n2. 内存使用率为62%，建议优化内存使用\n3. 磁盘I/O较高，建议优化数据库查询\n\n优化建议：\n- 启用数据库查询缓存\n- 优化大文件传输机制\n- 增加内存容量或优化内存使用\n\n需要我详细说明某个优化方案吗？",
    "model": "qwen:7b",
    "tokens": 256,
    "finishReason": "stop"
  }
}
```

### 示例2: 多轮对话

```typescript
// 多轮对话
const multiTurnChat = async () => {
  const messages: Message[] = [];

  // 第一轮
  const response1 = await sendMessageWithHistory(messages, '帮我分析一下NAS系统的性能');
  messages.push({ role: 'user', content: '帮我分析一下NAS系统的性能' });
  messages.push({ role: 'assistant', content: response1.message });
  console.log('第一轮响应:', response1.message);

  // 第二轮
  const response2 = await sendMessageWithHistory(messages, '具体应该怎么做？');
  messages.push({ role: 'user', content: '具体应该怎么做？' });
  messages.push({ role: 'assistant', content: response2.message });
  console.log('第二轮响应:', response2.message);

  // 第三轮
  const response3 = await sendMessageWithHistory(messages, '请给出详细的代码示例');
  messages.push({ role: 'user', content: '请给出详细的代码示例' });
  messages.push({ role: 'assistant', content: response3.message });
  console.log('第三轮响应:', response3.message);
};

const sendMessageWithHistory = async (messages: Message[], content: string) => {
  try {
    const response = await fetch('/api/v2/llm/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: 'qwen:7b',
        messages: [...messages, { role: 'user', content }],
        stream: false,
      }),
    });

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('发送消息失败:', error);
  }
};

multiTurnChat();
```

### 示例3: 流式响应

```typescript
// 流式响应
const streamMessage = async (message: string) => {
  try {
    const response = await fetch('/api/v2/llm/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: 'qwen:7b',
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
        stream: true,
      }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader!.read();
      
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          if (data.choices && data.choices[0].delta.content) {
            const content = data.choices[0].delta.content;
            fullResponse += content;
            console.log('实时输出:', content);
          }
        }
      }
    }

    console.log('完整响应:', fullResponse);
    return fullResponse;
  } catch (error) {
    console.error('流式响应失败:', error);
  }
};

// 使用示例
streamMessage('帮我写一个Python脚本，用于批量处理文件');
```

---

## 高级使用示例

### 示例1: 使用提示词模板

```typescript
// 使用提示词模板
const useTemplate = async (templateName: string, variables: Record<string, string>) => {
  try {
    const response = await fetch('/api/v2/llm/template', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        template: templateName,
        variables,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('模板响应:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('使用模板失败:', error);
  }
};

// 使用示例 - 代码生成模板
const codeResponse = await useTemplate('code-generation', {
  language: 'Python',
  function: '文件上传',
  description: '实现一个支持断点续传的文件上传功能',
});

console.log('生成的代码:', codeResponse.message);

// 使用示例 - 文档分析模板
const docResponse = await useTemplate('document-analysis', {
  document: '这是一份系统架构文档...',
  analysisType: 'summary',
});

console.log('文档摘要:', docResponse.message);
```

**请求示例**:
```json
{
  "template": "code-generation",
  "variables": {
    "language": "Python",
    "function": "文件上传",
    "description": "实现一个支持断点续传的文件上传功能"
  }
}
```

### 示例2: 自定义系统提示词

```typescript
// 自定义系统提示词
const chatWithSystemPrompt = async (systemPrompt: string, userMessage: string) => {
  try {
    const response = await fetch('/api/v2/llm/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: 'qwen:7b',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        stream: false,
      }),
    });

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('发送消息失败:', error);
  }
};

// 使用示例 - 设置为代码专家
const systemPrompt = `你是一个资深的软件工程师，擅长：
- 编写高质量、可维护的代码
- 代码审查和优化建议
- 解决技术难题
- 架构设计和最佳实践

请用专业、准确的方式回答问题，必要时提供代码示例。`;

const response = await chatWithSystemPrompt(
  systemPrompt,
  '帮我设计一个微服务架构'
);

console.log('AI响应:', response.message);
```

### 示例3: 调整模型参数

```typescript
// 调整模型参数
const chatWithParameters = async (message: string, parameters: ModelParameters) => {
  try {
    const response = await fetch('/api/v2/llm/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: 'qwen:7b',
        messages: [
          {
            role: 'user',
            content: message,
          },
        ],
        temperature: parameters.temperature || 0.7,
        max_tokens: parameters.maxTokens || 2048,
        top_p: parameters.topP || 0.9,
        frequency_penalty: parameters.frequencyPenalty || 0,
        presence_penalty: parameters.presencePenalty || 0,
        stream: false,
      }),
    });

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('发送消息失败:', error);
  }
};

// 使用示例 - 创意性回答
const creativeResponse = await chatWithParameters('写一个科幻故事', {
  temperature: 0.9,      // 更高的温度，更随机
  maxTokens: 1024,
  topP: 0.95,
  frequencyPenalty: 0.5,
  presencePenalty: 0.5,
});

console.log('创意回答:', creativeResponse.message);

// 使用示例 - 精确性回答
const preciseResponse = await chatWithParameters('计算 123 * 456', {
  temperature: 0.1,      // 更低的温度，更确定
  maxTokens: 256,
  topP: 0.5,
  frequencyPenalty: 0,
  presencePenalty: 0,
});

console.log('精确回答:', preciseResponse.message);
```

### 示例4: 对话导出

```typescript
// 导出对话
const exportConversation = async (conversationId: string, format: string) => {
  try {
    const response = await fetch(`/api/v2/llm/conversation/${conversationId}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ format }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('导出成功:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('导出对话失败:', error);
  }
};

// 使用示例 - 导出为Markdown
const markdownExport = await exportConversation('conv-001', 'markdown');
console.log('Markdown内容:', markdownExport.content);

// 使用示例 - 导出为JSON
const jsonExport = await exportConversation('conv-001', 'json');
console.log('JSON内容:', jsonExport.content);

// 使用示例 - 导出为PDF
const pdfExport = await exportConversation('conv-001', 'pdf');
console.log('PDF下载链接:', pdfExport.downloadUrl);
```

---

## API使用示例

### 示例1: JavaScript/TypeScript

```typescript
// 创建LLM API客户端
class LLMAPI {
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

  // 发送消息
  async sendMessage(message: string, model?: string): Promise<ChatResponse> {
    return this.request<ChatResponse>('/api/v2/llm/chat', {
      method: 'POST',
      body: JSON.stringify({
        model: model || 'qwen:7b',
        messages: [{ role: 'user', content: message }],
        stream: false,
      }),
    });
  }

  // 流式消息
  async streamMessage(
    message: string,
    onChunk: (chunk: string) => void,
    model?: string
  ): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/v2/llm/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      },
      body: JSON.stringify({
        model: model || 'qwen:7b',
        messages: [{ role: 'user', content: message }],
        stream: true,
      }),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    while (true) {
      const { done, value } = await reader!.read();
      
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = JSON.parse(line.slice(6));
          if (data.choices && data.choices[0].delta.content) {
            const content = data.choices[0].delta.content;
            fullResponse += content;
            onChunk(content);
          }
        }
      }
    }

    return fullResponse;
  }

  // 使用模板
  async useTemplate(
    templateName: string,
    variables: Record<string, string>
  ): Promise<ChatResponse> {
    return this.request<ChatResponse>('/api/v2/llm/template', {
      method: 'POST',
      body: JSON.stringify({ template: templateName, variables }),
    });
  }

  // 获取对话历史
  async getConversationHistory(conversationId: string): Promise<Conversation> {
    return this.request<Conversation>(`/api/v2/llm/conversation/${conversationId}`);
  }

  // 导出对话
  async exportConversation(
    conversationId: string,
    format: string
  ): Promise<ExportResult> {
    return this.request<ExportResult>(
      `/api/v2/llm/conversation/${conversationId}/export`,
      {
        method: 'POST',
        body: JSON.stringify({ format }),
      }
    );
  }

  // 获取可用模型
  async getModels(): Promise<Model[]> {
    return this.request<Model[]>('/api/v2/llm/models');
  }
}

// 使用示例
const api = new LLMAPI('http://localhost:6000', 'your-token-here');

// 发送消息
const response = await api.sendMessage('帮我分析一下NAS系统的性能');
console.log('AI响应:', response.message);

// 流式消息
await api.streamMessage('帮我写一个Python脚本', (chunk) => {
  console.log('实时输出:', chunk);
});

// 使用模板
const templateResponse = await api.useTemplate('code-generation', {
  language: 'Python',
  function: '文件上传',
});
console.log('模板响应:', templateResponse.message);

// 获取对话历史
const history = await api.getConversationHistory('conv-001');
console.log('对话历史:', history);

// 导出对话
const exportResult = await api.exportConversation('conv-001', 'markdown');
console.log('导出结果:', exportResult);

// 获取可用模型
const models = await api.getModels();
console.log('可用模型:', models);
```

### 示例2: Python

```python
import requests
from typing import Dict, Any, List, Optional, Callable

class LLMAPI:
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

    def send_message(self, message: str, model: str = None) -> Dict:
        """发送消息"""
        return self._request(
            '/api/v2/llm/chat',
            method='POST',
            data={
                'model': model or 'qwen:7b',
                'messages': [{'role': 'user', 'content': message}],
                'stream': False
            }
        )

    def stream_message(self, message: str, on_chunk: Callable, model: str = None) -> str:
        """流式消息"""
        response = requests.post(
            f'{self.base_url}/api/v2/llm/chat',
            headers=self.headers,
            json={
                'model': model or 'qwen:7b',
                'messages': [{'role': 'user', 'content': message}],
                'stream': True
            },
            stream=True
        )
        
        full_response = ''
        for line in response.iter_lines():
            if line.startswith('data: '):
                data = json.loads(line[6:])
                if 'choices' in data and 'delta' in data['choices'][0]:
                    content = data['choices'][0]['delta'].get('content', '')
                    full_response += content
                    on_chunk(content)
        
        return full_response

    def use_template(self, template_name: str, variables: Dict) -> Dict:
        """使用模板"""
        return self._request(
            '/api/v2/llm/template',
            method='POST',
            data={
                'template': template_name,
                'variables': variables
            }
        )

    def get_conversation_history(self, conversation_id: str) -> Dict:
        """获取对话历史"""
        return self._request(f'/api/v2/llm/conversation/{conversation_id}')

    def export_conversation(self, conversation_id: str, format: str) -> Dict:
        """导出对话"""
        return self._request(
            f'/api/v2/llm/conversation/{conversation_id}/export',
            method='POST',
            data={'format': format}
        )

    def get_models(self) -> List[Dict]:
        """获取可用模型"""
        return self._request('/api/v2/llm/models')

# 使用示例
api = LLMAPI('http://localhost:6000', 'your-token-here')

# 发送消息
response = api.send_message('帮我分析一下NAS系统的性能')
print(f'AI响应: {response["message"]}')

# 流式消息
def on_chunk(chunk):
    print(f'实时输出: {chunk}')

full_response = api.stream_message('帮我写一个Python脚本', on_chunk)
print(f'完整响应: {full_response}')

# 使用模板
template_response = api.use_template('code-generation', {
    'language': 'Python',
    'function': '文件上传'
})
print(f'模板响应: {template_response["message"]}')

# 获取对话历史
history = api.get_conversation_history('conv-001')
print(f'对话历史: {history}')

# 导出对话
export_result = api.export_conversation('conv-001', 'markdown')
print(f'导出结果: {export_result}')

# 获取可用模型
models = api.get_models()
print(f'可用模型: {models}')
```

### 示例3: cURL

```bash
# 发送消息
curl -X POST \
  -H "Authorization: Bearer your-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen:7b",
    "messages": [
      {
        "role": "user",
        "content": "帮我分析一下NAS系统的性能"
      }
    ],
    "stream": false
  }' \
  http://localhost:6000/api/v2/llm/chat

# 流式消息
curl -X POST \
  -H "Authorization: Bearer your-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen:7b",
    "messages": [
      {
        "role": "user",
        "content": "帮我写一个Python脚本"
      }
    ],
    "stream": true
  }' \
  http://localhost:6000/api/v2/llm/chat

# 使用模板
curl -X POST \
  -H "Authorization: Bearer your-token-here" \
  -H "Content-Type: application/json" \
  -d '{
    "template": "code-generation",
    "variables": {
      "language": "Python",
      "function": "文件上传",
      "description": "实现一个支持断点续传的文件上传功能"
    }
  }' \
  http://localhost:6000/api/v2/llm/template

# 获取对话历史
curl -X GET \
  -H "Authorization: Bearer your-token-here" \
  http://localhost:6000/api/v2/llm/conversation/conv-001

# 导出对话
curl -X POST \
  -H "Authorization: Bearer your-token-here" \
  -H "Content-Type: application/json" \
  -d '{"format": "markdown"}' \
  http://localhost:6000/api/v2/llm/conversation/conv-001/export

# 获取可用模型
curl -X GET \
  -H "Authorization: Bearer your-token-here" \
  http://localhost:6000/api/v2/llm/models
```

---

## 提示词模板示例

### 示例1: 代码生成模板

```typescript
// 代码生成模板
const codeGenerationTemplate = {
  name: 'code-generation',
  description: '生成高质量的代码',
  template: `你是一个资深的软件工程师，擅长编写高质量、可维护的代码。

请根据以下要求生成{{language}}代码：

功能描述：{{function}}
详细说明：{{description}}

要求：
1. 代码应该清晰、易读、有良好的注释
2. 遵循{{language}}的最佳实践和编码规范
3. 包含必要的错误处理
4. 考虑性能和安全性
5. 提供使用示例

请生成完整的代码，包括必要的导入和配置。`,
  variables: {
    language: '编程语言',
    function: '功能名称',
    description: '功能详细描述',
  },
};

// 使用示例
const variables = {
  language: 'Python',
  function: '文件上传',
  description: '实现一个支持断点续传的文件上传功能',
};

const response = await useTemplate('code-generation', variables);
console.log('生成的代码:', response.message);
```

### 示例2: 文档分析模板

```typescript
// 文档分析模板
const documentAnalysisTemplate = {
  name: 'document-analysis',
  description: '分析文档内容',
  template: `请分析以下文档：

文档内容：
{{document}}

分析类型：{{analysisType}}

请提供：
1. {{analysisType}}摘要
2. 关键要点
3. 主要结论
4. 可行性建议（如适用）
5. 风险提示（如适用）`,
  variables: {
    document: '文档内容',
    analysisType: '分析类型（summary/analysis/feasibility/risk）',
  },
};

// 使用示例
const variables = {
  document: '这是一份系统架构文档...',
  analysisType: 'summary',
};

const response = await useTemplate('document-analysis', variables);
console.log('文档摘要:', response.message);
```

### 示例3: 代码审查模板

```typescript
// 代码审查模板
const codeReviewTemplate = {
  name: 'code-review',
  description: '审查代码质量',
  template: `请审查以下代码：

代码：
\`\`\`{{language}}
{{code}}
\`\`\`

请从以下方面进行审查：
1. 代码质量和可读性
2. 潜在的bug和问题
3. 性能优化建议
4. 安全性问题
5. 最佳实践遵循情况
6. 改进建议

请提供具体的改进建议和修改后的代码示例。`,
  variables: {
    language: '编程语言',
    code: '代码内容',
  },
};

// 使用示例
const variables = {
  language: 'TypeScript',
  code: `
function processData(data: any[]) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    result.push(data[i].value);
  }
  return result;
}
  `,
};

const response = await useTemplate('code-review', variables);
console.log('审查结果:', response.message);
```

---

## 多模态支持示例

### 示例1: 图像分析

```typescript
// 图像分析
const analyzeImage = async (imageUrl: string, question: string) => {
  try {
    const response = await fetch('/api/v2/llm/vision', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: 'llava:7b',
        image: imageUrl,
        question,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('图像分析结果:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('图像分析失败:', error);
  }
};

// 使用示例
const analysis = await analyzeImage(
  'https://example.com/image.jpg',
  '请描述这张图片的内容'
);

console.log('图像描述:', analysis.description);
```

### 示例2: 文档分析

```typescript
// 文档分析
const analyzeDocument = async (fileUrl: string, question: string) => {
  try {
    const response = await fetch('/api/v2/llm/document', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        model: 'qwen:14b',
        document: fileUrl,
        question,
      }),
    });

    const data = await response.json();

    if (data.success) {
      console.log('文档分析结果:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('文档分析失败:', error);
  }
};

// 使用示例
const analysis = await analyzeDocument(
  'https://example.com/document.pdf',
  '请总结这份文档的主要内容'
);

console.log('文档摘要:', analysis.summary);
```

---

## 故障排查示例

### 示例1: 检查LLM服务状态

```typescript
// 检查LLM服务状态
const checkLLMService = async () => {
  try {
    const response = await fetch('/api/v2/llm/health');
    const data = await response.json();

    if (data.success) {
      const health = data.data;
      console.log('LLM服务状态:', health);
      
      // 检查各项服务状态
      if (health.ollama === 'healthy') {
        console.log('✅ Ollama服务正常');
      } else {
        console.log('❌ Ollama服务异常');
      }
      
      if (health.redis === 'healthy') {
        console.log('✅ Redis服务正常');
      } else {
        console.log('❌ Redis服务异常');
      }
      
      if (health.api === 'healthy') {
        console.log('✅ API服务正常');
      } else {
        console.log('❌ API服务异常');
      }
      
      return health;
    }
  } catch (error) {
    console.error('检查LLM服务状态失败:', error);
  }
};

checkLLMService();
```

### 示例2: 查看模型状态

```typescript
// 查看模型状态
const getModelStatus = async (modelName: string) => {
  try {
    const response = await fetch(`/api/v2/llm/model/${modelName}/status`);
    const data = await response.json();

    if (data.success) {
      console.log('模型状态:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('查看模型状态失败:', error);
  }
};

// 使用示例
const modelStatus = await getModelStatus('qwen:7b');
console.log('模型状态:', modelStatus);
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "name": "qwen:7b",
    "status": "loaded",
    "size": "4.7GB",
    "parameters": "7B",
    "quantization": "Q4_K_M",
    "memoryUsage": "5.2GB",
    "lastUsed": "2026-01-25T10:30:00Z"
  }
}
```

### 示例3: 下载模型

```typescript
// 下载模型
const downloadModel = async (modelName: string) => {
  try {
    const response = await fetch(`/api/v2/llm/model/${modelName}/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      console.log('模型下载已启动:', data.data);
      return data.data;
    }
  } catch (error) {
    console.error('下载模型失败:', error);
  }
};

// 使用示例
const downloadResult = await downloadModel('qwen:14b');
console.log('下载结果:', downloadResult);
```

---

## 最佳实践

### 1. 选择合适的模型

**建议**:
- 简单问答: 使用轻量级模型（qwen:7b, llama3:8b）
- 代码生成: 使用中等规模模型（qwen:14b）
- 文档分析: 使用大规模模型（qwen:72b, llama3:70b）
- 实时对话: 使用轻量级模型以获得快速响应

**示例**:
```typescript
const modelSelection = {
  simpleQA: 'qwen:7b',
  codeGeneration: 'qwen:14b',
  documentAnalysis: 'qwen:72b',
  realTimeChat: 'qwen:7b',
};
```

### 2. 优化提示词

**建议**:
- 明确指定任务和期望
- 提供足够的上下文信息
- 使用结构化的提示词格式
- 避免模糊和歧义的表述
- 包含示例和约束条件

**示例**:
```typescript
const goodPrompt = `你是一个资深的软件工程师。

任务：编写一个Python函数，用于处理CSV文件。

要求：
1. 函数应该接受文件路径作为参数
2. 使用pandas库读取CSV文件
3. 处理缺失值（用平均值填充）
4. 返回处理后的DataFrame
5. 包含错误处理
6. 添加详细的注释

请提供完整的代码和示例用法。`;

const badPrompt = '写一个处理CSV文件的函数';
```

### 3. 使用流式响应

**优势**:
- 更好的用户体验
- 实时反馈
- 减少等待时间

**示例**:
```typescript
// 使用流式响应
await streamMessage('帮我写一个Python脚本', (chunk) => {
  console.log('实时输出:', chunk);
});
```

### 4. 管理对话历史

**建议**:
- 定期清理不重要的对话
- 为重要对话添加标签
- 导出重要对话
- 使用对话搜索功能

**示例**:
```typescript
// 导出重要对话
const importantConversations = ['conv-001', 'conv-005', 'conv-010'];

for (const convId of importantConversations) {
  await exportConversation(convId, 'markdown');
}
```

### 5. 监控模型性能

**建议**:
- 监控响应时间
- 监控token使用量
- 监控内存使用
- 定期评估模型效果

**示例**:
```typescript
// 监控模型性能
const startTime = Date.now();
const response = await sendMessage('测试消息');
const endTime = Date.now();

const responseTime = endTime - startTime;
console.log(`响应时间: ${responseTime}ms`);
console.log(`Token使用量: ${response.tokens}`);
```

---

## 常见问题

### Q1: 如何选择合适的模型？

**A**: 根据任务复杂度和响应速度要求选择模型。简单任务使用轻量级模型，复杂任务使用大规模模型。

### Q2: 如何提高响应速度？

**A**: 1. 使用轻量级模型；2. 启用流式响应；3. 优化提示词长度；4. 使用缓存。

### Q3: 如何减少token使用量？

**A**: 1. 优化提示词长度；2. 避免重复信息；3. 使用结构化输出；4. 设置max_tokens限制。

### Q4: 如何处理敏感信息？

**A**: 不要在对话中发送敏感信息，如密码、密钥等。使用脱敏数据或占位符。

### Q5: 如何自定义模型行为？

**A**: 使用系统提示词设置模型的角色和行为，调整temperature、top_p等参数控制输出风格。

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
