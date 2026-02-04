"""
@file 配置文件 - 带详细注释版本
@description YYC³ NAS-ECS 系统配置文件，包含所有环境变量和配置项的详细说明
@module config
@author YYC³
@version 1.1.0
@created 2025-01-30
@updated 2026-02-04
@copyright Copyright (c) 2025 YYC³
@license MIT

本文件包含系统的所有配置项，包括基础设置、数据库、Redis、Celery、
服务器配置、阿里云配置等。每个配置项都有详细的注释说明。
"""

import os
from datetime import timedelta

class Config:
    """
    基础配置类
    
    包含所有环境通用的配置项，其他环境配置类继承此类。
    所有敏感配置项都通过环境变量获取，避免硬编码。
    """

    # ======================
    # 基础设置
    # ======================
    
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-please-change'
    """
    Flask 应用密钥
    
    用途:
    - 用于加密会话 cookie
    - 用于生成 CSRF 令牌
    - 用于签名各种安全相关数据
    
    获取途径:
    - 环境变量: SECRET_KEY
    - 默认值: 'dev-secret-key-please-change' (仅用于开发环境)
    
    安全注意事项:
    - 生产环境必须设置强随机密钥
    - 密钥长度至少 32 字符
    - 建议使用: python -c 'import secrets; print(secrets.token_hex(32))' 生成
    
    推荐配置:
    - 开发环境: 使用默认值或简单的密钥
    - 生产环境: 使用强随机密钥，至少 64 位十六进制字符串
    """

    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-me'
    """
    JWT 令牌签名密钥
    
    用途:
    - 用于签名 JWT 访问令牌
    - 用于签名 JWT 刷新令牌
    - 验证令牌的真实性
    
    获取途径:
    - 环境变量: JWT_SECRET_KEY
    - 默认值: 'jwt-secret-key-change-me' (仅用于开发环境)
    
    安全注意事项:
    - 生产环境必须设置强随机密钥
    - 与 SECRET_KEY 保持不同
    - 密钥泄露会导致令牌伪造攻击
    
    推荐配置:
    - 开发环境: 使用默认值
    - 生产环境: 使用强随机密钥，至少 64 位十六进制字符串
    """

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    """
    JWT 访问令牌过期时间
    
    用途:
    - 控制访问令牌的有效期
    - 平衡安全性和用户体验
    
    获取途径:
    - 固定值: 1 小时
    
    配置建议:
    - 开发环境: 可以设置为 2-4 小时，减少重新登录频率
    - 生产环境: 建议 1 小时，提高安全性
    - 高安全需求: 可以设置为 30 分钟
    
    安全影响:
    - 时间越短，安全性越高，但用户体验越差
    - 时间越长，用户体验越好，但令牌泄露风险越大
    """

    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=7)
    """
    JWT 刷新令牌过期时间
    
    用途:
    - 控制刷新令牌的有效期
    - 允许用户在访问令牌过期后无需重新登录
    
    获取途径:
    - 固定值: 7 天
    
    配置建议:
    - 开发环境: 可以设置为 30 天
    - 生产环境: 建议 7-14 天
    - 高安全需求: 可以设置为 3-7 天
    
    安全影响:
    - 时间越短，安全性越高，但用户需要更频繁登录
    - 时间越长，用户体验越好，但令牌泄露风险越大
    """

    # ======================
    # 数据库配置 (针对 32GB RAM 优化)
    # ======================
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    """
    SQLAlchemy 修改跟踪
    
    用途:
    - 控制是否跟踪对象的修改
    - 开启会消耗额外内存
    
    获取途径:
    - 固定值: False
    
    配置说明:
    - False: 不跟踪修改，性能更好，推荐
    - True: 跟踪修改，用于 Flask-SQLAlchemy 事件系统
    
    推荐配置:
    - 所有环境: False (除非需要使用 SQLAlchemy 事件系统)
    """

    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///dev.db'
    """
    数据库连接 URI
    
    用途:
    - 指定数据库连接地址
    - 支持多种数据库类型
    
    获取途径:
    - 环境变量: DATABASE_URL
    - 默认值: 'sqlite:///dev.db' (开发环境 SQLite)
    
    支持的数据库格式:
    - SQLite: 'sqlite:///path/to/database.db'
    - PostgreSQL: 'postgresql://user:password@localhost:5432/dbname'
    - MySQL: 'mysql://user:password@localhost:3306/dbname'
    
    推荐配置:
    - 开发环境: SQLite 或 PostgreSQL
    - 测试环境: SQLite 内存数据库 'sqlite:///:memory:'
    - 生产环境: PostgreSQL 或 MySQL
    
    示例:
    - PostgreSQL: 'postgresql://nas_user:password123@localhost:5432/nas_db'
    - MySQL: 'mysql+pymysql://nas_user:password123@localhost:3306/nas_db?charset=utf8mb4'
    """

    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        """
        数据库连接池大小
        
        用途:
        - 控制保持打开的数据库连接数
        - 减少连接建立和关闭的开销
        
        获取途径:
        - 固定值: 10
        
        配置建议:
        - 32GB RAM: 10-20
        - 16GB RAM: 5-10
        - 8GB RAM: 3-5
        - 计算公式: 核心数 * 2 + 2
        
        性能影响:
        - 过小: 连接等待时间长，性能下降
        - 过大: 占用过多内存，可能导致数据库拒绝连接
        """

        'max_overflow': 20,
        """
        数据库连接池最大溢出数
        
        用途:
        - 允许在 pool_size 之外创建额外连接
        - 处理突发流量
        
        获取途径:
        - 固定值: 20
        
        配置建议:
        - 通常设置为 pool_size 的 2 倍
        - 高并发场景可以设置得更大
        
        性能影响:
        - 过小: 突发流量时性能下降
        - 过大: 可能导致数据库连接数超限
        """

        'pool_timeout': 30,
        """
        获取数据库连接超时时间（秒）
        
        用途:
        - 控制等待可用连接的最长时间
        - 防止请求无限期等待
        
        获取途径:
        - 固定值: 30 秒
        
        配置建议:
        - 开发环境: 30-60 秒
        - 生产环境: 10-30 秒
        
        性能影响:
        - 过小: 可能导致正常请求超时
        - 过大: 可能导致请求堆积
        """

        'pool_recycle': 3600,
        """
        数据库连接回收时间（秒）
        
        用途:
        - 定期回收连接，防止连接长时间占用
        - 防止数据库服务端断开连接
        
        获取途径:
        - 固定值: 3600 秒 (1 小时)
        
        配置建议:
        - MySQL: 3600 秒 (默认 wait_timeout)
        - PostgreSQL: 可以设置为更长
        
        安全影响:
        - 防止"MySQL has gone away"错误
        - 防止连接泄漏
        """
    }

    # ======================
    # Redis 配置
    # ======================
    
    CACHE_TYPE = 'RedisCache'
    """
    缓存类型
    
    用途:
    - 指定使用的缓存后端
    - 支持 Redis、Memcached、文件缓存等
    
    获取途径:
    - 固定值: 'RedisCache'
    
    支持的缓存类型:
    - 'RedisCache': Redis 缓存
    - 'MemcachedCache': Memcached 缓存
    - 'FileSystemCache': 文件系统缓存
    - 'SimpleCache': 简单内存缓存（仅开发环境）
    
    推荐配置:
    - 开发环境: 'SimpleCache' 或 'RedisCache'
    - 生产环境: 'RedisCache' 或 'MemcachedCache'
    """

    CACHE_REDIS_URL = os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'
    """
    Redis 缓存连接 URL
    
    用途:
    - 指定 Redis 缓存服务器地址
    - 支持密码认证和数据库选择
    
    获取途径:
    - 环境变量: REDIS_URL
    - 默认值: 'redis://localhost:6379/0'
    
    URL 格式:
    - 无密码: 'redis://host:port/db'
    - 有密码: 'redis://:password@host:port/db'
    - SSL: 'rediss://host:port/db'
    
    推荐配置:
    - 开发环境: 'redis://localhost:6379/0'
    - 生产环境: 'redis://:password@redis-server:6379/0'
    
    示例:
    - 本地: 'redis://localhost:6379/0'
    - 远程: 'redis://:mypassword@192.168.1.100:6379/0'
    - SSL: 'rediss://:mypassword@redis.example.com:6379/0'
    """

    CACHE_DEFAULT_TIMEOUT = 300
    """
    缓存默认过期时间（秒）
    
    用途:
    - 控制缓存数据的默认有效期
    - 可以在具体缓存操作中覆盖
    
    获取途径:
    - 固定值: 300 秒 (5 分钟)
    
    配置建议:
    - 静态数据: 3600-7200 秒 (1-2 小时)
    - 动态数据: 60-300 秒 (1-5 分钟)
    - 实时数据: 10-60 秒
    
    性能影响:
    - 过短: 缓存命中率低，数据库压力大
    - 过长: 数据可能过时，用户体验差
    """

    # ======================
    # Celery 配置
    # ======================
    
    CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL') or 'redis://localhost:6379/1'
    """
    Celery 消息代理 URL
    
    用途:
    - 指定 Celery 任务队列的存储位置
    - 使用 Redis 作为消息代理
    
    获取途径:
    - 环境变量: CELERY_BROKER_URL
    - 默认值: 'redis://localhost:6379/1'
    
    URL 格式:
    - 与 CACHE_REDIS_URL 相同
    
    推荐配置:
    - 开发环境: 'redis://localhost:6379/1'
    - 生产环境: 'redis://:password@redis-server:6379/1'
    
    注意事项:
    - 建议与缓存使用不同的 Redis 数据库
    - 数据库 0 用于缓存，数据库 1 用于消息队列
    """

    CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND') or 'redis://localhost:6379/2'
    """
    Celery 结果存储 URL
    
    用途:
    - 存储异步任务的执行结果
    - 支持任务状态查询和结果获取
    
    获取途径:
    - 环境变量: CELERY_RESULT_BACKEND
    - 默认值: 'redis://localhost:6379/2'
    
    URL 格式:
    - 与 CACHE_REDIS_URL 相同
    
    推荐配置:
    - 开发环境: 'redis://localhost:6379/2'
    - 生产环境: 'redis://:password@redis-server:6379/2'
    
    注意事项:
    - 建议使用独立的 Redis 数据库
    - 数据库 0: 缓存，数据库 1: 消息队列，数据库 2: 结果存储
    """

    CELERY_TASK_TRACK_STARTED = True
    """
    Celery 任务启动跟踪
    
    用途:
    - 是否跟踪任务的启动状态
    - 影响任务状态报告的详细程度
    
    获取途径:
    - 固定值: True
    
    配置说明:
    - True: 跟踪任务启动，状态包括 PENDING、STARTED、SUCCESS、FAILURE
    - False: 不跟踪启动，状态只有 PENDING、SUCCESS、FAILURE
    
    推荐配置:
    - 所有环境: True (提供更好的任务监控)
    """

    CELERY_TASK_TIME_LIMIT = 30 * 60
    """
    Celery 任务超时时间（秒）
    
    用途:
    - 限制任务的最大执行时间
    - 防止任务无限期运行
    
    获取途径:
    - 固定值: 1800 秒 (30 分钟)
    
    配置建议:
    - 快速任务: 60-300 秒 (1-5 分钟)
    - 中等任务: 300-1800 秒 (5-30 分钟)
    - 长时间任务: 1800-7200 秒 (30-120 分钟)
    
    性能影响:
    - 过短: 正常任务可能被强制终止
    - 过长: 异常任务可能长时间占用资源
    
    安全影响:
    - 防止任务死循环
    - 防止资源泄漏
    """

    # ======================
    # 其他设置
    # ======================
    
    LOG_LEVEL = os.environ.get('LOG_LEVEL', 'INFO')
    """
    日志级别
    
    用途:
    - 控制日志输出的详细程度
    - 影响日志文件大小和性能
    
    获取途径:
    - 环境变量: LOG_LEVEL
    - 默认值: 'INFO'
    
    支持的级别:
    - 'DEBUG': 最详细，包含所有调试信息
    - 'INFO': 一般信息，记录重要事件
    - 'WARNING': 警告信息，记录潜在问题
    - 'ERROR': 错误信息，记录错误事件
    - 'CRITICAL': 严重错误，记录系统崩溃
    
    推荐配置:
    - 开发环境: 'DEBUG' 或 'INFO'
    - 测试环境: 'WARNING' 或 'ERROR'
    - 生产环境: 'INFO' 或 'WARNING'
    
    性能影响:
    - DEBUG: 日志量大，性能影响最大
    - INFO: 日志量适中，性能影响小
    - WARNING/ERROR: 日志量小，性能影响最小
    """

    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*')
    """
    CORS 允许的源
    
    用途:
    - 控制哪些域名可以访问 API
    - 防止跨域攻击
    
    获取途径:
    - 环境变量: CORS_ORIGINS
    - 默认值: '*' (允许所有源)
    
    配置格式:
    - 单个域名: 'https://example.com'
    - 多个域名: 'https://example.com,https://app.example.com'
    - 允许所有: '*'
    
    推荐配置:
    - 开发环境: '*' 或 'http://localhost:3000,http://localhost:5173'
    - 生产环境: 明确指定允许的域名，如 'https://0379.email,https://app.0379.email'
    
    安全注意事项:
    - 生产环境不要使用 '*'，存在安全风险
    - 只允许受信任的域名访问
    """

    ENVIRONMENT = os.environ.get('ENVIRONMENT', 'development')
    """
    运行环境
    
    用途:
    - 标识当前运行的环境
    - 影响配置选择和行为
    
    获取途径:
    - 环境变量: ENVIRONMENT
    - 默认值: 'development'
    
    支持的环境:
    - 'development': 开发环境
    - 'production': 生产环境
    - 'testing': 测试环境
    - 'staging': 预发布环境
    
    推荐配置:
    - 本地开发: 'development'
    - 测试: 'testing'
    - 预发布: 'staging'
    - 生产: 'production'
    
    使用方式:
    - config = config[os.environ.get('ENVIRONMENT', 'development')]
    """

    # ======================
    # 服务器配置
    # ======================
    
    NAS_SERVER_IP = os.environ.get('NAS_SERVER_IP', '8.152.195.33')
    """
    NAS 服务器 IP 地址
    
    用途:
    - 指定 NAS 服务器的公网 IP
    - 用于 DDNS 更新和内网穿透配置
    
    获取途径:
    - 环境变量: NAS_SERVER_IP
    - 默认值: '8.152.195.33'
    
    推荐配置:
    - 开发环境: 本地 IP 或测试服务器 IP
    - 生产环境: 实际的 NAS 服务器公网 IP
    
    示例:
    - 阿里云 ECS: '8.152.195.33'
    - 本地测试: '192.168.1.100'
    - 腾讯云: '1.2.3.4'
    
    注意事项:
    - 必须是公网 IP（用于 DDNS）
    - 可以通过 curl ifconfig.me 获取当前公网 IP
    """

    NAS_DOMAIN = os.environ.get('NAS_DOMAIN', 'ddns.0379.email')
    """
    NAS 服务器域名
    
    用途:
    - 指定 NAS 服务器的访问域名
    - 用于 DDNS 配置和内网穿透
    
    获取途径:
    - 环境变量: NAS_DOMAIN
    - 默认值: 'ddns.0379.email'
    
    推荐配置:
    - 开发环境: 测试域名或本地域名
    - 生产环境: 实际的 NAS 服务域名
    
    示例:
    - 主域名: 'nas.0379.email'
    - DDNS 域名: 'ddns.0379.email'
    - 子域名: 'home.example.com'
    
    注意事项:
    - 域名需要提前注册和配置 DNS
    - 需要配置 SSL 证书（生产环境）
    """

    # ======================
    # 阿里云配置
    # ======================
    
    ALIYUN_ACCESS_KEY_ID = os.environ.get('ALIYUN_ACCESS_KEY_ID', '')
    """
    阿里云访问密钥 ID
    
    用途:
    - 阿里云 API 认证
    - 用于 DDNS 域名解析更新
    
    获取途径:
    - 环境变量: ALIYUN_ACCESS_KEY_ID
    - 默认值: '' (空字符串)
    
    获取步骤:
    1. 登录阿里云控制台: https://ram.console.aliyun.com/manage/ak
    2. 创建 AccessKey 或使用现有的
    3. 复制 AccessKey ID
    4. 设置为环境变量
    
    安全注意事项:
    - 不要将 AccessKey 硬编码到代码中
    - 定期轮换 AccessKey
    - 使用 RAM 子账号，只授予必要权限
    - 启用 MFA 保护
    
    推荐配置:
    - 开发环境: 可以使用测试账号的 AccessKey
    - 生产环境: 使用专用 RAM 子账号，只授予 DNS 修改权限
    
    权限要求:
    - AliyunDNSFullAccess: 完整 DNS 权限
    - 或自定义权限: alidns:AddDomainRecord, alidns:UpdateDomainRecord, alidns:DescribeDomainRecords
    """

    ALIYUN_ACCESS_KEY_SECRET = os.environ.get('ALIYUN_ACCESS_KEY_SECRET', '')
    """
    阿里云访问密钥 Secret
    
    用途:
    - 阿里云 API 认证
    - 与 AccessKey ID 配合使用
    
    获取途径:
    - 环境变量: ALIYUN_ACCESS_KEY_SECRET
    - 默认值: '' (空字符串)
    
    获取步骤:
    1. 与 AccessKey ID 在同一页面获取
    2. 只在创建时显示一次，需要立即保存
    3. 设置为环境变量
    
    安全注意事项:
    - 与 AccessKey ID 同等重要
    - 不要泄露或提交到代码仓库
    - 定期轮换
    - 使用环境变量或密钥管理服务
    
    推荐配置:
    - 开发环境: 可以使用测试账号的 Secret
    - 生产环境: 使用专用 RAM 子账号的 Secret
    
    泄露后果:
    - 攻击者可以完全控制阿里云 DNS
    - 可以劫持域名，导致严重安全事件
    """

    ALIYUN_DOMAIN = os.environ.get('ALIYUN_DOMAIN', '0379.email')
    """
    阿里云域名
    
    用途:
    - 指定要更新的主域名
    - DDNS 更新的目标域名
    
    获取途径:
    - 环境变量: ALIYUN_DOMAIN
    - 默认值: '0379.email'
    
    推荐配置:
    - 开发环境: 测试域名
    - 生产环境: 实际的主域名
    
    示例:
    - 主域名: 'example.com'
    - 子域名: 'nas.example.com'
    - 当前配置: '0379.email'
    
    注意事项:
    - 域名必须在阿里云注册
    - 需要在阿里云 DNS 控制台添加解析记录
    """

    ALIYUN_SUB_DOMAIN = os.environ.get('ALIYUN_SUB_DOMAIN', 'ddns')
    """
    阿里云子域名
    
    用途:
    - 指定要更新的子域名
    - DDNS 更新的具体记录
    
    获取途径:
    - 环境变量: ALIYUN_SUB_DOMAIN
    - 默认值: 'ddns'
    
    推荐配置:
    - 开发环境: 'dev' 或 'test'
    - 生产环境: 'www', 'nas', 'ddns' 等
    
    示例:
    - 主服务: 'www'
    - NAS 服务: 'nas'
    - DDNS 服务: 'ddns'
    
    完整域名:
    - ALIYUN_SUB_DOMAIN + '.' + ALIYUN_DOMAIN
    - 例如: 'ddns.0379.email'
    """

    ALIYUN_TTL = int(os.environ.get('ALIYUN_TTL', '600'))
    """
    阿里云 DNS TTL（生存时间）
    
    用途:
    - 控制 DNS 记录的缓存时间
    - 影响 DNS 解析的更新速度
    
    获取途径:
    - 环境变量: ALIYUN_TTL
    - 默认值: 600 秒 (10 分钟)
    
    配置建议:
    - DDNS 场景: 60-600 秒 (1-10 分钟)
    - 稳定 IP: 3600-86400 秒 (1-24 小时)
    - 阿里云最小值: 600 秒
    
    性能影响:
    - TTL 越短，IP 变化后生效越快
    - TTL 越短，DNS 查询频率越高，成本越高
    - TTL 越长，DNS 解析越快，但更新延迟越大
    
    推荐配置:
    - DDNS: 600 秒 (10 分钟)
    - 固定 IP: 3600 秒 (1 小时) 或更长
    """


