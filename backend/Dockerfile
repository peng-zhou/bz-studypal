# Use Node.js 18 as base image
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma/ ./prisma/

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Generate Prisma Client
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001

# Create uploads directory and set permissions
RUN mkdir -p /app/uploads && \
    chown -R nodeuser:nodejs /app && \
    chmod -R 755 /app

# Switch to non-root user
USER nodeuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8000/health', (res) => { \
    process.exit(res.statusCode === 200 ? 0 : 1); \
  }).on('error', () => process.exit(1));"

# Start the application
CMD ["npm", "start"]