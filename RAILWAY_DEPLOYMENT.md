# Railway Deployment Guide for MoodyBot

## Current Issue
Your Railway deployment is failing with "No deploys for this service" and 404 errors. This guide will fix the deployment issues.

## What I Fixed

### 1. Created Railway Configuration
- Added `railway.json` with proper build and deploy settings
- Set port to 8080 (Railway standard)
- Configured health check endpoint

### 2. Environment Variables Setup
- Created `railway.env.template` showing required variables
- Set NODE_ENV to production
- Configured PORT for Railway

## Steps to Fix Your Railway Deployment

### Step 1: Set Environment Variables in Railway
1. Go to your Railway dashboard
2. Select the "moodybot-app" service
3. Go to "Variables" tab
4. Add these environment variables:

```
OPENROUTER_API_KEY=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
NODE_ENV=production
PORT=8080
```

### Step 2: Redeploy Your Service
1. In Railway, go to "Deployments" tab
2. Click "Deploy" or "Redeploy"
3. Watch the build logs for any errors

### Step 3: Check the Build Logs
Look for these success messages:
```
✅ MoodyBot server listening at http://0.0.0.0:8080
✅ Environment: production
✅ API Keys: OpenRouter
```

## Common Railway Issues & Solutions

### Issue: "No deploys for this service"
**Solution**: The service needs to be redeployed after configuration changes

### Issue: Build fails
**Solution**: Check that all dependencies are in package.json and build script works

### Issue: Port conflicts
**Solution**: Railway uses port 8080 by default, which is now configured

### Issue: Environment variables not loaded
**Solution**: Make sure variables are set in Railway dashboard, not in local .env

## Railway vs Render

**You currently have both:**
- `render.yaml` - For Render deployment
- `railway.json` - For Railway deployment

**Choose one platform:**
- **Railway**: Better for Node.js apps, easier setup
- **Render**: More features, but more complex

## Testing Your Deployment

1. **Health Check**: Visit `/api/test` endpoint
2. **Main App**: Check if the app loads at root
3. **API Endpoints**: Test copywriter functionality

## Next Steps

1. Set the environment variables in Railway
2. Redeploy the service
3. Check the build logs
4. Test the deployed app

## If Issues Persist

1. Check Railway build logs for specific error messages
2. Verify all environment variables are set
3. Ensure the build script completes successfully
4. Check that the start script runs without errors

Your app should deploy successfully once these changes are applied!
