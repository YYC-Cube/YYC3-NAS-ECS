# YYC3-DDNS-API

## 1. 依赖文件

这是构建 Python 环境的基础。针对 32GB 内存的服务器，我们包含了性能优化相关的库。

# requirements.txt

# ======================

# Web 核心框架

# ======================

  Flask==3.0.0
  Flask-CORS==4.0.0
  Flask-SQLAlchemy==3.1.1
  Flask-Migrate==4.0.5
  Flask-JWT-Extended==4.5.3
  Flask-Limiter==3.5.0
  Flask-Caching==2.1.0
  Werkzeug==3.0.1

# ======================

# 异步与 WebSocket

# ======================

  Flask-SocketIO==5.3.5
  python-socketio==5.10.0
  eventlet==0.33.3
  gevent==23.9.1
  greenlet==3.0.1

# ======================

# 任务队列

# ======================

  celery==5.3.4
  redis==5.0.1

# ======================

# 数据库驱动

# ======================

  psycopg2-binary==2.9.9

# ======================

# 监控与日志

# ======================

  prometheus-flask-exporter==0.23.0
  prometheus-client==0.19.0
  sentry-sdk[flask]==1.39.1
  python-json-logger==2.0.7

# ======================

# 工具库

# ======================

  requests==2.31.0
  cryptography==41.0.7
  pydantic==2.5.2
  python-dotenv==1.0.0
  gunicorn==21.2.0

# ======================

# 阿里云 SDK (DDNS)

# ======================

  alibabacloud-tea-openapi==0.3.8
  alibabacloud-alidns20150109==3.0.1
  alibabacloud-tea-util==0.3.11
  alibabacloud-endpoint-util==0.0.3

# requirements-dev.txt

  -r requirements.txt

# 测试

  pytest==7.4.3
  pytest-cov==4.1.0
  pytest-flask==1.3.0
  pytest-asyncio==0.21.1

# 代码质量

  flake8==6.1.0
  black==23.12.1
  isort==5.13.2
  mypy==1.7.1

# 数据工厂 (测试数据)

  factory-boy==3.3.0
  faker==20.1.0

--------

### 2. 配置文件

根据您的 32GB 内存和 4 核 CPU，我们在生产配置中调大了连接池大小，以充分利用资源。

# config/config.py

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
      # 生产环境建议使用 PostgreSQL
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

  class DevelopmentConfig(Config):
      """开发环境配置"""
      DEBUG = True
      TESTING = False
      # 开发环境使用 SQLite 方便调试
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
      SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:' # 内存数据库
      WTF_CSRF_ENABLED = False

  config = {
      'development': DevelopmentConfig,
      'production': ProductionConfig,
      'testing': TestingConfig,
      'default': DevelopmentConfig
  }

--------

### 3. 数据模型

这是  app/__init__.py  中 shell context 依赖的核心文件，定义了数据库结构。

# app/models.py

  from flask_sqlalchemy import SQLAlchemy
  from flask_login import UserMixin
  from datetime import datetime
  import uuid

  db = SQLAlchemy()

  class User(UserMixin, db.Model):
      """用户模型"""
      __tablename__ = 'users'

      id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
      username = db.Column(db.String(80), unique=True, nullable=False, index=True)
      email = db.Column(db.String(120), unique=True, nullable=False, index=True)
      password_hash = db.Column(db.String(255), nullable=False)
      role = db.Column(db.String(20), default='user', nullable=False) # admin, user, operator
      is_active = db.Column(db.Boolean, default=True)
      created_at = db.Column(db.DateTime, default=datetime.utcnow)
      updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

      # 关系
      api_keys = db.relationship('APIKey', backref='user', lazy='dynamic', cascade='all, delete-orphan')
      domains = db.relationship('Domain', backref='owner', lazy='dynamic')

  class Domain(db.Model):
      """域名模型"""
      __tablename__ = 'domains'

      id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
      name = db.Column(db.String(255), nullable=False, index=True)
      registrar = db.Column(db.String(100))
      expiry_date = db.Column(db.Date)
      user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
      is_active = db.Column(db.Boolean, default=True)
      created_at = db.Column(db.DateTime, default=datetime.utcnow)

      # 关系
      dns_records = db.relationship('DNSRecord', backref='domain', lazy='dynamic', cascade='all, delete-orphan')

  class DNSRecord(db.Model):
      """DNS 记录模型"""
      __tablename__ = 'dns_records'

      id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
      domain_id = db.Column(db.String(36), db.ForeignKey('domains.id'), nullable=False)
      name = db.Column(db.String(255), nullable=False) # 子域名 (如 www)
      type = db.Column(db.String(10), nullable=False) # A, AAAA, CNAME, MX, TXT
      value = db.Column(db.Text, nullable=False)
      ttl = db.Column(db.Integer, default=600)
      priority = db.Column(db.Integer, default=10) # 用于 MX 记录
      proxied = db.Column(db.Boolean, default=False)
      is_active = db.Column(db.Boolean, default=True)
      created_at = db.Column(db.DateTime, default=datetime.utcnow)
      updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

  class APIKey(db.Model):
      """API 密钥模型"""
      __tablename__ = 'api_keys'

      id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
      key_id = db.Column(db.String(64), unique=True, nullable=False, index=True) # ID部分
      key_hash = db.Column(db.String(255), nullable=False) # 哈希后的 Secret
      name = db.Column(db.String(100), nullable=False)
      scopes = db.Column(db.JSON, default=list) # 权限范围 ['read', 'write']
      last_used_at = db.Column(db.DateTime)
      expires_at = db.Column(db.DateTime)
      is_revoked = db.Column(db.Boolean, default=False)
      user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
      created_at = db.Column(db.DateTime, default=datetime.utcnow)

  class Alert(db.Model):
      """告警模型"""
      __tablename__ = 'alerts'

      id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
      severity = db.Column(db.String(20), nullable=False) # critical, warning, info
      source = db.Column(db.String(100)) # ddns, system, api
      message = db.Column(db.Text, nullable=False)
      details = db.Column(db.JSON) # 额外详情
      status = db.Column(db.String(20), default='active') # active, resolved
      resolved_at = db.Column(db.DateTime)
      created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

