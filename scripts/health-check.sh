#!/bin/bash

# Health Check Script for BZ StudyPal
# This script performs comprehensive health checks on all services

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default configuration
ENVIRONMENT="production"
BASE_URL="http://localhost"
FRONTEND_PORT="3000"
BACKEND_PORT="8000"
TIMEOUT="10"
VERBOSE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --url)
            BASE_URL="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --env ENV       Environment (production|staging|development)"
            echo "  --url URL       Base URL for health checks"
            echo "  --timeout SEC   Timeout in seconds (default: 10)"
            echo "  --verbose       Verbose output"
            echo "  --help          Show this help"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✅]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠️ ]${NC} $1"
}

log_error() {
    echo -e "${RED}[❌]${NC} $1"
}

# Check if a service is responding
check_http_endpoint() {
    local name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    
    if [[ "$VERBOSE" == "true" ]]; then
        log_info "Checking $name at $url"
    fi
    
    if response=$(curl -s -w "%{http_code}" -m "$TIMEOUT" "$url" 2>/dev/null); then
        status_code="${response: -3}"
        response_body="${response%???}"
        
        if [[ "$status_code" == "$expected_status" ]]; then
            log_success "$name is healthy (HTTP $status_code)"
            return 0
        else
            log_error "$name returned HTTP $status_code (expected $expected_status)"
            if [[ "$VERBOSE" == "true" && -n "$response_body" ]]; then
                echo "Response: $response_body"
            fi
            return 1
        fi
    else
        log_error "$name is not responding"
        return 1
    fi
}

# Check Docker container health
check_docker_container() {
    local container_name="$1"
    
    if ! command -v docker &> /dev/null; then
        log_warning "Docker not available, skipping container checks"
        return 0
    fi
    
    if docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container_name"; then
        status=$(docker ps --format "table {{.Names}}\t{{.Status}}" | grep "$container_name" | awk '{print $2}')
        
        if [[ "$status" == *"healthy"* ]] || [[ "$status" == *"Up"* ]]; then
            log_success "Container $container_name is running ($status)"
            return 0
        else
            log_error "Container $container_name is not healthy ($status)"
            return 1
        fi
    else
        log_error "Container $container_name is not running"
        return 1
    fi
}

# Check database connectivity
check_database() {
    local backend_url="$1"
    
    check_http_endpoint "Database Health" "$backend_url/health/db"
}

# Check API endpoints
check_api_endpoints() {
    local backend_url="$1"
    local failed=0
    
    # Basic health check
    check_http_endpoint "Backend API" "$backend_url/health" || ((failed++))
    
    # Database health
    check_database "$backend_url" || ((failed++))
    
    # Auth endpoints (should return 400/422 for missing data, not 500)
    if check_http_endpoint "Auth Status Endpoint" "$backend_url/api/auth/status" "401"; then
        log_success "Auth endpoints are responding correctly"
    else
        log_error "Auth endpoints may have issues"
        ((failed++))
    fi
    
    return $failed
}

# Check frontend application
check_frontend() {
    local frontend_url="$1"
    
    # Check if frontend loads
    if check_http_endpoint "Frontend Application" "$frontend_url"; then
        # Check if it's actually the React app (not just nginx default page)
        if response=$(curl -s -m "$TIMEOUT" "$frontend_url" 2>/dev/null); then
            if [[ "$response" == *"studypal"* ]] || [[ "$response" == *"__NEXT_DATA__"* ]]; then
                log_success "Frontend application is serving correctly"
                return 0
            else
                log_warning "Frontend is responding but may not be serving the correct application"
                return 1
            fi
        fi
    else
        return 1
    fi
}

