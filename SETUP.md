# MoodyBot WebApp Setup Guide

## Issues Fixed

### 1. Formatting Issues
- ✅ Improved message formatting with better line break handling
- ✅ Enhanced styling for asterisk-wrapped text and emojis
- ✅ Fixed spacing and typography in chat bubbles
- ✅ Improved post-processing to preserve original formatting

### 2. `/savage` Command Not Working
- ✅ Added API key validation
- ✅ Improved error handling with specific error messages
- ✅ Created test script to verify API connection

## Setup Instructions

### Step 1: Configure API Key

1. **Create a `.env` file** in the `server/` directory:
```bash
# Navigate to the server directory
cd server

# Create .env file
touch .env
```

2. **Add your OpenRouter API key** to the `.env` file:
```env
OPENROUTER_API_KEY=your_actual_api_key_here
NODE_ENV=development
PORT=3001
```

### Step 2: Get an OpenRouter API Key

1. Go to [OpenRouter.ai](https://openrouter.ai)
2. Sign up for an account
3. Navigate to "Keys" section
4. Create a new API key
5. Copy the key and paste it in your `.env` file

### Step 3: Test the Connection

Run the test script to verify your API key works:

```bash
node test-api-connection.js
```

You should see:
```
🔑 API Key found: sk-xxxxx...
📡 Response status: 200
✅ API connection successful!
🤖 AI Response: [AI response here]
```

### Step 4: Start the Application

```bash
# Install dependencies (if not already done)
npm install

# Start the development server
npm run dev
```

## Troubleshooting

### If you see "MoodyBot has gone quiet":
1. Check that your `.env` file exists in the `server/` directory
2. Verify your API key is correct
3. Run the test script to confirm connectivity
4. Check the server logs for specific error messages

### If formatting looks wrong:
1. Clear your browser cache
2. Restart the development server
3. Check that the latest changes are applied

### Common Error Messages:
- **"API key is invalid or missing"** → Check your `.env` file
- **"Rate limit exceeded"** → Wait a moment and try again
- **"Invalid request format"** → Check your message content

## File Changes Made

### `client/src/pages/chat.tsx`
- Improved `formatMessageContent` function
- Enhanced styling for different message types
- Better line break handling

### `utils/moodybotPostProcess.ts`
- Removed aggressive paragraph formatting
- Preserved original message structure

### `server/moodybot.ts`
- Added API key validation
- Improved error handling
- More specific error messages

### `test-api-connection.js` (new)
- Test script to verify API connectivity

## Next Steps

1. Set up your API key following the instructions above
2. Test the connection using the provided script
3. Restart your development server
4. Try the `/savage` command - it should now work properly
5. Check that message formatting looks correct

The formatting issues should now be resolved, and the `/savage` command will work once you have a valid API key configured. 