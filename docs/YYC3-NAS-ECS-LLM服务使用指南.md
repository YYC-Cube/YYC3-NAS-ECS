# YYC3-NAS-ECS LLM服务使用指南

> 大语言模型服务完整使用指南

## 概述

YYC3-NAS-ECS集成了完整的大语言模型（LLM）服务，基于Ollama构建，提供智能对话、文本生成、代码分析、配置优化等功能。支持多种开源模型，包括Qwen、Llama3等，并提供了Web界面和REST API两种使用方式。

## 功能特性

- **多模型支持**: 支持Qwen、Llama3等多种开源模型
- **流式输出**: 支持实时流式响应
- **智能对话**: 支持多轮对话和上下文管理
- **模板管理**: 提供预设提示词模板
- **AI优化**: 智能配置优化和代码分析
- **REST API**: 完整的RESTful API接口
- **Web界面**: 可视化对话界面
- **模型管理**: 支持模型下载、删除、切换

## 快速开始

### 1. 服务架构

```
用户请求 → API网关 → LLM服务 → Ollama引擎 → AI模型
```

**组件说明**:
- **API网关**: 处理认证和请求路由
- **LLM服务**: 提供业务逻辑和API接口
- **Ollama引擎**: 模型推理引擎
- **AI模型**: 实际的大语言模型

### 2. 环境要求

**硬件要求**:
- CPU: 4核心以上
- 内存: 16GB以上（推荐32GB）
- 存储: 50GB以上可用空间
- GPU: 可选，用于加速推理

**软件要求**:
- Docker: 20.10+
- Docker Compose: 2.0+
- Python: 3.8+
- Node.js: 18+

### 3. 服务启动

```bash
# 启动LLM服务
docker-compose up -d llm

# 查看服务状态
docker-compose ps llm

# 查看服务日志
docker-compose logs -f llm

# 停止服务
docker-compose stop llm
```

### 4. 服务配置

**环境变量配置** (`.env`):
```bash
# Ollama服务地址
OLLAMA_BASE_URL=http://192.168.3.45:11434

# Redis配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password

# API配置
API_PORT=8002
API_HOST=0.0.0.0

# 模型配置
DEFAULT_MODEL=qwen:7b
MAX_TOKENS=2048
TEMPERATURE=0.7
```

## Web界面使用

### 1. 访问LLM服务

1. 登录YYC3-NAS-ECS系统
2. 导航到"AI服务" > "LLM对话"
3. 进入AI智能助手界面

### 2. 对话功能

**基础对话**:
```typescript
// 在Web界面中输入消息
输入: "帮我分析一下NAS系统的性能"

// AI响应
输出: "根据系统监控数据，您的NAS系统性能表现如下：
1. CPU使用率: 平均45%，峰值78%
2. 内存使用率: 平均62%，峰值85%
3. 磁盘I/O: 读写速度正常
4. 网络带宽: 使用率30%

建议：
- 考虑增加内存以提升并发处理能力
- 优化磁盘缓存策略
- 监控CPU峰值时段的负载情况"
```

**多轮对话**:
```typescript
// 第一轮对话
用户: "如何优化NAS存储性能？"

AI: "以下是一些NAS存储性能优化建议：
1. 使用SSD缓存加速热数据访问
2. 启用数据压缩减少存储空间占用
3. 配置RAID级别提升读写性能
4. 优化文件系统选择（如ZFS、Btrfs）
5. 定期进行磁盘碎片整理"

// 第二轮对话
用户: "具体如何配置SSD缓存？"

AI: "SSD缓存配置步骤：
1. 准备SSD设备
2. 在存储管理中添加SSD作为缓存设备
3. 配置缓存策略：
   - 读缓存: 启用
   - 写缓存: 启用
   - 缓存大小: 根据SSD容量设置
4. 设置缓存算法（如LRU、LFU）
5. 监控缓存命中率"
```

### 3. 模型切换

```typescript
// 在设置面板中选择模型
<select>
  <option value="qwen:7b">Qwen 7B (4.7GB)</option>
  <option value="qwen:14b">Qwen 14B (9.2GB)</option>
  <option value="llama3:8b">Llama3 8B (4.9GB)</option>
  <option value="llama3:70b">Llama3 70B (40.2GB)</option>
</select>
```

**模型选择建议**:
- **Qwen 7B**: 通用场景，平衡性能和资源占用
- **Qwen 14B**: 复杂任务，需要更高推理能力
- **Llama3 8B**: 英文场景，多语言支持好
- **Llama3 70B**: 最高性能，需要大量资源

### 4. 系统提示词配置

