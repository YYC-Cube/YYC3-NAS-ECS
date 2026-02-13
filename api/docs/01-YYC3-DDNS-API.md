# YYC³（YanYuCloudCube）API 多元化设计文档

> 基于已经实现的DDNS系统，将设计一套完整的、多元化的API，用于开发和生产环境。

 考虑到系统已经有的功能，我们将设计以下API模块：

 1. 系统状态API：提供系统健康检查、版本信息、运行状态等。
 2. DDNS管理API：提供DDNS配置、状态、手动触发更新、日志查看等。
 3. 监控数据API：提供系统资源监控、服务状态、历史数据等。
 4. 报告管理API：提供报告生成、查看、下载等。
 5. 配置管理API：提供配置的查看、更新（注意安全）等。
 6. 服务管理API：提供服务的启动、停止、重启等（需要权限控制）。

 我们将遵循RESTful设计原则，使用JSON作为数据交换格式。

 注意：由于API可能涉及敏感操作（如重启服务、更新配置），需要设计适当的权限验证（例如API密钥、JWT令牌等）。
 但根据当前系统情况，我们暂时使用简单的API密钥验证（通过请求头传递）。

 我们将在现有的Flask应用（app.py）基础上进行扩展。

 以下是详细的API设计：

## NAS DDNS 系统 - 完整API设计与实现方案

基于上述DDNS系统，我为您设计一套完整的多元化API系统，涵盖开发、生产、监控、管理等多个方面。

## 📋 **API设计目录**

1. 总体架构设计
2. 认证与安全
3. 核心API模块
4. 开发环境API
5. 生产环境API
6. 监控与告警API
7. 配置管理API
8. 数据分析API
9. WebSocket实时API
10. 第三方集成API
11. API文档与测试
12. 部署与运维

## 1. **总体架构设计**

### 1.1 API网关架构

```yaml
# API网关配置文件
api_version: "2.0"
services:
  - name: "nas-ddns-api"
    version: "2.0.0"
    environment: "${ENVIRONMENT}"
    base_path: "/api/v2"
    
gateway:
  host: "api.ddns.0379.email"
  port: 8443
  protocols:
    - https
    - wss
    
rate_limiting:
  global: "1000r/s"
  per_user: "100r/s"
  burst: 50
  
caching:
  enabled: true
  ttl: 300
  strategy: "redis"
  
load_balancing:
  strategy: "round-robin"
  health_check: "/api/v2/health"
```

### 1.2 微服务划分

```python
# services.py - 微服务定义
SERVICES = {
    "core": {
        "name": "ddns-core",
        "port": 8001,
        "endpoints": ["/ddns", "/domains", "/records"],
        "health": "/health"
    },
    "monitor": {
        "name": "monitor-service",
        "port": 8002,
        "endpoints": ["/metrics", "/alerts", "/logs"],
        "health": "/status"
    },
    "config": {
        "name": "config-service",
        "port": 8003,
        "endpoints": ["/configs", "/secrets", "/templates"],
        "health": "/ping"
    },
    "analytics": {
        "name": "analytics-service",
        "port": 8004,
        "endpoints": ["/stats", "/reports", "/trends"],
        "health": "/ready"
    },
    "notify": {
        "name": "notification-service",
        "port": 8005,
        "endpoints": ["/notifications", "/channels", "/templates"],
        "health": "/alive"
    }
}
```

## 2. **认证与安全**

### 2.1 JWT认证模块

```python
# auth/jwt_manager.py
import jwt
import datetime
from functools import wraps
from flask import request, jsonify
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.backends import default_backend

class JWTAuthManager:
    def __init__(self):
        self.private_key = self._load_private_key()
        self.public_key = self._load_public_key()
        self.algorithm = "RS256"
        self.access_token_expiry = datetime.timedelta(hours=1)
        self.refresh_token_expiry = datetime.timedelta(days=7)
    
    def _load_private_key(self):
        """加载或生成RSA私钥"""
        key_path = "/opt/nas-ecs/secrets/jwt_private.pem"
        if os.path.exists(key_path):
            with open(key_path, "rb") as f:
                return serialization.load_pem_private_key(
                    f.read(),
                    password=None,
                    backend=default_backend()
                )
        else:
            # 生成新密钥
            private_key = rsa.generate_private_key(
                public_exponent=65537,
                key_size=2048,
                backend=default_backend()
            )
            pem = private_key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )
            with open(key_path, "wb") as f:
                f.write(pem)
            return private_key
    
    def create_access_token(self, user_id, roles=None):
        """创建访问令牌"""
        payload = {
            "sub": user_id,
            "type": "access",
            "iat": datetime.datetime.utcnow(),
            "exp": datetime.datetime.utcnow() + self.access_token_expiry,
            "roles": roles or ["user"],
            "iss": "nas-ddns-api",
            "aud": ["api.ddns.0379.email"]
        }
        return jwt.encode(payload, self.private_key, algorithm=self.algorithm)
    
    def verify_token(self, token):
        """验证令牌"""
        try:
            payload = jwt.decode(
                token,
                self.public_key,
                algorithms=[self.algorithm],
                issuer="nas-ddns-api",
                audience="api.ddns.0379.email"
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
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({"error": "Token is missing"}), 401
        
        payload = jwt_auth.verify_token(token)
        if not payload:
            return jsonify({"error": "Invalid token"}), 401
        
        request.user_id = payload["sub"]
        request.user_roles = payload.get("roles", [])
        return f(*args, **kwargs)
    return decorated

def role_required(role):
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated(*args, **kwargs):
            if role not in request.user_roles:
                return jsonify({"error": "Insufficient permissions"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator
```

### 2.2 API密钥管理

```python
# auth/api_keys.py
import secrets
import hashlib
from datetime import datetime, timedelta

class APIKeyManager:
    def __init__(self):
        self.keys_collection = self._load_keys()
    
    def generate_key(self, name, user_id, scopes, expires_in=365):
        """生成新的API密钥"""
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
            "expires_at": (datetime.utcnow() + timedelta(days=expires_in)).isoformat(),
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
            if key_data["user_id"] == user_id:
                key_data["revoked"] = True
                self._save_keys()
                return True
        return False

# API密钥验证装饰器
def api_key_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        api_key = request.headers.get("X-API-Key")
        if not api_key:
            return jsonify({"error": "API key is required"}), 401
        
        key_info = api_key_manager.validate_key(api_key)
        if not key_info:
            return jsonify({"error": "Invalid API key"}), 401
        
        request.key_info = key_info
        return f(*args, **kwargs)
    return decorated

def scope_required(scope):
    def decorator(f):
        @wraps(f)
        @api_key_required
        def decorated(*args, **kwargs):
            if scope not in request.key_info["scopes"]:
                return jsonify({"error": f"Missing required scope: {scope}"}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator
```

### 2.3 速率限制

```python
# middleware/rate_limit.py
import redis
from functools import wraps
from flask import request, jsonify
from datetime import datetime, timedelta

class RateLimiter:
    def __init__(self):
        self.redis_client = redis.Redis(
            host=os.getenv("REDIS_HOST", "localhost"),
            port=int(os.getenv("REDIS_PORT", 6379)),
            db=int(os.getenv("REDIS_DB", 0))
        )
        
        # 定义速率限制规则
        self.rules = {
            "global": {"limit": 1000, "window": 60},  # 60秒内1000次
            "per_user": {"limit": 100, "window": 60}, # 60秒内100次
            "per_ip": {"limit": 50, "window": 60},    # 60秒内50次
            "auth": {"limit": 10, "window": 300},     # 5分钟内10次
            "ddns": {"limit": 5, "window": 300}       # 5分钟内5次
        }
    
    def is_rate_limited(self, key, rule_name="per_user"):
        """检查是否超过速率限制"""
        if rule_name not in self.rules:
            return False
        
        rule = self.rules[rule_name]
        current_time = datetime.utcnow()
        window_start = current_time - timedelta(seconds=rule["window"])
        
        # 使用Redis sorted set存储请求时间戳
        pipe = self.redis_client.pipeline()
        
        # 清理过期记录
        pipe.zremrangebyscore(key, 0, window_start.timestamp())
        
        # 获取窗口内的请求数量
        pipe.zcard(key)
        
        # 添加当前请求
        pipe.zadd(key, {current_time.timestamp(): current_time.timestamp()})
        
        # 设置过期时间
        pipe.expire(key, rule["window"] * 2)
        
        results = pipe.execute()
        request_count = results[1]
        
        return request_count >= rule["limit"]
    
    def get_headers(self, key, rule_name="per_user"):
        """获取速率限制头部信息"""
        if rule_name not in self.rules:
            return {}
        
        rule = self.rules[rule_name]
        current_time = datetime.utcnow()
        window_start = current_time - timedelta(seconds=rule["window"])
        
        # 获取窗口内的最早请求时间
        earliest = self.redis_client.zrangebyscore(key, window_start.timestamp(), '+inf', start=0, num=1)
        
        if earliest:
            reset_time = float(earliest[0]) + rule["window"]
            remaining = rule["limit"] - self.redis_client.zcount(key, window_start.timestamp(), '+inf')
        else:
            reset_time = current_time.timestamp() + rule["window"]
            remaining = rule["limit"]
        
        return {
            "X-RateLimit-Limit": rule["limit"],
            "X-RateLimit-Remaining": max(0, remaining),
            "X-RateLimit-Reset": int(reset_time)
        }

def rate_limit(rule_name="per_user", key_func=None):
    """速率限制装饰器"""
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if key_func:
                key = f"ratelimit:{rule_name}:{key_func()}"
            else:
                # 默认使用IP地址
                key = f"ratelimit:{rule_name}:{request.remote_addr}"
            
            if rate_limiter.is_rate_limited(key, rule_name):
                headers = rate_limiter.get_headers(key, rule_name)
                return jsonify({
                    "error": "Rate limit exceeded",
                    "message": f"Too many requests. Try again in {headers.get('X-RateLimit-Reset', 0)} seconds."
                }), 429, headers
            
            headers = rate_limiter.get_headers(key, rule_name)
            response = f(*args, **kwargs)
            
            if isinstance(response, tuple) and len(response) >= 2:
                response_headers = response[2] if len(response) >= 3 else {}
                response_headers.update(headers)
                return (response[0], response[1], response_headers)
            
            return response
        return decorated
    return decorator

# 使用示例
@app.route("/api/v2/ddns/update", methods=["POST"])
@rate_limit("ddns", key_func=lambda: request.headers.get("X-API-Key", request.remote_addr))
@token_required
def update_ddns():
    # API逻辑
    pass
```

## 3. **核心API模块**

### 3.1 DDNS管理API

```python
# api/v2/ddns.py
from flask import Blueprint, request, jsonify
from datetime import datetime
import logging

ddns_bp = Blueprint('ddns_v2', __name__, url_prefix='/api/v2/ddns')
logger = logging.getLogger('ddns_api')

@ddns_bp.route('/status', methods=['GET'])
@token_required
def get_ddns_status():
    """获取DDNS服务状态"""
    try:
        # 从配置文件获取状态
        status_file = "/opt/nas-ecs/run/status.json"
        if os.path.exists(status_file):
            with open(status_file, 'r') as f:
                status_data = json.load(f)
        else:
            status_data = {"success": False, "message": "Status file not found"}
        
        # 获取系统DDNS运行状态
        ddns_running = os.system("systemctl is-active --quiet yyc3-ddns.timer") == 0
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "ddns_enabled": True,
                "ddns_running": ddns_running,
                "last_check": status_data.get("timestamp"),
                "current_ip": status_data.get("current_ip"),
                "domain": status_data.get("domain"),
                "status": status_data.get("message"),
                "next_check": None,  # 可以从定时器获取
                "uptime": get_service_uptime("yyc3-ddns.timer")
            },
            "metadata": {
                "version": "v2",
                "request_id": request.request_id
            }
        })
    except Exception as e:
        logger.error(f"Error getting DDNS status: {e}")
        return jsonify({
            "success": False,
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }), 500

@ddns_bp.route('/records', methods=['GET'])
@token_required
@rate_limit("per_user")
def list_dns_records():
    """列出所有DNS记录"""
    domain = request.args.get('domain', '0379.email')
    subdomain = request.args.get('subdomain')
    record_type = request.args.get('type', 'A')
    
    try:
        # 调用阿里云API获取DNS记录
        records = get_aliyun_dns_records(domain, subdomain, record_type)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "domain": domain,
                "records": records,
                "count": len(records)
            },
            "pagination": {
                "page": request.args.get('page', 1, type=int),
                "per_page": request.args.get('per_page', 50, type=int),
                "total": len(records)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@ddns_bp.route('/records', methods=['POST'])
@token_required
@role_required("admin")
def create_dns_record():
    """创建DNS记录"""
    data = request.get_json()
    
    required_fields = ["domain", "rr", "type", "value"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({
            "success": False,
            "error": f"Missing required fields: {', '.join(missing)}"
        }), 400
    
    try:
        # 调用阿里云API创建记录
        result = create_aliyun_dns_record(
            domain=data["domain"],
            rr=data["rr"],
            type=data["type"],
            value=data["value"],
            ttl=data.get("ttl", 600),
            priority=data.get("priority")
        )
        
        # 记录操作日志
        log_operation(
            user_id=request.user_id,
            action="create_dns_record",
            resource=f"{data['rr']}.{data['domain']}",
            details=data
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": result,
            "message": "DNS record created successfully"
        }), 201
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@ddns_bp.route('/records/<string:record_id>', methods=['PUT'])
@token_required
@role_required("admin")
def update_dns_record(record_id):
    """更新DNS记录"""
    data = request.get_json()
    
    try:
        # 调用阿里云API更新记录
        result = update_aliyun_dns_record(record_id, data)
        
        log_operation(
            user_id=request.user_id,
            action="update_dns_record",
            resource=record_id,
            details=data
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": result,
            "message": "DNS record updated successfully"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@ddns_bp.route('/records/<string:record_id>', methods=['DELETE'])
@token_required
@role_required("admin")
def delete_dns_record(record_id):
    """删除DNS记录"""
    try:
        # 调用阿里云API删除记录
        result = delete_aliyun_dns_record(record_id)
        
        log_operation(
            user_id=request.user_id,
            action="delete_dns_record",
            resource=record_id
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "message": "DNS record deleted successfully"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@ddns_bp.route('/manual-update', methods=['POST'])
@token_required
@role_required("admin")
@rate_limit("ddns")
def manual_ddns_update():
    """手动触发DDNS更新"""
    force = request.args.get('force', 'false').lower() == 'true'
    
    try:
        # 执行DDNS更新脚本
        result = run_ddns_update(force=force)
        
        log_operation(
            user_id=request.user_id,
            action="manual_ddns_update",
            resource="ddns",
            details={"force": force, "result": result}
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": result,
            "message": "DDNS update triggered successfully"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@ddns_bp.route('/history', methods=['GET'])
@token_required
def get_update_history():
    """获取DDNS更新历史"""
    try:
        # 从日志文件读取历史记录
        history = get_ddns_update_history(
            limit=request.args.get('limit', 100, type=int),
            offset=request.args.get('offset', 0, type=int)
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "history": history,
                "count": len(history)
            },
            "pagination": {
                "limit": request.args.get('limit', 100, type=int),
                "offset": request.args.get('offset', 0, type=int),
                "total": get_total_history_count()
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
```

