# Railway Deployment Guide for Cobra Launch

This guide will help you deploy the Cobra Launch Solana token launcher on Railway with a single service that serves both the backend API and frontend.

## What's Been Configured

✅ Backend server updated to serve static frontend files
✅ CORS configured to allow Railway domains
✅ `railway.json` configuration file created
✅ `Procfile` created for Railway deployment
✅ Environment variable support configured

## Quick Deploy to Railway

### Option 1: Deploy via Railway CLI (Recommended)

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize Railway Project**
   ```bash
   railway init
   ```
   - Enter a project name (e.g., "cobra-launch")
   - Select "Create new project"

4. **Set Environment Variables**
   ```bash
   railway variables set VITE_PINATA_JWT="your_pinata_jwt_here"
   railway variables set VITE_PINATA_GATEWAY="https://your-gateway.mypinata.cloud"
   railway variables set VITE_SOLANA_NETWORK="mainnet-beta"
   railway variables set VITE_BACKEND_API_URL="https://your-app.up.railway.app"
   ```

   **Note:** You'll need to update `VITE_BACKEND_API_URL` after first deployment with your actual Railway URL.

5. **Deploy**
   ```bash
   railway up
   ```

6. **Get Your Railway URL**
   ```bash
   railway domain
   ```

   Copy the domain (e.g., `cobra-launch-production.up.railway.app`)

7. **Update Backend URL Environment Variable**
   ```bash
   railway variables set VITE_BACKEND_API_URL="https://your-actual-domain.up.railway.app"
   ```

8. **Redeploy with Correct URL**
   ```bash
   railway up
   ```

### Option 2: Deploy via Railway Dashboard

1. **Go to Railway Dashboard**
   - Visit: https://railway.app/
   - Click "New Project"

2. **Deploy from GitHub**
   - Click "Deploy from GitHub repo"
   - Select your repository
   - Railway will automatically detect the configuration

3. **Set Environment Variables**
   - Go to your project → Variables tab
   - Add the following variables:

   ```env
   VITE_PINATA_JWT=your_pinata_jwt_token_here
   VITE_PINATA_GATEWAY=https://your-gateway.mypinata.cloud
   VITE_SOLANA_NETWORK=mainnet-beta
   VITE_BACKEND_API_URL=https://your-app.up.railway.app
   ```

4. **Generate Domain**
   - Go to Settings → Networking
   - Click "Generate Domain"
   - Copy your domain (e.g., `cobra-launch-production.up.railway.app`)

5. **Update Backend URL**
   - Go back to Variables tab
   - Update `VITE_BACKEND_API_URL` with your actual Railway domain
   - Format: `https://your-actual-domain.up.railway.app`

6. **Trigger Redeploy**
   - Go to Deployments
   - Click "Deploy" or wait for auto-redeploy

## Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_PINATA_JWT` | Your Pinata JWT token (get from [Pinata](https://app.pinata.cloud/developers/api-keys)) | `eyJhbGciOi...` |
| `VITE_PINATA_GATEWAY` | Your Pinata dedicated gateway URL | `https://your-gateway.mypinata.cloud` |
| `VITE_SOLANA_NETWORK` | Solana network to use | `mainnet-beta` or `devnet` |
| `VITE_BACKEND_API_URL` | Your Railway app URL (set after first deploy) | `https://your-app.up.railway.app` |
| `VITE_SOLANA_RPC_ENDPOINT` | (Optional) Custom Solana RPC endpoint | `https://your-rpc.com` |

## How It Works

1. **Build Process**: Railway runs `npm install && npm run build && cd backend && npm install`
2. **Frontend Build**: Creates static files in `dist/` folder
3. **Backend Start**: Starts Node.js server from `backend/server.js`
4. **Static Serving**: Backend serves frontend from `dist/` folder
5. **API Routes**: Backend handles all `/api/*` requests
6. **SPA Fallback**: All other routes serve `index.html` for React routing

## Architecture

```
Railway Service (Single Container)
├── Frontend (React/Vite) → Built to dist/
└── Backend (Node.js/Express)
    ├── Serves static files from dist/
    ├── Handles /api/* endpoints
    └── Proxies Pinata uploads securely
```

## Verify Deployment

### 1. Check Backend Health
Visit: `https://your-domain.up.railway.app/api/health`

Should return:
```json
{"status":"ok","message":"Cobra Launch Backend API is running"}
```

### 2. Check Frontend
Visit: `https://your-domain.up.railway.app`

You should see the Cobra Launch interface.

### 3. Check Logs
```bash
railway logs
```

Or view logs in the Railway Dashboard → Deployments → View Logs

## Monitoring

### View Logs
```bash
# Railway CLI
railway logs

# Or follow logs in real-time
railway logs -f
```

### View Metrics
- Go to Railway Dashboard → Your Project → Metrics
- Monitor CPU, Memory, Network usage

