#!/usr/bin/env node

// Simple test to debug the validation endpoint
const testPayload = {
  message: "Test message",
  relationship: "friend",
  mode: "positive",
  style: "moodybot",
  intensity: "casual",
  length: "2-3-lines",
  include_followup: false,
  tags: [],
  system_flavor: "validation",
  version: "v1"
};

async function testSimple() {
  console.log("🧪 Testing simple validation...");
  console.log("Payload:", JSON.stringify(testPayload, null, 2));
  
  try {
    const response = await fetch('http://localhost:10000/api/validation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log(`Status: ${response.status}`);
    
    const text = await response.text();
    console.log("Response text:", text);
    
    if (response.status === 200) {
      console.log("✅ Success!");
    } else {
      console.log("❌ Error response");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testSimple();
