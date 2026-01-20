import secrets
import hashlib
import json
import os
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, g


class APIKeyManager:
    def __init__(self):
        self.keys_file = os.path.join(os.path.dirname(__file__), '..', 'data', 'api_keys.json')
        self.keys_collection = self._load_keys()

    def _load_keys(self):
        """从文件加载API密钥"""
        try:
            if os.path.exists(self.keys_file):
                with open(self.keys_file, 'r') as f:
                    return json.load(f)
        except Exception as e:
            print(f"Error loading API keys: {e}")
        return {}

    def _save_keys(self):
        """保存API密钥到文件"""
        try:
            os.makedirs(os.path.dirname(self.keys_file), exist_ok=True)
            with open(self.keys_file, 'w') as f:
                json.dump(self.keys_collection, f, indent=2, default=str)
        except Exception as e:
            print(f"Error saving API keys: {e}")

    def generate_key(self, name, user_id, scopes=None, expires_in_days=365):
        """生成新的API密钥"""
        if scopes is None:
            scopes = ['read', 'write']

        # 生成随机密钥
        secret = secrets.token_urlsafe(32)
        key_id = secrets.token_urlsafe(16)

        # 存储哈希值（不存储原始密钥）
        key_hash = hashlib.sha256(secret.encode()).hexdigest()

        key_data = {
            "key_id": key_id,
            "name": name,
            "user_id": user_id,
            "key_hash": key_hash,
            "scopes": scopes,
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + timedelta(days=expires_in_days)).isoformat(),
            "last_used": None,
            "usage_count": 0,
            "revoked": False
        }

        self.keys_collection[key_id] = key_data
        self._save_keys()

        # 返回可查看的密钥（仅此一次）
        return {
            "key_id": key_id,
            "api_key": f"{key_id}.{secret}",
            "name": name,
            "scopes": scopes,
            "expires_at": key_data["expires_at"],
            "warning": "Store this key securely. It will not be shown again."
        }

    def validate_key(self, api_key):
        """验证API密钥"""
        try:
            key_id, secret = api_key.split(".", 1)
        except ValueError:
            return None

        if key_id not in self.keys_collection:
            return None

        key_data = self.keys_collection[key_id]

        # 检查是否已撤销或过期
        if key_data["revoked"]:
            return None

        expires_at = datetime.fromisoformat(key_data["expires_at"])
        if datetime.utcnow() > expires_at:
            return None

        # 验证密钥
        provided_hash = hashlib.sha256(secret.encode()).hexdigest()
        if key_data["key_hash"] != provided_hash:
            return None

        # 更新使用信息
        key_data["last_used"] = datetime.utcnow().isoformat()
        key_data["usage_count"] += 1
        self._save_keys()

        return {
            "key_id": key_id,
            "user_id": key_data["user_id"],
            "scopes": key_data["scopes"]
        }

    def revoke_key(self, key_id, user_id):
        """撤销API密钥"""
        if key_id in self.keys_collection:
            key_data = self.keys_collection[key_id]
            if key_data["user_id"] == user_id or key_data.get('is_admin', False):
                key_data["revoked"] = True
                self._save_keys()
                return True
        return False

    def list_keys(self, user_id):
        """列出用户的所有API密钥"""
        keys = []
        for key_id, key_data in self.keys_collection.items():
            if key_data["user_id"] == user_id:
                keys.append({
                    "key_id": key_id,
                    "name": key_data["name"],
                    "scopes": key_data["scopes"],
                    "created_at": key_data["created_at"],
                    "expires_at": key_data["expires_at"],
                    "last_used": key_data["last_used"],
                    "usage_count": key_data["usage_count"],
                    "revoked": key_data["revoked"]
                })
        return keys


# 全局 API 密钥管理器实例
api_key_manager = APIKeyManager()


# API密钥验证装饰器
def api_key_required(f):
    """API 密钥认证装饰器"""
    @wraps(f)
    def decorated(*args, **kwargs):
        api_key = request.headers.get("X-API-Key")
        if not api_key:
            return jsonify({"success": False, "error": "API key is required"}), 401

        key_info = api_key_manager.validate_key(api_key)
        if not key_info:
            return jsonify({"success": False, "error": "Invalid API key"}), 401

        g.key_info = key_info
        return f(*args, **kwargs)
    return decorated


def scope_required(scope):
    """API 密钥权限范围验证装饰器"""
    def decorator(f):
        @wraps(f)
        @api_key_required
        def decorated(*args, **kwargs):
            if scope not in g.key_info.get("scopes", []):
                return jsonify({"success": False, "error": f"Missing required scope: {scope}"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator
