#!/bin/bash

# Quick Docker Hub Publish Script
# Simple one-command publish for common cases

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

VERSION=$(node -p "require('./package.json').version")
DOCKER_REPO="realLV/ddg-web-search"

echo -e "${BLUE}Quick Docker Hub Publish${NC}"
echo "Version: $VERSION"
echo ""

# Check if logged in
if ! docker info 2>&1 | grep -q "Username"; then
    echo "Please login to Docker Hub first:"
    docker login
fi

# Build
echo -e "${GREEN}Building image...${NC}"
docker build -t $DOCKER_REPO:$VERSION .
docker tag $DOCKER_REPO:$VERSION $DOCKER_REPO:latest

# Test
echo -e "${GREEN}Testing image...${NC}"
docker run --rm $DOCKER_REPO:$VERSION node dist/cli.js version

# Push
echo -e "${GREEN}Pushing to Docker Hub...${NC}"
docker push $DOCKER_REPO:$VERSION
docker push $DOCKER_REPO:latest

echo ""
echo -e "${GREEN}Published successfully!${NC}"
echo ""
echo "Pull commands:"
echo "  docker pull $DOCKER_REPO:$VERSION"
echo "  docker pull $DOCKER_REPO:latest"
echo ""
echo "Docker Hub: https://hub.docker.com/r/$DOCKER_REPO"
