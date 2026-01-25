 import logging
from datetime import datetime
from flask import Blueprint, request, jsonify
from app.tasks import send_email_async
from app.auth.jwt_decorators import token_required

mail_bp = Blueprint('mail_v2', __name__, url_prefix='/mail')
logger = logging.getLogger('yyc3_mail')

MOCK_EMAILS = [
    {
        'id': 'email-1',
        'from': 'user1@example.com',
        'to': 'admin@0379.email',
        'subject': 'Project Update - Q1 2026',
        'body': 'Dear Team,\n\nI am writing to provide you with the latest project updates for Q1 2026. Our team has made significant progress on all fronts...\n\nBest regards,\nProject Manager',
        'timestamp': '2026-01-24T10:30:00Z',
        'read': False,
        'folder': 'inbox',
        'attachments': 2
    },
    {
        'id': 'email-2',
        'from': 'support@company.com',
        'to': 'admin@0379.email',
        'subject': 'System Maintenance Notification',
        'body': 'Dear User,\n\nThis is to inform you that we will be performing scheduled system maintenance on January 25, 2026, from 2:00 AM to 4:00 AM UTC.\n\nDuring this time, some services may be temporarily unavailable.\n\nThank you for your understanding.\n\nBest regards,\nSupport Team',
        'timestamp': '2026-01-24T09:15:00Z',
        'read': False,
        'folder': 'inbox',
        'attachments': 0
    },
    {
        'id': 'email-3',
        'from': 'hr@company.com',
        'to': 'admin@0379.email',
        'subject': 'New Employee Onboarding',
        'body': 'Hello,\n\nPlease find attached the onboarding documents for our new team members starting next week.\n\nRegards,\nHR Department',
        'timestamp': '2026-01-24T08:00:00Z',
        'read': True,
        'folder': 'inbox',
        'attachments': 3
    },
    {
        'id': 'email-4',
        'from': 'admin@0379.email',
        'to': 'team@company.com',
        'subject': 'Weekly Report - Week 3',
        'body': 'Hi Team,\n\nPlease find attached the weekly report for Week 3 of January 2026.\n\nBest,\nAdmin',
        'timestamp': '2026-01-23T17:30:00Z',
        'read': True,
        'folder': 'sent',
        'attachments': 1
    },
    {
        'id': 'email-5',
        'from': 'client@external.com',
        'to': 'admin@0379.email',
        'subject': 'Contract Renewal Discussion',
        'body': 'Dear Admin,\n\nI would like to schedule a meeting to discuss the renewal of our service contract.\n\nPlease let me know your availability.\n\nBest regards,\nClient',
        'timestamp': '2026-01-23T14:00:00Z',
        'read': False,
        'folder': 'inbox',
        'attachments': 0
    }
]

