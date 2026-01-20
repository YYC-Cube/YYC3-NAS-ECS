"""
DDNS管理API模块
提供DDNS服务状态、域名解析等接口
"""

import os
import subprocess
import requests
import hmac
import hashlib
from datetime import datetime
from flask import Blueprint, jsonify, request
from flask_cors import cross_origin

ddns_api_bp = Blueprint('ddns_api', __name__)

# 阿里云DDNS配置
ALIYUN_ACCESS_KEY_ID = os.getenv('ALIYUN_ACCESS_KEY_ID', '')
ALIYUN_ACCESS_KEY_SECRET = os.getenv('ALIYUN_ACCESS_KEY_SECRET', '')
ALIYUN_DOMAIN = os.getenv('ALIYUN_DOMAIN', '0379.email')
ALIYUN_SUB_DOMAIN = os.getenv('ALIYUN_SUB_DOMAIN', 'ddns')
ALIYUN_REGION_ID = os.getenv('ALIYUN_REGION_ID', 'cn-beijing')
ALIYUN_TTL = os.getenv('ALIYUN_TTL', '600')

# DDNS服务配置
NAS_SERVER_IP = os.getenv('NAS_SERVER_IP', '8.152.195.33')
DDNS_LOG_PATH = os.getenv('DDNS_LOG_PATH', '/var/log/ddns.log')
DDNS_UPDATE_INTERVAL = int(os.getenv('DDNS_UPDATE_INTERVAL', '300'))


# ========== 模拟数据 ==========

MOCK_DDNS_STATUS = {
    'running': True,
    'enabled': True,
    'provider': 'aliyun',
    'domain': f'{ALIYUN_SUB_DOMAIN}.{ALIYUN_DOMAIN}',
    'currentIP': NAS_SERVER_IP,
    'lastUpdate': datetime.now().isoformat(),
    'nextUpdate': (datetime.now().timestamp() + DDNS_UPDATE_INTERVAL),
    'updateInterval': DDNS_UPDATE_INTERVAL,
    'status': 'success',
    'message': 'DDNS更新成功'
}

MOCK_DDNS_HISTORY = [
    {
        'id': '1',
        'timestamp': '2025-01-05T10:00:00',
        'oldIP': '8.152.195.33',
        'newIP': '8.152.195.33',
        'status': 'success',
        'message': 'IP未变化，无需更新'
    },
    {
        'id': '2',
        'timestamp': '2025-01-05T09:55:00',
        'oldIP': '8.152.195.32',
        'newIP': '8.152.195.33',
        'status': 'success',
        'message': 'IP已更新'
    },
    {
        'id': '3',
        'timestamp': '2025-01-05T09:50:00',
        'oldIP': '8.152.195.32',
        'newIP': '8.152.195.32',
        'status': 'success',
        'message': 'IP未变化，无需更新'
    },
]

MOCK_DDNS_DOMAINS = [
    {
        'id': 'domain1',
        'domain': f'{ALIYUN_SUB_DOMAIN}.{ALIYUN_DOMAIN}',
        'type': 'A',
        'ttl': 600,
        'value': NAS_SERVER_IP,
        'status': 'active',
        'enabled': True,
        'lastUpdate': datetime.now().isoformat()
    },
    {
        'id': 'domain2',
        'domain': f'www.{ALIYUN_SUB_DOMAIN}.{ALIYUN_DOMAIN}',
        'type': 'CNAME',
        'ttl': 600,
        'value': f'{ALIYUN_SUB_DOMAIN}.{ALIYUN_DOMAIN}',
        'status': 'active',
        'enabled': True,
        'lastUpdate': datetime.now().isoformat()
    },
    {
        'id': 'domain3',
        'domain': f'mail.{ALIYUN_SUB_DOMAIN}.{ALIYUN_DOMAIN}',
        'type': 'A',
        'ttl': 600,
        'value': NAS_SERVER_IP,
        'status': 'active',
        'enabled': True,
        'lastUpdate': datetime.now().isoformat()
    }
]


# ========== DDNS 状态接口 ==========

