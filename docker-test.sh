#!/bin/bash

# Docker Test Script for DDG Web Search
# This script tests Docker images and containers

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
IMAGE_NAME="ddg-web-search"
TEST_CONTAINER="ddg-test-container"
HTTP_PORT=3001
FAILED_TESTS=0
PASSED_TESTS=0

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_TESTS++))
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_TESTS++))
}

print_test() {
    echo -e "${YELLOW}[TEST]${NC} $1"
}

# Function to clean up test containers
cleanup() {
    print_info "Cleaning up test containers..."
    docker stop $TEST_CONTAINER 2>/dev/null || true
    docker rm $TEST_CONTAINER 2>/dev/null || true
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Test 1: Check if Docker image exists
test_image_exists() {
    print_test "Checking if Docker image exists..."
    if docker image inspect $IMAGE_NAME &> /dev/null; then
        print_success "Docker image '$IMAGE_NAME' exists"
        return 0
    else
        print_error "Docker image '$IMAGE_NAME' not found"
        return 1
    fi
}

# Test 2: Check image size
test_image_size() {
    print_test "Checking image size..."
    local size=$(docker image inspect $IMAGE_NAME --format='{{.Size}}' | awk '{print $1/1024/1024}')
    local size_mb=$(printf "%.0f" $size)
    
    if [ $size_mb -lt 500 ]; then
        print_success "Image size is reasonable: ${size_mb}MB"
        return 0
    else
        print_warning "Image size is large: ${size_mb}MB (consider optimization)"
        return 0
    fi
}

# Test 3: Test CLI help command
test_cli_help() {
    print_test "Testing CLI help command..."
    if docker run --rm $IMAGE_NAME node dist/cli.js help &> /dev/null; then
        print_success "CLI help command works"
        return 0
    else
        print_error "CLI help command failed"
        return 1
    fi
}

# Test 4: Test CLI version command
test_cli_version() {
    print_test "Testing CLI version command..."
    local version=$(docker run --rm $IMAGE_NAME node dist/cli.js version 2>&1)
    if [ ! -z "$version" ]; then
        print_success "CLI version command works: $version"
        return 0
    else
        print_error "CLI version command failed"
        return 1
    fi
}

# Test 5: Test HTTP server startup
test_http_server() {
    print_test "Testing HTTP server startup..."
    
    # Start container
    docker run -d -p $HTTP_PORT:$HTTP_PORT --name $TEST_CONTAINER $IMAGE_NAME \
        node dist/mcp.js --transport http --port $HTTP_PORT --host 0.0.0.0 &> /dev/null
    
    # Wait for server to start
    sleep 5
    
    # Test if server is responding
    if curl -s http://localhost:$HTTP_PORT/ &> /dev/null; then
        print_success "HTTP server is running and responding"
        return 0
    else
        print_error "HTTP server failed to start or not responding"
        docker logs $TEST_CONTAINER
        return 1
    fi
}

# Test 6: Test health check endpoint
test_health_check() {
    print_test "Testing health check endpoint..."
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$HTTP_PORT/)
    
    if [ "$response" = "200" ]; then
        print_success "Health check endpoint returns 200"
        return 0
    else
        print_error "Health check endpoint returned: $response"
        return 1
    fi
}

# Test 7: Test container health status
test_container_health() {
    print_test "Testing container health status..."
    
    # Wait for health check to run
    sleep 10
    
    local health_status=$(docker inspect --format='{{.State.Health.Status}}' $TEST_CONTAINER 2>/dev/null || echo "no healthcheck")
    
    if [ "$health_status" = "healthy" ] || [ "$health_status" = "no healthcheck" ]; then
        print_success "Container health status: $health_status"
        return 0
    else
        print_error "Container health status: $health_status"
        return 1
    fi
}

# Test 8: Test container user (security)
test_container_user() {
    print_test "Testing container runs as non-root user..."
    
    local user=$(docker exec $TEST_CONTAINER whoami 2>/dev/null || echo "root")
    
    if [ "$user" != "root" ]; then
        print_success "Container runs as non-root user: $user"
        return 0
    else
        print_warning "Container runs as root user (security concern)"
        return 0
    fi
}

# Test 9: Test Puppeteer/Chromium installation
test_puppeteer() {
    print_test "Testing Puppeteer/Chromium installation..."
    
    if docker exec $TEST_CONTAINER which chromium-browser &> /dev/null; then
        print_success "Chromium is installed"
        return 0
    else
        print_error "Chromium not found"
        return 1
    fi
}

# Test 10: Test environment variables
test_env_vars() {
    print_test "Testing environment variables..."
    
    local node_env=$(docker exec $TEST_CONTAINER sh -c 'echo $NODE_ENV')
    local puppeteer_path=$(docker exec $TEST_CONTAINER sh -c 'echo $PUPPETEER_EXECUTABLE_PATH')
    
    if [ "$node_env" = "production" ] && [ ! -z "$puppeteer_path" ]; then
        print_success "Environment variables are set correctly"
        return 0
    else
        print_error "Environment variables not set correctly"
        return 1
    fi
}

# Test 11: Test Docker Compose
test_docker_compose() {
    print_test "Testing Docker Compose configuration..."
    
    if docker-compose config &> /dev/null; then
        print_success "Docker Compose configuration is valid"
        return 0
    else
        print_error "Docker Compose configuration is invalid"
        return 1
    fi
}

# Test 12: Test .dockerignore
test_dockerignore() {
    print_test "Testing .dockerignore file..."
    
    if [ -f ".dockerignore" ]; then
        # Check if node_modules is ignored
        if grep -q "node_modules" .dockerignore; then
            print_success ".dockerignore file is properly configured"
            return 0
        else
            print_warning ".dockerignore exists but may be incomplete"
            return 0
        fi
    else
        print_error ".dockerignore file not found"
        return 1
    fi
}

# Main test execution
main() {
    echo ""
    echo "========================================"
    echo "   DDG Web Search - Docker Tests"
    echo "========================================"
    echo ""
    
    print_info "Starting Docker tests..."
    echo ""
    
    # Run tests
    test_image_exists || exit 1
    test_image_size
    test_dockerignore
    test_docker_compose
    test_cli_help
    test_cli_version
    test_http_server
    test_health_check
    test_container_health
    test_container_user
    test_puppeteer
    test_env_vars
    
    # Print summary
    echo ""
    echo "========================================"
    echo "           Test Summary"
    echo "========================================"
    echo -e "${GREEN}Passed:${NC} $PASSED_TESTS"
    echo -e "${RED}Failed:${NC} $FAILED_TESTS"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}All tests passed! ✓${NC}"
        exit 0
    else
        echo -e "${RED}Some tests failed! ✗${NC}"
        exit 1
    fi
}

# Run main function
main
