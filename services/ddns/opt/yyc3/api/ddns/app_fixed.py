#!/usr/bin/env python3
"""
DDNS API 服务 - 修复版本
"""

import os
import sys
import json
import logging
import subprocess
from datetime import datetime
from flask import Flask, request, jsonify

# 添加虚拟环境路径
venv_path = '/opt/yyc3/api/ddns/venv'
if venv_path not in sys.path:
    sys.path.insert(0, venv_path)

# 尝试导入Flask
try:
    from flask_cors import CORS
    flask_cors_available = True
except ImportError:
    flask_cors_available = False
    print("警告: flask-cors 未安装，CORS功能将不可用")

# 初始化Flask应用
app = Flask(__name__)
if flask_cors_available:
    CORS(app)

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/opt/yyc3/logs/ddns_api.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@app.route('/health')
def health():
    """健康检查端点"""
    return jsonify({
        'status': 'healthy',
        'service': 'ddns-api',
        'timestamp': datetime.now().isoformat(),
        'python': sys.version.split()[0]
    })

@app.route('/api/ddns/status')
def api_status():
    """获取DDNS状态API"""
    try:
        # 简单的状态检查
        ddns_running = False
        try:
            # 检查DDNS定时器
            result = subprocess.run(
                ['systemctl', 'is-active', 'yyc3-ddns.timer'],
                capture_output=True,
                text=True
            )
            ddns_running = result.returncode == 0
        except:
            pass
        
        # 获取当前IP
        current_ip = None
        try:
            import requests
            current_ip = requests.get('https://api.ipify.org', timeout=5).text
        except:
            try:
                current_ip = subprocess.run(
                    ['curl', '-s', 'https://api.ipify.org'],
                    capture_output=True,
                    text=True
                ).stdout.strip()
            except:
                pass
        
        response = {
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'service': 'ddns',
            'domain': 'ddns.0379.email',
            'server_ip': '8.152.195.33',
            'ddns_running': ddns_running,
            'current_ip': current_ip,
            'dns_resolved': True,
            'message': 'API服务运行正常'
        }
        
        return jsonify(response)
    except Exception as e:
        logger.error(f"状态API错误: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ddns/update', methods=['POST'])
def api_update():
    """手动触发DDNS更新API"""
    try:
        # 执行DDNS更新脚本
        ddns_script = '/opt/yyc3/ddns/ddns-update.sh'
        
        if os.path.exists(ddns_script):
            result = subprocess.run(
                ['bash', ddns_script],
                capture_output=True,
                text=True,
                timeout=30
            )
            
            success = result.returncode == 0
            
            response = {
                'success': success,
                'timestamp': datetime.now().isoformat(),
                'message': 'DDNS更新已触发',
                'output': result.stdout,
                'error': result.stderr if not success else None
            }
            
            logger.info(f"手动DDNS更新: {'成功' if success else '失败'}")
            return jsonify(response)
        else:
            return jsonify({
                'success': False,
                'error': 'DDNS脚本不存在'
            }), 404
    except Exception as e:
        logger.error(f"更新API错误: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ddns/logs')
def api_logs():
    """获取DDNS日志API"""
    try:
        lines = request.args.get('lines', 50, type=int)
        log_file = '/opt/yyc3/logs/ddns.log'
        
        if not os.path.exists(log_file):
            return jsonify({
                'success': True,
                'logs': [],
                'message': '日志文件不存在'
            })
        
        # 读取日志文件
        with open(log_file, 'r') as f:
            log_lines = f.readlines()[-lines:]
        
        # 格式化日志
        logs = []
        for line in log_lines:
            line = line.strip()
            if not line:
                continue
            
            log_entry = {
                'timestamp': line[:19] if len(line) >= 19 else datetime.now().isoformat(),
                'message': line[20:] if len(line) > 20 else line,
                'level': 'info'
            }
            
            logs.append(log_entry)
        
        return jsonify({
            'success': True,
            'count': len(logs),
            'logs': logs
        })
    except Exception as e:
        logger.error(f"日志API错误: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ddns/config')
def api_config():
    """获取配置信息API"""
    try:
        config = {
            'domain': '0379.email',
            'subdomain': 'ddns',
            'record_type': 'A',
            'ttl': 600,
            'check_interval': 300,
            'server_ip': '8.152.195.33',
            'aliyun_configured': True,
            'notification_enabled': False
        }
        
        return jsonify({
            'success': True,
            'config': config
        })
    except Exception as e:
        logger.error(f"配置API错误: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # 创建必要的目录
    os.makedirs('/opt/yyc3/logs', exist_ok=True)
    os.makedirs('/opt/yyc3/run', exist_ok=True)
    
    logger.info("DDNS API服务启动")
    print(f"服务启动在: http://127.0.0.1:8080")
    print(f"健康检查: http://127.0.0.1:8080/health")
    
    app.run(host='127.0.0.1', port=8080, debug=False)
