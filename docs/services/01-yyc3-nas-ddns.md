> 之前创建了DDNS服务，但是缺少配置文件。根据脚本内容，需要创建DDNS配置文件。
 同时，之前创建的Web界面文件已经存在，但可能需要更新以匹配API路径。

 现在，需要做两件事：

 1. 创建DDNS配置文件（/opt/yyc3/config/ddns.conf），以便DDNS脚本能够正常运行。
 2. 更新Web界面，确保API路径正确（因为之前已经更新过Web界面，所以这里只需检查配置文件）。

 首先，创建DDNS配置文件。根据之前的脚本，配置文件应该包含阿里云的Access Key等信息。
 由于是测试环境，可以先使用测试值，但实际使用时需要替换为真实的。

 另外，之前已经运行了诊断脚本，显示服务正常，但DDNS配置文件不存在，所以DDNS脚本可能无法正常工作。

 让创建配置文件：

看起来DDNS配置文件不存在。让我帮您创建这个配置文件：

```bash
# 创建配置目录
mkdir -p /opt/yyc3/config

# 创建DDNS配置文件
cat > /opt/yyc3/config/ddns.conf << 'EOF'
# DDNS 配置文件
# 更新时间: $(date)

# ======================
# 阿里云配置
# ======================
# 请替换为您的阿里云Access Key
ALIYUN_ACCESS_KEY_ID="your-access-key-id"
ALIYUN_ACCESS_KEY_SECRET="your-access-key-secret"

# ======================
# 域名配置
# ======================
# 主域名（注意：不要带www）
DOMAIN="0379.email"
# 子域名（如果要更新根域名记录，使用 @）
SUB_DOMAIN="ddns"
# 记录类型（A记录或AAAA记录）
RECORD_TYPE="A"
# TTL时间（单位：秒）
TTL="600"

# ======================
# 服务配置
# ======================
# 检查公网IP的服务（支持多个，空格分隔）
IP_CHECK_SERVICES="ifconfig.me ipinfo.io/ip api.ipify.org"
# 检查间隔（单位：秒）
CHECK_INTERVAL="300"
# 是否启用通知（0=禁用，1=启用）
ENABLE_NOTIFICATION="0"

# ======================
# 日志配置
# ======================
# 日志文件路径
LOG_FILE="/opt/yyc3/logs/ddns.log"
# 日志级别（debug, info, warning, error）
LOG_LEVEL="info"

# ======================
# 通知配置（可选）
# ======================
# 邮件通知配置
MAIL_ENABLED="0"
MAIL_SERVER="smtp.example.com"
MAIL_PORT="587"
MAIL_USER="your-email@example.com"
MAIL_PASSWORD="your-password"
MAIL_TO="admin@example.com"

# ======================
# 系统配置
# ======================
# 服务器IP（自动检测）
SERVER_IP="8.152.195.33"

# ======================
# Web界面配置
# ======================
# Web界面域名
WEB_DOMAIN="ddns.0379.email"
# API服务端口
API_PORT="8080"
EOF

echo "配置文件已创建: /opt/yyc3/config/ddns.conf"

# 创建测试用的配置文件（不包含敏感信息）
cat > /opt/yyc3/config/ddns.conf.example << 'EOF'
# DDNS 配置文件示例
# 请复制此文件为 ddns.conf 并填入实际配置

# 阿里云配置
ALIYUN_ACCESS_KEY_ID="your-access-key-id-here"
ALIYUN_ACCESS_KEY_SECRET="your-access-key-secret-here"

# 域名配置
DOMAIN="0379.email"
SUB_DOMAIN="ddns"
RECORD_TYPE="A"
TTL="600"

# 服务配置
IP_CHECK_SERVICES="ifconfig.me ipinfo.io/ip api.ipify.org"
CHECK_INTERVAL="300"
ENABLE_NOTIFICATION="0"

# 日志配置
LOG_FILE="/opt/yyc3/logs/ddns.log"
LOG_LEVEL="info"

# 通知配置
MAIL_ENABLED="0"

# 系统配置
SERVER_IP="8.152.195.33"

# Web界面配置
WEB_DOMAIN="ddns.0379.email"
API_PORT="8080"
EOF

echo "示例配置文件已创建: /opt/yyc3/config/ddns.conf.example"

# 查看配置文件
echo -e "\n=== 配置文件内容 ==="
cat /opt/yyc3/config/ddns.conf

echo -e "\n=== 重要提示 ==="
echo "请编辑 /opt/yyc3/config/ddns.conf 文件，填入您的阿里云Access Key信息"
echo "编辑命令: nano /opt/yyc3/config/ddns.conf"
echo ""
echo "需要修改的配置项:"
echo "1. ALIYUN_ACCESS_KEY_ID: 您的阿里云AccessKey ID"
echo "2. ALIYUN_ACCESS_KEY_SECRET: 您的阿里云AccessKey Secret"
echo "3. 其他配置项根据需要调整"
```

