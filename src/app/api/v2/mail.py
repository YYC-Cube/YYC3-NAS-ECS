 import logging
  from flask import Blueprint, request, jsonify
  from app.tasks import send_email_async
  from app.auth.jwt_decorators import token_required

  mail_bp = Blueprint('mail_v2', __name__, url_prefix='/mail')
  logger = logging.getLogger('yyc3_mail')

  @mail_bp.route('/send', methods=['POST'])
  @token_required
  def send_mail():
      """发送邮件"""
      data = request.json
      to = data.get('to')
      subject = data.get('subject')
      body = data.get('body')

      if not to or not subject or not body:
          return jsonify({"success": False, "error": "Missing required fields"}), 400

      try:
          # 调用异步任务
          task = send_email_async.delay(to, subject, body)
          return jsonify({
              "success": True,
              "message": "Email queued",
              "task_id": task.id
          }), 202
      except Exception as e:
          logger.error(f"Mail error: {e}")
          return jsonify({"success": False, "error": str(e)}), 500
