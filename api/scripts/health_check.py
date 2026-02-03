#!/usr/bin/env python3
"""
YYC3-NAS-ECS Health Check Script

This script performs a comprehensive health check of the API service
and can be used in CI/CD pipelines and monitoring systems.

Usage:
    python scripts/health_check.py                    # Basic check
    python scripts/health_check.py --verbose          # Detailed output
    python scripts/health_check.py --endpoint http://localhost:3000/api/v2/health

Exit codes:
    0 - All checks passed
    1 - One or more checks failed
    2 - Invalid arguments
"""

import argparse
import json
import sys
from datetime import datetime
from urllib import request
from urllib.error import URLError, HTTPError


def parse_args():
    """Parse command line arguments"""
    parser = argparse.ArgumentParser(
        description='YYC3-NAS-ECS API Health Check'
    )
    parser.add_argument(
        '--endpoint',
        default='http://localhost:3000/api/v2/health',
        help='Health check endpoint URL'
    )
    parser.add_argument(
        '--timeout',
        type=int,
        default=10,
        help='Request timeout in seconds (default: 10)'
    )
    parser.add_argument(
        '--verbose',
        action='store_true',
        help='Show detailed output'
    )
    parser.add_argument(
        '--json',
        action='store_true',
        help='Output results as JSON'
    )
    return parser.parse_args()


def check_health(endpoint: str, timeout: int) -> dict:
    """
    Perform health check against the API endpoint

    Returns:
        dict: Health check results with status and details
    """
    results = {
        'timestamp': datetime.utcnow().isoformat(),
        'endpoint': endpoint,
        'status': 'unknown',
        'response_time_ms': None,
        'details': {}
    }

    try:
        start_time = datetime.now()

        with request.urlopen(endpoint, timeout=timeout) as response:
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            results['response_time_ms'] = round(response_time, 2)
            results['http_status'] = response.status

            # Parse response body
            try:
                data = json.loads(response.read().decode('utf-8'))
                results['details'] = data
                results['status'] = data.get('status', 'unknown')
            except json.JSONDecodeError:
                results['status'] = 'error'
                results['error'] = 'Invalid JSON response'

    except HTTPError as e:
        results['status'] = 'unhealthy'
        results['http_status'] = e.code
        results['error'] = str(e)
    except URLError as e:
        results['status'] = 'unreachable'
        results['error'] = str(e)
    except Exception as e:
        results['status'] = 'error'
        results['error'] = str(e)

    return results


def print_results(results: dict, verbose: bool, json_output: bool):
    """Print health check results"""
    if json_output:
        print(json.dumps(results, indent=2))
        return

    # Human-readable output
    print("=" * 60)
    print("YYC3-NAS-ECS API Health Check")
    print("=" * 60)
    print(f"Endpoint: {results['endpoint']}")
    print(f"Timestamp: {results['timestamp']}")
    print(f"Response Time: {results['response_time_ms']}ms")
    print(f"HTTP Status: {results.get('http_status', 'N/A')}")

    # Status with emoji
    status = results['status']
    if status == 'healthy':
        status_symbol = "✅"
    elif status == 'degraded':
        status_symbol = "⚠️ "
    elif status == 'unreachable':
        status_symbol = "🔌"
    elif status == 'unhealthy':
        status_symbol = "❌"
    else:
        status_symbol = "❓"

    print(f"\nStatus: {status_symbol} {status.upper()}")

    # Detailed output
    if verbose and 'details' in results:
        details = results['details']
        print("\nDetailed Checks:")
        print("-" * 40)

        for check_name, check_result in details.get('checks', {}).items():
            check_status = check_result.get('status', 'unknown')
            if check_status == 'healthy':
                symbol = "✅"
            elif check_status == 'degraded':
                symbol = "⚠️ "
            elif check_status == 'unhealthy':
                symbol = "❌"
            else:
                symbol = "❓"

            print(f"  {symbol} {check_name.upper()}: {check_status}")
            if 'message' in check_result:
                print(f"     └─ {check_result['message']}")

    # Service info
    if verbose and 'details' in results:
        details = results['details']
        if 'service' in details:
            print(f"\nService: {details['service']}")
        if 'version' in details:
            print(f"Version: {details['version']}")

    # Error info
    if 'error' in results:
        print(f"\nError: {results['error']}")

    print("=" * 60)


def main():
    """Main entry point"""
    args = parse_args()

    results = check_health(args.endpoint, args.timeout)
    print_results(results, args.verbose, args.json)

    # Determine exit code
    # 0 = healthy or degraded
    # 1 = unhealthy, unreachable, or error
    if results['status'] in ('healthy', 'degraded'):
        return 0
    else:
        return 1


if __name__ == '__main__':
    sys.exit(main())
