#!/usr/bin/env node

// Test script to verify payload structure matches API contract
const { ValidationReq } = require('./shared/validationContracts.ts');

// Simulate what the client should send
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

console.log("Testing payload structure...");
console.log("Payload:", JSON.stringify(testPayload, null, 2));

try {
  const result = ValidationReq.safeParse(testPayload);
  if (result.success) {
    console.log("✅ Payload validation PASSED");
    console.log("Parsed data:", result.data);
  } else {
    console.log("❌ Payload validation FAILED");
    console.log("Errors:", result.error.flatten());
  }
} catch (error) {
  console.log("❌ Error during validation:", error.message);
}
