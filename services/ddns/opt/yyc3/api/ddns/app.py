cat > /opt/yyc3/api/ddns/app.py << 'EOF'
#!/usr/bin/env python3
"""
DDNS API 服务
提供RESTful API接口管理DDNS服务
"""

import os
import json
import logging
import subprocess
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS

# 加载环境变量
from dotenv import load_dotenv
load_dotenv('/opt/yyc3/config/env.sh')

# 初始化Flask应用
app = Flask(__name__)
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

# 配置文件路径
CONFIG = {
    'ddns_script': '/opt/yyc3/ddns/ddns-update.sh',
    'status_file': '/opt/yyc3/run/ddns_status.json',
    'log_file': '/opt/yyc3/logs/ddns.log',
    'pid_file': '/opt/yyc3/run/ddns.pid'
}

def get_system_info():
    """获取系统信息"""
    try:
        # 获取负载
        with open('/proc/loadavg', 'r') as f:
            load = f.read().strip().split()[:3]
        
        # 获取运行时间
        with open('/proc/uptime', 'r') as f:
            uptime_seconds = float(f.read().split()[0])
            days = int(uptime_seconds // 86400)
            hours = int((uptime_seconds % 86400) // 3600)
            uptime = f"{days} 天 {hours} 小时"
        
        # 获取内存使用
        with open('/proc/meminfo', 'r') as f:
            mem_lines = f.readlines()
            mem_total = int(mem_lines[0].split()[1])
            mem_available = int(mem_lines[2].split()[1])
            mem_usage = ((mem_total - mem_available) / mem_total) * 100
        
        # 获取磁盘使用
        result = subprocess.run(['df', '-h', '/'], capture_output=True, text=True)
        disk_line = result.stdout.split('\n')[1]
        disk_usage = disk_line.split()[4].replace('%', '')
        
        return {
            'load': ' '.join(load),
            'uptime': uptime,
            'memory_usage': f"{mem_usage:.1f}%",
            'disk_usage': disk_usage
        }
    except Exception as e:
        logger.error(f"获取系统信息失败: {e}")
        return {}

def get_ddns_status():
    """获取DDNS状态"""
    status = {
        'ddns_running': False,
        'last_update': None,
        'current_ip': None,
        'dns_resolved': False
    }
    
    try:
        # 检查DDNS服务是否运行
        if os.path.exists(CONFIG['pid_file']):
            with open(CONFIG['pid_file'], 'r') as f:
                pid = f.read().strip()
                if os.path.exists(f'/proc/{pid}'):
                    status['ddns_running'] = True
        
        # 读取状态文件
        if os.path.exists(CONFIG['status_file']):
            with open(CONFIG['status_file'], 'r') as f:
                status_data = json.load(f)
                status.update(status_data)
        
        # 检查DNS解析
        try:
            import socket
            resolved_ip = socket.gethostbyname('ddns.0379.email')
            status['dns_resolved'] = True
            status['resolved_ip'] = resolved_ip
        except:
            status['dns_resolved'] = False
        
        # 获取当前公网IP
        try:
            import requests
            current_ip = requests.get('https://api.ipify.org', timeout=5).text
            status['current_ip'] = current_ip
        except:
            pass
        
    except Exception as e:
        logger.error(f"获取DDNS状态失败: {e}")
    
    return status

@app.route('/api/ddns/status', methods=['GET'])
def api_status():
    """获取DDNS状态API"""
    try:
        ddns_status = get_ddns_status()
        system_info = get_system_info()
        
        response = {
            'success': True,
            'timestamp': datetime.now().isoformat(),
            'service': 'ddns',
            'domain': 'ddns.0379.email',
            'server_ip': os.getenv('NAS_SERVER_IP', '8.152.195.33'),
            **ddns_status,
            **system_info
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
        result = subprocess.run(
            ['bash', CONFIG['ddns_script']],
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
    except subprocess.TimeoutExpired:
        logger.error("DDNS更新超时")
        return jsonify({
            'success': False,
            'error': '更新超时'
        }), 504
    except Exception as e:
        logger.error(f"更新API错误: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/ddns/logs', methods=['GET'])
def api_logs():
    """获取DDNS日志API"""
    try:
        lines = request.args.get('lines', 100, type=int)
        
        if not os.path.exists(CONFIG['log_file']):
            return jsonify({
                'success': True,
                'logs': []
            })
        
        # 读取日志文件
        with open(CONFIG['log_file'], 'r') as f:
            log_lines = f.readlines()[-lines:]
        
        # 解析日志
        logs = []
        for line in log_lines:
            line = line.strip()
            if not line:
                continue
            
            # 简单的日志解析
            log_entry = {
                'timestamp': line[:19] if len(line) >= 19 else datetime.now().isoformat(),
                'message': line[20:] if len(line) > 20 else line,
                'level': 'info'
            }
            
            # 判断日志级别
            if 'ERROR' in line or 'error' in line.lower():
                log_entry['level'] = 'error'
            elif 'WARNING' in line or 'warning' in line.lower():
                log_entry['level'] = 'warning'
            elif 'SUCCESS' in line or 'success' in line.lower():
                log_entry['level'] = 'success'
            
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

@app.route('/api/ddns/logs/recent', methods=['GET'])
def api_logs_recent():
    """获取最近日志（用于Web界面）"""
    return api_logs()

@app.route('/api/ddns/config', methods=['GET'])
def api_config():
    """获取配置信息API"""
    try:
        config = {
            'domain': '0379.email',
            'subdomain': 'ddns',
            'record_type': 'A',
            'ttl': 600,
            'check_interval': 300,
            'server_ip': os.getenv('NAS_SERVER_IP', '8.152.195.33'),
            'aliyun_configured': bool(os.getenv('ALIYUN_ACCESS_KEY_ID')),
            'notification_enabled': os.getenv('NOTIFICATION_ENABLED') == 'true'
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

@app.route('/health', methods=['GET'])
def health():
    """健康检查端点"""
    return jsonify({
        'status': 'healthy',
        'service': 'ddns-api',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    # 创建必要的目录
    os.makedirs('/opt/yyc3/logs', exist_ok=True)
    os.makedirs('/opt/yyc3/run', exist_ok=True)
    
    logger.info("DDNS API服务启动")
    app.run(host='127.0.0.1', port=8080, debug=False)
EOF

# 设置权限
chmod +x /opt/yyc3/api/ddns/app.py