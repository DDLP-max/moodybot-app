#!/usr/bin/env node

// Mock validation response for testing without API key
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/validation', (req, res) => {
  console.log('Mock validation request received:', req.body);
  
  // Mock response that matches the expected format
  res.json({
    text: "You carved something steady out of the chaos. Faith and family keep you grounded while you aim higher. 🥃",
    because: "Your leadership and consistency show through years of team building.",
    followup: "What's the first class you'll put on the studio schedule?",
    meta: {
      relationship: req.body.relationship,
      mode: req.body.mode,
      style: req.body.style,
      intensity: req.body.intensity,
      length: req.body.length,
      tags: req.body.tags,
      finish_reason: "complete",
      candidate_count: 1,
      was_repaired: false
    }
  });
});

app.listen(10001, () => {
  console.log('Mock validation server running on http://localhost:10001');
  console.log('Test with: curl -X POST http://localhost:10001/api/validation -H "Content-Type: application/json" -d \'{"message":"test"}\'');
});
