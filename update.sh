#!/bin/bash

# Quick Update Script for Cobra Launch
# Use this to pull latest changes and redeploy

set -e

echo "======================================"
echo "Updating Cobra Launch..."
echo "======================================"

# Pull latest changes
echo ""
echo "Pulling latest changes from repository..."
git pull origin main

# Run deployment script
echo ""
echo "Running deployment..."
./deploy.sh

echo ""
echo "Update complete!"
