#!/usr/bin/env node

// Test server health
async function testHealth() {
  console.log("🏥 Testing server health...");
  
  try {
    const response = await fetch('http://localhost:10000/api/validation', {
      method: 'GET',
    });
    
    console.log(`Status: ${response.status}`);
    const text = await response.text();
    console.log("Response:", text);
    
    if (response.status === 200) {
      console.log("✅ Server is healthy and responding!");
    } else {
      console.log("❌ Server responded with error status");
    }
    
  } catch (error) {
    console.error("❌ Server not responding:", error.message);
  }
}

testHealth();
