# Render Deployment Guide for MoodyBot

## Why Switch to Render?

- ✅ **Simpler configuration** - Less complex than Railway
- ✅ **More reliable** - Better for Node.js apps
- ✅ **No health check issues** - Uses `/health` endpoint
- ✅ **Auto-deployment** - Deploys automatically on GitHub pushes

## Quick Setup

### 1. Go to Render
Visit [render.com](https://render.com) and sign up/login

### 2. Create New Web Service
1. Click "New +"
2. Select "Web Service"
3. Connect your GitHub repository: `DDLP-max/moodybot-app`

### 3. Configure Service
- **Name**: `moodybot-webapp`
- **Environment**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Health Check Path**: `/health`

### 4. Set Environment Variables
Add these in Render's dashboard:
```
OPENROUTER_API_KEY=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
NODE_ENV=production
PORT=10000
```

### 5. Deploy
Click "Create Web Service" - Render will automatically:
1. Build your app
2. Deploy it
3. Give you a URL like `https://moodybot-webapp.onrender.com`

## What We Fixed

1. **Added `/health` endpoint** - Render will use this for health checks
2. **Updated `render.yaml`** - Optimized for Render deployment
3. **Port configuration** - Uses port 10000 (your app's default)

## Testing After Deployment

1. **Health Check**: Visit `/health` endpoint
2. **Main App**: Visit root `/` endpoint
3. **Copywriter**: Test the copywriter functionality

## Advantages Over Railway

- **No health check failures** - `/health` endpoint is simple and reliable
- **Faster deployment** - Render is optimized for Node.js
- **Better monitoring** - Built-in logs and metrics
- **Auto-scaling** - Handles traffic automatically

## Next Steps

1. **Push these changes to GitHub**:
   ```bash
   git add .
   git commit -m "Switch to Render deployment: add health endpoint and update config"
   git push origin main
   ```

2. **Deploy on Render** using the steps above

3. **Test your deployed app**

Your MoodyBot will be live on Render in minutes!