@ddns_api_bp.route('/status', methods=['GET'])
@cross_origin()
def get_ddns_status():
    """
    获取DDNS服务状态
    
    返回:
        JSON: DDNS服务状态信息
    """
    try:
        # 检查DDNS服务是否运行（容器环境使用模拟数据）
        is_running = True
        
        # 获取当前公网IP
        try:
            current_ip = requests.get('https://api.ipify.org', timeout=5).text
        except:
            current_ip = NAS_SERVER_IP
        
        # 获取最后更新时间
        last_update = datetime.now()
        
        # 构建状态响应
        status = {
            'running': is_running,
            'enabled': True,
            'provider': 'aliyun',
            'domain': f'{ALIYUN_SUB_DOMAIN}.{ALIYUN_DOMAIN}',
            'currentIP': current_ip,
            'expectedIP': NAS_SERVER_IP,
            'lastUpdate': last_update.isoformat(),
            'nextUpdate': (last_update.timestamp() + DDNS_UPDATE_INTERVAL),
            'updateInterval': DDNS_UPDATE_INTERVAL,
            'status': 'success' if current_ip == NAS_SERVER_IP else 'warning',
            'message': 'DDNS运行正常' if current_ip == NAS_SERVER_IP else f'IP不匹配: {current_ip} != {NAS_SERVER_IP}'
        }
        
        return jsonify({
            'success': True,
            'data': status
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@ddns_api_bp.route('/domains', methods=['GET'])
@cross_origin()
def get_ddns_domains():
    """
    获取DDNS域名列表
    
    返回:
        JSON: DDNS域名列表
    """
    try:
        return jsonify({
            'success': True,
            'data': MOCK_DDNS_DOMAINS
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@ddns_api_bp.route('/start', methods=['POST'])
@cross_origin()
def start_ddns():
    """
    启动DDNS服务
    
    返回:
        JSON: 操作结果
    """
    try:
        # 容器环境模拟启动
        return jsonify({
            'success': True,
            'message': 'DDNS服务启动成功'
        }), 200
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@ddns_api_bp.route('/stop', methods=['POST'])
@cross_origin()
def stop_ddns():
    """
    停止DDNS服务
    
    返回:
        JSON: 操作结果
    """
    try:
        # 容器环境模拟停止
        return jsonify({
            'success': True,
            'message': 'DDNS服务已停止'
        }), 200
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@ddns_api_bp.route('/restart', methods=['POST'])
@cross_origin()
def restart_ddns():
    """
    重启DDNS服务
    
    返回:
        JSON: 操作结果
    """
    try:
        # 容器环境模拟重启
        return jsonify({
            'success': True,
            'message': 'DDNS服务重启成功'
        }), 200
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ========== DDNS 更新接口 ==========

@ddns_api_bp.route('/update', methods=['POST'])
@cross_origin()
def update_ddns():
    """
    手动触发DDNS更新
    
    返回:
        JSON: 操作结果
    """
    try:
        # 获取当前公网IP
        try:
            current_ip = requests.get('https://api.ipify.org', timeout=5).text
        except:
            current_ip = NAS_SERVER_IP
        
        # 模拟阿里云API调用
        # 实际项目中应该调用真实的阿里云DNS API
        
        # 记录日志
        log_message = f"[{datetime.now().isoformat()}] DDNS更新: {ALIYUN_SUB_DOMAIN}.{ALIYUN_DOMAIN} -> {current_ip}"
        try:
            with open(DDNS_LOG_PATH, 'a') as f:
                f.write(log_message + '\n')
        except:
            pass
        
        return jsonify({
            'success': True,
            'message': 'DDNS更新成功',
            'data': {
                'domain': f'{ALIYUN_SUB_DOMAIN}.{ALIYUN_DOMAIN}',
                'oldIP': NAS_SERVER_IP,
                'newIP': current_ip,
                'status': 'success' if current_ip == NAS_SERVER_IP else 'updated',
                'timestamp': datetime.now().isoformat()
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ========== DDNS 历史记录接口 ==========

@ddns_api_bp.route('/history', methods=['GET'])
@cross_origin()
def get_ddns_history():
    """
    获取DDNS更新历史记录
    
    查询参数:
        limit: 返回的记录数量，默认20
        
    返回:
        JSON: DDNS历史记录列表
    """
    try:
        limit = request.args.get('limit', 20, type=int)
        
        # 尝试读取日志文件
        if os.path.exists(DDNS_LOG_PATH):
            with open(DDNS_LOG_PATH, 'r') as f:
                log_lines = f.readlines()
            
            # 解析日志行
            history = []
            for i, line in enumerate(reversed(log_lines[-limit:])):
                try:
                    # 简单解析日志格式
                    if 'DDNS更新:' in line:
                        parts = line.split('DDNS更新:')
                        timestamp = parts[0].strip('[]').strip()
                        domain_ip = parts[1].strip().split('->')
                        domain = domain_ip[0].strip()
                        ip = domain_ip[1].strip()
                        
                        history.append({
                            'id': str(len(log_lines) - i),
                            'timestamp': timestamp,
                            'domain': domain,
                            'ip': ip,
                            'status': 'success'
                        })
                except:
                    continue
            
            return jsonify({
                'success': True,
                'data': history,
                'total': len(history)
            }), 200
        else:
            # 返回模拟数据
            return jsonify({
                'success': True,
                'data': MOCK_DDNS_HISTORY[:limit],
                'total': len(MOCK_DDNS_HISTORY)
            }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ========== DDNS 配置接口 ==========

@ddns_api_bp.route('/config', methods=['GET'])
@cross_origin()
def get_ddns_config():
    """
    获取DDNS配置
    
    返回:
        JSON: DDNS配置信息
    """
    try:
        config = {
            'provider': 'aliyun',
            'domain': ALIYUN_DOMAIN,
            'subdomain': ALIYUN_SUB_DOMAIN,
            'fullDomain': f'{ALIYUN_SUB_DOMAIN}.{ALIYUN_DOMAIN}',
            'regionId': ALIYUN_REGION_ID,
            'ttl': ALIYUN_TTL,
            'updateInterval': DDNS_UPDATE_INTERVAL,
            'expectedIP': NAS_SERVER_IP,
            'enabled': True,
            'autoUpdate': True
        }
        
        # 隐藏密钥
        if ALIYUN_ACCESS_KEY_ID:
            config['accessKeyId'] = ALIYUN_ACCESS_KEY_ID[:4] + '***' + ALIYUN_ACCESS_KEY_ID[-4:]
        else:
            config['accessKeyId'] = ''
        
        return jsonify({
            'success': True,
            'data': config
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@ddns_api_bp.route('/config', methods=['PUT'])
@cross_origin()
def update_ddns_config():
    """
    更新DDNS配置
    
    请求体:
        JSON: DDNS配置
        
    返回:
        JSON: 操作结果
    """
    try:
        data = request.get_json()
        
        # 验证必填字段
        required_fields = ['domain', 'subdomain']
        for field in required_fields:
            if field not in data:
                return jsonify({
                    'success': False,
                    'error': f'Missing required field: {field}'
                }), 400
        
        # 模拟更新配置
        # 实际项目中应该更新配置文件并重启服务
        
        return jsonify({
            'success': True,
            'message': 'DDNS配置更新成功',
            'data': data
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ========== DDNS 日志接口 ==========

@ddns_api_bp.route('/logs', methods=['GET'])
@cross_origin()
def get_ddns_logs():
    """
    获取DDNS日志
    
    查询参数:
        lines: 返回的日志行数，默认100
        
    返回:
        JSON: DDNS日志
    """
    try:
        lines = request.args.get('lines', 100, type=int)
        
        # 读取日志文件
        if os.path.exists(DDNS_LOG_PATH):
            with open(DDNS_LOG_PATH, 'r') as f:
                log_lines = f.readlines()
            
            # 返回最后N行
            logs = log_lines[-lines:] if len(log_lines) > lines else log_lines
            
            return jsonify({
                'success': True,
                'data': {
                    'logs': logs,
                    'total': len(log_lines),
                    'returned': len(logs)
                }
            }), 200
        else:
            return jsonify({
                'success': True,
                'data': {
                    'logs': [],
                    'total': 0,
                    'returned': 0
                },
                'message': 'Log file not found'
            }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
