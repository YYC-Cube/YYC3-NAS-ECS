#!/bin/bash
# DDNS 更新脚本 - 支持 ddns.0379.email

source /opt/yyc3/config/env.sh

# 日志函数
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "${NAS_LOGS_DIR}/ddns.log"
    echo "$1"
}

# 状态文件
STATUS_FILE="${NAS_RUN_DIR}/ddns_status.json"

# 获取当前公网IP
get_current_ip() {
    local ip=""
    
    # 尝试多个IP查询服务
    local services=(
        "https://api.ipify.org"
        "https://icanhazip.com"
        "https://ifconfig.me/ip"
        "https://checkip.amazonaws.com"
    )
    
    for service in "${services[@]}"; do
        ip=$(curl -s --connect-timeout 5 "$service" 2>/dev/null | grep -oE '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}')
        if [[ -n "$ip" && "$ip" =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
            echo "$ip"
            return 0
        fi
    done
    
    log "ERROR: 无法获取公网IP"
    return 1
}

# 更新阿里云DNS记录
update_aliyun_dns() {
    local subdomain="$1"
    local ip="$2"
    
    if [[ -z "$ALIYUN_ACCESS_KEY_ID" || -z "$ALIYUN_ACCESS_KEY_SECRET" ]]; then
        log "WARNING: 阿里云配置未设置，跳过DNS更新"
        return 1
    fi
    
    # 获取RecordId
    local query_url="https://alidns.aliyuncs.com/?Action=DescribeSubDomainRecords"
    query_url+="&SubDomain=${subdomain}.${ALIYUN_DOMAIN}"
    query_url+="&Type=A"
    query_url+="&Format=JSON"
    query_url+="&Version=2015-01-09"
    
    local signature=$(generate_aliyun_signature "$query_url")
    query_url+="&Signature=${signature}"
    
    local response=$(curl -s "$query_url")
    local record_id=$(echo "$response" | grep -o '"RecordId":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [[ -z "$record_id" ]]; then
        log "ERROR: 未找到DNS记录"
        return 1
    fi
    
    # 更新记录
    local update_url="https://alidns.aliyuncs.com/?Action=UpdateDomainRecord"
    update_url+="&RecordId=${record_id}"
    update_url+="&RR=${subdomain}"
    update_url+="&Type=A"
    update_url+="&Value=${ip}"
    update_url+="&TTL=${ALIYUN_TTL}"
    update_url+="&Format=JSON"
    update_url+="&Version=2015-01-09"
    
    local signature=$(generate_aliyun_signature "$update_url")
    update_url+="&Signature=${signature}"
    
    local result=$(curl -s "$update_url")
    
    if echo "$result" | grep -q '"RecordId"'; then
        log "SUCCESS: 更新DNS记录成功 - ${subdomain}.${ALIYUN_DOMAIN} -> ${ip}"
        return 0
    else
        log "ERROR: 更新DNS记录失败: $result"
        return 1
    fi
}

# 生成阿里云签名
generate_aliyun_signature() {
    local url="$1"
    local params=$(echo "$url" | sed 's/.*?//' | tr '&' '\n' | sort | tr '\n' '&' | sed 's/&$//')
    local string_to_sign="GET&%2F&$(echo -n "$params" | sed 's/:/%3A/g' | sed 's/&/%26/g')"
    
    local key="$ALIYUN_ACCESS_KEY_SECRET&"
    local signature=$(echo -n "$string_to_sign" | openssl sha1 -hmac "$key" -binary | base64)
    
    echo "$signature" | sed 's/+/%2B/g' | sed 's/\//%2F/g' | sed 's/=/%3D/g'
}

# 更新状态文件
update_status() {
    local status_data="{ "last_update": "$(date '+%Y-%m-%d %H:%M:%S')", "current_ip": "$1", "success": $2, "domain": "ddns.0379.email", "subdomain": "ddns" }"
echo "$status_data" > "$STATUS_FILE"
chmod 644 "$STATUS_FILE"
}

主函数
main() { log "INFO: 开始DDNS更新检查"
# 获取当前IP
local current_ip=$(get_current_ip)
if [[ -z "$current_ip" ]]; then
    log "ERROR: 无法获取当前IP，退出"
    update_status "" "false"
    exit 1
fi

log "INFO: 当前公网IP: $current_ip"

# 检查是否需要更新
local last_ip=""
if [[ -f "$STATUS_FILE" ]]; then
    last_ip=$(grep -o '"current_ip":"[^"]*"' "$STATUS_FILE" | cut -d'"' -f4)
fi

if [[ "$current_ip" == "$last_ip" ]]; then
    log "INFO: IP未变化，无需更新"
    update_status "$current_ip" "true"
    exit 0
fi

log "INFO: IP发生变化，开始更新DNS记录"

# 更新阿里云DNS
if update_aliyun_dns "ddns" "$current_ip"; then
    log "SUCCESS: DDNS更新完成"
    update_status "$current_ip" "true"
    
    # 发送通知（如果配置了）
    if [[ "$NOTIFICATION_ENABLED" == "true" ]]; then
        send_notification "DDNS更新成功" "IP已更新为: $current_ip" "success"
    fi
else
    log "ERROR: DDNS更新失败"
    update_status "$current_ip" "false"
    
    if [[ "$NOTIFICATION_ENABLED" == "true" ]]; then
        send_notification "DDNS更新失败" "无法更新DNS记录" "error"
    fi
fi
}

发送通知
send_notification() { local title="$1" local message="$2" local level="$3"
# 这里可以添加邮件、Telegram等通知方式
# 示例：发送到系统日志
logger -t "yyc3-ddns" "[$level] $title: $message"
}

运行主函数
main "$@" 
