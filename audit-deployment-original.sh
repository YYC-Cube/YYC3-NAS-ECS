# YYC³ NAS-ECS ECS服务器部署现状审查脚本

```bash
#!/bin/bash
# ============================================
# YYC³ NAS-ECS ECS服务器部署现状审查脚本
# 版本: 1.0.0
# 创建日期: 2026-02-04
# 作者: YYC³ Team
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 报告文件
REPORT_DIR="/opt/nas-ecs/reports"
REPORT_FILE="${REPORT_DIR}/deployment-audit-$(date +%Y%m%d_%H%M%S).md"
LOG_FILE="${REPORT_DIR}/audit-log-$(date +%Y%m%d_%H%M%S).log"

# 创建报告目录
mkdir -p "$REPORT_DIR"

# 日志函数
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_success() {
    log "${GREEN}✓ $1${NC}"
}

log_warning() {
    log "${YELLOW}⚠ $1${NC}"
}

log_error() {
    log "${RED}✗ $1${NC}"
}

log_info() {
    log "${BLUE}ℹ $1${NC}"
}

# 开始报告
echo "# YYC³ NAS-ECS ECS服务器部署现状审查报告" > "$REPORT_FILE"
echo "**生成时间**: $(date '+%Y-%m-%d %H:%M:%S')" >> "$REPORT_FILE"
echo "**服务器IP**: 8.152.195.33" >> "$REPORT_FILE"
echo "**审查脚本版本**: 1.0.0" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

echo "## 📋 执行摘要" >> "$REPORT_FILE"

# 初始化计数器
total_checks=0
passed_checks=0
warning_checks=0
failed_checks=0

# 检查函数
check_service() {
    local service_name=$1
    local check_cmd=$2
    local description=$3
    
    total_checks=$((total_checks + 1))
    
    if eval "$check_cmd" > /dev/null 2>&1; then
        echo "✅ **$service_name**: $description" >> "$REPORT_FILE"
        log_success "$service_name 检查通过"
        passed_checks=$((passed_checks + 1))
        return 0
    else
        echo "❌ **$service_name**: $description" >> "$REPORT_FILE"
        log_error "$service_name 检查失败"
        failed_checks=$((failed_checks + 1))
        return 1
    fi
}

check_service_warning() {
    local service_name=$1
    local check_cmd=$2
    local description=$3
    
    total_checks=$((total_checks + 1))
    
    if eval "$check_cmd" > /dev/null 2>&1; then
        echo "✅ **$service_name**: $description" >> "$REPORT_FILE"
        log_success "$service_name 检查通过"
        passed_checks=$((passed_checks + 1))
        return 0
    else
        echo "⚠️ **$service_name**: $description" >> "$REPORT_FILE"
        log_warning "$service_name 检查警告"
        warning_checks=$((warning_checks + 1))
        return 1
    fi
}

# 获取系统信息
log_info "开始ECS服务器部署现状审查..."
log_info "生成报告文件: $REPORT_FILE"

echo "## 🖥️ 系统信息" >> "$REPORT_FILE"
echo "```bash" >> "$REPORT_FILE"
uname -a >> "$REPORT_FILE" 2>/dev/null || echo "无法获取系统信息" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "内存使用:" >> "$REPORT_FILE"
free -h >> "$REPORT_FILE" 2>/dev/null || echo "无法获取内存信息" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "磁盘使用:" >> "$REPORT_FILE"
df -h >> "$REPORT_FILE" 2>/dev/null || echo "无法获取磁盘信息" >> "$REPORT_FILE"
echo "```" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# ============================================
# 第一阶段：基础环境检查
# ============================================
echo "## 🔧 第一阶段：基础环境检查" >> "$REPORT_FILE"

# 1.1 检查Docker
check_service "Docker服务" "systemctl is-active --quiet docker" "Docker服务运行状态"
check_service "Docker版本" "docker --version" "Docker版本检查"

# 1.2 检查Docker Compose
check_service "Docker Compose" "docker-compose --version" "Docker Compose版本检查"

# 1.3 检查Node.js
check_service "Node.js" "node --version" "Node.js版本检查"

