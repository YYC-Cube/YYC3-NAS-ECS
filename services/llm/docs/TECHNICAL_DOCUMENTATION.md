# LLM Service 技术文档

> 📋 **文档版本**: v3.0.0 | **更新时间**: 2025-12-08 | **维护团队**: YYC3 AI Family

## 📖 服务概述

YYC3 LLM Service 是YYC3 AI Family平台的AI大语言模型服务，提供智能对话、文本分析、AI推理等核心AI功能。

### 基本信息

- **服务名称**: YYC3 LLM Service
- **端口**: 6602 (生产) / 3002 (开发)
- **技术栈**: Node.js + Python | Express.js | OpenAI API | Anthropic Claude
- **主文件**: `server.js`, `main.py`
- **Python依赖**: `requirements.txt`

## 🏗️ 核心功能

### 主要特性

- **AI对话**: 智能问答与对话管理
- **文本处理**: 文本分析、生成、翻译
- **多模型支持**: OpenAI GPT、Claude、本地模型
- **上下文管理**: 对话历史和上下文保持
- **流式响应**: 实时流式AI回复
- **模型切换**: 灵活的模型选择和配置

### 支持的AI模型

| 模型类型 | 提供商 | 用途 | 状态 |
|----------|--------|------|------|
| GPT-3.5-turbo | OpenAI | 通用对话 | ✅ |
| GPT-4 | OpenAI | 复杂推理 | ✅ |
| Claude-3 | Anthropic | 安全对话 | ✅ |
| 本地模型 | Self-hosted | 私有化部署 | 🚧 |

### 关键端点

| 端点 | 方法 | 功能 | 认证 |
|------|------|------|------|
| `/health` | GET | 服务健康检查 | ❌ |
| `/api/llm/chat` | POST | AI对话 | ✅ |
| `/api/llm/models` | GET | 模型列表 | ✅ |
| `/api/llm/stream` | POST | 流式对话 | ✅ |
| `/api/llm/analyze` | POST | 文本分析 | ✅ |

## 📁 文件结构

```
llm/
├── 📄 server.js              # Node.js主服务文件
├── 📄 main.py                # Python AI核心引擎
├── 📄 package.json           # Node.js依赖
├── 📄 requirements.txt       # Python依赖
├── 📄 .env.example           # 环境变量示例
├── 📄 swagger.json           # API文档
├── 📁 logs/                  # 日志目录
└── 📄 server.js.backup       # 备份文件
```

## 🔧 配置说明

### 环境变量

```bash
# 服务端口
LLM_PORT=3002

# OpenAI配置
OPENAI_API_KEY=your_openai_key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-3.5-turbo

# Anthropic配置
ANTHROPIC_API_KEY=your_anthropic_key
ANTHROPIC_MODEL=claude-3-sonnet-20240229

# 本地模型配置
LOCAL_MODEL_URL=http://localhost:8080
LOCAL_MODEL_NAME=llama2-7b

# Redis配置（缓存）
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# API服务配置
API_SERVICE_URL=http://localhost:3000
ADMIN_SERVICE_URL=http://localhost:3001
```

### Python依赖 (`requirements.txt`)

```txt
openai==1.3.0
anthropic==0.7.0
transformers==4.35.0
torch==2.1.0
numpy==1.24.0
requests==2.31.0
python-dotenv==1.0.0
```

## 🔌 API接口文档

### AI对话接口

#### 标准对话
```http
POST /api/llm/chat
Content-Type: application/json
Authorization: Bearer {token}

{
  "message": "你好，请介绍一下YYC3平台",
  "model": "gpt-3.5-turbo",
  "temperature": 0.7,
  "max_tokens": 1000,
  "context": true
}

Response:
{
  "success": true,
  "data": {
    "response": "YYC3是一个功能强大的AI平台...",
    "model": "gpt-3.5-turbo",
    "tokens_used": 256,
    "cost": 0.000256,
    "response_time": 1.2,
    "context_id": "ctx_123456"
  }
}
```

#### 流式对话
```http
POST /api/llm/stream
Content-Type: application/json
Authorization: Bearer {token}

{
  "message": "请写一首关于YYC3的诗",
  "model": "claude-3-sonnet",
  "stream": true
}

Response: (Server-Sent Events)
data: {"type": "start", "message_id": "msg_123"}
data: {"type": "token", "content": "言启"}
data: {"type": "token", "content": "象限"}
...
data: {"type": "end", "message_id": "msg_123", "tokens": 150}
```

## 🤖 AI核心引擎

### Python AI处理 (`main.py`)

```python
import openai
import anthropic
from typing import Dict, List, Optional

class LLMEngine:
    def __init__(self):
        self.openai_client = openai.OpenAI()
        self.anthropic_client = anthropic.Anthropic()

    async def chat_completion(self, message: str, model: str, **kwargs):
        """AI对话完成"""
        if model.startswith('gpt'):
            return await self._openai_completion(message, model, **kwargs)
        elif model.startswith('claude'):
            return await self._anthropic_completion(message, model, **kwargs)
        else:
            return await self._local_model_completion(message, model, **kwargs)

    async def analyze_text(self, text: str, analysis_type: str):
        """文本分析"""
        # 实现文本分析逻辑
        pass
```