### 3.2 域名管理API

```python
# api/v2/domains.py
from flask import Blueprint, request, jsonify

domains_bp = Blueprint('domains_v2', __name__, url_prefix='/api/v2/domains')

@domains_bp.route('', methods=['GET'])
@token_required
def list_domains():
    """列出所有管理的域名"""
    try:
        domains = get_managed_domains()
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "domains": domains,
                "count": len(domains)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@domains_bp.route('/<string:domain>/status', methods=['GET'])
@token_required
def get_domain_status(domain):
    """获取域名状态"""
    try:
        # 检查域名解析
        resolution_status = check_domain_resolution(domain)
        
        # 获取SSL证书状态
        ssl_status = check_ssl_certificate(domain)
        
        # 获取WHOIS信息
        whois_info = get_whois_info(domain)
        
        # 检查DNS记录
        dns_records = get_dns_records_for_domain(domain)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "domain": domain,
                "resolution": resolution_status,
                "ssl": ssl_status,
                "whois": whois_info,
                "dns_records": {
                    "count": len(dns_records),
                    "records": dns_records[:10]  # 只返回前10条
                },
                "health_score": calculate_domain_health_score(
                    resolution_status, ssl_status, dns_records
                )
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@domains_bp.route('/<string:domain>/dnssec', methods=['GET'])
@token_required
@role_required("admin")
def get_dnssec_status(domain):
    """获取DNSSEC状态"""
    try:
        dnssec_status = check_dnssec_status(domain)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "domain": domain,
                "dnssec_enabled": dnssec_status.get("enabled", False),
                "status": dnssec_status.get("status"),
                "algorithm": dnssec_status.get("algorithm"),
                "digest": dnssec_status.get("digest"),
                "public_key": dnssec_status.get("public_key"),
                "flags": dnssec_status.get("flags")
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@domains_bp.route('/<string:domain>/transfer', methods=['POST'])
@token_required
@role_required("admin")
def initiate_domain_transfer(domain):
    """初始化域名转移"""
    data = request.get_json()
    
    try:
        # 验证转移授权码
        auth_code = data.get("auth_code")
        if not auth_code:
            return jsonify({
                "success": False,
                "error": "Authorization code is required"
            }), 400
        
        # 启动域名转移流程
        transfer_result = initiate_domain_transfer_to_aliyun(domain, auth_code)
        
        log_operation(
            user_id=request.user_id,
            action="initiate_domain_transfer",
            resource=domain,
            details={"status": "initiated"}
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": transfer_result,
            "message": "Domain transfer initiated"
        }), 202
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
```

## 4. **开发环境API**

### 4.1 开发工具API

```python
# api/v2/dev/tools.py
from flask import Blueprint, request, jsonify

dev_bp = Blueprint('dev_v2', __name__, url_prefix='/api/v2/dev')

@dev_bp.route('/test-dns', methods=['POST'])
@api_key_required
@scope_required("dev:tools")
def test_dns_resolution():
    """测试DNS解析（开发工具）"""
    data = request.get_json()
    
    domain = data.get('domain')
    record_type = data.get('type', 'A')
    nameserver = data.get('nameserver')
    
    if not domain:
        return jsonify({
            "success": False,
            "error": "Domain is required"
        }), 400
    
    try:
        results = []
        
        # 测试不同解析方式
        if nameserver:
            # 指定DNS服务器
            results.append({
                "method": "specific_nameserver",
                "nameserver": nameserver,
                "results": dns_query_with_nameserver(domain, record_type, nameserver)
            })
        
        # 测试公共DNS
        public_dns_servers = [
            {"name": "Google", "server": "8.8.8.8"},
            {"name": "Cloudflare", "server": "1.1.1.1"},
            {"name": "OpenDNS", "server": "208.67.222.222"},
            {"name": "AliDNS", "server": "223.5.5.5"}
        ]
        
        for dns_server in public_dns_servers:
            try:
                results.append({
                    "method": "public_dns",
                    "name": dns_server["name"],
                    "server": dns_server["server"],
                    "results": dns_query_with_nameserver(domain, record_type, dns_server["server"])
                })
            except Exception as e:
                results.append({
                    "method": "public_dns",
                    "name": dns_server["name"],
                    "server": dns_server["server"],
                    "error": str(e)
                })
        
        # 测试本地解析
        try:
            results.append({
                "method": "local_resolver",
                "results": dns_query_local(domain, record_type)
            })
        except Exception as e:
            results.append({
                "method": "local_resolver",
                "error": str(e)
            })
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "domain": domain,
                "type": record_type,
                "tests": results,
                "summary": {
                    "total_tests": len(results),
                    "successful": len([r for r in results if "error" not in r]),
                    "failed": len([r for r in results if "error" in r])
                }
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@dev_bp.route('/trace-dns', methods=['POST'])
@api_key_required
@scope_required("dev:tools")
def trace_dns_resolution():
    """DNS解析追踪（开发工具）"""
    data = request.get_json()
    
    domain = data.get('domain')
    if not domain:
        return jsonify({
            "success": False,
            "error": "Domain is required"
        }), 400
    
    try:
        # 执行DNS追踪
        trace_results = perform_dns_trace(domain)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "domain": domain,
                "trace": trace_results,
                "analysis": analyze_dns_trace(trace_results)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@dev_bp.route('/validate-config', methods=['POST'])
@api_key_required
@scope_required("dev:tools")
def validate_configuration():
    """验证配置文件（开发工具）"""
    data = request.get_json()
    
    config_content = data.get('config')
    config_type = data.get('type', 'yaml')
    
    if not config_content:
        return jsonify({
            "success": False,
            "error": "Config content is required"
        }), 400
    
    try:
        validation_results = []
        
        # YAML验证
        if config_type == 'yaml':
            try:
                import yaml
                parsed = yaml.safe_load(config_content)
                validation_results.append({
                    "type": "yaml_syntax",
                    "valid": True,
                    "message": "YAML syntax is valid"
                })
                
                # 检查必要字段
                required_fields = ['domain', 'aliyun']
                missing = []
                for field in required_fields:
                    if field not in parsed:
                        missing.append(field)
                
                if missing:
                    validation_results.append({
                        "type": "required_fields",
                        "valid": False,
                        "message": f"Missing required fields: {', '.join(missing)}"
                    })
                else:
                    validation_results.append({
                        "type": "required_fields",
                        "valid": True,
                        "message": "All required fields present"
                    })
                
            except yaml.YAMLError as e:
                validation_results.append({
                    "type": "yaml_syntax",
                    "valid": False,
                    "message": str(e)
                })
        
        # JSON验证
        elif config_type == 'json':
            try:
                import json
                parsed = json.loads(config_content)
                validation_results.append({
                    "type": "json_syntax",
                    "valid": True,
                    "message": "JSON syntax is valid"
                })
            except json.JSONDecodeError as e:
                validation_results.append({
                    "type": "json_syntax",
                    "valid": False,
                    "message": str(e)
                })
        
        # 测试阿里云凭据
        if 'aliyun' in locals().get('parsed', {}):
            try:
                test_aliyun_credentials(parsed['aliyun'])
                validation_results.append({
                    "type": "aliyun_credentials",
                    "valid": True,
                    "message": "Aliyun credentials are valid"
                })
            except Exception as e:
                validation_results.append({
                    "type": "aliyun_credentials",
                    "valid": False,
                    "message": f"Aliyun credentials error: {str(e)}"
                })
        
        # 总体评估
        is_valid = all(r["valid"] for r in validation_results)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "config_type": config_type,
                "valid": is_valid,
                "validations": validation_results,
                "summary": {
                    "total_checks": len(validation_results),
                    "passed": len([r for r in validation_results if r["valid"]]),
                    "failed": len([r for r in validation_results if not r["valid"]])
                }
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@dev_bp.route('/simulate-dns', methods=['POST'])
@api_key_required
@scope_required("dev:tools")
def simulate_dns_update():
    """模拟DNS更新（开发工具）"""
    data = request.get_json()
    
    domain = data.get('domain')
    subdomain = data.get('subdomain', '@')
    new_ip = data.get('new_ip')
    
    if not domain or not new_ip:
        return jsonify({
            "success": False,
            "error": "Domain and new_ip are required"
        }), 400
    
    try:
        # 模拟DNS更新流程
        simulation_results = simulate_dns_update_process(
            domain=domain,
            subdomain=subdomain,
            new_ip=new_ip
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": simulation_results,
            "note": "This is a simulation. No actual DNS records were modified."
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
```

### 4.2 调试与日志API

```python
# api/v2/dev/debug.py
from flask import Blueprint, request, jsonify

debug_bp = Blueprint('debug_v2', __name__, url_prefix='/api/v2/debug')

@debug_bp.route('/logs', methods=['GET'])
@token_required
@role_required("admin")
def get_debug_logs():
    """获取调试日志"""
    log_type = request.args.get('type', 'ddns')
    lines = request.args.get('lines', 100, type=int)
    level = request.args.get('level')
    search = request.args.get('search')
    
    try:
        logs = fetch_debug_logs(
            log_type=log_type,
            lines=lines,
            level=level,
            search_term=search
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "log_type": log_type,
                "lines": lines,
                "total_entries": len(logs),
                "logs": logs
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@debug_bp.route('/metrics/current', methods=['GET'])
@token_required
@role_required("admin")
def get_current_metrics():
    """获取当前系统指标"""
    try:
        metrics = collect_system_metrics()
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": metrics
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@debug_bp.route('/metrics/historical', methods=['GET'])
@token_required
@role_required("admin")
def get_historical_metrics():
    """获取历史系统指标"""
    time_range = request.args.get('range', '1h')
    resolution = request.args.get('resolution', '1m')
    
    try:
        metrics = fetch_historical_metrics(
            time_range=time_range,
            resolution=resolution
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "time_range": time_range,
                "resolution": resolution,
                "metrics": metrics
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@debug_bp.route('/api-calls', methods=['GET'])
@token_required
@role_required("admin")
def get_api_call_statistics():
    """获取API调用统计"""
    try:
        stats = get_api_statistics(
            period=request.args.get('period', '24h'),
            endpoint=request.args.get('endpoint'),
            user_id=request.args.get('user_id')
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": stats
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@debug_bp.route('/cache/status', methods=['GET'])
@token_required
@role_required("admin")
def get_cache_status():
    """获取缓存状态"""
    try:
        cache_stats = get_cache_statistics()
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": cache_stats
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@debug_bp.route('/cache/clear', methods=['POST'])
@token_required
@role_required("admin")
def clear_cache():
    """清除缓存"""
    cache_type = request.args.get('type', 'all')
    
    try:
        result = clear_system_cache(cache_type)
        
        log_operation(
            user_id=request.user_id,
            action="clear_cache",
            resource="cache",
            details={"type": cache_type}
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": result,
            "message": f"Cache cleared: {cache_type}"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
```

## 5. **生产环境API**

### 5.1 高可用性API

```python
# api/v2/production/ha.py
from flask import Blueprint, request, jsonify
import threading
import time

ha_bp = Blueprint('ha_v2', __name__, url_prefix='/api/v2/ha')

@ha_bp.route('/status', methods=['GET'])
@api_key_required
@scope_required("production:monitor")
def get_ha_status():
    """获取高可用性状态"""
    try:
        # 检查所有服务实例
        instances = get_service_instances()
        
        # 检查负载均衡器状态
        lb_status = get_load_balancer_status()
        
        # 检查数据库复制状态
        db_replication = get_database_replication_status()
        
        # 检查存储冗余
        storage_redundancy = get_storage_redundancy_status()
        
        # 计算整体健康度
        overall_health = calculate_ha_health_score(
            instances, lb_status, db_replication, storage_redundancy
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "overall_health": overall_health,
                "status": "healthy" if overall_health >= 0.9 else "degraded",
                "instances": instances,
                "load_balancer": lb_status,
                "database": db_replication,
                "storage": storage_redundancy,
                "recommendations": generate_ha_recommendations(
                    instances, lb_status, db_replication, storage_redundancy
                )
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@ha_bp.route('/failover', methods=['POST'])
@api_key_required
@scope_required("production:admin")
def initiate_failover():
    """启动故障转移"""
    data = request.get_json()
    
    target_instance = data.get('target_instance')
    reason = data.get('reason', 'manual')
    
    try:
        # 验证目标实例
        if not validate_target_instance(target_instance):
            return jsonify({
                "success": False,
                "error": f"Invalid target instance: {target_instance}"
            }), 400
        
        # 执行故障转移
        failover_result = perform_failover(
            target_instance=target_instance,
            reason=reason
        )
        
        # 记录故障转移
        log_failover_event(
            user_id=request.key_info["user_id"],
            from_instance=get_current_primary(),
            to_instance=target_instance,
            reason=reason,
            result=failover_result
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": failover_result,
            "message": f"Failover to {target_instance} completed"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@ha_bp.route('/backup/status', methods=['GET'])
@api_key_required
@scope_required("production:monitor")
def get_backup_status():
    """获取备份状态"""
    try:
        backup_status = get_backup_status_info()
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": backup_status
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@ha_bp.route('/backup/now', methods=['POST'])
@api_key_required
@scope_required("production:admin")
def trigger_backup_now():
    """立即触发备份"""
    backup_type = request.args.get('type', 'full')
    
    try:
        # 异步执行备份
        backup_job_id = trigger_immediate_backup(backup_type)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "job_id": backup_job_id,
                "type": backup_type,
                "status": "started",
                "message": "Backup job started"
            }
        }), 202
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@ha_bp.route('/recovery/test', methods=['POST'])
@api_key_required
@scope_required("production:admin")
def test_recovery():
    """测试恢复流程"""
    data = request.get_json()
    
    backup_id = data.get('backup_id')
    target_environment = data.get('target_environment', 'staging')
    
    try:
        # 在测试环境中执行恢复
        recovery_result = perform_recovery_test(
            backup_id=backup_id,
            target_environment=target_environment
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": recovery_result,
            "message": "Recovery test completed"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
```

