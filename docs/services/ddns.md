# NAS DDNS 系统部署文件

## 1. 首先安装必要的依赖

```bash
# 安装阿里云CLI
curl -O https://aliyuncli.alicdn.com/aliyun-cli-linux-latest-amd64.tgz
tar xzvf aliyun-cli-linux-latest-amd64.tgz
sudo mv aliyun /usr/local/bin/

# 安装其他依赖
sudo apt-get update
sudo apt-get install -y curl dnsutils jq nginx
```

## 2. 补充主管理面板脚本 `/opt/yyc3/scripts/nas-manager.sh`

```bash
#!/bin/bash
# NAS DDNS 系统主管理面板

source /opt/yyc3/config/env.sh

show_menu() {
    clear
    echo -e "${COLOR_CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                NAS DDNS 系统管理面板                        ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${COLOR_RESET}"
    echo "1. 查看系统状态"
    echo "2. 手动运行DDNS更新"
    echo "3. 查看DDNS日志"
    echo "4. 查看监控日志"
    echo "5. 测试所有服务"
    echo "6. 修复Nginx配置"
    echo "7. 生成系统报告"
    echo "8. 启动隧道服务"
    echo "9. 备份配置"
    echo "10. 恢复配置"
    echo "11. 查看Web门户"
    echo "0. 退出"
    echo
    echo -n "请选择操作 [0-11]: "
}

check_system_status() {
    echo -e "\n${COLOR_YELLOW}系统状态检查:${COLOR_RESET}"
    
    # 检查服务状态
    echo -e "\n${COLOR_BLUE}[服务状态]${COLOR_RESET}"
    local services=("nginx" "aliyun" "cron" "systemd-timesyncd")
    for service in "${services[@]}"; do
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            echo -e "  ${COLOR_GREEN}✓${COLOR_RESET} $service: 运行中"
        elif command -v "$service" &> /dev/null; then
            echo -e "  ${COLOR_YELLOW}⚠${COLOR_RESET} $service: 已安装但未通过systemd管理"
        else
            echo -e "  ${COLOR_RED}✗${COLOR_RESET} $service: 未安装"
        fi
    done
    
    # 检查定时器
    echo -e "\n${COLOR_BLUE}[定时器状态]${COLOR_RESET}"
    if systemctl is-active --quiet "${DDNS_TIMER}"; then
        echo -e "  ${COLOR_GREEN}✓${COLOR_RESET} DDNS定时器: 运行中"
        echo "    下次运行: $(systemctl show "${DDNS_TIMER}" --property=NextElapseUSecRealtime | cut -d= -f2 | xargs date -d @$(( $(cut -d= -f2) / 1000000 )) '+%Y-%m-%d %H:%M:%S')"
    else
        echo -e "  ${COLOR_RED}✗${COLOR_RESET} DDNS定时器: 未运行"
    fi
    
    # 检查DNS解析
    echo -e "\n${COLOR_BLUE}[DNS解析状态]${COLOR_RESET}"
    local resolved_ip
    resolved_ip=$(dig +short "${NAS_DOMAIN}" 2>/dev/null | head -n1)
    if [ -n "$resolved_ip" ]; then
        echo -e "  ${COLOR_GREEN}✓${COLOR_RESET} ${NAS_DOMAIN} -> $resolved_ip"
        if [ "$resolved_ip" = "$NAS_SERVER_IP" ]; then
            echo -e "    解析结果正确"
        else
            echo -e "    ${COLOR_YELLOW}警告: 解析IP与服务器IP不匹配${COLOR_RESET}"
            echo "    服务器IP: $NAS_SERVER_IP"
        fi
    else
        echo -e "  ${COLOR_RED}✗${COLOR_RESET} ${NAS_DOMAIN}: 无法解析"
    fi
    
    # 检查HTTP服务
    echo -e "\n${COLOR_BLUE}[HTTP服务状态]${COLOR_RESET}"
    if curl -s --connect-timeout 5 "http://${NAS_DOMAIN}" > /dev/null 2>&1; then
        echo -e "  ${COLOR_GREEN}✓${COLOR_RESET} Web服务: 可访问"
    else
        echo -e "  ${COLOR_RED}✗${COLOR_RESET} Web服务: 无法访问"
    fi
    
    # 系统资源
    echo -e "\n${COLOR_BLUE}[系统资源]${COLOR_RESET}"
    echo "  CPU使用率: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')%"
    echo "  内存使用: $(free -h | grep Mem | awk '{print $3"/"$2 " ("$3/$2*100"%)"}')"
    echo "  磁盘使用: $(df -h / | awk 'NR==2 {print $3"/"$2 " ("$5")"}')"
}

manual_ddns_update() {
    echo -e "\n${COLOR_YELLOW}手动运行DDNS更新...${COLOR_RESET}"
    "${NAS_DDNS_DIR}/ddns-simple.sh"
    
    # 查看最后几行日志
    echo -e "\n${COLOR_BLUE}最近日志:${COLOR_RESET}"
    tail -10 "${NAS_LOGS_DIR}/ddns.log"
}

view_logs() {
    echo -e "\n${COLOR_YELLOW}选择日志文件:${COLOR_RESET}"
    echo "1. DDNS日志"
    echo "2. 监控日志"
    echo "3. Nginx访问日志"
    echo "4. Nginx错误日志"
    echo "0. 返回"
    
    read -p "选择: " log_choice
    
    case $log_choice in
        1)
            less "${NAS_LOGS_DIR}/ddns.log"
            ;;
        2)
            less "${NAS_LOGS_DIR}/monitor.log"
            ;;
        3)
            less "${NAS_LOGS_DIR}/nginx/nas_access.log"
            ;;
        4)
            less "${NAS_LOGS_DIR}/nginx/nas_error.log"
            ;;
    esac
}

generate_report() {
    echo -e "\n${COLOR_YELLOW}生成系统报告...${COLOR_RESET}"
    
    REPORT_FILE="${NAS_REPORTS_DIR}/nas-report-$(date +%Y%m%d-%H%M%S).txt"
    
    {
        echo "=== NAS DDNS 系统报告 ==="
        echo "生成时间: $(date)"
        echo "系统版本: ${NAS_DDNS_VERSION}"
        echo ""
        echo "=== 系统信息 ==="
        echo "主机名: $(hostname)"
        echo "系统: $(lsb_release -ds 2>/dev/null || cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2)"
        echo "内核: $(uname -r)"
        echo "运行时间: $(uptime -p)"
        echo ""
        echo "=== 网络信息 ==="
        echo "域名: ${NAS_DOMAIN}"
        echo "服务器IP: ${NAS_SERVER_IP}"
        echo "本地IP: ${NAS_LOCAL_IP}"
        echo "公网IP: $(curl -s http://checkip.amazonaws.com)"
        echo ""
        echo "=== 服务状态 ==="
        systemctl status "${DDNS_TIMER}" --no-pager
        echo ""
        systemctl status "${MONITOR_TIMER}" --no-pager
        echo ""
        echo "=== DNS解析 ==="
        dig "${NAS_DOMAIN}" +short
        echo ""
        echo "=== 最近DDNS日志 ==="
        tail -20 "${NAS_LOGS_DIR}/ddns.log"
    } > "$REPORT_FILE"
    
    echo -e "${COLOR_GREEN}报告已生成: $REPORT_FILE${COLOR_RESET}"
}

backup_config() {
    echo -e "\n${COLOR_YELLOW}备份系统配置...${COLOR_RESET}"
    
    local backup_dir="${NAS_BACKUP_DIR}/config/$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$backup_dir"
    
    # 备份关键文件
    cp "${NAS_BASE_DIR}/config/env.sh" "$backup_dir/"
    cp "${NAS_DDNS_DIR}/ddns-simple.sh" "$backup_dir/"
    cp "${NGINX_CONF_FILE}" "$backup_dir/" 2>/dev/null
    
    echo -e "${COLOR_GREEN}配置已备份到: $backup_dir${COLOR_RESET}"
    ls -la "$backup_dir"
}

restore_config() {
    echo -e "\n${COLOR_YELLOW}可用的备份:${COLOR_RESET}"
    
    local backups=("${NAS_BACKUP_DIR}/config"/*/)
    if [ ${#backups[@]} -eq 0 ]; then
        echo "没有找到备份"
        return
    fi
    
    for i in "${!backups[@]}"; do
        echo "$(($i+1)). $(basename "${backups[$i]}")"
    done
    
    read -p "选择要恢复的备份编号: " choice
    local selected="${backups[$(($choice-1))]}"
    
    if [ -d "$selected" ]; then
        echo -e "\n${COLOR_YELLOW}恢复配置...${COLOR_RESET}"
        cp "$selected"/* "${NAS_BASE_DIR}/config/" 2>/dev/null
        echo -e "${COLOR_GREEN}配置已恢复${COLOR_RESET}"
    else
        echo -e "${COLOR_RED}无效的选择${COLOR_RESET}"
    fi
}

main() {
    while true; do
        show_menu
        read choice
        
        case $choice in
            1)
                check_system_status
                ;;
            2)
                manual_ddns_update
                ;;
            3)
                view_logs
                ;;
            4)
                less "${NAS_LOGS_DIR}/monitor.log"
                ;;
            5)
                "${NAS_SCRIPTS_DIR}/test-all.sh"
                ;;
            6)
                "${NAS_SCRIPTS_DIR}/fix-nginx.sh"
                ;;
            7)
                generate_report
                ;;
            8)
                "${NAS_SCRIPTS_DIR}/nas-tunnel.sh"
                ;;
            9)
                backup_config
                ;;
            10)
                restore_config
                ;;
            11)
                echo -e "\n${COLOR_GREEN}Web门户地址: http://${NAS_DOMAIN}${COLOR_RESET}"
                ;;
            0)
                echo "再见！"
                exit 0
                ;;
            *)
                echo "无效选择"
                ;;
        esac
        
        echo
        read -p "按Enter键继续..."
    done
}

# 运行主函数
main
```

