# Vercel Deployment Guide for Cobra Launch

This guide will help you deploy the Cobra Launch Solana token launcher on Vercel in just a few minutes.

## Why Vercel?

- ✅ **Zero-config** - Works out of the box with Vite/React
- ✅ **Serverless functions** - Backend API routes included
- ✅ **Automatic HTTPS** - SSL certificates handled automatically
- ✅ **Free tier** - Generous limits for most projects
- ✅ **GitHub integration** - Auto-deploy on push
- ✅ **Simple setup** - Deploy in ~5 minutes

## Prerequisites

- GitHub account (to connect your repository)
- Vercel account (free - sign up at https://vercel.com)
- Pinata account and JWT token (get from https://app.pinata.cloud/developers/api-keys)

## Step 1: Push Your Code to GitHub

Your code is already in the repository: `BUGGERMYBATTY/COBRA-LAUNCH-COMPLETE-B-P`

Make sure the latest changes are pushed:
```bash
git push origin claude/setup-deployment-01QkkqE3RyKRfWsthmAAdMCx
```

## Step 2: Import Project to Vercel

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your GitHub repository: `BUGGERMYBATTY/COBRA-LAUNCH-COMPLETE-B-P`
4. Select branch: `claude/setup-deployment-01QkkqE3RyKRfWsthmAAdMCx`
5. Click **"Import"**

## Step 3: Configure Project Settings

Vercel will auto-detect your project. **No configuration needed** - the `vercel.json` file handles everything!

Just click **"Deploy"** to continue.

## Step 4: Set Environment Variables

**IMPORTANT:** Before the deployment completes, add these environment variables:

In the Vercel dashboard, go to **Settings** → **Environment Variables** and add:

### Required Variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `PINATA_JWT` | `your_pinata_jwt_here` | Your Pinata API JWT token |
| `PINATA_GATEWAY` | `https://your-gateway.mypinata.cloud` | Your Pinata gateway URL |
| `VITE_SOLANA_NETWORK` | `mainnet-beta` | Solana network (mainnet-beta, devnet, testnet) |

### Optional Variables:

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `VITE_SOLANA_RPC_ENDPOINT` | `https://your-rpc-url.com` | Custom RPC endpoint (recommended for production) |
| `VITE_TREASURY_ADDRESS` | `your_wallet_address` | Treasury wallet for platform fees |

**Note:** On Vercel, the backend API is served from the same domain, so you don't need `VITE_BACKEND_API_URL`. The frontend will automatically use `/api/*` routes.

## Step 5: Deploy!

After adding environment variables:
1. Click **"Redeploy"** if deployment already completed
2. Or just wait for the initial deployment to finish

Vercel will:
1. Install dependencies
2. Build your frontend (Vite)
3. Deploy serverless functions (API routes)
4. Give you a live URL (e.g., `https://your-project.vercel.app`)

## Step 6: Test Your Deployment

1. **Visit your Vercel URL** (e.g., `https://your-project.vercel.app`)
2. **Test API health**: `https://your-project.vercel.app/api/health`
   - Should return: `{"status":"ok","message":"Cobra Launch Backend API is running on Vercel"}`
3. **Connect wallet** (Phantom or Solflare)
4. **Try creating a test token** on devnet first

## Environment Variables Explained

### Frontend (.env for local development)

```env
# Solana Network
VITE_SOLANA_NETWORK=mainnet-beta

# Optional: Custom RPC (recommended for production)
VITE_SOLANA_RPC_ENDPOINT=https://your-rpc-endpoint.com

# Optional: Treasury wallet for fees
VITE_TREASURY_ADDRESS=your_treasury_wallet_address
```

### Backend (Set in Vercel Dashboard)

```env
# Pinata Configuration (CRITICAL - Keep Secret!)
PINATA_JWT=your_actual_pinata_jwt_here
PINATA_GATEWAY=https://your-gateway.mypinata.cloud

# These are automatically available to serverless functions
VITE_SOLANA_NETWORK=mainnet-beta
```

## Project Structure

```
COBRA-LAUNCH-COMPLETE-B-P/
├── vercel.json                        # Vercel configuration
├── api/                               # Serverless functions (backend)
│   ├── health.js                      # Health check endpoint
│   ├── upload-image.js                # Image upload to Pinata
│   ├── upload-metadata.js             # Metadata upload to Pinata
│   └── package.json                   # API dependencies
└── BLUE-PURPLE-COBRA-LAUNCH-BACKUP/   # Frontend (React + Vite)
    ├── dist/                          # Build output (auto-generated)
    ├── src/
    ├── package.json
    └── vite.config.ts
```

## API Endpoints

All API endpoints are serverless functions:

- **Health Check**: `GET /api/health`
- **Upload Image**: `POST /api/upload-image`
- **Upload Metadata**: `POST /api/upload-metadata`

## Automatic Deployments

Vercel automatically redeploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push origin claude/setup-deployment-01QkkqE3RyKRfWsthmAAdMCx

# Vercel automatically detects and deploys!
```

## Custom Domain (Optional)

To add a custom domain:

1. Go to Vercel dashboard → **Settings** → **Domains**
2. Click **"Add"**
3. Enter your domain (e.g., `launch.yourdomain.com`)
4. Follow DNS configuration instructions
5. Vercel automatically provisions SSL certificate

## Monitoring and Logs

### View Logs

1. Go to Vercel dashboard
2. Click on your project
3. Click **"Deployments"** → Select deployment
4. View **"Runtime Logs"** for serverless function logs
5. View **"Build Logs"** for build errors

### Analytics

Vercel provides built-in analytics:
- **Speed Insights** - Performance metrics
- **Web Vitals** - Core Web Vitals tracking
- **Visitor Analytics** - Page views and visitors

## Troubleshooting

### Build Fails

**Check:**
- Environment variables are set correctly
- `vercel.json` is in the root directory
- Node modules install successfully
- View build logs in Vercel dashboard

### API Endpoints Return 500

**Check:**
- `PINATA_JWT` environment variable is set
- JWT is valid (not expired)
- Check Runtime Logs in Vercel dashboard
- Test locally first: `vercel dev`

### Wallet Connection Issues

**Check:**
- HTTPS is enabled (Vercel provides this automatically)
- Correct network is configured
- Browser console for errors
- Try different browsers/wallets

### Image/Metadata Upload Fails

**Check:**
- `PINATA_JWT` is set in Vercel environment variables (not locally)
- JWT is valid and has upload permissions
- Check Pinata dashboard for API limits
- View Runtime Logs for detailed errors

## Local Development with Vercel

To test Vercel serverless functions locally:

```bash
# Install Vercel CLI
npm i -g vercel

# Run local development server
cd BLUE-PURPLE-COBRA-LAUNCH-BACKUP
vercel dev

# This will:
# - Start Vite dev server on localhost:3000
# - Start serverless functions on localhost:3000/api/*
# - Simulate Vercel environment locally
```

## Production Recommendations

### 1. Use Custom RPC Provider

For production, use a paid RPC provider for better performance:

- **Helius**: https://www.helius.dev/ (recommended for Solana)
- **QuickNode**: https://www.quicknode.com/
- **Alchemy**: https://www.alchemy.com/

Add to Vercel environment variables:
```
VITE_SOLANA_RPC_ENDPOINT=https://your-custom-rpc.com
```

### 2. Enable Vercel Analytics

1. Go to **Analytics** tab in Vercel dashboard
2. Enable **Web Analytics** (free)
3. Optionally enable **Speed Insights** for performance monitoring

### 3. Set Up Alerts

1. Go to **Settings** → **Notifications**
2. Enable deployment status emails
3. Set up error alerts for serverless functions

### 4. Use Environment-Specific Variables

Vercel supports different environments:
- **Production** - Main branch deployments
- **Preview** - Pull request and branch deployments
- **Development** - Local development

You can set different variables for each environment.

## Security Best Practices

- ✅ **NEVER** commit `.env` files
- ✅ **ALWAYS** use Vercel environment variables for secrets
- ✅ `PINATA_JWT` is only accessible to serverless functions (backend)
- ✅ Frontend code is public - never include secrets there
- ✅ HTTPS enabled by default
- ✅ CORS configured in serverless functions

## Cost and Limits

### Vercel Free Tier Includes:

- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ 100 GB-hours serverless function execution
- ✅ Automatic SSL certificates
- ✅ Global CDN
- ✅ Analytics

### Typical Usage for Cobra Launch:

- **Frontend**: ~50 MB (static files)
- **Serverless Functions**: ~1-2 GB-hours/month (typical usage)
- **Bandwidth**: ~5-20 GB/month (depending on traffic)

**Most users stay within free tier limits!**

## Getting Help

### Resources:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)
- [Solana Documentation](https://docs.solana.com/)
- [Pinata Documentation](https://docs.pinata.cloud/)

### Common Issues:
- Check Vercel deployment logs
- Test locally with `vercel dev`
- Review browser console for frontend errors
- Check Pinata dashboard for API usage

---

## Quick Start Summary

1. **Push code to GitHub** ✓ (already done)
2. **Import to Vercel** → https://vercel.com/new
3. **Add environment variables** → `PINATA_JWT`, `PINATA_GATEWAY`, etc.
4. **Deploy** → Click deploy button
5. **Test** → Visit your Vercel URL
6. **Done!** 🎉

Your Cobra Launch app will be live at: `https://your-project.vercel.app`

---

**Deployment Status:**
- ✅ Serverless functions configured
- ✅ Frontend build configured
- ✅ Environment variables documented
- ✅ Security best practices implemented
- ✅ Ready to deploy!

**Next Steps:**
1. Go to https://vercel.com/new
2. Import this repository
3. Add environment variables
4. Click deploy!