```typescript
// 在设置面板中配置系统提示词
<textarea>
你是一个专业的NAS系统管理专家，擅长：
- 系统性能分析和优化
- 存储管理和数据保护
- 网络配置和安全
- 故障诊断和问题解决

请用简洁、专业的语言回答用户问题。
</textarea>
```

**系统提示词示例**:

**代码助手**:
```
你是一个专业的编程助手，擅长：
- 代码编写和优化
- Bug调试和修复
- 代码重构和设计模式
- 多种编程语言（Python、JavaScript、Go等）

请提供清晰、可运行的代码示例。
```

**文档助手**:
```
你是一个技术文档编写专家，擅长：
- 技术文档撰写和优化
- API文档生成
- 用户手册编写
- 技术方案设计

请使用清晰的结构和专业的术语。
```

**运维助手**:
```
你是一个系统运维专家，擅长：
- 系统监控和告警
- 性能优化和调优
- 故障诊断和恢复
- 自动化运维

请提供具体、可操作的解决方案。
```

### 5. 模板管理

**使用预设模板**:
```typescript
// 在"模板管理"标签中选择模板
// 系统性能分析模板
模板名称: "系统性能分析"
提示词: "请分析当前NAS系统的性能状况，包括CPU、内存、磁盘、网络等方面，并提供优化建议。"

// 代码优化模板
模板名称: "代码优化"
提示词: "请分析以下代码，找出潜在的性能问题和安全漏洞，并提供优化建议：\n\n{code}"

// 配置优化模板
模板名称: "配置优化"
提示词: "请分析以下配置文件，提供优化建议：\n\n{config}"
```

**创建自定义模板**:
```typescript
// 点击"添加模板"按钮
{
  "name": "日志分析",
  "description": "分析系统日志并找出问题",
  "prompt": "请分析以下系统日志，识别错误、警告和异常情况，并提供解决方案：\n\n{logs}",
  "variables": ["logs"]
}
```

## API使用

### 1. 获取模型列表

```typescript
// 获取已安装的模型列表
const response = await fetch('/api/v2/llm/tags', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();

// 响应示例
{
  "models": [
    {
      "name": "qwen:7b",
      "size": "4.7GB",
      "modified_at": "2025-01-20T10:30:00Z"
    },
    {
      "name": "qwen:14b",
      "size": "9.2GB",
      "modified_at": "2025-01-20T10:30:00Z"
    },
    {
      "name": "llama3:8b",
      "size": "4.9GB",
      "modified_at": "2025-01-18T14:20:00Z"
    }
  ]
}
```

### 2. 生成对话（流式）

```typescript
// 发送对话请求（流式输出）
const response = await fetch('/api/v2/llm/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    model: 'qwen:7b',
    prompt: '帮我分析一下NAS系统的性能',
    stream: true,
    system: '你是一个专业的NAS系统管理专家'
  })
});

// 处理流式响应
const reader = response.body?.getReader();
const decoder = new TextDecoder();
let fullResponse = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value, { stream: true });
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.trim() === '') continue;
    
    try {
      const data = JSON.parse(line);
      if (data.response) {
        fullResponse += data.response;
        console.log('收到响应片段:', data.response);
      }
      if (data.done) {
        console.log('响应完成');
      }
    } catch (e) {
      console.error('解析错误:', e);
    }
  }
}

console.log('完整响应:', fullResponse);
```

### 3. 生成对话（非流式）

```typescript
// 发送对话请求（非流式）
const response = await fetch('/api/v2/llm/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    model: 'qwen:7b',
    prompt: '帮我分析一下NAS系统的性能',
    stream: false,
    system: '你是一个专业的NAS系统管理专家'
  })
});

const data = await response.json();

// 响应示例
{
  "model": "qwen:7b",
  "created_at": "2025-01-25T10:30:00Z",
  "response": "根据系统监控数据，您的NAS系统性能表现如下：...",
  "done": true,
  "context": [123, 456, 789],
  "total_duration": 2345678,
  "load_duration": 123456,
  "prompt_eval_count": 42,
  "prompt_eval_duration": 1234567,
  "eval_count": 256,
  "eval_duration": 9876543
}
```

### 4. 聊天补全（多轮对话）

```typescript
// 多轮对话
const response = await fetch('/api/v2/llm/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    model: 'qwen:7b',
    messages: [
      {
        "role": "system",
        "content": "你是一个专业的NAS系统管理专家"
      },
      {
        "role": "user",
        "content": "如何优化NAS存储性能？"
      },
      {
        "role": "assistant",
        "content": "以下是一些NAS存储性能优化建议：..."
      },
      {
        "role": "user",
        "content": "具体如何配置SSD缓存？"
      }
    ],
    stream: true
  })
});

// 处理流式响应（同上）
const reader = response.body?.getReader();
// ...
```