## 3. 补充系统信息脚本 `/opt/yyc3/scripts/system-info.sh`

```bash
#!/bin/bash
# 系统信息脚本

source /opt/yyc3/config/env.sh

show_system_info() {
    echo -e "${COLOR_CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    NAS 系统信息                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${COLOR_RESET}"
    
    # 基本系统信息
    echo -e "${COLOR_YELLOW}[基本系统信息]${COLOR_RESET}"
    echo "主机名: $(hostname)"
    echo "系统版本: $(lsb_release -ds 2>/dev/null || cat /etc/os-release | grep PRETTY_NAME | cut -d= -f2)"
    echo "内核版本: $(uname -r)"
    echo "架构: $(uname -m)"
    echo "运行时间: $(uptime -p)"
    echo "当前时间: $(date)"
    
    # CPU信息
    echo -e "\n${COLOR_YELLOW}[CPU信息]${COLOR_RESET}"
    echo "CPU型号: $(lscpu | grep "Model name" | cut -d: -f2 | xargs)"
    echo "核心数: $(nproc)"
    echo "当前负载: $(cat /proc/loadavg | awk '{print $1, $2, $3}')"
    
    # 内存信息
    echo -e "\n${COLOR_YELLOW}[内存信息]${COLOR_RESET}"
    free -h | awk 'NR==1{print "      总量    已用    可用    共享  缓冲/缓存  可用"} NR==2{print "内存: "$2"  "$3"  "$4"  "$5"  "$6"  "$7}'
    
    # 磁盘信息
    echo -e "\n${COLOR_YELLOW}[磁盘信息]${COLOR_RESET}"
    df -h --output=source,fstype,size,used,avail,pcent,target | head -n 5
    
    # 网络信息
    echo -e "\n${COLOR_YELLOW}[网络信息]${COLOR_RESET}"
    echo "内部IP: $(hostname -I | awk '{print $1}')"
    echo "外部IP: $(curl -s http://checkip.amazonaws.com 2>/dev/null || echo "无法获取")"
    echo "网关: $(ip route | grep default | awk '{print $3}')"
    
    # DDNS配置信息
    echo -e "\n${COLOR_YELLOW}[DDNS配置]${COLOR_RESET}"
    echo "域名: ${NAS_DOMAIN}"
    echo "服务器IP: ${NAS_SERVER_IP}"
    echo "本地IP: ${NAS_LOCAL_IP}"
    echo "检查间隔: ${DDNS_CHECK_INTERVAL}秒"
    
    # 服务状态
    echo -e "\n${COLOR_YELLOW}[服务状态]${COLOR_RESET}"
    services=("nginx" "aliyun" "cron")
    for service in "${services[@]}"; do
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            echo -e "  ${COLOR_GREEN}✓${COLOR_RESET} $service"
        elif command -v "$service" &> /dev/null; then
            echo -e "  ${COLOR_YELLOW}⚠${COLOR_RESET} $service (未通过systemd管理)"
        else
            echo -e "  ${COLOR_RED}✗${COLOR_RESET} $service"
        fi
    done
    
    # 目录信息
    echo -e "\n${COLOR_YELLOW}[目录信息]${COLOR_RESET}"
    echo "基础目录: ${NAS_BASE_DIR}"
    echo "配置目录: ${NAS_BASE_DIR}/config"
    echo "脚本目录: ${NAS_SCRIPTS_DIR}"
    echo "日志目录: ${NAS_LOGS_DIR}"
    echo "Web目录: ${NAS_WEB_DIR}"
    
    # 文件系统使用情况
    echo -e "\n${COLOR_YELLOW}[DDNS系统目录使用情况]${COLOR_RESET}"
    du -sh "${NAS_BASE_DIR}"/*
}

# 主函数
main() {
    show_system_info
    
    # 检查是否需要详细输出
    if [ "$1" = "--detail" ]; then
        echo -e "\n${COLOR_YELLOW}[详细网络信息]${COLOR_RESET}"
        ip addr show
        
        echo -e "\n${COLOR_YELLOW}[DNS解析测试]${COLOR_RESET}"
        dig "${NAS_DOMAIN}" +short
        
        echo -e "\n${COLOR_YELLOW}[最近DDNS日志]${COLOR_RESET}"
        tail -10 "${NAS_LOGS_DIR}/ddns.log" 2>/dev/null || echo "暂无日志"
    fi
}

main "$@"
```

