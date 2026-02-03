"""Initial schema creation

Revision ID: 001_initial
Revises:
Create Date: 2026-02-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_initial'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('username', sa.String(80), unique=True, nullable=False),
        sa.Column('email', sa.String(120), unique=True, nullable=False),
        sa.Column('password_hash', sa.String(255), nullable=False),
        sa.Column('role', sa.String(20), nullable=False, server_default='user'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_users_id', 'users', ['id'])
    op.create_index('ix_users_username', 'users', ['username'])
    op.create_index('ix_users_email', 'users', ['email'])

    # Create domains table
    op.create_table(
        'domains',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('registrar', sa.String(100)),
        sa.Column('expiry_date', sa.Date()),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_domains_id', 'domains', ['id'])
    op.create_index('ix_domains_name', 'domains', ['name'])

    # Create dns_records table
    op.create_table(
        'dns_records',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('domain_id', sa.String(36), sa.ForeignKey('domains.id'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('type', sa.String(10), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('ttl', sa.Integer(), nullable=False, server_default='600'),
        sa.Column('priority', sa.Integer(), nullable=False, server_default='10'),
        sa.Column('proxied', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_dns_records_id', 'dns_records', ['id'])

    # Create api_keys table
    op.create_table(
        'api_keys',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('key_id', sa.String(64), unique=True, nullable=False),
        sa.Column('key_hash', sa.String(255), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('scopes', sa.JSON(), nullable=False, server_default='[]'),
        sa.Column('last_used_at', sa.DateTime()),
        sa.Column('expires_at', sa.DateTime()),
        sa.Column('is_revoked', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_api_keys_id', 'api_keys', ['id'])
    op.create_index('ix_api_keys_key_id', 'api_keys', ['key_id'])

    # Create alerts table
    op.create_table(
        'alerts',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('severity', sa.String(20), nullable=False),
        sa.Column('source', sa.String(100)),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('details', sa.JSON()),
        sa.Column('status', sa.String(20), nullable=False, server_default='active'),
        sa.Column('resolved_at', sa.DateTime()),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('resolved_by', sa.String(36), sa.ForeignKey('users.id')),
        sa.Column('resolution_notes', sa.Text()),
    )
    op.create_index('ix_alerts_id', 'alerts', ['id'])
    op.create_index('ix_alerts_created_at', 'alerts', ['created_at'])

    # Create operation_logs table
    op.create_table(
        'operation_logs',
        sa.Column('id', sa.String(36), primary_key=True),
        sa.Column('user_id', sa.String(36), sa.ForeignKey('users.id')),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('resource', sa.String(255)),
        sa.Column('details', sa.JSON()),
        sa.Column('ip_address', sa.String(45)),
        sa.Column('user_agent', sa.String(500)),
        sa.Column('status', sa.String(20), nullable=False, server_default='success'),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
    )
    op.create_index('ix_operation_logs_id', 'operation_logs', ['id'])
    op.create_index('ix_operation_logs_created_at', 'operation_logs', ['created_at'])


def downgrade() -> None:
    # Drop tables in reverse order of creation (to handle foreign key constraints)
    op.drop_index('ix_operation_logs_created_at', table_name='operation_logs')
    op.drop_index('ix_operation_logs_id', table_name='operation_logs')
    op.drop_table('operation_logs')

    op.drop_index('ix_alerts_created_at', table_name='alerts')
    op.drop_index('ix_alerts_id', table_name='alerts')
    op.drop_table('alerts')

    op.drop_index('ix_api_keys_key_id', table_name='api_keys')
    op.drop_index('ix_api_keys_id', table_name='api_keys')
    op.drop_table('api_keys')

    op.drop_index('ix_dns_records_id', table_name='dns_records')
    op.drop_table('dns_records')

    op.drop_index('ix_domains_name', table_name='domains')
    op.drop_index('ix_domains_id', table_name='domains')
    op.drop_table('domains')

    op.drop_index('ix_users_email', table_name='users')
    op.drop_index('ix_users_username', table_name='users')
    op.drop_index('ix_users_id', table_name='users')
    op.drop_table('users')