### 5. 拉取新模型

```typescript
// 拉取新模型
const response = await fetch('/api/v2/llm/pull', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'llama3:8b'
  })
});

// 处理流式响应
const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value, { stream: true });
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.trim() === '') continue;
    
    try {
      const data = JSON.parse(line);
      if (data.status) {
        console.log('状态:', data.status);
      }
      if (data.digest) {
        console.log('摘要:', data.digest);
      }
      if (data.total) {
        console.log('总大小:', data.total);
      }
      if (data.completed) {
        console.log('已完成:', data.completed);
        const progress = (data.completed / data.total * 100).toFixed(2);
        console.log('进度:', progress + '%');
      }
    } catch (e) {
      console.error('解析错误:', e);
    }
  }
}
```

### 6. 删除模型

```typescript
// 删除模型
const response = await fetch('/api/v2/llm/models/llama3:8b', {
  method: 'DELETE',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();

// 响应示例
{
  "success": true,
  "message": "Model llama3:8b deleted successfully"
}
```

## React Hook使用

### 1. 使用useLLM Hook

```typescript
import { useLLM } from '@/hooks/useLLM';

function MyComponent() {
  const { generateConfig, analyzeLog, generateResponse, isGenerating } = useLLM();

  const handleGenerateConfig = async () => {
    const currentConfig = `
[api]
type = "http"
local_port = 8080
subdomain = "api"
    `;

    const prompt = "请优化此FRP配置";
    const optimizedConfig = await generateConfig(currentConfig, prompt);
    console.log('优化后的配置:', optimizedConfig);
  };

  const handleAnalyzeLog = async () => {
    const logEntry = "2025/01/25 10:30:00 [E] Connection timeout";
    const analysis = await analyzeLog(logEntry);
    console.log('日志分析:', analysis);
  };

  const handleGenerateResponse = async () => {
    const prompt = "帮我分析一下NAS系统的性能";
    const response = await generateResponse(prompt);
    console.log('AI响应:', response);
  };

  return (
    <div>
      <button onClick={handleGenerateConfig} disabled={isGenerating}>
        {isGenerating ? '生成中...' : '生成配置'}
      </button>
      <button onClick={handleAnalyzeLog} disabled={isGenerating}>
        {isGenerating ? '分析中...' : '分析日志'}
      </button>
      <button onClick={handleGenerateResponse} disabled={isGenerating}>
        {isGenerating ? '响应中...' : '生成响应'}
      </button>
    </div>
  );
}
```

### 2. 集成到组件

```typescript
import { useState } from 'react';
import { useLLM } from '@/hooks/useLLM';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const AIOptimizer: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const { generateResponse, isGenerating } = useLLM();

  const handleOptimize = async () => {
    if (!input.trim()) return;

    const response = await generateResponse(
      `请分析并优化以下内容：\n\n${input}`
    );
    setOutput(response);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI优化器</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            placeholder="输入需要优化的内容..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button
            onClick={handleOptimize}
            disabled={isGenerating || !input.trim()}
            className="w-full"
          >
            {isGenerating ? '优化中...' : '开始优化'}
          </Button>
          {output && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="whitespace-pre-wrap">{output}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
```

## 高级功能

### 1. FRP配置优化

```typescript
import { useLLM } from '@/hooks/useLLM';

export const FRPOptimizer: React.FC = () => {
  const { generateConfig, isGenerating } = useLLM();

  const optimizeFRPConfig = async (config: string) => {
    const prompt = `
请分析以下FRP配置文件，并提供详细的优化建议：

配置内容：
\`\`\`
${config}
\`\`\`

请从以下方面进行分析：
1. 安全性：认证、加密、访问控制
2. 性能：连接池、带宽限制、缓存
3. 可靠性：健康检查、重连机制
4. 最佳实践：配置规范、命名约定

请提供优化后的配置和详细的优化说明。
    `;

    const optimizedConfig = await generateConfig(config, prompt);
    return optimizedConfig;
  };

  return (
    <div>
      {/* UI组件 */}
    </div>
  );
};
```

### 2. 日志分析

```typescript
import { useLLM } from '@/hooks/useLLM';