class DevelopmentConfig(Config):
    """
    开发环境配置
    
    继承基础配置，添加开发环境特定的设置。
    适用于本地开发和功能测试。
    """
    
    DEBUG = True
    """
    Flask 调试模式
    
    用途:
    - 启用详细的错误信息
    - 自动重载代码修改
    - 启用调试工具栏
    
    配置说明:
    - True: 启用调试模式，显示详细错误栈
    - False: 禁用调试模式，显示通用错误页面
    
    开发环境优势:
    - 代码修改后自动重载
    - 详细的错误信息和堆栈跟踪
    - Flask 调试工具栏
    - 更好的错误诊断
    
    安全注意事项:
    - 生产环境必须设置为 False
    - 调试模式会暴露敏感信息
    - 可能导致代码执行漏洞
    """

    TESTING = False
    """
    测试模式标志
    
    用途:
    - 标识是否为测试环境
    - 影响某些测试相关行为
    
    配置说明:
    - True: 启用测试模式
    - False: 禁用测试模式
    
    开发环境设置:
    - 通常设置为 False
    - 只有在运行测试时设置为 True
    """

    SQLALCHEMY_DATABASE_URI = 'sqlite:///dev.db'
    """
    开发环境数据库 URI
    
    用途:
    - 使用 SQLite 作为开发数据库
    - 文件存储在项目根目录
    
    优势:
    - 无需额外数据库服务
    - 零配置，开箱即用
    - 适合小型项目
    
    劣势:
    - 并发性能差
    - 不适合生产环境
    - 功能有限
    
    文件位置:
    - 相对于项目根目录: dev.db
    - 完整路径: /path/to/YYC3-NAS-ECS/api/dev.db
    """