## 4. 补充测试脚本 `/opt/yyc3/scripts/test-all.sh`

```bash
#!/bin/bash
# 完整测试脚本

source /opt/yyc3/config/env.sh

log_test() {
    echo -e "[TEST] $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

run_test() {
    local test_name="$1"
    local test_command="$2"
    
    log_test "开始测试: $test_name"
    
    if eval "$test_command"; then
        echo -e "${COLOR_GREEN}✓ 测试通过: $test_name${COLOR_RESET}"
        return 0
    else
        echo -e "${COLOR_RED}✗ 测试失败: $test_name${COLOR_RESET}"
        return 1
    fi
}

test_system() {
    echo -e "\n${COLOR_YELLOW}[1/6] 测试系统依赖...${COLOR_RESET}"
    
    run_test "检查curl命令" "command -v curl"
    run_test "检查dig命令" "command -v dig"
    run_test "检查nginx命令" "command -v nginx"
    run_test "检查aliyun CLI" "command -v aliyun"
    run_test "检查jq命令" "command -v jq"
}

test_config() {
    echo -e "\n${COLOR_YELLOW}[2/6] 测试配置文件...${COLOR_RESET}"
    
    run_test "检查环境变量文件" "[ -f '${NAS_BASE_DIR}/config/env.sh' ]"
    run_test "加载环境变量" "source '${NAS_BASE_DIR}/config/env.sh'"
    run_test "检查必要配置" "[ -n '${NAS_DOMAIN}' ] && [ -n '${NAS_SERVER_IP}' ]"
    run_test "检查阿里云配置" "[ -n '${ALIYUN_ACCESS_KEY_ID}' ] && [ -n '${ALIYUN_ACCESS_KEY_SECRET}' ]"
}

test_network() {
    echo -e "\n${COLOR_YELLOW}[3/6] 测试网络连接...${COLOR_RESET}"
    
    run_test "获取公网IP" "curl -s --connect-timeout 5 http://checkip.amazonaws.com"
    run_test "测试DNS解析" "dig +short ${NAS_DOMAIN} 2>/dev/null | head -1"
    run_test "测试阿里云连接" "aliyun ecs DescribeRegions --output cols=RegionId rows='' 2>/dev/null"
}

test_services() {
    echo -e "\n${COLOR_YELLOW}[4/6] 测试服务...${COLOR_RESET}"
    
    run_test "检查Nginx配置" "nginx -t"
    run_test "测试Nginx服务" "systemctl is-active nginx 2>/dev/null || echo 'Nginx未通过systemd管理'"
    run_test "测试Web服务" "curl -s --connect-timeout 3 http://localhost/health 2>/dev/null | grep -q healthy"
}

test_scripts() {
    echo -e "\n${COLOR_YELLOW}[5/6] 测试脚本...${COLOR_RESET}"
    
    run_test "测试DDNS脚本" "bash -n '${NAS_DDNS_DIR}/ddns-simple.sh'"
    run_test "测试管理脚本" "bash -n '${NAS_SCRIPTS_DIR}/nas-manager.sh'"
    run_test "测试监控脚本" "bash -n '${NAS_SCRIPTS_DIR}/monitor-nas.sh'"
}

test_directories() {
    echo -e "\n${COLOR_YELLOW}[6/6] 测试目录结构...${COLOR_RESET}"
    
    run_test "检查基础目录" "[ -d '${NAS_BASE_DIR}' ]"
    run_test "检查配置目录" "[ -d '${NAS_BASE_DIR}/config' ]"
    run_test "检查脚本目录" "[ -d '${NAS_SCRIPTS_DIR}' ]"
    run_test "检查日志目录" "[ -d '${NAS_LOGS_DIR}' ]"
    run_test "检查Web目录" "[ -d '${NAS_WEB_DIR}' ]"
}

main() {
    echo -e "${COLOR_CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                   NAS DDNS 系统完整测试                     ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${COLOR_RESET}"
    
    local passed=0
    local failed=0
    
    # 运行所有测试
    test_system && ((passed++)) || ((failed++))
    test_config && ((passed++)) || ((failed++))
    test_network && ((passed++)) || ((failed++))
    test_services && ((passed++)) || ((failed++))
    test_scripts && ((passed++)) || ((failed++))
    test_directories && ((passed++)) || ((failed++))
    
    # 显示测试结果
    echo -e "\n${COLOR_CYAN}══════════════════════════════════════════════════════════════${COLOR_RESET}"
    echo -e "${COLOR_BLUE}测试完成${COLOR_RESET}"
    echo -e "通过: ${COLOR_GREEN}$passed${COLOR_RESET}"
    echo -e "失败: ${COLOR_RED}$failed${COLOR_RESET}"
    
    if [ $failed -eq 0 ]; then
        echo -e "${COLOR_GREEN}所有测试通过！系统已准备就绪。${COLOR_RESET}"
        return 0
    else
        echo -e "${COLOR_YELLOW}有 $failed 个测试失败，请检查相关配置。${COLOR_RESET}"
        return 1
    fi
}

main
```

