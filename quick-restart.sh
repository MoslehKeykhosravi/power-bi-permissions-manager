#!/bin/bash
# Quick restart script for development
# This restarts containers without rebuilding (fastest option)

echo "Quick restarting containers..."
docker compose restart

echo ""
echo "Container Status:"
docker compose ps
echo ""
echo "✓ Containers restarted!"
echo "Frontend: http://localhost"
echo "Backend API: http://localhost:5000"

