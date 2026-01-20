from flask import Blueprint, request, jsonify
from datetime import datetime
import os
import yaml
import json

config_bp = Blueprint('config_v2', __name__, url_prefix='/config')


# 配置文件路径
CONFIG_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'config')
SYSTEM_CONFIG_FILE = os.path.join(CONFIG_DIR, 'system_config.yaml')
ALIYUN_CONFIG_FILE = os.path.join(CONFIG_DIR, 'aliyun_config.yaml')


def load_config_file(file_path):
    """加载配置文件"""
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            if file_path.endswith('.yaml') or file_path.endswith('.yml'):
                return yaml.safe_load(f)
            elif file_path.endswith('.json'):
                return json.load(f)
    return None


def save_config_file(file_path, config_data):
    """保存配置文件"""
    os.makedirs(os.path.dirname(file_path), exist_ok=True)

    with open(file_path, 'w') as f:
        if file_path.endswith('.yaml') or file_path.endswith('.yml'):
            yaml.dump(config_data, f, default_flow_style=False)
        elif file_path.endswith('.json'):
            json.dump(config_data, f, indent=2)


def get_all_configurations():
    """获取所有配置项"""
    configs = {
        "system": load_config_file(SYSTEM_CONFIG_FILE) or {
            "version": "2.0.0",
            "api": {
                "timeout": 30,
                "rate_limit": 1000
            },
            "database": {
                "pool_size": 10,
                "max_overflow": 20
            },
            "logging": {
                "level": "INFO",
                "format": "json"
            }
        },
        "aliyun": load_config_file(ALIYUN_CONFIG_FILE) or {
            "access_key_id": os.environ.get('ALIYUN_ACCESS_KEY_ID', ''),
            "domain": os.environ.get('ALIYUN_DOMAIN', ''),
            "sub_domain": os.environ.get('ALIYUN_SUB_DOMAIN', ''),
            "ttl": int(os.environ.get('ALIYUN_TTL', '600'))
        }
    }
    return configs


def get_config_by_key(config_key):
    """通过键获取配置"""
    configs = get_all_configurations()

    if '.' in config_key:
        # 支持嵌套键，如 "aliyun.domain"
        keys = config_key.split('.')
        value = configs
        for key in keys:
            if isinstance(value, dict) and key in value:
                value = value[key]
            else:
                return None
        return value
    else:
        return configs.get(config_key)


def update_config_by_key(config_key, config_value):
    """通过键更新配置"""
    configs = get_all_configurations()

    if '.' in config_key:
        # 支持嵌套键
        keys = config_key.split('.')
        target = configs
        for key in keys[:-1]:
            if key not in target:
                target[key] = {}
            target = target[key]
        target[keys[-1]] = config_value
    else:
        configs[config_key] = config_value

    # 保存配置
    if config_key.startswith('aliyun'):
        save_config_file(ALIYUN_CONFIG_FILE, configs['aliyun'])
    elif config_key.startswith('system'):
        save_config_file(SYSTEM_CONFIG_FILE, configs['system'])

    return configs


def validate_config_value(config_key, config_value):
    """验证配置值"""
    # 根据配置键进行验证
    validations = {
        'aliyun.ttl': lambda x: isinstance(x, int) and 1 <= x <= 86400,
        'api.timeout': lambda x: isinstance(x, int) and 1 <= x <= 300,
        'api.rate_limit': lambda x: isinstance(x, int) and x >= 0,
        'database.pool_size': lambda x: isinstance(x, int) and x >= 1
    }

    validator = validations.get(config_key)
    if validator:
        return validator(config_value)
    return True


@config_bp.route('', methods=['GET'])
def list_configurations():
    """列出所有配置"""
    try:
        configs = get_all_configurations()

        # 隐藏敏感信息
        if 'aliyun' in configs:
            aliyun_config = configs['aliyun']
            if 'access_key_secret' in aliyun_config:
                aliyun_config['access_key_secret'] = '******'

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": configs,
            "metadata": {
                "total_configs": len(configs),
                "config_types": list(configs.keys())
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@config_bp.route('/<string:config_key>', methods=['GET'])
def get_configuration(config_key):
    """获取特定配置"""
    try:
        config_value = get_config_by_key(config_key)

        if config_value is None:
            return jsonify({
                "success": False,
                "error": f"Configuration key '{config_key}' not found"
            }), 404

        # 隐藏敏感信息
        if config_key == 'aliyun.access_key_secret':
            config_value = '******'

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "key": config_key,
                "value": config_value
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@config_bp.route('/<string:config_key>', methods=['PUT'])
def update_configuration(config_key):
    """更新配置"""
    data = request.get_json()

    if "value" not in data:
        return jsonify({
            "success": False,
            "error": "Configuration value is required"
        }), 400

    config_value = data["value"]

    try:
        # 验证配置值
        if not validate_config_value(config_key, config_value):
            return jsonify({
                "success": False,
                "error": f"Invalid configuration value for '{config_key}'"
            }), 400

        # 更新配置
        configs = update_config_by_key(config_key, config_value)

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "key": config_key,
                "value": config_value,
                "updated_at": datetime.utcnow().isoformat()
            },
            "message": f"Configuration '{config_key}' updated successfully"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@config_bp.route('/<string:config_key>', methods=['DELETE'])
