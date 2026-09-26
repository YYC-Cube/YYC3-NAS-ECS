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

    # 验证环境变量 (开发环境下跳过严格检查)
    if config_name == 'production':
        try:
            from config.env_validator import validate_environment
            validate_environment(fail_on_error=True)
            logger.info("Environment validation passed")
        except ImportError:
            logger.warning("Environment validator not available, skipping validation")
        except SystemExit:
            logger.error("Environment validation failed, cannot start application")
            raise

        # 生产环境安全守卫：强制强密钥 + 显式 CORS（fail-fast）
        _KNOWN_WEAK_SECRETS = {
            'dev-secret-key-please-change',
            'jwt-secret-key-change-me',
            'your-secret-key-here-change-in-production',
            'your-jwt-secret-key-here-change-in-production',
        }
        for key_name in ('SECRET_KEY', 'JWT_SECRET_KEY'):
            value = app.config.get(key_name) or ''
            if value in _KNOWN_WEAK_SECRETS or len(value) < 32:
                raise RuntimeError(
                    f"Production startup aborted: {key_name} is missing, too short "
                    f"(< 32 chars) or a known default. Generate one via: "
                    f"`python -c \"import secrets; print(secrets.token_urlsafe(48))\"`"
                )
        cors_value = (app.config.get('CORS_ORIGINS') or '').strip()
        if not cors_value or cors_value == '*':
            raise RuntimeError(
                "Production startup aborted: CORS_ORIGINS must be explicitly set "
                "to a comma-separated list of trusted origins (wildcard '*' is forbidden)"
            )
    else:
        try:
            from config.env_validator import get_validation_report
            report = get_validation_report()
            if not report.is_valid:
                logger.warning(f"Environment validation found {len(report.critical_errors)} issues")
        except ImportError:
            pass

    # 初始化扩展
    db.init_app(app)
    migrate = Migrate(app, db)

    # 初始化 JWT
    jwt_auth.init_app(app)

    # 初始化 CORS（支持逗号分隔字符串，统一转为精确来源列表，避免宽泛通配）
    cors_origins = app.config['CORS_ORIGINS']
    if isinstance(cors_origins, str):
        cors_origins = [o.strip() for o in cors_origins.split(',') if o.strip()]
    CORS(app, resources={
        r"/api/*": {
            "origins": cors_origins,
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