class ProductionConfig(Config):
    """
    生产环境配置
    
    继承基础配置，添加生产环境特定的安全设置。
    适用于正式部署环境，强调安全性和稳定性。
    """
    
    DEBUG = False
    """
    Flask 调试模式
    
    用途:
    - 禁用调试模式，提高安全性
    
    生产环境要求:
    - 必须设置为 False
    - 避免暴露敏感信息
    - 避免性能开销
    
    安全影响:
    - 调试模式会暴露:
      - 源代码
      - 环境变量
      - 配置信息
      - 数据库查询
    """

    TESTING = False
    """
    测试模式标志
    
    用途:
    - 标识为生产环境
    - 禁用测试相关功能
    
    配置说明:
    - 生产环境始终设置为 False
    """

    # 生产环境强制 HTTPS
    SESSION_COOKIE_SECURE = True
    """
    会话 Cookie 安全标志
    
    用途:
    - 强制 Cookie 只通过 HTTPS 传输
    - 防止中间人攻击
    
    配置说明:
    - True: Cookie 只通过 HTTPS 传输
    - False: Cookie 可以通过 HTTP 传输
    
    安全影响:
    - True: 防止 Cookie 被窃取
    - False: HTTP 传输的 Cookie 可能被拦截
    
    生产环境要求:
    - 必须设置为 True
    - 必须配置 HTTPS 证书
    """

    JWT_COOKIE_SECURE = True
    """
    JWT Cookie 安全标志
    
    用途:
    - 强制 JWT Cookie 只通过 HTTPS 传输
    - 防止令牌被窃取
    
    配置说明:
    - True: JWT Cookie 只通过 HTTPS 传输
    - False: JWT Cookie 可以通过 HTTP 传输
    
    安全影响:
    - True: 防止 JWT 令牌被窃取
    - False: HTTP 传输的令牌可能被拦截
    
    生产环境要求:
    - 必须设置为 True
    - 必须配置 HTTPS 证书
    """

    SESSION_COOKIE_HTTPONLY = True
    """
    会话 Cookie HttpOnly 标志
    
    用途:
    - 防止 JavaScript 访问 Cookie
    - 防止 XSS 攻击窃取 Cookie
    
    配置说明:
    - True: Cookie 不能通过 JavaScript 访问
    - False: Cookie 可以通过 JavaScript 访问
    
    安全影响:
    - True: 防止 XSS 攻击窃取会话
    - False: 恶意脚本可以读取 Cookie
    
    生产环境要求:
    - 必须设置为 True
    - 有效防御 XSS 攻击
    """

    JWT_COOKIE_HTTPONLY = True
    """
    JWT Cookie HttpOnly 标志
    
    用途:
    - 防止 JavaScript 访问 JWT Cookie
    - 防止 XSS 攻击窃取令牌
    
    配置说明:
    - True: JWT Cookie 不能通过 JavaScript 访问
    - False: JWT Cookie 可以通过 JavaScript 访问
    
    安全影响:
    - True: 防止 XSS 攻击窃取 JWT
    - False: 恶意脚本可以读取 JWT
    
    生产环境要求:
    - 必须设置为 True
    - 有效防御 XSS 攻击
    """

    # Sentry 错误追踪
    SENTRY_DSN = os.environ.get('SENTRY_DSN')
    """
    Sentry 数据源名称
    
    用途:
    - Sentry 错误监控服务的连接字符串
    - 自动收集和报告应用错误
    
    获取途径:
    - 环境变量: SENTRY_DSN
    - 默认值: None (不启用)
    
    获取步骤:
    1. 注册 Sentry 账号: https://sentry.io
    2. 创建新项目
    3. 复制 DSN (Data Source Name)
    4. 设置为环境变量
    
    DSN 格式:
    - https://<key>@<host>/<project>/<client>
    - 示例: 'https://abc123@sentry.io/123456'
    
    推荐配置:
    - 开发环境: 不设置或使用测试 DSN
    - 生产环境: 必须设置，监控生产错误
    
    功能:
    - 自动捕获异常
    - 收集堆栈跟踪
    - 记录用户上下文
    - 发送错误通知
    """

    SENTRY_TRACES_SAMPLE_RATE = 0.2
    """
    Sentry 性能追踪采样率
    
    用途:
    - 控制性能追踪的采样比例
    - 平衡监控成本和数据完整性
    
    获取途径:
    - 固定值: 0.2 (20%)
    
    配置说明:
    - 0.0: 禁用性能追踪
    - 0.1: 10% 的请求进行追踪
    - 0.2: 20% 的请求进行追踪
    - 1.0: 100% 的请求进行追踪
    
    推荐配置:
    - 开发环境: 1.0 (完整追踪)
    - 生产环境: 0.1-0.3 (10-30% 采样)
    
    成本影响:
    - 采样率越高，Sentry 成本越高
    - 20% 采样通常足够发现性能问题
    
    数据完整性:
    - 采样率越低，性能数据越不完整
    - 20% 采样可以代表整体性能趋势
    """


