from datetime import datetime
import uuid
from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin

db = SQLAlchemy()


class User(UserMixin, db.Model):
    """用户模型"""
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(80), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), default='user', nullable=False)  # admin, user, operator
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # 关系
    api_keys = db.relationship('APIKey', backref='user', lazy='dynamic', cascade='all, delete-orphan')
    domains = db.relationship('Domain', backref='owner', lazy='dynamic')

    def set_password(self, password):
        """设置密码哈希"""
        from werkzeug.security import generate_password_hash
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """验证密码"""
        from werkzeug.security import check_password_hash
        return check_password_hash(self.password_hash, password)


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
    name = db.Column(db.String(255), nullable=False)  # 子域名 (如 www)
    type = db.Column(db.String(10), nullable=False)  # A, AAAA, CNAME, MX, TXT
    value = db.Column(db.Text, nullable=False)
    ttl = db.Column(db.Integer, default=600)
    priority = db.Column(db.Integer, default=10)  # 用于 MX 记录
    proxied = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class APIKey(db.Model):
    """API 密钥模型"""
    __tablename__ = 'api_keys'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    key_id = db.Column(db.String(64), unique=True, nullable=False, index=True)  # ID部分
    key_hash = db.Column(db.String(255), nullable=False)  # 哈希后的 Secret
    name = db.Column(db.String(100), nullable=False)
    scopes = db.Column(db.JSON, default=list)  # 权限范围 ['read', 'write']
    last_used_at = db.Column(db.DateTime)
    expires_at = db.Column(db.DateTime)
    is_revoked = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)


class Alert(db.Model):
    """告警模型"""
    __tablename__ = 'alerts'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    severity = db.Column(db.String(20), nullable=False)  # critical, warning, info
    source = db.Column(db.String(100))  # ddns, system, api
    message = db.Column(db.Text, nullable=False)
    details = db.Column(db.JSON)  # 额外详情
    status = db.Column(db.String(20), default='active')  # active, resolved
    resolved_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    resolved_by = db.Column(db.String(36), db.ForeignKey('users.id'))
    resolution_notes = db.Column(db.Text)


class OperationLog(db.Model):
    """操作日志模型"""
    __tablename__ = 'operation_logs'

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'))
    action = db.Column(db.String(100), nullable=False)  # 操作类型
    resource = db.Column(db.String(255))  # 操作的资源
    details = db.Column(db.JSON)  # 详细信息
    ip_address = db.Column(db.String(45))  # IPv4 或 IPv6
    user_agent = db.Column(db.String(500))  # 浏览器信息
    status = db.Column(db.String(20), default='success')  # success, failed
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