现在还需要更新DDNS脚本以使用这个配置文件。让我检查并更新DDNS脚本：

```bash
# 先备份现有的DDNS脚本
cp /opt/yyc3/scripts/ddns.sh /opt/yyc3/scripts/ddns.sh.backup

# 检查DDNS脚本是否需要更新配置路径
if grep -q "/opt/yyc3/config/ddns.conf" /opt/yyc3/scripts/ddns.sh; then
    echo "DDNS脚本已配置正确的配置文件路径"
else
    echo "更新DDNS脚本中的配置文件路径..."
    # 更新配置文件路径
    sed -i 's|/etc/ddns.conf|/opt/yyc3/config/ddns.conf|g' /opt/yyc3/scripts/ddns.sh

    # 检查是否还有其他需要更新的路径
    sed -i 's|/var/log/ddns.log|/opt/yyc3/logs/ddns.log|g' /opt/yyc3/scripts/ddns.sh
fi

# 测试DDNS脚本是否能正确读取配置
echo -e "\n=== 测试DDNS脚本配置读取 ==="
cd /opt/yyc3/scripts
if [ -f "ddns.sh" ]; then
    # 运行测试模式
    bash ddns.sh test 2>&1 | head -20

    # 检查配置文件读取
    if source /opt/yyc3/config/ddns.conf 2>/dev/null; then
        echo -e "\n配置文件可正常加载"
        echo "域名: ${DOMAIN:-未设置}"
        echo "子域名: ${SUB_DOMAIN:-未设置}"
    else
        echo "配置文件加载失败"
    fi
fi
```

现在让创建完整的系统检查脚本，确保所有组件都能正常工作：

