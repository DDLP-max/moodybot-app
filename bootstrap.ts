import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables with fallback strategy
import dotenv from 'dotenv';

// Strategy 1: Try to load from server/.env (local development)
const localEnvPath = path.resolve(__dirname, 'server', '.env');
dotenv.config({ path: localEnvPath });

// Strategy 2: If no API key found, try loading from root .env (fallback)
if (!process.env.OPENROUTER_API_KEY) {
  const rootEnvPath = path.resolve(__dirname, '.env');
  dotenv.config({ path: rootEnvPath });
}

// Strategy 3: Check if we're in production and environment variables are set via platform
if (!process.env.OPENROUTER_API_KEY) {
  console.log('🔍 Environment loading strategy:');
  console.log('  1. Local server/.env:', localEnvPath);
  console.log('  2. Root .env:', path.resolve(__dirname, '.env'));
  console.log('  3. Platform environment variables:', process.env.NODE_ENV === 'production' ? 'CHECKING' : 'N/A');
  
  if (process.env.NODE_ENV === 'production') {
    console.log('⚠️  Running in production mode - make sure OPENROUTER_API_KEY is set in your deployment platform');
  }
}

// Log the final status
console.log('🔑 Final API Key status:', process.env.OPENROUTER_API_KEY ? 'SET' : 'NOT SET');
if (process.env.OPENROUTER_API_KEY) {
  console.log('🔑 API Key format:', process.env.OPENROUTER_API_KEY.startsWith('sk-or-v1-') ? '✅ Valid OpenRouter format' : '❌ Invalid format');
}

import './server/index';