### 5.2 性能监控API

```python
# api/v2/production/performance.py
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta

perf_bp = Blueprint('performance_v2', __name__, url_prefix='/api/v2/performance')

@perf_bp.route('/dashboard', methods=['GET'])
@api_key_required
@scope_required("production:monitor")
def get_performance_dashboard():
    """获取性能仪表板数据"""
    time_range = request.args.get('range', '1h')
    
    try:
        # 收集各种性能指标
        metrics = {
            "system": get_system_performance_metrics(time_range),
            "api": get_api_performance_metrics(time_range),
            "database": get_database_performance_metrics(time_range),
            "network": get_network_performance_metrics(time_range),
            "ddns": get_ddns_performance_metrics(time_range)
        }
        
        # 识别性能瓶颈
        bottlenecks = identify_performance_bottlenecks(metrics)
        
        # 生成建议
        recommendations = generate_performance_recommendations(bottlenecks)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "time_range": time_range,
                "metrics": metrics,
                "summary": {
                    "overall_performance": calculate_overall_performance_score(metrics),
                    "bottlenecks": bottlenecks,
                    "recommendations": recommendations
                }
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@perf_bp.route('/endpoints', methods=['GET'])
@api_key_required
@scope_required("production:monitor")
def get_endpoint_performance():
    """获取API端点性能数据"""
    endpoint = request.args.get('endpoint')
    time_range = request.args.get('range', '24h')
    
    try:
        if endpoint:
            # 获取特定端点的性能数据
            endpoint_data = get_endpoint_performance_data(endpoint, time_range)
        else:
            # 获取所有端点的性能数据
            endpoint_data = get_all_endpoints_performance(time_range)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": endpoint_data
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@perf_bp.route('/slow-queries', methods=['GET'])
@api_key_required
@scope_required("production:admin")
def get_slow_queries():
    """获取慢查询数据"""
    limit = request.args.get('limit', 50, type=int)
    time_range = request.args.get('range', '24h')
    
    try:
        slow_queries = get_slow_query_data(limit, time_range)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "slow_queries": slow_queries,
                "analysis": analyze_slow_queries(slow_queries)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@perf_bp.route('/optimize', methods=['POST'])
@api_key_required
@scope_required("production:admin")
def run_optimization():
    """运行性能优化"""
    optimization_type = request.args.get('type', 'all')
    
    try:
        # 执行优化
        optimization_result = perform_performance_optimization(optimization_type)
        
        # 记录优化操作
        log_optimization_event(
            user_id=request.key_info["user_id"],
            type=optimization_type,
            result=optimization_result
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": optimization_result,
            "message": f"Performance optimization '{optimization_type}' completed"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@perf_bp.route('/capacity', methods=['GET'])
@api_key_required
@scope_required("production:admin")
def get_capacity_planning():
    """获取容量规划数据"""
    try:
        capacity_data = get_capacity_planning_data()
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": capacity_data
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
```

## 6. **监控与告警API**

### 6.1 实时监控API

```python
# api/v2/monitoring/real_time.py
from flask import Blueprint, request, jsonify
import psutil
import socket

monitor_bp = Blueprint('monitoring_v2', __name__, url_prefix='/api/v2/monitoring')

@monitor_bp.route('/system', methods=['GET'])
@api_key_required
@scope_required("monitoring:read")
def get_system_monitoring():
    """获取系统实时监控数据"""
    metrics = request.args.get('metrics', 'all')
    
    try:
        monitoring_data = {}
        
        if metrics in ['all', 'cpu']:
            monitoring_data['cpu'] = {
                "percent": psutil.cpu_percent(interval=1),
                "percent_per_core": psutil.cpu_percent(interval=1, percpu=True),
                "load_average": psutil.getloadavg() if hasattr(psutil, 'getloadavg') else None,
                "frequency": psutil.cpu_freq().current if hasattr(psutil.cpu_freq(), 'current') else None
            }
        
        if metrics in ['all', 'memory']:
            memory = psutil.virtual_memory()
            monitoring_data['memory'] = {
                "total": memory.total,
                "available": memory.available,
                "percent": memory.percent,
                "used": memory.used,
                "free": memory.free,
                "buffers": getattr(memory, 'buffers', 0),
                "cached": getattr(memory, 'cached', 0)
            }
        
        if metrics in ['all', 'disk']:
            disk = psutil.disk_usage('/')
            monitoring_data['disk'] = {
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": disk.percent
            }
            
            # IO统计
            disk_io = psutil.disk_io_counters()
            if disk_io:
                monitoring_data['disk_io'] = {
                    "read_count": disk_io.read_count,
                    "write_count": disk_io.write_count,
                    "read_bytes": disk_io.read_bytes,
                    "write_bytes": disk_io.write_bytes
                }
        
        if metrics in ['all', 'network']:
            net_io = psutil.net_io_counters()
            if net_io:
                monitoring_data['network'] = {
                    "bytes_sent": net_io.bytes_sent,
                    "bytes_recv": net_io.bytes_recv,
                    "packets_sent": net_io.packets_sent,
                    "packets_recv": net_io.packets_recv,
                    "interfaces": get_network_interfaces_stats()
                }
        
        if metrics in ['all', 'processes']:
            processes = []
            for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
                try:
                    processes.append(proc.info)
                except (psutil.NoSuchProcess, psutil.AccessDenied):
                    pass
            
            monitoring_data['processes'] = {
                "total": len(processes),
                "top_cpu": sorted(processes, key=lambda x: x.get('cpu_percent', 0), reverse=True)[:10],
                "top_memory": sorted(processes, key=lambda x: x.get('memory_percent', 0), reverse=True)[:10]
            }
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": monitoring_data,
            "metadata": {
                "hostname": socket.gethostname(),
                "uptime": get_system_uptime()
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@monitor_bp.route('/services', methods=['GET'])
@api_key_required
@scope_required("monitoring:read")
def get_services_status():
    """获取服务状态"""
    service_name = request.args.get('service')
    
    try:
        if service_name:
            # 获取特定服务状态
            service_status = get_service_status(service_name)
            services_data = {service_name: service_status}
        else:
            # 获取所有服务状态
            services_data = get_all_services_status()
        
        # 计算总体健康状态
        healthy_services = sum(1 for s in services_data.values() if s.get('status') == 'running')
        total_services = len(services_data)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "services": services_data,
                "summary": {
                    "total": total_services,
                    "healthy": healthy_services,
                    "unhealthy": total_services - healthy_services,
                    "health_percentage": (healthy_services / total_services * 100) if total_services > 0 else 0
                }
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@monitor_bp.route('/dns/health', methods=['GET'])
@api_key_required
@scope_required("monitoring:read")
def get_dns_health():
    """获取DNS健康状态"""
    domain = request.args.get('domain', 'ddns.0379.email')
    
    try:
        dns_health_data = check_dns_health(domain)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": dns_health_data
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@monitor_bp.route('/web/health', methods=['GET'])
@api_key_required
@scope_required("monitoring:read")
def get_web_health():
    """获取Web服务健康状态"""
    url = request.args.get('url', 'https://ddns.0379.email')
    
    try:
        web_health_data = check_web_health(url)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": web_health_data
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
```

### 6.2 告警管理API

```python
# api/v2/alerts/management.py
from flask import Blueprint, request, jsonify

alerts_bp = Blueprint('alerts_v2', __name__, url_prefix='/api/v2/alerts')

@alerts_bp.route('', methods=['GET'])
@api_key_required
@scope_required("alerts:read")
def get_alerts():
    """获取告警列表"""
    status = request.args.get('status', 'active')  # active, resolved, all
    severity = request.args.get('severity')  # critical, warning, info
    limit = request.args.get('limit', 100, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    try:
        alerts = get_alert_list(
            status=status,
            severity=severity,
            limit=limit,
            offset=offset
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "alerts": alerts,
                "count": len(alerts),
                "summary": {
                    "total": get_total_alert_count(),
                    "active": get_active_alert_count(),
                    "critical": get_critical_alert_count()
                }
            },
            "pagination": {
                "limit": limit,
                "offset": offset,
                "total": get_total_alert_count()
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@alerts_bp.route('/<string:alert_id>', methods=['GET'])
@api_key_required
@scope_required("alerts:read")
def get_alert_details(alert_id):
    """获取告警详情"""
    try:
        alert_details = get_alert_by_id(alert_id)
        
        if not alert_details:
            return jsonify({
                "success": False,
                "error": f"Alert {alert_id} not found"
            }), 404
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": alert_details
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@alerts_bp.route('/<string:alert_id>/resolve', methods=['POST'])
@api_key_required
@scope_required("alerts:write")
def resolve_alert(alert_id):
    """解决告警"""
    data = request.get_json()
    resolution_notes = data.get('resolution_notes', '')
    
    try:
        result = resolve_alert_by_id(alert_id, resolution_notes)
        
        if not result:
            return jsonify({
                "success": False,
                "error": f"Alert {alert_id} not found or already resolved"
            }), 404
        
        # 记录解决操作
        log_alert_resolution(
            alert_id=alert_id,
            user_id=request.key_info["user_id"],
            resolution_notes=resolution_notes
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": result,
            "message": f"Alert {alert_id} resolved"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@alerts_bp.route('/rules', methods=['GET'])
@api_key_required
@scope_required("alerts:read")
def get_alert_rules():
    """获取告警规则"""
    try:
        rules = get_alert_rules_list()
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "rules": rules,
                "count": len(rules)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@alerts_bp.route('/rules', methods=['POST'])
@api_key_required
@scope_required("alerts:admin")
def create_alert_rule():
    """创建告警规则"""
    data = request.get_json()
    
    # 验证规则数据
    required_fields = ["name", "condition", "severity", "notification_channels"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({
            "success": False,
            "error": f"Missing required fields: {', '.join(missing)}"
        }), 400
    
    try:
        rule = create_alert_rule(data)
        
        # 记录规则创建
        log_alert_rule_creation(
            rule_id=rule["id"],
            user_id=request.key_info["user_id"],
            rule_data=data
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": rule,
            "message": "Alert rule created"
        }), 201
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@alerts_bp.route('/notifications', methods=['GET'])
@api_key_required
@scope_required("alerts:read")
def get_notifications():
    """获取通知历史"""
    limit = request.args.get('limit', 50, type=int)
    channel = request.args.get('channel')
    status = request.args.get('status')  # sent, failed
    
    try:
        notifications = get_notification_history(
            limit=limit,
            channel=channel,
            status=status
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "notifications": notifications,
                "summary": {
                    "total": get_total_notification_count(),
                    "sent": get_sent_notification_count(),
                    "failed": get_failed_notification_count()
                }
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@alerts_bp.route('/silence', methods=['POST'])
@api_key_required
@scope_required("alerts:admin")
def create_silence():
    """创建静默规则"""
    data = request.get_json()
    
    required_fields = ["matchers", "starts_at", "ends_at"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({
            "success": False,
            "error": f"Missing required fields: {', '.join(missing)}"
        }), 400
    
    try:
        silence = create_alert_silence(data)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": silence,
            "message": "Alert silence created"
        }), 201
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
```

## 7. **配置管理API**

### 7.1 配置中心API

```python
# api/v2/config/center.py
from flask import Blueprint, request, jsonify
import yaml
import json

config_bp = Blueprint('config_v2', __name__, url_prefix='/api/v2/config')

@config_bp.route('', methods=['GET'])
@token_required
@role_required("config:read")
def get_configurations():
    """获取配置列表"""
    environment = request.args.get('environment')
    service = request.args.get('service')
    version = request.args.get('version')
    
    try:
        configs = list_configurations(
            environment=environment,
            service=service,
            version=version
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "configurations": configs,
                "count": len(configs)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@config_bp.route('/<string:config_id>', methods=['GET'])
@token_required
@role_required("config:read")
def get_configuration(config_id):
    """获取配置详情"""
    include_secrets = request.args.get('include_secrets', 'false').lower() == 'true'
    version = request.args.get('version', 'latest')
    
    try:
        config = get_configuration_by_id(config_id, version, include_secrets)
        
        if not config:
            return jsonify({
                "success": False,
                "error": f"Configuration {config_id} not found"
            }), 404
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": config
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@config_bp.route('', methods=['POST'])
@token_required
@role_required("config:write")
def create_configuration():
    """创建配置"""
    data = request.get_json()
    
    required_fields = ["name", "environment", "service", "config"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({
            "success": False,
            "error": f"Missing required fields: {', '.join(missing)}"
        }), 400
    
    try:
        # 验证配置格式
        if not validate_config_format(data["config"]):
            return jsonify({
                "success": False,
                "error": "Invalid configuration format"
            }), 400
        
        # 创建配置
        config = create_configuration_entry(data)
        
        # 记录配置创建
        log_configuration_change(
            action="create",
            config_id=config["id"],
            user_id=request.user_id,
            environment=data["environment"],
            service=data["service"]
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": config,
            "message": "Configuration created"
        }), 201
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@config_bp.route('/<string:config_id>', methods=['PUT'])
@token_required
@role_required("config:write")
def update_configuration(config_id):
    """更新配置"""
    data = request.get_json()
    
    if "config" not in data:
        return jsonify({
            "success": False,
            "error": "Config data is required"
        }), 400
    
    try:
        # 验证配置格式
        if not validate_config_format(data["config"]):
            return jsonify({
                "success": False,
                "error": "Invalid configuration format"
            }), 400
        
        # 更新配置
        config = update_configuration_entry(config_id, data)
        
        if not config:
            return jsonify({
                "success": False,
                "error": f"Configuration {config_id} not found"
            }), 404
        
        # 记录配置更新
        log_configuration_change(
            action="update",
            config_id=config_id,
            user_id=request.user_id,
            environment=config.get("environment"),
            service=config.get("service")
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": config,
            "message": "Configuration updated"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@config_bp.route('/<string:config_id>/rollback', methods=['POST'])
@token_required
@role_required("config:admin")
def rollback_configuration(config_id):
    """回滚配置"""
    data = request.get_json()
    
    version = data.get('version')
    if not version:
        return jsonify({
            "success": False,
            "error": "Version is required"
        }), 400
    
    try:
        config = rollback_configuration_to_version(config_id, version)
        
        if not config:
            return jsonify({
                "success": False,
                "error": f"Configuration {config_id} version {version} not found"
            }), 404
        
        # 记录配置回滚
        log_configuration_change(
            action="rollback",
            config_id=config_id,
            user_id=request.user_id,
            environment=config.get("environment"),
            service=config.get("service"),
            version=version
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": config,
            "message": f"Configuration rolled back to version {version}"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@config_bp.route('/<string:config_id>/diff', methods=['GET'])
@token_required
@role_required("config:read")
def diff_configuration(config_id):
    """对比配置版本"""
    version1 = request.args.get('v1', 'latest')
    version2 = request.args.get('v2')
    
    try:
        diff_result = diff_configuration_versions(config_id, version1, version2)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": diff_result
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@config_bp.route('/<string:config_id>/history', methods=['GET'])
@token_required
@role_required("config:read")
def get_configuration_history(config_id):
    """获取配置历史"""
    limit = request.args.get('limit', 50, type=int)
    
    try:
        history = get_configuration_history_list(config_id, limit)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "config_id": config_id,
                "history": history,
                "total_versions": len(history)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@config_bp.route('/templates', methods=['GET'])
@token_required
@role_required("config:read")
def get_config_templates():
    """获取配置模板"""
    template_type = request.args.get('type')
    
    try:
        templates = get_configuration_templates(template_type)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "templates": templates,
                "count": len(templates)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@config_bp.route('/validate', methods=['POST'])
@token_required
@role_required("config:read")
def validate_configuration():
    """验证配置"""
    data = request.get_json()
    
    config_content = data.get('config')
    config_type = data.get('type', 'yaml')
    template_id = data.get('template_id')
    
    if not config_content:
        return jsonify({
            "success": False,
            "error": "Config content is required"
        }), 400
    
    try:
        validation_result = validate_configuration_content(
            content=config_content,
            config_type=config_type,
            template_id=template_id
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": validation_result
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
```

