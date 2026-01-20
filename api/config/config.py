import os
from datetime import timedelta

class Config:
    """基础配置"""

    # ======================
    # 基础设置
    # ======================
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-please-change'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-me'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)

    # ======================
    # 数据库配置 (针对 32GB RAM 优化)
    # ======================
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///dev.db'

    # 连接池优化 (32G 内存可以稍微开大一点)
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,      # 核心数 * 2 + 2
        'max_overflow': 20,   # 允许溢出的连接数
        'pool_timeout': 30,    # 获取连接超时时间
        'pool_recycle': 3600, # 连接回收时间，防止 MySQL 断开
    }

    # ======================
    # Redis 配置
    # ======================
    CACHE_TYPE = 'RedisCache'
    CACHE_REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'
    CACHE_DEFAULT_TIMEOUT = 300

    # ======================
    # Celery 配置
    # ======================
    CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL') or 'redis://localhost:6379/1'
    CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND') or 'redis://localhost:6379/2'
    CELERY_TASK_TRACK_STARTED = True
    CELERY_TASK_TIME_LIMIT = 30 * 60  # 30分钟超时

    # ======================
    # 其他设置
    # ======================
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*')
    ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development')

    # ======================
    # 服务器配置
    # ======================
    NAS_SERVER_IP = os.environ.get('NAS_SERVER_IP', '8.152.195.33')
    NAS_DOMAIN = os.environ.get('NAS_DOMAIN', 'ddns.0379.email')

    # ======================
    # 阿里云配置
    # ======================
    ALIYUN_ACCESS_KEY_ID = os.environ.get('ALIYUN_ACCESS_KEY_ID', '')
    ALIYUN_ACCESS_KEY_SECRET = os.environ.get('ALIYUN_ACCESS_KEY_SECRET', '')
    ALIYUN_DOMAIN = os.environ.get('ALIYUN_DOMAIN', '0379.email')
    ALIYUN_SUB_DOMAIN = os.environ.get('ALIYUN_SUB_DOMAIN', 'ddns')
    ALIYUN_TTL = int(os.environ.get('ALIYUN_TTL', '600'))

class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True
    TESTING = False
    SQLALCHEMY_DATABASE_URI = 'sqlite:///dev.db'

class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False
    TESTING = False

    # 生产环境强制 HTTPS
    SESSION_COOKIE_SECURE = True
    JWT_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    JWT_COOKIE_HTTPONLY = True

    # Sentry 错误追踪
    SENTRY_DSN = os.environ.get('SENTRY_DSN')
    SENTRY_TRACES_SAMPLE_RATE = 0.2  # 20% 的请求进行追踪

class TestingConfig(Config):
    """测试环境配置"""
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'  # 内存数据库
    WTF_CSRF_ENABLED = False

class StagingConfig(Config):
    """预发布环境配置"""
    DEBUG = False
    TESTING = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('STAGING_DATABASE_URL') or 'postgresql://user:pass@localhost/nas_ddns_staging'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'staging': StagingConfig,
    'default': DevelopmentConfig
}
