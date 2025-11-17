# Deploy to Your Server

## Quick Deployment Commands

SSH into your server and run these commands:

```bash
# Navigate to your app directory
cd ~/Raydium-Launcher

# Stop current PM2 processes (if any)
pm2 stop all
pm2 delete all

# Backup current directory (optional but recommended)
cd ~
mv Raydium-Launcher Raydium-Launcher-backup-$(date +%Y%m%d-%H%M%S)

# Clone the repository
git clone https://github.com/BUGGERMYBATTY/COBRA-LAUNCH-COMPLETE-B-P.git Raydium-Launcher
cd Raydium-Launcher

# Checkout the main branch
git checkout main

# Install dependencies for frontend
npm install

# Install dependencies for backend
cd backend
npm install
cd ..

# Configure environment variables
nano .env
```

## Configure .env File

Edit the `.env` file and set these values:

```env
# Backend API URL - Use your server's domain
VITE_BACKEND_API_URL=https://api.yourdomain.com

# Backend Port
BACKEND_PORT=3001

# Pinata JWT Token (GET THIS FROM https://app.pinata.cloud/developers/api-keys)
VITE_PINATA_JWT=your_actual_pinata_jwt_here

# Pinata Gateway
VITE_PINATA_GATEWAY=https://yellow-peculiar-cephalopod-560.mypinata.cloud

# Solana Network
VITE_SOLANA_NETWORK=mainnet-beta

# Optional: Custom RPC Endpoint (recommended for production)
# VITE_SOLANA_RPC_ENDPOINT=https://your-custom-rpc-endpoint.com
```

Save and exit (Ctrl+X, then Y, then Enter)

## Build and Deploy

```bash
# Build the frontend
npm run build

# Start backend with PM2
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup

# Restart Nginx (if using)
sudo systemctl restart nginx

# Check PM2 status
pm2 status
pm2 logs
```

## Verify Deployment

1. Check backend API health:
```bash
curl http://localhost:3001/api/health
```

Should return: `{"status":"ok","message":"Cobra Launch Backend API is running"}`

2. Visit your domain in browser to test the frontend

## Troubleshooting

### Backend not starting
```bash
pm2 logs cobra-backend
cd backend
node server.js  # Run directly to see errors
```

### Frontend not showing
```bash
# Verify dist folder exists
ls -la dist/

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

### Need to update later
```bash
cd ~/Raydium-Launcher
git pull origin main
npm install
cd backend && npm install && cd ..
npm run build
pm2 restart cobra-backend
sudo systemctl restart nginx
```
