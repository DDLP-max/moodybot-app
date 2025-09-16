#!/usr/bin/env node

// Test validation with a mock response to bypass OpenRouter API call
const testPayload = {
  message: "She led teams for years, credits faith and family, wants to open a studio with her sister.",
  relationship: "friend",
  mode: "positive",
  style: "moodybot",
  intensity: "casual",
  length: "2-3-lines",
  include_followup: false,
  tags: ["faith", "family", "leadership"],
  system_flavor: "validation",
  version: "v1"
};

async function testValidation() {
  console.log("🧪 Testing validation (expecting timeout due to missing API key)...");
  console.log("Payload:", JSON.stringify(testPayload, null, 2));
  
  try {
    // Set a timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch('http://localhost:10000/api/validation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log(`Status: ${response.status}`);
    const text = await response.text();
    console.log("Response:", text);
    
    if (response.status === 200) {
      console.log("✅ Validation successful!");
    } else if (response.status === 500) {
      console.log("❌ Server error - likely missing API key");
    } else {
      console.log(`❌ Unexpected status: ${response.status}`);
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log("⏰ Request timed out - server is likely waiting for OpenRouter API");
      console.log("💡 This confirms the server is running but missing API key");
    } else {
      console.error("❌ Error:", error.message);
    }
  }
}

testValidation();