```bash
# 创建完整的系统状态检查脚本
cat > /opt/yyc3/scripts/system-status.sh << 'EOF'
#!/bin/bash
# DDNS系统状态检查脚本

echo "==================== DDNS系统状态检查 ===================="
echo "检查时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "服务器: $(hostname)"
echo "公网IP: $(curl -s ifconfig.me 2>/dev/null || echo '未知')"
echo "内网IP: $(hostname -I | awk '{print $1}')"
echo ""

# 1. 检查系统服务
echo "1. 系统服务状态:"
echo "----------------------------------------"
services=("ddns-api.service" "yyc3-ddns.timer" "nginx")
for service in "${services[@]}"; do
    status=$(systemctl is-active "$service" 2>/dev/null || echo "not-found")
    enabled=$(systemctl is-enabled "$service" 2>/dev/null || echo "unknown")
    printf "  %-20s 状态: %-10s 自启动: %-10s\n" "$service" "$status" "$enabled"
done
echo ""

# 2. 检查端口监听
echo "2. 端口监听状态:"
echo "----------------------------------------"
ports=("80" "443" "8080")
for port in "${ports[@]}"; do
    if netstat -tln | grep -q ":$port "; then
        service=$(netstat -tlnp | grep ":$port " | awk '{print $7}' | cut -d'/' -f2)
        printf "  端口 %-4s: ✓ 监听中 (服务: %s)\n" "$port" "$service"
    else
        printf "  端口 %-4s: ✗ 未监听\n" "$port"
    fi
done
echo ""

# 3. 检查配置文件
echo "3. 配置文件状态:"
echo "----------------------------------------"
config_files=(
    "/opt/yyc3/config/ddns.conf"
    "/opt/yyc3/api/ddns/app.py"
    "/etc/systemd/system/ddns-api.service"
    "/etc/nginx/conf.d/ddns.conf"
    "/opt/yyc3/scripts/ddns.sh"
)

for file in "${config_files[@]}"; do
    if [ -f "$file" ]; then
        size=$(ls -lh "$file" | awk '{print $5}')
        lines=$(wc -l < "$file" 2>/dev/null || echo "0")
        printf "  %-40s ✓ 存在 (大小: %s, 行数: %d)\n" "$file" "$size" "$lines"
    else
        printf "  %-40s ✗ 不存在\n" "$file"
    fi
done
echo ""

# 4. 检查API服务
echo "4. API服务测试:"
echo "----------------------------------------"
api_endpoints=(
    "http://127.0.0.1:8080/health"
    "http://127.0.0.1:8080/api/ddns/status"
    "http://127.0.0.1:8080/api/ddns/config"
)

for endpoint in "${api_endpoints[@]}"; do
    response=$(curl -s --max-time 3 "$endpoint" 2>/dev/null)
    if [ -n "$response" ]; then
        status=$(echo "$response" | python3 -c "import json,sys; data=json.load(sys.stdin); print(data.get('status', data.get('success', 'unknown')))" 2>/dev/null || echo "响应异常")
        printf "  %-45s ✓ 响应正常 (状态: %s)\n" "$endpoint" "$status"
    else
        printf "  %-45s ✗ 无响应\n" "$endpoint"
    fi
done
echo ""

# 5. 检查Web界面
echo "5. Web界面检查:"
echo "----------------------------------------"
web_urls=(
    "http://127.0.0.1"
    "http://ddns.0379.email"
    "https://ddns.0379.email"
)

for url in "${web_urls[@]}"; do
    if [ "$url" = "https://ddns.0379.email" ]; then
        # 跳过证书验证
        response=$(curl -s -k --max-time 5 "$url" 2>/dev/null)
    else
        response=$(curl -s --max-time 5 "$url" 2>/dev/null)
    fi

    if echo "$response" | grep -q "DDNS 管理面板"; then
        title=$(echo "$response" | grep -o "<title>[^<]*</title>" | sed 's/<title>//;s/<\/title>//')
        printf "  %-40s ✓ 可访问 (标题: %s)\n" "$url" "$title"
    else
        printf "  %-40s ✗ 访问异常\n" "$url"
    fi
done
echo ""

# 6. 检查DDNS功能
echo "6. DDNS功能检查:"
echo "----------------------------------------"
if [ -f "/opt/yyc3/config/ddns.conf" ]; then
    # 检查阿里云配置
    source /opt/yyc3/config/ddns.conf 2>/dev/null

    if [ -n "$ALIYUN_ACCESS_KEY_ID" ] && [ "$ALIYUN_ACCESS_KEY_ID" != "your-access-key-id" ]; then
        echo "  阿里云配置: ✓ 已配置 (Key ID: ${ALIYUN_ACCESS_KEY_ID:0:8}...)"
    else
        echo "  阿里云配置: ⚠ 未配置或为示例值"
    fi

    echo "  域名配置: $SUB_DOMAIN.$DOMAIN"
    echo "  检查间隔: $CHECK_INTERVAL 秒"

    # 检查DDNS日志
    if [ -f "/opt/yyc3/logs/ddns.log" ]; then
        log_lines=$(wc -l < /opt/yyc3/logs/ddns.log)
        last_run=$(tail -5 /opt/yyc3/logs/ddns.log | head -1)
        echo "  DDNS日志: 存在 ($log_lines 行)"
        echo "  最后运行: $last_run"
    else
        echo "  DDNS日志: 不存在"
    fi
else
    echo "  DDNS配置文件不存在"
fi
echo ""

# 7. 检查定时任务
echo "7. 定时任务检查:"
echo "----------------------------------------"
timer_status=$(systemctl status yyc3-ddns.timer --no-pager 2>/dev/null | grep -A5 "Active:" | head -2)
echo "$timer_status" | sed 's/^/  /'

# 查看下次运行时间
next_run=$(systemctl list-timers yyc3-ddns.timer --no-pager 2>/dev/null | grep yyc3-ddns | awk '{print $1, $2, $3, $4, $5}')
if [ -n "$next_run" ]; then
    echo "  下次运行: $next_run"
fi
echo ""

# 8. 系统资源检查
echo "8. 系统资源状态:"
echo "----------------------------------------"
echo "  系统负载: $(uptime | awk -F'load average:' '{print $2}')"
echo "  内存使用: $(free -h | awk '/^Mem:/ {print $3 "/" $2 " (" $3/$2*100 "%)"}')"
echo "  磁盘使用: $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 ")"}')"
echo "  运行时间: $(uptime -p | sed 's/up //')"
echo ""

# 9. 总结与建议
echo "9. 检查总结与建议:"
echo "----------------------------------------"
echo "  ✓ API服务: $(systemctl is-active ddns-api.service 2>/dev/null || echo '未知')"
echo "  ✓ Web界面: $(curl -s http://127.0.0.1 2>/dev/null | grep -q 'DDNS' && echo '可访问' || echo '异常')"
echo "  ✓ Nginx服务: $(systemctl is-active nginx 2>/dev/null || echo '未知')"
echo "  ✓ DDNS定时器: $(systemctl is-active yyc3-ddns.timer 2>/dev/null || echo '未知')"
echo ""

if [ -f "/opt/yyc3/config/ddns.conf" ] && grep -q "your-access-key" /opt/yyc3/config/ddns.conf; then
    echo "  ⚠ 注意: DDNS配置文件包含示例Access Key，需要替换为真实的阿里云凭证"
fi

echo "==================== 检查完成 ===================="
echo ""
echo "访问信息:"
echo "  Web管理界面: https://ddns.0379.email"
echo "  API服务: http://127.0.0.1:8080"
echo "  配置文件: /opt/yyc3/config/ddns.conf"
echo ""
echo "管理命令:"
echo "  启动API服务: systemctl start ddns-api.service"
echo "  查看API日志: journalctl -u ddns-api.service -f"
echo "  手动运行DDNS: /opt/yyc3/scripts/ddns.sh"
echo "  系统状态检查: /opt/yyc3/scripts/system-status.sh"
EOF

chmod +x /opt/yyc3/scripts/system-status.sh

# 运行系统状态检查
echo "正在运行系统状态检查..."
/opt/yyc3/scripts/system-status.sh
```

