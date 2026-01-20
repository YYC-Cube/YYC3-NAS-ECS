cat > /opt/yyc3/scripts/nas-manager.sh << 'EOF'
#!/bin/bash

# NAS访问管理系统
# 用于管理 ddns.0379.email 的DDNS和访问

# 配置
DOMAIN="ddns.0379.email"
CLOUD_IP="8.152.195.33"
LOCAL_NAS_IP="192.168.3.45"
DDNS_SCRIPT="/opt/yyc3/ddns/ddns-simple.sh"
NGINX_CONFIG="/etc/nginx/sites-available/ddns.0379.email"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数：打印带颜色的消息
print_color() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 函数：检查服务状态
check_service() {
    local service=$1
    if systemctl is-active --quiet "$service"; then
        print_color $GREEN "✅ $service: 运行中"
    else
        print_color $RED "❌ $service: 停止"
    fi
}

# 函数：检查端口
check_port() {
    local port=$1
    local service=$2
    if ss -tln | grep -q ":$port "; then
        print_color $GREEN "✅ 端口 $port ($service): 监听中"
    else
        print_color $RED "❌ 端口 $port ($service): 未监听"
    fi
}

# 函数：检查DNS解析
check_dns() {
    print_color $BLUE "=== DNS解析检查 ==="
    
    # 使用多个DNS服务器检查
    local dns_servers=("8.8.8.8" "114.114.114.114" "223.5.5.5")
    local resolved_ip=""
    
    for dns in "${dns_servers[@]}"; do
        local ip=$(dig +short @$dns $DOMAIN | head -1)
        if [ -n "$ip" ]; then
            resolved_ip=$ip
            print_color $GREEN "  DNS服务器 $dns: $DOMAIN → $ip"
        else
            print_color $YELLOW "  DNS服务器 $dns: 解析失败"
        fi
    done
    
    if [ "$resolved_ip" = "$CLOUD_IP" ]; then
        print_color $GREEN "✅ DNS解析正确: $DOMAIN → $CLOUD_IP"
    else
        print_color $RED "❌ DNS解析错误: 期望 $CLOUD_IP, 实际 $resolved_ip"
    fi
}

# 函数：运行DDNS更新
run_ddns() {
    print_color $BLUE "=== 运行DDNS更新 ==="
    
    if [ -f "$DDNS_SCRIPT" ]; then
        bash "$DDNS_SCRIPT"
    else
        print_color $RED "DDNS脚本不存在: $DDNS_SCRIPT"
    fi
}

# 函数：测试访问
test_access() {
    print_color $BLUE "=== 访问测试 ==="
    
    # 测试HTTP访问
    print_color $YELLOW "测试HTTP访问..."
    local http_status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "http://$DOMAIN/health")
    
    if [ "$http_status" = "200" ]; then
        print_color $GREEN "✅ HTTP访问正常 (状态码: $http_status)"
        
        # 获取健康信息
        local health_info=$(curl -s --connect-timeout 3 "http://$DOMAIN/health")
        echo "健康信息: $health_info"
    else
        print_color $RED "❌ HTTP访问失败 (状态码: $http_status)"
    fi
    
    # 测试Nginx配置
    print_color $YELLOW "\n测试Nginx配置..."
    if nginx -t 2>/dev/null; then
        print_color $GREEN "✅ Nginx配置正确"
    else
        print_color $RED "❌ Nginx配置错误"
    fi
}

# 函数：显示系统信息
show_info() {
    clear
    print_color $BLUE "╔══════════════════════════════════════════════════════════╗"
    print_color $BLUE "║              NAS 访问管理系统 - ddns.0379.email          ║"
    print_color $BLUE "╠══════════════════════════════════════════════════════════╣"
    print_color $BLUE "║  云服务器: 8.152.195.33   本地NAS: 192.168.3.45         ║"
    print_color $BLUE "╚══════════════════════════════════════════════════════════╝"
    echo ""
}

# 函数：显示菜单
show_menu() {
    echo "请选择操作:"
    echo "1. 检查所有服务状态"
    echo "2. 运行DDNS更新"
    echo "3. 测试域名访问"
    echo "4. 检查DNS解析"
    echo "5. 重启Nginx服务"
    echo "6. 查看DDNS日志"
    echo "7. 手动更新DNS记录"
    echo "8. 查看系统信息"
    echo "0. 退出"
    echo ""
    read -p "请输入选项 [0-8]: " choice
}

# 主程序
main() {
    while true; do
        show_info
        show_menu
        
        case $choice in
            1)
                print_color $BLUE "=== 服务状态检查 ==="
                check_service nginx
                check_service yyc3-ddns.timer
                check_port 80 "HTTP"
                check_port 443 "HTTPS"
                check_dns
                ;;
            2)
                run_ddns
                ;;
            3)
                test_access
                ;;
            4)
                check_dns
                ;;
            5)
                print_color $BLUE "重启Nginx服务..."
                systemctl restart nginx
                sleep 2
                check_service nginx
                ;;
            6)
                print_color $BLUE "=== DDNS日志 ==="
                journalctl -u yyc3-ddns.service -n 20 --no-pager
                ;;
            7)
                print_color $BLUE "手动更新DNS记录..."
                read -p "请输入新的IP地址 [默认: $CLOUD_IP]: " new_ip
                new_ip=${new_ip:-$CLOUD_IP}
                
                # 使用阿里云CLI更新
                if command -v aliyun &> /dev/null; then
                    aliyun alidns UpdateDomainRecord \
                        --DomainName "0379.email" \
                        --RR "nas" \
                        --Type "A" \
                        --Value "$new_ip" \
                        --TTL 300
                    print_color $GREEN "DNS记录已更新: ddns.0379.email → $new_ip"
                else
                    print_color $RED "阿里云CLI未安装"
                fi
                ;;
            8)
                print_color $BLUE "=== 系统信息 ==="
                echo "主机名: $(hostname)"
                echo "IP地址: $(hostname -I)"
                echo "系统: $(cat /etc/redhat-release)"
                echo "内核: $(uname -r)"
                echo "内存: $(free -h | awk '/^Mem:/ {print $3"/"$2}')"
                echo "磁盘: $(df -h / | awk 'NR==2 {print $3"/"$2}')"
                echo "运行时间: $(uptime -p)"
                ;;
            0)
                print_color $GREEN "退出系统"
                exit 0
                ;;
            *)
                print_color $RED "无效选项"
                ;;
        esac
        
        echo ""
        read -p "按Enter键继续..."
    done
}

# 运行主程序
main
EOF

chmod +x /opt/yyc3/scripts/nas-manager.sh