class TestingConfig(Config):
    """
    测试环境配置
    
    继承基础配置，添加测试环境特定的设置。
    适用于单元测试和集成测试。
    """
    
    DEBUG = True
    """
    Flask 调试模式
    
    用途:
    - 启用调试信息，帮助诊断测试失败
    
    测试环境优势:
    - 详细的错误信息
    - 更容易定位测试问题
    """

    TESTING = True
    """
    测试模式标志
    
    用途:
    - 标识为测试环境
    - 启用测试相关功能
    
    测试环境要求:
    - 必须设置为 True
    - 某些功能依赖此标志
    """

    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    """
    测试环境数据库 URI
    
    用途:
    - 使用内存数据库进行测试
    - 每次测试运行都是独立的
    
    优势:
    - 极快的速度
    - 完全隔离，无副作用
    - 自动清理，无需手动重置
    
    劣势:
    - 数据不持久化
    - 不能用于调试测试数据
    
    适用场景:
    - 单元测试
    - 集成测试
    - CI/CD 流水线
    """

    WTF_CSRF_ENABLED = False
    """
    CSRF 保护开关
    
    用途:
    - 禁用 CSRF 保护，简化测试
    
    配置说明:
    - True: 启用 CSRF 保护
    - False: 禁用 CSRF 保护
    
    测试环境设置:
    - 通常设置为 False
    - 避免手动处理 CSRF 令牌
    
    安全注意事项:
    - 生产环境必须启用 CSRF 保护
    - 只有测试环境可以禁用
    """


