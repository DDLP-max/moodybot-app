// Test API Connection Script
// Run this to verify your OpenRouter API key is working

const testApiConnection = async () => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    console.log('❌ OPENROUTER_API_KEY is not set');
    console.log('Please create a .env file in the server directory with:');
    console.log('OPENROUTER_API_KEY=your_actual_api_key_here');
    return;
  }
  
  console.log('🔑 API Key found:', apiKey.substring(0, 8) + '...');
  
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://moodybot.ai",
        "X-Title": "MoodyBotAI"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          { role: "user", content: "Hello, this is a test message" }
        ],
        temperature: 0.7,
        max_tokens: 100
      }),
    });
    
    console.log('📡 Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API connection successful!');
      console.log('🤖 AI Response:', data.choices?.[0]?.message?.content);
    } else {
      const errorText = await response.text();
      console.log('❌ API Error:', errorText);
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
  }
};

// Load environment variables
require('dotenv').config({ path: './server/.env' });

testApiConnection(); 