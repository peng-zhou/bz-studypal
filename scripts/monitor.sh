#!/bin/bash

# Monitoring Script for BZ StudyPal
# This script provides continuous monitoring of application health and performance

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MONITOR_LOG="/tmp/studypal_monitor.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default configuration
ENVIRONMENT="production"
CHECK_INTERVAL=30
ALERT_THRESHOLD=3
BASE_URL="http://localhost"
NOTIFICATION_WEBHOOK=""
PERSISTENT=false
MAX_LOG_SIZE=10485760  # 10MB

# Counters
CONSECUTIVE_FAILURES=0
TOTAL_CHECKS=0
FAILED_CHECKS=0

# Parse arguments
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Monitoring Options:
  --env ENV              Environment (production|staging|development)
  --interval SECONDS     Check interval in seconds (default: 30)
  --url URL              Base URL for health checks
  --threshold COUNT      Alert after N consecutive failures (default: 3)
  --webhook URL          Webhook URL for notifications
  --persistent           Keep running continuously
  --help                 Show this help

Examples:
  $0 --env production --persistent
  $0 --env staging --interval 60 --threshold 5
  $0 --url https://myapp.com --webhook https://hooks.slack.com/...
EOF
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        --interval)
            CHECK_INTERVAL="$2"
            shift 2
            ;;
        --url)
            BASE_URL="$2"
            shift 2
            ;;
        --threshold)
            ALERT_THRESHOLD="$2"
            shift 2
            ;;
        --webhook)
            NOTIFICATION_WEBHOOK="$2"
            shift 2
            ;;
        --persistent)
            PERSISTENT=true
            shift
            ;;
        --help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Logging functions
log_with_timestamp() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "[$timestamp] [$level] $message" | tee -a "$MONITOR_LOG"
}

log_info() {
    log_with_timestamp "INFO" "$1"
}

log_success() {
    log_with_timestamp "SUCCESS" "$1"
}

log_warning() {
    log_with_timestamp "WARNING" "$1"
}

log_error() {
    log_with_timestamp "ERROR" "$1"
}

log_alert() {
    log_with_timestamp "ALERT" "$1"
}

# Send notification
send_notification() {
    local title="$1"
    local message="$2"
    local level="${3:-warning}"
    
    if [[ -n "$NOTIFICATION_WEBHOOK" ]]; then
        local color
        case $level in
            error|alert) color="#ff0000" ;;
            warning) color="#ffaa00" ;;
            success) color="#00ff00" ;;
            *) color="#0099cc" ;;
        esac
        
        local payload=$(cat << EOF
{
    "attachments": [
        {
            "color": "$color",
            "title": "$title",
            "text": "$message",
            "fields": [
                {
                    "title": "Environment",
                    "value": "$ENVIRONMENT",
                    "short": true
                },
                {
                    "title": "URL",
                    "value": "$BASE_URL",
                    "short": true
                },
                {
                    "title": "Timestamp",
                    "value": "$(date '+%Y-%m-%d %H:%M:%S')",
                    "short": true
                }
            ]
        }
    ]
}
EOF
        )
        
        if ! curl -s -X POST -H "Content-Type: application/json" -d "$payload" "$NOTIFICATION_WEBHOOK" >/dev/null; then
            log_error "Failed to send notification to webhook"
        fi
    fi
}

# Check if service is healthy
check_service_health() {
    local service_name="$1"
    local url="$2"
    local timeout=10
    
    if response=$(curl -s -w "%{http_code}" -m "$timeout" "$url" 2>/dev/null); then
        status_code="${response: -3}"
        if [[ "$status_code" == "200" ]]; then
            return 0
        else
            log_error "$service_name returned HTTP $status_code"
            return 1
        fi
    else
        log_error "$service_name is not responding"
        return 1
    fi
}

# Perform comprehensive health check
perform_health_check() {
    local failed=0
    
    # Determine URLs based on environment
    case $ENVIRONMENT in
        production|staging)
            FRONTEND_URL="$BASE_URL"
            BACKEND_URL="$BASE_URL"
            ;;
        development|local)
            FRONTEND_URL="$BASE_URL:3000"
            BACKEND_URL="$BASE_URL:8000"
            ;;
    esac
    
    # Check frontend
    if ! check_service_health "Frontend" "$FRONTEND_URL"; then
        ((failed++))
    fi
    
    # Check backend API
    if ! check_service_health "Backend API" "$BACKEND_URL/health"; then
        ((failed++))
    fi
    
    # Check database
    if ! check_service_health "Database" "$BACKEND_URL/health/db"; then
        ((failed++))
    fi
    
    return $failed
}

# Check Docker containers
check_docker_status() {
    if ! command -v docker &> /dev/null; then
        return 0
    fi
    
    local containers
    case $ENVIRONMENT in
        production)
            containers=("studypal-frontend-prod" "studypal-backend-prod" "studypal-nginx-prod")
            ;;
        staging)
            containers=("studypal-frontend-staging" "studypal-backend-staging")
            ;;
        development)
            containers=("studypal-frontend-dev" "studypal-backend-dev")
            ;;
    esac
    
    for container in "${containers[@]}"; do
        if ! docker ps --format "table {{.Names}}\t{{.Status}}" | grep -q "$container.*Up"; then
            log_error "Container $container is not running"
            return 1
        fi
    done
    
    return 0
}

