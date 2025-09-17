#!/usr/bin/env node

// Test the fixed validation with correct style values
const testPayload = {
  message: "She led teams for years, credits faith and family, wants to open a studio with her sister.",
  relationship: "friend",
  mode: "positive",
  style: "moodybot", // Fixed: lowercase as server expects
  intensity: "casual",
  length: "2-3-lines",
  include_followup: false,
  tags: ["faith", "family", "leadership"],
  system_flavor: "validation",
  version: "v1"
};

async function testFixed() {
  console.log("🧪 Testing fixed validation (correct style values)...");
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
    
    if (response.status === 200) {
      const data = await response.json();
      console.log("✅ SUCCESS! Response:", JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log("❌ Error response:", errorText);
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

testFixed();
