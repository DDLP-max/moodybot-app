#!/usr/bin/env node

// Test script for validation API with three different vectors
const testVectors = [
  {
    name: "A. Positive • Friend • Casual • 2–3-lines",
    payload: {
      "message": "She led teams for years, credits faith and family, wants to open a studio with her sister.",
      "relationship": "friend",
      "mode": "positive",
      "style": "MoodyBot",
      "intensity": "casual",
      "length": "2-3-lines",
      "include_followup": true,
      "followup_style": "question",
      "tags": ["faith", "family", "leadership"],
      "system_flavor": "validation",
      "version": "v1"
    }
  },
  {
    name: "B. Positive • Mentor • Feather • 1-line",
    payload: {
      "message": "She led teams for years, credits faith and family, wants to open a studio with her sister.",
      "relationship": "mentor",
      "mode": "positive",
      "style": "Gentle",
      "intensity": "feather",
      "length": "1-line",
      "include_followup": true,
      "followup_style": "reflection",
      "tags": ["discipline", "service"],
      "system_flavor": "validation",
      "version": "v1"
    }
  },
  {
    name: "C. Mixed • Partner • Firm • short-paragraph",
    payload: {
      "message": "She led teams for years, credits faith and family, wants to open a studio with her sister.",
      "relationship": "partner",
      "mode": "mixed",
      "style": "Direct",
      "intensity": "firm",
      "length": "short-paragraph",
      "include_followup": true,
      "followup_style": "prompt",
      "tags": ["accountability", "vision"],
      "system_flavor": "validation",
      "version": "v1"
    }
  }
];

async function testVector(vector) {
  console.log(`\n🧪 Testing: ${vector.name}`);
  console.log("Payload:", JSON.stringify(vector.payload, null, 2));
  
  try {
    const response = await fetch('http://localhost:3001/api/validation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vector.payload)
    });
    
    const data = await response.json();
    
    console.log(`Status: ${response.status}`);
    console.log(`Response Headers:`, Object.fromEntries(response.headers.entries()));
    console.log(`Response:`, JSON.stringify(data, null, 2));
    
    if (data.text) {
      const lines = data.text.split('\n').length;
      console.log(`Lines in response: ${lines}`);
    }
    
  } catch (error) {
    console.error(`Error testing ${vector.name}:`, error.message);
  }
}

async function runTests() {
  console.log("🚀 Starting validation API test vectors...");
  
  for (const vector of testVectors) {
    await testVector(vector);
    await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay between tests
  }
  
  console.log("\n✅ Test vectors completed!");
}

runTests().catch(console.error);
