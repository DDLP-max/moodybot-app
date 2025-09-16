#!/usr/bin/env node

// Test with known-good payload to verify the route works
const knownGoodPayload = {
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

async function testKnownGood() {
  console.log("🧪 Testing with known-good payload...");
  console.log("Payload:", JSON.stringify(knownGoodPayload, null, 2));
  
  try {
    const response = await fetch('http://localhost:3001/api/validation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(knownGoodPayload)
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
    
    if (response.status === 422) {
      console.log("❌ Schema validation failed - check zod_errors");
      console.log("Expected fields:", data.schema_keys);
      console.log("Received fields:", Object.keys(knownGoodPayload));
    } else if (response.status === 200) {
      console.log("✅ Known-good payload works! The route is fine.");
    } else {
      console.log(`❌ Unexpected status: ${response.status}`);
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testKnownGood();
