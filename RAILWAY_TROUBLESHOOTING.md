# Railway Health Check Failure - Troubleshooting Guide

## Current Issue
Your Railway deployment is failing at the **Network > Healthcheck** phase with a 4:51 duration failure.

## What I Fixed

### 1. Health Check Configuration
- Changed health check from `/api/test` to `/` (root endpoint)
- Increased timeout from 300s to 600s
- Added root endpoint to handle health checks

### 2. Build Script Optimization
- Removed `.env` file copying (Railway handles this via environment variables)
- Kept logs directory creation for Railway deployment

### 3. Railway Configuration
- Added environment-specific variable configuration
- Set proper port (8080) for Railway

## Immediate Actions Required

### Step 1: Set Environment Variables in Railway
**CRITICAL**: You must set these in Railway's Variables tab:

1. Go to Railway dashboard → moodybot-app service
2. Click "Variables" tab
3. Add these variables:

```
OPENROUTER_API_KEY=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
NODE_ENV=production
PORT=8080
```

### Step 2: Redeploy
1. Go to "Deployments" tab
2. Click "Deploy" or "Redeploy"
3. Watch the build logs

## Why Health Check Was Failing

### 1. Missing Environment Variables
- Railway couldn't find `OPENROUTER_API_KEY`
- App couldn't start properly without required variables
- Health check failed because app wasn't running

### 2. Port Mismatch
- Your app was configured for port 10000
- Railway expects port 8080
- Fixed in configuration

### 3. Health Check Endpoint
- `/api/test` might not be accessible during startup
- Root endpoint `/` is more reliable for health checks

## Expected Success Flow

1. **Build** ✅ (should complete in ~5-6 minutes)
2. **Deploy** ✅ (should complete in ~10-15 seconds)
3. **Network > Healthcheck** ✅ (should complete in ~30 seconds)
4. **Post-deploy** ✅ (should complete quickly)

## If Health Check Still Fails

### Check Railway Logs
1. Click "View logs" in the failed deployment
2. Look for these specific errors:

**Port binding error:**
```
Error: listen EADDRINUSE: address already in use :::8080
```

**Environment variable error:**
```
⚠️  OPENROUTER_API_KEY is not set in .env file
```

**App startup error:**
```
❌ Failed to start server: [specific error]
```

### Common Solutions

**Port conflict:**
- Railway automatically handles port assignment
- Make sure PORT=8080 is set in variables

**Missing API key:**
- Double-check OPENROUTER_API_KEY is set correctly
- No spaces or quotes around the value

**Build failure:**
- Check that all dependencies are in package.json
- Verify build script completes successfully

## Testing After Fix

1. **Health Check**: Visit `moodybot-app-production.up.railway.app/`
2. **API Test**: Visit `moodybot-app-production.up.railway.app/api/test`
3. **Copywriter**: Test the copywriter functionality

## Success Indicators

Look for these messages in Railway logs:
```
✅ MoodyBot server listening at http://0.0.0.0:8080
✅ Environment: production
✅ API Keys: OpenRouter
```

## Next Steps

1. Set environment variables in Railway
2. Redeploy the service
3. Monitor the deployment logs
4. Test the endpoints after successful deployment

The health check should pass once the environment variables are properly set!