### 7.2 密钥管理API

```python
# api/v2/secrets/manager.py
from flask import Blueprint, request, jsonify
from cryptography.fernet import Fernet
import base64
import os

secrets_bp = Blueprint('secrets_v2', __name__, url_prefix='/api/v2/secrets')

class SecretsManager:
    def __init__(self):
        self.key_file = "/opt/nas-ecs/secrets/master.key"
        self.load_or_generate_key()
    
    def load_or_generate_key(self):
        """加载或生成主密钥"""
        if os.path.exists(self.key_file):
            with open(self.key_file, 'rb') as f:
                self.master_key = f.read()
        else:
            self.master_key = Fernet.generate_key()
            os.makedirs(os.path.dirname(self.key_file), exist_ok=True)
            with open(self.key_file, 'wb') as f:
                f.write(self.master_key)
        
        self.cipher = Fernet(self.master_key)
    
    def encrypt_secret(self, plaintext):
        """加密秘密"""
        return self.cipher.encrypt(plaintext.encode()).decode()
    
    def decrypt_secret(self, ciphertext):
        """解密秘密"""
        return self.cipher.decrypt(ciphertext.encode()).decode()
    
    def rotate_key(self):
        """轮换主密钥"""
        # 备份旧密钥
        old_key = self.master_key
        timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        backup_file = f"{self.key_file}.backup.{timestamp}"
        
        with open(backup_file, 'wb') as f:
            f.write(old_key)
        
        # 生成新密钥
        new_key = Fernet.generate_key()
        self.master_key = new_key
        self.cipher = Fernet(new_key)
        
        with open(self.key_file, 'wb') as f:
            f.write(new_key)
        
        return {
            "old_key_backup": backup_file,
            "key_rotated": True,
            "timestamp": timestamp
        }

secrets_manager = SecretsManager()

@secrets_bp.route('', methods=['GET'])
@token_required
@role_required("secrets:read")
def list_secrets():
    """列出所有秘密"""
    namespace = request.args.get('namespace')
    tag = request.args.get('tag')
    
    try:
        secrets = list_secrets_data(namespace=namespace, tag=tag)
        
        # 解密秘密值（如果需要）
        include_values = request.args.get('include_values', 'false').lower() == 'true'
        if include_values:
            for secret in secrets:
                if "value" in secret:
                    try:
                        secret["value"] = secrets_manager.decrypt_secret(secret["value"])
                    except:
                        secret["value"] = "[DECRYPTION_FAILED]"
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "secrets": secrets,
                "count": len(secrets),
                "namespaces": get_secret_namespaces()
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@secrets_bp.route('', methods=['POST'])
@token_required
@role_required("secrets:write")
def create_secret():
    """创建秘密"""
    data = request.get_json()
    
    required_fields = ["key", "value", "namespace"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({
            "success": False,
            "error": f"Missing required fields: {', '.join(missing)}"
        }), 400
    
    try:
        # 加密秘密值
        encrypted_value = secrets_manager.encrypt_secret(data["value"])
        
        secret_data = {
            "key": data["key"],
            "value": encrypted_value,
            "namespace": data["namespace"],
            "description": data.get("description"),
            "tags": data.get("tags", []),
            "created_by": request.user_id
        }
        
        secret = create_secret_entry(secret_data)
        
        # 记录秘密创建
        log_secret_operation(
            action="create",
            secret_key=data["key"],
            namespace=data["namespace"],
            user_id=request.user_id
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "key": secret["key"],
                "namespace": secret["namespace"],
                "created_at": secret["created_at"],
                "message": "Secret created successfully"
            }
        }), 201
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@secrets_bp.route('/<string:namespace>/<string:key>', methods=['GET'])
@token_required
@role_required("secrets:read")
def get_secret(namespace, key):
    """获取秘密"""
    try:
        secret = get_secret_entry(namespace, key)
        
        if not secret:
            return jsonify({
                "success": False,
                "error": f"Secret {namespace}/{key} not found"
            }), 404
        
        # 解密值
        decrypted_value = secrets_manager.decrypt_secret(secret["value"])
        
        # 记录访问
        log_secret_access(
            secret_key=key,
            namespace=namespace,
            user_id=request.user_id
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "key": secret["key"],
                "namespace": secret["namespace"],
                "value": decrypted_value,
                "description": secret.get("description"),
                "tags": secret.get("tags", []),
                "created_at": secret["created_at"],
                "updated_at": secret.get("updated_at"),
                "created_by": secret.get("created_by"),
                "access_count": secret.get("access_count", 0) + 1
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@secrets_bp.route('/key/rotate', methods=['POST'])
@token_required
@role_required("secrets:admin")
def rotate_master_key():
    """轮换主密钥"""
    try:
        result = secrets_manager.rotate_key()
        
        # 记录密钥轮换
        log_secret_operation(
            action="key_rotate",
            user_id=request.user_id,
            details=result
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": result,
            "message": "Master key rotated successfully"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@secrets_bp.route('/access/logs', methods=['GET'])
@token_required
@role_required("secrets:admin")
def get_secret_access_logs():
    """获取秘密访问日志"""
    limit = request.args.get('limit', 100, type=int)
    namespace = request.args.get('namespace')
    key = request.args.get('key')
    user_id = request.args.get('user_id')
    
    try:
        logs = get_secret_access_logs_data(
            limit=limit,
            namespace=namespace,
            key=key,
            user_id=user_id
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "logs": logs,
                "count": len(logs),
                "summary": get_secret_access_summary()
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@secrets_bp.route('/sync', methods=['POST'])
@token_required
@role_required("secrets:admin")
def sync_secrets():
    """同步秘密到其他环境"""
    data = request.get_json()
    
    source_env = data.get('source_environment')
    target_env = data.get('target_environment')
    namespace = data.get('namespace')
    
    if not source_env or not target_env:
        return jsonify({
            "success": False,
            "error": "Source and target environments are required"
        }), 400
    
    try:
        sync_result = sync_secrets_between_environments(
            source_env=source_env,
            target_env=target_env,
            namespace=namespace
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": sync_result,
            "message": f"Secrets synced from {source_env} to {target_env}"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
```

## 8. **数据分析API**

### 8.1 统计与分析API

```python
# api/v2/analytics/stats.py
from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta

analytics_bp = Blueprint('analytics_v2', __name__, url_prefix='/api/v2/analytics')

@analytics_bp.route('/usage', methods=['GET'])
@token_required
@role_required("analytics:read")
def get_usage_statistics():
    """获取使用统计"""
    period = request.args.get('period', '7d')  # 1d, 7d, 30d, 90d
    metric = request.args.get('metric', 'requests')  # requests, errors, latency, bandwidth
    
    try:
        stats = get_usage_statistics_data(period, metric)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "period": period,
                "metric": metric,
                "statistics": stats,
                "summary": calculate_usage_summary(stats)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@analytics_bp.route('/performance', methods=['GET'])
@token_required
@role_required("analytics:read")
def get_performance_analytics():
    """获取性能分析"""
    time_range = request.args.get('range', '24h')
    endpoint = request.args.get('endpoint')
    
    try:
        analytics = get_performance_analytics_data(time_range, endpoint)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "time_range": time_range,
                "endpoint": endpoint,
                "analytics": analytics,
                "insights": extract_performance_insights(analytics)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@analytics_bp.route('/ddns/history', methods=['GET'])
@token_required
@role_required("analytics:read")
def get_ddns_analytics():
    """获取DDNS分析数据"""
    days = request.args.get('days', 30, type=int)
    
    try:
        analytics = get_ddns_analytics_data(days)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "period_days": days,
                "analytics": analytics,
                "trends": analyze_ddns_trends(analytics)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@analytics_bp.route('/users', methods=['GET'])
@token_required
@role_required("analytics:admin")
def get_user_analytics():
    """获取用户分析"""
    period = request.args.get('period', '30d')
    
    try:
        analytics = get_user_analytics_data(period)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "period": period,
                "analytics": analytics,
                "insights": extract_user_insights(analytics)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@analytics_bp.route('/predictive', methods=['GET'])
@token_required
@role_required("analytics:admin")
def get_predictive_analytics():
    """获取预测分析"""
    metric = request.args.get('metric', 'requests')
    horizon = request.args.get('horizon', '7d')  # 预测范围
    
    try:
        predictions = get_predictive_analytics_data(metric, horizon)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "metric": metric,
                "horizon": horizon,
                "predictions": predictions,
                "confidence": predictions.get("confidence", 0.95)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@analytics_bp.route('/reports/generate', methods=['POST'])
@token_required
@role_required("analytics:write")
def generate_analytics_report():
    """生成分析报告"""
    data = request.get_json()
    
    report_type = data.get('type', 'weekly')
    format_type = data.get('format', 'html')  # html, pdf, json
    
    try:
        report = generate_analytics_report_data(report_type, format_type)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "report_id": report["id"],
                "type": report_type,
                "format": format_type,
                "url": report.get("url"),
                "message": f"{report_type} report generated"
            }
        }), 202
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@analytics_bp.route('/export', methods=['POST'])
@token_required
@role_required("analytics:admin")
def export_analytics_data():
    """导出分析数据"""
    data = request.get_json()
    
    metrics = data.get('metrics', ['requests', 'errors', 'latency'])
    start_date = data.get('start_date')
    end_date = data.get('end_date', datetime.utcnow().isoformat())
    format_type = data.get('format', 'csv')  # csv, json, excel
    
    try:
        export_result = export_analytics_data_to_file(
            metrics=metrics,
            start_date=start_date,
            end_date=end_date,
            format_type=format_type
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": export_result
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
```

### 8.2 趋势与预测API

```python
# api/v2/analytics/trends.py
from flask import Blueprint, request, jsonify
import pandas as pd
from prophet import Prophet
import numpy as np

trends_bp = Blueprint('trends_v2', __name__, url_prefix='/api/v2/trends')

@trends_bp.route('/ddns/changes', methods=['GET'])
@token_required
@role_required("analytics:read")
def get_ddns_change_trends():
    """获取DDNS变更趋势"""
    days = request.args.get('days', 90, type=int)
    
    try:
        # 获取DDNS变更历史数据
        changes = get_ddns_change_history(days)
        
        # 转换为DataFrame进行趋势分析
        df = pd.DataFrame(changes)
        if not df.empty:
            df['timestamp'] = pd.to_datetime(df['timestamp'])
            df.set_index('timestamp', inplace=True)
            
            # 按天聚合
            daily_changes = df.resample('D').size()
            
            # 计算趋势
            trend_data = {
                "daily_average": daily_changes.mean(),
                "weekly_pattern": detect_weekly_pattern(daily_changes),
                "trend_direction": calculate_trend_direction(daily_changes),
                "anomalies": detect_anomalies(daily_changes)
            }
        else:
            trend_data = {}
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "period_days": days,
                "total_changes": len(changes),
                "trend_analysis": trend_data,
                "raw_data": changes[:100]  # 返回前100条数据
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@trends_bp.route('/ip/stability', methods=['GET'])
@token_required
@role_required("analytics:read")
def get_ip_stability_analysis():
    """获取IP稳定性分析"""
    days = request.args.get('days', 30, type=int)
    
    try:
        # 获取IP变更历史
        ip_history = get_ip_change_history(days)
        
        if not ip_history:
            return jsonify({
                "success": True,
                "timestamp": datetime.utcnow().isoformat(),
                "data": {
                    "period_days": days,
                    "message": "No IP change history available"
                }
            })
        
        # 分析IP稳定性
        stability_analysis = analyze_ip_stability(ip_history)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "period_days": days,
                "ip_history": ip_history,
                "stability_analysis": stability_analysis,
                "recommendations": generate_ip_stability_recommendations(stability_analysis)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@trends_bp.route('/forecast', methods=['POST'])
@token_required
@role_required("analytics:admin")
def generate_forecast():
    """生成预测"""
    data = request.get_json()
    
    metric = data.get('metric', 'ddns_changes')
    periods = data.get('periods', 30)  # 预测未来30个周期
    confidence = data.get('confidence', 0.95)
    
    try:
        # 获取历史数据
        historical_data = get_historical_data_for_metric(metric)
        
        if len(historical_data) < 30:  # 需要足够的数据
            return jsonify({
                "success": False,
                "error": "Insufficient historical data for forecasting"
            }), 400
        
        # 使用Prophet进行预测
        forecast = generate_prophet_forecast(
            historical_data=historical_data,
            periods=periods,
            confidence=confidence
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "metric": metric,
                "forecast_periods": periods,
                "confidence_interval": confidence,
                "forecast": forecast,
                "accuracy_metrics": calculate_forecast_accuracy(forecast)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@trends_bp.route('/seasonality', methods=['GET'])
@token_required
@role_required("analytics:read")
def analyze_seasonality():
    """分析季节性模式"""
    metric = request.args.get('metric', 'api_requests')
    years = request.args.get('years', 2, type=int)
    
    try:
        seasonality_data = analyze_seasonal_patterns(metric, years)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "metric": metric,
                "analysis_period_years": years,
                "seasonality_analysis": seasonality_data,
                "detected_patterns": extract_seasonal_patterns(seasonality_data)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@trends_bp.route('/correlation', methods=['GET'])
@token_required
@role_required("analytics:admin")
def analyze_correlations():
    """分析相关性"""
    metrics = request.args.getlist('metrics')  # 可以传入多个指标
    
    if not metrics or len(metrics) < 2:
        return jsonify({
            "success": False,
            "error": "At least two metrics are required for correlation analysis"
        }), 400
    
    try:
        correlation_matrix = calculate_correlation_matrix(metrics)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "metrics": metrics,
                "correlation_matrix": correlation_matrix,
                "strong_correlations": identify_strong_correlations(correlation_matrix)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
```

