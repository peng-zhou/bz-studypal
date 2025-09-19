#!/bin/bash

# BZ StudyPal Deployment Script
# This script handles deployment to production or staging environments

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/tmp/studypal_deploy_${TIMESTAMP}.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Function to show usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    -e, --env ENV           Environment to deploy to (production|staging)
    -t, --tag TAG          Docker image tag to deploy (default: latest)
    -h, --host HOST        Target host for deployment
    -u, --user USER        SSH user for deployment
    -k, --key-file KEY     SSH private key file
    -p, --port PORT        SSH port (default: 22)
    --skip-tests           Skip running tests before deployment
    --skip-backup          Skip database backup
    --dry-run              Show what would be done without executing
    --help                 Show this help message

Examples:
    $0 --env production
    $0 --env staging --tag v1.2.3
    $0 --env production --dry-run
    $0 --env production --skip-tests --skip-backup
EOF
}

# Default values
ENVIRONMENT=""
IMAGE_TAG="latest"
SSH_HOST=""
SSH_USER=""
SSH_KEY_FILE=""
SSH_PORT="22"
SKIP_TESTS=false
SKIP_BACKUP=false
DRY_RUN=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -t|--tag)
            IMAGE_TAG="$2"
            shift 2
            ;;
        -h|--host)
            SSH_HOST="$2"
            shift 2
            ;;
        -u|--user)
            SSH_USER="$2"
            shift 2
            ;;
        -k|--key-file)
            SSH_KEY_FILE="$2"
            shift 2
            ;;
        -p|--port)
            SSH_PORT="$2"
            shift 2
            ;;
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --help)
            usage
            exit 0
            ;;
        *)
            error "Unknown option: $1"
            ;;
    esac
done

# Validate required parameters
if [[ -z "$ENVIRONMENT" ]]; then
    error "Environment is required. Use --env production or --env staging"
fi

if [[ "$ENVIRONMENT" != "production" && "$ENVIRONMENT" != "staging" ]]; then
    error "Environment must be 'production' or 'staging'"
fi

# Set environment-specific defaults
case $ENVIRONMENT in
    production)
        SSH_HOST=${SSH_HOST:-${PRODUCTION_HOST:-""}}
        SSH_USER=${SSH_USER:-${PRODUCTION_USER:-""}}
        SSH_KEY_FILE=${SSH_KEY_FILE:-${PRODUCTION_SSH_KEY:-""}}
        DEPLOY_DIR="/opt/studypal-app"
        COMPOSE_FILE="docker-compose.prod.yml"
        ;;
    staging)
        SSH_HOST=${SSH_HOST:-${STAGING_HOST:-""}}
        SSH_USER=${SSH_USER:-${STAGING_USER:-""}}
        SSH_KEY_FILE=${SSH_KEY_FILE:-${STAGING_SSH_KEY:-""}}
        DEPLOY_DIR="/opt/studypal-staging"
        COMPOSE_FILE="docker-compose.staging.yml"
        ;;
esac

# Validate SSH configuration
if [[ -z "$SSH_HOST" ]]; then
    error "SSH host is required. Set PRODUCTION_HOST/STAGING_HOST environment variable or use --host"
fi

if [[ -z "$SSH_USER" ]]; then
    error "SSH user is required. Set PRODUCTION_USER/STAGING_USER environment variable or use --user"
fi

# Function to execute SSH commands
ssh_exec() {
    local cmd="$1"
    local ssh_opts=""
    
    if [[ -n "$SSH_KEY_FILE" ]]; then
        ssh_opts="-i $SSH_KEY_FILE"
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would execute on $SSH_HOST: $cmd"
        return 0
    fi
    
    ssh $ssh_opts -p "$SSH_PORT" -o StrictHostKeyChecking=no "$SSH_USER@$SSH_HOST" "$cmd"
}

# Function to copy files via SCP
scp_copy() {
    local src="$1"
    local dst="$2"
    local ssh_opts=""
    
    if [[ -n "$SSH_KEY_FILE" ]]; then
        ssh_opts="-i $SSH_KEY_FILE"
    fi
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would copy $src to $SSH_HOST:$dst"
        return 0
    fi
    
    scp $ssh_opts -P "$SSH_PORT" -o StrictHostKeyChecking=no "$src" "$SSH_USER@$SSH_HOST:$dst"
}

# Function to run tests
run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        warn "Skipping tests as requested"
        return 0
    fi
    
    log "Running tests..."
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would run backend and frontend tests"
        return 0
    fi
    
    # Run backend tests
    log "Running backend tests..."
    cd "$PROJECT_ROOT/backend"
    npm test
    
    # Run frontend tests  
    log "Running frontend tests..."
    cd "$PROJECT_ROOT/frontend"
    npm run test:ci
    
    cd "$PROJECT_ROOT"
}

# Function to build Docker images
build_images() {
    log "Building Docker images with tag: $IMAGE_TAG"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would build backend and frontend images"
        return 0
    fi
    
    # Build backend image
    log "Building backend image..."
    docker build -t "studypal-backend:$IMAGE_TAG" "./backend"
    
    # Build frontend image
    log "Building frontend image..."
    docker build -t "studypal-frontend:$IMAGE_TAG" "./frontend"
}

# Function to backup database
backup_database() {
    if [[ "$SKIP_BACKUP" == "true" ]]; then
        warn "Skipping database backup as requested"
        return 0
    fi
    
    log "Creating database backup..."
    
    ssh_exec "cd $DEPLOY_DIR && ./backup.sh"
}

