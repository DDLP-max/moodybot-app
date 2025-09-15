#!/usr/bin/env node

// Smoke test script for validation API
const testCases = [
  {
    name: "A — Positive • Friend • Casual • 2–3-lines",
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
    },
    expectations: {
      lines: "≤ 3",
      content: ["faith", "family", "sister"],
      banned: ["That wasn't luck", "most people drift", "that's why it hit"],
      followup: true
    }
  },
  {
    name: "B — Positive • Mentor • Feather • 1-line",
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
    },
    expectations: {
      lines: "= 1",
      content: ["gentle", "mentor"],
      banned: ["That wasn't luck", "most people drift", "that's why it hit"],
      followup: true
    }
  },
  {
    name: "C — Mixed • Partner • Firm • short-paragraph",
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
    },
    expectations: {
      lines: "= 1 paragraph, 3-5 sentences",
      content: ["supportive", "challenge"],
      banned: ["That wasn't luck", "most people drift", "that's why it hit"],
      followup: true
    }
  }
];

async function runSmokeTest() {
  console.log("🚀 Starting validation smoke tests...\n");
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    console.log(`🧪 Testing: ${testCase.name}`);
    
    try {
      const response = await fetch('http://localhost:3001/api/validation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testCase.payload)
      });
      
      const data = await response.json();
      
      // Check response headers
      const routeHeader = response.headers.get('x-mb-route');
      if (routeHeader !== 'validation') {
        console.log(`❌ Wrong route: ${routeHeader}`);
        failed++;
        continue;
      }
      
      // Check response structure
      if (!data.text) {
        console.log(`❌ No text in response`);
        failed++;
        continue;
      }
      
      // Check length
      const lines = data.text.trim().split(/\n+/).length;
      const sentences = data.text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
      
      let lengthPass = false;
      if (testCase.expectations.lines === "≤ 3") {
        lengthPass = lines <= 3;
      } else if (testCase.expectations.lines === "= 1") {
        lengthPass = lines === 1;
      } else if (testCase.expectations.lines === "= 1 paragraph, 3-5 sentences") {
        lengthPass = lines === 1 && sentences >= 3 && sentences <= 5;
      }
      
      if (!lengthPass) {
        console.log(`❌ Length fail: ${lines} lines, ${sentences} sentences`);
        failed++;
        continue;
      }
      
      // Check content
      const contentPass = testCase.expectations.content.some(word => 
        data.text.toLowerCase().includes(word.toLowerCase())
      );
      
      if (!contentPass) {
        console.log(`❌ Content fail: missing expected words`);
        failed++;
        continue;
      }
      
      // Check banned phrases
      const bannedPass = !testCase.expectations.banned.some(phrase => 
        data.text.toLowerCase().includes(phrase.toLowerCase())
      );
      
      if (!bannedPass) {
        console.log(`❌ Banned phrase detected`);
        failed++;
        continue;
      }
      
      // Check follow-up
      const followupPass = !testCase.expectations.followup || data.followup;
      
      if (!followupPass) {
        console.log(`❌ Missing follow-up`);
        failed++;
        continue;
      }
      
      console.log(`✅ PASS`);
      console.log(`   Response: "${data.text}"`);
      console.log(`   Lines: ${lines}, Sentences: ${sentences}`);
      console.log(`   Follow-up: ${data.followup || 'None'}`);
      console.log();
      
      passed++;
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
      failed++;
    }
  }
  
  console.log(`📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log("🎉 All smoke tests passed!");
  } else {
    console.log("💥 Some smoke tests failed!");
    process.exit(1);
  }
}

runSmokeTest().catch(console.error);
