#!/bin/bash

# Quick start script for DDG Web Search Docker setup
# This script helps you quickly get started with Docker

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
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
        exit 1
    fi
    print_info "Docker is installed ✓"
}

# Function to check if Docker Compose is installed
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    print_info "Docker Compose is installed ✓"
}

# Function to build Docker image
build_image() {
    print_info "Building Docker image..."
    docker build -t ddg-web-search .
    print_info "Docker image built successfully ✓"
}

# Function to display menu
show_menu() {
    echo ""
    echo "========================================"
    echo "   DDG Web Search - Docker Quick Start"
    echo "========================================"
    echo ""
    echo "1) Build Docker image"
    echo "2) Run MCP server (HTTP transport)"
    echo "3) Run MCP server (stdio transport)"
    echo "4) Run CLI (interactive)"
    echo "5) Run with Docker Compose (HTTP)"
    echo "6) Run with Docker Compose (stdio)"
    echo "7) Start development environment"
    echo "8) Run tests"
    echo "9) View logs"
    echo "10) Stop all containers"
    echo "11) Clean up (remove containers and images)"
    echo "0) Exit"
    echo ""
}

# Function to run MCP server with HTTP transport
run_http() {
    print_info "Starting MCP server with HTTP transport..."
    docker run -d -p 3001:3001 --name ddg-mcp-http ddg-web-search \
        node dist/mcp.js --transport http --port 3001 --host 0.0.0.0
    print_info "MCP server started on http://localhost:3001 ✓"
    print_info "View logs with: docker logs -f ddg-mcp-http"
}

# Function to run MCP server with stdio transport
run_stdio() {
    print_info "Starting MCP server with stdio transport..."
    docker run -it --name ddg-mcp-stdio ddg-web-search
}

# Function to run CLI
run_cli() {
    print_info "Starting CLI in interactive mode..."
    docker run -it --name ddg-cli ddg-web-search node dist/cli.js interactive
}

# Function to run with Docker Compose (HTTP)
compose_http() {
    print_info "Starting services with Docker Compose (HTTP)..."
    docker-compose --profile http up -d
    print_info "Services started ✓"
    print_info "MCP server available at http://localhost:3001"
    print_info "View logs with: docker-compose logs -f"
}

# Function to run with Docker Compose (stdio)
compose_stdio() {
    print_info "Starting services with Docker Compose (stdio)..."
    docker-compose --profile stdio up
}

# Function to start development environment
start_dev() {
    print_info "Starting development environment..."
    docker-compose -f docker-compose.dev.yml up
}

# Function to run tests
run_tests() {
    print_info "Running tests..."
    docker-compose -f docker-compose.dev.yml --profile test up ddg-test
}

# Function to view logs
view_logs() {
    print_info "Viewing logs..."
    docker-compose logs -f
}

# Function to stop containers
stop_containers() {
    print_info "Stopping all containers..."
    docker-compose down 2>/dev/null || true
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    docker stop ddg-mcp-http ddg-mcp-stdio ddg-cli 2>/dev/null || true
    docker rm ddg-mcp-http ddg-mcp-stdio ddg-cli 2>/dev/null || true
    print_info "All containers stopped ✓"
}

# Function to clean up
cleanup() {
    print_warning "This will remove all DDG Web Search containers and images."
    read -p "Are you sure? (y/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_info "Cleaning up..."
        stop_containers
        docker rmi ddg-web-search ddg-web-search:dev 2>/dev/null || true
        docker system prune -f
        print_info "Cleanup completed ✓"
    else
        print_info "Cleanup cancelled"
    fi
}

# Main script
main() {
    check_docker
    check_docker_compose
    
    while true; do
        show_menu
        read -p "Select an option: " choice
        
        case $choice in
            1) build_image ;;
            2) run_http ;;
            3) run_stdio ;;
            4) run_cli ;;
            5) compose_http ;;
            6) compose_stdio ;;
            7) start_dev ;;
            8) run_tests ;;
            9) view_logs ;;
            10) stop_containers ;;
            11) cleanup ;;
            0) 
                print_info "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option. Please try again."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main function
main
