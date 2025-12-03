# Docker Quick Reference Card

Quick reference for common Docker commands and operations for DDG Web Search.

## 🚀 Quick Start (Choose One)

```bash
# Interactive menu
./docker-start.sh

# Using npm
npm run docker:compose:http

# Using Make
make quick-start-http

# Direct Docker
docker build -t ddg-web-search . && docker run -p 3001:3001 ddg-web-search \
  node dist/mcp.js --transport http --port 3001 --host 0.0.0.0
```

## 📦 Building

```bash
# Production image
docker build -t ddg-web-search .
npm run docker:build
make build

# Development image
docker build -f Dockerfile.dev -t ddg-web-search:dev .
npm run docker:build:dev
make build-dev
```

## ▶️ Running

### HTTP Server

```bash
docker run -p 3001:3001 ddg-web-search node dist/mcp.js --transport http --port 3001 --host 0.0.0.0
npm run docker:run:http
make run-http
```

### Stdio Server

```bash
docker run -it ddg-web-search
npm run docker:run
make run
```

### CLI Interactive

```bash
docker run -it ddg-web-search node dist/cli.js interactive
npm run docker:run:cli
make run-cli
```

## 🎼 Docker Compose

```bash
# HTTP server
docker-compose --profile http up
npm run docker:compose:http
make compose-http

# Development
docker-compose -f docker-compose.dev.yml up
npm run docker:compose:dev
make compose-dev

# Production with monitoring
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# Stop all
docker-compose down && docker-compose -f docker-compose.dev.yml down
npm run docker:compose:down
make compose-down
```

## 🧪 Testing

```bash
# Run test suite
./docker-test.sh
npm run docker:test
make test

# Run specific tests
docker run --rm ddg-web-search npm test
make test-dev
```

## 📊 Monitoring

```bash
# View logs
docker logs -f ddg-mcp-http
docker-compose logs -f
make logs

# Resource stats
docker stats
make stats

# Health check
docker inspect --format='{{.State.Health.Status}}' ddg-mcp-http
make health

# Container processes
docker top ddg-mcp-http
```

## 🛠️ Management

```bash
# Stop containers
docker stop ddg-mcp-http
make stop

# Remove containers
docker rm ddg-mcp-http
make remove

# Clean up images
docker rmi ddg-web-search
make clean

# Full cleanup
docker system prune -a
make clean-all
```

## 🔍 Debugging

```bash
# Open shell in running container
docker exec -it ddg-mcp-http sh
make shell-running

# Run shell in new container
docker run -it ddg-web-search sh
make run-shell

# View container details
docker inspect ddg-mcp-http
make inspect

# View logs
docker logs -f ddg-mcp-http
make logs
```

## 🌐 Testing Endpoints

```bash
# HTTP server health
curl http://localhost:3001/

# SSE endpoint
curl -N http://localhost:3001/sse

# Search (POST to message endpoint)
# See DOCKER.md for full examples
```

## 📋 Common Workflows

### Development Workflow

```bash
# 1. Start development environment
docker-compose -f docker-compose.dev.yml up

# 2. Make code changes (auto-reloads)

# 3. Run tests
docker-compose -f docker-compose.dev.yml --profile test up ddg-test

# 4. Stop when done
docker-compose -f docker-compose.dev.yml down
```

### Production Deployment

```bash
# 1. Build production image
docker build -t ddg-web-search:latest .

# 2. Test image
./docker-test.sh

# 3. Deploy
docker-compose -f docker-compose.prod.yml up -d

# 4. Verify
curl http://localhost:3001/
docker-compose -f docker-compose.prod.yml ps

# 5. Monitor
docker-compose -f docker-compose.prod.yml logs -f
```

### Debugging Issues

```bash
# 1. Check logs
docker logs -f ddg-mcp-http

# 2. Check health
docker inspect --format='{{.State.Health.Status}}' ddg-mcp-http

# 3. Check resources
docker stats

# 4. Open shell for investigation
docker exec -it ddg-mcp-http sh

# 5. Run tests
./docker-test.sh
```