export const LogAnalyzer: React.FC = () => {
  const { analyzeLog, isGenerating } = useLLM();

  const analyzeSystemLog = async (logEntry: string) => {
    const analysis = await analyzeLog(logEntry);
    
    // 解析分析结果
    const lines = analysis.split('\n');
    const errorType = lines.find(line => line.includes('错误类型'));
    const solution = lines.find(line => line.includes('解决方案'));
    
    return {
      errorType,
      solution,
      fullAnalysis: analysis
    };
  };

  return (
    <div>
      {/* UI组件 */}
    </div>
  );
};
```

### 3. 代码审查

```typescript
import { useLLM } from '@/hooks/useLLM';

export const CodeReviewer: React.FC = () => {
  const { generateResponse, isGenerating } = useLLM();

  const reviewCode = async (code: string, language: string) => {
    const prompt = `
请审查以下${language}代码，从以下方面进行分析：

1. 代码质量：可读性、可维护性
2. 性能：时间复杂度、空间复杂度
3. 安全性：潜在的安全漏洞
4. 最佳实践：是否符合语言规范
5. 优化建议：具体的改进方案

代码内容：
\`\`\`${language}
${code}
\`\`\`
    `;

    const review = await generateResponse(prompt);
    return review;
  };

  return (
    <div>
      {/* UI组件 */}
    </div>
  );
};
```

### 4. 文档生成

```typescript
import { useLLM } from '@/hooks/useLLM';

export const DocGenerator: React.FC = () => {
  const { generateResponse, isGenerating } = useLLM();

  const generateAPIDoc = async (apiCode: string) => {
    const prompt = `
请根据以下API代码生成完整的API文档，包括：
1. API概述
2. 端点列表
3. 请求参数
4. 响应格式
5. 错误码说明
6. 使用示例

代码内容：
\`\`\`
${apiCode}
\`\`\`
    `;

    const doc = await generateResponse(prompt);
    return doc;
  };

  return (
    <div>
      {/* UI组件 */}
    </div>
  );
};
```

## 最佳实践

### 1. 提示词工程

**清晰具体的提示词**:
```typescript
// 不好的提示词
"帮我写个函数"

// 好的提示词
"请编写一个Python函数，实现以下功能：
1. 接收一个整数列表作为参数
2. 返回列表中的最大值和最小值
3. 处理空列表的情况
4. 添加类型注解和文档字符串
5. 提供使用示例"
```

**使用示例和格式**:
```typescript
const prompt = `
请分析以下JSON配置文件，找出所有潜在问题：

\`\`\`json
${jsonConfig}
\`\`\`

请按以下格式输出：
1. 问题类型
2. 问题描述
3. 影响范围
4. 修复建议
`;
```

**分步骤提示**:
```typescript
const prompt = `
请按照以下步骤分析系统性能：

步骤1：分析CPU使用情况
- 检查CPU使用率
- 识别CPU密集型进程
- 评估CPU负载

步骤2：分析内存使用情况
- 检查内存使用率
- 识别内存泄漏
- 评估缓存效果

步骤3：分析磁盘I/O
- 检查读写速度
- 识别I/O瓶颈
- 评估磁盘健康

请为每个步骤提供详细的分析和建议。
`;
```

### 2. 性能优化

**使用流式输出**:
```typescript
// 对于长响应，使用流式输出提升用户体验
const response = await fetch('/api/v2/llm/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'qwen:7b',
    prompt: prompt,
    stream: true  // 启用流式输出
  })
});
```

**合理设置参数**:
```typescript
// 根据任务复杂度选择合适的模型
const model = simpleTask ? 'qwen:7b' : 'qwen:14b';

// 根据响应长度调整max_tokens
const maxTokens = shortResponse ? 512 : 2048;

// 根据任务类型调整temperature
const temperature = creativeTask ? 0.8 : 0.2;
```

**缓存响应**:
```typescript
// 使用Redis缓存常见问题的响应
const cacheKey = `llm:${model}:${hash(prompt)}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const response = await generateResponse(prompt);
await redis.set(cacheKey, JSON.stringify(response), 'EX', 3600);
```

### 3. 错误处理

```typescript
async function safeGenerateResponse(prompt: string) {
  try {
    const response = await fetch('/api/v2/llm/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen:7b',
        prompt: prompt,
        stream: false
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('生成响应失败:', error);
    
    // 返回友好的错误消息
    return {
      error: 'AI服务暂时不可用，请稍后重试',
      fallback: '建议您：\n1. 检查网络连接\n2. 稍后重试\n3. 联系技术支持'
    };
  }
}
```

### 4. 安全考虑

**输入验证**:
```typescript
function validatePrompt(prompt: string): boolean {
  // 检查提示词长度
  if (prompt.length > 10000) {
    throw new Error('提示词过长');
  }

  // 检查敏感内容
  const sensitivePatterns = [
    /password/i,
    /secret/i,
    /token/i
  ];

  for (const pattern of sensitivePatterns) {
    if (pattern.test(prompt)) {
      throw new Error('提示词包含敏感内容');
    }
  }

  return true;
}
```

