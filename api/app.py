import os
import logging
from datetime import datetime, timedelta
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from prometheus_flask_exporter import PrometheusMetrics
import sentry_sdk
from sentry_sdk.integrations.flask import FlaskIntegration

# 导入配置
from config.config import config

# 导入扩展和模块
from app.models import db
from app.auth import jwt_auth
from app.middleware import init_rate_limiter
from app.celery import init_celery

# 导入蓝图
from app.api.v2 import bp as api_v2_bp

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger('nas_ddns_api')


def create_app(config_name=None):
    """应用工厂函数"""
    app = Flask(__name__)

    # 加载配置
    if config_name is None:
        config_name = os.getenv('FLASK_ENV', 'production')

    app.config.from_object(config[config_name])
    logger.info(f"Application running in {config_name} mode")

    # 初始化扩展
    db.init_app(app)
    migrate = Migrate(app, db)

    # 初始化 JWT
    jwt_auth.init_app(app)

    # 初始化 CORS
    CORS(app, resources={
        r"/api/*": {
            "origins": app.config['CORS_ORIGINS'],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-API-Key"]
        }
    })

    # 初始化速率限制
    init_rate_limiter(app)

    # 初始化 Prometheus 指标
    metrics = PrometheusMetrics(app)

    # 初始化 Sentry（如果配置了）
    if app.config.get('SENTRY_DSN'):
        sentry_sdk.init(
            dsn=app.config['SENTRY_DSN'],
            integrations=[FlaskIntegration()],
            traces_sample_rate=app.config.get('SENTRY_TRACES_SAMPLE_RATE', 1.0)
        )
        logger.info("Sentry initialized")

    # 注册蓝图
    app.register_blueprint(api_v2_bp, url_prefix='/api/v2')

    # 注册错误处理器
    register_error_handlers(app)

    # 注册请求中间件
    register_middleware(app)

    # 初始化 Celery（如果启用）
    if app.config.get('CELERY_ENABLED', False):
        init_celery(app)

    # 注册命令行命令
    register_commands(app)

    return app


def register_error_handlers(app):
    """注册错误处理器"""

    @app.errorhandler(404)
    def not_found_error(error):
        return jsonify({
            'success': False,
            'error': 'Resource not found',
            'message': str(error)
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f'Server Error: {error}')
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': 'An internal error occurred'
        }), 500

    @app.errorhandler(400)
    def bad_request_error(error):
        return jsonify({
            'success': False,
            'error': 'Bad request',
            'message': str(error)
        }), 400

    @app.errorhandler(401)
    def unauthorized_error(error):
        return jsonify({
            'success': False,
            'error': 'Unauthorized',
            'message': str(error)
        }), 401

    @app.errorhandler(403)
    def forbidden_error(error):
        return jsonify({
            'success': False,
            'error': 'Forbidden',
            'message': str(error)
        }), 403

    @app.errorhandler(429)
    def ratelimit_error(error):
        return jsonify({
            'success': False,
            'error': 'Rate limit exceeded',
            'message': str(error)
        }), 429


def register_middleware(app):
    """注册请求中间件"""

    @app.before_request
    def before_request():
        """请求前处理"""
        # 生成请求ID
        import uuid
        request.request_id = str(uuid.uuid4())

        # 记录请求日志
        logger.info(f"{request.method} {request.path} - RequestID: {request.request_id}")

    @app.after_request
    def after_request(response):
        """请求后处理"""
        # 添加自定义头部
        response.headers['X-Request-ID'] = getattr(request, 'request_id', 'unknown')
        response.headers['X-Server'] = 'NAS-DDNS-API'
        response.headers['X-API-Version'] = '2.0.0'

        # 记录响应日志
        logger.info(f"{request.method} {request.path} - Status: {response.status_code}")

        return response


def register_commands(app):
    """注册命令行命令"""
    import click
    from flask.cli import with_appcontext

    @app.cli.command()
    @with_appcontext
    def init_db():
        """初始化数据库"""
        db.create_all()
        click.echo('Database initialized')

    @app.cli.command()
    @with_appcontext
    def create_admin():
        """创建管理员用户"""
        import getpass
        username = click.prompt('Username')
        email = click.prompt('Email')
        password = getpass.getpass('Password')

        from app.models import User
        admin = User(username=username, email=email, role='admin')
        admin.set_password(password)

        db.session.add(admin)
        db.session.commit()

        click.echo(f'Admin user {username} created successfully')

    @app.cli.command()
    @with_appcontext
    def seed():
        """填充测试数据"""
        from app.models import User, Domain

        # 创建测试用户
        user = User(username='testuser', email='test@example.com', role='user')
        user.set_password('testpass')
        db.session.add(user)

        # 创建测试域名
        domain = Domain(name='example.com', registrar='Test', user_id=user.id)
        db.session.add(domain)

        db.session.commit()
        click.echo('Test data seeded')


# 创建应用实例
app = create_app()

# 导出 WSGI 应用
application = app

if __name__ == '__main__':
    # 开发模式
    if app.config['ENVIRONMENT'] == 'development':
        app.run(host='0.0.0.0', port=8080, debug=True)
    else:
        # 生产模式
        logger.info("Starting production server")
        app.run()