## 9. **WebSocket实时API**

### 9.1 实时通知与事件

```python
# api/websocket/events.py
from flask import Flask
from flask_socketio import SocketIO, emit, join_room, leave_room
import json
import asyncio

socketio = SocketIO(cors_allowed_origins="*")

# 客户端连接管理
connected_clients = {}
client_rooms = {}

@socketio.on('connect')
def handle_connect():
    """处理客户端连接"""
    client_id = request.sid
    connected_clients[client_id] = {
        'connected_at': datetime.utcnow().isoformat(),
        'user_id': None,
        'roles': []
    }
    print(f"Client connected: {client_id}")
    
    emit('connected', {
        'status': 'connected',
        'client_id': client_id,
        'timestamp': datetime.utcnow().isoformat()
    })

@socketio.on('authenticate')
def handle_authentication(data):
    """处理客户端认证"""
    client_id = request.sid
    token = data.get('token')
    
    try:
        # 验证JWT令牌
        payload = jwt_auth.verify_token(token)
        if payload:
            connected_clients[client_id]['user_id'] = payload['sub']
            connected_clients[client_id]['roles'] = payload.get('roles', [])
            
            # 根据用户角色加入相应房间
            for role in payload.get('roles', []):
                join_room(f"role:{role}")
            
            # 加入用户专属房间
            join_room(f"user:{payload['sub']}")
            
            emit('authenticated', {
                'success': True,
                'user_id': payload['sub'],
                'roles': payload.get('roles', []),
                'timestamp': datetime.utcnow().isoformat()
            })
        else:
            emit('authentication_error', {
                'success': False,
                'error': 'Invalid token'
            })
    except Exception as e:
        emit('authentication_error', {
            'success': False,
            'error': str(e)
        })

@socketio.on('subscribe')
def handle_subscription(data):
    """处理订阅请求"""
    client_id = request.sid
    topics = data.get('topics', [])
    
    for topic in topics:
        # 验证订阅权限
        if can_subscribe_to_topic(client_id, topic):
            join_room(topic)
            if topic not in client_rooms:
                client_rooms[topic] = []
            client_rooms[topic].append(client_id)
            
            emit('subscribed', {
                'topic': topic,
                'success': True,
                'timestamp': datetime.utcnow().isoformat()
            })
        else:
            emit('subscription_error', {
                'topic': topic,
                'error': 'Insufficient permissions',
                'timestamp': datetime.utcnow().isoformat()
            })

@socketio.on('unsubscribe')
def handle_unsubscription(data):
    """处理取消订阅"""
    client_id = request.sid
    topics = data.get('topics', [])
    
    for topic in topics:
        leave_room(topic)
        if topic in client_rooms and client_id in client_rooms[topic]:
            client_rooms[topic].remove(client_id)
        
        emit('unsubscribed', {
            'topic': topic,
            'success': True,
            'timestamp': datetime.utcnow().isoformat()
        })

@socketio.on('disconnect')
def handle_disconnect():
    """处理客户端断开连接"""
    client_id = request.sid
    if client_id in connected_clients:
        del connected_clients[client_id]
    
    # 从所有房间中移除
    for topic, clients in client_rooms.items():
        if client_id in clients:
            clients.remove(client_id)
    
    print(f"Client disconnected: {client_id}")

# 实时事件广播函数
def broadcast_event(event_type, data, room=None):
    """广播事件到指定房间或所有客户端"""
    event_data = {
        'type': event_type,
        'data': data,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    if room:
        socketio.emit('event', event_data, room=room)
    else:
        socketio.emit('event', event_data)

def broadcast_ddns_update(update_data):
    """广播DDNS更新事件"""
    event_data = {
        'type': 'ddns_update',
        'data': update_data,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    # 广播给所有订阅了ddns_updates的客户端
    socketio.emit('event', event_data, room='ddns_updates')
    
    # 也广播给管理员
    socketio.emit('event', event_data, room='role:admin')

def broadcast_system_alert(alert_data):
    """广播系统告警"""
    event_data = {
        'type': 'system_alert',
        'data': alert_data,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    # 广播给所有订阅了alerts的客户端
    socketio.emit('event', event_data, room='alerts')
    
    # 根据告警级别广播给不同角色
    if alert_data.get('severity') == 'critical':
        socketio.emit('event', event_data, room='role:admin')
    elif alert_data.get('severity') == 'warning':
        socketio.emit('event', event_data, room='role:operator')

def broadcast_monitoring_data(metrics_data):
    """广播监控数据"""
    event_data = {
        'type': 'monitoring_update',
        'data': metrics_data,
        'timestamp': datetime.utcnow().isoformat()
    }
    
    # 广播给所有订阅了monitoring的客户端
    socketio.emit('event', event_data, room='monitoring')

# 后台任务：定期发送心跳
def send_heartbeat():
    """发送心跳包"""
    while True:
        socketio.emit('heartbeat', {
            'timestamp': datetime.utcnow().isoformat(),
            'server_time': datetime.utcnow().isoformat()
        })
        socketio.sleep(30)  # 每30秒发送一次

# 启动心跳任务
socketio.start_background_task(send_heartbeat)

# WebSocket端点定义
@socketio.on('ping')
def handle_ping():
    """处理ping请求"""
    emit('pong', {
        'timestamp': datetime.utcnow().isoformat()
    })

@socketio.on('get_online_users')
def handle_get_online_users():
    """获取在线用户列表"""
    online_users = []
    for client_id, client_info in connected_clients.items():
        if client_info['user_id']:
            online_users.append({
                'user_id': client_info['user_id'],
                'connected_at': client_info['connected_at'],
                'roles': client_info['roles']
            })
    
    emit('online_users', {
        'users': online_users,
        'count': len(online_users),
        'timestamp': datetime.utcnow().isoformat()
    })

@socketio.on('private_message')
def handle_private_message(data):
    """处理私信"""
    recipient_id = data.get('to')
    message = data.get('message')
    
    if not recipient_id or not message:
        emit('error', {
            'error': 'Recipient and message are required'
        })
        return
    
    # 发送给特定用户
    emit('private_message', {
        'from': connected_clients.get(request.sid, {}).get('user_id'),
        'message': message,
        'timestamp': datetime.utcnow().isoformat()
    }, room=f"user:{recipient_id}")
    
    # 给自己也发送确认
    emit('message_sent', {
        'to': recipient_id,
        'message': message,
        'timestamp': datetime.utcnow().isoformat()
    })
```

### 9.2 实时数据流API

```python
# api/websocket/streams.py
from flask_socketio import emit
import asyncio
import json

@socketio.on('start_stream')
def handle_start_stream(data):
    """开始实时数据流"""
    stream_type = data.get('type')
    client_id = request.sid
    
    if not stream_type:
        emit('stream_error', {
            'error': 'Stream type is required'
        })
        return
    
    # 验证流权限
    if not can_access_stream(client_id, stream_type):
        emit('stream_error', {
            'error': 'Insufficient permissions for this stream'
        })
        return
    
    # 开始相应的数据流
    if stream_type == 'system_metrics':
        start_system_metrics_stream(client_id)
    elif stream_type == 'ddns_updates':
        start_ddns_updates_stream(client_id)
    elif stream_type == 'api_requests':
        start_api_requests_stream(client_id)
    elif stream_type == 'error_logs':
        start_error_logs_stream(client_id)
    
    emit('stream_started', {
        'type': stream_type,
        'timestamp': datetime.utcnow().isoformat()
    })

@socketio.on('stop_stream')
def handle_stop_stream(data):
    """停止实时数据流"""
    stream_type = data.get('type')
    client_id = request.sid
    
    # 停止相应的数据流
    if stream_type == 'system_metrics':
        stop_system_metrics_stream(client_id)
    elif stream_type == 'ddns_updates':
        stop_ddns_updates_stream(client_id)
    elif stream_type == 'api_requests':
        stop_api_requests_stream(client_id)
    elif stream_type == 'error_logs':
        stop_error_logs_stream(client_id)
    
    emit('stream_stopped', {
        'type': stream_type,
        'timestamp': datetime.utcnow().isoformat()
    })

# 系统指标流
def start_system_metrics_stream(client_id):
    """启动系统指标流"""
    async def stream_metrics():
        while client_id in connected_clients:
            try:
                metrics = collect_system_metrics()
                
                emit('metrics_update', {
                    'type': 'system',
                    'metrics': metrics,
                    'timestamp': datetime.utcnow().isoformat()
                }, room=client_id)
                
                await asyncio.sleep(5)  # 每5秒发送一次
            except Exception as e:
                print(f"Error streaming metrics: {e}")
                break
    
    # 启动后台任务
    socketio.start_background_task(stream_metrics)

def stop_system_metrics_stream(client_id):
    """停止系统指标流"""
    # 在实际实现中，需要跟踪并停止相应的后台任务
    pass

# DDNS更新流
def start_ddns_updates_stream(client_id):
    """启动DDNS更新流"""
    # 订阅DDNS更新事件
    join_room('ddns_updates_stream', sid=client_id)

def stop_ddns_updates_stream(client_id):
    """停止DDNS更新流"""
    leave_room('ddns_updates_stream', sid=client_id)

# API请求流
def start_api_requests_stream(client_id):
    """启动API请求流"""
    async def stream_api_requests():
        # 这里可以连接到实际的API日志流
        # 示例：模拟实时API请求
        while client_id in connected_clients:
            try:
                # 模拟获取最近API请求
                recent_requests = get_recent_api_requests(limit=10)
                
                emit('api_requests', {
                    'type': 'api_requests',
                    'requests': recent_requests,
                    'timestamp': datetime.utcnow().isoformat()
                }, room=client_id)
                
                await asyncio.sleep(10)  # 每10秒发送一次
            except Exception as e:
                print(f"Error streaming API requests: {e}")
                break
    
    socketio.start_background_task(stream_api_requests)

# 错误日志流
def start_error_logs_stream(client_id):
    """启动错误日志流"""
    async def stream_error_logs():
        # 监控错误日志文件
        log_file = "/opt/nas-ecs/logs/error.log"
        last_position = 0
        
        while client_id in connected_clients:
            try:
                with open(log_file, 'r') as f:
                    f.seek(last_position)
                    new_lines = f.readlines()
                    last_position = f.tell()
                    
                    if new_lines:
                        errors = []
                        for line in new_lines:
                            if 'ERROR' in line or 'CRITICAL' in line:
                                errors.append(line.strip())
                        
                        if errors:
                            emit('error_logs', {
                                'type': 'error_logs',
                                'logs': errors[-10:],  # 最多发送10条
                                'timestamp': datetime.utcnow().isoformat()
                            }, room=client_id)
                
                await asyncio.sleep(30)  # 每30秒检查一次
            except Exception as e:
                print(f"Error streaming error logs: {e}")
                break
    
    socketio.start_background_task(stream_error_logs)

# 实时仪表板数据
@socketio.on('dashboard_data')
def handle_dashboard_data(data):
    """处理仪表板数据请求"""
    dashboard_type = data.get('dashboard')
    client_id = request.sid
    
    if not dashboard_type:
        emit('dashboard_error', {
            'error': 'Dashboard type is required'
        })
        return
    
    try:
        if dashboard_type == 'overview':
            # 发送概览仪表板数据
            overview_data = get_dashboard_overview_data()
            emit('dashboard_update', {
                'type': 'overview',
                'data': overview_data,
                'timestamp': datetime.utcnow().isoformat()
            }, room=client_id)
        
        elif dashboard_type == 'performance':
            # 发送性能仪表板数据
            performance_data = get_dashboard_performance_data()
            emit('dashboard_update', {
                'type': 'performance',
                'data': performance_data,
                'timestamp': datetime.utcnow().isoformat()
            }, room=client_id)
        
        elif dashboard_type == 'ddns':
            # 发送DDNS仪表板数据
            ddns_data = get_dashboard_ddns_data()
            emit('dashboard_update', {
                'type': 'ddns',
                'data': ddns_data,
                'timestamp': datetime.utcnow().isoformat()
            }, room=client_id)
    
    except Exception as e:
        emit('dashboard_error', {
            'error': str(e)
        })

# 实时命令执行
@socketio.on('execute_command')
def handle_execute_command(data):
    """处理实时命令执行"""
    command = data.get('command')
    client_id = request.sid
    
    if not command:
        emit('command_error', {
            'error': 'Command is required'
        })
        return
    
    # 验证命令执行权限
    if not can_execute_command(client_id, command):
        emit('command_error', {
            'error': 'Insufficient permissions to execute this command'
        })
        return
    
    try:
        # 执行命令
        result = execute_system_command(command)
        
        emit('command_result', {
            'command': command,
            'result': result,
            'timestamp': datetime.utcnow().isoformat()
        }, room=client_id)
    
    except Exception as e:
        emit('command_error', {
            'error': str(e),
            'command': command
        })
```

## 10. **第三方集成API**

### 10.1 Webhook集成

