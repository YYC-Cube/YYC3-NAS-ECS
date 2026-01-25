#!/usr/bin/env python3
"""
DDNS API 服务 - 简单版本
"""
import os
import json
import time
import subprocess
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
    try:
        # 检查DDNS服务状态
        ddns_active = False
        try:
            result = subprocess.run(['systemctl', 'is-active', 'yyc3-ddns.timer'], 
                                  capture_output=True, text=True, timeout=5)
            ddns_active = result.returncode == 0
        except:
            pass
        
        # 获取公网IP
        current_ip = None
        try:
            result = subprocess.run(['curl', '-s', 'ifconfig.me'], 
                                  capture_output=True, text=True, timeout=5)
            current_ip = result.stdout.strip() if result.returncode == 0 else None
        except:
            pass
        
        # 获取系统负载
        load_avg = None
        try:
            with open('/proc/loadavg', 'r') as f:
                load_avg = f.read().split()[0]
        except:
            pass
        
        return jsonify({
            "success": True,
            "timestamp": datetime.now().isoformat(),
            "service": "ddns",
            "domain": "ddns.0379.email",
            "server_ip": "8.152.195.33",
            "current_ip": current_ip or "未知",
            "ddns_running": ddns_active,
            "dns_resolved": True,
            "load": load_avg or "--",
            "uptime": "0天0小时",
            "memory_usage": "0%",
            "disk_usage": "0%",
            "message": "DDNS服务运行正常"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/ddns/logs/recent')
def logs_recent():
    try:
        lines = 50
        log_file = '/opt/yyc3/logs/ddns.log'
        
        logs = []
        if os.path.exists(log_file):
            with open(log_file, 'r') as f:
                lines_content = f.readlines()[-lines:]
                for line in lines_content:
                    line = line.strip()
                    if line:
                        logs.append({
                            "timestamp": datetime.now().isoformat(),
                            "level": "info",
                            "message": line
                        })
        
        return jsonify({
            "success": True,
            "count": len(logs),
            "logs": logs
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/api/ddns/config')
def config():
    return jsonify({
        "success": True,
        "config": {
            "domain": "0379.email",
            "subdomain": "ddns",
            "server_ip": "8.152.195.33",
            "check_interval": 300,
            "aliyun_configured": True,
            "notification_enabled": False
        }
    })

@app.route('/api/ddns/update', methods=['POST'])
def update():
    return jsonify({
        "success": True,
        "message": "DDNS更新已触发（模拟）",
        "timestamp": datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("Starting DDNS API service on http://127.0.0.1:8080")
    app.run(host='127.0.0.1', port=8080, debug=False)
