"""
Environment Validation Module for YYC3-NAS-ECS API

This module provides validation for required and optional environment variables.
It should be imported early in the application startup to fail fast if critical
configuration is missing.

Usage:
    from config.env_validator import validate_environment, get_validation_report

    # Validate on startup (will exit if critical vars are missing)
    validate_environment()

    # Or get a report without exiting
    report = get_validation_report()
"""

import os
import sys
from typing import Dict, List, Optional
from dataclasses import dataclass, field


@dataclass
class ValidationResult:
    """Result of environment variable validation"""
    variable_name: str
    is_valid: bool
    is_required: bool
    current_value: Optional[str] = None
    error_message: Optional[str] = None
    recommendation: Optional[str] = None


@dataclass
class ValidationReport:
    """Complete validation report"""
    is_valid: bool
    results: List[ValidationResult] = field(default_factory=list)
    critical_errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)

    def add_result(self, result: ValidationResult):
        """Add a validation result"""
        self.results.append(result)

        if result.is_required and not result.is_valid:
            self.critical_errors.append(
                f"Missing required variable: {result.variable_name}"
            )
            self.is_valid = False
        elif not result.is_valid:
            self.warnings.append(
                f"Optional variable issue: {result.variable_name} - {result.error_message}"
            )


class EnvironmentValidator:
    """Environment variable validator"""

    # Required variables for basic operation
    REQUIRED_VARIABLES = {
        'DATABASE_URL': {
            'description': 'PostgreSQL database connection string',
            'example': 'postgresql://user:pass@localhost:5432/yyc3',
        },
        'JWT_SECRET_KEY': {
            'description': 'Secret key for JWT token signing',
            'example': 'your-random-32-character-secret-key',
            'validator': lambda x: len(x) >= 32,
            'error': 'Must be at least 32 characters long',
        },
        'SECRET_KEY': {
            'description': 'Application secret key',
            'example': 'your-random-32-character-secret-key',
            'validator': lambda x: len(x) >= 32,
            'error': 'Must be at least 32 characters long',
        },
    }

    # Variables required for specific features
    FEATURE_VARIABLES = {
        'REDIS_URL': {
            'description': 'Redis connection URL',
            'example': 'redis://localhost:6379/0',
            'feature': 'Caching and sessions',
        },
        'SMTP_HOST': {
            'description': 'SMTP server host',
            'example': 'smtp.gmail.com',
            'feature': 'Email sending',
        },
        'SMTP_USER': {
            'description': 'SMTP username',
            'example': 'your-email@gmail.com',
            'feature': 'Email sending',
        },
        'SMTP_PASSWORD': {
            'description': 'SMTP password',
            'example': 'your-app-password',
            'feature': 'Email sending',
        },
        'OPENAI_API_KEY': {
            'description': 'OpenAI API key for LLM features',
            'example': 'sk-...',
            'feature': 'AI/LLM features',
        },
        'OLLAMA_API_URL': {
            'description': 'Ollama API URL for local LLM',
            'example': 'http://localhost:11434',
            'feature': 'Local AI/LLM',
        },
        'SENTRY_DSN': {
            'description': 'Sentry DSN for error tracking',
            'example': 'https://...',
            'feature': 'Error tracking',
        },
    }

    # Variables with recommended values
    RECOMMENDED_VARIABLES = {
        'NODE_ENV': {
            'description': 'Application environment',
            'allowed': ['development', 'production', 'test'],
            'default': 'production',
        },
        'LOG_LEVEL': {
            'description': 'Logging level',
            'allowed': ['debug', 'info', 'warning', 'error'],
            'default': 'info',
        },
        'CORS_ORIGINS': {
            'description': 'Allowed CORS origins',
            'example': 'http://localhost:3000,https://yourdomain.com',
            'default': '*',
        },
    }

    @classmethod
    def validate_required(cls) -> List[ValidationResult]:
        """Validate required environment variables"""
        results = []

        for var_name, config in cls.REQUIRED_VARIABLES.items():
            value = os.getenv(var_name)

            if not value:
                results.append(ValidationResult(
                    variable_name=var_name,
                    is_valid=False,
                    is_required=True,
                    current_value=None,
                    error_message=f'{config["description"]} is required',
                    recommendation=f'Set {var_name}={config["example"]}'
                ))
            elif 'validator' in config:
                is_valid = config['validator'](value)
                results.append(ValidationResult(
                    variable_name=var_name,
                    is_valid=is_valid,
                    is_required=True,
                    current_value=value[:8] + '...' if len(value) > 8 else value,
                    error_message=config['error'] if not is_valid else None,
                ))
            else:
                results.append(ValidationResult(
                    variable_name=var_name,
                    is_valid=True,
                    is_required=True,
                    current_value=value[:8] + '...' if len(value) > 8 else value,
                ))

        return results

    @classmethod
    def validate_features(cls) -> List[ValidationResult]:
        """Validate feature-specific environment variables"""
        results = []

        for var_name, config in cls.FEATURE_VARIABLES.items():
            value = os.getenv(var_name)

            if not value:
                results.append(ValidationResult(
                    variable_name=var_name,
                    is_valid=False,
                    is_required=False,
                    current_value=None,
                    error_message=f'Not set - {config["feature"]} will be disabled',
                    recommendation=f'Set {var_name}={config["example"]} to enable {config["feature"]}'
                ))
            else:
                results.append(ValidationResult(
                    variable_name=var_name,
                    is_valid=True,
                    is_required=False,
                    current_value=value[:8] + '...' if len(value) > 8 else value,
                ))

        return results

    @classmethod
    def validate_recommended(cls) -> List[ValidationResult]:
        """Validate recommended environment variables"""
        results = []

        for var_name, config in cls.RECOMMENDED_VARIABLES.items():
            value = os.getenv(var_name, config.get('default', ''))

            is_valid = True
            error_msg = None

            if 'allowed' in config and value not in config['allowed']:
                is_valid = False
                error_msg = f'Must be one of: {", ".join(config["allowed"])}'
                if 'default' in config:
                    error_msg += f' (will use default: {config["default"]})'

            results.append(ValidationResult(
                variable_name=var_name,
                is_valid=is_valid,
                is_required=False,
                current_value=value,
                error_message=error_msg,
                recommendation=f'Use one of: {", ".join(config["allowed"])}' if 'allowed' in config else None
            ))

        return results

    @classmethod
    def validate_all(cls) -> ValidationReport:
        """Validate all environment variables"""
        report = ValidationReport(is_valid=True)

        # Validate required
        for result in cls.validate_required():
            report.add_result(result)

        # Validate features
        for result in cls.validate_features():
            report.add_result(result)

        # Validate recommended
        for result in cls.validate_recommended():
            report.add_result(result)

        return report


