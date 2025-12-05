# 🐳 Docker Hub Publishing - Complete Setup

## ✅ What Was Created

Complete Docker Hub publishing support has been added to the project:

### Scripts (3)

- ✅ **`docker-publish.sh`** - Interactive publishing script with tests
- ✅ **`docker-publish-quick.sh`** - Quick one-command publish
- ✅ **`.github/workflows/dockerhub-publish.yml.example`** - CI/CD example

### Documentation

- ✅ **`DOCKER-HUB.md`** - Comprehensive publishing guide
- ✅ Updated **`README.md`** with Docker Hub pull commands
- ✅ Updated **`Makefile`** with 8 new publish targets
- ✅ Updated **`package.json`** with 3 new npm scripts

### Configuration

- ✅ Makefile variables for Docker Hub repository
- ✅ Versioning from package.json
- ✅ Multi-architecture build support
- ✅ Automated tagging strategy

## 🚀 How to Publish

### Prerequisites

1. **Docker Hub Account**: Create at [hub.docker.com](https://hub.docker.com)
2. **Docker Running**: Ensure Docker is installed and running
3. **Repository Access**: Need access to `realLV/ddg-web-search` repo

### Method 1: Interactive Script (Easiest)

```bash
./docker-publish.sh
```

This will guide you through:

- Docker Hub login
- Version selection
- Building the image
- Testing (optional)
- Pushing to Docker Hub
- Displaying usage information

### Method 2: Quick Publish

```bash
./docker-publish-quick.sh
```

One-command publish using version from `package.json`:

- Builds image
- Tags as version and latest
- Tests basic functionality
- Pushes to Docker Hub

### Method 3: Using npm

```bash
# Interactive publish
npm run docker:publish

# Or using Make
npm run docker:publish:make

# Multi-architecture
npm run docker:publish:multiarch
```

### Method 4: Using Make

```bash
# Simple publish (single arch)
make docker-publish

# Interactive script
make docker-publish-script

# Multi-architecture (amd64 + arm64)
make docker-publish-multiarch

# Individual steps
make docker-login        # Login to Docker Hub
make docker-tag          # Tag images
make docker-push         # Push to Docker Hub
```

### Method 5: Manual Steps

```bash
# 1. Login
docker login

# 2. Build and tag
docker build -t realLV/ddg-web-search:1.0.5 .
docker tag realLV/ddg-web-search:1.0.5 realLV/ddg-web-search:latest

# 3. Test
docker run --rm realLV/ddg-web-search:1.0.5 node dist/cli.js version

# 4. Push
docker push realLV/ddg-web-search:1.0.5
docker push realLV/ddg-web-search:latest
```

## 📦 Available Tags

After publishing, images will be available with these tags:

- `latest` - Latest stable release
- `1.0.5` - Specific version (from package.json)
- `1.0` - Latest 1.0.x (optional)
- `1` - Latest 1.x (optional)

## 🌐 Using Published Images

Once published, anyone can use:

```bash
# Pull latest
docker pull realLV/ddg-web-search:latest

# Run HTTP server
docker run -p 3001:3001 realLV/ddg-web-search:latest \
  node dist/mcp.js --transport http --port 3001 --host 0.0.0.0

# Run CLI
docker run -it realLV/ddg-web-search:latest node dist/cli.js interactive

# Run specific version
docker pull realLV/ddg-web-search:1.0.5
```

## 🎯 Quick Start Guide

### First Time Setup

1. **Install Docker** (if not already installed)

   ```bash
   # Check if Docker is installed
   docker --version
   ```

2. **Create Docker Hub Account**
   - Go to [hub.docker.com](https://hub.docker.com)
   - Sign up for free account

3. **Login to Docker Hub**
   ```bash
   docker login
   # Enter username: realLV
   # Enter password/token
   ```

### Publishing a New Version

1. **Update Version**

   ```bash
   # Edit package.json and update version
   # Example: "version": "1.0.5"
   ```

2. **Build and Test Locally**

   ```bash
   npm run docker:build
   npm run docker:test
   ```

3. **Publish**

   ```bash
   # Option A: Interactive
   ./docker-publish.sh

   # Option B: Quick
   ./docker-publish-quick.sh

   # Option C: Make
   make docker-publish
   ```

4. **Verify**

   ```bash
   # Check on Docker Hub
   open https://hub.docker.com/r/realLV/ddg-web-search

   # Or test pull
   docker pull realLV/ddg-web-search:latest
   ```

## 📋 New Commands Added

### npm Scripts (3 new)

```bash
npm run docker:publish              # Interactive publish script
npm run docker:publish:make         # Using Make
npm run docker:publish:multiarch    # Multi-architecture
```

### Make Targets (8 new)

```bash
make docker-login                # Login to Docker Hub
make docker-tag                  # Tag for Docker Hub
make docker-push                 # Push to Docker Hub
make docker-publish              # Build and publish
make docker-publish-script       # Interactive script
make docker-publish-multiarch    # Multi-arch publish
make docker-pull                 # Pull from Docker Hub
make buildx-setup                # Setup multi-arch
```

## 🔐 Security Notes

### Using Access Tokens (Recommended)

Instead of password, use Docker Hub access tokens:

1. Go to https://hub.docker.com/settings/security
2. Click "New Access Token"
3. Name it (e.g., "GitHub Actions" or "CLI Publishing")
4. Copy the token
5. Use token as password when logging in

```bash
# Save token to file
echo "your-token-here" > ~/.docker-token

# Login using token
cat ~/.docker-token | docker login -u realLV --password-stdin

# Or set environment variable
export DOCKER_PASSWORD="your-token-here"
```

### CI/CD Setup

For GitHub Actions, add these secrets:

1. Go to GitHub repo → Settings → Secrets
2. Add:
   - `DOCKERHUB_USERNAME`: realLV
   - `DOCKERHUB_TOKEN`: your-access-token

## 📊 Multi-Architecture Support

To support both Intel/AMD (amd64) and Apple Silicon (arm64):

### Setup (One Time)

```bash
make buildx-setup
# Or
docker buildx create --use --name multi-arch-builder
```

### Publish Multi-Arch

```bash
# Using Make (easiest)
make docker-publish-multiarch

# Or manually
docker buildx build --platform linux/amd64,linux/arm64 \
  -t realLV/ddg-web-search:1.0.5 \
  -t realLV/ddg-web-search:latest \
  --push .
```

This creates images that work on:

- Intel/AMD computers (amd64)
- Apple M1/M2 Macs (arm64)
- Raspberry Pi (arm64)
- Cloud platforms (both architectures)

## 📚 Documentation Structure

All Docker Hub documentation:

```
DOCKER-HUB.md                    # Complete publishing guide (this is most detailed)
├── Publishing methods           # Interactive, npm, Make, manual
├── Versioning strategy          # Semantic versioning
├── Multi-architecture           # ARM64 + AMD64 support
├── CI/CD automation            # GitHub Actions integration
├── Security best practices      # Tokens, scanning
└── Troubleshooting             # Common issues

DOCKER-HUB-PUBLISH.md           # Quick start guide (this file)
├── What was created            # Files and scripts
├── How to publish              # 5 methods
├── Using published images      # Pull and run commands
└── Quick reference             # Commands and tips

README.md                        # Updated with Docker Hub pull commands
Makefile                         # 8 new publish targets
package.json                     # 3 new npm scripts
```

## 🎓 Learning Path

1. **First Time**: Use `./docker-publish.sh` (interactive)
2. **Regular Updates**: Use `./docker-publish-quick.sh` or `make docker-publish`
3. **Advanced**: Setup GitHub Actions for automatic publishing
4. **Multi-Arch**: Use `make docker-publish-multiarch`

## ✨ Features

- ✅ Interactive publishing with prompts
- ✅ Automatic version detection from package.json
- ✅ Built-in image testing before push
- ✅ Multi-architecture support (amd64 + arm64)
- ✅ Automatic tagging (version + latest)
- ✅ CI/CD ready (GitHub Actions example)
- ✅ Security best practices (token auth)
- ✅ Comprehensive documentation
- ✅ Multiple interfaces (script, npm, Make)
- ✅ Error handling and validation

## 🆘 Troubleshooting

### Docker Not Running

```bash
# Check if Docker is running
docker info

# If not, start Docker Desktop or Docker daemon
```

### Not Logged In

```bash
# Login to Docker Hub
docker login

# Check login status
docker info | grep Username
```

### Build Failures

```bash
# Check Dockerfile syntax
docker build --no-cache -t test .

# Run tests
./docker-test.sh
```

### Push Permission Denied

- Ensure you're logged in to Docker Hub
- Verify you have access to the repository
- Check repository name matches (realLV/ddg-web-search)

## 🎯 Next Steps

1. **Setup Docker Hub** (if not done)
   - Create account at hub.docker.com
   - Create repository: `realLV/ddg-web-search`

2. **Test Locally**

   ```bash
   ./docker-publish.sh
   ```

3. **Publish First Version**

   ```bash
   make docker-publish
   ```

4. **Setup Automation** (optional)
   - Add GitHub secrets
   - Enable Actions workflow
   - Automatic publish on release

5. **Announce**
   - Update README.md
   - Tweet about it
   - Add to Docker Hub description

## 📖 Additional Resources

- [Docker Hub Guide](./DOCKER-HUB.md) - Complete detailed guide
- [Docker Documentation](./DOCKER.md) - General Docker usage
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment
- [Quick Reference](./DOCKER-QUICK-REF.md) - Command cheat sheet

## 🎉 Ready to Publish!

Everything is set up and ready. Choose your preferred method and publish to Docker Hub:

```bash
# Easiest - Interactive with guidance
./docker-publish.sh

# Quickest - One command
./docker-publish-quick.sh

# Most control - Step by step
make docker-login
make docker-publish
```

**Docker Hub URL**: https://hub.docker.com/r/realLV/ddg-web-search

Happy publishing! 🚀
