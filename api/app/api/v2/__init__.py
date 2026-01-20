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
    """健康检查端点"""
    return {
        'status': 'healthy',
        'service': 'nas-ddns-api',
        'version': '2.0.0',
        'timestamp': datetime.utcnow().isoformat()
    }


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
