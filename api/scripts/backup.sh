#!/bin/bash
# scripts/backup.sh

set -e

BACKUP_DIR="/backup/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "=========================================="
echo "开始备份NAS DDNS系统"
echo "备份时间: $(date)"
echo "备份目录: $BACKUP_DIR"
echo "=========================================="

# 1. 备份PostgreSQL数据库（如果可用）
if command -v pg_dump &> /dev/null; then
    echo "备份PostgreSQL数据库..."
    PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
        -h "${POSTGRES_HOST:-postgres}" \
        -U "${POSTGRES_USER:-nas_admin}" \
        -d "${POSTGRES_DB:-nas_ddns}" \
        -F c \
        -f "$BACKUP_DIR/database.dump"
    echo "数据库备份完成: $BACKUP_DIR/database.dump"
else
    echo "pg_dump 不可用，跳过数据库备份"
fi

# 2. 备份配置文件
echo "备份配置文件..."
tar -czf "$BACKUP_DIR/config.tar.gz" /app/config 2>/dev/null || echo "配置目录不存在或为空"
echo "配置文件备份完成"

# 3. 备份应用数据
echo "备份应用数据..."
tar -czf "$BACKUP_DIR/data.tar.gz" \
    --exclude="*.log" \
    --exclude="*.tmp" \
    /app/data 2>/dev/null || echo "数据目录不存在或为空"
echo "应用数据备份完成"

# 4. 创建备份清单
echo "创建备份清单..."
cat > "$BACKUP_DIR/backup.info" << EOF
备份时间: $(date)
备份目录: $BACKUP_DIR
备份内容:
  - PostgreSQL数据库: database.dump
  - 配置文件: config.tar.gz
  - 应用数据: data.tar.gz

文件统计:
$(du -sh "$BACKUP_DIR"/* 2>/dev/null)
EOF

# 5. 压缩整个备份
echo "压缩备份文件..."
cd "$BACKUP_DIR/.."
tar -czf "$(basename "$BACKUP_DIR").tar.gz" "$(basename "$BACKUP_DIR")"
rm -rf "$BACKUP_DIR"
echo "备份压缩完成: $(basename "$BACKUP_DIR").tar.gz"

# 6. 清理旧备份（保留最近7天）
echo "清理旧备份..."
find /backup -name "*.tar.gz" -mtime +7 -delete
echo "旧备份清理完成"

# 7. 发送备份通知（如果配置了 Telegram）
if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
    echo "发送备份通知..."
    BACKUP_SIZE=$(du -h "/backup/$(basename "$BACKUP_DIR").tar.gz" 2>/dev/null | cut -f1)

    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d chat_id="$TELEGRAM_CHAT_ID" \
        -d text="✅ NAS DDNS备份完成
时间: $(date)
大小: ${BACKUP_SIZE:-N/A}
位置: /backup/$(basename "$BACKUP_DIR").tar.gz
状态: 成功"
fi

echo "=========================================="
echo "备份完成"
echo "备份文件: /backup/$(basename "$BACKUP_DIR").tar.gz"
echo "=========================================="