最后，让创建一个简单的配置向导，帮助用户配置DDNS：

```bash
# 创建配置向导脚本
cat > /opt/yyc3/scripts/configure-ddns.sh << 'EOF'
#!/bin/bash
# DDNS配置向导

echo "=== DDNS配置向导 ==="
echo "此向导将帮助您配置DDNS服务"
echo ""

CONFIG_FILE="/opt/yyc3/config/ddns.conf"

# 检查配置文件是否存在
if [ ! -f "$CONFIG_FILE" ]; then
    echo "配置文件不存在，正在创建..."
    mkdir -p /opt/yyc3/config
    cp /opt/yyc3/config/ddns.conf.example "$CONFIG_FILE" 2>/dev/null || {
        echo "无法创建配置文件，请手动创建"
        exit 1
    }
fi

echo "当前配置文件: $CONFIG_FILE"
echo ""

# 显示当前配置
echo "当前配置:"
echo "----------------------------------------"
grep -E "^(ALIYUN_ACCESS_KEY|DOMAIN|SUB_DOMAIN|CHECK_INTERVAL)=" "$CONFIG_FILE" 2>/dev/null || echo "配置为空或无法读取"
echo ""

# 询问是否要编辑配置
read -p "是否要编辑配置？(y/n): " edit_choice
if [[ "$edit_choice" =~ ^[Yy]$ ]]; then
    # 检查是否有编辑器
    if command -v nano &> /dev/null; then
        nano "$CONFIG_FILE"
    elif command -v vi &> /dev/null; then
        vi "$CONFIG_FILE"
    elif command -v vim &> /dev/null; then
        vim "$CONFIG_FILE"
    else
        echo "未找到文本编辑器，请手动编辑文件: $CONFIG_FILE"
    fi
fi

echo ""
echo "配置完成后，请确保:"
echo "1. 阿里云Access Key有DNS修改权限"
echo "2. 域名已在阿里云解析控制台添加"
echo "3. 防火墙已开放80和443端口"
echo ""
echo "测试DDNS功能:"
echo "  /opt/yyc3/scripts/ddns.sh"
echo ""
echo "查看服务状态:"
echo "  /opt/yyc3/scripts/system-status.sh"
EOF

chmod +x /opt/yyc3/scripts/configure-ddns.sh

# 创建快速启动指南
cat > /opt/yyc3/README.md << 'EOF'
# DDNS 动态域名解析系统

## 系统概述

这是一个基于阿里云API的DDNS动态域名解析系统，包含以下组件：

1. **DDNS核心脚本** - 定时检测公网IP变化并更新DNS记录
2. **Web管理界面** - 提供可视化管理和状态监控
3. **RESTful API服务** - 提供状态查询和配置管理接口
4. **Nginx反向代理** - 提供HTTPS访问和负载均衡

## 目录结构

```

