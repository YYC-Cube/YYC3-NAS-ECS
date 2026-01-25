"""
FRP配置管理API模块
提供FRP隧道配置、服务状态等接口
"""

import os
import subprocess
import toml
from datetime import datetime
from flask import Blueprint, jsonify, request, current_app
from flask_cors import cross_origin

frp_bp = Blueprint('frp', __name__)

# FRP配置路径
FRPC_CONFIG_PATH = os.getenv('FRPC_CONFIG_PATH', '/frp/frpc.toml')
FRP_BIN_PATH = os.getenv('FRP_BIN_PATH', '/usr/local/bin/frpc')
FRP_LOG_PATH = os.getenv('FRP_LOG_PATH', '/var/log/frpc.log')
FRP_BACKUP_DIR = os.getenv('FRP_BACKUP_DIR', '/frp/backups')


# ========== 模拟数据 ==========

MOCK_FRP_CONFIGS = [
    {
        'id': 'api-0379',
        'name': 'api-0379',
        'type': 'http',
        'localIP': '127.0.0.1',
        'localPort': 6000,
        'subdomain': 'api',
        'enabled': True,
        'status': 'running'
    },
    {
        'id': 'nas-0379',
        'name': 'nas-0379',
        'type': 'http',
        'localIP': '127.0.0.1',
        'localPort': 6004,
        'subdomain': 'nas',
        'enabled': True,
        'status': 'running'
    },
    {
        'id': 'mail-0379',
        'name': 'mail-0379',
        'type': 'http',
        'localIP': '127.0.0.1',
        'localPort': 6003,
        'subdomain': 'mail',
        'enabled': True,
        'status': 'running'
    },
    {
        'id': 'llm-0379',
        'name': 'llm-0379',
        'type': 'http',
        'localIP': '127.0.0.1',
        'localPort': 6002,
        'subdomain': 'llm',
        'enabled': True,
        'status': 'running'
    },
    {
        'id': 'admin-0379',
        'name': 'admin-0379',
        'type': 'http',
        'localIP': '127.0.0.1',
        'localPort': 6001,
        'subdomain': 'admin',
        'enabled': True,
        'status': 'running'
    },
    {
        'id': 'monitor-0379',
        'name': 'monitor-0379',
        'type': 'http',
        'localIP': '127.0.0.1',
        'localPort': 6006,
        'subdomain': 'monitor',
        'enabled': True,
        'status': 'running'
    },
    {
        'id': 'ddns-0379',
        'name': 'ddns-0379',
        'type': 'http',
        'localIP': '127.0.0.1',
        'localPort': 6007,
        'subdomain': 'ddns',
        'enabled': True,
        'status': 'running'
    }
]

MOCK_FRP_STATUS = {
    'client': {
        'running': True,
        'connected': True,
        'serverAddr': '8.152.195.33',
        'serverPort': 7001,
        'proxyCount': 7,
        'uptime': '15天 3小时 45分钟'
    },
    'proxies': MOCK_FRP_CONFIGS,
    'timestamp': datetime.now().isoformat()
}


# ========== FRP 状态接口 ==========

