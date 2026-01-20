# =============================================================================
# 0379.email LLM AI 服务
# =============================================================================
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
import os
import redis
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="0379.email LLM Service", version="1.0.0")

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis连接
try:
    redis_client = redis.Redis(
        host=os.getenv("REDIS_HOST", "localhost"),
        port=int(os.getenv("REDIS_PORT", 6379)),
        password=os.getenv("REDIS_PASSWORD"),
        decode_responses=True
    )
    redis_available = True
    logger.info("Redis连接成功")
except Exception as e:
    redis_available = False
    logger.error(f"Redis连接失败: {e}")

@app.get("/")
async def root():
    return {"message": "0379.email LLM AI服务", "status": "running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "0379.email LLM",
        "version": "1.0.0",
        "redis": redis_available,
        "timestamp": "2025-11-10"
    }

@app.get("/api")
async def api_info():
    return {
        "message": "LLM API服务运行正常",
        "version": "1.0.0",
        "endpoints": [
            "/health",
            "/api/status",
            "/api/chat",
            "/api/completion"
        ]
    }

@app.get("/api/status")
async def status():
    return {
        "status": "running",
        "service": "0379.email LLM",
        "redis": redis_available,
        "model": "gpt-3.5-turbo",
        "max_tokens": 2048,
        "temperature": 0.7
    }

@app.post("/api/chat")
async def chat(request: dict):
    """AI聊天接口"""
    try:
        message = request.get("message", "")
        if not message:
            raise HTTPException(status_code=400, detail="消息不能为空")

        # 模拟AI响应
        response = f"这是对 '{message}' 的AI响应。目前处于演示模式。"

        return {
            "message": response,
            "model": "gpt-3.5-turbo",
            "tokens_used": len(response.split()),
            "timestamp": "2025-11-10"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/completion")
async def completion(request: dict):
    """文本补全接口"""
    try:
        prompt = request.get("prompt", "")
        if not prompt:
            raise HTTPException(status_code=400, detail="提示词不能为空")

        # 模拟文本补全
        completion = f"{prompt} - 这是AI生成的补全内容。"

        return {
            "completion": completion,
            "model": "gpt-3.5-turbo",
            "tokens_used": len(completion.split()),
            "timestamp": "2025-11-10"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)