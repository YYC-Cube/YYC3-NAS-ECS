#!/bin/bash

# 加载全局配置
source /opt/yyc3/config/env.sh

# 设置日志文件
LOG_FILE="${NAS_LOGS_DIR}/ddns-$(date +%Y%m%d).log"
exec >> "$LOG_FILE" 2>&1

# 函数：记录日志
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# 函数：获取当前公网IP
get_current_ip() {
    local ip
    ip=$(curl -s --connect-timeout 10 http://checkip.amazonaws.com || \
         curl -s --connect-timeout 10 http://ipinfo.io/ip || \
         curl -s --connect-timeout 10 http://ifconfig.me)
    echo "$ip"
}

# 函数：获取阿里云解析记录
get_aliyun_record() {
    local sub_domain="$1"
    local domain="$2"
    
    aliyun alidns DescribeDomainRecords \
        --DomainName "$domain" \
        --RRKeyWord "$sub_domain" \
        --Type "A" \
        --output cols=RecordId,Value,RR,Type,Status,Locked rows="$sub_domain.$domain"
}

# 函数：更新阿里云解析记录
update_aliyun_record() {
    local record_id="$1"
    local ip="$2"
    local rr="$3"
    local domain="$4"
    
    aliyun alidns UpdateDomainRecord \
        --RecordId "$record_id" \
        --RR "$rr" \
        --Type "A" \
        --Value "$ip" \
        --TTL "$ALIYUN_TTL"
}

# 函数：添加阿里云解析记录
add_aliyun_record() {
    local ip="$1"
    local rr="$2"
    local domain="$3"
    
    aliyun alidns AddDomainRecord \
        --DomainName "$domain" \
        --RR "$rr" \
        --Type "A" \
        --Value "$ip" \
        --TTL "$ALIYUN_TTL"
}

# 主函数
main() {
    log "开始DDNS检查..."
    
    # 检查阿里云CLI
    if ! command -v aliyun &> /dev/null; then
        log "错误：阿里云CLI未安装"
        exit 1
    fi
    
    # 检查配置
    if [ -z "$ALIYUN_ACCESS_KEY_ID" ] || [ -z "$ALIYUN_ACCESS_KEY_SECRET" ]; then
        log "错误：阿里云AccessKey未配置"
        exit 1
    fi
    
    # 获取当前IP
    CURRENT_IP=$(get_current_ip)
    if [ -z "$CURRENT_IP" ]; then
        log "错误：无法获取当前公网IP"
        exit 1
    fi
    
    log "当前公网IP: $CURRENT_IP"
    log "目标域名: ${ALIYUN_SUB_DOMAIN}.${ALIYUN_DOMAIN}"
    
    # 获取解析记录
    RECORD_INFO=$(get_aliyun_record "$ALIYUN_SUB_DOMAIN" "$ALIYUN_DOMAIN")
    
    if [ -n "$RECORD_INFO" ]; then
        # 解析记录存在
        RECORD_ID=$(echo "$RECORD_INFO" | awk '{print $1}')
        RECORD_IP=$(echo "$RECORD_INFO" | awk '{print $2}')
        
        log "现有解析记录: $RECORD_IP (RecordId: $RECORD_ID)"
        
        if [ "$RECORD_IP" = "$CURRENT_IP" ]; then
            log "IP未变化，无需更新"
        else
            log "IP发生变化，更新解析记录..."
            update_aliyun_record "$RECORD_ID" "$CURRENT_IP" "$ALIYUN_SUB_DOMAIN" "$ALIYUN_DOMAIN"
            if [ $? -eq 0 ]; then
                log "解析记录更新成功: $CURRENT_IP"
            else
                log "错误：解析记录更新失败"
            fi
        fi
    else
        # 解析记录不存在，创建新记录
        log "解析记录不存在，创建新记录..."
        add_aliyun_record "$CURRENT_IP" "$ALIYUN_SUB_DOMAIN" "$ALIYUN_DOMAIN"
        if [ $? -eq 0 ]; then
            log "解析记录创建成功: $CURRENT_IP"
        else
            log "错误：解析记录创建失败"
        fi
    fi
    
    log "DDNS检查完成"
}

# 运行主函数
main
