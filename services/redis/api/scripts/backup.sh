#!/bin/bash

# 📦 自动备份 YYC3_API 数据库
# 🕒 每日执行，保留最近 7 天

DB_NAME="YYC3_API"
DB_USER="yyc3_api"
DB_PASS="yyc3_api_email"
BACKUP_DIR="./backups"
DATE=$(date +%F)
FILE="$BACKUP_DIR/${DB_NAME}_$DATE.sql"

mkdir -p $BACKUP_DIR

# 导出 SQL
mysqldump -u$DB_USER -p$DB_PASS $DB_NAME > $FILE

# 清理 7 天前的备份
find $BACKUP_DIR -type f -name "${DB_NAME}_*.sql" -mtime +7 -exec rm {} \;

echo "✅ [$DATE] 备份完成：$FILE"
