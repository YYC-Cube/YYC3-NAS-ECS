#!/bin/bash
set -e

echo "=========================================="
echo "NAS DDNS API服务启动"
echo "环境: ${ENVIRONMENT}"
echo "时间: $(date)"
echo "=========================================="

# 等待数据库就绪
if [ "$ENVIRONMENT" != "test" ]; then
    echo "等待数据库就绪..."
    until nc -z postgres 5432; do
        echo "数据库未就绪，等待5秒..."
        sleep 5
    done
    echo "数据库已就绪"

    echo "等待Redis就绪..."
    until nc -z redis 6379; do
        echo "Redis未就绪，等待5秒..."
        sleep 5
    done
    echo "Redis已就绪"
fi

# 数据库迁移
if [ "$ENVIRONMENT" = "production" ] || [ "$ENVIRONMENT" = "staging" ]; then
    echo "运行数据库迁移..."
    flask db upgrade
    echo "数据库迁移完成"
fi

# 初始化数据
if [ "$ENVIRONMENT" = "development" ] || [ "${INIT_DATA:-false}" = "true" ]; then
    echo "初始化数据..."
    flask db upgrade
    flask seed || true
    echo "数据初始化完成"
fi

# 创建必要目录
mkdir -p /app/logs /app/data /app/cache /app/reports /app/backup

# 设置环境
export PYTHONPATH=/app

# 根据环境选择启动命令
if [ "$ENVIRONMENT" = "development" ]; then
    echo "以开发模式启动..."
    exec flask run --host=0.0.0.0 --port=8080 --reload
else
    echo "以生产模式启动..."
    exec gunicorn \
        --bind 0.0.0.0:8080 \
        --worker-class gevent \
        --workers 4 \
        --threads 2 \
        --timeout 120 \
        --access-logfile /app/logs/gunicorn-access.log \
        --error-logfile /app/logs/gunicorn-error.log \
        --log-level info \
        --capture-output \
        --enable-stdio-inheritance \
        app:app
fi