@mail_bp.route('/emails', methods=['GET'])
@token_required
def get_emails():
    """获取邮件列表"""
    try:
        folder = request.args.get('folder', 'inbox')
        
        filtered_emails = [email for email in MOCK_EMAILS if email['folder'] == folder]
        
        return jsonify({
            'success': True,
            'data': filtered_emails,
            'total': len(filtered_emails)
        }), 200
    except Exception as e:
        logger.error(f"Get emails error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mail_bp.route('/emails/<email_id>', methods=['GET'])
@token_required
def get_email(email_id):
    """获取单个邮件详情"""
    try:
        email = next((e for e in MOCK_EMAILS if e['id'] == email_id), None)
        
        if email:
            return jsonify({
                'success': True,
                'data': email
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Email not found'
            }), 404
    except Exception as e:
        logger.error(f"Get email error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mail_bp.route('/emails/<email_id>/read', methods=['PUT'])
@token_required
def mark_email_read(email_id):
    """标记邮件为已读"""
    try:
        email = next((e for e in MOCK_EMAILS if e['id'] == email_id), None)
        
        if email:
            email['read'] = True
            return jsonify({
                'success': True,
                'data': email,
                'message': 'Email marked as read'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Email not found'
            }), 404
    except Exception as e:
        logger.error(f"Mark email read error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mail_bp.route('/emails/<email_id>/unread', methods=['PUT'])
@token_required
def mark_email_unread(email_id):
    """标记邮件为未读"""
    try:
        email = next((e for e in MOCK_EMAILS if e['id'] == email_id), None)
        
        if email:
            email['read'] = False
            return jsonify({
                'success': True,
                'data': email,
                'message': 'Email marked as unread'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Email not found'
            }), 404
    except Exception as e:
        logger.error(f"Mark email unread error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mail_bp.route('/emails/<email_id>/trash', methods=['PUT'])
@token_required
def move_to_trash(email_id):
    """移动邮件到回收站"""
    try:
        email = next((e for e in MOCK_EMAILS if e['id'] == email_id), None)
        
        if email:
            email['folder'] = 'trash'
            return jsonify({
                'success': True,
                'data': email,
                'message': 'Email moved to trash'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Email not found'
            }), 404
    except Exception as e:
        logger.error(f"Move to trash error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mail_bp.route('/emails/<email_id>', methods=['DELETE'])
@token_required
def delete_email(email_id):
    """永久删除邮件"""
    try:
        global MOCK_EMAILS
        email_index = next((i for i, e in enumerate(MOCK_EMAILS) if e['id'] == email_id), None)
        
        if email_index is not None:
            MOCK_EMAILS.pop(email_index)
            return jsonify({
                'success': True,
                'message': 'Email deleted permanently'
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Email not found'
            }), 404
    except Exception as e:
        logger.error(f"Delete email error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@mail_bp.route('/send', methods=['POST'])
@token_required
def send_mail():
    """发送邮件"""
    data = request.json
    to = data.get('to')
    subject = data.get('subject')
    body = data.get('body')
    cc = data.get('cc', [])
    bcc = data.get('bcc', [])
    attachments = data.get('attachments', [])

    if not to or not subject or not body:
        return jsonify({"success": False, "error": "Missing required fields"}), 400

    try:
        task = send_email_async.delay(to, subject, body, cc, bcc, attachments)
        
        new_email = {
            'id': f'email-{len(MOCK_EMAILS) + 1}',
            'from': 'admin@0379.email',
            'to': to,
            'subject': subject,
            'body': body,
            'timestamp': datetime.now().isoformat() + 'Z',
            'read': True,
            'folder': 'sent',
            'attachments': len(attachments)
        }
        MOCK_EMAILS.append(new_email)
        
        return jsonify({
            "success": True,
            "message": "Email queued",
            "task_id": task.id,
            "data": new_email
        }), 202
    except Exception as e:
        logger.error(f"Mail error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@mail_bp.route('/reply', methods=['POST'])
@token_required
def reply_email():
    """回复邮件"""
    data = request.json
    original_email_id = data.get('original_email_id')
    to = data.get('to')
    subject = data.get('subject')
    body = data.get('body')

    if not to or not subject or not body:
        return jsonify({"success": False, "error": "Missing required fields"}), 400

    try:
        task = send_email_async.delay(to, subject, body)
        
        new_email = {
            'id': f'email-{len(MOCK_EMAILS) + 1}',
            'from': 'admin@0379.email',
            'to': to,
            'subject': f'Re: {subject}',
            'body': body,
            'timestamp': datetime.now().isoformat() + 'Z',
            'read': True,
            'folder': 'sent',
            'attachments': 0,
            'in_reply_to': original_email_id
        }
        MOCK_EMAILS.append(new_email)
        
        return jsonify({
            "success": True,
            "message": "Reply queued",
            "task_id": task.id,
            "data": new_email
        }), 202
    except Exception as e:
        logger.error(f"Reply email error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@mail_bp.route('/forward', methods=['POST'])
@token_required
def forward_email():
    """转发邮件"""
    data = request.json
    original_email_id = data.get('original_email_id')
    to = data.get('to')
    subject = data.get('subject')
    body = data.get('body')

    if not to or not subject or not body:
        return jsonify({"success": False, "error": "Missing required fields"}), 400

    try:
        task = send_email_async.delay(to, subject, body)
        
        new_email = {
            'id': f'email-{len(MOCK_EMAILS) + 1}',
            'from': 'admin@0379.email',
            'to': to,
            'subject': f'Fwd: {subject}',
            'body': body,
            'timestamp': datetime.now().isoformat() + 'Z',
            'read': True,
            'folder': 'sent',
            'attachments': 0,
            'forwarded_from': original_email_id
        }
        MOCK_EMAILS.append(new_email)
        
        return jsonify({
            "success": True,
            "message": "Forward queued",
            "task_id": task.id,
            "data": new_email
        }), 202
    except Exception as e:
        logger.error(f"Forward email error: {e}")
        return jsonify({"success": False, "error": str(e)}), 500