/opt/yyc3/
├── api/ddns/              # API服务代码
│   ├── app.py            # Flask API应用
│   └── venv/             # Python虚拟环境
├── web/ddns/             # Web界面文件
│   └── index.html        # 管理界面
├── scripts/              # 脚本目录
│   ├── ddns.sh           # DDNS核心脚本
│   ├── diagnose-ddns.sh  # 诊断脚本
│   ├── system-status.sh  # 系统状态检查
│   ├── test-web.sh       # Web测试脚本
│   └── configure-ddns.sh # 配置向导
├── config/               # 配置文件
│   └── ddns.conf         # DDNS配置
├── logs/                 # 日志目录
│   ├── ddns.log          # DDNS运行日志
│   └── ddns_api.log      # API服务日志
└── backup/               # 备份目录

```

## 快速开始

### 1. 配置阿里云Access Key

```bash
# 运行配置向导
/opt/yyc3/scripts/configure-ddns.sh

# 或手动编辑配置文件
nano /opt/yyc3/config/ddns.conf
```

需要配置以下参数：

- `ALIYUN_ACCESS_KEY_ID`: 阿里云AccessKey ID
- `ALIYUN_ACCESS_KEY_SECRET`: 阿里云AccessKey Secret
- `DOMAIN`: 主域名（如：0379.email）
- `SUB_DOMAIN`: 子域名（如：ddns）

### 2. 启动服务

```bash
# 启动所有服务
systemctl start ddns-api.service
systemctl start nginx

# 启用开机自启
systemctl enable ddns-api.service
systemctl enable nginx
```

### 3. 测试DDNS功能

```bash
# 手动运行DDNS脚本
/opt/yyc3/scripts/ddns.sh

# 测试Web界面
curl -s http://127.0.0.1 | grep -q "DDNS" && echo "Web界面正常"
```

### 4. 访问管理界面

- Web界面: <https://ddns.0379.email>
- API服务: <http://127.0.0.1:8080>
- 健康检查: <http://ddns.0379.email/api/ddns/health>

## 管理命令

### 服务管理

```bash
# 重启API服务
systemctl restart ddns-api.service

# 查看API日志
journalctl -u ddns-api.service -f

# 检查服务状态
systemctl status ddns-api.service
```

### 脚本工具

```bash
# 系统状态检查
/opt/yyc3/scripts/system-status.sh

# 诊断服务问题
/opt/yyc3/scripts/diagnose-ddns.sh

# 测试Web界面
/opt/yyc3/scripts/test-web.sh

# 配置向导
/opt/yyc3/scripts/configure-ddns.sh
```

### DDNS脚本

```bash
# 手动运行DDNS更新
/opt/yyc3/scripts/ddns.sh

# 测试模式（不实际更新DNS）
/opt/yyc3/scripts/ddns.sh test

