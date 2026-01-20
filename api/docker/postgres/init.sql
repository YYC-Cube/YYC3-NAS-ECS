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
