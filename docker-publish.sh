#!/bin/bash

# Docker Hub Publishing Script for DDG Web Search
# This script automates building and publishing Docker images to Docker Hub

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOCKER_USERNAME="${DOCKER_USERNAME:-realLV}"
IMAGE_NAME="ddg-web-search"
PACKAGE_VERSION=$(node -p "require('./package.json').version")
DEFAULT_VERSION="${PACKAGE_VERSION}"

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check if Docker is installed
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        echo "Visit: https://docs.docker.com/get-docker/"
        exit 1
    fi
    print_success "Docker is installed"
}

# Function to check if Docker daemon is running
check_docker_daemon() {
    if ! docker info &> /dev/null; then
        print_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi
    print_success "Docker daemon is running"
}

# Function to check Docker Hub login
check_docker_login() {
    if ! docker info 2>&1 | grep -q "Username"; then
        print_warning "Not logged in to Docker Hub"
        return 1
    fi
    print_success "Logged in to Docker Hub"
    return 0
}

# Function to login to Docker Hub
docker_login() {
    print_info "Logging in to Docker Hub..."
    print_info "Please enter your Docker Hub credentials"
    
    if [ -n "$DOCKER_PASSWORD" ]; then
        echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin
    else
        docker login -u "$DOCKER_USERNAME"
    fi
    
    if [ $? -eq 0 ]; then
        print_success "Successfully logged in to Docker Hub"
        return 0
    else
        print_error "Failed to login to Docker Hub"
        return 1
    fi
}

# Function to get version to publish
get_version() {
    local version="${1:-$DEFAULT_VERSION}"
    
    echo ""
    echo "Package version from package.json: $PACKAGE_VERSION"
    echo ""
    echo "Available version tags:"
    echo "  1) $PACKAGE_VERSION (from package.json)"
    echo "  2) latest"
    echo "  3) Custom version"
    echo ""
    
    read -p "Select version to publish [1]: " choice
    choice=${choice:-1}
    
    case $choice in
        1)
            version="$PACKAGE_VERSION"
            ;;
        2)
            version="latest"
            ;;
        3)
            read -p "Enter custom version: " custom_version
            version="$custom_version"
            ;;
        *)
            print_warning "Invalid choice, using package.json version"
            version="$PACKAGE_VERSION"
            ;;
    esac
    
    echo "$version"
}

# Function to build Docker image
build_image() {
    local version="$1"
    local full_image_name="$DOCKER_USERNAME/$IMAGE_NAME"
    
    print_info "Building Docker image: $full_image_name:$version"
    
    # Build the image
    docker build -t "$full_image_name:$version" .
    
    if [ $? -eq 0 ]; then
        print_success "Successfully built image: $full_image_name:$version"
        
        # Also tag as latest if this is a version number
        if [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+ ]]; then
            print_info "Tagging as latest..."
            docker tag "$full_image_name:$version" "$full_image_name:latest"
            print_success "Tagged as latest"
        fi
        
        return 0
    else
        print_error "Failed to build image"
        return 1
    fi
}

# Function to test image
test_image() {
    local version="$1"
    local full_image_name="$DOCKER_USERNAME/$IMAGE_NAME:$version"
    
    print_info "Testing image: $full_image_name"
    
    # Test CLI help command
    if docker run --rm "$full_image_name" node dist/cli.js help &> /dev/null; then
        print_success "CLI test passed"
    else
        print_error "CLI test failed"
        return 1
    fi
    
    # Test version command
    local image_version=$(docker run --rm "$full_image_name" node dist/cli.js version 2>&1 | head -1)
    print_info "Image version: $image_version"
    
    print_success "Image tests passed"
    return 0
}