```python
# api/v2/integrations/webhooks.py
from flask import Blueprint, request, jsonify
import hmac
import hashlib
import json

webhooks_bp = Blueprint('webhooks_v2', __name__, url_prefix='/api/v2/webhooks')

@webhooks_bp.route('', methods=['GET'])
@token_required
@role_required("integrations:read")
def list_webhooks():
    """列出所有Webhook配置"""
    try:
        webhooks = get_webhook_configurations()
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "webhooks": webhooks,
                "count": len(webhooks)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@webhooks_bp.route('', methods=['POST'])
@token_required
@role_required("integrations:write")
def create_webhook():
    """创建Webhook配置"""
    data = request.get_json()
    
    required_fields = ["name", "url", "events", "secret"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({
            "success": False,
            "error": f"Missing required fields: {', '.join(missing)}"
        }), 400
    
    try:
        webhook = create_webhook_configuration(data)
        
        # 测试Webhook
        test_result = test_webhook_configuration(webhook["id"])
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "webhook": webhook,
                "test_result": test_result
            },
            "message": "Webhook created and tested"
        }), 201
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@webhooks_bp.route('/<string:webhook_id>/test', methods=['POST'])
@token_required
@role_required("integrations:write")
def test_webhook(webhook_id):
    """测试Webhook"""
    try:
        test_result = test_webhook_configuration(webhook_id)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": test_result,
            "message": "Webhook test completed"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@webhooks_bp.route('/<string:webhook_id>/deliveries', methods=['GET'])
@token_required
@role_required("integrations:read")
def get_webhook_deliveries(webhook_id):
    """获取Webhook投递记录"""
    limit = request.args.get('limit', 50, type=int)
    status = request.args.get('status')  # success, failed
    
    try:
        deliveries = get_webhook_delivery_history(
            webhook_id=webhook_id,
            limit=limit,
            status=status
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "webhook_id": webhook_id,
                "deliveries": deliveries,
                "summary": {
                    "total": get_total_deliveries_count(webhook_id),
                    "successful": get_successful_deliveries_count(webhook_id),
                    "failed": get_failed_deliveries_count(webhook_id)
                }
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Webhook接收端点
@webhooks_bp.route('/receive/<string:provider>', methods=['POST'])
def receive_webhook(provider):
    """接收第三方Webhook"""
    # 验证请求签名
    signature = request.headers.get('X-Hub-Signature-256')
    if not signature:
        return jsonify({"error": "Missing signature"}), 401
    
    # 根据provider验证签名
    secret = get_webhook_secret_for_provider(provider)
    if not secret:
        return jsonify({"error": "Unknown provider"}), 404
    
    # 计算签名
    body = request.get_data()
    expected_signature = 'sha256=' + hmac.new(
        secret.encode(),
        body,
        hashlib.sha256
    ).hexdigest()
    
    if not hmac.compare_digest(signature, expected_signature):
        return jsonify({"error": "Invalid signature"}), 401
    
    try:
        data = request.get_json()
        
        # 处理Webhook事件
        process_webhook_event(provider, data)
        
        # 记录接收
        log_webhook_reception(provider, data)
        
        return jsonify({
            "success": True,
            "message": "Webhook received"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

# Webhook事件处理函数
def process_webhook_event(provider, data):
    """处理Webhook事件"""
    if provider == 'github':
        process_github_webhook(data)
    elif provider == 'gitlab':
        process_gitlab_webhook(data)
    elif provider == 'slack':
        process_slack_webhook(data)
    elif provider == 'discord':
        process_discord_webhook(data)
    elif provider == 'telegram':
        process_telegram_webhook(data)
    else:
        # 通用处理
        process_generic_webhook(provider, data)

def process_github_webhook(data):
    """处理GitHub Webhook"""
    event_type = request.headers.get('X-GitHub-Event')
    
    if event_type == 'push':
        # 处理代码推送
        repository = data['repository']['full_name']
        branch = data['ref'].split('/')[-1]
        
        # 触发自动化部署
        trigger_deployment(repository, branch)
        
    elif event_type == 'pull_request':
        # 处理Pull Request
        action = data['action']
        pr_number = data['pull_request']['number']
        
        if action in ['opened', 'reopened']:
            # 触发CI/CD
            trigger_ci_for_pr(pr_number)
    
    # 广播事件
    broadcast_event('github_webhook', {
        'event_type': event_type,
        'data': data
    })

def process_slack_webhook(data):
    """处理Slack Webhook"""
    # 处理Slack命令或交互
    if data.get('type') == 'url_verification':
        # Slack URL验证
        return {'challenge': data.get('challenge')}
    
    # 处理Slack交互
    process_slack_interaction(data)
    
    # 广播事件
    broadcast_event('slack_webhook', {
        'data': data
    })
```

### 10.2 第三方服务集成

```python
# api/v2/integrations/services.py
from flask import Blueprint, request, jsonify
import requests

integrations_bp = Blueprint('integrations_v2', __name__, url_prefix='/api/v2/integrations')

@integrations_bp.route('/slack/notify', methods=['POST'])
@token_required
@role_required("integrations:write")
def send_slack_notification():
    """发送Slack通知"""
    data = request.get_json()
    
    channel = data.get('channel', '#alerts')
    message = data.get('message')
    attachments = data.get('attachments', [])
    
    if not message:
        return jsonify({
            "success": False,
            "error": "Message is required"
        }), 400
    
    try:
        result = send_slack_message(
            channel=channel,
            message=message,
            attachments=attachments
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": result,
            "message": "Slack notification sent"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@integrations_bp.route('/telegram/send', methods=['POST'])
@token_required
@role_required("integrations:write")
def send_telegram_message():
    """发送Telegram消息"""
    data = request.get_json()
    
    chat_id = data.get('chat_id')
    message = data.get('message')
    parse_mode = data.get('parse_mode', 'Markdown')
    
    if not chat_id or not message:
        return jsonify({
            "success": False,
            "error": "Chat ID and message are required"
        }), 400
    
    try:
        result = send_telegram_notification(
            chat_id=chat_id,
            message=message,
            parse_mode=parse_mode
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": result,
            "message": "Telegram message sent"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@integrations_bp.route('/email/send', methods=['POST'])
@token_required
@role_required("integrations:write")
def send_email():
    """发送电子邮件"""
    data = request.get_json()
    
    required_fields = ["to", "subject", "body"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({
            "success": False,
            "error": f"Missing required fields: {', '.join(missing)}"
        }), 400
    
    try:
        result = send_email_notification(
            to=data["to"],
            subject=data["subject"],
            body=data["body"],
            html=data.get("html"),
            attachments=data.get("attachments", [])
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": result,
            "message": "Email sent"
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@integrations_bp.route('/github/repos', methods=['GET'])
@token_required
@role_required("integrations:read")
def list_github_repositories():
    """列出GitHub仓库"""
    org = request.args.get('org')
    
    try:
        repos = get_github_repositories(org=org)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": {
                "repositories": repos,
                "count": len(repos)
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@integrations_bp.route('/github/deploy', methods=['POST'])
@token_required
@role_required("integrations:admin")
def trigger_github_deployment():
    """触发GitHub部署"""
    data = request.get_json()
    
    required_fields = ["repository", "ref"]
    missing = [field for field in required_fields if field not in data]
    if missing:
        return jsonify({
            "success": False,
            "error": f"Missing required fields: {', '.join(missing)}"
        }), 400
    
    try:
        deployment = trigger_github_deployment_action(
            repository=data["repository"],
            ref=data["ref"],
            environment=data.get("environment", "production"),
            payload=data.get("payload", {})
        )
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": deployment,
            "message": "GitHub deployment triggered"
        }), 202
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@integrations_bp.route('/docker/webhook', methods=['POST'])
@token_required
@role_required("integrations:write")
def handle_docker_webhook():
    """处理Docker Webhook"""
    data = request.get_json()
    
    try:
        # 处理Docker镜像推送事件
        if data.get('push_data'):
            image_name = data['repository']['repo_name']
            tag = data['push_data']['tag']
            
            # 触发容器更新
            trigger_container_update(image_name, tag)
            
            return jsonify({
                "success": True,
                "timestamp": datetime.utcnow().isoformat(),
                "message": f"Docker image {image_name}:{tag} update triggered"
            })
        
        return jsonify({
            "success": False,
            "error": "Invalid Docker webhook payload"
        }), 400
    
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@integrations_bp.route('/aws/status', methods=['GET'])
@token_required
@role_required("integrations:read")
def get_aws_status():
    """获取AWS服务状态"""
    region = request.args.get('region', 'us-east-1')
    
    try:
        status = get_aws_service_status(region)
        
        return jsonify({
            "success": True,
            "timestamp": datetime.utcnow().isoformat(),
            "data": status
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500
```

## 11. **API文档与测试**

### 11.1 OpenAPI规范

```yaml
# openapi.yaml
openapi: 3.0.3
info:
  title: NAS DDNS API
  description: Comprehensive API for NAS DDNS Management System
  version: 2.0.0
  contact:
    name: API Support
    email: api@ddns.0379.email
  license:
    name: MIT
    url: https://opensource.org/licenses/MIT

servers:
  - url: https://api.ddns.0379.edu/api/v2
    description: Production server
  - url: https://api-staging.ddns.0379.edu/api/v2
    description: Staging server
  - url: http://localhost:8080/api/v2
    description: Local development server

security:
  - bearerAuth: []
  - apiKeyAuth: []

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    apiKeyAuth:
      type: apiKey
      in: header
      name: X-API-Key

  schemas:
    Error:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: string
          example: "Resource not found"
        timestamp:
          type: string
          format: date-time

    Success:
      type: object
      properties:
        success:
          type: boolean
          example: true
        data:
          type: object
        timestamp:
          type: string
          format: date-time

    DDNSStatus:
      type: object
      properties:
        ddns_enabled:
          type: boolean
        ddns_running:
          type: boolean
        current_ip:
          type: string
        domain:
          type: string
        last_check:
          type: string
          format: date-time

  parameters:
    PaginationLimit:
      name: limit
      in: query
      description: Number of items per page
      required: false
      schema:
        type: integer
        minimum: 1
        maximum: 100
        default: 50
    
    PaginationOffset:
      name: offset
      in: query
      description: Offset for pagination
      required: false
      schema:
        type: integer
        minimum: 0
        default: 0
    
    TimeRange:
      name: range
      in: query
      description: Time range for data
      required: false
      schema:
        type: string
        enum: [1h, 24h, 7d, 30d]
        default: 24h

paths:
  /health:
    get:
      summary: Health check
      description: Check API health status
      responses:
        '200':
          description: API is healthy
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Success'
        '503':
          description: API is unhealthy
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Error'

  /ddns/status:
    get:
      summary: Get DDNS status
      description: Get current DDNS service status
      security:
        - bearerAuth: []
      responses:
        '200':
          description: DDNS status retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Success'
        '401':
          description: Unauthorized
        '500':
          description: Internal server error

  /ddns/records:
    get:
      summary: List DNS records
      description: List all DNS records for managed domains
      security:
        - bearerAuth: []
      parameters:
        - $ref: '#/components/parameters/PaginationLimit'
        - $ref: '#/components/parameters/PaginationOffset'
        - name: domain
          in: query
          schema:
            type: string
          required: false
          description: Filter by domain
      responses:
        '200':
          description: DNS records retrieved
        '401':
          description: Unauthorized

  /alerts:
    get:
      summary: List alerts
      description: Get list of system alerts
      security:
        - bearerAuth: []
        - apiKeyAuth: []
      parameters:
        - $ref: '#/components/parameters/PaginationLimit'
        - name: status
          in: query
          schema:
            type: string
            enum: [active, resolved, all]
          required: false
          default: active
        - name: severity
          in: query
          schema:
            type: string
            enum: [critical, warning, info]
          required: false
      responses:
        '200':
          description: Alerts retrieved
        '401':
          description: Unauthorized
        '403':
          description: Forbidden

  /monitoring/system:
    get:
      summary: System monitoring
      description: Get real-time system monitoring data
      security:
        - apiKeyAuth: []
      parameters:
        - name: metrics
          in: query
          schema:
            type: string
            enum: [all, cpu, memory, disk, network, processes]
          required: false
          default: all
      responses:
        '200':
          description: Monitoring data retrieved
        '401':
          description: Unauthorized
```

### 11.2 API测试套件