# 1.4 检查Nginx
check_service "Nginx服务" "systemctl is-active --quiet nginx" "Nginx服务运行状态"

# 1.5 检查Python
check_service "Python 3" "python3 --version" "Python 3版本检查"

# 1.6 检查防火墙
check_service "UFW防火墙" "ufw status | grep -q 'Status: active'" "防火墙状态检查"

echo "" >> "$REPORT_FILE"

# ============================================
# 第二阶段：FRP服务器检查
# ============================================
echo "## 🔌 第二阶段：FRP服务器检查" >> "$REPORT_FILE"

# 2.1 检查FRP服务器服务
check_service "FRP服务器服务" "systemctl is-active --quiet frps" "FRP服务器运行状态"

# 2.2 检查FRP端口
check_service "FRP服务端口(7001)" "netstat -tln | grep -q ':7001'" "FRP服务端口监听"
check_service "FRP管理端口(7500)" "netstat -tln | grep -q ':7500'" "FRP管理端口监听"
check_service "HTTP代理端口(18080)" "netstat -tln | grep -q ':18080'" "HTTP代理端口监听"
check_service_warning "HTTPS代理端口(4443)" "netstat -tln | grep -q ':4443'" "HTTPS代理端口监听"

# 2.3 检查FRP配置文件
check_service "FRP配置文件" "test -f /etc/frp/frps.toml" "FRP配置文件存在"
if [ -f /etc/frp/frps.toml ]; then
    echo "**FRP配置摘要**: " >> "$REPORT_FILE"
    echo '```toml' >> "$REPORT_FILE"
    grep -E "(bindPort|auth.token|webServer|subDomainHost)" /etc/frp/frps.toml | head -10 >> "$REPORT_FILE" 2>/dev/null || echo "无法读取配置文件" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
fi

# 2.4 检查FRP日志
check_service_warning "FRP日志文件" "test -f /root/frps/frps.log" "FRP日志文件存在"

echo "" >> "$REPORT_FILE"

# ============================================
# 第三阶段：SSL证书检查
# ============================================
echo "## 🔐 第三阶段：SSL证书检查" >> "$REPORT_FILE"

# 3.1 检查Let's Encrypt证书
check_service "Let's Encrypt证书" "test -d /etc/letsencrypt/live/0379.email" "SSL证书目录存在"

if [ -d /etc/letsencrypt/live/0379.email ]; then
    # 3.2 检查证书文件
    check_service "证书文件(fullchain.pem)" "test -f /etc/letsencrypt/live/0379.email/fullchain.pem" "完整证书链文件"
    check_service "私钥文件(privkey.pem)" "test -f /etc/letsencrypt/live/0379.email/privkey.pem" "私钥文件"
    
    # 3.3 检查证书有效期
    if [ -f /etc/letsencrypt/live/0379.email/fullchain.pem ]; then
        cert_expiry=$(openssl x509 -in /etc/letsencrypt/live/0379.email/fullchain.pem -noout -enddate 2>/dev/null | cut -d= -f2)
        if [ ! -z "$cert_expiry" ]; then
            echo "**证书过期时间**: $cert_expiry" >> "$REPORT_FILE"
            
            # 计算剩余天数
            expiry_seconds=$(date -d "$cert_expiry" +%s)
            current_seconds=$(date +%s)
            days_left=$(( (expiry_seconds - current_seconds) / 86400 ))
            
            if [ $days_left -gt 30 ]; then
                echo "✅ **证书有效期**: 剩余 ${days_left} 天" >> "$REPORT_FILE"
                log_success "证书有效期充足"
            elif [ $days_left -gt 7 ]; then
                echo "⚠️ **证书有效期**: 剩余 ${days_left} 天" >> "$REPORT_FILE"
                log_warning "证书即将过期"
            else
                echo "❌ **证书有效期**: 剩余 ${days_left} 天" >> "$REPORT_FILE"
                log_error "证书即将过期，需要立即续期"
            fi
        fi
    fi
fi

echo "" >> "$REPORT_FILE"

# ============================================
# 第四阶段：核心服务检查
# ============================================
echo "## 🚀 第四阶段：核心服务检查" >> "$REPORT_FILE"

