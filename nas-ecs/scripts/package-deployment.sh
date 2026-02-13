#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
PACKAGE_NAME="nas-ecs"
PACKAGE_VERSION=$(grep "APP_VERSION=" "$PROJECT_ROOT/../config/.env.production" 2>/dev/null || echo "1.0.0")
PACKAGE_FILE="${PROJECT_ROOT}/${PACKAGE_NAME}-${PACKAGE_VERSION}.tar.gz"

echo "======================================"
echo "YYC³ NAS-ECS 部署包打包脚本"
echo "======================================"
echo ""
echo "版本: $PACKAGE_VERSION"
echo "输出文件: $PACKAGE_FILE"
echo ""

echo "[1/6] 检查必要文件..."

REQUIRED_FILES=(
    "docker/docker-compose.yml"
    "docker/docker-compose.staging.yml"
    "docker/docker-compose.override.yml"
    "docker/docker-compose.ai.prod.yml"
    "docker/docker-compose.ai.dev.yml"
    "config/.env.production"
    "config/.env.staging"
    "config/.env.development"
    "config/.env.example"
    "config/.env.ports"
    "config/.env.services"
    "scripts/quick-start.sh"
    "scripts/quick-stop.sh"
    "scripts/quick-restart.sh"
    "scripts/health-check.sh"
    "scripts/stack-manager.sh"
    "scripts/start.sh"
    "scripts/init-system.sh"
    "docs/DEPLOYMENT.md"
    "README.md"
    "DEPLOYMENT-DELIVERY.md"
)

MISSING_FILES=()
for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$PROJECT_ROOT/$file" ]; then
        MISSING_FILES+=("$file")
        echo "  ❌ 缺失: $file"
    else
        echo "  ✅ 存在: $file"
    fi
done

if [ ${#MISSING_FILES[@]} -gt 0 ]; then
    echo ""
    echo "错误: 以下文件缺失，无法继续："
    printf '%s\n' "${MISSING_FILES[@]}"
    exit 1
fi

echo ""
echo "[2/6] 清理旧的打包文件..."
if [ -f "$PACKAGE_FILE" ]; then
    echo "  删除旧文件: $PACKAGE_FILE"
    rm -f "$PACKAGE_FILE"
fi

echo ""
echo "[3/6] 打包文件..."
echo "  包含目录:"
echo "    - docker/"
echo "    - config/"
echo "    - scripts/"
echo "    - docs/"
echo "    - README.md"

cd "$PROJECT_ROOT/.."
tar -czf "$PACKAGE_FILE" \
    --exclude="*.tar.gz" \
    --exclude=".DS_Store" \
    --exclude="Thumbs.db" \
    --exclude="*.log" \
    --exclude="node_modules" \
    --exclude=".git" \
    -C . \
    nas-ecs/

if [ $? -eq 0 ]; then
    echo ""
    echo "[4/6] 计算校验和..."
    PACKAGE_SIZE=$(du -h "$PACKAGE_FILE" | cut -f1)
    PACKAGE_SHA256=$(shasum -a 256 "$PACKAGE_FILE" | cut -d ' ' -f1)
    echo "  文件大小: $PACKAGE_SIZE"
    echo "  SHA256: $PACKAGE_SHA256"
else
    echo ""
    echo "错误: 打包失败"
    exit 1
fi

echo ""
echo "[5/6] 生成校验文件..."
CHECKSUM_FILE="${PROJECT_ROOT}/${PACKAGE_NAME}-${PACKAGE_VERSION}.checksum.txt"
cat > "$CHECKSUM_FILE" << EOF
YYC³ NAS-ECS 部署包校验信息
======================================

包名: ${PACKAGE_NAME}
版本: ${PACKAGE_VERSION}
文件: ${PACKAGE_NAME}-${PACKAGE_VERSION}.tar.gz
大小: ${PACKAGE_SIZE}
SHA256: ${PACKAGE_SHA256}
打包时间: $(date '+%Y-%m-%d %H:%M:%S')

文件列表:
$(tar -tzf "$PACKAGE_FILE" --list)
EOF

echo "  ✅ 校验文件: $CHECKSUM_FILE"

echo ""
echo "[6/6] 完成！"
echo "======================================"
echo ""
echo "打包成功！"
echo ""
echo "生成文件:"
echo "  📦 部署包: $PACKAGE_FILE"
echo "  📄 校验文件: $CHECKSUM_FILE"
echo ""
echo "下一步:"
echo "  1. 验证校验文件内容"
echo "  2. 部署到目标服务器"
echo "  3. 参考 docs/DEPLOYMENT.md 进行部署"
echo ""
echo "快速上传命令示例:"
echo "  scp $PACKAGE_FILE user@server:/path/to/deploy/"
echo "  rsync -avz $PACKAGE_FILE user@server:/path/to/deploy/"
echo ""
