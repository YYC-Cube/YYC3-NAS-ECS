from datetime import datetime, timedelta
from flask import request, jsonify
import json
import os


class InMemoryRateLimiter:
    """内存速率限制器（开发环境使用）"""

    def __init__(self):
        self.requests = {}
        self.rules = {
            "global": {"limit": 1000, "window": 60},  # 60秒内1000次
            "per_user": {"limit": 100, "window": 60},  # 60秒内100次
            "per_ip": {"limit": 50, "window": 60},  # 60秒内50次
            "auth": {"limit": 10, "window": 300},  # 5分钟内10次
            "ddns": {"limit": 5, "window": 300}  # 5分钟内5次
        }

    def is_rate_limited(self, key, rule_name="per_user"):
        """检查是否超过速率限制"""
        if rule_name not in self.rules:
            return False

        rule = self.rules[rule_name]
        current_time = datetime.utcnow()
        window_start = current_time - timedelta(seconds=rule["window"])

        # 获取或初始化请求记录
        if key not in self.requests:
            self.requests[key] = []

        # 清理过期记录
        self.requests[key] = [
            req_time for req_time in self.requests[key]
            if req_time > window_start
        ]

        # 检查是否超过限制
        if len(self.requests[key]) >= rule["limit"]:
            return True

        # 添加当前请求
        self.requests[key].append(current_time)
        return False

    def get_headers(self, key, rule_name="per_user"):
        """获取速率限制头部信息"""
        if rule_name not in self.rules:
            return {}

        rule = self.rules[rule_name]
        current_time = datetime.utcnow()
        window_start = current_time - timedelta(seconds=rule["window"])

        if key in self.requests:
            # 获取窗口内的最早请求时间
            valid_requests = [
                req_time for req_time in self.requests[key]
                if req_time > window_start
            ]
            remaining = rule["limit"] - len(valid_requests)

            if valid_requests:
                reset_time = (valid_requests[0] + timedelta(seconds=rule["window"])).timestamp()
            else:
                reset_time = current_time.timestamp() + rule["window"]
        else:
            remaining = rule["limit"]
            reset_time = current_time.timestamp() + rule["window"]

        return {
            "X-RateLimit-Limit": rule["limit"],
            "X-RateLimit-Remaining": max(0, remaining),
            "X-RateLimit-Reset": int(reset_time)
        }


class RedisRateLimiter:
    """Redis 速率限制器（生产环境使用）"""

    def __init__(self, redis_client):
        self.redis_client = redis_client
        self.rules = {
            "global": {"limit": 1000, "window": 60},
            "per_user": {"limit": 100, "window": 60},
            "per_ip": {"limit": 50, "window": 60},
            "auth": {"limit": 10, "window": 300},
            "ddns": {"limit": 5, "window": 300}
        }

    def is_rate_limited(self, key, rule_name="per_user"):
        """检查是否超过速率限制"""
        if rule_name not in self.rules:
            return False

        rule = self.rules[rule_name]
        current_time = datetime.utcnow()
        window_start = current_time - timedelta(seconds=rule["window"])

        try:
            # 使用 Redis sorted set 存储请求时间戳
            pipe = self.redis_client.pipeline()

            # 清理过期记录
            pipe.zremrangebyscore(key, 0, window_start.timestamp())

            # 获取窗口内的请求数量
            pipe.zcard(key)

            # 添加当前请求
            pipe.zadd(key, {str(current_time.timestamp()): current_time.timestamp()})

            # 设置过期时间
            pipe.expire(key, rule["window"] * 2)

            results = pipe.execute()
            request_count = results[1]

            return request_count >= rule["limit"]
        except Exception as e:
            print(f"Redis rate limiter error: {e}")
            # Redis 失败时降级到允许请求
            return False

    def get_headers(self, key, rule_name="per_user"):
        """获取速率限制头部信息"""
        if rule_name not in self.rules:
            return {}

        rule = self.rules[rule_name]
        current_time = datetime.utcnow()
        window_start = current_time - timedelta(seconds=rule["window"])

        try:
            # 获取窗口内的最早请求时间
            earliest = self.redis_client.zrangebyscore(
                key,
                window_start.timestamp(),
                '+inf',
                start=0,
                num=1
            )

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
        except Exception as e:
            print(f"Redis rate limiter error: {e}")
            return {}


# 全局限速器实例（默认使用内存版本）
rate_limiter = InMemoryRateLimiter()


def init_rate_limiter(app):
    """初始化速率限制器"""
    global rate_limiter

    try:
        # 尝试使用 Redis
        redis_url = app.config.get('CACHE_REDIS_URL')
        if redis_url:
            import redis
            redis_client = redis.from_url(redis_url)
            rate_limiter = RedisRateLimiter(redis_client)
            print("Using Redis rate limiter")
        else:
            print("Using in-memory rate limiter")
    except Exception as e:
        print(f"Failed to initialize Redis rate limiter: {e}")
        print("Using in-memory rate limiter")


def rate_limit(rule_name="per_user", key_func=None):
    """速率限制装饰器"""
    def decorator(f):
        def decorated(*args, **kwargs):
            if key_func:
                key = f"ratelimit:{rule_name}:{key_func()}"
            else:
                # 默认使用IP地址
                key = f"ratelimit:{rule_name}:{request.remote_addr}"

            if rate_limiter.is_rate_limited(key, rule_name):
                headers = rate_limiter.get_headers(key, rule_name)
                return jsonify({
                    "success": False,
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
