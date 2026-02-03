-- YYC3-NAS-ECS Local Staging Database Initialization
-- This script sets up the initial database schema and data

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create initial admin user (will be migrated by Alembic, this is placeholder)
-- The actual schema is managed by Alembic migrations

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE yyc3 TO postgres;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Database initialization completed successfully';
END $$;
