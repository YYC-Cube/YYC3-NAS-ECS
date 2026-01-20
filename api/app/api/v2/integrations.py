from flask import Blueprint, request, jsonify
from datetime import datetime
import uuid
import requests

integrations_bp = Blueprint('integrations_v2', __name__, url_prefix='/integrations')


# 模拟 Webhook 数据存储
webhooks_db = []
webhook_id_counter = 1


def get_webhook_list(limit=100, offset=0, event_type=None):
    """获取 Webhook 列表"""
    filtered = webhooks_db

    if event_type:
        filtered = [w for w in filtered if w['event_type'] == event_type]

    return filtered[offset:offset + limit]


def get_webhook_by_id(webhook_id):
    """通过 ID 获取 Webhook"""
    for webhook in webhooks_db:
        if webhook['id'] == webhook_id:
            return webhook
    return None


def trigger_webhook(webhook, payload):
    """触发 Webhook"""
    try:
        response = requests.post(
            webhook['url'],
            json=payload,
            headers={
                'Content-Type': 'application/json',
                'X-Webhook-Signature': webhook.get('secret', '')
            },
            timeout=10
        )

        return {
            'success': response.status_code in [200, 201, 202],
            'status_code': response.status_code,
            'response': response.text
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def get_slack_webhook_url():
    """获取 Slack Webhook URL"""
    from os import environ
    return environ.get('SLACK_WEBHOOK_URL', '')


def send_slack_notification(message, webhook_url=None):
    """发送 Slack 通知"""
    if not webhook_url:
        webhook_url = get_slack_webhook_url()

    if not webhook_url:
        return {'success': False, 'error': 'Slack webhook URL not configured'}

    try:
        response = requests.post(
            webhook_url,
            json={'text': message},
            timeout=10
        )

        return {
            'success': response.status_code == 200,
            'status_code': response.status_code
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }


def format_slack_message(data, message_type='default'):
    """格式化 Slack 消息"""
    if message_type == 'alert':
        severity = data.get('severity', 'info')
        emoji = {
            'critical': '🚨',
            'warning': '⚠️',
            'info': 'ℹ️'
        }.get(severity, 'ℹ️')

        return f"""
{emoji} *{data.get('source', 'Unknown')} Alert*

*Severity:* {severity.upper()}
*Message:* {data.get('message', 'No message')}
*Time:* {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}
"""
    else:
        return str(data)


@integrations_bp.route('/webhooks', methods=['GET'])
def list_webhooks():
    """列出所有 Webhooks"""
    limit = request.args.get('limit', 100, type=int)
    offset = request.args.get('offset', 0, type=int)
    event_type = request.args.get('event_type')

    try:
        webhooks = get_webhook_list(
            limit=limit,
            offset=offset,
            event_type=event_type
        )

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "webhooks": webhooks,
                "count": len(webhooks)
            },
            "pagination": {
                "limit": limit,
                "offset": offset,
                "total": len(webhooks_db)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@integrations_bp.route('/webhooks', methods=['POST'])
def create_webhook():
    """创建 Webhook"""
    data = request.get_json()

    # 验证必需字段
    required_fields = ["url", "event_type"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({
            "success": False,
            "error": f"Missing required fields: {', '.join(missing)}"
        }), 400

    try:
        global webhook_id_counter
        webhook_id = f"webhook_{webhook_id_counter}"
        webhook_id_counter += 1

        webhook = {
            "id": webhook_id,
            "url": data["url"],
            "event_type": data["event_type"],
            "name": data.get("name", f"Webhook {webhook_id}"),
            "secret": data.get("secret", ""),
            "events": data.get("events", ["*"]),
            "active": True,
            "created_at": datetime.utcnow().isoformat(),
            "trigger_count": 0,
            "last_triggered": None
        }

        webhooks_db.append(webhook)

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": webhook,
            "message": "Webhook created successfully"
        }), 201
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@integrations_bp.route('/webhooks/<string:webhook_id>', methods=['GET'])
def get_webhook_details(webhook_id):
    """获取 Webhook 详情"""
    try:
        webhook = get_webhook_by_id(webhook_id)

        if not webhook:
            return jsonify({
                "success": False,
                "error": f"Webhook {webhook_id} not found"
            }), 404

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": webhook
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@integrations_bp.route('/webhooks/<string:webhook_id>', methods=['PUT'])
def update_webhook(webhook_id):
    """更新 Webhook"""
    data = request.get_json()

    try:
        webhook = get_webhook_by_id(webhook_id)

        if not webhook:
            return jsonify({
                "success": False,
                "error": f"Webhook {webhook_id} not found"
            }), 404

        # 更新字段
        if "url" in data:
            webhook["url"] = data["url"]
        if "event_type" in data:
            webhook["event_type"] = data["event_type"]
        if "name" in data:
            webhook["name"] = data["name"]
        if "secret" in data:
            webhook["secret"] = data["secret"]
        if "events" in data:
            webhook["events"] = data["events"]
        if "active" in data:
            webhook["active"] = data["active"]

        webhook["updated_at"] = datetime.utcnow().isoformat()

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": webhook,
            "message": "Webhook updated successfully"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@integrations_bp.route('/webhooks/<string:webhook_id>', methods=['DELETE'])
