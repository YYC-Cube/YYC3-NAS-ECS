#!/bin/bash
# start.sh - 快速启动脚本

set -e

echo "=========================================="
echo "NAS DDNS API 快速启动"
echo "开始时间: $(date)"
echo "=========================================="

# 检查 Docker 和 Docker Compose
if ! command -v docker &> /dev/null; then
    echo "❌ 错误: Docker 未安装"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ 错误: Docker Compose 未安装"
    exit 1
fi

# 创建必要的目录
echo "📁 创建必要的目录..."
mkdir -p \
    data/postgres \
    data/redis \
    data/prometheus \
    data/grafana \
    logs \
    backup \
    config \
    scripts \
    reports

# 检查环境变量文件
if [ ! -f .env ]; then
    echo "⚠️  警告: .env 文件不存在"
    if [ -f .env.example ]; then
        echo "📝 从 .env.example 复制配置..."
        cp .env.example .env
        echo "✅ 已创建 .env 文件，请根据需要编辑"
    else
        echo "❌ 错误: .env.example 文件不存在"
        exit 1
    fi
fi

# 加载环境变量
source .env 2>/dev/null || true

# 显示配置信息
echo ""
echo "📋 配置信息:"
echo "  环境: ${ENVIRONMENT:-development}"
echo "  API 端口: ${API_PORT:-8080}"
echo "  数据库: ${POSTGRES_DB:-nas_ddns}"
echo "  域名: ${NAS_DOMAIN:-ddns.0379.email}"
echo ""

# 检查是否需要构建镜像
if [ "$1" = "--rebuild" ] || [ ! -d .venv ]; then
    echo "🔨 构建 Docker 镜像..."
    docker-compose build
fi

# 启动服务
echo "🚀 启动服务..."
docker-compose up -d

# 等待服务就绪
echo "⏳ 等待服务启动..."
sleep 10

# 显示服务状态
echo ""
echo "📊 服务状态:"
docker-compose ps

# 健康检查
echo ""
echo "🏥 执行健康检查..."
for i in {1..6}; do
    if curl -f -s http://localhost:${API_PORT:-8080}/api/v2/health > /dev/null 2>&1; then
        echo "✅ 系统健康检查通过"
        break
    else
        echo "⏳ 等待系统就绪 ($i/6)..."
        sleep 5
    fi

    if [ $i -eq 6 ]; then
        echo "❌ 系统健康检查失败"
        echo "📝 查看日志: docker-compose logs -f api"
        exit 1
    fi
done

echo ""
echo "=========================================="
echo "🎉 启动完成"
echo "=========================================="
echo ""
echo "📌 访问地址:"
echo "  Web界面: http://localhost:${API_PORT:-8080}/"
echo "  API文档: http://localhost:${API_PORT:-8080}/api/v2/docs"
echo "  健康检查: http://localhost:${API_PORT:-8080}/api/v2/health"
echo ""
echo "📋 管理命令:"
echo "  查看日志: docker-compose logs -f api"
echo "  重启服务: docker-compose restart"
echo "  停止服务: docker-compose down"
echo "  备份数据: docker-compose exec api python scripts/backup.sh"
echo ""
echo "📝 查看完整日志:"
echo "  docker-compose logs -f"
echo ""
echo "=========================================="
echo "启动完成时间: $(date)"
echo "=========================================="
