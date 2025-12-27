# Publishing DDG Web Search MCP Server to Docker Hub

This guide explains how to publish the DDG Web Search **Model Context Protocol (MCP) Server** Docker images to Docker Hub.

## Overview

DDG Web Search is a comprehensive MCP server that provides:

- **Web Search Tool**: Search the web using DuckDuckGo with browser automation
- **Web Content Fetcher Tool**: Fetch and parse content from web pages
- **Multiple Transports**: Both stdio (default) and HTTP (SSE) support
- **Docker-Ready**: Pre-configured for easy Docker Hub deployment

## Prerequisites

### 1. Docker Hub Account

Create a free account at [hub.docker.com](https://hub.docker.com) if you don't have one.

### 2. Docker Installed

Ensure Docker is installed and running:

```bash
docker --version
docker info
```

### 3. Repository Access

You need write access to the Docker Hub repository. For this project:

- **Repository**: `realLV/ddg-web-search`
- **Owner**: realLV

## Quick Start

### Option 1: Interactive Script (Recommended)

The easiest way to publish an MCP server image:

```bash
./docker-publish.sh
```

This script will:

1. ✅ Check Docker installation and login status
2. 🔐 Prompt for Docker Hub credentials if needed
3. 📦 Let you choose the version to publish
4. 🏗️ Build the MCP server image
5. ✓ Run tests (MCP server and CLI verification)
6. 🚀 Push to Docker Hub
7. 📋 Display usage information for MCP deployments

### Option 2: Using npm

```bash
npm run docker:publish
```

### Option 3: Using Make

```bash
# Simple publish (uses package.json version)
make docker-publish

# Or use the interactive script
make docker-publish-script

# Multi-architecture publish
make docker-publish-multiarch
```

## Step-by-Step Manual Process

### 1. Login to Docker Hub

```bash
docker login
# Enter your Docker Hub username and password
```

Or with environment variables:

```bash
export DOCKER_USERNAME=realLV
export DOCKER_PASSWORD=your-password
echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
```

### 2. Build the MCP Server Image

```bash
# Build production image
docker build -t realLV/ddg-web-search:1.0.6 .

# Also tag as latest
docker tag realLV/ddg-web-search:1.0.6 realLV/ddg-web-search:latest
```

### 3. Test the MCP Server Image

#### Test CLI

```bash
docker run --rm realLV/ddg-web-search:1.0.6 node dist/cli.js help
docker run --rm realLV/ddg-web-search:1.0.6 node dist/cli.js version
```

#### Test MCP Server (Stdio Transport)

```bash
# Test that MCP server binary exists
docker run --rm realLV/ddg-web-search:1.0.6 test -f dist/mcp.js && echo "✓ MCP server binary present"
```

#### Test MCP Server (HTTP Transport)

```bash
# Start HTTP transport server
docker run -d -p 3001:3001 --name test-ddg \
  realLV/ddg-web-search:1.0.6 \
  node dist/mcp.js --transport http --port 3001 --host 0.0.0.0

# Wait for startup
sleep 3

# Health check
curl http://localhost:3001/

# Cleanup
docker stop test-ddg && docker rm test-ddg
```

### 4. Push to Docker Hub

```bash
# Push versioned tag
docker push realLV/ddg-web-search:1.0.6

# Push latest tag
docker push realLV/ddg-web-search:latest
```

### 5. Verify on Docker Hub

Visit: https://hub.docker.com/r/realLV/ddg-web-search

## Docker Image Specifications

### Base Configuration

- **Base Image**: `node:20-alpine`
- **Additional Tools**: Chromium, Puppeteer (for browser automation)
- **Size**: ~400-500MB (optimized with multi-stage build)
- **User**: Non-root user `nodejs` (UID 1001) for security

### Image Metadata (OCI Labels)

The image includes comprehensive metadata for Docker Hub discovery:

```dockerfile
LABEL org.opencontainers.image.title="DDG Web Search MCP Server"
LABEL org.opencontainers.image.description="A Model Context Protocol server..."
LABEL org.opencontainers.image.vendor="DDG Web Search Contributors"
LABEL org.mcp.transports="stdio,http"
LABEL org.mcp.tools="search,fetch_web_content"
```

### Available Transports

#### Stdio Transport (Default)

```bash
docker run -it realLV/ddg-web-search:latest node dist/mcp.js
```

**Use for:**

- Direct client connections
- Standard input/output streams
- Local machine usage

#### HTTP Transport (SSE)

```bash
docker run -p 3001:3001 realLV/ddg-web-search:latest \
  node dist/mcp.js --transport http --port 3001 --host 0.0.0.0
```

**Use for:**

- Remote server deployments
- Multiple client connections
- HTTP client integrations

## Publishing Multi-Architecture Images

To support both AMD64 and ARM64 (Intel/Apple Silicon):

### Setup Buildx (One Time)

```bash
docker buildx create --use --name multi-arch-builder
docker buildx inspect --bootstrap
```

### Build and Push Multi-Arch

```bash
# Using Make
make docker-publish-multiarch

# Or manually
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t realLV/ddg-web-search:1.0.6 \
  -t realLV/ddg-web-search:latest \
  --push .
```

This creates images for:

- **linux/amd64**: Intel/AMD processors
- **linux/arm64**: ARM processors (M1/M2/M3 Macs, ARM servers)

## Versioning Strategy

### Semantic Versioning

Follow semantic versioning (MAJOR.MINOR.PATCH):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Tag Strategy

For version `1.0.6`, create these tags:

```bash
realLV/ddg-web-search:1.0.6    # Exact version
realLV/ddg-web-search:1.0      # Minor version
realLV/ddg-web-search:1        # Major version
realLV/ddg-web-search:latest   # Latest stable
```

Example:

```bash
docker tag realLV/ddg-web-search:1.0.6 realLV/ddg-web-search:1.0
docker tag realLV/ddg-web-search:1.0.6 realLV/ddg-web-search:1
docker tag realLV/ddg-web-search:1.0.6 realLV/ddg-web-search:latest

docker push realLV/ddg-web-search:1.0.6
docker push realLV/ddg-web-search:1.0
docker push realLV/ddg-web-search:1
docker push realLV/ddg-web-search:latest
```

## Automated Publishing with GitHub Actions

The project includes a GitHub Actions workflow that automatically:

1. Builds images on every push
2. Runs tests
3. Scans for vulnerabilities
4. Pushes to GitHub Container Registry

To also push to Docker Hub automatically, add these secrets to your GitHub repository:

```
DOCKERHUB_USERNAME: realLV
DOCKERHUB_TOKEN: your-docker-hub-token
```

Then update `.github/workflows/docker.yml` to include Docker Hub push.

## Environment Variables for CI/CD

```bash
# Docker Hub credentials
DOCKER_USERNAME=realLV
DOCKER_PASSWORD=your-password-or-token

# Or use Docker Hub token (more secure)
DOCKERHUB_TOKEN=your-access-token
```

## Publishing Checklist

Before publishing to Docker Hub:

- [ ] Update version in `package.json`
- [ ] Update `CHANGELOG.md` (if exists)
- [ ] Run tests: `npm test`
- [ ] Build image: `docker build -t ddg-web-search .`
- [ ] Test image: `./docker-test.sh`
- [ ] Scan for vulnerabilities: `docker scan ddg-web-search`
- [ ] Tag appropriately
- [ ] Push to Docker Hub
- [ ] Verify on Docker Hub
- [ ] Update README.md with new version
- [ ] Create Git tag: `git tag v1.0.6`
- [ ] Push tag: `git push origin v1.0.6`

## Using Published Images

### Quick Start with Docker

#### HTTP Server (Recommended)

```bash
docker run -d -p 3001:3001 \
  --name ddg-mcp \
  realLV/ddg-web-search:latest \
  node dist/mcp.js --transport http --port 3001 --host 0.0.0.0

# Verify
curl http://localhost:3001/
```

#### Stdio Server

```bash
docker run -it realLV/ddg-web-search:latest node dist/mcp.js
```

#### CLI Interactive

```bash
docker run -it realLV/ddg-web-search:latest node dist/cli.js interactive
```

### Using Docker Compose

#### HTTP Transport

```bash
docker-compose --profile http up
```

#### Stdio Transport

```bash
docker-compose --profile stdio up
```

#### CLI

```bash
docker-compose --profile cli up
```

### Environment Variables

```bash
# Standard environment variables
NODE_ENV=production                    # Default: production
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
```

### Health Checks

The image includes automatic health checks for HTTP transport:

```bash
# Check container health
docker inspect --format='{{.State.Health.Status}}' ddg-mcp

# Expected output: "healthy"
```

````

## Troubleshooting

### Login Issues

```bash
# Clear credentials
docker logout

# Login again
docker login
````

### Push Failures

```bash
# Check you're logged in
docker info | grep Username

# Check image exists
docker images | grep ddg-web-search

# Check image is tagged correctly
docker images realLV/ddg-web-search
```

### Multi-Arch Build Issues

```bash
# Remove and recreate builder
docker buildx rm multi-arch-builder
docker buildx create --use --name multi-arch-builder

# Inspect available platforms
docker buildx inspect --bootstrap
```

### Rate Limiting

Docker Hub has rate limits for pulls:

- **Anonymous**: 100 pulls per 6 hours
- **Free account**: 200 pulls per 6 hours
- **Pro/Team**: Unlimited

Consider:

- Using Docker Hub authentication
- Caching layers in CI/CD
- Using a paid plan if needed

## Security Best Practices

### 1. Use Access Tokens

Instead of password, use Docker Hub access tokens:

1. Go to https://hub.docker.com/settings/security
2. Create new access token
3. Use token instead of password

```bash
docker login -u realLV --password-stdin < token.txt
```

### 2. Scan Images Before Publishing

```bash
# Using Docker scan
docker scan realLV/ddg-web-search:1.0.6

# Using Trivy
trivy image realLV/ddg-web-search:1.0.6
```

### 3. Sign Images (Optional)

Use Docker Content Trust:

```bash
export DOCKER_CONTENT_TRUST=1
docker push realLV/ddg-web-search:1.0.6
```

### 4. Keep Credentials Safe

- Never commit credentials to Git
- Use environment variables
- Use CI/CD secrets
- Rotate tokens regularly

## Repository Settings

Recommended Docker Hub repository settings:

### Description

```
A comprehensive package for searching the web and fetching web content using DuckDuckGo.
Includes CLI, programmatic API, and Model Context Protocol (MCP) server support.
```

### README

Link to GitHub README or create Docker Hub specific README.

### Build Settings

- ✅ Enable automated builds (optional)
- ✅ Link to GitHub repository
- ✅ Configure build rules for tags

### Visibility

- Choose **Public** for open-source
- Or **Private** if needed (requires paid plan)

## Maintenance

### Regular Updates

1. Update base image regularly:

   ```bash
   docker pull node:20-alpine
   docker build --no-cache -t realLV/ddg-web-search:latest .
   ```

2. Scan for vulnerabilities monthly:

   ```bash
   docker scan realLV/ddg-web-search:latest
   ```

3. Update documentation with new versions

4. Archive old versions if needed

### Deprecation

When deprecating a version:

1. Update Docker Hub description
2. Add deprecation notice to README
3. Keep image available for transition period
4. Document migration path

## Support

For issues or questions:

1. Check [Docker Hub](https://hub.docker.com/r/realLV/ddg-web-search)
2. Open issue on [GitHub](https://github.com/realLV/ddg-web-search)
3. Check [DOCKER.md](./DOCKER.md) for troubleshooting

## Additional Resources

- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
- [Docker Build Documentation](https://docs.docker.com/build/)
- [Docker Content Trust](https://docs.docker.com/engine/security/trust/)
- [Docker Hub Rate Limiting](https://docs.docker.com/docker-hub/download-rate-limit/)

---

**Ready to publish?** Run `./docker-publish.sh` to get started! 🚀
