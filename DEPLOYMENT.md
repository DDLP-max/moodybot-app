# MoodyBot Deployment Guide

## Issues Found and Fixed

### 1. Code Issues ✅
- **Fixed**: Removed duplicate function definition in `server/moodybot.ts`
- **Fixed**: Added missing import for `ChatCompletionMessageParam`
- **Fixed**: Added proper error handling and logging

### 2. Environment Variables ❌
**CRITICAL**: You need to set these environment variables in Render:

- `OPENROUTER_API_KEY` - Your OpenRouter API key
- `NODE_ENV` - Set to `production`
- `PORT` - Render will set this automatically

### 3. Build Configuration ✅
- **Fixed**: Created `render.yaml` for proper deployment configuration
- **Fixed**: Updated server to use `process.env.PORT` correctly
- **Fixed**: Added proper logging for deployment debugging

## Steps to Fix Your Deployment

### 1. Set Environment Variables in Render
1. Go to your Render dashboard
2. Select your web service
3. Go to "Environment" tab
4. Add these variables:
   ```
   NODE_ENV=production
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   ```

**OR** create a `server/.env` file with:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   NODE_ENV=production
   ```

### 2. Redeploy
1. Push your changes to your Git repository
2. Render will automatically redeploy
3. Check the build logs for any errors

### 3. Test the Deployment
1. Visit your Render URL
2. Check if the server is responding at `/api/test`
3. Look for these log messages:
   ```
   ✅ MoodyBot server listening at http://0.0.0.0:10000
   ✅ Environment: production
   ✅ API Keys: OpenRouter
   ```

## Common Issues

### Issue: "API key is invalid"
**Solution**: Make sure your `OPENROUTER_API_KEY` is correctly set in Render environment variables or in the server/.env file

### Issue: "Server not responding"
**Solution**: Check that the build completed successfully and the start command is `npm start`

### Issue: "CORS errors"
**Solution**: The server is configured to accept requests from your domain. Make sure your frontend is making requests to the correct URL.

## Debugging

### Check Render Logs
1. Go to your Render service
2. Click on "Logs" tab
3. Look for error messages or successful startup messages

### Test API Endpoints
- `GET /api/test` - Should return server status
- `POST /api/chat/messages` - Main chat endpoint

## File Structure
```
moodybot-webapp/
├── server/
│   ├── index.ts          # Main server file
│   ├── moodybot.ts       # AI logic (FIXED)
│   ├── routes.ts         # API routes
│   └── system_prompt.txt # AI system prompt
├── client/               # Frontend React app
├── package.json          # Dependencies and scripts
├── render.yaml           # Render configuration (NEW)
└── DEPLOYMENT.md         # This guide
```

## Next Steps
1. Set your environment variables in Render
2. Redeploy your application
3. Test the endpoints
4. If issues persist, check the Render logs for specific error messages 