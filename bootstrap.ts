import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment variable loading strategy for production deployment
console.log('🔍 Environment loading strategy:');
console.log('  - Local development: .env files (if present)');
console.log('  - Production: Platform environment variables (Render, Railway, etc.)');

// Check environment variable status
const apiKey = process.env.OPENROUTER_API_KEY;
console.log('🔑 API Key status:', apiKey ? 'SET' : 'NOT SET');

if (apiKey) {
  console.log('🔑 API Key format:', apiKey.startsWith('sk-or-v1-') ? '✅ Valid OpenRouter format' : '❌ Invalid format');
  console.log('🔑 API Key source:', process.env.NODE_ENV === 'production' ? 'Platform Environment' : 'Local .env file');
} else {
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  Running in production mode - make sure OPENROUTER_API_KEY is set in your deployment platform');
    console.log('   For Render: Go to Environment Variables and add OPENROUTER_API_KEY');
  } else {
    console.log('⚠️  Local development: Create a .env file with OPENROUTER_API_KEY for testing');
  }
}

import './server/index';
