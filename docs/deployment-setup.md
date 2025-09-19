# Deployment Setup Guide

This guide explains how to set up the CI/CD pipeline and deployment environments for BZ StudyPal.

## GitHub Secrets Configuration

### Required Secrets for CI/CD

#### Production Environment
Set these secrets in your GitHub repository settings under **Settings** → **Secrets and variables** → **Actions**:

```bash
# Authentication & Security
JWT_SECRET=your-production-jwt-secret-key-at-least-32-chars
REFRESH_TOKEN_SECRET=your-production-refresh-token-secret-key
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-oauth-client-id

# Production Server Access
PRODUCTION_HOST=your-production-server-ip-or-domain
PRODUCTION_USER=your-ssh-username
PRODUCTION_SSH_KEY=your-private-ssh-key
PRODUCTION_SSH_PORT=22
PRODUCTION_URL=https://your-production-domain.com

# API Configuration
NEXT_PUBLIC_API_URL=https://api.your-production-domain.com
```

#### Staging Environment (Optional)
```bash
# Staging Server Access
STAGING_HOST=your-staging-server-ip
STAGING_USER=your-ssh-username
STAGING_SSH_KEY=your-private-ssh-key
STAGING_SSH_PORT=22
STAGING_URL=https://staging.your-domain.com

# Staging Authentication
STAGING_JWT_SECRET=your-staging-jwt-secret
STAGING_REFRESH_TOKEN_SECRET=your-staging-refresh-secret
```

#### Notifications (Optional)
```bash
SLACK_WEBHOOK_URL=your-slack-webhook-url-for-deployment-notifications
```

## Server Setup

### 1. Production Server Requirements

- **OS**: Ubuntu 20.04+ or similar Linux distribution
- **RAM**: Minimum 2GB, recommended 4GB+
- **Storage**: Minimum 20GB SSD
- **Network**: Static IP address, ports 80 and 443 open

### 2. Server Software Installation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Install Nginx (for reverse proxy)
sudo apt install nginx -y

# Install certbot for SSL certificates
sudo apt install certbot python3-certbot-nginx -y
```

### 3. Application Directory Setup

```bash
# Create application directory
sudo mkdir -p /opt/studypal-app
sudo chown $USER:$USER /opt/studypal-app
cd /opt/studypal-app

# Create docker-compose.prod.yml
cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  backend:
    image: ${BACKEND_IMAGE}
    container_name: studypal-backend-prod
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./prod.db
      - JWT_SECRET=${JWT_SECRET}
      - REFRESH_TOKEN_SECRET=${REFRESH_TOKEN_SECRET}
      - GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID}
      - GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET}
      - CORS_ORIGIN=https://yourdomain.com
    volumes:
      - backend_prod_data:/app/prisma
      - uploads_prod_data:/app/uploads
    networks:
      - studypal-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: ${FRONTEND_IMAGE}
    container_name: studypal-frontend-prod
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_API_URL=https://api.yourdomain.com
      - NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
    depends_on:
      backend:
        condition: service_healthy
    networks:
      - studypal-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000"]
      interval: 30s
      timeout: 10s
      retries: 3

  nginx:
    image: nginx:alpine
    container_name: studypal-nginx-prod
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - /etc/letsencrypt:/etc/letsencrypt:ro
    depends_on:
      - frontend
      - backend
    networks:
      - studypal-network

volumes:
  backend_prod_data:
  uploads_prod_data:

networks:
  studypal-network:
    driver: bridge
EOF
```

### 4. Nginx Configuration

```bash
# Create nginx directory
mkdir -p nginx