def validate_environment(fail_on_error: bool = True) -> ValidationReport:
    """
    Validate all environment variables

    Args:
        fail_on_error: If True, exit with code 1 on validation failure

    Returns:
        ValidationReport with all validation results
    """
    report = EnvironmentValidator.validate_all()

    if not report.is_valid and fail_on_error:
        print("=" * 70)
        print("❌ ENVIRONMENT VALIDATION FAILED")
        print("=" * 70)
        print("\nCritical errors:")
        for error in report.critical_errors:
            print(f"  ❌ {error}")

        print("\nRequired variables:")
        for result in report.results:
            if result.is_required:
                if result.is_valid:
                    print(f"  ✅ {result.variable_name}")
                else:
                    print(f"  ❌ {result.variable_name}")
                    if result.recommendation:
                        print(f"     💡 {result.recommendation}")

        print("\nPlease set the missing environment variables and try again.")
        print("=" * 70)
        sys.exit(1)

    return report


def get_validation_report() -> ValidationReport:
    """Get validation report without exiting on error"""
    return validate_environment(fail_on_error=False)


def print_validation_report():
    """Print a formatted validation report"""
    report = get_validation_report()

    print("=" * 70)
    print("ENVIRONMENT VALIDATION REPORT")
    print("=" * 70)

    if report.is_valid:
        print("\n✅ All required environment variables are set!\n")
    else:
        print("\n⚠️  Validation completed with issues\n")

    print("Required Variables:")
    print("-" * 40)
    for result in report.results:
        if result.is_required:
            status = "✅" if result.is_valid else "❌"
            value_display = result.current_value or "<not set>"
            print(f"  {status} {result.variable_name}: {value_display}")
            if result.error_message:
                print(f"     ⚠️  {result.error_message}")
            if result.recommendation:
                print(f"     💡 {result.recommendation}")

    print("\nOptional Features:")
    print("-" * 40)
    for result in report.results:
        if not result.is_required and result.variable_name in EnvironmentValidator.FEATURE_VARIABLES:
            status = "✅" if result.is_valid else "➖"
            feature = EnvironmentValidator.FEATURE_VARIABLES[result.variable_name]['feature']
            value_display = result.current_value or "<not set>"
            print(f"  {status} {result.variable_name}: {value_display} ({feature})")

    if report.warnings:
        print("\nWarnings:")
        print("-" * 40)
        for warning in report.warnings:
            print(f"  ⚠️  {warning}")

    print("=" * 70)


# CLI entry point
if __name__ == '__main__':
    print_validation_report()