# Check system resources
check_system_resources() {
    local issues=0
    
    # Check disk space
    if command -v df &> /dev/null; then
        disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
        if [[ $disk_usage -gt 90 ]]; then
            log_error "Disk usage is critically high: $disk_usage%"
            ((issues++))
        fi
    fi
    
    # Check memory
    if command -v free &> /dev/null; then
        mem_usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
        if [[ $mem_usage -gt 95 ]]; then
            log_error "Memory usage is critically high: $mem_usage%"
            ((issues++))
        fi
    fi
    
    # Check load average
    if command -v uptime &> /dev/null; then
        load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
        cpu_count=$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo "1")
        
        # Alert if load is more than 2x CPU count
        if (( $(echo "$load_avg > ($cpu_count * 2)" | bc -l 2>/dev/null || echo "0") )); then
            log_error "Load average is very high: $load_avg (CPUs: $cpu_count)"
            ((issues++))
        fi
    fi
    
    return $issues
}

# Log rotation
rotate_log_if_needed() {
    if [[ -f "$MONITOR_LOG" ]]; then
        log_size=$(wc -c < "$MONITOR_LOG" 2>/dev/null || echo "0")
        if [[ $log_size -gt $MAX_LOG_SIZE ]]; then
            mv "$MONITOR_LOG" "${MONITOR_LOG}.old"
            log_info "Log rotated due to size ($log_size bytes)"
        fi
    fi
}

# Main monitoring function
run_monitor_check() {
    ((TOTAL_CHECKS++))
    
    log_info "Running health check #$TOTAL_CHECKS..."
    
    local health_issues=0
    local docker_issues=0
    local system_issues=0
    
    # Perform checks
    perform_health_check || health_issues=$?
    check_docker_status || docker_issues=$?
    check_system_resources || system_issues=$?
    
    local total_issues=$((health_issues + docker_issues + system_issues))
    
    if [[ $total_issues -eq 0 ]]; then
        # All checks passed
        if [[ $CONSECUTIVE_FAILURES -gt 0 ]]; then
            log_success "Services recovered after $CONSECUTIVE_FAILURES failed checks"
            send_notification "🎉 Services Recovered" "All health checks are now passing" "success"
        else
            log_success "All health checks passed"
        fi
        CONSECUTIVE_FAILURES=0
    else
        # Some checks failed
        ((FAILED_CHECKS++))
        ((CONSECUTIVE_FAILURES++))
        
        log_error "Health check failed ($total_issues issues). Consecutive failures: $CONSECUTIVE_FAILURES"
        
        # Send alert if threshold reached
        if [[ $CONSECUTIVE_FAILURES -eq $ALERT_THRESHOLD ]]; then
            log_alert "ALERT: $CONSECUTIVE_FAILURES consecutive failures detected!"
            send_notification "🚨 Service Alert" "Service has failed $CONSECUTIVE_FAILURES consecutive health checks" "alert"
        elif [[ $CONSECUTIVE_FAILURES -gt $ALERT_THRESHOLD ]] && [[ $((CONSECUTIVE_FAILURES % 10)) -eq 0 ]]; then
            # Send periodic reminders every 10 failures after threshold
            log_alert "ALERT: Service still down after $CONSECUTIVE_FAILURES checks"
            send_notification "🚨 Service Still Down" "Service has been failing for $CONSECUTIVE_FAILURES consecutive checks" "alert"
        fi
    fi
}

# Signal handlers
cleanup() {
    log_info "Monitor stopped (received signal)"
    log_info "Final statistics: $TOTAL_CHECKS total checks, $FAILED_CHECKS failed checks"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Main execution
main() {
    log_info "Starting StudyPal monitor for $ENVIRONMENT environment"
    log_info "Base URL: $BASE_URL"
    log_info "Check interval: ${CHECK_INTERVAL}s"
    log_info "Alert threshold: $ALERT_THRESHOLD consecutive failures"
    
    if [[ -n "$NOTIFICATION_WEBHOOK" ]]; then
        log_info "Notifications enabled via webhook"
        send_notification "📊 Monitor Started" "StudyPal monitoring has been started" "info"
    fi
    
    if [[ "$PERSISTENT" == "true" ]]; then
        log_info "Running in persistent mode (Ctrl+C to stop)"
        
        while true; do
            run_monitor_check
            rotate_log_if_needed
            
            # Sleep for check interval
            sleep "$CHECK_INTERVAL"
        done
    else
        # Run single check
        run_monitor_check
    fi
    
    log_info "Monitor completed. Statistics: $TOTAL_CHECKS total checks, $FAILED_CHECKS failed checks"
}

# Run main function
main "$@"