def delete_webhook(webhook_id):
    """删除 Webhook"""
    try:
        global webhooks_db
        webhooks_db = [w for w in webhooks_db if w['id'] != webhook_id]

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "message": f"Webhook {webhook_id} deleted successfully"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@integrations_bp.route('/webhooks/<string:webhook_id>/trigger', methods=['POST'])
def trigger_webhook_endpoint(webhook_id):
    """手动触发 Webhook"""
    data = request.get_json()

    try:
        webhook = get_webhook_by_id(webhook_id)

        if not webhook:
            return jsonify({
                "success": False,
                "error": f"Webhook {webhook_id} not found"
            }), 404

        # 触发 Webhook
        result = trigger_webhook(
            webhook,
            data.get("payload", {"test": True})
        )

        # 更新触发计数
        webhook["trigger_count"] += 1
        webhook["last_triggered"] = datetime.utcnow().isoformat()

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "webhook_id": webhook_id,
                "result": result
            },
            "message": "Webhook triggered"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@integrations_bp.route('/slack/notify', methods=['POST'])
def slack_notify():
    """发送 Slack 通知"""
    data = request.get_json()

    message = data.get("message")
    message_type = data.get("type", "default")
    webhook_url = data.get("webhook_url")

    if not message:
        return jsonify({
            "success": False,
            "error": "Message is required"
        }), 400

    try:
        # 格式化消息
        formatted_message = format_slack_message(
            data.get("data", {}),
            message_type
        )

        # 发送通知
        result = send_slack_notification(formatted_message, webhook_url)

        return jsonify({
            "success": result.get("success", False),
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "message": formatted_message,
                "result": result
            },
            "message": "Slack notification sent" if result.get("success") else "Failed to send notification"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@integrations_bp.route('/slack/test', methods=['POST'])
def test_slack_webhook():
    """测试 Slack Webhook"""
    data = request.get_json()
    webhook_url = data.get("webhook_url")

    try:
        # 获取默认 Webhook URL
        if not webhook_url:
            webhook_url = get_slack_webhook_url()

        if not webhook_url:
            return jsonify({
                "success": False,
                "error": "Slack webhook URL not configured"
            }), 400

        # 发送测试消息
        test_message = """
🧪 *Slack Webhook Test*

This is a test message from NAS DDNS API.
*Time:* {time}
*Status:* Webhook is working correctly
""".format(time=datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC'))

        result = send_slack_notification(test_message, webhook_url)

        return jsonify({
            "success": result.get("success", False),
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "test_message": test_message,
                "result": result
            },
            "message": "Slack webhook test completed"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@integrations_bp.route('/list', methods=['GET'])
def list_integrations():
    """列出所有集成的服务"""
    try:
        integrations = [
            {
                "type": "webhook",
                "name": "Webhooks",
                "description": "HTTP Webhook notifications",
                "enabled": True,
                "count": len(webhooks_db)
            },
            {
                "type": "slack",
                "name": "Slack",
                "description": "Slack messaging integration",
                "enabled": bool(get_slack_webhook_url()),
                "count": 1
            },
            {
                "type": "telegram",
                "name": "Telegram",
                "description": "Telegram bot integration",
                "enabled": bool(os.environ.get('TELEGRAM_BOT_TOKEN')),
                "count": 1
            },
            {
                "type": "email",
                "name": "Email",
                "description": "Email notifications",
                "enabled": bool(os.environ.get('SMTP_HOST')),
                "count": 1
            }
        ]

        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "integrations": integrations,
                "count": len(integrations)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