# Check SSL certificates (if HTTPS)
check_ssl_certificate() {
    local domain="$1"
    
    if [[ "$domain" != https://* ]]; then
        return 0
    fi
    
    domain="${domain#https://}"
    domain="${domain%%/*}"
    
    if command -v openssl &> /dev/null; then
        if cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null); then
            not_after=$(echo "$cert_info" | grep "notAfter=" | cut -d= -f2)
            exp_date=$(date -d "$not_after" +%s 2>/dev/null || date -j -f "%b %d %T %Y %Z" "$not_after" +%s 2>/dev/null)
            current_date=$(date +%s)
            days_until_expiry=$(( (exp_date - current_date) / 86400 ))
            
            if [[ $days_until_expiry -gt 30 ]]; then
                log_success "SSL certificate is valid for $days_until_expiry more days"
            elif [[ $days_until_expiry -gt 7 ]]; then
                log_warning "SSL certificate expires in $days_until_expiry days"
            else
                log_error "SSL certificate expires in $days_until_expiry days!"
            fi
        else
            log_error "Could not check SSL certificate for $domain"
        fi
    else
        log_warning "OpenSSL not available, skipping SSL certificate check"
    fi
}

# Check disk space
check_disk_space() {
    if command -v df &> /dev/null; then
        # Check available disk space
        disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
        
        if [[ $disk_usage -lt 80 ]]; then
            log_success "Disk usage is $disk_usage% (healthy)"
        elif [[ $disk_usage -lt 90 ]]; then
            log_warning "Disk usage is $disk_usage% (getting full)"
        else
            log_error "Disk usage is $disk_usage% (critically full)"
        fi
        
        # Check Docker space if available
        if command -v docker &> /dev/null; then
            if docker_space=$(docker system df --format "table {{.Type}}\t{{.Size}}" 2>/dev/null); then
                log_info "Docker space usage:"
                echo "$docker_space" | while read -r line; do
                    echo "  $line"
                done
            fi
        fi
    fi
}

# Check memory usage
check_memory() {
    if command -v free &> /dev/null; then
        mem_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
        
        if [[ $mem_usage -lt 80 ]]; then
            log_success "Memory usage is $mem_usage% (healthy)"
        elif [[ $mem_usage -lt 90 ]]; then
            log_warning "Memory usage is $mem_usage% (high)"
        else
            log_error "Memory usage is $mem_usage% (critically high)"
        fi
    elif command -v vm_stat &> /dev/null; then
        # macOS memory check
        log_info "Memory status (macOS):"
        vm_stat | head -4
    fi
}

# Check load average
check_load_average() {
    if command -v uptime &> /dev/null; then
        load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
        cpu_count=$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo "1")
        
        if (( $(echo "$load_avg < $cpu_count" | bc -l 2>/dev/null || echo "1") )); then
            log_success "Load average is $load_avg (healthy for $cpu_count CPUs)"
        else
            log_warning "Load average is $load_avg (high for $cpu_count CPUs)"
        fi
    fi
}

# Main health check function
main() {
    log_info "Starting health check for $ENVIRONMENT environment"
    log_info "Base URL: $BASE_URL"
    log_info "Timeout: ${TIMEOUT}s"
    echo ""
    
    local failed_checks=0
    local total_checks=0
    
    # Determine URLs based on environment
    case $ENVIRONMENT in
        production|staging)
            FRONTEND_URL="$BASE_URL"
            BACKEND_URL="$BASE_URL"
            ;;
        development|local)
            FRONTEND_URL="$BASE_URL:$FRONTEND_PORT"
            BACKEND_URL="$BASE_URL:$BACKEND_PORT"
            ;;
    esac
    
    # Service health checks
    log_info "=== Service Health Checks ==="
    
    # Frontend check
    ((total_checks++))
    if ! check_frontend "$FRONTEND_URL"; then
        ((failed_checks++))
    fi
    
    # Backend API checks
    ((total_checks++))
    if ! check_api_endpoints "$BACKEND_URL"; then
        ((failed_checks++))
    fi
    
    # Container checks (if Docker is available)
    if command -v docker &> /dev/null; then
        log_info ""
        log_info "=== Container Health Checks ==="
        
        containers=("studypal-frontend" "studypal-backend" "studypal-nginx")
        if [[ "$ENVIRONMENT" == "development" ]]; then
            containers+=("-dev")
        elif [[ "$ENVIRONMENT" == "production" ]]; then
            containers+=("-prod")
        fi
        
        for container in "${containers[@]}"; do
            ((total_checks++))
            if ! check_docker_container "$container"; then
                ((failed_checks++))
            fi
        done
    fi
    
    # SSL certificate check (for HTTPS URLs)
    if [[ "$BASE_URL" == https://* ]]; then
        log_info ""
        log_info "=== SSL Certificate Check ==="
        ((total_checks++))
        check_ssl_certificate "$BASE_URL"
    fi
    
    # System resource checks
    log_info ""
    log_info "=== System Resource Checks ==="
    check_disk_space
    check_memory
    check_load_average
    
    # Summary
    echo ""
    log_info "=== Health Check Summary ==="
    
    if [[ $failed_checks -eq 0 ]]; then
        log_success "All health checks passed! ($total_checks/$total_checks)"
        exit 0
    else
        log_error "$failed_checks out of $total_checks health checks failed"
        exit 1
    fi
}

# Run main function
main "$@"