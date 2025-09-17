#!/usr/bin/env node

// Debug validation with detailed error reporting
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

async function debugValidation() {
  console.log("🔍 Debug validation request...");
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
    console.log(`Status Text: ${response.statusText}`);
    
    const responseText = await response.text();
    console.log("Response Body:", responseText);
    
    if (response.status === 200) {
      console.log("✅ SUCCESS!");
    } else {
      console.log("❌ Error - check server logs for details");
    }
    
  } catch (error) {
    console.error("❌ Network Error:", error.message);
  }
}

debugValidation();