### Node.js服务层 (`server.js`)

```javascript
const express = require('express');
const { spawn } = require('child_process');

class LLMService {
  constructor() {
    this.pythonProcess = null;
    this.initializePythonEngine();
  }

  async initializePythonEngine() {
    this.pythonProcess = spawn('python3', ['main.py'], {
      cwd: __dirname,
      stdio: ['pipe', 'pipe', 'pipe']
    });
  }

  async processMessage(message, model, options = {}) {
    return new Promise((resolve, reject) => {
      const request = {
        type: 'chat',
        message,
        model,
        options
      };

      this.pythonProcess.stdin.write(JSON.stringify(request) + '\n');

      // 处理响应
      this.pythonProcess.stdout.once('data', (data) => {
        try {
          const response = JSON.parse(data.toString());
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}
```

## 📊 性能监控

### 模型性能指标

```javascript
const metrics = {
  requestCount: 0,
  totalTokens: 0,
  averageResponseTime: 0,
  modelUsage: {
    'gpt-3.5-turbo': { count: 0, tokens: 0, cost: 0 },
    'claude-3-sonnet': { count: 0, tokens: 0, cost: 0 }
  }
};

function updateMetrics(model, tokens, responseTime, cost) {
  metrics.requestCount++;
  metrics.totalTokens += tokens;
  metrics.averageResponseTime =
    (metrics.averageResponseTime * (metrics.requestCount - 1) + responseTime) / metrics.requestCount;

  if (!metrics.modelUsage[model]) {
    metrics.modelUsage[model] = { count: 0, tokens: 0, cost: 0 };
  }

  metrics.modelUsage[model].count++;
  metrics.modelUsage[model].tokens += tokens;
  metrics.modelUsage[model].cost += cost;
}
```

### 健康检查

访问 `/health` 端点获取服务状态：

```json
{
  "status": "ok",
  "service": "yyc3-llm-service",
  "port": 6602,
  "timestamp": "2025-12-08T06:00:00.000Z",
  "uptime": 86400,
  "version": "3.0.0",
  "models": {
    "available": ["gpt-3.5-turbo", "claude-3-sonnet"],
    "default": "gpt-3.5-turbo"
  },
  "python_engine": "connected"
}
```

## 🚀 部署指南

### 开发环境启动

```bash
# 1. 安装Python依赖
cd /Users/yanyu/www/yyc3-22/app/llm
pip install -r requirements.txt

# 2. 安装Node.js依赖
npm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填入API密钥

# 4. 启动服务
npm start
```

### 生产环境部署

```bash
# 使用 PM2 管理进程
pm2 start server.js --name "yyc3-llm-service" --port 6602

# 或使用 Docker
docker build -t yyc3-llm-service .
docker run -p 6602:6602 yyc3-llm-service
```

## 🔒 安全特性

### API密钥管理

```javascript
// 安全的API密钥轮换
function rotateAPIKey(provider) {
  const keys = {
    openai: process.env.OPENAI_KEYS.split(','),
    anthropic: process.env.ANTHROPIC_KEYS.split(',')
  };

  const currentKeyIndex = Math.floor(Math.random() * keys[provider].length);
  return keys[provider][currentKeyIndex];
}
```

### 内容过滤

```python
def content_filter(message: str) -> bool:
    """内容安全检查"""
    forbidden_patterns = [
        '暴力', '仇恨', '歧视', '违法'
    ]

    for pattern in forbidden_patterns:
        if pattern in message.lower():
            return False

    return True
```

## 🧪 测试

### 单元测试示例

```javascript
const request = require('supertest');
const app = require('./server');

describe('LLM Service', () => {
  test('GET /health should return 200', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);

    expect(response.body).toHaveProperty('status', 'ok');
  });

  test('POST /api/llm/chat with valid message', async () => {
    const response = await request(app)
      .post('/api/llm/chat')
      .send({
        message: 'Hello',
        model: 'gpt-3.5-turbo'
      })
      .expect(200);

    expect(response.body.data).toHaveProperty('response');
  });
});
```

## 🔗 相关链接

- **主服务文档**: `[../TECHNICAL_DOCUMENTATION.md](../TECHNICAL_DOCUMENTATION.md)`
- **API参考文档**: `[../API_REFERENCE.md](../API_REFERENCE.md)`
- **OpenAI文档**: https://platform.openai.com/docs
- **Anthropic文档**: https://docs.anthropic.com
- **API服务**: `../api/`
- **管理后台**: `../admin/`
- **邮件服务**: `../mail/`

## 📞 技术支持

- **问题反馈**: <dev@0379.email>
- **服务监控**: `https://monitor.0379.email`
- **在线文档**: `https://docs.0379.email`

---

<div align="center">

**[⬆️ 回到顶部](#llm-service-技术文档)**

Made with ❤️ by YYC3 AI Family Team

**言启象限，语枢智能** 🤖

</div>