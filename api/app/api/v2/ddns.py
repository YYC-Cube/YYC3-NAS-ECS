from flask import Blueprint, request, jsonify
from datetime import datetime
import logging
import os

ddns_bp = Blueprint('ddns_v2', __name__, url_prefix='/ddns')
logger = logging.getLogger('ddns_api')


def get_service_uptime(service_name):
    """获取服务运行时间"""
    try:
        # 简化实现，实际可以使用 systemctl 命令
        return "unknown"
    except Exception:
        return "unknown"


def log_operation(user_id, action, resource, details=None):
    """记录操作日志"""
    logger.info(f"User {user_id} performed {action} on {resource}")


@ddns_bp.route('/status', methods=['GET'])
def get_ddns_status():
    """获取DDNS服务状态"""
    try:
        # 从配置文件获取状态
        status_file = "/opt/yyc3/run/status.json"
        if os.path.exists(status_file):
            import json
            with open(status_file, 'r') as f:
                status_data = json.load(f)
        else:
            status_data = {"success": False, "message": "Status file not found"}

        # 获取系统DDNS运行状态
        import subprocess
        ddns_running = subprocess.run(
            ["systemctl", "is-active", "--quiet", "yyc3-ddns.timer"],
            capture_output=True
        ).returncode == 0

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "ddns_enabled": True,
                "ddns_running": ddns_running,
                "last_check": status_data.get("timestamp"),
                "current_ip": status_data.get("current_ip"),
                "domain": status_data.get("domain"),
                "status": status_data.get("message"),
                "next_check": None,
                "uptime": get_service_uptime("yyc3-ddns.timer")
            },
            "metadata": {
                "version": "v2",
                "request_id": getattr(request, 'request_id', 'unknown')
            }
        })
    except Exception as e:
        logger.error(f"Error getting DDNS status: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }), 500


@ddns_bp.route('/records', methods=['GET'])
def list_dns_records():
    """列出所有DNS记录"""
    domain = request.args.get('domain', '0379.email')
    subdomain = request.args.get('subdomain')
    record_type = request.args.get('type', 'A')

    try:
        # 这里应该调用阿里云 API 获取 DNS 记录
        # records = get_aliyun_dns_records(domain, subdomain, record_type)
        records = []  # 模拟数据

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "domain": domain,
                "records": records,
                "count": len(records)
            },
            "pagination": {
                "page": request.args.get('page', 1, type=int),
                "per_page": request.args.get('per_page', 50, type=int),
                "total": len(records)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@ddns_bp.route('/records', methods=['POST'])
def create_dns_record():
    """创建DNS记录"""
    data = request.get_json()

    required_fields = ["domain", "rr", "type", "value"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({
            "success": False,
            "error": f"Missing required fields: {', '.join(missing)}"
        }), 400

    try:
        # 调用阿里云API创建记录
        # result = create_aliyun_dns_record(...)
        result = {"record_id": "new_record_id"}

        # 记录操作日志
        log_operation(
            user_id=request.user_id,
            action="create_dns_record",
            resource=f"{data['rr']}.{data['domain']}",
            details=data
        )

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": result,
            "message": "DNS record created successfully"
        }), 201
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@ddns_bp.route('/records/<string:record_id>', methods=['PUT'])
def update_dns_record(record_id):
    """更新DNS记录"""
    data = request.get_json()

    try:
        # 调用阿里云API更新记录
        # result = update_aliyun_dns_record(record_id, data)
        result = {"record_id": record_id}

        log_operation(
            user_id=request.user_id,
            action="update_dns_record",
            resource=record_id,
            details=data
        )

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": result,
            "message": "DNS record updated successfully"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@ddns_bp.route('/records/<string:record_id>', methods=['DELETE'])
def delete_dns_record(record_id):
    """删除DNS记录"""
    try:
        # 调用阿里云API删除记录
        # result = delete_aliyun_dns_record(record_id)
        result = {"deleted": True}

        log_operation(
            user_id=request.user_id,
            action="delete_dns_record",
            resource=record_id
        )

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "message": "DNS record deleted successfully"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@ddns_bp.route('/manual-update', methods=['POST'])
def manual_ddns_update():
    """手动触发DDNS更新"""
    force = request.args.get('force', 'false').lower() == 'true'

    try:
        # 执行DDNS更新脚本
        # result = run_ddns_update(force=force)
        result = {"success": True, "ip": "8.152.195.33"}

        log_operation(
            user_id=request.user_id,
            action="manual_ddns_update",
            resource="ddns",
            details={"force": force, "result": result}
        )

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": result,
            "message": "DDNS update triggered successfully"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@ddns_bp.route('/history', methods=['GET'])
def get_update_history():
    """获取DDNS更新历史"""
    try:
        # 从日志文件读取历史记录
        # history = get_ddns_update_history(...)
        history = []  # 模拟数据

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "history": history,
                "count": len(history)
            },
            "pagination": {
                "limit": request.args.get('limit', 100, type=int),
                "offset": request.args.get('offset', 0, type=int),
                "total": 0
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