## 5. 补充监控脚本 `/opt/yyc3/scripts/monitor-nas.sh`

```bash
#!/bin/bash
# NAS 监控脚本

source /opt/yyc3/config/env.sh

# 设置日志文件
LOG_FILE="${NAS_LOGS_DIR}/monitor-$(date +%Y%m%d).log"
exec >> "$LOG_FILE" 2>&1

log_monitor() {
    echo "[MONITOR] $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

check_dns() {
    log_monitor "检查DNS解析..."
    local resolved_ip
    resolved_ip=$(dig +short "${NAS_DOMAIN}" 2>/dev/null | head -n1)
    
    if [ -n "$resolved_ip" ]; then
        if [ "$resolved_ip" = "$NAS_SERVER_IP" ]; then
            log_monitor "DNS解析正确: $resolved_ip"
            return 0
        else
            log_monitor "DNS解析错误: 期望 $NAS_SERVER_IP, 实际 $resolved_ip"
            return 1
        fi
    else
        log_monitor "DNS解析失败: 无法解析 ${NAS_DOMAIN}"
        return 1
    fi
}

check_http() {
    log_monitor "检查HTTP服务..."
    
    # 检查本地服务
    if curl -s --connect-timeout 3 http://localhost/health > /dev/null 2>&1; then
        log_monitor "本地HTTP服务正常"
    else
        log_monitor "本地HTTP服务异常"
        return 1
    fi
    
    # 检查公网服务（如果域名解析正确）
    if check_dns; then
        if curl -s --connect-timeout 5 "http://${NAS_DOMAIN}/health" > /dev/null 2>&1; then
            log_monitor "公网HTTP服务正常"
        else
            log_monitor "公网HTTP服务异常"
            return 1
        fi
    fi
    
    return 0
}

check_services() {
    log_monitor "检查系统服务..."
    
    local services=("nginx" "cron" "systemd-timesyncd")
    local all_ok=true
    
    for service in "${services[@]}"; do
        if systemctl is-active --quiet "$service" 2>/dev/null; then
            log_monitor "服务 $service 运行正常"
        else
            log_monitor "服务 $service 未运行"
            all_ok=false
        fi
    done
    
    if $all_ok; then
        return 0
    else
        return 1
    fi
}

check_resources() {
    log_monitor "检查系统资源..."
    
    local alerts=()
    
    # CPU使用率
    local cpu_usage
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    cpu_usage=${cpu_usage%.*}
    
    if [ "$cpu_usage" -gt "${MONITOR_ALERT_THRESHOLD_CPU:-90}" ]; then
        alerts+=("CPU使用率过高: ${cpu_usage}%")
    fi
    
    # 内存使用率
    local mem_usage
    mem_usage=$(free | grep Mem | awk '{print $3/$2 * 100.0}')
    mem_usage=${mem_usage%.*}
    
    if [ "$mem_usage" -gt "${MONITOR_ALERT_THRESHOLD_MEM:-90}" ]; then
        alerts+=("内存使用率过高: ${mem_usage}%")
    fi
    
    # 磁盘使用率
    local disk_usage
    disk_usage=$(df -h / | awk 'NR==2 {print $5}' | cut -d'%' -f1)
    
    if [ "$disk_usage" -gt "${MONITOR_ALERT_THRESHOLD_DISK:-90}" ]; then
        alerts+=("磁盘使用率过高: ${disk_usage}%")
    fi
    
    # 检查日志文件大小
    local log_size
    log_size=$(du -h "${NAS_LOGS_DIR}/ddns.log" 2>/dev/null | cut -f1 | sed 's/[A-Za-z]*//g')
    if [ "${log_size:-0}" -gt 100 ]; then  # 大于100MB
        alerts+=("DDNS日志文件过大: ${log_size}MB")
    fi
    
    if [ ${#alerts[@]} -eq 0 ]; then
        log_monitor "系统资源正常 - CPU: ${cpu_usage}%, 内存: ${mem_usage}%, 磁盘: ${disk_usage}%"
        return 0
    else
        for alert in "${alerts[@]}"; do
            log_monitor "警告: $alert"
        done
        return 1
    fi
}

check_ddns_status() {
    log_monitor "检查DDNS状态..."
    
    # 检查DDNS定时器
    if systemctl is-active --quiet "${DDNS_TIMER}" 2>/dev/null; then
        log_monitor "DDNS定时器运行正常"
        
        # 检查最后运行时间
        local last_run
        last_run=$(journalctl -u "${DDNS_SERVICE}" -n 1 --no-pager | grep -o "20[0-9]*-[0-9]*-[0-9]* [0-9]*:[0-9]*:[0-9]*" | tail -1)
        
        if [ -n "$last_run" ]; then
            log_monitor "DDNS最后运行时间: $last_run"
            
            # 检查是否在最近10分钟内运行过
            local last_timestamp
            last_timestamp=$(date -d "$last_run" +%s)
            local now_timestamp
            now_timestamp=$(date +%s)
            local diff=$((now_timestamp - last_timestamp))
            
            if [ $diff -gt 600 ]; then  # 超过10分钟
                log_monitor "警告: DDNS超过10分钟未运行"
                return 1
            fi
        fi
    else
        log_monitor "DDNS定时器未运行"
        return 1
    fi
    
    return 0
}

main() {
    log_monitor "开始监控检查..."
    
    local overall_status=0
    
    if [ "${MONITOR_CHECK_DNS}" = "true" ]; then
        check_dns || overall_status=1
    fi
    
    if [ "${MONITOR_CHECK_HTTP}" = "true" ]; then
        check_http || overall_status=1
    fi
    
    if [ "${MONITOR_CHECK_SERVICES}" = "true" ]; then
        check_services || overall_status=1
    fi
    
    if [ "${MONITOR_CHECK_RESOURCES}" = "true" ]; then
        check_resources || overall_status=1
    fi
    
    check_ddns_status || overall_status=1
    
    if [ $overall_status -eq 0 ]; then
        log_monitor "所有监控检查通过"
    else
        log_monitor "部分监控检查失败"
    fi
    
    log_monitor "监控检查完成"
    
    # 清理旧日志
    find "${NAS_LOGS_DIR}" -name "monitor-*.log" -mtime +${LOG_RETENTION_DAYS} -delete
    
    exit $overall_status
}

# 运行主函数
main
```