## Updating Your Deployment

### Method 1: Automatic (GitHub Push)
If connected to GitHub:
```bash
git add .
git commit -m "Update app"
git push origin main
```
Railway will automatically redeploy.

### Method 2: Manual (Railway CLI)
```bash
railway up
```

## Custom Domain (Optional)

1. **Add Custom Domain in Railway**
   - Go to Settings → Networking
   - Click "Custom Domain"
   - Enter your domain (e.g., `cobra.yourdomain.com`)

2. **Update DNS**
   - Add CNAME record pointing to your Railway domain
   - Example: `cobra.yourdomain.com` → `your-app.up.railway.app`

3. **Update Environment Variable**
   ```bash
   railway variables set VITE_BACKEND_API_URL="https://cobra.yourdomain.com"
   ```

4. **Redeploy**
   ```bash
   railway up
   ```

## Troubleshooting

### Build Fails

**Check build logs:**
```bash
railway logs
```

**Common issues:**
- Missing dependencies: Check `package.json` and `backend/package.json`
- Build timeout: Increase timeout in Railway settings

### Backend API Not Working

**Check environment variables:**
```bash
railway variables
```

**Ensure these are set:**
- `VITE_PINATA_JWT`
- `VITE_PINATA_GATEWAY`
- `VITE_BACKEND_API_URL`

### CORS Errors

The backend is configured to allow Railway domains. If you see CORS errors:

1. Check that `VITE_BACKEND_API_URL` matches your Railway domain
2. Ensure you're using HTTPS (not HTTP)
3. Check browser console for specific error messages

### Wallet Connection Issues

**Ensure you're using HTTPS:**
- Solana wallet adapters require HTTPS
- Railway provides HTTPS by default
- If using custom domain, ensure SSL is configured

### Frontend Not Loading

**Check these:**
1. Verify `dist/` folder was built: Check build logs
2. Ensure static file serving is working: Check server logs
3. Check if index.html exists in dist/

### Pinata Upload Failing

**Check these:**
1. Verify `VITE_PINATA_JWT` is set correctly
2. Check Pinata dashboard for API limits
3. View backend logs: `railway logs`
4. Test health endpoint: `https://your-domain.up.railway.app/api/health`

## Cost Estimation

Railway offers:
- **Free Tier**: $5 credit per month (suitable for testing)
- **Hobby Plan**: $5/month (suitable for small apps)
- **Pro Plan**: Starting at $20/month (production apps)

**Estimated usage for Cobra Launch:**
- Low traffic: Free tier should suffice
- Medium traffic: ~$5-10/month
- High traffic: ~$20-50/month

Monitor your usage in Railway Dashboard → Billing.

## Security Best Practices

1. **Never commit `.env` file**
   - Already in `.gitignore`
   - Use Railway environment variables

2. **Rotate Pinata JWT regularly**
   - Update in Railway: `railway variables set VITE_PINATA_JWT="new_jwt"`

3. **Use custom RPC endpoint**
   - Recommended for production
   - Set `VITE_SOLANA_RPC_ENDPOINT` variable

4. **Enable Railway's built-in security features**
   - DDoS protection (enabled by default)
   - Rate limiting (configure in settings)

## Performance Optimization

1. **Use Custom RPC Provider**
   ```bash
   railway variables set VITE_SOLANA_RPC_ENDPOINT="https://your-rpc-provider.com"
   ```

   Recommended providers:
   - QuickNode: https://www.quicknode.com/
   - Helius: https://www.helius.dev/
   - Alchemy: https://www.alchemy.com/

2. **Enable Caching**
   - Static files are automatically cached by Railway CDN
   - Ensure proper cache headers in frontend build

3. **Monitor Performance**
   - Check Railway metrics regularly
   - Upgrade plan if needed for better performance

## Support

### Railway Support
- Documentation: https://docs.railway.app/
- Discord: https://discord.gg/railway
- Support: support@railway.app

### Project Issues
- Check logs: `railway logs`
- Review environment variables: `railway variables`
- Test endpoints manually

## Next Steps

After deployment:

1. ✅ Test token creation flow
2. ✅ Verify Pinata uploads work
3. ✅ Test wallet connections
4. ✅ Monitor logs for errors
5. ✅ Set up custom domain (optional)
6. ✅ Configure custom RPC endpoint (recommended)
7. ✅ Set up monitoring/alerts

---

**Current Configuration:**
- Network: Mainnet Beta (configurable)
- Wallet Support: Phantom, Solflare
- IPFS Provider: Pinata (via secure backend)
- Creation Fee: 0.1 SOL
- Platform: Railway (PaaS)
- Architecture: Single service (Backend + Frontend)

**Railway Advantages:**
- ✅ Simple deployment process
- ✅ Automatic HTTPS
- ✅ Built-in CI/CD
- ✅ Easy environment variable management
- ✅ Automatic scaling
- ✅ Free tier available
