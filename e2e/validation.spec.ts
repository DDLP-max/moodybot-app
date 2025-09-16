import { test, expect } from '@playwright/test';

test('validation route accepts known-good payload', async ({ request }) => {
  const res = await request.post('/api/validation', {
    data: {
      message: "She led teams for years, credits faith and family, wants to open a studio with her sister.",
      relationship: 'friend',
      mode: 'positive',
      style: 'MoodyBot',
      intensity: 'casual',
      length: '2-3-lines',
      include_followup: false,
      followup_style: 'question',
      tags: ['competence', 'taste'],
      system_flavor: 'validation',
      version: 'v1'
    }
  });
  
  expect(res.status()).toBe(200);
  
  const data = await res.json();
  expect(data).toHaveProperty('ok', true);
  expect(data).toHaveProperty('data');
  expect(data.data).toHaveProperty('message');
  expect(data.data).toHaveProperty('relationship', 'friend');
  expect(data.data).toHaveProperty('style', 'MoodyBot');
});

test('validation route rejects invalid payload', async ({ request }) => {
  const res = await request.post('/api/validation', {
    data: {
      message: "Test message",
      relationship: 'friend',
      mode: 'positive',
      style: 'MoodyBot',
      intensity: 'Casual', // Wrong case - should be 'casual'
      length: '2-3-lines',
      include_followup: false,
      tags: [],
      system_flavor: 'validation',
      version: 'v1'
    }
  });
  
  expect(res.status()).toBe(422);
  
  const data = await res.json();
  expect(data).toHaveProperty('error', 'Validation failed');
  expect(data).toHaveProperty('zod_errors');
  expect(data.zod_errors).toHaveProperty('intensity');
});

test('validation route rejects unknown fields', async ({ request }) => {
  const res = await request.post('/api/validation', {
    data: {
      message: "Test message",
      relationship: 'friend',
      mode: 'positive',
      style: 'MoodyBot',
      intensity: 'casual',
      length: '2-3-lines',
      includeFollowUp: false, // Wrong field name - should be 'include_followup'
      tags: [],
      system_flavor: 'validation',
      version: 'v1'
    }
  });
  
  expect(res.status()).toBe(422);
  
  const data = await res.json();
  expect(data).toHaveProperty('error', 'Validation failed');
  expect(data).toHaveProperty('zod_errors');
});
