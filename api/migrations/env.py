"""Alembic Environment Configuration"""

import os
import sys
from logging.config import fileConfig

from sqlalchemy import engine_from_config, pool

from alembic import context

# Add the parent directory to sys.path to import our app
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Import Flask app and models
from app import create_app, db

# Import all models to ensure they are registered with SQLAlchemy
from app.models import (
    User, Domain, DNSRecord, APIKey,
    Alert, OperationLog
)

# this is the Alembic Config object
config = context.config

# Interpret the config file for Python logging.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# add your model's MetaData object here for 'autogenerate' support
target_metadata = db.metadata

# Get database URL from environment or config
def get_database_url():
    """Get database URL from environment or config"""
    # Check for environment variable first
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        return database_url

    # Fall back to Flask config
    app = create_app(os.getenv('FLASK_ENV', 'development'))
    with app.app_context():
        return app.config.get('SQLALCHEMY_DATABASE_URI',
                             'postgresql://postgres:postgres@localhost:5432/yyc3')

# Set the database URL in Alembic config
config.set_main_option('sqlalchemy.url', get_database_url())


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    # Create Flask app to get the database configuration
    app = create_app(os.getenv('FLASK_ENV', 'development'))

    with app.app_context():
        connectable = engine_from_config(
            config.get_section(config.config_ini_section, {}),
            prefix="sqlalchemy.",
            poolclass=pool.NullPool,
        )

        with connectable.connect() as connection:
            context.configure(
                connection=connection,
                target_metadata=target_metadata,
                compare_type=True,
                compare_server_default=True,
            )

            with context.begin_transaction():
                context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
