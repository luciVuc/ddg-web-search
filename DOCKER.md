# Docker Guide for DDG Web Search

This guide provides comprehensive instructions for using Docker with the DDG Web Search project.

## Table of Contents

- [Quick Start](#quick-start)
- [Docker Images](#docker-images)
- [Running with Docker](#running-with-docker)
- [Docker Compose](#docker-compose)
- [Development](#development)
- [Configuration](#configuration)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Build and Run

```bash
# Build the Docker image
docker build -t ddg-web-search .

# Run MCP server with stdio transport (default)
docker run -it ddg-web-search

# Run MCP server with HTTP transport
docker run -p 3001:3001 ddg-web-search \
  node dist/mcp.js --transport http --port 3001 --host 0.0.0.0

# Run CLI in interactive mode
docker run -it ddg-web-search node dist/cli.js interactive
```

### Using Docker Compose

```bash
# Run MCP server with HTTP transport
docker-compose --profile http up

# Run MCP server with stdio transport
docker-compose --profile stdio up

# Run CLI in interactive mode
docker-compose --profile cli up

# Run in development mode
docker-compose -f docker-compose.dev.yml up
```

## Docker Images

### Production Image

The production image is optimized for size and performance:

- **Base Image**: `node:20-alpine`
- **Size**: ~200-250MB
- **Features**:
  - Multi-stage build for smaller image size
  - Chromium pre-installed for Puppeteer
  - Non-root user for security
  - Health check for HTTP transport
  - Production-only dependencies

### Development Image

The development image includes additional tools:

- **Base Image**: `node:20-alpine`
- **Features**:
  - All dependencies (including dev dependencies)
  - Volume mounting for hot-reload
  - Debugger port exposed (9229)
  - Test runner support

## Running with Docker

### MCP Server

#### Stdio Transport (Default)

```bash
# Run with default stdio transport
docker run -it ddg-web-search

# With custom configuration
docker run -it \
  -e NODE_ENV=production \
  ddg-web-search
```

#### HTTP Transport

```bash
# Run with HTTP transport on default port (3001)
docker run -p 3001:3001 ddg-web-search \
  node dist/mcp.js --transport http --port 3001 --host 0.0.0.0

# Run with custom port
docker run -p 8080:8080 ddg-web-search \
  node dist/mcp.js --transport http --port 8080 --host 0.0.0.0

# Run in background (detached)
docker run -d -p 3001:3001 --name ddg-mcp ddg-web-search \
  node dist/mcp.js --transport http --port 3001 --host 0.0.0.0
```

### CLI

```bash
# Interactive mode
docker run -it ddg-web-search node dist/cli.js interactive

# Direct search
docker run ddg-web-search node dist/cli.js search "TypeScript tutorials"

# Fetch content
docker run ddg-web-search node dist/cli.js fetch https://example.com

# Show help
docker run ddg-web-search node dist/cli.js help
```

### Custom Commands

```bash
# Run a specific script
docker run ddg-web-search npm run start

# Execute shell in container
docker run -it ddg-web-search sh

# View logs
docker logs ddg-mcp
```

## Docker Compose

### Available Profiles

The project includes three Docker Compose profiles:

1. **http** - MCP server with HTTP transport
2. **stdio** - MCP server with stdio transport
3. **cli** - Interactive CLI

### Production Setup

```bash
# Start HTTP MCP server
docker-compose --profile http up

# Start stdio MCP server
docker-compose --profile stdio up

# Start CLI
docker-compose --profile cli up

# Start in detached mode
docker-compose --profile http up -d

# View logs
docker-compose logs -f ddg-mcp-http

# Stop services
docker-compose down
```

### Development Setup

```bash
# Start development environment
docker-compose -f docker-compose.dev.yml up

# Start with specific service
docker-compose -f docker-compose.dev.yml up ddg-dev

# Run tests
docker-compose -f docker-compose.dev.yml --profile test up ddg-test

# Rebuild after dependency changes
docker-compose -f docker-compose.dev.yml up --build

# Stop and remove volumes
docker-compose -f docker-compose.dev.yml down -v
```

## Development

### Hot Reload

The development setup supports hot-reload for source files:

```bash
# Start development server with volume mounting
docker-compose -f docker-compose.dev.yml up ddg-dev

# Make changes to files in src/ - they will be reflected in the container
```

### Running Tests

```bash
# Run tests using Docker Compose
docker-compose -f docker-compose.dev.yml --profile test up ddg-test

# Run tests directly
docker run -v $(pwd)/coverage:/app/coverage ddg-web-search npm test
```

### Debugging

```bash
# Start with debugger enabled
docker run -p 3001:3001 -p 9229:9229 ddg-web-search \
  node --inspect=0.0.0.0:9229 dist/mcp.js --transport http

# Connect your debugger to localhost:9229
```

## Configuration

### Environment Variables

Configure the container using environment variables:

```bash
# Set environment variables
docker run -e NODE_ENV=production \
  -e PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
  ddg-web-search

# Using Docker Compose
services:
  ddg-mcp:
    environment:
      - NODE_ENV=production
      - PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
      - CUSTOM_VAR=value
```

### Available Variables

- `NODE_ENV` - Node environment (production/development)
- `PUPPETEER_EXECUTABLE_PATH` - Path to Chromium executable
- `PUPPETEER_SKIP_CHROMIUM_DOWNLOAD` - Skip Chromium download (set to true)

### Port Mapping

```bash
# Map to different host port
docker run -p 8080:3001 ddg-web-search \
  node dist/mcp.js --transport http --port 3001

# Multiple ports
docker run -p 3001:3001 -p 9229:9229 ddg-web-search
```

### Volume Mounting

```bash
# Mount source code for development
docker run -v $(pwd)/src:/app/src:ro ddg-web-search

# Mount configuration file
docker run -v $(pwd)/config.json:/app/config.json:ro ddg-web-search

# Mount coverage output
docker run -v $(pwd)/coverage:/app/coverage ddg-web-search npm test
```

## Best Practices

### Security

1. **Non-root User**: The production image runs as a non-root user (nodejs:nodejs)
2. **Minimal Base Image**: Uses Alpine Linux for smaller attack surface
3. **Production Dependencies Only**: Only production dependencies in final image
4. **Health Checks**: Health check endpoint for monitoring

### Performance

1. **Multi-stage Build**: Reduces final image size
2. **Layer Caching**: Optimized layer ordering for faster builds
3. **Clean npm Cache**: Removes npm cache after installation
4. **Chromium Optimization**: Uses system Chromium instead of downloading

### Resource Management

```bash
# Limit memory and CPU
docker run --memory=512m --cpus=1.0 ddg-web-search

# Set restart policy
docker run --restart=unless-stopped ddg-web-search
```

## Troubleshooting

### Common Issues

#### Puppeteer/Chromium Issues

```bash
# Verify Chromium installation
docker run ddg-web-search which chromium-browser

# Check Puppeteer executable path
docker run ddg-web-search \
  node -e "console.log(process.env.PUPPETEER_EXECUTABLE_PATH)"

# Run with visible browser (requires X11 forwarding)
docker run -e DISPLAY=$DISPLAY -v /tmp/.X11-unix:/tmp/.X11-unix \
  ddg-web-search node dist/cli.js search "test"
```

#### Port Already in Use

```bash
# Check what's using the port
lsof -i :3001

# Use a different port
docker run -p 3002:3001 ddg-web-search \
  node dist/mcp.js --transport http --port 3001
```

#### Container Won't Start

```bash
# Check container logs
docker logs ddg-mcp

# Run with interactive shell to debug
docker run -it ddg-web-search sh

# Check health status
docker inspect --format='{{.State.Health.Status}}' ddg-mcp
```

#### Build Issues

```bash
# Clean build (no cache)
docker build --no-cache -t ddg-web-search .

# Check build logs
docker build -t ddg-web-search . 2>&1 | tee build.log

# Prune Docker system
docker system prune -a
```

### Performance Issues

```bash
# Monitor resource usage
docker stats ddg-mcp

# Increase memory limit
docker run --memory=1g ddg-web-search

# Check container processes
docker top ddg-mcp
```

### Networking Issues

```bash
# Test HTTP endpoint
curl http://localhost:3001/

# Check container network
docker network inspect ddg-network

# Connect to container network
docker run --network container:ddg-mcp curlimages/curl \
  curl http://localhost:3001/
```

## Advanced Usage

### Building for Multiple Architectures

```bash
# Build for multiple platforms
docker buildx build --platform linux/amd64,linux/arm64 \
  -t ddg-web-search:latest .

# Push to registry
docker buildx build --platform linux/amd64,linux/arm64 \
  -t myregistry/ddg-web-search:latest --push .
```

### Using with Docker Swarm

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.yml ddg-stack

# Scale service
docker service scale ddg-stack_ddg-mcp-http=3

# Remove stack
docker stack rm ddg-stack
```

### Health Monitoring

```bash
# Check health status
docker inspect --format='{{.State.Health.Status}}' ddg-mcp

# View health check logs
docker inspect --format='{{range .State.Health.Log}}{{.Output}}{{end}}' ddg-mcp

# Custom health check
docker run --health-cmd="node -e \"require('http').get('http://localhost:3001/', (r) => process.exit(r.statusCode === 200 ? 0 : 1))\"" \
  ddg-web-search
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Puppeteer Docker Documentation](https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-in-docker)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

## Contributing

When adding new features that affect Docker:

1. Update Dockerfile if new dependencies are needed
2. Update docker-compose.yml for new services
3. Update this documentation
4. Test with both production and development images
5. Ensure health checks still work
