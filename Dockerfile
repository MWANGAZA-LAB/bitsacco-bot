# Bitsacco WhatsApp Bitcoin Assistant
# Multi-stage Docker build for production deployment

# Build stage
FROM node:20.15.1-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++ git

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci --include=dev

# Copy source code
COPY . .

# Run build process (linting, testing, etc.)
RUN npm run build

# Remove devDependencies
RUN npm prune --production

# Production stage
FROM node:20.15.1-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S bitsacco -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy production dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY --from=builder --chown=bitsacco:nodejs /app/src ./src
COPY --from=builder --chown=bitsacco:nodejs /app/logs ./logs

# Create necessary directories
RUN mkdir -p /app/.wwebjs_auth /app/.wwebjs_cache && \
    chown -R bitsacco:nodejs /app

# Set environment variables
ENV NODE_ENV=production
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PORT=3000

# Expose port
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Switch to non-root user
USER bitsacco

# Start application
CMD ["npm", "start"]

# Labels for better container management
LABEL maintainer="engineering@bitsacco.com" \
      version="1.0.0" \
      description="Bitsacco WhatsApp Bitcoin Assistant" \
      org.opencontainers.image.title="bitsacco-whatsapp-assistant" \
      org.opencontainers.image.description="Enterprise-grade WhatsApp Bitcoin Assistant" \
      org.opencontainers.image.vendor="Bitsacco" \
      org.opencontainers.image.version="1.0.0" \
      org.opencontainers.image.schema-version="1.0"