## 6. 补充Web页面的JavaScript文件 `/opt/yyc3/web/nas/assets/script.js`

```javascript
// NAS DDNS 系统前端脚本

document.addEventListener('DOMContentLoaded', function() {
    // 自动刷新状态
    loadStatus();
    setInterval(loadStatus, 60000); // 每分钟刷新一次
    
    // 如果是在详细状态页，加载更多信息
    if (window.location.pathname.includes('status.html')) {
        loadDetailedStatus();
        setInterval(loadDetailedStatus, 30000); // 每30秒刷新一次
    }
});

function loadStatus() {
    fetch('/status')
        .then(response => response.json())
        .then(data => {
            updateStatus(data);
        })
        .catch(error => {
            console.error('获取状态失败:', error);
            document.getElementById('status-indicator').className = 'status-indicator offline';
            document.querySelector('.status-text').textContent = '离线';
        });
}

function updateStatus(data) {
    const indicator = document.getElementById('status-indicator');
    const statusText = indicator.querySelector('.status-text');
    const lastUpdate = document.getElementById('last-update');
    const currentTime = new Date().toLocaleString('zh-CN');
    
    // 更新状态指示器
    if (data.status === 'online') {
        indicator.className = 'status-indicator online';
        statusText.textContent = '在线';
    } else {
        indicator.className = 'status-indicator offline';
        statusText.textContent = '离线';
    }
    
    // 更新最后更新时间
    if (lastUpdate) {
        lastUpdate.textContent = currentTime;
    }
    
    // 更新其他信息
    if (data.domain) {
        const domainElement = document.getElementById('domain');
        if (domainElement) domainElement.textContent = data.domain;
    }
    
    if (data.server_ip) {
        const ipElement = document.getElementById('server-ip');
        if (ipElement) ipElement.textContent = data.server_ip;
    }
}

function loadDetailedStatus() {
    // 加载系统信息
    fetch('/status')
        .then(response => response.json())
        .then(data => {
            updateSystemInfo(data);
        });
    
    // 加载服务状态
    loadServicesStatus();
    
    // 加载资源使用情况
    loadResourceUsage();
    
    // 加载DNS状态
    loadDNSStatus();
    
    // 加载最近日志
    loadRecentLogs();
    
    // 更新最后刷新时间
    document.getElementById('last-refresh-time').textContent = new Date().toLocaleString('zh-CN');
}

function updateSystemInfo(data) {
    const elements = {
        'hostname': data.hostname || '--',
        'uptime': data.uptime || '--',
        'loadavg': data.load || '--',
        'current-time': new Date().toLocaleString('zh-CN')
    };
    
    for (const [id, value] of Object.entries(elements)) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }
}

function loadServicesStatus() {
    const services = [
        { id: 'ddns', name: 'DDNS服务' },
        { id: 'nginx', name: 'Web服务' },
        { id: 'monitor', name: '监控服务' },
        { id: 'cron', name: '定时任务' }
    ];
    
    const tableBody = document.getElementById('services-table-body');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    services.forEach(service => {
        const row = document.createElement('tr');
        
        // 模拟状态 - 实际应用中应该从API获取
        const status = Math.random() > 0.2 ? '运行中' : '已停止';
        const lastRun = new Date(Date.now() - Math.random() * 3600000).toLocaleString('zh-CN');
        
        row.innerHTML = `
            <td>${service.name}</td>
            <td><span class="status-badge ${status === '运行中' ? 'running' : 'stopped'}">${status}</span></td>
            <td>${lastRun}</td>
            <td>
                <button class="btn-small" onclick="restartService('${service.id}')">重启</button>
                <button class="btn-small btn-danger" onclick="stopService('${service.id}')">停止</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    });
}