# 4.1 检查Docker容器状态
check_service "Docker容器运行" "docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -q 'nas-ddns'" "Docker容器运行状态"

if command -v docker-compose >/dev/null 2>&1 && [ -f "/opt/nas-ecs/api/docker-compose.yml" ]; then
    echo "**Docker容器状态**: " >> "$REPORT_FILE"
    echo '```bash' >> "$REPORT_FILE"
    cd /opt/nas-ecs/api && docker-compose ps 2>/dev/null | tail -n +3 >> "$REPORT_FILE" || echo "无法获取容器状态" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
fi

# 4.2 检查服务端口
echo "**服务端口监听状态**: " >> "$REPORT_FILE"
echo '```bash' >> "$REPORT_FILE"

ports_to_check=(
    "6000:API服务"
    "6001:管理服务"
    "6002:LLM服务"
    "6003:邮件服务"
    "6009:NAS服务"
    "6006:监控服务"
    "6007:DDNS服务"
    "5173:前端服务"
    "5432:PostgreSQL"
    "6379:Redis"
    "9090:Prometheus"
    "3000:Grafana"
)

for port_info in "${ports_to_check[@]}"; do
    port=$(echo "$port_info" | cut -d: -f1)
    service=$(echo "$port_info" | cut -d: -f2)
    
    if netstat -tln 2>/dev/null | grep -q ":$port "; then
        echo "✅ 端口 $port ($service): 监听中" >> "$REPORT_FILE"
    else
        echo "❌ 端口 $port ($service): 未监听" >> "$REPORT_FILE"
    fi
done
echo '```' >> "$REPORT_FILE"

# 4.3 检查Nginx配置
check_service "Nginx配置语法" "nginx -t 2>/dev/null" "Nginx配置语法检查"

if [ -f /etc/nginx/sites-available/yyc3-nas-ecs ]; then
    echo "**Nginx站点配置**: 已配置" >> "$REPORT_FILE"
    echo '```nginx' >> "$REPORT_FILE"
    grep -E "(server_name|listen|proxy_pass)" /etc/nginx/sites-available/yyc3-nas-ecs | head -20 >> "$REPORT_FILE" 2>/dev/null || echo "无法读取Nginx配置" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
else
    echo "❌ **Nginx站点配置**: 未找到配置文件" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# ============================================
# 第五阶段：项目文件检查
# ============================================
echo "## 📁 第五阶段：项目文件检查" >> "$REPORT_FILE"

# 5.1 检查项目目录
check_service "项目根目录" "test -d /opt/nas-ecs" "项目根目录存在"
check_service "API目录" "test -d /opt/nas-ecs/api" "API服务目录存在"
check_service "脚本目录" "test -d /opt/nas-ecs/scripts/services" "脚本目录存在"

# 5.2 检查关键文件
key_files=(
    "/opt/nas-ecs/.env:环境变量文件"
    "/opt/nas-ecs/api/docker-compose.yml:Docker Compose配置"
    "/opt/nas-ecs/package.json:前端依赖配置"
    "/opt/nas-ecs/scripts/services/start.sh:启动脚本"
    "/opt/nas-ecs/scripts/services/backup.sh:备份脚本"
)

echo "**关键文件检查**: " >> "$REPORT_FILE"
for file_info in "${key_files[@]}"; do
    file=$(echo "$file_info" | cut -d: -f1)
    description=$(echo "$file_info" | cut -d: -f2)
    
    if [ -f "$file" ]; then
        echo "✅ $description: 存在" >> "$REPORT_FILE"
    else
        echo "❌ $description: 缺失" >> "$REPORT_FILE"
    fi
done

# 5.3 检查环境变量
if [ -f "/opt/nas-ecs/.env" ]; then
    echo "" >> "$REPORT_FILE"
    echo "**环境变量关键配置**: " >> "$REPORT_FILE"
    echo '```bash' >> "$REPORT_FILE"
    grep -E "(NODE_ENV|API_SERVICE_PORT|BASE_DOMAIN|ALIYUN_ACCESS_KEY|DATABASE_URL)" /opt/nas-ecs/.env | head -10 >> "$REPORT_FILE" 2>/dev/null || echo "无法读取环境变量" >> "$REPORT_FILE"
    echo '```' >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"

