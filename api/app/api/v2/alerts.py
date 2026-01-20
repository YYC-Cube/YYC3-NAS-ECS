from flask import Blueprint, request, jsonify
from datetime import datetime

alerts_bp = Blueprint('alerts_v2', __name__, url_prefix='/alerts')


# 模拟数据存储（实际应该使用数据库）
alerts_db = []
alert_id_counter = 1


def get_alert_list(status='active', severity=None, limit=100, offset=0):
    """获取告警列表"""
    filtered = alerts_db

    if status != 'all':
        filtered = [a for a in filtered if a['status'] == status]

    if severity:
        filtered = [a for a in filtered if a['severity'] == severity]

    return filtered[offset:offset + limit]


def get_alert_by_id(alert_id):
    """通过ID获取告警"""
    for alert in alerts_db:
        if alert['id'] == alert_id:
            return alert
    return None


def resolve_alert_by_id(alert_id, resolution_notes=''):
    """解决告警"""
    alert = get_alert_by_id(alert_id)
    if alert and alert['status'] != 'resolved':
        alert['status'] = 'resolved'
        alert['resolved_at'] = datetime.utcnow().isoformat()
        alert['resolution_notes'] = resolution_notes
        return alert
    return None


def get_total_alert_count():
    """获取告警总数"""
    return len(alerts_db)


def get_active_alert_count():
    """获取活跃告警数"""
    return len([a for a in alerts_db if a['status'] == 'active'])


def get_critical_alert_count():
    """获取严重告警数"""
    return len([a for a in alerts_db if a['severity'] == 'critical' and a['status'] == 'active'])


def get_alert_rules_list():
    """获取告警规则列表"""
    return [
        {
            "id": "rule_1",
            "name": "CPU Usage High",
            "condition": "cpu.percent > 80",
            "severity": "warning",
            "notification_channels": ["email", "telegram"]
        },
        {
            "id": "rule_2",
            "name": "Disk Space Low",
            "condition": "disk.percent > 90",
            "severity": "critical",
            "notification_channels": ["email", "telegram"]
        }
    ]


@alerts_bp.route('', methods=['GET'])
def get_alerts():
    """获取告警列表"""
    status = request.args.get('status', 'active')  # active, resolved, all
    severity = request.args.get('severity')  # critical, warning, info
    limit = request.args.get('limit', 100, type=int)
    offset = request.args.get('offset', 0, type=int)

    try:
        alerts = get_alert_list(
            status=status,
            severity=severity,
            limit=limit,
            offset=offset
        )

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "alerts": alerts,
                "count": len(alerts),
                "summary": {
                    "total": get_total_alert_count(),
                    "active": get_active_alert_count(),
                    "critical": get_critical_alert_count()
                }
            },
            "pagination": {
                "limit": limit,
                "offset": offset,
                "total": get_total_alert_count()
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@alerts_bp.route('/<string:alert_id>', methods=['GET'])
def get_alert_details(alert_id):
    """获取告警详情"""
    try:
        alert_details = get_alert_by_id(alert_id)

        if not alert_details:
            return jsonify({
                "success": False,
                "error": f"Alert {alert_id} not found"
            }), 404

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": alert_details
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@alerts_bp.route('/<string:alert_id>/resolve', methods=['POST'])
def resolve_alert(alert_id):
    """解决告警"""
    data = request.get_json()
    resolution_notes = data.get('resolution_notes', '')

    try:
        result = resolve_alert_by_id(alert_id, resolution_notes)

        if not result:
            return jsonify({
                "success": False,
                "error": f"Alert {alert_id} not found or already resolved"
            }), 404

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": result,
            "message": f"Alert {alert_id} resolved"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@alerts_bp.route('/rules', methods=['GET'])
def get_alert_rules():
    """获取告警规则"""
    try:
        rules = get_alert_rules_list()

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "rules": rules,
                "count": len(rules)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@alerts_bp.route('/rules', methods=['POST'])
def create_alert_rule():
    """创建告警规则"""
    data = request.get_json()

    # 验证规则数据
    required_fields = ["name", "condition", "severity", "notification_channels"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({
            "success": False,
            "error": f"Missing required fields: {', '.join(missing)}"
        }), 400

    try:
        rule = {
            "id": f"rule_{len(alerts_db) + 1}",
            "name": data["name"],
            "condition": data["condition"],
            "severity": data["severity"],
            "notification_channels": data["notification_channels"],
            "enabled": True,
            "created_at": datetime.utcnow().isoformat()
        }

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": rule,
            "message": "Alert rule created"
        }), 201
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@alerts_bp.route('/notifications', methods=['GET'])
def get_notifications():
    """获取通知历史"""
    limit = request.args.get('limit', 50, type=int)
    channel = request.args.get('channel')
    status = request.args.get('status')  # sent, failed

    try:
        # 模拟通知数据
        notifications = []

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "notifications": notifications,
                "count": len(notifications)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
