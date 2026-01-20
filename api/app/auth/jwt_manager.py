import jwt
import datetime
from datetime import timedelta
import os
from functools import wraps
from flask import request, jsonify, g
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

class JWTAuthManager:
    def __init__(self, app=None):
        self.private_key = None
        self.public_key = None
        self.algorithm = "HS256"  # 使用对称加密简化配置
        self.access_token_expiry = datetime.timedelta(hours=1)
        self.refresh_token_expiry = datetime.timedelta(days=7)

        if app:
            self.init_app(app)

    def init_app(self, app):
        """初始化 JWT 管理器"""
        self.secret_key = app.config.get('JWT_SECRET_KEY', 'default-secret-key')
        self.algorithm = app.config.get('JWT_ALGORITHM', 'HS256')
        access_expiry = app.config.get('JWT_ACCESS_TOKEN_EXPIRES', timedelta(hours=1))
        refresh_expiry = app.config.get('JWT_REFRESH_TOKEN_EXPIRES', timedelta(days=7))

        if isinstance(access_expiry, (int, float)):
            self.access_token_expiry = datetime.timedelta(seconds=access_expiry)
        else:
            self.access_token_expiry = access_expiry

        if isinstance(refresh_expiry, (int, float)):
            self.refresh_token_expiry = datetime.timedelta(seconds=refresh_expiry)
        else:
            self.refresh_token_expiry = refresh_expiry

    def create_access_token(self, user_id, roles=None, additional_claims=None):
        """创建访问令牌"""
        payload = {
            "sub": user_id,
            "type": "access",
            "iat": datetime.datetime.utcnow(),
            "exp": datetime.datetime.utcnow() + self.access_token_expiry,
            "roles": roles or ["user"],
            "iss": "nas-ddns-api",
        }

        if additional_claims:
            payload.update(additional_claims)

        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def create_refresh_token(self, user_id):
        """创建刷新令牌"""
        payload = {
            "sub": user_id,
            "type": "refresh",
            "iat": datetime.datetime.utcnow(),
            "exp": datetime.datetime.utcnow() + self.refresh_token_expiry,
            "iss": "nas-ddns-api",
        }
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)

    def verify_token(self, token):
        """验证令牌"""
        try:
            payload = jwt.decode(
                token,
                self.secret_key,
                algorithms=[self.algorithm],
                issuer="nas-ddns-api"
            )
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

    def refresh_token(self, refresh_token):
        """刷新访问令牌"""
        payload = self.verify_token(refresh_token)
        if payload and payload.get("type") == "refresh":
            return self.create_access_token(payload["sub"], payload.get("roles"))
        return None


# 认证装饰器
def token_required(f):
    """JWT 认证装饰器"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"success": False, "error": "Token is missing"}), 401

        payload = jwt_auth.verify_token(token)
        if not payload:
            return jsonify({"success": False, "error": "Invalid token"}), 401

        g.user_id = payload["sub"]
        g.user_roles = payload.get("roles", [])
        return f(*args, **kwargs)
    return decorated


def role_required(role):
    """角色权限验证装饰器"""
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated(*args, **kwargs):
            if role not in g.user_roles and 'admin' not in g.user_roles:
                return jsonify({"success": False, "error": "Insufficient permissions"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator


# 全局 JWT 管理器实例
jwt_auth = JWTAuthManager()
