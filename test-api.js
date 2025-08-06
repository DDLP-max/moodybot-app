async function testOpenRouter() {
  const apiKey = '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';
  const model = 'anthropic/claude-3.5-sonnet';
  
  console.log('Testing OpenRouter API with model:', model);
  
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://moodybot.ai',
        'X-Title': 'MoodyBotAI'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'user', content: 'Hello, how are you?' }
        ],
        temperature: 0.85,
        max_tokens: 1200
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('Success! Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testOpenRouter(); 