# Create nginx.conf
cat > nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                     '$status $body_bytes_sent "$http_referer" '
                     '"$http_user_agent" "$http_x_forwarded_for"';
    
    sendfile        on;
    keepalive_timeout  65;
    client_max_body_size 10M;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=app:10m rate=5r/s;
    
    # Frontend
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        
        # Redirect HTTP to HTTPS
        return 301 https://$server_name$request_uri;
    }
    
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;
        
        # SSL configuration
        ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
        
        # Security headers
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        
        location / {
            limit_req zone=app burst=10 nodelay;
            proxy_pass http://studypal-frontend-prod:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
    
    # Backend API
    server {
        listen 80;
        server_name api.yourdomain.com;
        
        return 301 https://$server_name$request_uri;
    }
    
    server {
        listen 443 ssl http2;
        server_name api.yourdomain.com;
        
        # SSL configuration
        ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
        
        # Security headers
        add_header X-Frame-Options DENY always;
        add_header X-Content-Type-Options nosniff always;
        add_header X-XSS-Protection "1; mode=block" always;
        
        location / {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://studypal-backend-prod:8000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}
EOF
```

### 5. SSL Certificate Setup

```bash
# Stop nginx temporarily
sudo systemctl stop nginx

# Get SSL certificates
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com
sudo certbot certonly --standalone -d api.yourdomain.com

# Create auto-renewal cron job
echo "0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx" | sudo crontab -
```

## Environment-Specific Configuration Files

### Production Environment Variables

Create `.env.production` in the project root:

```bash
# Production configuration
NODE_ENV=production
DATABASE_URL=file:./prod.db

# Authentication
JWT_SECRET=your-production-jwt-secret
REFRESH_TOKEN_SECRET=your-production-refresh-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id

# API Configuration
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
CORS_ORIGIN=https://yourdomain.com

# Optional: Redis for caching
REDIS_URL=redis://localhost:6379
```

### Staging Environment Variables

Create `.env.staging`:

```bash
# Staging configuration
NODE_ENV=staging
DATABASE_URL=file:./staging.db

# Authentication (use different secrets)
JWT_SECRET=your-staging-jwt-secret
REFRESH_TOKEN_SECRET=your-staging-refresh-secret

# API Configuration
NEXT_PUBLIC_API_URL=https://api.staging.yourdomain.com
CORS_ORIGIN=https://staging.yourdomain.com
```

## Security Considerations

### 1. SSH Key Management
- Use dedicated SSH keys for deployment
- Restrict SSH key permissions to deployment-only actions
- Consider using GitHub Actions with OIDC instead of long-lived keys

### 2. Secret Rotation
- Rotate JWT secrets regularly
- Update Google OAuth credentials if compromised
- Monitor secret usage in GitHub Actions logs

### 3. Network Security
- Use firewall rules to restrict access
- Enable fail2ban for SSH protection
- Consider using a VPN for administrative access

## Monitoring and Logging

### 1. Application Logs
```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f

# View specific service logs
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
```

### 2. System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs -y

# Check system resources
htop
df -h
free -m
```

### 3. Health Checks
```bash
# Check application health
curl -f https://yourdomain.com/health
curl -f https://api.yourdomain.com/health

# Check SSL certificate expiration
openssl s_client -connect yourdomain.com:443 -servername yourdomain.com 2>/dev/null | openssl x509 -noout -dates
```

## Backup Strategy

### 1. Database Backup
```bash
# Create backup script
cat > /opt/studypal-app/backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/studypal"
mkdir -p $BACKUP_DIR

# Backup database
docker-compose -f docker-compose.prod.yml exec -T backend cp /app/prisma/prod.db /app/backup_${DATE}.db
docker cp studypal-backend-prod:/app/backup_${DATE}.db $BACKUP_DIR/
docker-compose -f docker-compose.prod.yml exec -T backend rm /app/backup_${DATE}.db

# Backup uploads
tar -czf $BACKUP_DIR/uploads_${DATE}.tar.gz -C /var/lib/docker/volumes/studypal-app_uploads_prod_data/_data .

# Keep only last 7 days of backups
find $BACKUP_DIR -type f -mtime +7 -delete
EOF

chmod +x /opt/studypal-app/backup.sh

# Add to cron
echo "0 2 * * * /opt/studypal-app/backup.sh" | crontab -
```

## Troubleshooting

### Common Issues

1. **Container fails to start**
   ```bash
   docker-compose -f docker-compose.prod.yml logs service-name
   ```

2. **SSL certificate issues**
   ```bash
   sudo certbot certificates
   sudo certbot renew --dry-run
   ```

3. **Database migration issues**
   ```bash
   docker-compose -f docker-compose.prod.yml exec backend npm run db:migrate
   ```

4. **Permission issues**
   ```bash
   sudo chown -R $USER:$USER /opt/studypal-app
   ```

Remember to replace all placeholder values (yourdomain.com, secrets, etc.) with your actual production values.