# Function to push image to Docker Hub
push_image() {
    local version="$1"
    local full_image_name="$DOCKER_USERNAME/$IMAGE_NAME"
    
    print_info "Pushing image to Docker Hub: $full_image_name:$version"
    
    # Push the versioned tag
    docker push "$full_image_name:$version"
    
    if [ $? -eq 0 ]; then
        print_success "Successfully pushed: $full_image_name:$version"
        
        # Push latest tag if it exists
        if docker image inspect "$full_image_name:latest" &> /dev/null; then
            print_info "Pushing latest tag..."
            docker push "$full_image_name:latest"
            
            if [ $? -eq 0 ]; then
                print_success "Successfully pushed: $full_image_name:latest"
            fi
        fi
        
        return 0
    else
        print_error "Failed to push image to Docker Hub"
        return 1
    fi
}

# Function to display image info
display_image_info() {
    local version="$1"
    local full_image_name="$DOCKER_USERNAME/$IMAGE_NAME"
    
    echo ""
    echo "========================================="
    echo "       Published Image Information"
    echo "========================================="
    echo ""
    echo "Docker Hub URL:"
    echo "  https://hub.docker.com/r/$DOCKER_USERNAME/$IMAGE_NAME"
    echo ""
    echo "Pull command:"
    echo "  docker pull $full_image_name:$version"
    echo ""
    if [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+ ]]; then
        echo "Or use latest:"
        echo "  docker pull $full_image_name:latest"
        echo ""
    fi
    echo "Run command (HTTP server):"
    echo "  docker run -p 3001:3001 $full_image_name:$version \\"
    echo "    node dist/mcp.js --transport http --port 3001 --host 0.0.0.0"
    echo ""
    echo "Run command (CLI):"
    echo "  docker run -it $full_image_name:$version node dist/cli.js interactive"
    echo ""
    echo "========================================="
    echo ""
}

# Function to update documentation
update_documentation() {
    local version="$1"
    local full_image_name="$DOCKER_USERNAME/$IMAGE_NAME"
    
    print_info "Updating README.md with Docker Hub information..."
    
    # Note: This is informational - actual file editing should be done manually or via another script
    print_info "Consider updating README.md with:"
    echo ""
    echo "### Docker Hub"
    echo ""
    echo "Pre-built images are available on Docker Hub:"
    echo ""
    echo "\`\`\`bash"
    echo "# Pull the latest image"
    echo "docker pull $full_image_name:latest"
    echo ""
    echo "# Or pull a specific version"
    echo "docker pull $full_image_name:$version"
    echo ""
    echo "# Run HTTP server"
    echo "docker run -p 3001:3001 $full_image_name:latest \\"
    echo "  node dist/mcp.js --transport http --port 3001 --host 0.0.0.0"
    echo "\`\`\`"
    echo ""
}

# Main function
main() {
    echo ""
    echo "========================================="
    echo "   Docker Hub Publishing Tool"
    echo "   DDG Web Search"
    echo "========================================="
    echo ""
    
    # Checks
    print_info "Running pre-flight checks..."
    check_docker
    check_docker_daemon
    
    # Docker Hub login
    if ! check_docker_login; then
        print_warning "You need to login to Docker Hub to publish images"
        read -p "Do you want to login now? (y/N) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            docker_login || exit 1
        else
            print_error "Cannot publish without Docker Hub login"
            exit 1
        fi
    fi
    
    # Get version to publish
    VERSION=$(get_version)
    print_info "Publishing version: $VERSION"
    
    # Confirm
    echo ""
    read -p "This will build and push $DOCKER_USERNAME/$IMAGE_NAME:$VERSION to Docker Hub. Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Publishing cancelled"
        exit 0
    fi
    
    # Build image
    echo ""
    build_image "$VERSION" || exit 1
    
    # Test image
    echo ""
    read -p "Do you want to test the image before pushing? (Y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        test_image "$VERSION" || {
            print_error "Image tests failed. Do you want to continue anyway?"
            read -p "Continue? (y/N) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        }
    fi
    
    # Push image
    echo ""
    push_image "$VERSION" || exit 1
    
    # Display info
    echo ""
    print_success "Image published successfully!"
    display_image_info "$VERSION"
    
    # Update documentation suggestion
    update_documentation "$VERSION"
    
    print_success "Publishing complete!"
}

# Run main function
main "$@"
