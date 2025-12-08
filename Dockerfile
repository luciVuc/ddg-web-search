# Multi-stage Dockerfile for DDG Web Search
# Stage 1: Build stage
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Copy tsconfig
COPY tsconfig.json .

# Copy source files first (needed for npm prepublish script)
COPY src ./src

# Install all dependencies (including dev) for build
RUN npm ci && \
  npm cache clean --force

# Build the TypeScript project
RUN npm run build

# Stage 2: Production stage
FROM node:20-alpine

# Install Chromium and dependencies for Puppeteer
RUN apk add --no-cache \
  chromium \
  nss \
  freetype \
  harfbuzz \
  ca-certificates \
  ttf-freefont \
  nodejs \
  npm

# Set environment variables for Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
  PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
  NODE_ENV=production

# Create app directory and non-root user
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
  adduser -S nodejs -u 1001

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --ignore-scripts && \
  npm cache clean --force

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Copy additional files
COPY README.md LICENSE ./

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port for HTTP transport (default 3001)
EXPOSE 3001

# Health check for HTTP transport
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/', (r) => {if (r.statusCode !== 200) throw new Error('Health check failed')})"

# Default command: Run MCP server with stdio transport
CMD ["node", "dist/mcp.js"]

# Optional: Override with HTTP transport
# CMD ["node", "dist/mcp.js", "--transport", "http", "--port", "3001", "--host", "0.0.0.0"]
