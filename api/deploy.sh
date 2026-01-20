#!/bin/bash
# deploy.sh - NAS DDNS系统部署脚本

set -e

echo "=========================================="
echo "NAS DDNS系统部署"
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

# 创建目录结构
echo "📁 创建目录结构..."
mkdir -p \
    data/postgres \
    data/redis \
    data/prometheus \
    data/grafana \
    data/elasticsearch \
    data/pgadmin \
    data/certbot/www \
    data/certbot/conf \
    logs \
    backup \
    config \
    scripts \
    reports \
    docker/nginx/conf.d \
    docker/prometheus \
    docker/grafana/dashboards \
    docker/grafana/datasources \
    docker/logstash \
    docker/backup \
    docker/postgres

# 复制配置文件
if [ ! -f .env ]; then
    echo "⚠️  创建环境变量文件..."
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ 已创建 .env 文件"
        echo "📝 请编辑 .env 文件并设置必要的配置"
        echo "   nano .env"
        echo ""
        echo "⚠️  配置完成后，再次运行 ./deploy.sh"
        exit 0
    else
        echo "❌ 错误: .env.example 文件不存在"
        exit 1
    fi
fi

# 加载环境变量
source .env 2>/dev/null || true

# 构建镜像
echo "🔨 构建 Docker 镜像..."
docker-compose build --parallel

# 启动服务
echo "🚀 启动服务..."
docker-compose up -d

# 等待服务就绪
echo "⏳ 等待服务就绪..."
sleep 30

# 检查服务状态
echo "📊 检查服务状态..."
docker-compose ps

# 初始化数据库
echo "🔧 初始化数据库..."
docker-compose exec -T api flask db upgrade 2>/dev/null || echo "数据库初始化跳过或失败"

# 创建管理员用户（开发环境）
if [ "$ENVIRONMENT" = "development" ]; then
    echo "👤 创建管理员用户..."
    docker-compose exec -T api flask create-admin 2>/dev/null || echo "管理员创建跳过或已存在"
fi

# 健康检查
echo "🏥 运行健康检查..."
HEALTH_CHECK_URL="http://localhost:${API_PORT:-8080}/api/v2/health"

for i in {1..10}; do
    if curl -f -s "$HEALTH_CHECK_URL" > /dev/null 2>&1; then
        echo "✅ 系统健康检查通过"
        break
    else
        echo "⏳ 等待系统就绪 ($i/10)..."
        sleep 10
    fi

    if [ $i -eq 10 ]; then
        echo "❌ 系统健康检查失败"
        echo "📝 查看日志: docker-compose logs api"
        exit 1
    fi
done

echo ""
echo "=========================================="
echo "🎉 部署完成"
echo "=========================================="
echo ""
echo "📌 访问地址:"
echo "  Web界面: http://localhost:${API_PORT:-8080}/"
echo "  API文档: http://localhost:${API_PORT:-8080}/api/v2/docs"
echo "  Grafana: http://localhost:${GRAFANA_PORT:-3000}"
echo "  Prometheus: http://localhost:${PROMETHEUS_PORT:-9090}"
echo ""
echo "📋 管理命令:"
echo "  查看日志: docker-compose logs -f"
echo "  重启服务: docker-compose restart"
echo "  停止服务: docker-compose down"
echo "  备份数据: docker-compose exec api python scripts/backup.sh"
echo ""
echo "📊 监控地址:"
echo "  Prometheus: http://localhost:${PROMETHEUS_PORT:-9090}"
echo "  Grafana: http://localhost:${GRAFANA_PORT:-3000} (admin/${GRAFANA_ADMIN_PASSWORD:-admin})"
echo ""
echo "📝 后续步骤:"
echo "  1. 访问 Web 界面完成初始配置"
echo "  2. 配置域名解析（如果未自动配置）"
echo "  3. 设置监控告警"
echo "  4. 配置定期备份"
echo ""
echo "⚠️  重要提示:"
echo "  - 请立即修改默认密码"
echo "  - 定期检查备份是否正常"
echo "  - 监控系统资源使用情况"
echo ""
echo "=========================================="
echo "部署完成时间: $(date)"
echo "=========================================="
