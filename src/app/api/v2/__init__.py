         }), 202
      except Exception as e:
          logger.error(f"Mail error: {e}")
          return jsonify({"success": False, "error": str(e)}), 500

--------

### 5. 更新：主路由注册

文件路径:  src/app/api/v2/__init__.py  操作: 将上述新增的服务蓝图注册到主应用中。

  # src/app/api/v2/__init__.py
  from flask import Blueprint
  from .auth import bp as auth_bp
  from .ddns import bp as ddns_bp
  from .domains import bp as domains_bp
  from .monitoring import bp as monitoring_bp
  from .alerts import bp as alerts_bp
  from .config import bp as config_bp
  from .analytics import bp as analytics_bp
  from .integrations import bp as integrations_bp
  from .dev import bp as dev_bp
  from .production import bp as production_bp

  # >>> 引入新增的服务 <<<
  from app.api.v2.llm import bp as llm_bp
  from app.api.v2.nas import bp as nas_bp
  from app.api.v2.mail import bp as mail_bp
  from app.api.v2.network.frp import bp as frp_bp
  # >>> 引入结束 <<<

  bp = Blueprint('api_v2', __name__)

  # 注册基础蓝图
  bp.register_blueprint(auth_bp, url_prefix='/auth')
  bp.register_blueprint(ddns_bp, url_prefix='/ddns')
  bp.register_blueprint(domains_bp, url_prefix='/domains')
  bp.register_blueprint(monitoring_bp, url_prefix='/monitoring')
  bp.register_blueprint(alerts_bp, url_prefix='/alerts')
  bp.register_blueprint(config_bp, url_prefix='/config')
  bp.register_blueprint(analytics_bp, url_prefix='/analytics')
  bp.register_blueprint(integrations_bp, url_prefix='/integrations')
  bp.register_blueprint(dev_bp, url_prefix='/dev')
  bp.register_blueprint(production_bp, url_prefix='/production')

  # >>> 注册新增的服务蓝图 <<<
  bp.register_blueprint(llm_bp, url_prefix='/llm')
  bp.register_blueprint(nas_bp, url_prefix='/nas')
  bp.register_blueprint(mail_bp, url_prefix='/mail')
  bp.register_blueprint(frp_bp, url_prefix='/network/frp')
  # >>> 注册结束 <<<

  @bp.route('/')
  def index():
      """API v2根端点 - 更新列表"""
      return {
          'api': 'YYC³ NAS DDNS API v2',
          'version': '2.0.0',
          'endpoints': {
              'auth': '/api/v2/auth',
              'ddns': '/api/v2/ddns',
              'domains': '/api/v2/domains',
              'monitoring': '/api/v2/monitoring',
              'alerts': '/api/v2/alerts',
              'config': '/api/v2/config',
              'analytics': '/api/v2/analytics',
              'integrations': '/api/v2/integrations',
              'dev': '/api/v2/dev',
              'production': '/api/v2/production',
              # >>> 新增端点 <<<
              'llm': '/api/v2/llm',
              'nas': '/api/v2/nas',
              'mail': '/api/v2/mail',
              'network': '/api/v2/network/frp'
              # >>> 结束 <<<
          },
          'documentation': 'https://ddns.0379.email/api/v2/docs'
      }
