# Quick Railway Setup Guide

## Your Project Credentials

**Railway Project ID:** `8e020faf-9bfb-40c4-8d2b-167c9bed3970`

## Step 1: Deploy to Railway

1. Go to **Railway Dashboard**: https://railway.app/dashboard
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose repository: `BUGGERMYBATTY/COBRA-LAUNCH-COMPLETE-B-P`
5. Select branch: `claude/upload-repo-remote-01SgTjQQergDeXG7maD3moGU`

## Step 2: Set Environment Variables

Go to your Railway project → **Variables** tab and add these variables:

### Required Variables

```
VITE_PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjODk5NjkzOC1mYjljLTQ2M2UtOGU2ZC1jYWYzMjIzN2Y3YTAiLCJlbWFpbCI6Impvbm55c2FsZWVuQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI1ZmYyNzk4OWIyNWEyNDkzYWFlMSIsInNjb3BlZEtleVNlY3JldCI6IjJmMGI0MzBkMGNmNmM2ZDg0YzQ5NWFkMmYxMGFkMGUwOTIwM2NiZjFjYzRkOGQzNDhlNmRhNzUwNWMwNTAyM2YiLCJleHAiOjE3OTQzMzIxMzd9._UQpOPAJoIiIVPIZ-qzkWPlUSutgQoJZODLkOUALj3Q

VITE_PINATA_GATEWAY=https://yellow-peculiar-cephalopod-560.mypinata.cloud

VITE_SOLANA_NETWORK=devnet

VITE_BACKEND_API_URL=https://temporary-placeholder.railway.app
```

**Note:** You'll update `VITE_BACKEND_API_URL` in Step 4 after getting your actual Railway domain.

### Copy-Paste Format for Railway Dashboard

Click **"New Variable"** for each of these:

**Variable 1:**
- Name: `VITE_PINATA_JWT`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjODk5NjkzOC1mYjljLTQ2M2UtOGU2ZC1jYWYzMjIzN2Y3YTAiLCJlbWFpbCI6Impvbm55c2FsZWVuQGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI1ZmYyNzk4OWIyNWEyNDkzYWFlMSIsInNjb3BlZEtleVNlY3JldCI6IjJmMGI0MzBkMGNmNmM2ZDg0YzQ5NWFkMmYxMGFkMGUwOTIwM2NiZjFjYzRkOGQzNDhlNmRhNzUwNWMwNTAyM2YiLCJleHAiOjE3OTQzMzIxMzd9._UQpOPAJoIiIVPIZ-qzkWPlUSutgQoJZODLkOUALj3Q`

**Variable 2:**
- Name: `VITE_PINATA_GATEWAY`
- Value: `https://yellow-peculiar-cephalopod-560.mypinata.cloud`

**Variable 3:**
- Name: `VITE_SOLANA_NETWORK`
- Value: `devnet`

**Variable 4:**
- Name: `VITE_BACKEND_API_URL`
- Value: `https://temporary-placeholder.railway.app` (will update later)

## Step 3: Generate Public Domain

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy your Railway domain (e.g., `cobra-launch-production-xxxx.up.railway.app`)

## Step 4: Update Backend URL

1. Go back to **Variables** tab
2. Find `VITE_BACKEND_API_URL`
3. Click **Edit**
4. Update value to: `https://YOUR-ACTUAL-DOMAIN.up.railway.app`
   - Replace `YOUR-ACTUAL-DOMAIN` with the domain from Step 3
5. Click **Save**

## Step 5: Redeploy

After updating the backend URL:
1. Go to **Deployments** tab
2. Click **"Redeploy"** on the latest deployment
   - Or just wait a few seconds - Railway auto-redeploys when you change variables

## Step 6: Test Your Deployment

### Test Backend API
Visit: `https://YOUR-DOMAIN.up.railway.app/api/health`

Should return:
```json
{"status":"ok","message":"Cobra Launch Backend API is running"}
```

### Test Frontend
Visit: `https://YOUR-DOMAIN.up.railway.app`

You should see the Cobra Launch interface with:
- Connect wallet button
- Token creation form
- Solana network indicator showing "devnet"

## Troubleshooting

### Build Fails
- Check **Deployments** → **View Logs**
- Ensure all environment variables are set correctly

### API Not Working
- Verify `VITE_PINATA_JWT` is set correctly (check for copy/paste errors)
- Check that `VITE_BACKEND_API_URL` matches your actual Railway domain

### Frontend Shows Errors
- Check browser console (F12)
- Verify backend health endpoint is accessible
- Ensure HTTPS is used (not HTTP)

## What Happens During Deployment

1. **Build Phase** (~2-3 minutes):
   - Installs frontend dependencies
   - Builds React/Vite frontend to `dist/` folder
   - Installs backend dependencies

2. **Start Phase**:
   - Starts Node.js server from `backend/server.js`
   - Server listens on Railway's assigned PORT
   - Serves frontend from `dist/` folder
   - Handles API requests on `/api/*` routes

3. **Access**:
   - Your app is accessible at the Railway domain
   - HTTPS is automatically enabled
   - Wallets can connect (requires HTTPS)

## Network Settings

**Currently configured for:** Solana Devnet

To switch to mainnet later:
1. Update `VITE_SOLANA_NETWORK` to `mainnet-beta`
2. Optionally add a custom RPC endpoint:
   - Variable: `VITE_SOLANA_RPC_ENDPOINT`
   - Value: `https://your-rpc-provider.com`

## Cost Estimate

- **Free Tier**: $5 credit/month (should be enough for testing)
- **Hobby Plan**: $5/month (recommended for low traffic)
- **Estimated usage**: ~$2-5/month for moderate use

## Next Steps After Deployment

1. ✅ Test token creation on devnet
2. ✅ Verify image uploads to Pinata work
3. ✅ Test wallet connections (Phantom, Solflare)
4. ✅ Check that tokens appear in wallet
5. ✅ Monitor Railway logs for any errors
6. ✅ When ready, switch to mainnet and add custom RPC

## Support

- **Railway Docs**: https://docs.railway.app/
- **Railway Discord**: https://discord.gg/railway
- **View Logs**: Railway Dashboard → Deployments → View Logs

---

**Quick Links:**
- Railway Dashboard: https://railway.app/dashboard
- Pinata Dashboard: https://app.pinata.cloud/
- Solana Devnet Faucet: https://faucet.solana.com/

Good luck with your deployment! 🚀