# ============================================
# 第六阶段：服务连通性测试
# ============================================
echo "## 🌐 第六阶段：服务连通性测试" >> "$REPORT_FILE"

# 6.1 本地服务测试
echo "**本地服务测试**: " >> "$REPORT_FILE"
echo '```bash' >> "$REPORT_FILE"

local_tests=(
    "curl -f http://localhost:6000/api/v2/health 2>/dev/null:API服务健康检查"
    "curl -f http://localhost:5173 2>/dev/null:前端服务访问"
    "curl -f http://localhost:6007/api/v2/ddns/status 2>/dev/null:DDNS服务状态"
    "docker exec nas-ddns-postgres pg_isready -U yyc3_nas_user 2>/dev/null:PostgreSQL连接"
    "docker exec nas-ddns-redis redis-cli ping 2>/dev/null:Redis连接"
)

for test_info in "${local_tests[@]}"; do
    cmd=$(echo "$test_info" | cut -d: -f1)
    description=$(echo "$test_info" | cut -d: -f2)
    
    if eval "$cmd" > /dev/null 2>&1; then
        echo "✅ $description: 通过" >> "$REPORT_FILE"
    else
        echo "❌ $description: 失败" >> "$REPORT_FILE"
    fi
done
echo '```' >> "$REPORT_FILE"

# 6.2 公网服务测试（模拟）
echo "" >> "$REPORT_FILE"
echo "**公网服务测试（需要DNS解析）**: " >> "$REPORT_FILE"
echo '```bash' >> "$REPORT_FILE"
echo "注意：以下测试需要域名解析到当前服务器IP" >> "$REPORT_FILE"
echo "当前服务器IP: 8.152.195.33" >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"

# ============================================
# 第七阶段：安全配置检查
# ============================================
echo "## 🔒 第七阶段：安全配置检查" >> "$REPORT_FILE"

# 7.1 检查防火墙规则
echo "**防火墙规则**: " >> "$REPORT_FILE"
echo '```bash' >> "$REPORT_FILE"
ufw status numbered 2>/dev/null | grep -E "(7001|7500|80|443|6000-6009)" >> "$REPORT_FILE" || echo "无法获取防火墙规则" >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"

# 7.2 检查文件权限
echo "**关键文件权限**: " >> "$REPORT_FILE"
echo '```bash' >> "$REPORT_FILE"
ls -la /opt/nas-ecs/.env 2>/dev/null | awk '{print "环境变量文件:", $1, $3, $4}' >> "$REPORT_FILE"
ls -la /etc/frp/frps.toml 2>/dev/null | awk '{print "FRP服务器配置:", $1, $3, $4}' >> "$REPORT_FILE"
ls -la /etc/letsencrypt/live/0379.email/privkey.pem 2>/dev/null | awk '{print "SSL私钥:", $1, $3, $4}' >> "$REPORT_FILE" echo '```' >> "$REPORT_FILE"
7.3 检查SSH配置
check_service_warning "SSH密码登录" "grep -q '^PasswordAuthentication no' /etc/ssh/sshd_config" "SSH密码登录已禁用" check_service_warning "SSH Root登录" "grep -q '^PermitRootLogin prohibit-password' /etc/ssh/sshd_config" "SSH Root登录限制"

echo "" >> "$REPORT_FILE"

============================================
第八阶段：监控和日志检查
============================================
echo "## 📊 第八阶段：监控和日志检查" >> "$REPORT_FILE"

8.1 检查监控服务
check_service "Prometheus服务" "docker ps --format '{{.Names}}' | grep -q prometheus" "Prometheus监控服务" check_service "Grafana服务" "docker ps --format '{{.Names}}' | grep -q grafana" "Grafana可视化服务" check_service "Node Exporter" "docker ps --format '{{.Names}}' | grep -q node-exporter" "系统指标采集器"

8.2 检查日志文件
echo "日志文件状态: " >> "$REPORT_FILE" echo '```bash' >> "$REPORT_FILE"

