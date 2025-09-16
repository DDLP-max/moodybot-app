#!/usr/bin/env node

// Simple test for mock server
const testPayload = {
  message: "test message",
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

async function testMock() {
  console.log("🧪 Testing mock validation server...");
  
  try {
    const response = await fetch('http://localhost:10001/api/validation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log(`Status: ${response.status}`);
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
    
    if (response.status === 200) {
      console.log("✅ Mock server is working! Validation should work in the UI now.");
    } else {
      console.log("❌ Mock server error");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.log("Make sure the mock server is running: node test-mock-validation.js");
  }
}

testMock();
