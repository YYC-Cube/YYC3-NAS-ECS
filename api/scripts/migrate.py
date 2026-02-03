#!/usr/bin/env python3
"""
YYC3-NAS-ECS Database Migration Management Script

This script provides a simple interface to manage database migrations
using Alembic without requiring the Flask CLI.

Usage:
    python scripts/migrate.py status      # Show migration status
    python scripts/migrate.py upgrade     # Run all pending migrations
    python scripts/migrate.py downgrade   # Revert last migration
    python scripts/migrate.py current     # Show current version
    python scripts/migrate.py history     # Show migration history
    python scripts/migrate.py seed        # Load seed data
"""

import os
import sys
import subprocess
from pathlib import Path

# Add the parent directory to Python path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Set Flask environment
os.environ.setdefault('FLASK_APP', 'app.py')
os.environ.setdefault('FLASK_ENV', os.getenv('FLASK_ENV', 'development'))


def get_database_url():
    """Get database URL from environment or config"""
    database_url = os.getenv('DATABASE_URL')
    if database_url:
        return database_url

    # Build from individual components
    db_user = os.getenv('POSTGRES_USER', 'postgres')
    db_pass = os.getenv('POSTGRES_PASSWORD', 'postgres')
    db_host = os.getenv('POSTGRES_HOST', 'localhost')
    db_port = os.getenv('POSTGRES_PORT', '5432')
    db_name = os.getenv('POSTGRES_DB', 'yyc3')

    return f'postgresql://{db_user}:{db_pass}@{db_host}:{db_port}/{db_name}'


def run_alembic_command(command: list[str]) -> int:
    """Run an Alembic command"""
    # Set DATABASE_URL for Alembic
    env = os.environ.copy()
    env['DATABASE_URL'] = get_database_url()
    env['SQLALCHEMY_DATABASE_URI'] = get_database_url()

    try:
        result = subprocess.run(
            ['alembic'] + command,
            cwd=Path(__file__).parent.parent,
            env=env,
            capture_output=True,
            text=True
        )

        if result.stdout:
            print(result.stdout)
        if result.stderr:
            print(result.stderr, file=sys.stderr)

        return result.returncode
    except FileNotFoundError:
        print("Error: Alembic is not installed or not in PATH")
        print("Install it with: pip install alembic")
        return 1


def cmd_status(args):
    """Show migration status"""
    print("📊 Migration Status")
    print("=" * 50)
    return run_alembic_command(['current'])


def cmd_upgrade(args):
    """Run all pending migrations"""
    print("⬆️  Running migrations...")
    print("=" * 50)
    return run_alembic_command(['upgrade', 'head'])


def cmd_downgrade(args):
    """Revert last migration"""
    print("⬇️  Reverting last migration...")
    print("=" * 50)
    revision = args[0] if args else '-1'
    return run_alembic_command(['downgrade', revision])


def cmd_current(args):
    """Show current version"""
    return cmd_status(args)


def cmd_history(args):
    """Show migration history"""
    print("📜 Migration History")
    print("=" * 50)
    return run_alembic_command(['history'])


def cmd_revision(args):
    """Create a new migration"""
    message = args[0] if args else 'Auto migration'
    print(f"📝 Creating new migration: {message}")
    print("=" * 50)
    return run_alembic_command(['revision', '--autogenerate', '-m', message])


def cmd_seed(args):
    """Load seed data"""
    import psycopg2
    from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

    print("🌱 Loading seed data...")
    print("=" * 50)

    try:
        # Connect to database
        conn = psycopg2.connect(get_database_url())
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()

        # Read seed data file
        seed_file = Path(__file__).parent / 'seed_data.sql'
        with open(seed_file, 'r') as f:
            seed_sql = f.read()

        # Execute seed data
        cursor.execute(seed_sql)

        print("✅ Seed data loaded successfully")
        cursor.close()
        conn.close()
        return 0
    except Exception as e:
        print(f"❌ Error loading seed data: {e}")
        return 1


def cmd_reset(args):
    """Reset database (DROP ALL TABLES and re-migrate)"""
    confirm = input("⚠️  This will DELETE ALL DATA! Are you sure? (yes/no): ")
    if confirm.lower() != 'yes':
        print("Aborted")
        return 1

    print("🗑️  Resetting database...")
    print("=" * 50)

    # Downgrade to base
    ret = run_alembic_command(['downgrade', 'base'])
    if ret != 0:
        print("❌ Failed to downgrade")
        return ret

    # Upgrade to head
    ret = run_alembic_command(['upgrade', 'head'])
    if ret != 0:
        print("❌ Failed to upgrade")
        return ret

    # Load seed data
    return cmd_seed(args)


def print_usage():
    """Print usage information"""
    print(__doc__)
    print("\nAvailable commands:")
    print("  status     - Show migration status")
    print("  upgrade    - Run all pending migrations")
    print("  downgrade  - Revert last migration")
    print("  current    - Show current version")
    print("  history    - Show migration history")
    print("  revision   - Create a new migration")
    print("  seed       - Load seed data")
    print("  reset      - Reset database (DROP ALL and re-migrate)")


def main():
    """Main entry point"""
    if len(sys.argv) < 2:
        print_usage()
        sys.exit(1)

    command = sys.argv[1]
    args = sys.argv[2:]

    commands = {
        'status': cmd_status,
        'upgrade': cmd_upgrade,
        'downgrade': cmd_downgrade,
        'current': cmd_current,
        'history': cmd_history,
        'revision': cmd_revision,
        'seed': cmd_seed,
        'reset': cmd_reset,
    }

    if command not in commands:
        print(f"❌ Unknown command: {command}")
        print_usage()
        sys.exit(1)

    exit_code = commands[command](args)

    if exit_code == 0:
        print("\n✅ Command completed successfully")
    else:
        print(f"\n❌ Command failed with exit code {exit_code}")

    sys.exit(exit_code)


if __name__ == '__main__':
    main()
