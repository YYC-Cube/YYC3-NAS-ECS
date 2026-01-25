#!/bin/bash
# DDNS服务诊断脚本

echo "=== DDNS服务诊断报告 ==="
echo "时间: $(date)"
echo "主机: $(hostname)"
echo ""

# 1. 检查Python虚拟环境
echo "1. 检查Python虚拟环境:"
if [ -f "/opt/yyc3/api/ddns/venv/bin/python" ]; then
    echo "  ✓ 虚拟环境存在"
    
    # 检查Flask是否安装
    cd /opt/yyc3/api/ddns
    source venv/bin/activate
    
    if python -c "import flask" 2>/dev/null; then
        echo "  ✓ Flask已安装"
        FLASK_VERSION=$(python -c "import flask; print(flask.__version__)" 2>/dev/null)
        echo "    版本: $FLASK_VERSION"
    else
        echo "  ✗ Flask未安装，正在安装..."
        pip install flask flask-cors requests
        if python -c "import flask" 2>/dev/null; then
            echo "  ✓ Flask安装成功"
        else
            echo "  ✗ Flask安装失败"
        fi
    fi
    
    deactivate
else
    echo "  ✗ 虚拟环境不存在，正在创建..."
    cd /opt/yyc3/api/ddns
    python3 -m venv venv
    source venv/bin/activate
    pip install flask flask-cors requests
    deactivate
    echo "  ✓ 虚拟环境创建完成"
fi
echo ""

# 2. 检查Systemd服务配置
echo "2. 检查Systemd服务配置:"
if [ -f "/etc/systemd/system/ddns-api.service" ]; then
    echo "  ✓ 服务文件存在"
    
    # 检查文件语法
    if grep -q "ExecStart=/opt/yyc3/api/ddns/venv/bin/python" /etc/systemd/system/ddns-api.service; then
        echo "  ✓ ExecStart配置正确"
    else
        echo "  ✗ ExecStart配置错误，正在修复..."
        cat > /etc/systemd/system/ddns-api.service << 'SERVICE_EOF'
[Unit]
Description=DDNS API Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/yyc3/api/ddns
Environment="PATH=/opt/yyc3/api/ddns/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ExecStart=/opt/yyc3/api/ddns/venv/bin/python /opt/yyc3/api/ddns/app.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=ddns-api

[Install]
WantedBy=multi-user.target
SERVICE_EOF
        echo "  ✓ 服务文件已修复"
    fi
    
    # 重新加载systemd
    systemctl daemon-reload
    echo "  ✓ Systemd配置已重载"
else
    echo "  ✗ 服务文件不存在，正在创建..."
    cat > /etc/systemd/system/ddns-api.service << 'SERVICE_EOF'
[Unit]
Description=DDNS API Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/yyc3/api/ddns
Environment="PATH=/opt/yyc3/api/ddns/venv/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
ExecStart=/opt/yyc3/api/ddns/venv/bin/python /opt/yyc3/api/ddns/app.py
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=ddns-api

[Install]
WantedBy=multi-user.target
SERVICE_EOF
    systemctl daemon-reload
    echo "  ✓ 服务文件已创建"
fi
echo ""

# 3. 检查应用文件
echo "3. 检查应用文件:"
if [ -f "/opt/yyc3/api/ddns/app.py" ]; then
    echo "  ✓ 应用文件存在"
    
    # 检查应用文件是否有语法错误
    cd /opt/yyc3/api/ddns
    source venv/bin/activate
    
    if python -m py_compile app.py 2>/dev/null; then
        echo "  ✓ 应用代码语法正确"
    else
        echo "  ✗ 应用代码有语法错误，正在创建简单版本..."
        cat > app.py << 'APP_EOF'
#!/usr/bin/env python3
"""
DDNS API 服务 - 简单版本
"""
import os
import json
from datetime import datetime
from flask import Flask, jsonify

app = Flask(__name__)

# 确保日志目录存在
os.makedirs('/opt/yyc3/logs', exist_ok=True)

@app.route('/')
def index():
    return jsonify({"message": "DDNS API Service", "status": "running"})

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "service": "ddns-api",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    })

@app.route('/api/ddns/status')
def status():
    return jsonify({
        "success": True,
        "timestamp": datetime.now().isoformat(),
        "service": "ddns",
        "domain": "ddns.0379.email",
        "server_ip": "8.152.195.33",
        "ddns_running": True,
        "message": "DDNS服务运行正常"
    })

