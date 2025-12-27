# DDG Web Search MCP Server - Docker Hub Deployment Quick Reference

## 🚀 Quick Start

```bash
# 1. Test locally
docker build -t ddg-web-search .

# 2. Publish to Docker Hub
./docker-publish.sh

# Or using Make
make docker-publish

# Or with npm
npm run docker:publish
```

## 📦 Available Images

After publishing, users can run:

### HTTP Server (Recommended)

```bash
docker run -p 3001:3001 realLV/ddg-web-search:latest \
  node dist/mcp.js --transport http --port 3001 --host 0.0.0.0
```

### Stdio Server

```bash
docker run -it realLV/ddg-web-search:latest node dist/mcp.js
```

### CLI

```bash
docker run -it realLV/ddg-web-search:latest node dist/cli.js interactive
```

### Docker Compose

```bash
docker-compose --profile http up      # HTTP server
docker-compose --profile stdio up     # Stdio server
docker-compose --profile cli up       # CLI
```

## 🔧 Files Modified/Created

| File                 | Status      | Purpose                            |
| -------------------- | ----------- | ---------------------------------- |
| `Dockerfile`         | ✏️ Updated  | MCP labels and metadata            |
| `Dockerfile.prod`    | ✨ New      | Production-optimized variant       |
| `docker-compose.yml` | ✏️ Updated  | MCP service configurations         |
| `docker-publish.sh`  | ✏️ Updated  | MCP-specific tests                 |
| `DOCKER-HUB.md`      | ✏️ Updated  | Comprehensive MCP deployment guide |
| `.dockerignore`      | ✅ Existing | Build context optimization         |
| `Makefile`           | ✅ Verified | Docker Hub targets ready           |

## 📋 MCP Server Capabilities

- **Default Transport**: Stdio (stdin/stdout)
- **HTTP Transport**: Port 3001 (Server-Sent Events)
- **Available Tools**:
  - `search` - Search the web using DuckDuckGo
  - `fetch_web_content` - Fetch and parse web pages

## 🎯 Key Features

✅ Multi-architecture support (amd64, arm64)  
✅ OCI-compliant image labels  
✅ Non-root user execution (nodejs:1001)  
✅ Health checks for HTTP transport  
✅ Comprehensive metadata  
✅ Docker Compose support  
✅ Automated testing in publish script  
✅ Security best practices

## 🔐 Image Details

- **Base Image**: node:20-alpine + Chromium
- **Size**: ~400-500MB
- **User**: nodejs (UID 1001) - non-root
- **Exposed Port**: 3001 (HTTP transport)
- **Health Check**: Included for HTTP transport

## 📖 Documentation

1. **DOCKER-HUB.md** - Complete publishing and deployment guide
2. **DOCKER-DEPLOYMENT-UPDATE.md** - Summary of all changes
3. **DOCKER.md** - General Docker usage guide
4. **README.md** - Project overview

## 🏗️ Multi-Architecture Build

```bash
# One-time setup
docker buildx create --use --name multi-arch-builder

# Build and push for amd64 + arm64
make docker-publish-multiarch

# Or manually
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t realLV/ddg-web-search:latest \
  --push .
```

## ✅ Pre-Publish Checklist

- [ ] Update version in package.json
- [ ] Run tests: `npm test`
- [ ] Build locally: `docker build -t ddg-web-search .`
- [ ] Test image: `npm run docker:compose:http`
- [ ] Scan image: `docker scan ddg-web-search`
- [ ] Ready to publish

## 🌐 Docker Hub Repository

**URL**: https://hub.docker.com/r/realLV/ddg-web-search

After publishing:

- Images available with `docker pull realLV/ddg-web-search:latest`
- Version tags: `realLV/ddg-web-search:1.0.6`
- Multi-arch support: Works on Intel and Apple Silicon

## 🔗 MCP Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Docker Hub Documentation](https://docs.docker.com/docker-hub/)
- [OCI Image Specification](https://github.com/opencontainers/image-spec)

## ❓ Common Tasks

### Login to Docker Hub

```bash
docker login
```

### Test Publishing Script

```bash
./docker-publish.sh
# Follows interactive prompts
```

### Check Image Labels

```bash
docker inspect realLV/ddg-web-search:latest | grep -A20 Labels
```

### Test HTTP Server

```bash
docker run -d -p 3001:3001 ddg-web-search:latest \
  node dist/mcp.js --transport http --port 3001 --host 0.0.0.0
curl http://localhost:3001/
```

### View Image Details

```bash
docker images realLV/ddg-web-search
docker inspect realLV/ddg-web-search:latest
```

## 🎉 You're Ready!

Your DDG Web Search MCP Server is fully configured for Docker Hub deployment. Simply run:

```bash
./docker-publish.sh
```

to get started! 🚀
