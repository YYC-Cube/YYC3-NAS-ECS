#!/bin/bash

# 阿里云DDNS脚本 - 用于云服务器
# 更新 nas.0379.email 指向云服务器公网IP

# 配置信息
ACCESS_KEY_ID="您的AccessKey ID"
ACCESS_KEY_SECRET="您的AccessKey Secret"
DOMAIN="0379.email"
SUBDOMAIN="nas"
RECORD_TYPE="A"
TTL="300"  # 5分钟

# 日志
LOG_DIR="/opt/yyc3/logs/ddns"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/ddns-$(date +%Y%m%d).log"

# 函数：记录日志
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# 函数：获取云服务器公网IP
get_public_ip() {
    # 方法1: 查询弹性公网IP（如果是阿里云ECS）
    local eip=$(curl -s http://100.100.100.200/latest/meta-data/eipv4 2>/dev/null)
    
    # 方法2: 查询网卡公网IP
    if [ -z "$eip" ]; then
        eip=$(curl -s --connect-timeout 5 http://ifconfig.me 2>/dev/null)
    fi
    
    # 方法3: 如果还是获取不到，使用配置的固定IP
    if [ -z "$eip" ] || [[ ! "$eip" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        eip="8.152.195.33"  # 您的云服务器固定IP
    fi
    
    echo "$eip"
}

# 函数：URL编码
urlencode() {
    echo -n "$1" | xxd -plain | tr -d '\n' | sed 's/\(..\)/%\1/g'
}

# 函数：阿里云API请求
aliyun_api() {
    local action="$1"
    local params="$2"
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local nonce=$(date +%s%N)
    
    # 基础参数
    local base_params="Format=JSON"
    base_params+="&Version=2015-01-09"
    base_params+="&AccessKeyId=$ACCESS_KEY_ID"
    base_params+="&SignatureMethod=HMAC-SHA1"
    base_params+="&Timestamp=$(urlencode "$timestamp")"
    base_params+="&SignatureVersion=1.0"
    base_params+="&SignatureNonce=$nonce"
    base_params+="&Action=$action"
    
    # 合并参数
    local all_params="$base_params&$params"
    
    # 排序
    local sorted_params=$(echo "$all_params" | tr '&' '\n' | sort | tr '\n' '&' | sed 's/&$//')
    
    # 生成签名
    local string_to_sign="GET&%2F&$(urlencode "$sorted_params")"
    local key="$ACCESS_KEY_SECRET&"
    local signature=$(echo -n "$string_to_sign" | openssl dgst -sha1 -hmac "$key" -binary | openssl base64)
    
    # 发送请求
    local url="https://alidns.aliyuncs.com/?$sorted_params&Signature=$(urlencode "$signature")"
    curl -s "$url"
}

# 主函数
main() {
    log "开始DDNS更新检查..."
    
    # 获取当前公网IP
    CURRENT_IP=$(get_public_ip)
    log "云服务器公网IP: $CURRENT_IP"
    
    # 获取域名记录ID
    log "查询域名记录..."
    local response=$(aliyun_api "DescribeDomainRecords" "DomainName=$DOMAIN&RRKeyWord=$SUBDOMAIN&Type=$RECORD_TYPE")
    
    local record_id=$(echo "$response" | grep -o '"RecordId":"[^"]*"' | head -1 | cut -d'"' -f4)
    local current_dns_ip=$(echo "$response" | grep -o '"Value":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    log "当前DNS解析IP: $current_dns_ip"
    log "RecordId: $record_id"
    
    # 检查是否需要更新
    if [ "$CURRENT_IP" = "$current_dns_ip" ]; then
        log "IP未变化，无需更新"
        return 0
    fi
    
    log "IP发生变化，开始更新..."
    
    if [ -n "$record_id" ]; then
        # 更新现有记录
        response=$(aliyun_api "UpdateDomainRecord" "RecordId=$record_id&RR=$SUBDOMAIN&Type=$RECORD_TYPE&Value=$CURRENT_IP&TTL=$TTL")
        if echo "$response" | grep -q '"RecordId"'; then
            log "✅ DNS记录更新成功: $SUBDOMAIN.$DOMAIN -> $CURRENT_IP"
        else
            log "❌ DNS记录更新失败: $response"
        fi
    else
        # 添加新记录
        response=$(aliyun_api "AddDomainRecord" "DomainName=$DOMAIN&RR=$SUBDOMAIN&Type=$RECORD_TYPE&Value=$CURRENT_IP&TTL=$TTL")
        if echo "$response" | grep -q '"RecordId"'; then
            log "✅ DNS记录创建成功: $SUBDOMAIN.$DOMAIN -> $CURRENT_IP"
        else
            log "❌ DNS记录创建失败: $response"
        fi
    fi
    
    log "DDNS更新完成"
}

# 执行
main
