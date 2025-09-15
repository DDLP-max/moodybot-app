#!/usr/bin/env node

// Unit test for the scorer function to ensure it penalizes banned templates

function scoreCandidate(text, p) {
  const BAN = [
    /that wasn'?t luck/i,
    /you were swinging/i,
    /most people drift/i,
    /that'?s why it hit/i,
    /you didn'?t get lucky/i,
    /that wasn'?t noise/i,
    /repeatable, earned/i,
    /you got serious and it shows/i
  ];
  
  // Length compliance scoring
  const lines = text.trim().split(/\n+/).length;
  let lengthScore = 0;
  if (p.length === "1-line" && lines === 1) lengthScore = 2;
  else if (p.length === "2-3-lines" && lines <= 3) lengthScore = 2;
  else if (p.length === "short-paragraph" && lines <= 6) lengthScore = 2;
  
  // Mode-specific scoring
  let modeScore = 0;
  if (p.mode === "positive" && /proud|earned|faith|grace|family|sisterhood|leadership/i.test(text)) modeScore = 1.5;
  if (p.mode === "negative" && /proof|posture|ship|rep|confetti|cadence/i.test(text)) modeScore = 1.5;
  if (p.mode === "mixed" && /win|logged|make|repeatable|good move|tighten/i.test(text)) modeScore = 1.5;
  
  // Harshness penalty when it shouldn't be harsh
  let tonePenalty = 0;
  if (p.mode === "positive" && (p.intensity === "feather" || p.intensity === "casual")) {
    if (/(wasn'?t luck|swing|hit|drift|tough love)/i.test(text)) tonePenalty = -2;
  }
  
  // Ban list penalty
  let banPenalty = 0;
  BAN.forEach(rx => { if (rx.test(text)) banPenalty -= 3.5; });
  
  return lengthScore + modeScore + tonePenalty + banPenalty;
}

// Test cases
const tests = [
  {
    name: "penalizes banned templates",
    text: "That wasn't luck. You were swinging.",
    params: { length: "2-3-lines", mode: "positive", intensity: "casual" },
    expected: (score) => score < 0,
    description: "Should penalize banned template phrases"
  },
  {
    name: "rewards positive mode with appropriate language",
    text: "Your leadership and faith built this foundation.",
    params: { length: "2-3-lines", mode: "positive", intensity: "casual" },
    expected: (score) => score > 0,
    description: "Should reward positive language for positive mode"
  },
  {
    name: "penalizes harsh language in positive+feather mode",
    text: "That wasn't luck. You were swinging with intent.",
    params: { length: "2-3-lines", mode: "positive", intensity: "feather" },
    expected: (score) => score < -2,
    description: "Should heavily penalize harsh language in gentle mode"
  },
  {
    name: "rewards length compliance",
    text: "You built this with faith and family.",
    params: { length: "1-line", mode: "positive", intensity: "casual" },
    expected: (score) => score >= 2,
    description: "Should reward proper length compliance"
  }
];

function runTests() {
  console.log("🧪 Running scorer unit tests...\n");
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const score = scoreCandidate(test.text, test.params);
    const passed_test = test.expected(score);
    
    console.log(`${passed_test ? '✅' : '❌'} ${test.name}`);
    console.log(`   Text: "${test.text}"`);
    console.log(`   Params: ${JSON.stringify(test.params)}`);
    console.log(`   Score: ${score}`);
    console.log(`   Expected: ${test.description}`);
    console.log();
    
    if (passed_test) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log("🎉 All tests passed!");
  } else {
    console.log("💥 Some tests failed!");
    process.exit(1);
  }
}

runTests();
