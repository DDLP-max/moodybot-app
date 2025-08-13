const apiKey = "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";

console.log("🔑 Testing API key:", apiKey.substring(0, 20) + "...");

async function testOpenRouter() {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://moodybot.ai",
        "X-Title": "MoodyBotAI"
      },
      body: JSON.stringify({
        model: "anthropic/claude-3.5-sonnet",
        messages: [
          { role: "user", content: "Hello, this is a test message." }
        ],
        max_tokens: 50
      })
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Success! Response:", data);
    } else {
      const errorText = await response.text();
      console.log("❌ Error response:", errorText);
    }
  } catch (error) {
    console.error("❌ Fetch error:", error);
  }
}

testOpenRouter();
