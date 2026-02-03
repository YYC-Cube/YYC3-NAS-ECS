from flask import Blueprint
from datetime import datetime
# from .ddns import ddns_bp  # 注释掉旧的DDNS模块
from .domains import domains_bp
from .monitoring import monitor_bp
from .alerts import alerts_bp
from .dev import dev_bp
from .production import ha_bp
from .integrations import integrations_bp
from .analytics import analytics_bp
from .config import config_bp

# 新增的API模块
from .monitoring_api import monitoring_bp
from .nas_api import nas_bp
from .frp_api import frp_bp
from .ddns_api import ddns_api_bp

bp = Blueprint('api_v2', __name__)

# 注册所有子蓝图
# bp.register_blueprint(ddns_bp)  # 注释掉旧的DDNS模块注册
bp.register_blueprint(domains_bp)
bp.register_blueprint(monitor_bp)
bp.register_blueprint(alerts_bp)
bp.register_blueprint(dev_bp)
bp.register_blueprint(ha_bp)
bp.register_blueprint(integrations_bp)
bp.register_blueprint(analytics_bp)
bp.register_blueprint(config_bp)

# 注册新增的API模块，添加URL前缀
bp.register_blueprint(monitoring_bp, url_prefix='/monitoring')
bp.register_blueprint(nas_bp, url_prefix='/nas')
bp.register_blueprint(frp_bp, url_prefix='/frp')
bp.register_blueprint(ddns_api_bp, url_prefix='/ddns')


@bp.route('/')
def index():
    """API v2根端点"""
    return {
        'api': 'NAS DDNS API v2',
        'version': '2.0.0',
        'endpoints': {
            'ddns': '/api/v2/ddns',
            'domains': '/api/v2/domains',
            'monitoring': '/api/v2/monitoring',
            'alerts': '/api/v2/alerts',
            'dev': '/api/v2/dev',
            'ha': '/api/v2/ha',
            'integrations': '/api/v2/integrations',
            'analytics': '/api/v2/analytics',
            'config': '/api/v2/config',
            # 新增端点
            'system_stats': '/api/v2/monitoring/stats',
            'system_cpu': '/api/v2/monitoring/cpu',
            'system_memory': '/api/v2/monitoring/memory',
            'system_disk': '/api/v2/monitoring/disk',
            'system_network': '/api/v2/monitoring/network',
            'system_processes': '/api/v2/monitoring/processes',
            'nas_status': '/api/v2/nas/status',
            'nas_volumes': '/api/v2/nas/volumes',
            'nas_shares': '/api/v2/nas/shares',
            'nas_files': '/api/v2/nas/files',
            'frp_status': '/api/v2/frp/status',
            'frp_configs': '/api/v2/frp/configs',
            'frp_logs': '/api/v2/frp/logs',
            'ddns_status': '/api/v2/ddns/status',
            'ddns_update': '/api/v2/ddns/update',
            'ddns_history': '/api/v2/ddns/history',
            # 通用端点
            'health': '/api/v2/health',
            'metrics': '/api/v2/metrics'
        },
        'documentation': 'https://ddns.0379.email/api/v2/docs'
    }


@bp.route('/health')
def health():
    """健康检查端点

    提供详细的服务健康状态，包括数据库、Redis等依赖服务的连接状态。
    用于容器健康检查、负载均衡器和监控系统。
    """
    from app import db
    import redis
    import os
    from flask import current_app

    health_status = {
        'status': 'healthy',
        'service': 'nas-ddns-api',
        'version': '2.0.0',
        'timestamp': datetime.utcnow().isoformat(),
        'checks': {}
    }

    # 检查数据库连接
    try:
        # 执行简单查询测试数据库连接
        result = db.session.execute(db.text('SELECT 1'))
        result.fetchone()
        health_status['checks']['database'] = {
            'status': 'healthy',
            'message': 'Database connection successful'
        }
    except Exception as e:
        health_status['status'] = 'unhealthy'
        health_status['checks']['database'] = {
            'status': 'unhealthy',
            'message': f'Database connection failed: {str(e)}'
        }

    # 检查 Redis 连接
    try:
        redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
        # 创建 Redis 连接（带超时）
        r = redis.from_url(redis_url, socket_connect_timeout=2, socket_timeout=2)
        r.ping()
        health_status['checks']['redis'] = {
            'status': 'healthy',
            'message': 'Redis connection successful'
        }
    except Exception as e:
        # Redis 不健康不影响整体状态（降级运行）
        health_status['checks']['redis'] = {
            'status': 'degraded',
            'message': f'Redis connection failed: {str(e)}'
        }

    # 检查磁盘空间
    try:
        import shutil
        disk_usage = shutil.disk_usage('/')
        free_percent = (disk_usage.free / disk_usage.total) * 100

        if free_percent < 10:
            health_status['status'] = 'unhealthy'
            disk_status = 'unhealthy'
            disk_message = f'Low disk space: {free_percent:.1f}% free'
        elif free_percent < 20:
            disk_status = 'degraded'
            disk_message = f'Low disk space: {free_percent:.1f}% free'
            if health_status['status'] == 'healthy':
                health_status['status'] = 'degraded'
        else:
            disk_status = 'healthy'
            disk_message = f'{free_percent:.1f}% free'

        health_status['checks']['disk'] = {
            'status': disk_status,
            'message': disk_message,
            'total_gb': round(disk_usage.total / (1024**3), 2),
            'used_gb': round(disk_usage.used / (1024**3), 2),
            'free_gb': round(disk_usage.free / (1024**3), 2)
        }
    except Exception as e:
        health_status['checks']['disk'] = {
            'status': 'unknown',
            'message': f'Could not check disk space: {str(e)}'
        }

    # 检查内存使用
    try:
        import psutil
        memory = psutil.virtual_memory()
        memory_percent = memory.percent

        if memory_percent > 90:
            health_status['status'] = 'unhealthy'
            memory_status = 'unhealthy'
        elif memory_percent > 80:
            memory_status = 'degraded'
            if health_status['status'] == 'healthy':
                health_status['status'] = 'degraded'
        else:
            memory_status = 'healthy'

        health_status['checks']['memory'] = {
            'status': memory_status,
            'message': f'{memory_percent:.1f}% used',
            'total_gb': round(memory.total / (1024**3), 2),
            'used_gb': round(memory.used / (1024**3), 2),
            'available_gb': round(memory.available / (1024**3), 2)
        }
    except Exception:
        # psutil 可能不可用，跳过内存检查
        pass

    # 设置响应状态码
    # 如果状态是 healthy 或 degraded，返回 200
    # 如果状态是 unhealthy，返回 503
    from flask import make_response
    response = make_response(health_status)
    if health_status['status'] == 'unhealthy':
        response.status_code = 503
    else:
        response.status_code = 200

    return response


@bp.route('/metrics')
def prometheus_metrics():
    """Prometheus指标端点"""
    # 由prometheus_flask_exporter自动处理
    pass


@bp.route('/docs')
def api_docs():
    """API文档端点"""
    return {
        'swagger': '/api/v2/docs/swagger.json',
        'redoc': '/api/v2/docs/redoc',
        'openapi': '/api/v2/docs/openapi.json',
        'ui': '/api/v2/docs/ui'
    }
