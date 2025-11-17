# Railway Deployment Guide for Cobra Launch

This guide will help you deploy the Cobra Launch Solana token launcher on Railway with both frontend and backend services.

## Overview

The application consists of two services that will be deployed on Railway:
1. **Frontend**: React/Vite application (static site with preview server)
2. **Backend API**: Node.js/Express server (handles Pinata uploads securely)

**Security Note**: The Pinata JWT is ONLY stored in the backend environment variables and is NEVER exposed to the frontend/browser.

## Prerequisites

- Railway account (sign up at https://railway.app)
- GitHub account (for connecting your repository)
- Pinata account and JWT token (get from https://app.pinata.cloud/developers/api-keys)
- This repository pushed to GitHub

## Architecture

Railway will deploy two services from this monorepo:
- **Frontend Service** → `BLUE-PURPLE-COBRA-LAUNCH-BACKUP/` directory
- **Backend Service** → `BLUE-PURPLE-COBRA-LAUNCH-BACKUP/backend/` directory

## Step 1: Create a New Railway Project

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub account if needed
5. Select your repository: `BUGGERMYBATTY/COBRA-LAUNCH-COMPLETE-B-P`

## Step 2: Configure Backend Service

### 2.1 Create Backend Service

1. Railway will auto-detect your repository
2. Click **"Add a New Service"** → **"GitHub Repo"**
3. In the service settings:
   - **Name**: `cobra-backend` (or any name you prefer)
   - **Root Directory**: `BLUE-PURPLE-COBRA-LAUNCH-BACKUP/backend`
   - **Build Command**: `npm install` (auto-detected)
   - **Start Command**: `node server.js` (auto-detected from railway.json)

### 2.2 Set Backend Environment Variables

In the Railway backend service settings, go to **"Variables"** and add:

```env
# Backend Port (Railway will inject $PORT automatically)
PORT=3001

# Pinata JWT (CRITICAL - Never expose this!)
VITE_PINATA_JWT=your_actual_pinata_jwt_token_here

# Pinata Gateway
VITE_PINATA_GATEWAY=https://your-gateway.mypinata.cloud

# Solana Network
VITE_SOLANA_NETWORK=mainnet-beta

# Optional: Custom RPC Endpoint (recommended for production)
# VITE_SOLANA_RPC_ENDPOINT=https://your-custom-rpc.com

# Node Environment
NODE_ENV=production
```

**Important**: Replace `your_actual_pinata_jwt_token_here` with your real Pinata JWT token!

### 2.3 Get Backend URL

After deployment:
1. Go to the backend service settings
2. Click on **"Settings"** → **"Networking"**
3. Click **"Generate Domain"** to get a public URL
4. Copy this URL (e.g., `https://cobra-backend-production.up.railway.app`)
5. **Save this URL** - you'll need it for the frontend configuration

## Step 3: Configure Frontend Service

### 3.1 Create Frontend Service

1. In your Railway project, click **"Add a New Service"** → **"GitHub Repo"**
2. Select the same repository
3. In the service settings:
   - **Name**: `cobra-frontend` (or any name you prefer)
   - **Root Directory**: `BLUE-PURPLE-COBRA-LAUNCH-BACKUP`
   - **Build Command**: `npm install && npm run build` (from railway.json)
   - **Start Command**: `npm run preview -- --host 0.0.0.0 --port $PORT` (from railway.json)

### 3.2 Set Frontend Environment Variables

In the Railway frontend service settings, go to **"Variables"** and add:

```env
# Backend API URL (use the URL from Step 2.3)
VITE_BACKEND_API_URL=https://cobra-backend-production.up.railway.app

# Pinata Gateway (for reading IPFS data)
VITE_PINATA_GATEWAY=https://your-gateway.mypinata.cloud

# Solana Network
VITE_SOLANA_NETWORK=mainnet-beta

# Optional: Custom RPC Endpoint
# VITE_SOLANA_RPC_ENDPOINT=https://your-custom-rpc.com

# Node Environment
NODE_ENV=production
```

**Important**:
- Replace the `VITE_BACKEND_API_URL` with your actual backend Railway URL
- Do NOT include the Pinata JWT here - it should only be in the backend!

### 3.3 Generate Frontend Domain

1. Go to frontend service settings
2. Click on **"Settings"** → **"Networking"**
3. Click **"Generate Domain"** to get a public URL
4. Your app will be available at this URL (e.g., `https://cobra-frontend-production.up.railway.app`)

**Optional**: Add a custom domain:
1. Click **"Settings"** → **"Networking"** → **"Custom Domain"**
2. Add your domain (e.g., `launch.yourdomain.com`)
3. Configure your DNS with the provided CNAME record

## Step 4: Deploy

Railway will automatically deploy both services when you push to your repository.

### Manual Deployment

To manually trigger a deployment:
1. Go to the service in Railway dashboard
2. Click **"Deployments"**
3. Click **"Deploy"** or **"Redeploy"**

## Step 5: Verify Deployment

### Check Backend Health

Open in your browser or use curl:
```bash
curl https://your-backend-url.up.railway.app/api/health
```

Should return:
```json
{"status":"ok","message":"Cobra Launch Backend API is running"}
```

### Check Frontend

1. Visit your frontend URL in a browser
2. Test wallet connection (Phantom, Solflare)
3. Try creating a test token on devnet first

## Step 6: Update CORS (If Needed)

If you get CORS errors, update the backend `server.js`:

1. Go to `BLUE-PURPLE-COBRA-LAUNCH-BACKUP/backend/server.js`
2. Find the CORS configuration
3. Add your Railway frontend URL to allowed origins
4. Push changes to trigger redeployment

## Environment Variables Reference

### Backend Service (`cobra-backend`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `PORT` | Auto | Port to run backend (Railway injects) | `3001` |
| `VITE_PINATA_JWT` | ✅ Yes | Pinata JWT token for IPFS uploads | `eyJhbG...` |
| `VITE_PINATA_GATEWAY` | ✅ Yes | Pinata gateway URL | `https://xxx.mypinata.cloud` |
| `VITE_SOLANA_NETWORK` | ✅ Yes | Solana network | `mainnet-beta` |
| `VITE_SOLANA_RPC_ENDPOINT` | No | Custom RPC endpoint | `https://...` |
| `NODE_ENV` | No | Node environment | `production` |

### Frontend Service (`cobra-frontend`)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_BACKEND_API_URL` | ✅ Yes | Backend Railway URL | `https://cobra-backend-production.up.railway.app` |
| `VITE_PINATA_GATEWAY` | ✅ Yes | Pinata gateway URL | `https://xxx.mypinata.cloud` |
| `VITE_SOLANA_NETWORK` | ✅ Yes | Solana network | `mainnet-beta` |
| `VITE_SOLANA_RPC_ENDPOINT` | No | Custom RPC endpoint | `https://...` |
| `NODE_ENV` | No | Node environment | `production` |

## Continuous Deployment

Railway automatically redeploys when you push to your repository:

1. Make changes locally
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update deployment configuration"
   git push origin main
   ```
3. Railway will automatically detect changes and redeploy

## Monitoring and Logs

### View Logs

1. Go to Railway dashboard
2. Click on your service (backend or frontend)
3. Click **"Deployments"** → Select active deployment
4. View real-time logs in the **"Logs"** tab

### Monitor Service Health

Railway provides:
- **Metrics**: CPU, Memory, Network usage
- **Logs**: Real-time application logs
- **Deployments**: Deployment history and status

## Troubleshooting

### Backend Service Won't Start

**Check:**
- Environment variables are set correctly
- `VITE_PINATA_JWT` is valid
- Check logs for errors
- Verify `server.js` exists in `BLUE-PURPLE-COBRA-LAUNCH-BACKUP/backend/`

### Frontend Can't Connect to Backend

**Check:**
- `VITE_BACKEND_API_URL` is set correctly
- Backend service is running (check health endpoint)
- CORS is configured properly in backend
- Browser console for connection errors

### Wallet Connection Issues

**Check:**
- Using HTTPS (Railway provides this automatically)
- Correct Solana network is configured
- Try different browsers/wallets
- Check browser console for errors

### Build Failures

**Check:**
- All dependencies are in `package.json`
- Build commands are correct in `railway.json`
- Node.js version compatibility
- Check build logs for specific errors

### Pinata Upload Failures

**Check:**
- `VITE_PINATA_JWT` is set in **backend** environment (not frontend!)
- JWT is valid and not expired
- Pinata API limits haven't been exceeded
- Check backend logs for detailed error messages

## Production Recommendations

### 1. Use Custom RPC Provider

For production, use a paid RPC provider:
- **Helius**: https://www.helius.dev/ (recommended for Solana)
- **QuickNode**: https://www.quicknode.com/
- **Alchemy**: https://www.alchemy.com/
- **Triton**: https://triton.one/

Add to both services:
```env
VITE_SOLANA_RPC_ENDPOINT=https://your-custom-rpc-endpoint.com
```

### 2. Custom Domain

Add a custom domain for better branding:
1. Go to frontend service settings
2. **"Settings"** → **"Networking"** → **"Custom Domain"**
3. Add your domain (e.g., `launch.yourdomain.com`)
4. Update DNS records as instructed

### 3. Environment-based Configuration

Use Railway's environment features:
- **Production**: Main branch deployment
- **Staging**: Separate service or branch for testing

### 4. Secrets Management

- Never commit `.env` files
- Use Railway's environment variables for all secrets
- Rotate Pinata JWT periodically
- Use different Pinata keys for staging/production

## Cost Optimization

Railway pricing is based on usage:
- **Starter Plan**: $5/month includes $5 credit
- **Developer Plan**: $20/month includes $20 credit
- Additional usage charged per resource

**Tips to reduce costs:**
1. Use Railway's sleep feature for non-production environments
2. Optimize build times by caching dependencies
3. Monitor resource usage in Railway dashboard
4. Use environment variables to switch between networks (devnet for testing)

## Security Checklist

- [x] Pinata JWT is in backend environment variables only
- [x] `.env` files are in `.gitignore`
- [x] HTTPS enabled (automatic with Railway)
- [x] CORS properly configured
- [x] Using custom RPC endpoint (recommended)
- [x] Environment variables are not hardcoded
- [x] No sensitive data in frontend code

## Support and Resources

### Railway Documentation
- [Railway Docs](https://docs.railway.app/)
- [Environment Variables](https://docs.railway.app/develop/variables)
- [Custom Domains](https://docs.railway.app/deploy/deployments#custom-domains)

### Application Resources
- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
- [Pinata Docs](https://docs.pinata.cloud/)

### Getting Help
- Check Railway logs for error messages
- Review browser console for frontend errors
- Test backend health endpoint
- Check Pinata dashboard for API usage

---

## Quick Start Summary

1. **Create Railway Project** → Connect GitHub repo
2. **Deploy Backend**:
   - Root: `BLUE-PURPLE-COBRA-LAUNCH-BACKUP/backend`
   - Add environment variables (including `VITE_PINATA_JWT`)
   - Generate domain
3. **Deploy Frontend**:
   - Root: `BLUE-PURPLE-COBRA-LAUNCH-BACKUP`
   - Add environment variables (including `VITE_BACKEND_API_URL` from backend)
   - Generate domain
4. **Test** → Visit frontend URL and test functionality
5. **Monitor** → Check logs and metrics in Railway dashboard

**Your Cobra Launch app should now be live on Railway! 🚀**

---

**Current Configuration:**
- Network: Mainnet Beta (configurable)
- Wallet Support: Phantom, Solflare
- IPFS Provider: Pinata (via secure backend)
- Creation Fee: 0.1 SOL
- Deployment: Railway (PaaS)
