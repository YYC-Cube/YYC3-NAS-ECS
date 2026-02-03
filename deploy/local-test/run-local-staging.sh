#!/bin/bash
################################################################################
# YYC3-NAS-ECS Local Staging Deployment Test Script
################################################################################
# Purpose: Simulate complete staging deployment flow on local machine
# Usage: ./run-local-staging.sh [--full] [--skip-build]
################################################################################

set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
LOCAL_COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.local.yml"
LOG_FILE="${PROJECT_ROOT}/logs/local-staging-$(date +%Y%m%d-%H%M%S).log"

# Parameters
FULL_TEST=false
SKIP_BUILD=false
VERBOSE=false

# Statistics
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Logging functions
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] INFO:${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

failure() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Show banner
show_banner() {
    echo -e "${CYAN}"
    echo "=============================================================="
    echo "   YYC3-NAS-ECS Local Staging Deployment Test"
    echo "=============================================================="
    echo -e "${NC}"
}

# Parse arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --full)
                FULL_TEST=true
                shift
                ;;
            --skip-build)
                SKIP_BUILD=true
                shift
                ;;
            --verbose)
                VERBOSE=true
                set -x
                shift
                ;;
            -h|--help)
                cat << EOF
Usage: $0 [options]

Options:
    --full          Run complete test suite
    --skip-build    Skip image building
    --verbose       Show detailed output
    -h, --help      Show this help message

EOF
                exit 0
                ;;
            *)
                error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
}

# Test prerequisites
test_prerequisites() {
    echo ""
    info "=== Test 1: Prerequisites Check ==="

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    # Check Docker
    if command -v docker &> /dev/null; then
        success "Docker installed: $(docker --version | head -1)"
    else
        failure "Docker not installed"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi

    # Check Docker Compose
    if command -v docker-compose &> /dev/null; then
        success "Docker Compose installed: $(docker-compose --version | head -1)"
    else
        failure "Docker Compose not installed"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi

    # Check docker-compose.yml
    if [[ -f "$LOCAL_COMPOSE_FILE" ]]; then
        success "docker-compose.yml file exists"
    else
        failure "docker-compose.yml file not found"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi

    PASSED_TESTS=$((PASSED_TESTS + 1))
    success "Prerequisites check passed"
}

# Test Docker service
test_docker() {
    echo ""
    info "=== Test 2: Docker Service ==="

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if docker ps &> /dev/null; then
        success "Docker daemon running"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        failure "Docker daemon not running"
        error "Please start Docker Desktop or Docker daemon"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Stop existing containers
stop_existing_containers() {
    echo ""
    info "=== Stopping Existing Containers ==="

    if [[ "$SKIP_BUILD" == false ]]; then
        log "Stopping existing containers..."
        docker-compose -f "$LOCAL_COMPOSE_FILE" down 2>/dev/null || true
        success "Existing containers stopped"
    fi
}

# Build images
build_images() {
    echo ""
    info "=== Building Images ==="

    if [[ "$SKIP_BUILD" == true ]]; then
        info "Skipping image build"
        return 0
    fi

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    log "Building Docker images..."

    if docker-compose -f "$LOCAL_COMPOSE_FILE" build 2>&1 | tee -a "$LOG_FILE"; then
        success "Images built successfully"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        failure "Image build failed"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Start services
start_services() {
    echo ""
    info "=== Starting Services ==="

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    log "Starting Docker services..."

    if docker-compose -f "$LOCAL_COMPOSE_FILE" up -d 2>&1 | tee -a "$LOG_FILE"; then
        success "Services started successfully"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        failure "Failed to start services"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Wait for services to be ready
wait_for_services() {
    echo ""
    info "=== Waiting for Services Ready ==="

    log "Waiting for database..."
    local max_wait=60
    local waited=0

    while [[ $waited -lt $max_wait ]]; do
        if docker-compose -f "$LOCAL_COMPOSE_FILE" exec -T postgres pg_isready -U postgres &> /dev/null; then
            success "PostgreSQL is ready"
            break
        fi
        echo -n "."
        sleep 2
        waited=$((waited + 2))
    done

    if [[ $waited -ge $max_wait ]]; then
        error "Database startup timeout"
        docker-compose -f "${LOCAL_COMPOSE_FILE}" logs postgres
        return 1
    fi

    log "Waiting for API service..."
    sleep 5

    # Check API container
    if docker-compose -f "$LOCAL_COMPOSE_FILE" ps api 2>/dev/null | grep -q "Up"; then
        success "API service is running"
    else
        error "API service failed to start"
        docker-compose -f "$LOCAL_COMPOSE_FILE" logs api
        return 1
    fi
}

# Run database migrations
run_migrations() {
    echo ""
    info "=== Running Database Migrations ==="

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    log "Running migrations..."

    # Wait for API container to be ready
    sleep 3

    # Check if migration script exists
    if [[ ! -f "${PROJECT_ROOT}/api/scripts/migrate.py" ]]; then
        warn "Migration script not found, skipping"
        return 0
    fi

    if docker-compose -f "$LOCAL_COMPOSE_FILE" exec -T api python scripts/migrate.py upgrade 2>&1 | tee -a "$LOG_FILE"; then
        success "Database migration successful"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        warn "Database migration failed (may already be initialized)"
    fi
}

# Health check
test_health_check() {
    echo ""
    info "=== Test 3: Health Check ==="

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    log "Waiting for health endpoint to respond..."
    sleep 3

    local max_attempts=30
    local attempt=0

    while [[ $attempt -lt $max_attempts ]]; do
        if curl -f http://localhost:3200/api/v2/health &> /dev/null; then
            break
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    echo ""

    local health_response=$(curl -s http://localhost:3200/api/v2/health 2>/dev/null)

    if [[ $? -eq 0 ]]; then
        success "Health check endpoint responding"
        info "Response: $health_response"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        failure "Health check endpoint not responding"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Test API endpoints
test_api_endpoints() {
    echo ""
    info "=== Test 4: API Endpoints ==="

    # Test root endpoint
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    local response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3200/api/v2/ 2>/dev/null)

    if [[ "$response" == "200" ]]; then
        success "GET /api/v2/ returns $response"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        failure "GET /api/v2/ returns $response"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi

    # Test monitoring endpoint
    if [[ "$FULL_TEST" == true ]]; then
        TOTAL_TESTS=$((TOTAL_TESTS + 1))

        response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3200/api/v2/monitoring/stats 2>/dev/null)

        if [[ "$response" == "200" ]] || [[ "$response" == "401" ]]; then
            success "GET /api/v2/monitoring/stats returns $response"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            failure "GET /api/v2/monitoring/stats returns $response"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    fi
}

# Test database connection
test_database() {
    echo ""
    info "=== Test 5: Database Connection ==="

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    if docker-compose -f "$LOCAL_COMPOSE_FILE" exec -T postgres pg_isready -U postgres &> /dev/null; then
        success "PostgreSQL connection OK"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        failure "PostgreSQL connection failed"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Test container status
test_container_status() {
    echo ""
    info "=== Test 6: Container Status ==="

    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    local running_containers=$(docker-compose -f "$LOCAL_COMPOSE_FILE" ps -q 2>/dev/null | wc -l | tr -d ' ')

    if [[ $running_containers -ge 3 ]]; then
        success "Running containers: $running_containers"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        failure "Insufficient containers: $running_containers"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi

    # Show container status
    echo ""
    info "Container Status Details:"
    docker-compose -f "$LOCAL_COMPOSE_FILE" ps
}

# Check logs
test_logs() {
    echo ""
    info "=== Check Logs ==="

    info "API Service Logs (last 20 lines):"
    docker-compose -f "$LOCAL_COMPOSE_FILE" logs --tail=20 api 2>&1 | grep -v "^$" || true
}

# Performance benchmark tests
run_performance_tests() {
    if [[ "$FULL_TEST" != true ]]; then
        return 0
    fi

    echo ""
    info "=== Performance Benchmark Tests ==="

    # Test health check response time
    TOTAL_TESTS=$((TOTAL_TESTS + 1))

    info "Testing health check response time (10 requests)..."
    local total_time=0
    local requests=10

    for i in $(seq 1 $requests); do
        # Use curl's built-in timing measurement (works on all platforms)
        local time_total=$(curl -o /dev/null -s -w '%{time_total}\n' http://localhost:3200/api/v2/health)
        # Convert to milliseconds (remove decimal point)
        local duration_ms=$(echo "$time_total * 1000" | bc | cut -d'.' -f1)
        total_time=$((total_time + duration_ms))
        echo -n "."
    done

    echo ""

    local avg_time=$((total_time / requests))

    if [[ $avg_time -lt 500 ]]; then
        success "Average response time: ${avg_time}ms (target: < 500ms)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        failure "Average response time: ${avg_time}ms (target: < 500ms)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Show test report
show_report() {
    echo ""
    echo -e "${CYAN}==============================================================${NC}"
    echo -e "${CYAN}                    Test Report                               ${NC}"
    echo -e "${CYAN}==============================================================${NC}"
    echo ""
    echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
    echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
    echo ""

    if [[ $FAILED_TESTS -eq 0 ]]; then
        echo -e "${GREEN}╔==============================================================╗${NC}"
        echo -e "${GREEN}║  All tests passed! Local staging is ready to use.         ║${NC}"
        echo -e "${GREEN}╚==============================================================╝${NC}"
        echo ""
        info "Next Steps:"
        echo "  1. Visit http://localhost:3000 to view frontend"
        echo "  2. Visit http://localhost:3200/api/v2/health to check API"
        echo "  3. Visit http://localhost:3001 to view Grafana"
        echo "  4. View logs: docker-compose logs -f"
        echo ""

        # Show service access information
        echo -e "${CYAN}==============================================================${NC}"
        echo -e "${CYAN}  Service Access URLs                                         ${NC}"
        echo -e "${CYAN}==============================================================${NC}"
        echo -e "  Frontend:     ${GREEN}http://localhost:3000${NC}"
        echo -e "  API:          ${GREEN}http://localhost:3200${NC}"
        echo -e "  Health Check: ${GREEN}http://localhost:3200/api/v2/health${NC}"
        echo -e "  Grafana:      ${GREEN}http://localhost:3001${NC}"
        echo -e "  Prometheus:   ${GREEN}http://localhost:9090${NC}"
        echo ""

        return 0
    else
        echo -e "${RED}╔==============================================================╗${NC}"
        echo -e "${RED}║  Some tests failed. Please check the logs.                     ║${NC}"
        echo -e "${RED}╚==============================================================╝${NC}"
        echo ""
        info "Troubleshooting:"
        echo "  1. Check logs: cat $LOG_FILE"
        echo "  2. Check containers: docker-compose ps"
        echo "  3. Check service logs: docker-compose logs <service>"
        echo "  4. Restart services: docker-compose restart"
        echo ""

        return 1
    fi
}

# Cleanup function
cleanup() {
    echo ""
    log "Deployment test complete, containers remain running..."
    echo "To stop services, run: docker-compose down"
}

# Main flow
main() {
    show_banner
    parse_args "$@"

    # Create log directory
    mkdir -p "$(dirname "$LOG_FILE")"

    log "Starting local staging deployment test..."
    log "Log file: $LOG_FILE"

    # Execute test steps
    test_prerequisites
    test_docker
    stop_existing_containers
    build_images
    start_services
    wait_for_services
    run_migrations
    test_health_check
    test_api_endpoints
    test_database
    test_container_status
    test_logs

    if [[ "$FULL_TEST" == true ]]; then
        run_performance_tests
    fi

    # Show report
    show_report
    cleanup
}

# Exit cleanup
trap cleanup EXIT

# Execute main flow
main "$@"