log_files=( "/var/log/nginx/access.log:Nginx访问日志" "/var/log/nginx/error.log:Nginx错误日志" "/root/frps/frps.log:FRP服务器日志" "/opt/nas-ecs/logs/ddns.log:DDNS服务日志" "/opt/nas-ecs/logs/api.log:API服务日志" )

for log_info in "${log_files[@]}"; do file=$(echo "$log_info" | cut -d: -f1) description=$(echo "$log_info" | cut -d: -f2)

if [ -f "$file" ]; then
    size=$(du -h "$file" 2>/dev/null | cut -f1)
    if [ -z "$size" ]; then
        size="未知"
    fi
    echo "✅ $description: 存在 ($size)" >> "$REPORT_FILE"
else
    echo "⚠️ $description: 不存在" >> "$REPORT_FILE"
fi
done echo '```' >> "$REPORT_FILE"

8.3 检查日志轮转
check_service_warning "日志轮转配置" "test -f /etc/logrotate.d/yyc3-nas-ecs" "自定义日志轮转配置"

echo "" >> "$REPORT_FILE"

============================================
第九阶段：备份和恢复检查
============================================
echo "## 💾 第九阶段：备份和恢复检查" >> "$REPORT_FILE"

9.1 检查备份脚本
check_service "备份脚本" "test -f /opt/nas-ecs/scripts/services/backup.sh" "备份脚本存在" check_service "恢复脚本" "test -f /opt/nas-ecs/scripts/services/backup-restore.sh" "恢复脚本存在"

9.2 检查备份目录
check_service "备份目录" "test -d /opt/nas-ecs/backup" "备份目录存在"

if [ -d "/opt/nas-ecs/backup" ]; then echo "备份文件统计: " >> "$REPORT_FILE" echo '```bash' >> "$REPORT_FILE" backup_count=$(find /opt/nas-ecs/backup -type f -name "*.tar.gz" 2>/dev/null | wc -l) echo "备份文件数量: $backup_count" >> "$REPORT_FILE"

if [ $backup_count -gt 0 ]; then
    latest_backup=$(find /opt/nas-ecs/backup -type f -name "*.tar.gz" -printf "%T@ %p\n" 2>/dev/null | sort -n | tail -1 | cut -d' ' -f2-)
    if [ ! -z "$latest_backup" ]; then
        backup_size=$(du -h "$latest_backup" 2>/dev/null | cut -f1)
        backup_date=$(stat -c %y "$latest_backup" 2>/dev/null | cut -d' ' -f1)
        echo "最新备份: $(basename "$latest_backup")" >> "$REPORT_FILE"
        echo "备份大小: $backup_size" >> "$REPORT_FILE"
        echo "备份日期: $backup_date" >> "$REPORT_FILE"
    fi
fi
echo '```' >> "$REPORT_FILE"
fi

9.3 检查定时任务
check_service "备份定时任务" "crontab -l 2>/dev/null | grep -q backup.sh" "备份定时任务配置"

echo "" >> "$REPORT_FILE"

============================================
第十阶段：性能检查
============================================
echo "## ⚡ 第十阶段：性能检查" >> "$REPORT_FILE"

echo "系统资源使用: " >> "$REPORT_FILE" echo '```bash' >> "$REPORT_FILE"

CPU使用率
cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1) if [ ! -z "$cpu_usage" ]; then if (( $(echo "$cpu_usage < 80" | bc -l) )); then echo "✅ CPU使用率: ${cpu_usage}%" >> "$REPORT_FILE" elif (( $(echo "$cpu_usage < 90" | bc -l) )); then echo "⚠️ CPU使用率: ${cpu_usage}%" >> "$REPORT_FILE" else echo "❌ CPU使用率: ${cpu_usage}%" >> "$REPORT_FILE" fi fi

