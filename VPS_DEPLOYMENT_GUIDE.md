# Cobra Launch - VPS Deployment Guide

Complete guide for deploying Cobra Launch on a Virtual Private Server (VPS).

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Quick Start with Docker](#quick-start-with-docker)
3. [Manual Deployment with PM2](#manual-deployment-with-pm2)
4. [Nginx Setup (Recommended)](#nginx-setup)
5. [SSL Configuration](#ssl-configuration)
6. [Environment Variables](#environment-variables)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Server Requirements
- **OS**: Ubuntu 20.04+ or Debian 11+ (recommended)
- **RAM**: Minimum 1GB (2GB+ recommended)
- **Storage**: Minimum 10GB
- **Node.js**: Version 20.x or higher
- **Port**: 3001 (or custom port)

### What You'll Need
- VPS with root/sudo access
- Domain name (optional but recommended)
- Pinata API credentials
- Solana wallet address for fees

---

## Option 1: Quick Start with Docker (Recommended)

Docker simplifies deployment and ensures consistency across environments.

### Step 1: Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

### Step 2: Clone Repository

```bash
# Clone your repository
git clone https://github.com/BUGGERMYBATTY/COBRA-LAUNCH-COMPLETE-B-P.git
cd COBRA-LAUNCH-COMPLETE-B-P

# Or if you already have it, pull latest changes
git pull origin claude/setup-deployment-01QkkqE3RyKRfWsthmAAdMCx
```

### Step 3: Configure Environment

```bash
# Copy and edit environment file
cp .env.vps .env
nano .env

# Fill in these required values:
# - VITE_PINATA_JWT=your_actual_jwt_token
# - VITE_TREASURY_ADDRESS=your_solana_wallet_address
# - VITE_BACKEND_API_URL=http://your-server-ip:3001
```

### Step 4: Build and Run

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### Step 5: Access Your App

Open your browser and visit:
```
http://your-server-ip:3001
```

### Docker Management Commands

```bash
# Stop the application
docker-compose down

# Restart after code changes
docker-compose down && docker-compose up -d --build

# View logs
docker-compose logs -f cobra-launch

# Check container status
docker ps

# Access container shell
docker exec -it cobra-launch-app sh
```

---

## Option 2: Manual Deployment with PM2

PM2 is a production process manager for Node.js applications.

### Step 1: Install Node.js 20

```bash
# Install NVM (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
source ~/.bashrc

# Install Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# Verify
node --version  # Should show v20.x.x
npm --version
```

### Step 2: Install PM2

```bash
npm install -g pm2
pm2 --version
```

### Step 3: Clone and Setup

```bash
# Clone repository
git clone https://github.com/BUGGERMYBATTY/COBRA-LAUNCH-COMPLETE-B-P.git
cd COBRA-LAUNCH-COMPLETE-B-P

# Configure environment
cp .env.vps .env
nano .env  # Fill in your values

# Install frontend dependencies
npm install --legacy-peer-deps

# Build frontend
npm run build

# Install backend dependencies
cd backend
npm install
cd ..
```

### Step 4: Create PM2 Ecosystem File

Create `ecosystem.config.js` in the project root:

```javascript
module.exports = {
  apps: [{
    name: 'cobra-launch',
    script: './backend/server.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      BACKEND_PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};
```

### Step 5: Start with PM2

```bash
# Create logs directory
mkdir -p logs

# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the command it outputs

# View logs
pm2 logs cobra-launch

# Monitor
pm2 monit
```

### PM2 Management Commands

```bash
# View status
pm2 status

# Restart
pm2 restart cobra-launch

# Stop
pm2 stop cobra-launch

# Delete
pm2 delete cobra-launch

# View logs
pm2 logs cobra-launch

# Monitor
pm2 monit
```

---

## Nginx Setup (Recommended for Production)

Nginx provides reverse proxy, SSL, and better performance.

### Step 1: Install Nginx

```bash
sudo apt update
sudo apt install nginx -y
sudo systemctl status nginx
```

### Step 2: Configure Nginx

```bash
# Copy nginx configuration
sudo cp nginx.conf /etc/nginx/sites-available/cobra-launch

# Edit the configuration
sudo nano /etc/nginx/sites-available/cobra-launch

# Update these lines:
# server_name yourdomain.com www.yourdomain.com;
# Replace with your actual domain

# Enable the site
sudo ln -s /etc/nginx/sites-available/cobra-launch /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Step 3: Update Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable
sudo ufw status
```

### Step 4: Update Environment Variable

```bash
# Edit .env file
nano .env

# Update VITE_BACKEND_API_URL to use your domain
VITE_BACKEND_API_URL=https://yourdomain.com

# Rebuild frontend
npm run build

# Restart backend
pm2 restart cobra-launch
# OR for Docker
docker-compose down && docker-compose up -d --build
```

---

## SSL Configuration (HTTPS)

### Using Certbot (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow the prompts
# Certbot will automatically configure SSL in nginx

# Test auto-renewal
sudo certbot renew --dry-run

# SSL will auto-renew via cron
```

### Manual SSL Setup

If you have your own SSL certificate:

```bash
# Copy your certificates
sudo cp fullchain.pem /etc/ssl/certs/cobra-launch.crt
sudo cp privkey.pem /etc/ssl/private/cobra-launch.key

# Update nginx.conf:
# ssl_certificate /etc/ssl/certs/cobra-launch.crt;
# ssl_certificate_key /etc/ssl/private/cobra-launch.key;

# Reload nginx
sudo nginx -t && sudo systemctl reload nginx
```

---

## Environment Variables

### Required Variables

```bash
# Pinata JWT Token (REQUIRED)
VITE_PINATA_JWT=your_actual_jwt_token_here

# Treasury Wallet (REQUIRED)
VITE_TREASURY_ADDRESS=your_solana_wallet_address_here

# Backend API URL (REQUIRED)
VITE_BACKEND_API_URL=https://yourdomain.com

# Pinata Gateway (REQUIRED)
VITE_PINATA_GATEWAY=https://your-gateway.mypinata.cloud

# Solana Network (REQUIRED)
VITE_SOLANA_NETWORK=mainnet-beta
```

### Optional Variables

```bash
# Backend Port (default: 3001)
BACKEND_PORT=3001

# Custom RPC Endpoint
VITE_SOLANA_RPC_ENDPOINT=https://mainnet.helius-rpc.com/?api-key=your-key
```

### Getting API Keys

#### Pinata JWT
1. Go to https://app.pinata.cloud/developers/api-keys
2. Click "New Key"
3. Enable `pinFileToIPFS` permission
4. Copy the JWT token

#### Pinata Gateway
1. Go to https://app.pinata.cloud/gateway
2. Copy your gateway URL (e.g., `https://xxx.mypinata.cloud`)

---

## Troubleshooting

### Port Already in Use

```bash
# Check what's using port 3001
sudo lsof -i :3001

# Kill the process
sudo kill -9 <PID>

# Or use a different port in .env
BACKEND_PORT=3002
```

### Frontend Not Loading

```bash
# Verify frontend was built
ls -la dist/

# Rebuild if needed
npm run build

# Check backend logs
pm2 logs cobra-launch
# OR for Docker
docker-compose logs -f
```

### API Not Working

```bash
# Test API endpoint
curl http://localhost:3001/api/health

# Should return:
# {"status":"ok","message":"Cobra Launch Backend API is running"}

# Check environment variables
cat .env | grep PINATA_JWT
```

### Upload Failures

```bash
# Verify Pinata JWT is set
echo $VITE_PINATA_JWT

# Check backend logs
pm2 logs cobra-launch --lines 100

# Test Pinata API directly
curl -X POST "https://api.pinata.cloud/data/testAuthentication" \
  -H "Authorization: Bearer YOUR_JWT"
```

### Docker Issues

```bash
# View container logs
docker-compose logs -f

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d

# Check container is running
docker ps

# Access container shell
docker exec -it cobra-launch-app sh
```

### Nginx Errors

```bash
# Test nginx configuration
sudo nginx -t

# View nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart nginx
sudo systemctl restart nginx
```

### Build Failures

```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Clear build directory
rm -rf dist
npm run build
```

---

## Updating Your Deployment

### Docker Method

```bash
cd COBRA-LAUNCH-COMPLETE-B-P
git pull origin your-branch
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### PM2 Method

```bash
cd COBRA-LAUNCH-COMPLETE-B-P
git pull origin your-branch
npm install --legacy-peer-deps
npm run build
cd backend
npm install
cd ..
pm2 restart cobra-launch
```

---

## Monitoring and Logs

### PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# View logs
pm2 logs cobra-launch

# View last 100 lines
pm2 logs cobra-launch --lines 100

# Clear logs
pm2 flush
```

### Docker Monitoring

```bash
# View logs
docker-compose logs -f

# View last 100 lines
docker-compose logs --tail=100

# Check resource usage
docker stats
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

---

## Security Best Practices

1. **Use HTTPS**: Always use SSL/TLS in production
2. **Environment Variables**: Never commit `.env` to git
3. **Firewall**: Only open necessary ports
4. **Updates**: Keep system and packages updated
5. **Backups**: Regular backups of your .env file
6. **Monitoring**: Set up monitoring and alerts

```bash
# Update system regularly
sudo apt update && sudo apt upgrade -y

# Setup automatic security updates
sudo apt install unattended-upgrades -y
```

---

## Support

For issues:
- Check logs first: `pm2 logs` or `docker-compose logs`
- Review this guide's troubleshooting section
- Check GitHub issues

Good luck with your deployment! 🚀🐍
