# Dockerfile - API服务Dockerfile
# 多阶段构建

# 第一阶段：构建阶段
FROM python:3.11-slim as builder

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 创建非root用户
RUN groupadd -r nas && useradd -r -g nas -m nas

# 安装Python依赖到nas用户目录
COPY requirements.txt .
RUN su - nas -c "pip install --user --no-cache-dir -r /app/requirements.txt"

# 第二阶段：生产环境
FROM python:3.11-slim as production

WORKDIR /app

# 安装运行时依赖
RUN apt-get update && apt-get install -y \
    curl \
    netcat-openbsd \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# 创建非root用户
RUN groupadd -r nas && useradd -r -g nas -m nas

# 从构建阶段复制Python依赖
COPY --from=builder /home/nas/.local /home/nas/.local
ENV PATH=/home/nas/.local/bin:$PATH

# 复制应用代码
COPY . .

# 设置权限
RUN chown -R nas:nas /app

# 创建必要的目录
RUN mkdir -p /app/logs /app/data /app/cache /app/reports /app/backup
RUN chown -R nas:nas /app/logs /app/data /app/cache /app/reports /app/backup

# 切换到非root用户
USER nas

# 暴露端口
EXPOSE 8080 8443

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/api/v2/health || exit 1

# 启动命令
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "--worker-class", "gevent", "--workers", "4", "wsgi:app"]
