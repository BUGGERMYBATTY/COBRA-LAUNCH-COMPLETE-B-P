#!/bin/bash

# Cobra Launch Deployment Script
# This script updates your server with the latest code

set -e  # Exit on error

echo "======================================"
echo "Cobra Launch Deployment Script"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo "Please create .env file from .env.example and configure it:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

echo -e "${GREEN}✓${NC} .env file found"

# Install frontend dependencies
echo ""
echo "Installing frontend dependencies..."
npm install

# Install backend dependencies
echo ""
echo "Installing backend dependencies..."
cd backend
npm install
cd ..

echo -e "${GREEN}✓${NC} Dependencies installed"

# Build frontend
echo ""
echo "Building frontend..."
npm run build

echo -e "${GREEN}✓${NC} Frontend built successfully"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}Warning: PM2 not found. Installing PM2...${NC}"
    sudo npm install -g pm2
fi

# Stop existing PM2 processes
echo ""
echo "Stopping existing processes..."
pm2 stop cobra-backend 2>/dev/null || echo "No existing process to stop"

# Start backend with PM2
echo ""
echo "Starting backend server with PM2..."
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

echo -e "${GREEN}✓${NC} Backend started with PM2"

# Show PM2 status
echo ""
echo "PM2 Status:"
pm2 status

# Test backend health
echo ""
echo "Testing backend health..."
sleep 2
HEALTH_CHECK=$(curl -s http://localhost:3001/api/health || echo "failed")

if [[ $HEALTH_CHECK == *"ok"* ]]; then
    echo -e "${GREEN}✓${NC} Backend is healthy!"
else
    echo -e "${RED}✗${NC} Backend health check failed"
    echo "Check logs with: pm2 logs cobra-backend"
fi

# Restart Nginx if it exists
if command -v nginx &> /dev/null; then
    echo ""
    echo "Restarting Nginx..."
    sudo systemctl restart nginx
    echo -e "${GREEN}✓${NC} Nginx restarted"
fi

echo ""
echo "======================================"
echo -e "${GREEN}Deployment Complete!${NC}"
echo "======================================"
echo ""
echo "Useful commands:"
echo "  pm2 status              - Check process status"
echo "  pm2 logs cobra-backend  - View backend logs"
echo "  pm2 restart cobra-backend - Restart backend"
echo "  pm2 stop cobra-backend    - Stop backend"
echo ""
