// Test script for OpenRouter API
const API_KEY = 'YOUR_ACTUAL_API_KEY_HERE'; // Replace with your real API key

async function testAPI() {
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://moodybot.ai',
        'X-Title': 'MoodyBotAI'
      },
      body: JSON.stringify({
        model: 'x-ai/grok-4',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 50
      })
    });

    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.text();
    console.log('Response:', data);
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testAPI(); 