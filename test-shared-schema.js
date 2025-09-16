#!/usr/bin/env node

// Test the shared schema validation
import { uiToApi, ValidationSchema } from './lib/validationSchema.js';

console.log("🧪 Testing shared schema validation...\n");

// Test cases
const testCases = [
  {
    name: "Valid UI State",
    uiState: {
      context: "She led teams for years, credits faith and family, wants to open a studio with her sister.",
      relationship: "friend",
      mode: "positive",
      style: "moodybot",
      intensity: [1], // casual
      length: "short", // 2-3-lines
      includeFollowup: true,
      reasonTags: ["faith", "family", "leadership"]
    }
  },
  {
    name: "Invalid Intensity Index",
    uiState: {
      context: "Test message",
      relationship: "friend",
      mode: "positive",
      style: "moodybot",
      intensity: [5], // Invalid index
      length: "short",
      includeFollowup: false,
      reasonTags: []
    }
  },
  {
    name: "Invalid Style",
    uiState: {
      context: "Test message",
      relationship: "friend",
      mode: "positive",
      style: "invalid_style",
      intensity: [1],
      length: "short",
      includeFollowup: false,
      reasonTags: []
    }
  }
];

testCases.forEach(testCase => {
  console.log(`Testing: ${testCase.name}`);
  console.log("UI State:", JSON.stringify(testCase.uiState, null, 2));
  
  try {
    const payload = uiToApi(testCase.uiState);
    console.log("✅ PASS - Generated valid payload");
    console.log("Payload:", JSON.stringify(payload, null, 2));
    
    // Double-check with schema
    const validation = ValidationSchema.safeParse(payload);
    if (validation.success) {
      console.log("✅ PASS - Schema validation successful");
    } else {
      console.log("❌ FAIL - Schema validation failed");
      console.log("Errors:", JSON.stringify(validation.error.flatten(), null, 2));
    }
  } catch (e) {
    console.log("❌ FAIL - Client-side validation failed");
    console.log("Error:", e.message);
  }
  
  console.log("---\n");
});