@frp_bp.route('/status', methods=['GET'])
@cross_origin()
def get_frp_status():
    """
    获取FRP客户端状态
    
    返回:
        JSON: FRP客户端和隧道状态
    """
    try:
        # 检查FRP进程是否运行（容器环境使用模拟数据）
        is_running = True
        
        # 构建状态响应
        status = {
            'client': {
                'running': is_running,
                'connected': is_running,
                'serverAddr': os.getenv('FRP_SERVER_HOST', '8.152.195.33'),
                'serverPort': int(os.getenv('FRP_SERVER_PORT', '7001')),
                'proxyCount': len(MOCK_FRP_CONFIGS),
                'uptime': '15天 3小时 45分钟' if is_running else '0天 0小时 0分钟'
            },
            'proxies': MOCK_FRP_CONFIGS,
            'timestamp': datetime.now().isoformat()
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


@frp_bp.route('/proxies', methods=['GET'])
@cross_origin()
def get_frp_proxies():
    """
    获取FRP代理隧道列表
    
    返回:
        JSON: FRP代理隧道列表
    """
    try:
        return jsonify({
            'success': True,
            'data': MOCK_FRP_CONFIGS
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@frp_bp.route('/client/start', methods=['POST'])
@cross_origin()
def start_frp_client():
    """
    启动FRP客户端
    
    返回:
        JSON: 操作结果
    """
    try:
        # 检查是否已在运行
        result = subprocess.run(['pgrep', '-f', 'frpc'], capture_output=True, text=True)
        if result.returncode == 0:
            return jsonify({
                'success': True,
                'message': 'FRP客户端已在运行'
            }), 200
        
        # 启动FRP客户端
        command = f'nohup {FRP_BIN_PATH} -c {FRPC_CONFIG_PATH} > {FRP_LOG_PATH} 2>&1 &'
        subprocess.run(command, shell=True, check=True)
        
        # 等待启动
        import time
        time.sleep(2)
        
        return jsonify({
            'success': True,
            'message': 'FRP客户端启动成功'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@frp_bp.route('/client/stop', methods=['POST'])
@cross_origin()
def stop_frp_client():
    """
    停止FRP客户端
    
    返回:
        JSON: 操作结果
    """
    try:
        # 杀死FRP进程
        result = subprocess.run(['pkill', '-f', 'frpc'], capture_output=True, text=True)
        
        return jsonify({
            'success': True,
            'message': 'FRP客户端已停止'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@frp_bp.route('/client/restart', methods=['POST'])
@cross_origin()
def restart_frp_client():
    """
    重启FRP客户端
    
    返回:
        JSON: 操作结果
    """
    try:
        # 先停止
        subprocess.run(['pkill', '-f', 'frpc'], capture_output=True, text=True)
        
        # 等待
        import time
        time.sleep(2)
        
        # 再启动
        command = f'nohup {FRP_BIN_PATH} -c {FRPC_CONFIG_PATH} > {FRP_LOG_PATH} 2>&1 &'
        subprocess.run(command, shell=True, check=True)
        
        return jsonify({
            'success': True,
            'message': 'FRP客户端重启成功'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ========== FRP 配置接口 ==========

@frp_bp.route('/configs', methods=['GET'])
@cross_origin()
def get_frp_configs():
    """
    获取FRP隧道配置列表
    
    返回:
        JSON: FRP隧道配置列表
    """
    try:
        # 尝试读取配置文件
        if os.path.exists(FRPC_CONFIG_PATH):
            with open(FRPC_CONFIG_PATH, 'r') as f:
                config = toml.load(f)
                proxies = config.get('proxies', [])
                
                # 转换为API格式
                configs = []
                for i, proxy in enumerate(proxies):
                    configs.append({
                        'id': proxy.get('name', f'proxy-{i}'),
                        'name': proxy.get('name', ''),
                        'type': proxy.get('type', 'http'),
                        'localIP': proxy.get('localIP', ''),
                        'localPort': proxy.get('localPort', 0),
                        'subdomain': proxy.get('subdomain', ''),
                        'enabled': True,
                        'status': 'running'
                    })
                
                return jsonify({
                    'success': True,
                    'data': configs,
                    'source': 'file'
                }), 200
        
        # 配置文件不存在，返回模拟数据
        return jsonify({
            'success': True,
            'data': MOCK_FRP_CONFIGS,
            'source': 'mock'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@frp_bp.route('/configs/<config_id>', methods=['GET'])
@cross_origin()
def get_frp_config(config_id):
    """
    获取单个FRP隧道配置
    
    Args:
        config_id: 配置ID
        
    返回:
        JSON: FRP隧道配置详情
    """
    try:
        # 从模拟数据中查找
        config = next((c for c in MOCK_FRP_CONFIGS if c['id'] == config_id), None)
        
        if config:
            return jsonify({
                'success': True,
                'data': config
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Config not found'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@frp_bp.route('/configs', methods=['POST'])
@cross_origin()
def create_frp_config():
    """
    创建新的FRP隧道配置
    
    请求体:
        JSON: 隧道配置
        
    返回:
        JSON: 操作结果
    """
    try:
        data = request.get_json()
        
        # 验证必填字段
        if not all(k in data for k in ['name', 'type', 'localIP', 'localPort']):
            return jsonify({
                'success': False,
                'error': 'Missing required fields: name, type, localIP, localPort'
            }), 400
        
        # 创建配置
        new_config = {
            'id': data['name'],
            'name': data['name'],
            'type': data['type'],
            'localIP': data['localIP'],
            'localPort': data['localPort'],
            'subdomain': data.get('subdomain', ''),
            'enabled': True,
            'status': 'stopped'
        }
        
        MOCK_FRP_CONFIGS.append(new_config)
        
        return jsonify({
            'success': True,
            'data': new_config,
            'message': 'FRP隧道配置创建成功'
        }), 201
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@frp_bp.route('/configs/<config_id>', methods=['PUT'])
@cross_origin()
def update_frp_config(config_id):
    """
    更新FRP隧道配置
    
    Args:
        config_id: 配置ID
        
    请求体:
        JSON: 隧道配置
        
    返回:
        JSON: 操作结果
    """
    try:
        data = request.get_json()
        
        # 查找并更新配置
        for i, config in enumerate(MOCK_FRP_CONFIGS):
            if config['id'] == config_id:
                MOCK_FRP_CONFIGS[i].update(data)
                return jsonify({
                    'success': True,
                    'data': MOCK_FRP_CONFIGS[i],
                    'message': 'FRP隧道配置更新成功'
                }), 200
        
        return jsonify({
            'success': False,
            'error': 'Config not found'
        }), 404
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@frp_bp.route('/configs/<config_id>', methods=['DELETE'])
@cross_origin()
def delete_frp_config(config_id):
    """
    删除FRP隧道配置
    
    Args:
        config_id: 配置ID
        
    返回:
        JSON: 操作结果
    """
    try:
        # 查找并删除配置
        for i, config in enumerate(MOCK_FRP_CONFIGS):
            if config['id'] == config_id:
                del MOCK_FRP_CONFIGS[i]
                return jsonify({
                    'success': True,
                    'message': 'FRP隧道配置删除成功'
                }), 200
        
        return jsonify({
            'success': False,
            'error': 'Config not found'
        }), 404
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ========== FRP 日志接口 ==========

@frp_bp.route('/logs', methods=['GET'])
@cross_origin()
def get_frp_logs():
    """
    获取FRP客户端日志
    
    查询参数:
        lines: 返回的日志行数，默认100
        
    返回:
        JSON: FRP日志
    """
    try:
        lines = request.args.get('lines', 100, type=int)
        
        # 读取日志文件
        if os.path.exists(FRP_LOG_PATH):
            with open(FRP_LOG_PATH, 'r') as f:
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


# ========== FRP 配置验证接口 ==========

@frp_bp.route('/configs/validate', methods=['POST'])
@cross_origin()
def validate_frp_config():
    """
    验证FRP配置文件
    
    请求体:
        JSON: 配置内容
        
    返回:
        JSON: 验证结果
    """
    try:
        data = request.get_json()
        config_content = data.get('content', '')
        
        if not config_content:
            return jsonify({
                'success': False,
                'error': 'Config content is required'
            }), 400
        
        # 尝试解析TOML
        try:
            config = toml.loads(config_content)
            
            # 基本验证
            errors = []
            warnings = []
            
            # 检查必需字段
            if 'serverAddr' not in config and 'server_addr' not in config:
                errors.append('Missing required field: serverAddr')
            
            if 'serverPort' not in config and 'server_port' not in config:
                errors.append('Missing required field: serverPort')
            
            # 检查代理配置
            proxies = config.get('proxies', [])
            if not proxies:
                warnings.append('No proxy configurations found')
            
            # 检查端口冲突
            used_ports = set()
            for proxy in proxies:
                local_port = proxy.get('localPort') or proxy.get('local_port')
                if local_port:
                    if local_port in used_ports:
                        errors.append(f'Port conflict: localPort {local_port} is already used')
                    used_ports.add(local_port)
            
            # 检查端口范围
            for proxy in proxies:
                local_port = proxy.get('localPort') or proxy.get('local_port')
                if local_port and (local_port < 1 or local_port > 65535):
                    errors.append(f'Invalid port number: {local_port}')
            
            return jsonify({
                'success': True,
                'valid': len(errors) == 0,
                'errors': errors,
                'warnings': warnings,
                'message': 'Configuration validation completed'
            }), 200
            
        except toml.TomlDecodeError as e:
            return jsonify({
                'success': False,
                'valid': False,
                'errors': [f'TOML syntax error: {str(e)}'],
                'warnings': [],
                'message': 'Configuration validation failed'
            }), 400
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


# ========== FRP 配置备份接口 ==========

@frp_bp.route('/configs/backup', methods=['POST'])
@cross_origin()
def backup_frp_config():
    """
    备份FRP配置文件
    
    返回:
        JSON: 操作结果
    """
    try:
        # 确保备份目录存在
        os.makedirs(FRP_BACKUP_DIR, exist_ok=True)
        
        # 生成备份文件名
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_filename = f'frpc_backup_{timestamp}.toml'
        backup_path = os.path.join(FRP_BACKUP_DIR, backup_filename)
        
        # 读取当前配置
        if os.path.exists(FRPC_CONFIG_PATH):
            with open(FRPC_CONFIG_PATH, 'r') as f:
                config_content = f.read()
            
            # 写入备份文件
            with open(backup_path, 'w') as f:
                f.write(config_content)
            
            return jsonify({
                'success': True,
                'message': 'Configuration backed up successfully',
                'data': {
                    'backup_file': backup_filename,
                    'backup_path': backup_path,
                    'timestamp': timestamp
                }
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Configuration file not found'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@frp_bp.route('/configs/backups', methods=['GET'])
@cross_origin()
def list_frp_backups():
    """
    获取FRP配置备份列表
    
    返回:
        JSON: 备份文件列表
    """
    try:
        backups = []
        
        if os.path.exists(FRP_BACKUP_DIR):
            for filename in os.listdir(FRP_BACKUP_DIR):
                if filename.startswith('frpc_backup_') and filename.endswith('.toml'):
                    filepath = os.path.join(FRP_BACKUP_DIR, filename)
                    stat = os.stat(filepath)
                    
                    # 从文件名提取时间戳
                    timestamp_str = filename.replace('frpc_backup_', '').replace('.toml', '')
                    
                    backups.append({
                        'filename': filename,
                        'path': filepath,
                        'size': stat.st_size,
                        'created': datetime.fromtimestamp(stat.st_ctime).isoformat(),
                        'timestamp': timestamp_str
                    })
        
        # 按创建时间倒序排序
        backups.sort(key=lambda x: x['created'], reverse=True)
        
        return jsonify({
            'success': True,
            'data': backups,
            'total': len(backups)
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@frp_bp.route('/configs/restore', methods=['POST'])
@cross_origin()
def restore_frp_config():
    """
    恢复FRP配置文件
    
    请求体:
        JSON: { backup_file: string }
        
    返回:
        JSON: 操作结果
    """
    try:
        data = request.get_json()
        backup_filename = data.get('backup_file')
        
        if not backup_filename:
            return jsonify({
                'success': False,
                'error': 'backup_file is required'
            }), 400
        
        backup_path = os.path.join(FRP_BACKUP_DIR, backup_filename)
        
        if not os.path.exists(backup_path):
            return jsonify({
                'success': False,
                'error': 'Backup file not found'
            }), 404
        
        # 读取备份文件
        with open(backup_path, 'r') as f:
            backup_content = f.read()
        
        # 验证备份文件
        try:
            toml.loads(backup_content)
        except toml.TomlDecodeError as e:
            return jsonify({
                'success': False,
                'error': f'Invalid backup file: {str(e)}'
            }), 400
        
        # 备份当前配置
        current_backup = backup_frp_config()
        
        # 恢复配置
        with open(FRPC_CONFIG_PATH, 'w') as f:
            f.write(backup_content)
        
        return jsonify({
            'success': True,
            'message': 'Configuration restored successfully',
            'data': {
                'restored_from': backup_filename,
                'current_backup': current_backup.get_json().get('data', {})
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@frp_bp.route('/configs/backups/<backup_filename>', methods=['DELETE'])
@cross_origin()
def delete_frp_backup(backup_filename):
    """
    删除FRP配置备份
    
    Args:
        backup_filename: 备份文件名
        
    返回:
        JSON: 操作结果
    """
    try:
        backup_path = os.path.join(FRP_BACKUP_DIR, backup_filename)
        
        if os.path.exists(backup_path):
            os.remove(backup_path)
            return jsonify({
                'success': True,
                'message': 'Backup deleted successfully'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Backup file not found'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500