**输出过滤**:
```typescript
function filterResponse(response: string): string {
  // 移除潜在的恶意代码
  const filtered = response
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');

  return filtered;
}
```

**速率限制**:
```typescript
// 使用Redis实现速率限制
async function checkRateLimit(userId: string): Promise<boolean> {
  const key = `ratelimit:${userId}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 60); // 60秒窗口
  }

  return count <= 10; // 每分钟最多10次请求
}
```

## 故障排除

### 常见问题

#### 1. 模型加载失败

**症状**: 无法加载或切换模型

**可能原因**:
- 模型文件损坏
- 磁盘空间不足
- 内存不足
- Ollama服务未启动

**解决方案**:
```bash
# 检查Ollama服务状态
docker-compose ps ollama

# 查看Ollama日志
docker-compose logs ollama

# 检查磁盘空间
df -h

# 重新拉取模型
curl -X POST http://localhost:11434/api/pull -d '{"name":"qwen:7b"}'

# 重启Ollama服务
docker-compose restart ollama
```

#### 2. 响应速度慢

**症状**: AI响应时间过长

**可能原因**:
- 模型太大
- 硬件性能不足
- 网络延迟
- 并发请求过多

**解决方案**:
```bash
# 使用更小的模型
qwen:7b  # 4.7GB
qwen:14b # 9.2GB

# 启用GPU加速（如果有）
# 在Ollama配置中设置GPU

# 限制并发请求数
# 在API网关中配置限流

# 使用流式输出提升体验
stream: true
```

#### 3. 内存溢出

**症状**: 服务崩溃或响应错误

**可能原因**:
- 模型太大
- 并发请求过多
- 系统内存不足

**解决方案**:
```bash
# 增加系统内存
# 或使用更小的模型

# 限制并发数
# 在Docker配置中设置资源限制
services:
  llm:
    mem_limit: 8g
    cpus: '4.0'

# 定期清理缓存
docker system prune -a
```

#### 4. 连接超时

**症状**: API请求超时

**可能原因**:
- 网络问题
- 服务未启动
- 防火墙阻止

**解决方案**:
```bash
# 检查服务状态
curl http://localhost:11434/api/tags

# 检查网络连接
ping 192.168.3.45

# 检查防火墙规则
sudo iptables -L -n

# 增加超时时间
timeout: 300  # 5分钟
```

## 监控和日志

### 1. 服务监控

```typescript
// 监控服务健康状态
async function monitorLLMService() {
  const response = await fetch('/api/v2/llm/health');
  const health = await response.json();

  if (health.status !== 'healthy') {
    // 发送告警
    sendAlert('LLM服务异常');
  }

  // 记录指标
  metrics.record('llm.service.health', health.status);
}
```

### 2. 性能监控

```typescript
// 监控生成性能
async function generateWithMetrics(prompt: string) {
  const startTime = Date.now();
  
  const response = await generateResponse(prompt);
  
  const duration = Date.now() - startTime;
  const tokens = response.response.split(' ').length;
  const tokensPerSecond = tokens / (duration / 1000);

  metrics.record('llm.generation.duration', duration);
  metrics.record('llm.generation.tokens', tokens);
  metrics.record('llm.generation.tps', tokensPerSecond);

  return response;
}
```

### 3. 日志分析

```bash
# 查看LLM服务日志
docker-compose logs -f llm

# 查看错误日志
docker-compose logs llm | grep ERROR

# 查看访问日志
docker-compose logs llm | grep "POST /api/v2/llm/generate"

# 统计请求量
docker-compose logs llm | grep "POST /api/v2/llm/generate" | wc -l
```

## 参考资源

- [Ollama官方文档](https://github.com/ollama/ollama)
- [Qwen模型文档](https://github.com/QwenLM/Qwen)
- [Llama3模型文档](https://llama.meta.com/)
- [YYC3-NAS-ECS项目文档](./README.md)
- [YYC3团队规范](../YYC3团队规范.md)

## 技术支持

如有问题，请联系YYC3团队：
- 邮箱: admin@0379.email
- 项目地址: https://github.com/yyc3-team/YYC3-NAS-ECS

---

<div align="center">

> 「***YanYuCloudCube***」
> 「***<admin@0379.email>***」
> 「***Words Initiate Quadrants, Language Serves as Core for the Future***」
> 「***All things converge in the cloud pivot; Deep stacks ignite a new era of intelligence***」

</div>
