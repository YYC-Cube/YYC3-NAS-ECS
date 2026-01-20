依赖..."
    pip install -r requirements.txt
fi

# 启动服务
echo "启动API服务..."
if [ -f "/opt/yyc3/api/ddns/gunicorn_config.py" ]; then
    # 使用Gunicorn启动
    gunicorn --config /opt/yyc3/api/ddns/gunicorn_config.py app_fixed:app
else
    # 直接使用Flask启动
    python app_fixed.py
fi
EOF

chmod +x /opt/yyc3/scripts/start-ddns-api.sh

# 创建重启脚本
cat > /opt/yyc3/scripts/restart-ddns.sh << 'EOF'
#!/bin/bash
# DDNS服务重启脚本

echo "重启DDNS服务..."

# 重启API服务
systemctl restart ddns-api.service
sleep 2

# 检查状态
if systemctl is-active --quiet ddns-api.service; then
    echo "✓ DDNS API服务重启成功"
else
    echo "✗ DDNS API服务重启失败"
    journalctl -u ddns-api.service -n 10 --no-pager
fi

# 重启Nginx
systemctl reload nginx
echo "✓ Nginx配置已重载"

# 测试服务
echo -e "\n测试服务状态:"
curl -s http://127.0.0.1:8080/health | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(f'API状态: {data.get(\"status\")}')
except:
    print('API状态: 不可用')
"
EOF

chmod +x /opt/yyc3/scripts/restart-ddns.sh
```

## **第十步：最终测试**

```bash
# 运行重启脚本
/opt/yyc3/scripts/restart-ddns.sh

# 完整测试
echo "=== 完整系统测试 ==="

# 1. 测试API服务
echo "1. 测试API服务:"
API_RESPONSE=$(curl -s http://127.0.0.1:8080/health 2>/dev/null)
if [ $? -eq 0 ] && echo "$API_RESPONSE" | grep -q "healthy"; then
    echo "   ✓ API服务正常"
else
    echo "   ✗ API服务异常"
    echo "   尝试手动启动:"
    cd /opt/yyc3/api/ddns
    source venv/bin/activate
    timeout 5 python -c "
from app_fixed import app
print('Flask应用导入成功')
" 2>/dev/null && echo "   ✓ Python应用正常" || echo "   ✗ Python应用异常"
fi

# 2. 测试Nginx配置
echo -e "\n2. 测试Nginx配置:"
nginx -t 2>&1 | grep -q "test is successful" && echo "   ✓ Nginx配置正常" || {
    echo "   ✗ Nginx配置错误"
    nginx -t
}

# 3. 测试Web界面
echo -e "\n3. 测试Web界面:"
if curl -s -k https://ddns.0379.email/ 2>/dev/null | grep -q "DDNS 管理面板"; then
    echo "   ✓ Web界面可访问"
elif curl -s http://127.0.0.1/ 2>/dev/null | grep -q "DDNS 管理面板"; then
    echo "   ✓ Web界面可访问 (HTTP)"
else
    echo "   ⚠ Web界面访问测试失败"
    echo "   检查文件: ls -la /opt/yyc3/web/ddns/"
fi

# 4. 测试DDNS功能
echo -e "\n4. 测试DDNS功能:"
if systemctl is-active --quiet yyc3-ddns.timer; then
    echo "   ✓ DDNS定时器运行中"
    # 检查最近一次运行
    LAST_RUN=$(systemctl show yyc3-ddns.timer --property=LastTriggerUSec | cut -d= -f2)
    if [ "$LAST_RUN" != "0" ]; then
        echo "   ✓ DDNS最近运行时间: $LAST_RUN"
    fi
else
    echo "   ✗ DDNS定时器未运行"
fi

# 5. 检查日志文件
echo -e "\n5. 检查日志文件:"
LOGS_EXIST=true
for log in /opt/yyc3/logs/ddns_api.log /opt/yyc3/logs/ddns.log; do
    if [ -f "$log" ]; then
        echo "   ✓ $(basename $log): 存在 ($(wc -l < "$log") 行)"
    else
        echo "   ⚠ $(basename $log): 不存在"
        LOGS_EXIST=false
    fi
done

# 6. 生成访问信息
echo -e "\n6. 访问信息:"
echo "   API服务: http://127.0.0.1:8080"
echo "   Web界面: https://ddns.0379.email"
echo "   本地测试: curl -s http://127.0.0.1:8080/api/ddns/status | python3 -m json.tool"
echo "   查看日志: journalctl -u ddns-api.service -f"

# 7. 创建快速检查脚本
cat > /opt/yyc3/scripts/check-ddns.sh << 'EOF'
#!/bin/bash
# DDNS快速检查脚本

echo "=== DDNS服务状态检查 ==="
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo "主机: $(hostname)"
echo "IP: $(hostname -I | awk '{print $1}')"
echo ""

# 服务状态
echo "服务状态:"
echo "  DDNS API: $(systemctl is-active ddns-api.service 2>/dev/null || echo 'unknown')"
echo "  DDNS定时器: $(systemctl is-active yyc3-ddns.timer 2>/dev/null || echo 'unknown')"
echo "  Nginx: $(systemctl is-active nginx 2>/dev/null || echo 'unknown')"
echo ""

# API测试
echo "API测试:"
if curl -s --max-time 3 http://127.0.0.1:8080/health > /dev/null; then
    echo "  ✓ API服务响应正常"
    STATUS=$(curl -s http://127.0.0.1:8080/api/ddns/status 2>/dev/null | python3 -c "
import json, sys
try:
    data = json.load(sys.stdin)
    print(f'  DDNS状态: {\"运行中\" if data.get(\"ddns_running\") else \"停止\"}')
    print(f'  当前IP: {data.get(\"current_ip\", \"未知\")}')
except:
    print('  DDNS状态: 获取失败')
")
    echo "$STATUS"
else
    echo "  ✗ API服务无响应"
fi
echo ""

# 端口检查
echo "端口监听:"
netstat -tlnp 2>/dev/null | grep -E ':(80|443|8080)' | awk '{print "  " $4 " -> " $7}' | sort
echo ""

# 最近日志
echo "最近日志 (最后5行):"
journalctl -u ddns-api.service -n 5 --no-pager 2>/dev/null | tail -5 | sed 's/^/  /'
EOF

chmod +x /opt/yyc3/scripts/check-ddns.sh

echo -e "\n✓ 所有配置完成！"
echo "运行 '/opt/yyc3/scripts/check-ddns.sh' 检查服务状态"
```

现在你的DDNS API服务应该已经正常运行了。如果还有问题，请运行检查脚本查看详细状态：

```bash
/opt/yyc3/scripts/check-ddns.sh
```

主要修复了：
1. ✅ Systemd服务配置问题
2. ✅ Python虚拟环境路径问题
3. ✅ 应用启动失败问题
4. ✅ 提供了完整的测试和监控脚本