## 🔑 Environment Variables

```bash
# Set environment variables
docker run -e NODE_ENV=production -e CUSTOM_VAR=value ddg-web-search

# Using .env file
docker run --env-file .env ddg-web-search

# In docker-compose.yml
environment:
  - NODE_ENV=production
  - PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

## 🔒 Security

```bash
# Scan for vulnerabilities
docker scan ddg-web-search:latest
trivy image ddg-web-search:latest

# Check user
docker exec ddg-mcp-http whoami
# Should output: nodejs (not root)

# Update base image
docker pull node:20-alpine
docker build --no-cache -t ddg-web-search .
```

## 📏 Resource Limits

```bash
# Set memory limit
docker run --memory=512m ddg-web-search

# Set CPU limit
docker run --cpus=1.0 ddg-web-search

# Both
docker run --memory=512m --cpus=1.0 ddg-web-search

# In docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 512M
```

## 🌍 Cloud Deployments

### AWS ECR

```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account>.dkr.ecr.us-east-1.amazonaws.com
docker tag ddg-web-search:latest <account>.dkr.ecr.us-east-1.amazonaws.com/ddg-web-search:latest
docker push <account>.dkr.ecr.us-east-1.amazonaws.com/ddg-web-search:latest
```

### Google GCR

```bash
gcloud auth configure-docker
docker tag ddg-web-search:latest gcr.io/<project-id>/ddg-web-search:latest
docker push gcr.io/<project-id>/ddg-web-search:latest
```

### Azure ACR

```bash
az acr login --name <registry-name>
docker tag ddg-web-search:latest <registry-name>.azurecr.io/ddg-web-search:latest
docker push <registry-name>.azurecr.io/ddg-web-search:latest
```

## 🎯 Make Targets Reference

```bash
make help              # Show all available targets
make build             # Build production image
make run-http          # Run HTTP server
make compose-dev       # Start development environment
make test              # Run tests
make logs              # View logs
make stats             # Show resource usage
make clean             # Clean up containers/images
make quick-start-http  # Build and run (quickest way)
```

## 📝 npm Scripts Reference

```bash
npm run docker:build              # Build production image
npm run docker:run:http           # Run HTTP server
npm run docker:compose:dev        # Start development
npm run docker:test               # Run test suite
npm run docker:start              # Interactive menu
```

## 📚 Documentation

- `README.md` - Project overview and basic usage
- `DOCKER.md` - Comprehensive Docker guide (15KB+)
- `DEPLOYMENT.md` - Production deployment guide (13KB+)
- `DOCKER-SUMMARY.md` - Implementation summary
- `DOCKER-QUICK-REF.md` - This quick reference

## 🆘 Help & Troubleshooting

```bash
# Check if Docker is running
docker ps

# Check Docker version
docker --version
docker-compose --version

# View Docker system info
docker info

# View disk usage
docker system df

# Clean up unused resources
docker system prune -f

# Get detailed help
docker run ddg-web-search node dist/cli.js help
./docker-start.sh
make help
```

## 🔗 Useful Links

- Docker Hub: https://hub.docker.com/
- Docker Docs: https://docs.docker.com/
- Compose Docs: https://docs.docker.com/compose/
- GitHub Actions: https://github.com/features/actions

## 💡 Tips

1. **Use profiles** in docker-compose for different scenarios
2. **Set resource limits** to prevent container from consuming too much
3. **Use .dockerignore** to keep images small
4. **Tag images** with versions for easier rollback
5. **Monitor logs** regularly for issues
6. **Run security scans** periodically
7. **Use health checks** for production deployments
8. **Keep base images updated** for security patches
9. **Use volumes** for persistent data
10. **Use networks** for service isolation

---

**Pro Tip:** Bookmark this file or keep it open while working with Docker!