内存使用率
mem_total=$(free -m | awk '/Mem:/ {print $2}') mem_used=$(free -m | awk '/Mem:/ {print $3}') if [ ! -z "$mem_total" ] && [ ! -z "$mem_used" ]; then mem_percent=$((mem_used * 100 / mem_total)) if [ $mem_percent -lt 80 ]; then echo "✅ 内存使用率: ${mem_percent}% (${mem_used}M/${mem_total}M)" >> "$REPORT_FILE" elif [ $mem_percent -lt 90 ]; then echo "⚠️ 内存使用率: ${mem_percent}% (${mem_used}M/${mem_total}M)" >> "$REPORT_FILE" else echo "❌ 内存使用率: ${mem_percent}% (${mem_used}M/${mem_total}M)" >> "$REPORT_FILE" fi fi

磁盘使用率
disk_usage=$(df -h / | awk 'NR==2 {print $5}' | cut -d'%' -f1) if [ ! -z "$disk_usage" ]; then if [ $disk_usage -lt 80 ]; then echo "✅ 根分区使用率: ${disk_usage}%" >> "$REPORT_FILE" elif [ $disk_usage -lt 90 ]; then echo "⚠️ 根分区使用率: ${disk_usage}%" >> "$REPORT_FILE" else echo "❌ 根分区使用率: ${disk_usage}%" >> "$REPORT_FILE" fi fi

Docker容器数量
container_count=$(docker ps -q 2>/dev/null | wc -l) if [ ! -z "$container_count" ]; then echo "📦 运行中的Docker容器: $container_count" >> "$REPORT_FILE" fi

echo '```' >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"

============================================
第十一阶段：部署状态评估
============================================
echo "## 📈 第十一阶段：部署状态评估" >> "$REPORT_FILE"

计算总体评分
if [ $total_checks -gt 0 ]; then success_rate=$((passed_checks * 100 / total_checks))

echo "**检查统计**: " >> "$REPORT_FILE"
echo "- 总检查项: $total_checks" >> "$REPORT_FILE"
echo "- 通过项: $passed_checks" >> "$REPORT_FILE"
echo "- 警告项: $warning_checks" >> "$REPORT_FILE"
echo "- 失败项: $failed_checks" >> "$REPORT_FILE"
echo "- 总体成功率: ${success_rate}%" >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"
echo "**部署状态**: " >> "$REPORT_FILE"

if [ $success_rate -ge 90 ]; then
    echo "✅ **优秀** - 部署状态良好，生产就绪" >> "$REPORT_FILE"
    log_success "部署状态评估：优秀"
elif [ $success_rate -ge 75 ]; then
    echo "⚠️ **良好** - 部署基本完成，需要少量优化" >> "$REPORT_FILE"
    log_warning "部署状态评估：良好"
elif [ $success_rate -ge 60 ]; then
    echo "⚠️ **一般** - 部署存在问题，需要修复" >> "$REPORT_FILE"
    log_warning "部署状态评估：一般"
else
    echo "❌ **较差** - 部署存在严重问题，需要立即修复" >> "$REPORT_FILE"
    log_error "部署状态评估：较差"
fi
fi

echo "" >> "$REPORT_FILE"

============================================
第十二阶段：问题汇总和建议
============================================
echo "## 🚨 第十二阶段：问题汇总和建议" >> "$REPORT_FILE"

echo "### 发现的主要问题" >> "$REPORT_FILE"

收集失败项
if [ $failed_checks -gt 0 ]; then echo "需要立即修复的问题: " >> "$REPORT_FILE" # 这里可以添加具体的失败项描述 echo "1. 检查失败的服务需要重新配置或启动" >> "$REPORT_FILE" echo "2. 缺失的关键文件需要补充" >> "$REPORT_FILE" echo "3. 端口监听失败的服务需要排查" >> "$REPORT_FILE" else echo "✅ 未发现需要立即修复的严重问题" >> "$REPORT_FILE" fi

echo "" >> "$REPORT_FILE"

echo "### 优化建议" >> "$REPORT_FILE" echo "1. 监控增强: 配置完整的监控告警系统" >> "$REPORT_FILE" echo "2. 备份策略: 确保备份定时任务正常运行" >> "$REPORT_FILE" echo "3. 安全加固: 定期更新SSL证书，检查防火墙规则" >> "$REPORT_FILE" echo "4. 性能优化: 根据资源使用情况调整服务配置" >> "$REPORT_FILE" echo "5. 文档完善: 更新部署文档和故障恢复流程" >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"