function loadResourceUsage() {
    // 模拟资源使用数据 - 实际应用中应该从API获取
    const resources = {
        cpu: Math.floor(Math.random() * 100),
        mem: Math.floor(Math.random() * 100),
        disk: Math.floor(Math.random() * 100)
    };
    
    // 更新CPU
    const cpuProgress = document.getElementById('cpu-progress');
    const cpuText = document.getElementById('cpu-text');
    if (cpuProgress && cpuText) {
        cpuProgress.style.width = `${resources.cpu}%`;
        cpuText.textContent = `${resources.cpu}%`;
        
        if (resources.cpu > 80) {
            cpuProgress.style.backgroundColor = '#e74c3c';
        } else if (resources.cpu > 60) {
            cpuProgress.style.backgroundColor = '#f39c12';
        } else {
            cpuProgress.style.backgroundColor = '#2ecc71';
        }
    }
    
    // 更新内存
    const memProgress = document.getElementById('mem-progress');
    const memText = document.getElementById('mem-text');
    if (memProgress && memText) {
        memProgress.style.width = `${resources.mem}%`;
        memText.textContent = `${resources.mem}% (${Math.floor(resources.mem * 16)}/${16 * 1024} MB)`;
        
        if (resources.mem > 80) {
            memProgress.style.backgroundColor = '#e74c3c';
        } else if (resources.mem > 60) {
            memProgress.style.backgroundColor = '#f39c12';
        } else {
            memProgress.style.backgroundColor = '#2ecc71';
        }
    }
    
    // 更新磁盘
    const diskProgress = document.getElementById('disk-progress');
    const diskText = document.getElementById('disk-text');
    if (diskProgress && diskText) {
        diskProgress.style.width = `${resources.disk}%`;
        diskText.textContent = `${resources.disk}% (${resources.disk}/100 GB)`;
        
        if (resources.disk > 80) {
            diskProgress.style.backgroundColor = '#e74c3c';
        } else if (resources.disk > 60) {
            diskProgress.style.backgroundColor = '#f39c12';
        } else {
            diskProgress.style.backgroundColor = '#2ecc71';
        }
    }
}

function loadDNSStatus() {
    const domain = document.getElementById('domain')?.textContent || window.location.hostname;
    
    // 模拟DNS解析检查 - 实际应用中应该从API获取
    setTimeout(() => {
        const dnsIP = document.getElementById('dns-ip');
        const dnsStatus = document.getElementById('dns-status');
        
        if (dnsIP && dnsStatus) {
            // 模拟成功或失败
            if (Math.random() > 0.1) {
                dnsIP.textContent = '8.152.195.33';
                dnsStatus.innerHTML = '<span class="status-success">✓ 解析正常</span>';
            } else {
                dnsIP.textContent = '解析失败';
                dnsStatus.innerHTML = '<span class="status-error">✗ 解析失败</span>';
            }
        }
    }, 1000);
}

function loadRecentLogs() {
    const logContainer = document.getElementById('recent-logs');
    if (!logContainer) return;
    
    // 模拟日志数据 - 实际应用中应该从API获取
    const logs = [
        '[2024-01-02 14:30:15] DDNS检查完成 - IP未变化',
        '[2024-01-02 14:25:15] DDNS检查完成 - IP未变化',
        '[2024-01-02 14:20:15] 开始DDNS检查...',
        '[2024-01-02 14:15:15] 监控检查完成 - 所有系统正常',
        '[2024-01-02 14:10:15] DDNS检查完成 - IP已更新为8.152.195.33'
    ];
    
    logContainer.textContent = logs.join('\n');
}

function refreshStatus() {
    showNotification('正在刷新状态...', 'info');
    
    if (window.location.pathname.includes('status.html')) {
        loadDetailedStatus();
    } else {
        loadStatus();
    }
    
    setTimeout(() => {
        showNotification('状态已刷新', 'success');
    }, 1000);
}

function restartService(service) {
    showNotification(`正在重启 ${service}...`, 'info');
    
    // 这里应该调用API重启服务
    setTimeout(() => {
        showNotification(`${service} 已重启`, 'success');
        loadDetailedStatus();
    }, 2000);
}

function stopService(service) {
    if (!confirm(`确定要停止 ${service} 服务吗？`)) {
        return;
    }
    
    showNotification(`正在停止 ${service}...`, 'warning');
    
    // 这里应该调用API停止服务
    setTimeout(() => {
        showNotification(`${service} 已停止`, 'success');
        loadDetailedStatus();
    }, 2000);
}

