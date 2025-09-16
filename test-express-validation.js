#!/usr/bin/env node

// Test the Express validation endpoint
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

async function testExpressValidation() {
  console.log("🧪 Testing Express validation endpoint...");
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
    console.log(`Headers:`, Object.fromEntries(response.headers.entries()));
    
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.log("Raw response:", text);
      return;
    }
    
    console.log("Response:", JSON.stringify(data, null, 2));
    
    if (response.status === 200) {
      console.log("✅ Express validation endpoint is working!");
    } else if (response.status === 422) {
      console.log("❌ Schema validation failed - check zod_errors");
    } else {
      console.log(`❌ Unexpected status: ${response.status}`);
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.log("Make sure the Express server is running on port 10000");
  }
}

testExpressValidation();