echo "### 后续步骤" >> "$REPORT_FILE" echo "1. 根据报告中的失败项进行修复" >> "$REPORT_FILE" echo "2. 运行测试脚本验证修复结果" >> "$REPORT_FILE" echo "3. 配置监控告警通知" >> "$REPORT_FILE" echo "4. 定期运行此审查脚本监控部署状态" >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"

============================================
第十三阶段：自动化修复建议
============================================
echo "## 🔧 第十三阶段：自动化修复建议" >> "$REPORT_FILE"

echo "### 一键修复脚本" >> "$REPORT_FILE" echo '```bash' >> "$REPORT_FILE" echo "#!/bin/bash" >> "$REPORT_FILE" echo "# 自动修复脚本 - 根据审查报告生成" >> "$REPORT_FILE" echo "" >> "$REPORT_FILE"

生成修复命令
echo "# 1. 启动失败的服务" >> "$REPORT_FILE" echo "systemctl start docker nginx frps" >> "$REPORT_FILE" echo "" >> "$REPORT_FILE"

echo "# 2. 检查并修复Docker容器" >> "$REPORT_FILE" echo "cd /opt/nas-ecs/api && docker-compose up -d" >> "$REPORT_FILE" echo "" >> "$REPORT_FILE"

echo "# 3. 检查SSL证书" >> "$REPORT_FILE" echo "certbot renew --dry-run" >> "$REPORT_FILE" echo "" >> "$REPORT_FILE"

echo "# 4. 检查防火墙规则" >> "$REPORT_FILE" echo "ufw allow 80/tcp" >> "$REPORT_FILE" echo "ufw allow 443/tcp" >> "$REPORT_FILE" echo "ufw allow 7001/tcp" >> "$REPORT_FILE" echo "ufw allow 7500/tcp" >> "$REPORT_FILE" echo "" >> "$REPORT_FILE"

echo "# 5. 检查备份任务" >> "$REPORT_FILE" echo "crontab -l | grep backup.sh || echo '0 2 * * * /opt/nas-ecs/scripts/services/backup.sh' >> /var/spool/cron/root" >> "$REPORT_FILE" echo '```' >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"

============================================
结束报告
============================================
echo "## 📋 报告信息" >> "$REPORT_FILE" echo "- 报告文件: $REPORT_FILE" >> "$REPORT_FILE" echo "- 日志文件: $LOG_FILE" >> "$REPORT_FILE" echo "- 生成时间: $(date '+%Y-%m-%d %H:%M:%S')" >> "$REPORT_FILE" echo "- 运行时长: $SECONDS 秒" >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE" echo "---" >> "$REPORT_FILE" echo "报告生成完成" >> "$REPORT_FILE"

输出总结
log_info "============================================" log_info "部署现状审查完成" log_info "总检查项: $total_checks" log_info "通过: $passed_checks, 警告: $warning_checks, 失败: $failed_checks" log_info "报告文件: $REPORT_FILE" log_info "日志文件: $LOG_FILE" log_info "============================================"

显示报告路径
echo "" echo "${GREEN}✅ 审查报告已生成${NC}" echo "${BLUE}📄 报告文件: $REPORT_FILE${NC}" echo "${BLUE}📝 日志文件: $LOG_FILE${NC}" echo ""

显示关键摘要
if [ $failed_checks -gt 0 ]; then echo "${RED}⚠️ 发现 $failed_checks 个失败项，需要立即修复${NC}" fi

if [ $warning_checks -gt 0 ]; then echo "${YELLOW}⚠️ 发现 $warning_checks 个警告项，建议优化${NC}" fi

if [ $failed_checks -eq 0 ] && [ $warning_checks -eq 0 ]; then echo "${GREEN}✅ 所有检查项通过，部署状态良好${NC}" fi

提供快速查看命令
echo "" echo "${CYAN}快速查看报告:${NC}" echo "cat $REPORT_FILE | grep -E '(❌|⚠️|✅)' | head -20" echo "" echo "${CYAN}查看详细报告:${NC}" echo "less $REPORT_FILE"

exit 0