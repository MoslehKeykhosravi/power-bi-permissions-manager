@echo off
REM Power BI Permissions Manager - Automated Rebuild and Run Script
REM This script will stop, rebuild, and restart the Docker containers
REM Usage: rebuild-and-run.bat [--clean]
REM   --clean: Force a clean rebuild without cache (slower but ensures fresh build)

SETLOCAL EnableDelayedExpansion

echo ==========================================
echo Power BI Permissions Manager - Rebuild
echo ==========================================
echo.

REM Check for --clean flag
SET BUILD_FLAGS=
IF "%1"=="--clean" (
    SET BUILD_FLAGS=--no-cache
    echo [INFO] Clean build mode: This will take longer but ensures a fresh build
    echo.
) ELSE (
    echo [INFO] Fast build mode: Using Docker cache (use --clean for full rebuild)
    echo.
)

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Step 1: Stop and remove existing containers
echo [1/3] Stopping and removing existing containers...
docker compose down
if %errorlevel% neq 0 (
    echo [ERROR] Failed to stop containers
    pause
    exit /b 1
)
echo [OK] Containers stopped and removed
echo.

REM Step 2: Rebuild images
echo [2/3] Rebuilding Docker images...
IF "%BUILD_FLAGS%"=="--no-cache" (
    echo This may take several minutes...
) ELSE (
    echo Using cache for faster build...
)
docker compose build %BUILD_FLAGS%
if %errorlevel% neq 0 (
    echo [ERROR] Failed to build images
    pause
    exit /b 1
)
echo [OK] Images rebuilt successfully
echo.

REM Step 3: Start containers
echo [3/3] Starting containers...
docker compose up -d
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start containers
    pause
    exit /b 1
)
echo [OK] Containers started
echo.

REM Show status
echo Container Status:
docker compose ps
echo.

REM Success message
echo ==================================
echo Application is running!
echo Frontend: http://localhost
echo Backend API: http://localhost:5000
echo ==================================
echo.
echo To view logs: docker compose logs -f
echo To stop: docker compose down
echo For clean rebuild: rebuild-and-run.bat --clean
echo.
pause