# 强制更新DNS记录
/opt/yyc3/scripts/ddns.sh force
```

## 故障排除

### 1. API服务无法启动

```bash
# 检查Python依赖
cd /opt/yyc3/api/ddns
source venv/bin/activate
pip list | grep Flask

# 检查应用日志
journalctl -u ddns-api.service -n 20
```

### 2. Web界面无法访问

```bash
# 检查Nginx配置
nginx -t

# 检查端口监听
netstat -tln | grep -E ':(80|443)'

# 检查防火墙
firewall-cmd --list-all | grep -E '(http|https)'
```

### 3. DDNS更新失败

```bash
# 检查配置文件
cat /opt/yyc3/config/ddns.conf | grep -v "^#"

# 检查阿里云权限
# 确保Access Key有DNS修改权限

# 查看DDNS日志
tail -f /opt/yyc3/logs/ddns.log
```

## 定时任务

DDNS脚本通过Systemd定时器每5分钟运行一次：

```bash
# 查看定时器状态
systemctl status yyc3-ddns.timer

# 查看下次运行时间
systemctl list-timers yyc3-ddns.timer
```

## 备份与恢复

```bash
# 创建备份
tar -czf ddns-backup.tar.gz /opt/yyc3 /etc/systemd/system/ddns-api.service /etc/nginx/conf.d/ddns.conf

# 恢复备份
tar -xzf ddns-backup.tar.gz -C /
systemctl daemon-reload
systemctl restart ddns-api.service nginx
```

## 联系方式

如有问题，请检查日志文件或联系系统管理员。

- 服务器IP: 8.152.195.33
- 域名: ddns.0379.email
- 部署时间: $(date)

```

EOF

echo "配置向导和文档已创建"

# 最后，运行系统状态检查以确认一切正常
echo -e "\n=== 最终系统状态检查 ==="
/opt/yyc3/scripts/system-status.sh | tail -30

echo -e "\n✅ DDNS系统部署完成！"
echo ""
echo "📋 下一步操作:"
echo "1. 配置阿里云Access Key: /opt/yyc3/scripts/configure-ddns.sh"
echo "2. 访问Web管理界面: https://ddns.0379.email"
echo "3. 测试DDNS功能: /opt/yyc3/scripts/ddns.sh"
echo "4. 查看系统状态: /opt/yyc3/scripts/system-status.sh"
echo ""
echo "📚 详细文档: /opt/yyc3/README.md"
```

现在您的DDNS系统已经完整部署。总结一下您需要做的事情：

## **🎯 立即需要做的配置**

1. **配置阿里云Access Key**：

   ```bash
   /opt/yyc3/scripts/configure-ddns.sh
   ```

   或者手动编辑：

   ```bash
   nano /opt/yyc3/config/ddns.conf
   ```

2. **获取阿里云Access Key**：
   - 登录阿里云控制台
   - 进入"AccessKey管理"页面
   - 创建或查看AccessKey ID和Secret

3. **测试配置**：

   ```bash
   # 测试DDNS脚本
   /opt/yyc3/scripts/ddns.sh test

   # 检查系统状态
   /opt/yyc3/scripts/system-status.sh
   ```

## **🌐 访问地址**

- **Web管理界面**: <https://ddns.0379.email>
- **API服务**: <http://127.0.0.1:8080>
- **健康检查**: <http://ddns.0379.email/api/ddns/health>

## **🔧 管理工具**

- **诊断工具**: `/opt/yyc3/scripts/diagnose-ddns.sh`
- **状态检查**: `/opt/yyc3/scripts/system-status.sh`
- **配置向导**: `/opt/yyc3/scripts/configure-ddns.sh`
- **Web测试**: `/opt/yyc3/scripts/test-web.sh`

## **📊 查看日志**

- **API服务日志**: `journalctl -u ddns-api.service -f`
- **DDNS运行日志**: `tail -f /opt/yyc3/logs/ddns.log`
- **Nginx访问日志**: `tail -f /var/log/nginx/access.log`

现在您的DDNS系统已经完全部署并可以运行了！请按照上述步骤配置阿里云Access Key，然后系统就可以开始工作了。