class StagingConfig(Config):
    """
    预发布环境配置
    
    继承基础配置，添加预发布环境特定的设置。
    介于开发和生产之间的环境，用于最终测试。
    """
    
    DEBUG = False
    """
    Flask 调试模式
    
    用途:
    - 禁用调试模式，模拟生产环境
    
    预发布环境要求:
    - 通常设置为 False
    - 尽可能接近生产环境配置
    """

    TESTING = False
    """
    测试模式标志
    
    用途:
    - 标识为预发布环境
    - 禁用测试相关功能
    
    预发布环境设置:
    - 通常设置为 False
    - 模拟真实生产环境
    """

    SQLALCHEMY_DATABASE_URI = os.environ.get('STAGING_DATABASE_URL') or 'postgresql://user:pass@localhost/nas_ddns_staging'
    """
    预发布环境数据库 URI
    
    用途:
    - 使用独立的预发布数据库
    - 避免影响生产数据
    
    获取途径:
    - 环境变量: STAGING_DATABASE_URL
    - 默认值: 'postgresql://user:pass@localhost/nas_ddns_staging'
    
    推荐配置:
    - 使用与生产环境相同的数据库类型
    - 使用独立的数据库实例或 schema
    - 示例: 'postgresql://staging_user:password@staging-db:5432/nas_staging'
    
    优势:
    - 真实环境测试
    - 不影响生产数据
    - 可以进行最终验证
    
    注意事项:
    - 定期清理测试数据
    - 避免与生产环境混淆
    """


# 配置映射字典
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'staging': StagingConfig,
    'default': DevelopmentConfig
}

"""
配置选择说明

使用方式:
    from config import config
    app.config.from_object(config[os.environ.get('ENVIRONMENT', 'development')])

环境变量:
    ENVIRONMENT: 指定运行环境
    - 'development': 使用 DevelopmentConfig
    - 'production': 使用 ProductionConfig
    - 'testing': 使用 TestingConfig
    - 'staging': 使用 StagingConfig
    - 未设置: 使用 DevelopmentConfig (默认)

推荐部署方式:
    1. 开发环境: export ENVIRONMENT=development
    2. 测试环境: export ENVIRONMENT=testing
    3. 预发布环境: export ENVIRONMENT=staging
    4. 生产环境: export ENVIRONMENT=production

Docker Compose 示例:
    environment:
      - ENVIRONMENT=production
      - SECRET_KEY=${SECRET_KEY}
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - ALIYUN_ACCESS_KEY_ID=${ALIYUN_ACCESS_KEY_ID}
      - ALIYUN_ACCESS_KEY_SECRET=${ALIYUN_ACCESS_KEY_SECRET}
"""