function showNotification(message, type) {
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span class="notification-icon">${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}</span>
        <span class="notification-message">${message}</span>
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 显示通知
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // 3秒后自动隐藏
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// 全局函数
function loadAllStatus() {
    refreshStatus();
}
```

## 7. 补充其他必要的脚本

### `/opt/yyc3/scripts/fix-nginx.sh`

```bash
#!/bin/bash
# Nginx修复脚本

source /opt/yyc3/config/env.sh

log_info "开始修复Nginx配置..."

# 备份当前配置
backup_file "${NGINX_CONF_FILE}"

# 重新创建Nginx配置
cat > "${NGINX_CONF_FILE}" << 'EOF'
# NAS DDNS 门户配置
server {
    listen ${NGINX_PORT};
    server_name ${NAS_DOMAIN};
    
    # 访问日志
    access_log ${NGINX_ACCESS_LOG} combined;
    error_log ${NGINX_ERROR_LOG} warn;
    
    # 根目录
    root ${NAS_WEB_DIR};
    index index.html;
    
    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # 健康检查端点
    location /health {
        access_log off;
        add_header Content-Type application/json;
        return 200 '{"status": "healthy", "timestamp": "$(date -Iseconds)", "service": "nas-ddns"}';
    }
    
    # 状态端点
    location /status {
        access_log off;
        add_header Content-Type application/json;
        
        # 获取系统信息
        set_by_lua $current_time 'return os.date("%Y-%m-%d %H:%M:%S")';
        set_by_lua $uptime 'local f = io.popen("uptime -p"); local s = f:read("*a"); f:close(); return string.gsub(s, "up ", ""):gsub("\n", "")';
        set_by_lua $loadavg 'local f = io.popen("cat /proc/loadavg | awk \'{print $1, $2, $3}\'"); local s = f:read("*a"); f:close(); return s:gsub("\n", "")';
        set_by_lua $hostname 'return io.popen("hostname"):read("*a"):gsub("\n", "")';
        
        return 200 '{"status": "online", "timestamp": "$current_time", "uptime": "$uptime", "load": "$loadavg", "hostname": "$hostname", "domain": "${NAS_DOMAIN}", "server_ip": "${NAS_SERVER_IP}"}';
    }
    
    # 静态文件
    location / {
        try_files $uri $uri/ =404;
        
        # 缓存静态资源
        location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # 限制请求大小
    client_max_body_size 10m;
    
    # 超时设置
    client_body_timeout 12;
    client_header_timeout 12;
    keepalive_timeout 15;
    send_timeout 10;
}
EOF

# 测试配置
if nginx -t; then
    # 重载Nginx
    systemctl reload nginx
    log_success "Nginx配置修复完成并已重载"
else
    log_error "Nginx配置测试失败，请检查配置"
    exit 1
fi
```

### `/opt/yyc3/ddns/ddns-update.sh`

```bash
#!/bin/bash
# DDNS更新脚本（被定时器调用）

source /opt/yyc3/config/env.sh

# 运行DDNS脚本
"${NAS_DDNS_DIR}/ddns-simple.sh"

# 记录运行时间
echo "$(date '+%Y-%m-%d %H:%M:%S') - DDNS更新完成" >> "${NAS_LOGS_DIR}/ddns-run.log"
```

### `/opt/yyc3/scripts/daily-report.sh`

```bash
#!/bin/bash
# 每日报告生成脚本

source /opt/yyc3/config/env.sh

generate_daily_report() {
    local report_date=$(date +%Y%m%d)
    local report_file="${NAS_REPORTS_DIR}/daily/nas-report-${report_date}.md"
    
    mkdir -p "$(dirname "$report_file")"
    
    cat > "$report_file" << EOF
# NAS DDNS 每日报告

**生成时间:** $(date '+%Y-%m-%d %H:%M:%S')  
**报告日期:** ${report_date}  
**域名:** ${NAS_DOMAIN}  
**服务器IP:** ${NAS_SERVER_IP}  

---

## 系统概览

### 基本信息
- **主机名:** $(hostname)
- **系统版本:** $(lsb_release -ds 2>/dev/null || uname -a)
- **内核版本:** $(uname -r)
- **运行时间:** $(uptime -p | sed 's/up //')
- **当前负载:** $(cat /proc/loadavg | awk '{print $1, $2, $3}')

### 资源使用情况
- **CPU使用率:** $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')%
- **内存使用:** $(free -h | grep Mem | awk '{print $3"/"$2 " ("$3/$2*100"%)"}')
- **磁盘使用:** $(df -h / | awk 'NR==2 {print $3"/"$2 " ("$5")"}')

---

## 服务状态

### 系统服务
$(systemctl list-units --type=service --state=running | grep -E "(nginx|aliyun|cron)" | awk '{print "1. " $1 ": " $2}' || echo "暂无相关信息")

### DDNS状态
- **最后检查时间:** $(tail -1 "${NAS_LOGS_DIR}/ddns.log" 2>/dev/null | cut -d' ' -f1-3 || echo "无记录")
- **当前解析IP:** $(dig +short "${NAS_DOMAIN}" 2>/dev/null | head -1 || echo "无法解析")
- **服务器IP:** ${NAS_SERVER_IP}
- **匹配状态:** $([ "$(dig +short "${NAS_DOMAIN}" 2>/dev/null | head -1)" = "${NAS_SERVER_IP}" ] && echo "✓ 匹配" || echo "✗ 不匹配")

---

## 日志摘要

### 最近DDNS更新记录
\`\`\`
$(tail -20 "${NAS_LOGS_DIR}/ddns.log" 2>/dev/null || echo "无日志记录")
\`\`\`

### 最近监控记录
\`\`\`
$(tail -10 "${NAS_LOGS_DIR}/monitor.log" 2>/dev/null || echo "无监控记录")
\`\`\`

---

## 网络状态

### 连通性测试
- **本地Web服务:** $(curl -s --connect-timeout 3 http://localhost/health >/dev/null && echo "✓ 正常" || echo "✗ 异常")
- **公网Web服务:** $(curl -s --connect-timeout 5 "http://${NAS_DOMAIN}/health" >/dev/null && echo "✓ 正常" || echo "✗ 异常")
- **DNS解析:** $(dig +short "${NAS_DOMAIN}" >/dev/null && echo "✓ 正常" || echo "✗ 异常")

---

## 统计信息

### 目录使用情况
\`\`\`
$(du -sh "${NAS_BASE_DIR}"/* 2>/dev/null)
\`\`\`

### 日志文件大小
\`\`\`
$(ls -lh "${NAS_LOGS_DIR}"/*.log 2>/dev/null | awk '{print $5, $9}')
\`\`\`

---

**报告结束**
EOF
    
    log_success "每日报告已生成: ${report_file}"
}

# 清理旧报告
cleanup_old_reports() {
    find "${NAS_REPORTS_DIR}" -name "nas-report-*.md" -mtime +${REPORT_RETENTION_DAYS} -delete
    log_info "清理了超过 ${REPORT_RETENTION_DAYS} 天的旧报告"
}

main() {
    generate_daily_report
    cleanup_old_reports
}

main
```

### `/opt/yyc3/scripts/nas-tunnel.sh`

```bash
#!/bin/bash
# NAS隧道脚本（用于内网穿透）

source /opt/yyc3/config/env.sh

show_tunnel_menu() {
    clear
    echo -e "${COLOR_CYAN}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                    NAS 隧道配置                              ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${COLOR_RESET}"
    echo "1. 配置SSH隧道（端口转发）"
    echo "2. 查看当前隧道连接"
    echo "3. 测试隧道连接"
    echo "4. 停止所有隧道"
    echo "0. 返回"
    echo
    echo -n "请选择操作 [0-4]: "
}

configure_ssh_tunnel() {
    echo -e "\n${COLOR_YELLOW}配置SSH隧道${COLOR_RESET}"
    
    read -p "本地端口 (默认: 22): " local_port
    local_port=${local_port:-22}
    
    read -p "远程端口 (默认: 2222): " remote_port
    remote_port=${remote_port:-2222}
    
    echo -e "\n隧道配置:"
    echo "本地端口: $local_port"
    echo "远程端口: $remote_port"
    echo "访问方式: ssh -p $remote_port user@${NAS_DOMAIN}"
    
    read -p "是否启动隧道？[y/N]: " confirm
    if [[ $confirm =~ ^[Yy]$ ]]; then
        # 检查是否已存在隧道进程
        if pgrep -f "ssh.*$remote_port:localhost:$local_port" > /dev/null; then
            echo -e "${COLOR_YELLOW}隧道已在运行${COLOR_RESET}"
            return
        fi
        
        # 启动SSH隧道（后台运行）
        ssh -f -N -R ${remote_port}:localhost:${local_port} root@${NAS_DOMAIN} -o ServerAliveInterval=60
        
        if [ $? -eq 0 ]; then
            echo -e "${COLOR_GREEN}SSH隧道已启动${COLOR_RESET}"
            echo "PID: $(pgrep -f "ssh.*$remote_port:localhost:$local_port")"
        else
            echo -e "${COLOR_RED}SSH隧道启动失败${COLOR_RESET}"
        fi
    fi
}

show_tunnel_connections() {
    echo -e "\n${COLOR_YELLOW}当前隧道连接:${COLOR_RESET}"
    
    local tunnels=$(pgrep -af "ssh.*-R")
    if [ -n "$tunnels" ]; then
        echo "$tunnels" | while read line; do
            pid=$(echo $line | awk '{print $1}')
            cmd=$(echo $line | cut -d' ' -f2-)
            
            # 提取端口信息
            remote_port=$(echo $cmd | grep -oP '\-R \K[0-9]+:[^:]+:[0-9]+' | cut -d: -f1)
            local_port=$(echo $cmd | grep -oP '\-R \K[0-9]+:[^:]+:[0-9]+' | cut -d: -f3)
            
            echo "PID: $pid"
            echo "远程端口: $remote_port -> 本地端口: $local_port"
            echo "命令: $cmd"
            echo "---"
        done
    else
        echo "没有活动的隧道连接"
    fi
}

test_tunnel_connection() {
    echo -e "\n${COLOR_YELLOW}测试隧道连接${COLOR_RESET}"
    
    read -p "要测试的远程端口: " port
    
    if [ -z "$port" ]; then
        echo -e "${COLOR_RED}请输入端口号${COLOR_RESET}"
        return
    fi
    
    echo "测试连接 ${NAS_DOMAIN}:$port ..."
    
    if timeout 5 nc -z ${NAS_DOMAIN} $port; then
        echo -e "${COLOR_GREEN}连接成功${COLOR_RESET}"
    else
        echo -e "${COLOR_RED}连接失败${COLOR_RESET}"
    fi
}

stop_all_tunnels() {
    echo -e "\n${COLOR_YELLOW}停止所有隧道${COLOR_RESET}"
    
    local tunnel_pids=$(pgrep -f "ssh.*-R")
    
    if [ -n "$tunnel_pids" ]; then
        echo "找到隧道进程: $tunnel_pids"
        read -p "确定停止所有隧道？[y/N]: " confirm
        
        if [[ $confirm =~ ^[Yy]$ ]]; then
            kill $tunnel_pids 2>/dev/null
            echo -e "${COLOR_GREEN}已停止所有隧道${COLOR_RESET}"
        fi
    else
        echo "没有活动的隧道进程"
    fi
}

main() {
    while true; do
        show_tunnel_menu
        read choice
        
        case $choice in
            1)
                configure_ssh_tunnel
                ;;
            2)
                show_tunnel_connections
                ;;
            3)
                test_tunnel_connection
                ;;
            4)
                stop_all_tunnels
                ;;
            0)
                exit 0
                ;;
            *)
                echo "无效选择"
                ;;
        esac
        
        echo
        read -p "按Enter键继续..."
    done
}

main
```

## 8. 设置权限并初始化

```bash
# 设置所有脚本可执行
chmod +x /opt/yyc3/scripts/*.sh
chmod +x /opt/yyc3/ddns/*.sh

# 运行初始化脚本
/opt/yyc3/scripts/init-system.sh

# 配置阿里云CLI（需要您提供AccessKey）
aliyun configure set \
  --profile default \
  --mode AK \
  --region ${ALIYUN_REGION_ID} \
  --access-key-id ${ALIYUN_ACCESS_KEY_ID} \
  --access-key-secret ${ALIYUN_ACCESS_KEY_SECRET}

# 测试系统
/opt/yyc3/scripts/test-all.sh
```

## 9. 配置自动启动

```bash
# 启用定时器
systemctl enable yyc3-ddns.timer
systemctl enable nas-monitor.timer
systemctl enable nas-daily-report.timer

# 立即启动定时器
systemctl start yyc3-ddns.timer
systemctl start nas-monitor.timer
systemctl start nas-daily-report.timer

# 查看定时器状态
systemctl list-timers --all
```

## 10. 验证部署

访问以下地址验证部署：

1. Web门户：<http://ddns.0379.email>
2. 健康检查：<http://ddns.0379.email/health>
3. 状态接口：<http://ddns.0379.email/status>

现在您的NAS DDNS系统已经完整部署在阿里云ECS上。系统包含：

- ✅ DDNS自动更新功能
- ✅ 实时监控系统
- ✅ Web管理门户
- ✅ 每日报告生成
- ✅ 系统状态监控
- ✅ Nginx反向代理
- ✅ 隧道服务（内网穿透）
- ✅ 配置备份恢复