--------

### 4. Celery 异步任务

这是连接 Flask 应用和 Worker 的桥梁。

# app/celery.py

  from celery import Celery
  from app import create_app

  def make_celery(app):
      """创建 Celery 实例并与 Flask 应用绑定"""
      celery = Celery(
          app.import_name,
          backend=app.config['CELERY_RESULT_BACKEND'],
          broker=app.config['CELERY_BROKER_URL']
      )

      # 从 Flask 配置更新 Celery 配置
      celery.conf.update(
          task_serializer='json',
          accept_content=['json'],
          result_serializer='json',
          timezone='Asia/Shanghai',
          enable_utc=True,
          task_track_started=True,
          task_time_limit=30 * 60, # 硬限制 30 分钟
          task_soft_time_limit=25 * 60, # 软限制 25 分钟
          worker_prefetch_multiplier=4, # 预取 4 倍任务
      )

      class ContextTask(celery.Task):
          """使任务在 Flask 上下文中运行"""
          def __call__(self, *args, **kwargs):
              with app.app_context():
                  return self.run(*args, **kwargs)

      celery.Task = ContextTask
      return celery

# 创建 Flask 应用和 Celery 实例

# 注意：这里不要直接 create_app()，以免循环导入

# 这个文件主要是被其他模块导入使用

# 注册任务

  from .tasks import register_tasks

# 示例：需要在主应用初始化时调用

  def init_celery(app):
      celery = make_celery(app)
      register_tasks(celery)
      return celery

# app/tasks.py

# Celery 具体任务定义

  def register_tasks(celery):

      @celery.task(name='tasks.ddns_update')
      def update_ddns_record(record_id, new_ip):
          """异步执行 DDNS 更新"""
          # 模拟耗时操作
          import time
          time.sleep(2)

          # 这里调用实际的阿里云 API 更新逻辑
          # update_aliyun_dns(record_id, new_ip)

          return {'status': 'success', 'record_id': record_id, 'ip': new_ip}

      @celery.task(name='tasks.send_email')
      def send_email_async(to, subject, body):
          """异步发送邮件"""
          # 模拟发送
          print(f"Sending email to {to}...")
          return {'status': 'sent', 'to': to}

      @celery.task(name='tasks.generate_report')
      def generate_monthly_report(user_id):
          """生成月度报告"""
          # 复杂的数据分析逻辑
          return {'report_url': '/reports/jan_2026.pdf'}

--------

### 5. 数据库初始化 SQL

用于在 PostgreSQL 容器启动时自动执行。这里主要处理 PostgreSQL 的插件初始化，表结构建议由 Alembic 管理。

  -- docker/postgres/init.sql

  -- 1. 创建 UUID 扩展 (如果使用 UUID 作为主键)
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- 2. 创建 HStore 扩展 (用于存储键值对配置)
  CREATE EXTENSION IF NOT EXISTS "hstore";

  -- 3. 创建 PG_STAT_STATEMENTS 扩展 (用于性能监控)
  CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

  -- 4. 创建基础用户 (可选，如果不使用环境变量创建)
  -- CREATE USER nas_admin WITH PASSWORD 'your_password';
  -- CREATE DATABASE nas_ddns OWNER nas_admin;

  -- 5. 授权
  -- GRANT ALL PRIVILEGES ON DATABASE nas_ddns TO nas_admin;
  -- GRANT ALL ON SCHEMA public TO nas_admin;

--------

### 6. 辅助文件

防止将不必要的文件打包进 Docker 镜像，减小体积。

# .dockerignore

# Python

  __pycache__/
  *.py[cod]
  *$py.class
  *.so
  .Python
  env/
  venv/
  ENV/
  build/
  develop-eggs/
  dist/
  downloads/
  eggs/
  .eggs/
  lib/
  lib64/
  parts/
  sdist/
  var/
  wheels/
  *.egg-info/
  .installed.cfg
  *.egg

# 虚拟环境

  .venv
  venv/

# IDE

  .vscode/
  .idea/
  *.swp
  *.swo
  *~

# 环境变量

  .env
  .env.local

# Git

  .git
  .gitignore

# Docker

  docker-compose.yml
  Dockerfile
  .dockerignore

# 测试

  .coverage
  .pytest_cache/
  htmlcov/

# 日志

  logs/
  *.log

# 数据

  data/
  backup/

--------