def reset_configuration(config_key):
    """重置配置为默认值"""
    try:
        # 默认配置值
        default_values = {
            'aliyun.ttl': 600,
            'api.timeout': 30,
            'api.rate_limit': 1000,
            'database.pool_size': 10
        }

        if config_key in default_values:
            configs = update_config_by_key(config_key, default_values[config_key])

            return jsonify({
                "success": True,
                "timestamp": datetime.utcnow().isoformat(),
                "data": {
                    "key": config_key,
                    "value": default_values[config_key],
                    "reset_at": datetime.utcnow().isoformat()
                },
                "message": f"Configuration '{config_key}' reset to default"
            })
        else:
            return jsonify({
                "success": False,
                "error": f"Cannot reset configuration '{config_key}'"
            }), 400
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@config_bp.route('/validate', methods=['POST'])
def validate_configuration():
    """验证配置"""
    data = request.get_json()

    config_data = data.get("config", {})

    try:
        validation_results = []
        is_valid = True

        # 验证各个配置项
        for config_key, config_value in config_data.items():
            if validate_config_value(config_key, config_value):
                validation_results.append({
                    "key": config_key,
                    "valid": True,
                    "message": "Valid"
                })
            else:
                validation_results.append({
                    "key": config_key,
                    "valid": False,
                    "message": "Invalid value"
                })
                is_valid = False

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "valid": is_valid,
                "validations": validation_results,
                "summary": {
                    "total": len(validation_results),
                    "passed": len([v for v in validation_results if v["valid"]]),
                    "failed": len([v for v in validation_results if not v["valid"]])
                }
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@config_bp.route('/backup', methods=['POST'])
def backup_configuration():
    """备份配置"""
    try:
        configs = get_all_configurations()

        # 创建备份文件
        backup_file = os.path.join(
            CONFIG_DIR,
            f"backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        )

        save_config_file(backup_file, configs)

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "backup_file": backup_file,
                "created_at": datetime.utcnow().isoformat(),
                "config_count": len(configs)
            },
            "message": "Configuration backed up successfully"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@config_bp.route('/restore', methods=['POST'])
def restore_configuration():
    """恢复配置"""
    data = request.get_json()

    backup_file = data.get("backup_file")

    if not backup_file:
        return jsonify({
            "success": False,
            "error": "Backup file is required"
        }), 400

    try:
        # 加载备份配置
        configs = load_config_file(backup_file)

        if not configs:
            return jsonify({
                "success": False,
                "error": "Invalid backup file"
            }), 400

        # 恢复配置
        if 'aliyun' in configs:
            save_config_file(ALIYUN_CONFIG_FILE, configs['aliyun'])
        if 'system' in configs:
            save_config_file(SYSTEM_CONFIG_FILE, configs['system'])

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "restored_configs": list(configs.keys()),
                "restored_at": datetime.utcnow().isoformat()
            },
            "message": "Configuration restored successfully"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@config_bp.route('/history', methods=['GET'])
def get_config_history():
    """获取配置历史"""
    try:
        # 列出备份文件
        backup_files = []

        if os.path.exists(CONFIG_DIR):
            for filename in os.listdir(CONFIG_DIR):
                if filename.startswith('backup_') and filename.endswith('.json'):
                    file_path = os.path.join(CONFIG_DIR, filename)
                    backup_files.append({
                        "filename": filename,
                        "file_path": file_path,
                        "created_at": datetime.fromtimestamp(
                            os.path.getctime(file_path)
                        ).isoformat(),
                        "size": os.path.getsize(file_path)
                    })

        # 按创建时间排序
        backup_files.sort(key=lambda x: x['created_at'], reverse=True)

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "backups": backup_files,
                "count": len(backup_files)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