```python
# tests/api/test_ddns_api.py
import pytest
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8080/api/v2"

class TestDDNSAPI:
    """DDNS API测试类"""
    
    @pytest.fixture
    def auth_headers(self):
        """获取认证头部"""
        # 获取访问令牌
        auth_response = requests.post(f"{BASE_URL}/auth/login", json={
            "username": "admin",
            "password": "admin123"
        })
        token = auth_response.json()["data"]["access_token"]
        
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }
    
    def test_health_check(self):
        """测试健康检查"""
        response = requests.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert data["status"] == "healthy"
    
    def test_get_ddns_status(self, auth_headers):
        """测试获取DDNS状态"""
        response = requests.get(f"{BASE_URL}/ddns/status", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "ddns_enabled" in data["data"]
        assert "current_ip" in data["data"]
    
    def test_list_dns_records(self, auth_headers):
        """测试列出DNS记录"""
        response = requests.get(f"{BASE_URL}/ddns/records", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "records" in data["data"]
        assert isinstance(data["data"]["records"], list)
    
    def test_manual_ddns_update(self, auth_headers):
        """测试手动DDNS更新"""
        response = requests.post(
            f"{BASE_URL}/ddns/manual-update",
            headers=auth_headers,
            json={"force": True}
        )
        assert response.status_code == 200 or response.status_code == 429  # 429是速率限制
        if response.status_code == 200:
            data = response.json()
            assert data["success"] == True
    
    def test_get_update_history(self, auth_headers):
        """测试获取更新历史"""
        response = requests.get(
            f"{BASE_URL}/ddns/history",
            headers=auth_headers,
            params={"limit": 10}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "history" in data["data"]

class TestMonitoringAPI:
    """监控API测试类"""
    
    @pytest.fixture
    def api_key_headers(self):
        """获取API密钥头部"""
        return {
            "X-API-Key": "test-api-key-123",
            "Content-Type": "application/json"
        }
    
    def test_get_system_monitoring(self, api_key_headers):
        """测试获取系统监控数据"""
        response = requests.get(
            f"{BASE_URL}/monitoring/system",
            headers=api_key_headers,
            params={"metrics": "cpu,memory"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "cpu" in data["data"]
        assert "memory" in data["data"]
    
    def test_get_services_status(self, api_key_headers):
        """测试获取服务状态"""
        response = requests.get(
            f"{BASE_URL}/monitoring/services",
            headers=api_key_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "services" in data["data"]

class TestAnalyticsAPI:
    """分析API测试类"""
    
    def test_get_usage_statistics(self, auth_headers):
        """测试获取使用统计"""
        response = requests.get(
            f"{BASE_URL}/analytics/usage",
            headers=auth_headers,
            params={"period": "7d", "metric": "requests"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "statistics" in data["data"]
    
    def test_get_ddns_analytics(self, auth_headers):
        """测试获取DDNS分析"""
        response = requests.get(
            f"{BASE_URL}/analytics/ddns/history",
            headers=auth_headers,
            params={"days": 30}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "analytics" in data["data"]

class TestConfigAPI:
    """配置API测试类"""
    
    def test_list_configurations(self, auth_headers):
        """测试列出配置"""
        response = requests.get(
            f"{BASE_URL}/config",
            headers=auth_headers,
            params={"environment": "production"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "configurations" in data["data"]
    
    def test_create_configuration(self, auth_headers):
        """测试创建配置"""
        config_data = {
            "name": "test-config",
            "environment": "test",
            "service": "ddns",
            "config": {
                "domain": "test.0379.email",
                "check_interval": 300
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/config",
            headers=auth_headers,
            json=config_data
        )
        
        # 201创建成功或400配置已存在
        assert response.status_code in [201, 400]
        
        if response.status_code == 201:
            data = response.json()
            assert data["success"] == True
            assert data["data"]["name"] == "test-config"

# 性能测试
class TestAPIPerformance:
    """API性能测试类"""
    
    def test_response_time(self, auth_headers):
        """测试响应时间"""
        import time
        
        endpoints = [
            "/health",
            "/ddns/status",
            "/monitoring/system"
        ]
        
        max_response_time = 2.0  # 秒
        
        for endpoint in endpoints:
            start_time = time.time()
            if "monitoring" in endpoint:
                headers = {"X-API-Key": "test-key"}
            else:
                headers = auth_headers
            
            response = requests.get(f"{BASE_URL}{endpoint}", headers=headers)
            end_time = time.time()
            
            response_time = end_time - start_time
            print(f"{endpoint}: {response_time:.3f}s")
            
            assert response_time < max_response_time, f"{endpoint}响应时间过长: {response_time:.3f}s"
            assert response.status_code == 200
    
    def test_concurrent_requests(self):
        """测试并发请求"""
        import concurrent.futures
        
        def make_request(endpoint):
            response = requests.get(f"{BASE_URL}{endpoint}")
            return response.status_code
        
        endpoints = ["/health"] * 50  # 50个并发请求
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
            results = list(executor.map(make_request, endpoints))
        
        success_count = sum(1 for code in results if code == 200)
        success_rate = success_count / len(results)
        
        print(f"并发请求成功率: {success_rate:.2%}")
        assert success_rate >= 0.95, f"并发请求成功率过低: {success_rate:.2%}"

# 安全测试
class TestAPISecurity:
    """API安全测试类"""
    
    def test_authentication_required(self):
        """测试认证要求"""
        protected_endpoints = [
            "/ddns/status",
            "/ddns/records",
            "/config"
        ]
        
        for endpoint in protected_endpoints:
            response = requests.get(f"{BASE_URL}{endpoint}")
            assert response.status_code in [401, 403], f"{endpoint}应该要求认证"
    
    def test_rate_limiting(self, auth_headers):
        """测试速率限制"""
        # 快速发送多个请求
        for i in range(15):
            response = requests.get(f"{BASE_URL}/ddns/status", headers=auth_headers)
        
        # 应该被限制
        assert response.status_code == 429, "速率限制应该生效"
    
    def test_input_validation(self, auth_headers):
        """测试输入验证"""
        # 测试无效的配置数据
        invalid_config = {
            "name": "",
            "environment": "production",
            "config": "not a json object"
        }
        
        response = requests.post(
            f"{BASE_URL}/config",
            headers=auth_headers,
            json=invalid_config
        )
        
        assert response.status_code == 400, "应该拒绝无效输入"
        data = response.json()
        assert "error" in data
    
    def test_sql_injection_prevention(self, auth_headers):
        """测试SQL注入防护"""
        # 尝试SQL注入
        malicious_params = {
            "domain": "0379.email' OR '1'='1",
            "type": "A' UNION SELECT * FROM users--"
        }
        
        response = requests.get(
            f"{BASE_URL}/ddns/records",
            headers=auth_headers,
            params=malicious_params
        )
        
        # 应该正确处理或返回错误，而不是执行SQL
        assert response.status_code != 500, "不应该返回服务器错误"
        
        if response.status_code == 200:
            data = response.json()
            # 应该返回空结果或错误，而不是用户数据
            assert "users" not in str(data).lower()

# 集成测试
class TestIntegration:
    """集成测试"""
    
    def test_end_to_end_workflow(self, auth_headers):
        """测试端到端工作流"""
        # 1. 检查当前状态
        status_response = requests.get(f"{BASE_URL}/ddns/status", headers=auth_headers)
        assert status_response.status_code == 200
        current_ip = status_response.json()["data"]["current_ip"]
        
        # 2. 手动触发更新
        update_response = requests.post(
            f"{BASE_URL}/ddns/manual-update",
            headers=auth_headers,
            json={"force": False}
        )
        
        if update_response.status_code == 200:
            # 3. 检查更新历史
            history_response = requests.get(
                f"{BASE_URL}/ddns/history",
                headers=auth_headers,
                params={"limit": 1}
            )
            assert history_response.status_code == 200
            
            history = history_response.json()["data"]["history"]
            if history:
                latest_update = history[0]
                # 验证更新记录
                assert "timestamp" in latest_update
                assert "ip" in latest_update
        
        # 4. 检查监控数据
        monitor_response = requests.get(
            f"{BASE_URL}/monitoring/system",
            headers={"X-API-Key": "test-key"}
        )
        assert monitor_response.status_code == 200
        
        # 5. 生成报告
        report_response = requests.post(
            f"{BASE_URL}/analytics/reports/generate",
            headers=auth_headers,
            json={"type": "test", "format": "json"}
        )
        assert report_response.status_code in [200, 202]
        
        print("端到端工作流测试完成")

# 运行测试
if __name__ == "__main__":
    # 可以使用pytest运行测试
    # pytest tests/api/test_ddns_api.py -v
    
    # 或者直接运行
    import sys
    sys.path.append('.')
    
    # 创建测试实例并运行
    test_suite = TestDDNSAPI()
    
    # 需要先设置测试环境
    print("Running API tests...")
    
    # 这里只是示例，实际应该使用pytest
    try:
        test_suite.test_health_check()
        print("✓ Health check test passed")
    except Exception as e:
        print(f"✗ Health check test failed: {e}")
```

## 12. **部署与运维**

### 12.1 Docker部署配置

