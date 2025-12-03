# Makefile for DDG Web Search Docker operations

.PHONY: help build build-dev run run-http run-cli compose-http compose-stdio compose-cli compose-dev compose-test clean test

# Default target
.DEFAULT_GOAL := help

# Variables
IMAGE_NAME := ddg-web-search
DEV_IMAGE_NAME := ddg-web-search:dev
CONTAINER_NAME := ddg-web-search-container
HTTP_PORT := 3001
DOCKER_USERNAME := realLV
DOCKER_REPO := $(DOCKER_USERNAME)/$(IMAGE_NAME)
VERSION := $(shell node -p "require('./package.json').version")

## Help
help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

## Building
build: ## Build production Docker image
	docker build -t $(IMAGE_NAME) .

build-dev: ## Build development Docker image
	docker build -f Dockerfile.dev -t $(DEV_IMAGE_NAME) .

build-all: build build-dev ## Build both production and development images

## Running (Direct Docker)
run: ## Run container with stdio transport (interactive)
	docker run -it --name $(CONTAINER_NAME) $(IMAGE_NAME)

run-http: ## Run container with HTTP transport
	docker run -d -p $(HTTP_PORT):$(HTTP_PORT) --name $(CONTAINER_NAME)-http $(IMAGE_NAME) \
		node dist/mcp.js --transport http --port $(HTTP_PORT) --host 0.0.0.0

run-cli: ## Run CLI in interactive mode
	docker run -it --name $(CONTAINER_NAME)-cli $(IMAGE_NAME) \
		node dist/cli.js interactive

run-shell: ## Run container with shell access
	docker run -it --name $(CONTAINER_NAME)-shell $(IMAGE_NAME) sh

## Docker Compose
compose-http: ## Start MCP server with HTTP transport using docker-compose
	docker-compose --profile http up

compose-http-detached: ## Start MCP server with HTTP transport in background
	docker-compose --profile http up -d

compose-stdio: ## Start MCP server with stdio transport using docker-compose
	docker-compose --profile stdio up

compose-cli: ## Start CLI using docker-compose
	docker-compose --profile cli up

compose-dev: ## Start development environment using docker-compose
	docker-compose -f docker-compose.dev.yml up

compose-dev-detached: ## Start development environment in background
	docker-compose -f docker-compose.dev.yml up -d

compose-test: ## Run tests using docker-compose
	docker-compose -f docker-compose.dev.yml --profile test up ddg-test

compose-down: ## Stop and remove all containers
	docker-compose down
	docker-compose -f docker-compose.dev.yml down

compose-restart: compose-down compose-http ## Restart docker-compose services

## Logs and Monitoring
logs: ## View logs from running container
	docker logs -f $(CONTAINER_NAME)-http

logs-compose: ## View logs from docker-compose services
	docker-compose logs -f

stats: ## Show container resource usage statistics
	docker stats $(CONTAINER_NAME)-http

inspect: ## Inspect container details
	docker inspect $(CONTAINER_NAME)-http

health: ## Check container health status
	docker inspect --format='{{.State.Health.Status}}' $(CONTAINER_NAME)-http

## Testing
test: ## Run tests in Docker container
	docker run --rm $(IMAGE_NAME) npm test

test-dev: ## Run tests in development container
	docker-compose -f docker-compose.dev.yml --profile test up ddg-test

## Cleanup
stop: ## Stop running containers
	-docker stop $(CONTAINER_NAME) $(CONTAINER_NAME)-http $(CONTAINER_NAME)-cli 2>/dev/null || true

remove: stop ## Remove containers
	-docker rm $(CONTAINER_NAME) $(CONTAINER_NAME)-http $(CONTAINER_NAME)-cli 2>/dev/null || true

clean: remove ## Clean up containers and images
	-docker rmi $(IMAGE_NAME) $(DEV_IMAGE_NAME) 2>/dev/null || true

clean-all: clean ## Clean up everything including volumes
	docker-compose down -v
	docker-compose -f docker-compose.dev.yml down -v
	docker system prune -f

## Utility
exec: ## Execute command in running container (usage: make exec CMD="ls -la")
	docker exec -it $(CONTAINER_NAME)-http $(CMD)

shell-running: ## Open shell in running container
	docker exec -it $(CONTAINER_NAME)-http sh

push: ## Push image to registry (requires login)
	docker push $(IMAGE_NAME)

pull: ## Pull image from registry
	docker pull $(IMAGE_NAME)

## Development helpers
rebuild: clean build ## Clean and rebuild production image

rebuild-dev: clean build-dev ## Clean and rebuild development image

rebuild-all: clean-all build-all ## Clean everything and rebuild all images

format: ## Format code using prettier
	npm run format

lint: ## Run linter (if configured)
	npm run lint 2>/dev/null || echo "No lint script configured"

## Quick start targets
quick-start-http: build run-http ## Build and run HTTP server (detached)
	@echo "Server started at http://localhost:$(HTTP_PORT)"
	@echo "Check logs with: make logs"
	@echo "Stop with: make stop"

quick-start-dev: build-dev compose-dev ## Build and start development environment
	@echo "Development server started"
	@echo "Check logs with: make logs-compose"

## Multi-architecture build (requires buildx)
buildx-setup: ## Setup buildx for multi-arch builds
	docker buildx create --use --name multi-arch-builder || true

buildx-build: buildx-setup ## Build multi-architecture image
	docker buildx build --platform linux/amd64,linux/arm64 -t $(IMAGE_NAME):latest .

buildx-push: buildx-setup ## Build and push multi-architecture image
	docker buildx build --platform linux/amd64,linux/arm64 -t $(IMAGE_NAME):latest --push .

## Docker Hub Publishing
docker-login: ## Login to Docker Hub
	docker login

docker-tag: ## Tag image for Docker Hub
	docker tag $(IMAGE_NAME):latest $(DOCKER_REPO):$(VERSION)
	docker tag $(IMAGE_NAME):latest $(DOCKER_REPO):latest

docker-push: docker-tag ## Push image to Docker Hub
	docker push $(DOCKER_REPO):$(VERSION)
	docker push $(DOCKER_REPO):latest

docker-publish: build docker-push ## Build and publish to Docker Hub
	@echo "Published to Docker Hub:"
	@echo "  docker pull $(DOCKER_REPO):$(VERSION)"
	@echo "  docker pull $(DOCKER_REPO):latest"

docker-publish-script: ## Run interactive publish script
	./docker-publish.sh

docker-pull: ## Pull image from Docker Hub
	docker pull $(DOCKER_REPO):latest

docker-publish-multiarch: buildx-setup ## Build and publish multi-architecture images
	docker buildx build --platform linux/amd64,linux/arm64 \
		-t $(DOCKER_REPO):$(VERSION) \
		-t $(DOCKER_REPO):latest \
		--push .
