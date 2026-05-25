# =============================================================================
# Stage 1: Builder — installs all deps, compiles TypeScript
# =============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only package files first (maximizes Docker layer cache)
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm ci --legacy-peer-deps

# Copy source code and static assets
COPY src ./src
COPY public ./public
COPY tsconfig*.json nest-cli.json ./

# Set production for build optimizations
ENV NODE_ENV=production

# Compile TypeScript → JavaScript
RUN npm run build

# =============================================================================
# Stage 2: Production — minimal image with only what's needed to run
# =============================================================================
FROM node:20-alpine AS production

# OCI standard labels (metadata for the image)
LABEL org.opencontainers.image.title="Service Order API"
LABEL org.opencontainers.image.description="API REST para gestão de ordens de serviço - Oficina Mecânica"
LABEL org.opencontainers.image.source="https://github.com/arthurfcs98/tech-challenge"
LABEL org.opencontainers.image.authors="Arthur Freitas"

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Copy package files and install ONLY production dependencies
COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps && \
    npm cache clean --force

# Copy compiled app and static assets from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Set ownership to non-root user
RUN chown -R nestjs:nodejs /app

# Switch to non-root user (never run as root in production)
USER nestjs

# Runtime configuration
ENV NODE_ENV=production
EXPOSE 3000

# Health check — verifies the API is responding
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/docs || exit 1

# Start the application. Migrations run in a separate K8s Job
# (dist/scripts/run-migrations.js) ahead of the deployment rollout —
# see .github/workflows/deploy.yml.
CMD ["node", "dist/main"]
