#!/bin/bash
# Power BI Permissions Manager - Automated Rebuild and Run Script
# This script will stop, rebuild, and restart the Docker containers
# Usage: ./rebuild-and-run.sh [--clean] [--fast]
#   --clean: Force a clean rebuild without cache (slower but ensures fresh build)
#   --fast: Skip frontend rebuild if no changes detected (much faster)

set -e

echo "=========================================="
echo "Power BI Permissions Manager - Rebuild"
echo "=========================================="
echo ""

# Parse arguments
BUILD_FLAGS=""
FAST_MODE=false
CLEAN_MODE=false

for arg in "$@"; do
    case $arg in
        --clean)
            CLEAN_MODE=true
            BUILD_FLAGS="--no-cache"
            echo "[INFO] Clean build mode: This will take longer but ensures a fresh build"
            echo ""
            ;;
        --fast)
            FAST_MODE=true
            echo "[INFO] Fast mode: Will skip frontend rebuild if no changes detected"
            echo ""
            ;;
    esac
done

if [ "$CLEAN_MODE" = false ] && [ "$FAST_MODE" = false ]; then
    echo "[INFO] Standard build mode: Using Docker cache (use --clean for full rebuild, --fast for quick restart)"
    echo ""
fi

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "[ERROR] Docker is not running. Please start Docker and try again."
    exit 1
fi

# Step 1: Stop and remove existing containers
echo "[1/3] Stopping and removing existing containers..."
docker compose down
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to stop containers"
    exit 1
fi
echo "[OK] Containers stopped and removed"
echo ""

# Step 2: Rebuild images
if [ "$FAST_MODE" = true ]; then
    echo "[2/3] Fast mode: Checking for changes..."
    
    # Check if images exist
    BACKEND_IMAGE=$(docker images -q pbi-web-app-backend 2> /dev/null)
    FRONTEND_IMAGE=$(docker images -q pbi-web-app-frontend 2> /dev/null)
    
    if [ -z "$BACKEND_IMAGE" ] || [ -z "$FRONTEND_IMAGE" ]; then
        echo "Images not found. Building..."
        docker compose build
    else
        echo "Images exist. Skipping build (use without --fast to rebuild)"
    fi
else
    echo "[2/3] Rebuilding Docker images..."
    if [ "$CLEAN_MODE" = true ]; then
        echo "This may take several minutes..."
    else
        echo "Using cache for faster build..."
    fi
    docker compose build $BUILD_FLAGS
    if [ $? -ne 0 ]; then
        echo "[ERROR] Failed to build images"
        exit 1
    fi
    echo "[OK] Images rebuilt successfully"
fi
echo ""

# Step 3: Start containers
echo "[3/3] Starting containers..."
docker compose up -d
if [ $? -ne 0 ]; then
    echo "[ERROR] Failed to start containers"
    exit 1
fi
echo "[OK] Containers started"
echo ""

# Wait for containers to be healthy
echo "Waiting for containers to be healthy..."
sleep 5

# Show status
echo "Container Status:"
docker compose ps
echo ""

# Success message
echo "=================================="
echo "Application is running!"
echo "Frontend: http://localhost"
echo "Backend API: http://localhost:5000"
echo "=================================="
echo ""
echo "To view logs: docker compose logs -f"
echo "To stop: docker compose down"
echo "For clean rebuild: ./rebuild-and-run.sh --clean"
echo "For fast restart: ./rebuild-and-run.sh --fast"
echo ""
