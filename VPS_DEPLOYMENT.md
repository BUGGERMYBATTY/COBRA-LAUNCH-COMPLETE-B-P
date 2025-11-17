# VPS Deployment Guide for Cobra Launch

This guide will help you deploy the Cobra Launch Solana token launcher on your VPS with a secure backend API.

## Architecture Overview

The application consists of two parts:
1. **Frontend**: React/Vite application (static files)
2. **Backend API**: Node.js/Express server (handles Pinata uploads securely)

**Security Note**: The JWT for Pinata is ONLY stored on the backend server and is NEVER exposed to the frontend/browser.

## Prerequisites

- A VPS with Ubuntu 20.04+ or similar Linux distribution
- Node.js 18+ installed
- npm or yarn package manager
- A domain name (optional, but recommended)
- SSL certificate (for HTTPS, **required** for wallet connections)

## 1. Initial Setup

### Install Node.js (if not already installed)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Clone or Upload Your Repository

```bash
cd /var/www
git clone <your-repo-url> cobra-launch
cd cobra-launch
```

## 2. Configuration

### Create Environment File

Copy the example environment file and configure it:

```bash
cp .env.example .env
nano .env
```

**Required Configuration:**

```env
# Backend API URL
# In production, use your VPS domain: https://api.yourdomain.com
# For local testing: http://localhost:3001
VITE_BACKEND_API_URL=https://api.yourdomain.com

# Backend Port
BACKEND_PORT=3001

# Pinata JWT (BACKEND ONLY - Never exposed to frontend)
VITE_PINATA_JWT=your_actual_pinata_jwt_here

# Pinata Gateway
VITE_PINATA_GATEWAY=https://your-gateway.mypinata.cloud

# Solana Network (mainnet-beta for production)
VITE_SOLANA_NETWORK=mainnet-beta

# Optional: Custom RPC Endpoint (recommended for production)
# VITE_SOLANA_RPC_ENDPOINT=https://your-custom-rpc.com
```

### Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

## 3. Build the Frontend Application

Build the production bundle:

```bash
npm run build
```

This will create a `dist` folder with your production-ready frontend.

## 4. Backend API Deployment with PM2

### Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### Create PM2 Ecosystem File

Create `ecosystem.config.js` in the root directory:

```bash
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'cobra-backend',
      cwd: './backend',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
EOF
```

### Start the Backend Server

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

This will start your backend API on port 3001 (or the port specified in .env).

## 5. Frontend Deployment with Nginx

### Install Nginx

```bash
sudo apt-get update
sudo apt-get install nginx
```

### Configure Nginx

Create a new site configuration:

```bash
sudo nano /etc/nginx/sites-available/cobra-launch
```

Add the following configuration (adjust domains as needed):

```nginx
# Backend API Server
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend Application
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/cobra-launch/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/javascript application/xml+rss application/json;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/cobra-launch /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## 6. SSL/HTTPS Setup with Let's Encrypt (REQUIRED)

**Important**: Solana wallet adapters require HTTPS to function properly.

```bash
sudo apt-get install certbot python3-certbot-nginx

# For main domain
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# For API subdomain
sudo certbot --nginx -d api.yourdomain.com
```

Certbot will automatically configure SSL and set up auto-renewal.

### Update .env with HTTPS Backend URL

After SSL is configured, update your `.env`:

```bash
nano .env
```

Change:
```env
VITE_BACKEND_API_URL=https://api.yourdomain.com
```

Rebuild the frontend:

```bash
npm run build
sudo systemctl restart nginx
```

## 7. Firewall Configuration

Allow HTTP, HTTPS, and SSH traffic:

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 8. Verify Deployment

### Check Backend API

```bash
curl http://localhost:3001/api/health
```

Should return: `{"status":"ok","message":"Cobra Launch Backend API is running"}`

### Check PM2 Status

```bash
pm2 status
pm2 logs cobra-backend
```

### Check Frontend

Visit your domain in a browser: `https://yourdomain.com`

## 9. Updating the Application

To update your application:

```bash
cd /var/www/cobra-launch

# Pull latest changes
git pull

# Update frontend
npm install
npm run build

# Update backend
cd backend
npm install
cd ..

# Restart services
pm2 restart cobra-backend
sudo systemctl restart nginx
```

## 10. Monitoring and Logs

### Backend Logs (PM2)

```bash
pm2 logs cobra-backend
pm2 monit
```

### Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

## 11. Security Checklist

- [x] JWT is stored in `.env` on the backend only
- [x] `.env` file is in `.gitignore` (never committed)
- [x] HTTPS/SSL is enabled for both frontend and backend
- [x] Firewall is configured
- [x] Using a custom RPC endpoint (recommended)
- [x] Regular system updates: `sudo apt-get update && sudo apt-get upgrade`

## 12. Performance Optimization

### Use a Custom RPC Provider

For production, use a paid RPC provider for better reliability:
- **QuickNode**: https://www.quicknode.com/
- **Alchemy**: https://www.alchemy.com/
- **Helius**: https://www.helius.dev/
- **Triton**: https://triton.one/

Add to `.env`:

```env
VITE_SOLANA_RPC_ENDPOINT=https://your-custom-rpc-endpoint.com
```

Then rebuild and restart:

```bash
npm run build
pm2 restart cobra-backend
sudo systemctl restart nginx
```

## 13. Troubleshooting

### Backend won't start

- Check logs: `pm2 logs cobra-backend`
- Verify `.env` file exists and has correct values
- Ensure port 3001 is not already in use: `sudo lsof -i :3001`

### Frontend can't connect to backend

- Verify HTTPS is configured for both frontend and backend
- Check `VITE_BACKEND_API_URL` in `.env` matches your API subdomain
- Check CORS settings in `backend/server.js`
- View browser console for connection errors

### Wallet connections not working

- Verify you're using HTTPS (required for wallet adapters)
- Check browser console for errors
- Ensure your domain is properly configured with valid SSL
- Test with different browsers/wallets

### Pinata uploads failing

- Verify `VITE_PINATA_JWT` in `.env` is correct
- Check backend logs: `pm2 logs cobra-backend`
- Test backend API directly: `curl http://localhost:3001/api/health`
- Check Pinata dashboard for API limits/usage

## Support

For issues or questions:
- Check PM2 logs: `pm2 logs cobra-backend`
- Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Review Solana Wallet Adapter documentation
- Review Pinata documentation

---

**Current Configuration:**
- Network: Mainnet Beta (configurable)
- Wallet Support: Phantom, Solflare
- IPFS Provider: Pinata (via secure backend)
- Creation Fee: 0.1 SOL
- Architecture: Frontend (static) + Backend API (Node.js/Express)
