#!/usr/bin/env node

// Quick debug script to test the validation endpoint
const testPayload = {
  message: "She led teams for years, credits faith and family, wants to open a studio with her sister.",
  relationship: "friend",
  mode: "positive", 
  style: "MoodyBot",
  intensity: "casual",
  length: "2-3-lines",
  include_followup: true,
  followup_style: "question",
  tags: ["faith", "family", "leadership"],
  system_flavor: "validation",
  version: "v1"
};

async function testValidation() {
  console.log("🧪 Testing validation endpoint...");
  console.log("Payload:", JSON.stringify(testPayload, null, 2));
  
  try {
    const response = await fetch('http://localhost:3001/api/validation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload)
    });
    
    console.log(`Status: ${response.status}`);
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log("Response:", JSON.stringify(data, null, 2));
    
    if (response.status === 400) {
      console.log("❌ 400 Error - Check server logs for Zod validation details");
    } else if (response.status === 200) {
      console.log("✅ Success!");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testValidation();