# Function to deploy to server
deploy_to_server() {
    log "Deploying to $ENVIRONMENT environment on $SSH_HOST..."
    
    # Ensure deployment directory exists
    ssh_exec "mkdir -p $DEPLOY_DIR"
    
    # Copy docker-compose file
    log "Copying deployment configuration..."
    if [[ -f "$PROJECT_ROOT/$COMPOSE_FILE" ]]; then
        scp_copy "$PROJECT_ROOT/$COMPOSE_FILE" "$DEPLOY_DIR/"
    else
        warn "Compose file $COMPOSE_FILE not found, using default configuration"
    fi
    
    # Create environment file
    log "Setting up environment variables..."
    ssh_exec "cat > $DEPLOY_DIR/.env << 'EOF'
NODE_ENV=$ENVIRONMENT
IMAGE_TAG=$IMAGE_TAG
BACKEND_IMAGE=studypal-backend:$IMAGE_TAG
FRONTEND_IMAGE=studypal-frontend:$IMAGE_TAG
# Add other environment-specific variables here
EOF"
    
    # Pull/load images
    if [[ "$DRY_RUN" != "true" ]]; then
        log "Saving and transferring Docker images..."
        docker save "studypal-backend:$IMAGE_TAG" | gzip | ssh $ssh_opts -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "gunzip | docker load"
        docker save "studypal-frontend:$IMAGE_TAG" | gzip | ssh $ssh_opts -p "$SSH_PORT" "$SSH_USER@$SSH_HOST" "gunzip | docker load"
    fi
    
    # Stop existing services
    log "Stopping existing services..."
    ssh_exec "cd $DEPLOY_DIR && docker-compose -f $COMPOSE_FILE down --remove-orphans || true"
    
    # Start new services
    log "Starting updated services..."
    ssh_exec "cd $DEPLOY_DIR && docker-compose -f $COMPOSE_FILE up -d"
    
    # Wait for services to be healthy
    log "Waiting for services to be healthy..."
    ssh_exec "cd $DEPLOY_DIR && timeout 300 bash -c 'until docker-compose -f $COMPOSE_FILE ps | grep -q \"healthy\"; do echo \"Waiting for services...\"; sleep 10; done'"
}

# Function to run health checks
health_check() {
    log "Running health checks..."
    
    case $ENVIRONMENT in
        production)
            HEALTH_URL=${PRODUCTION_URL:-"https://$SSH_HOST"}
            ;;
        staging)
            HEALTH_URL=${STAGING_URL:-"https://staging.$SSH_HOST"}
            ;;
    esac
    
    if [[ "$DRY_RUN" == "true" ]]; then
        log "DRY RUN: Would check health at $HEALTH_URL"
        return 0
    fi
    
    # Wait a bit for services to fully start
    sleep 30
    
    # Check application health
    if curl -f -s "$HEALTH_URL/health" > /dev/null; then
        log "✅ Application health check passed"
    else
        error "❌ Application health check failed"
    fi
    
    # Check API health
    if curl -f -s "$HEALTH_URL/api/health" > /dev/null; then
        log "✅ API health check passed"
    else
        warn "⚠️  API health check failed - this might be expected during startup"
    fi
}

# Function to cleanup old images
cleanup() {
    log "Cleaning up old Docker images..."
    ssh_exec "docker image prune -f"
}

# Function to rollback deployment
rollback() {
    local previous_tag="$1"
    
    if [[ -z "$previous_tag" ]]; then
        error "Previous tag is required for rollback"
    fi
    
    warn "Rolling back to tag: $previous_tag"
    
    ssh_exec "cd $DEPLOY_DIR && sed -i 's/IMAGE_TAG=.*/IMAGE_TAG=$previous_tag/' .env"
    ssh_exec "cd $DEPLOY_DIR && docker-compose -f $COMPOSE_FILE down && docker-compose -f $COMPOSE_FILE up -d"
}

# Main deployment flow
main() {
    log "Starting deployment to $ENVIRONMENT environment"
    log "Target: $SSH_USER@$SSH_HOST:$SSH_PORT"
    log "Image tag: $IMAGE_TAG"
    log "Log file: $LOG_FILE"
    
    if [[ "$DRY_RUN" == "true" ]]; then
        warn "DRY RUN MODE - No actual changes will be made"
    fi
    
    # Check prerequisites
    log "Checking prerequisites..."
    command -v docker >/dev/null 2>&1 || error "Docker is required but not installed"
    command -v ssh >/dev/null 2>&1 || error "SSH is required but not installed"
    command -v scp >/dev/null 2>&1 || error "SCP is required but not installed"
    
    # Run deployment steps
    run_tests
    build_images
    backup_database
    deploy_to_server
    health_check
    cleanup
    
    log "✅ Deployment completed successfully!"
    log "Environment: $ENVIRONMENT"
    log "Image tag: $IMAGE_TAG"
    log "Log file saved to: $LOG_FILE"
    
    if [[ "$ENVIRONMENT" == "production" ]]; then
        log "🎉 Your application is now live!"
    fi
}

# Trap function for cleanup on script exit
cleanup_on_exit() {
    if [[ $? -ne 0 ]]; then
        error "Deployment failed! Check logs at: $LOG_FILE"
        
        # Offer rollback option
        if [[ "$DRY_RUN" != "true" ]] && [[ -n "$PREVIOUS_TAG" ]]; then
            read -p "Would you like to rollback to previous version? (y/N): " -r
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                rollback "$PREVIOUS_TAG"
            fi
        fi
    fi
}

trap cleanup_on_exit EXIT

# Run main function
main "$@"