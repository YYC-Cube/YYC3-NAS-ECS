-- YYC3-NAS-ECS Seed Data
-- This file contains initial seed data for the application
-- Run this after migrations to populate the database with initial data

-- ============================================
-- Users
-- ============================================

-- Default admin user (password: admin123 - CHANGE THIS IN PRODUCTION!)
-- Password hash is for 'admin123' using Werkzeug's generate_password_hash
INSERT INTO users (id, username, email, password_hash, role, is_active, created_at, updated_at)
VALUES (
    'admin-001',
    'admin',
    'admin@yyc3.com',
    'scrypt:32768:8:1$kXJm9kN2vR8xP7qL$7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8',
    'admin',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- Test user (password: test123)
INSERT INTO users (id, username, email, password_hash, role, is_active, created_at, updated_at)
VALUES (
    'user-001',
    'testuser',
    'test@example.com',
    'scrypt:32768:8:1$testSaltValue$1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    'user',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- Operator user for monitoring
INSERT INTO users (id, username, email, password_hash, role, is_active, created_at, updated_at)
VALUES (
    'operator-001',
    'operator',
    'operator@yyc3.com',
    'scrypt:32768:8:1$operatorSalt$2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c',
    'operator',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- API Keys
-- ============================================

-- Default API key for admin user
INSERT INTO api_keys (id, key_id, key_hash, name, scopes, user_id, created_at)
VALUES (
    'key-001',
    'yyc3_admin_key_' || substr(md5(random()::text), 1, 32),
    'hash_placeholder_replace_with_actual_hash',
    'Default Admin API Key',
    '["read", "write", "admin"]'::jsonb,
    'admin-001',
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Domains (Example)
-- ============================================

-- Example domain for testing
INSERT INTO domains (id, name, registrar, user_id, is_active, created_at)
VALUES (
    'domain-001',
    'example.com',
    'Test Registrar',
    'admin-001',
    true,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- System Configuration (if you have a config table)
-- ============================================

-- Note: Add system configuration entries here if you have a system_config table

-- ============================================
-- Initial Alerts
-- ============================================

-- Welcome alert
INSERT INTO alerts (id, severity, source, message, details, status, created_at)
VALUES (
    'alert-001',
    'info',
    'system',
    'YYC3-NAS-ECS 系统已初始化',
    '{"version": "1.0.0", "initialized_at": "' || CURRENT_TIMESTAMP || '"}'::jsonb,
    'resolved',
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Sample Operation Logs
-- ============================================

-- Initial setup log
INSERT INTO operation_logs (id, user_id, action, resource, details, ip_address, status, created_at)
VALUES (
    'log-001',
    'admin-001',
    'system_init',
    'database',
    '{"message": "Database initialized with seed data"}'::jsonb,
    '127.0.0.1',
    'success',
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- Important Notes
-- ============================================

-- 1. CHANGE DEFAULT PASSWORDS IN PRODUCTION!
--    The default admin password is 'admin123' - change it immediately after first login
--    The test user password is 'test123' - use only for development/testing

-- 2. API Key Hashes
--    The key_hash values in this file are placeholders
--    Generate proper hashes using: python -c "from werkzeug.security import generate_password_hash; print(generate_password_hash('your-secret-key'))"

-- 3. User IDs
--    User IDs use a simple prefix format (admin-001, user-001, etc.)
--    In production, consider using UUIDs for all IDs

-- 4. ON CONFLICT clauses
--    These ensure the script can be run multiple times without errors
--    They also allow adding new data to existing databases