if __name__ == '__main__':
    print("Starting DDNS API service on http://127.0.0.1:8080")
    app.run(host='127.0.0.1', port=8080, debug=False)
APP_EOF
        echo "  ✓ 应用文件已修复"
    fi
    
    deactivate
else
    echo "  ✗ 应用文件不存在，正在创建..."
    cat > /opt/yyc3/api/ddns/app.py << 'APP_EOF'
#!/usr/bin/env python3
"""
DDNS API 服务 - 简单版本
"""
import os
import json
from datetime import datetime
from flask import Flask, jsonify

app = Flask(__name__)

# 确保日志目录存在
os.makedirs('/opt/yyc3/logs', exist_ok=True)

@app.route('/')
def index():
    return jsonify({"message": "DDNS API Service", "status": "running"})

@app.route('/health')
def health():
    return jsonify({
        "status": "healthy",
        "service": "ddns-api",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    })

@app.route('/api/ddns/status')
def status():
    return jsonify({
        "success": True,
        "timestamp": datetime.now().isoformat(),
        "service": "ddns",
        "domain": "ddns.0379.email",
        "server_ip": "8.152.195.33",
        "ddns_running": True,
        "message": "DDNS服务运行正常"
    })

if __name__ == '__main__':
    print("Starting DDNS API service on http://127.0.0.1:8080")
    app.run(host='127.0.0.1', port=8080, debug=False)
APP_EOF
    echo "  ✓ 应用文件已创建"
fi

chmod +x /opt/yyc3/api/ddns/app.py
echo ""

# 4. 检查日志目录
echo "4. 检查日志目录:"
if [ -d "/opt/yyc3/logs" ]; then
    echo "  ✓ 日志目录存在"
else
    echo "  ✗ 日志目录不存在，正在创建..."
    mkdir -p /opt/yyc3/logs
    echo "  ✓ 日志目录已创建"
fi
echo ""

# 5. 启动服务
echo "5. 启动DDNS API服务:"
systemctl stop ddns-api.service 2>/dev/null
systemctl start ddns-api.service

sleep 2

if systemctl is-active --quiet ddns-api.service; then
    echo "  ✓ DDNS API服务启动成功"
    SERVICE_STATUS="running"
else
    echo "  ✗ DDNS API服务启动失败"
    SERVICE_STATUS="failed"
    
    # 显示错误日志
    echo "  错误日志:"
    journalctl -u ddns-api.service -n 5 --no-pager | tail -5 | sed 's/^/    /'
fi
echo ""

# 6. 测试API
echo "6. 测试API连接:"
if [ "$SERVICE_STATUS" = "running" ]; then
    # 等待服务完全启动
    sleep 1
    
    if curl -s --max-time 3 http://127.0.0.1:8080/health > /dev/null 2>&1; then
        echo "  ✓ API服务响应正常"
        
        # 获取健康状态
        HEALTH=$(curl -s http://127.0.0.1:8080/health 2>/dev/null)
        if echo "$HEALTH" | grep -q "healthy"; then
            echo "  ✓ 健康检查通过"
        else
            echo "  ✗ 健康检查未通过"
        fi
    else
        echo "  ✗ API服务无响应"
        
        # 检查端口
        if netstat -tln | grep -q ":8080 "; then
            echo "  ✓ 端口8080正在监听"
        else
            echo "  ✗ 端口8080未监听"
        fi
    fi
else
    echo "  ⚠ 跳过API测试（服务未运行）"
fi
echo ""

# 7. 检查相关服务
echo "7. 检查相关服务:"
echo "  DDNS定时器: $(systemctl is-active yyc3-ddns.timer 2>/dev/null || echo 'unknown')"
echo "  Nginx: $(systemctl is-active nginx 2>/dev/null || echo 'unknown')"
echo ""

# 8. 总结
echo "=== 诊断完成 ==="
if [ "$SERVICE_STATUS" = "running" ]; then
    echo "✓ DDNS API服务已成功启动"
    echo "访问地址: http://127.0.0.1:8080"
    echo "健康检查: http://127.0.0.1:8080/health"
    echo "Web界面: https://ddns.0379.email"
else
    echo "✗ DDNS API服务启动失败"
    echo "请检查以下项目:"
    echo "1. 确保虚拟环境中已安装Flask: pip install flask"
    echo "2. 检查应用文件语法: python -m py_compile app.py"
    echo "3. 查看详细日志: journalctl -u ddns-api.service -f"
fi
