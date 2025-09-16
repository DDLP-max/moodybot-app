#!/usr/bin/env node

// Test the route structure without needing the server running
import { z } from 'zod';

// Test the exact schema from the route
const Schema = z.object({
  message: z.string().min(1),
  relationship: z.enum(["stranger","acquaintance","friend","partner","family","coworker","client","mentor","self"]),
  mode: z.enum(["positive","negative","mixed"]),
  style: z.enum(["MoodyBot","Gentle","Direct","Clinical","Playful","Poetic"]),
  intensity: z.enum(["feather","casual","firm","heavy"]),
  length: z.enum(["1-line","2-3-lines","short-paragraph"]),
  include_followup: z.boolean().default(false),
  followup_style: z.enum(["question","prompt","reflection"]).optional(),
  tags: z.array(z.string()).default([]),
  system_flavor: z.literal("validation").default("validation"),
  version: z.literal("v1").default("v1"),
}).strict();

// Test payloads
const testCases = [
  {
    name: "Known Good",
    payload: {
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
    }
  },
  {
    name: "Wrong Field Name",
    payload: {
      message: "Test message",
      relationship: "friend",
      mode: "positive",
      style: "MoodyBot",
      intensity: "casual",
      length: "2-3-lines",
      includeFollowUp: false, // Wrong field name
      tags: [],
      system_flavor: "validation",
      version: "v1"
    }
  },
  {
    name: "Wrong Enum Value",
    payload: {
      message: "Test message",
      relationship: "friend",
      mode: "positive",
      style: "MoodyBot",
      intensity: "Casual", // Wrong case
      length: "2-3-lines",
      include_followup: false,
      tags: [],
      system_flavor: "validation",
      version: "v1"
    }
  }
];

console.log("🧪 Testing schema validation...\n");

testCases.forEach(testCase => {
  console.log(`Testing: ${testCase.name}`);
  console.log("Payload:", JSON.stringify(testCase.payload, null, 2));
  
  const result = Schema.safeParse(testCase.payload);
  
  if (result.success) {
    console.log("✅ PASS - Schema validation successful");
  } else {
    console.log("❌ FAIL - Schema validation failed");
    console.log("Errors:", JSON.stringify(result.error.flatten(), null, 2));
  }
  
  console.log("---\n");
});