```dockerfile
# Dockerfile
# 多阶段构建优化

# 第一阶段：构建阶段
FROM python:3.9-slim AS builder

WORKDIR /app

# 安装构建依赖
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件
COPY requirements.txt .
COPY requirements-dev.txt .

# 安装Python依赖
RUN pip install --user --no-cache-dir -r requirements.txt

# 第二阶段：运行阶段
FROM python:3.9-slim

LABEL maintainer="admin@ddns.0379.email"
LABEL version="2.0.0"
LABEL description="NAS DDNS API Service"

WORKDIR /app

# 创建非root用户
RUN groupadd -r nas && useradd -r -g nas nas

# 安装运行时依赖
RUN apt-get update && apt-get install -y \
    curl \
    dnsutils \
    nginx \
    supervisor \
    && rm -rf /var/lib/apt/lists/*

# 从构建阶段复制Python依赖
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# 复制应用代码
COPY . .

# 复制配置文件
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# 设置权限
RUN chown -R nas:nas /app
RUN chmod +x /app/docker/entrypoint.sh

# 创建必要的目录
RUN mkdir -p /app/logs /app/data /app/cache
RUN chown -R nas:nas /app/logs /app/data /app/cache

# 切换到非root用户
USER nas

# 暴露端口
EXPOSE 8080 8443

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/api/v2/health || exit 1

# 启动脚本
ENTRYPOINT ["/app/docker/entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  # API服务
  api:
    build: .
    container_name: nas-ddns-api
    restart: unless-stopped
    ports:
      - "8080:8080"
      - "8443:8443"
    environment:
      - ENVIRONMENT=production
      - DATABASE_URL=postgresql://user:password@db:5432/nas_ddns
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
      - ALIYUN_ACCESS_KEY_ID=${ALIYUN_ACCESS_KEY_ID}
      - ALIYUN_ACCESS_KEY_SECRET=${ALIYUN_ACCESS_KEY_SECRET}
    volumes:
      - ./data:/app/data
      - ./logs:/app/logs
      - ./cache:/app/cache
      - ./config:/app/config
    depends_on:
      - db
      - redis
    networks:
      - nas-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/api/v2/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # PostgreSQL数据库
  db:
    image: postgres:14-alpine
    container_name: nas-ddns-db
    restart: unless-stopped
    environment:
      - POSTGRES_DB=nas_ddns
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      volumes:
        - postgres_data:/var/lib/postgresql/data
        - ./docker/init.sql:/docker-entrypoint-initdb.d/init.sql
      networks:
        - nas-network
      healthcheck:
        test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
        interval: 10s
        timeout: 5s
        retries: 5

    # Redis服务
    redis:
      image: redis:7-alpine
      container_name: nas-ddns-redis
      restart: unless-stopped
      command: >
        redis-server
        --requirepass ${REDIS_PASSWORD}
        --appendonly yes
        --maxmemory 256mb
        --maxmemory-policy allkeys-lru
      volumes:
        - redis_data:/data
      networks:
        - nas-network
      healthcheck:
        test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
        interval: 10s
        timeout: 3s
        retries: 5

    # Nginx反向代理
    nginx:
      image: nginx:alpine
      container_name: nas-ddns-nginx
      restart: unless-stopped
      ports:
        - "80:80"
        - "443:443"
      volumes:
        - ./docker/nginx.conf:/etc/nginx/nginx.conf:ro
        - ./docker/ssl:/etc/nginx/ssl:ro
        - ./logs/nginx:/var/log/nginx
      depends_on:
        - api
      networks:
        - nas-network

    # Prometheus监控
    prometheus:
      image: prom/prometheus:latest
      container_name: nas-ddns-prometheus
      restart: unless-stopped
      ports:
        - "9090:9090"
      volumes:
        - ./docker/prometheus.yml:/etc/prometheus/prometheus.yml
        - prometheus_data:/prometheus
      command:
        - '--config.file=/etc/prometheus/prometheus.yml'
        - '--storage.tsdb.path=/prometheus'
        - '--web.console.libraries=/etc/prometheus/console_libraries'
        - '--web.console.templates=/etc/prometheus/consoles'
      networks:
        - nas-network

    # Grafana可视化
    grafana:
      image: grafana/grafana:latest
      container_name: nas-ddns-grafana
      restart: unless-stopped
      ports:
        - "3001:3000"
      environment:
        - GF_SECURITY_ADMIN_USER=${GRAFANA_USER}
        - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      volumes:
        - grafana_data:/var/lib/grafana
        - ./docker/grafana/dashboards:/etc/grafana/provisioning/dashboards
        - ./docker/grafana/datasources:/etc/grafana/provisioning/datasources
      depends_on:
        - prometheus
      networks:
        - nas-network

    # 日志采集 (Loki)
    loki:
      image: grafana/loki:latest
      container_name: nas-ddns-loki
      restart: unless-stopped
      ports:
        - "3100:3100"
      volumes:
        - ./docker/loki-config.yml:/etc/loki/local-config.yaml
        - loki_data:/loki
      command: -config.file=/etc/loki/local-config.yaml
      networks:
        - nas-network

    # 备份服务
    backup:
      image: prodrigestivill/postgres-backup-local
      container_name: nas-ddns-backup
      restart: unless-stopped
      volumes:
        - ./backups:/backups
      environment:
        - POSTGRES_HOST=db
        - POSTGRES_DB=nas_ddns
        - POSTGRES_USER=${DB_USER}
        - POSTGRES_PASSWORD=${DB_PASSWORD}
        - SCHEDULE=@daily
        - BACKUP_KEEP_DAYS=7
        - BACKUP_KEEP_WEEKS=4
        - BACKUP_KEEP_MONTHS=6
      depends_on:
        - db
      networks:
        - nas-network

  networks:
    nas-network:
      driver: bridge

  volumes:
    postgres_data:
    redis_data:
    prometheus_data:
    grafana_data:
    loki_data:

### 12.2 Kubernetes部署配置

  # k8s/namespace.yaml
  apiVersion: v1
  kind: Namespace
  metadata:
    name: yyc3-production
    labels:
      name: production
      environment: production

  ---
  # k8s/deployment.yaml
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: yyc3-api
    namespace: yyc3-production
    labels:
      app: yyc3-api
      tier: backend
  spec:
    replicas: 3  # 高可用：多副本
    strategy:
      type: RollingUpdate
      rollingUpdate:
        maxSurge: 1
        maxUnavailable: 0
    selector:
      matchLabels:
        app: yyc3-api
    template:
      metadata:
        labels:
          app: yyc3-api
          version: v2.0.0
        annotations:
          prometheus.io/scrape: "true"
          prometheus.io/port: "8080"
          prometheus.io/path: "/metrics"
      spec:
        serviceAccountName: yyc3-api
        securityContext:
          runAsNonRoot: true
          runAsUser: 1000
          fsGroup: 1000
        containers:
        - name: api
          image: registry.0379.email/yyc3/api:v2.0.0
          imagePullPolicy: Always
          ports:
          - name: http
            containerPort: 8080
            protocol: TCP
          - name: https
            containerPort: 8443
            protocol: TCP
          env:
          - name: ENVIRONMENT
            value: "production"
          - name: DATABASE_URL
            valueFrom:
              secretKeyRef:
                name: yyc3-secrets
                key: database-url
          - name: REDIS_URL
            valueFrom:
              secretKeyRef:
                name: yyc3-secrets
                key: redis-url
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /api/v2/health
              port: http
            initialDelaySeconds: 30
            periodSeconds: 10
            timeoutSeconds: 5
            successThreshold: 1
            failureThreshold: 3
          readinessProbe:
            httpGet:
              path: /api/v2/ready
              port: http
            initialDelaySeconds: 5
            periodSeconds: 5
            timeoutSeconds: 1
            successThreshold: 1
            failureThreshold: 3
          volumeMounts:
          - name: config
            mountPath: /app/config
            readOnly: true
          - name: logs
            mountPath: /app/logs
        volumes:
        - name: config
          configMap:
            name: yyc3-config
        - name: logs
          emptyDir: {}
  ---
  # k8s/service.yaml
  apiVersion: v1
  kind: Service
  metadata:
    name: yyc3-api
    namespace: yyc3-production
    labels:
      app: yyc3-api
  spec:
    type: ClusterIP
    ports:
    - name: http
      port: 80
      targetPort: 8080
      protocol: TCP
    - name: https
      port: 443
      targetPort: 8443
      protocol: TCP
    selector:
      app: yyc3-api
  ---
  # k8s/ingress.yaml
  apiVersion: networking.k8s.io/v1
  kind: Ingress
  metadata:
    name: yyc3-api-ingress
    namespace: yyc3-production
    annotations:
      kubernetes.io/ingress.class: "nginx"
      cert-manager.io/cluster-issuer: "letsencrypt-prod"
      nginx.ingress.kubernetes.io/rate-limit: "100"
      nginx.ingress.kubernetes.io/ssl-redirect: "true"
  spec:
    tls:
    - hosts:
      - api.0379.email
      secretName: yyc3-api-tls
    rules:
    - host: api.0379.email
      http:
        paths:
        - path: /
          pathType: Prefix
          backend:
            service:
              name: yyc3-api
              port:
                number: 80
  ---
  # k8s/hpa.yaml (Horizontal Pod Autoscaler)
  apiVersion: autoscaling/v2
  kind: HorizontalPodAutoscaler
  metadata:
    name: yyc3-api-hpa
    namespace: yyc3-production
  spec:
    scaleTargetRef:
      apiVersion: apps/v1
      kind: Deployment
      name: yyc3-api
    minReplicas: 3
    maxReplicas: 10
    metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
    behavior:
      scaleDown:
        stabilizationWindowSeconds: 300
        policies:
        - type: Percent
          value: 50
          periodSeconds: 60
      scaleUp:
        stabilizationWindowSeconds: 0
        policies:
        - type: Percent
          value: 100
          periodSeconds: 15

--------

## 13. CI/CD流水线构建

### 13.1 GitHub Actions工作流

  # .github/workflows/ci-cd.yml
  name: YYC³ API CI/CD Pipeline

  on:
    push:
      branches: [ main, develop ]
    pull_request:
      branches: [ main ]
    release:
      types: [ created ]

  env:
    REGISTRY: registry.0379.email
    IMAGE_NAME: yyc3/api

  jobs:
    # Lint与测试
    test:
      name: Code Quality & Tests
      runs-on: ubuntu-latest

      steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
          cache: 'pip'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-dev.txt

      - name: Lint with flake8
        run: |
          # 停止构建如果有Python语法错误或未定义的名称
          flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
          # 退出零将所有错误视为警告
          flake8 . --count --exit-zero --max-complexity=10 --max-line-length=127 --statistics

      - name: Type check with mypy
        run: mypy --ignore-missing-imports .

      - name: Security check with bandit
        run: bandit -r . -f json -o bandit-report.json || true

      - name: Run Unit Tests
        run: pytest --cov=. --cov-report=xml --cov-report=html

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage.xml
          flags: unittests
          name: codecov-umbrella

      - name: Upload Security Report
        uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: bandit-report.json

    # 构建镜像
    build:
      name: Build Docker Image
      needs: test
      runs-on: ubuntu-latest
      outputs:
        image-tag: ${{ steps.meta.outputs.tags }}
        image-digest: ${{ steps.build.outputs.digest }}

      steps:
      - uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Log in to Container Registry
        uses: docker/login-action@v2
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ secrets.REGISTRY_USER }}
          password: ${{ secrets.REGISTRY_PASSWORD }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix=

      - name: Build and push Docker image
        id: build
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache
          cache-to: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache,mode=max
          build-args: |
            BUILD_DATE=${{ github.event.head_commit.timestamp }}
            VCS_REF=${{ github.sha }}
            VERSION=${{ steps.meta.outputs.version }}

    # 部署到Staging环境
    deploy-staging:
      name: Deploy to Staging
      needs: build
      runs-on: ubuntu-latest
      if: github.ref == 'refs/heads/develop'
      environment:
        name: staging
        url: https://staging-api.0379.email

      steps:
      - uses: actions/checkout@v3

      - name: Configure kubectl
        run: |
          mkdir -p $HOME/.kube
          echo "${{ secrets.KUBE_CONFIG_STAGING }}" | base64 -d > $HOME/.kube/config

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/yyc3-api \
            api=${{ needs.build.outputs.image-tag }} \
            -n yyc3-staging
          kubectl rollout status deployment/yyc3-api -n yyc3-staging

      - name: Run smoke tests
        run: |
          kubectl run smoke-test --image=curlimages/curl --rm -i --restart=Never -- \
            curl -f https://staging-api.0379.email/api/v2/health || exit 1

    # 部署到Production环境
    deploy-production:
      name: Deploy to Production
      needs: build
      runs-on: ubuntu-latest
      if: github.event_name == 'release'
      environment:
        name: production
        url: https://api.0379.email

      steps:
      - uses: actions/checkout@v3

      - name: Configure kubectl
        run: |
          mkdir -p $HOME/.kube
          echo "${{ secrets.KUBE_CONFIG_PROD }}" | base64 -d > $HOME/.kube/config

      - name: Canary Deployment (10%)
        run: |
          # 金丝雀发布策略：先更新10%的流量
          kubectl patch deployment yyc3-api -n yyc3-production -p '{"spec":{"replicas": 10}}' # 假设总副本数为10
          # 更新镜像
          kubectl set image deployment/yyc3-api \
            api=${{ needs.build.outputs.image-tag }} \
            -n yyc3-production
          kubectl rollout status deployment/yyc3-api -n yyc3-production

      - name: Wait for approval
        uses: trstringer/manual-approval@v1
        with:
          secret: ${{ secrets.GITHUB_TOKEN }}
          approvers: admin,devops-lead
          minimum-approvals: 1
          timeout-minutes: 30

      - name: Full Rollout (100%)
        run: |
          kubectl patch deployment yyc3-api -n yyc3-production -p '{"spec":{"replicas": 10}}'
          kubectl rollout status deployment/yyc3-api -n yyc3-production

      - name: Post-deployment tests
        run: |
          python tests/api/integration_tests.py --env production

--------

## 14. 构建"五高五标五化"企业级体系

本章节将深入阐述如何通过上述API架构，落地实施"五高五标五化"的企业级技术标准。

### 14.1 五高 (High - High Availability, Performance, Concurrency, Security, Scalability)

#### 🔴 高可用性

• 多实例部署: Docker/K8s 部署不少于3个副本，确保单点故障不影响服务。
• 健康检查: 实现了  /health ,  /ready  和  /live  三级探针，配合K8s存活性和就绪性探针。
• 故障转移: API提供了  /api/v2/ha/failover  端点，结合K8s HPA（自动扩缩容）和PDB（Pod中断预算）实现无缝切换。
• 数据备份: 集成数据库备份服务和Redis持久化策略。

#### 🔴 高性能

• 缓存策略: 全面集成Redis缓存，支持TTL设置和LRU淘汰策略。
• 连接池: 数据库和Redis均使用连接池复用。
• 异步处理: 使用Celery或后台线程处理耗时任务（如DDNS更新、日志分析）。
• 响应压缩: Nginx配置Gzip压缩，减少传输负载。

#### 🔴 高并发

• I/O模型: Flask配合Gunicorn使用Gevent/Eventlet异步Worker。
• WebSocket支持: 提供长连接能力，支持数千并发连接实时推送。
• 负载均衡: Nginx反向轮询/最少连接负载均衡，K8s Service集群IP负载分发。
• 无状态设计: API设计为无状态，便于水平扩展。

#### 🔴 高安全性

• 多重认证: 支持JWT (OAuth2) 和 API Key 双重认证机制。
• 加密传输: 强制HTTPS (TLS 1.3)，配置严格的HSTS和CSP头。
• 密钥管理: Secrets Manager 管理敏感信息，支持密钥轮换 ( /api/v2/secrets/key/rotate )。
• 访问控制: 细粒度的RBAC ( @role_required ) 和Scope控制 ( @scope_required )。

#### 🔴 高扩展性

• 微服务架构: 将DDNS、监控、配置、分析拆分为独立服务，独立扩缩容。
• 插件化设计: API蓝图机制允许动态加载新模块。
• 消息队列集成: 预留RabbitMQ/Kafka接口用于服务解耦。
• 弹性伸缩: K8s HPA基于CPU/内存/自定义指标自动调整副本数。

### 14.2 五标 (Standard - Interface, Doc, Error, Auth, Monitor)

#### 🔵 标准接口

• RESTful规范: 严格遵循REST设计原则，使用标准HTTP动词 (GET/POST/PUT/DELETE)。
• 版本控制: URL路径版本化 ( /api/v2/... )，确保向后兼容。
• 数据格式: 统一使用JSON请求/响应体，标准化时间格式 (ISO 8601)。
• OpenAPI 3.0: 完整的Swagger规范定义，支持接口契约测试。

#### 🔵 标准文档

• 自动化文档: 集成Swagger UI ( /api/docs ) 和 ReDoc。
• 代码注释: Python docstring 详尽描述参数、返回值和异常。
• 变更日志: 维护详细的  CHANGELOG.md ，记录每个版本的API变更。
• 最佳实践: 每个接口提供使用示例 ( examples )。

#### 🔵 标准错误码

• 统一格式: 所有错误响应遵循  {success, error{code, message}, timestamp}  结构。
• 错误分类: 定义清晰的错误代码前缀 (如  AUTH_ ,  RATE_LIMIT_ ,  VALIDATION_ )。
• 国际化支持: 错误信息支持i18n多语言。
• HTTP状态码映射: 正确映射业务错误到HTTP状态码 (400, 401, 403, 404, 429, 500)。

#### 🔵 标准认证

• OAuth2.0标准: 实现 RFC 6749 标准，支持授权码模式、客户端凭证模式。
• JWT标准: 遵循 RFC 7519，包含标准Claims (iss, sub, aud, exp, iat)。
• API Key标准: Header传递 ( X-API-Key )，支持Key ID和Secret分离。
• SSO集成: 预留OIDC接口，支持企业单点登录。

#### 🔵 标准监控

• Metrics标准: 集成Prometheus  /metrics  端点，遵循四大指标类型 (Counter, Gauge, Histogram, Summary)。
• 日志标准: 结构化JSON日志 (JSON Logging)，包含 trace_id, user_id, timestamp 等标准字段。
• 链路追踪: 集成OpenTelemetry，支持分布式追踪 (Distributed Tracing)。
• 告警标准: Alertmanager格式告警，支持PromQL规则定义。

### 14.3 五化 (Modernization - Container, Cloud, Auto, AI, Mesh)

#### 🟢 容器化

• Docker镜像: 标准化多阶段构建 (Multi-stage Build)，最小化镜像体积。
• Docker Compose: 开发环境一键启动，定义完整的网络和存储卷。
• 镜像仓库: 使用Harbor或私有Registry管理镜像生命周期。
• 不可变基础设施: 基于镜像版本部署，避免SSH登录修改配置。

#### 🟢 云原生化

• Kubernetes编排: 生产环境完全托管于K8s。
• 声明式API: 使用YAML/Json描述期望状态，由K8s控制器维护。
• 服务网格: 虽未强制部署，但架构设计兼容Istio/Linkerd，可无缝接入流量管理、熔断降级。
• Serverless预留: 架构支持向Serverless (如AWS Lambda/FaaS) 迁移。

#### 🟢 自动化

• CI/CD流水线: GitHub Actions实现从代码提交到生产部署的全自动流水线。
• 基础设施即代码: Terraform/Ansible管理K8s集群和云资源配置。
• 自动测试: 单元测试、集成测试、E2E测试自动执行。
• 自动运维: 自动化备份、日志轮转、证书续签 (ACME/Let's Encrypt)。

#### 🟢 智能化

• LLM集成: 内置AI Agent接口 ( /api/v2/llm )，支持智能问答和自动化运维助手。
• 异常检测: 基于历史数据的预测分析 ( /api/v2/analytics/predictive )，自动发现异常流量。
• 智能日志分析: 自动解析日志，识别错误模式并生成报告。
• 自愈机制: 结合K8s Operator，针对特定错误实现自动重启或重试。

#### 🟢 网格化

• 流量控制: 通过Ingress和Service Mesh管理灰度发布、金丝雀发布。
• 服务发现: 基于K8s DNS服务发现，动态感知服务实例。
• 统一入口: API Gateway作为统一流量入口，处理鉴权、限流、路由。
• Sidecar模式: 容器设计中预留Sidecar容器位置，用于运行代理、日志采集等辅助进程。

--------

## 15. 总结与展望

本API设计文档构建了一套符合**"五高五标五化"**企业级标准的NAS
DDNS管理系统。通过模块化的微服务架构、严密的安全认证体系、完善的监控告警机制以及现代化的CI/CD流水线，不仅解决了基础DDN
S解析需求，更提供了可扩展、可维护、高可用的企业级平台。

未来演进方向：

1. Service Mesh落地: 引入Istio实现更细粒度的流量治理和mTLS加密。
2. Serverless化: 将部分触发式API (如DDNS更新) 迁移至Serverless函数计算，降低成本。
3. 边缘计算集成: 结合FRP和边缘节点，实现更快速的DNS解析响应。
4. AI运维大脑: 进一步利用LLM能力，实现全链路智能故障自愈。

--------

  # 文档修订历史

  | 版本 | 日期 | 作者 | 描述 |
  |------|------|------|------|
  | 2.0.0 | 2026-01-03 | YYC³ | 完整构建五高五标五化企业级API体系 |
  | 1.5.0 | 2025-11-02 | YYC³ | 增加Docker与K8s部署配置 |
  | 1.0.0 | 2025-01-30 | YYC³ | 初始版本，基础API设计 |

  ---
  **© 2026 YYC³ (YanYuCloudCube) Enterprise API Design**
