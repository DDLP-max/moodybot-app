import { test, expect } from "@playwright/test";

test("Validation respects controls", async ({ page }) => {
  await page.goto("http://localhost:3000/validation");

  // Fill controls
  await page.getByLabel("Relationship").selectOption("friend");
  await page.getByLabel("Mode").selectOption("positive");
  await page.getByLabel("Style").selectOption("MoodyBot");
  await page.getByLabel("Intensity").selectOption("casual");
  await page.getByLabel("Length").selectOption("2-3-lines");
  await page.getByLabel("Include follow-up").check();
  await page.getByRole("textbox").fill("She led teams for years... studio with her sister.");

  await page.getByRole("button", { name: /Generate Validation/i }).click();

  // Wait for response
  await page.waitForSelector('[data-testid="validation-output"]', { timeout: 10000 });

  const out = await page.getByTestId("validation-output").innerText();
  const lines = out.trim().split(/\n+/);
  
  // Length assertion
  expect(lines.length).toBeLessThanOrEqual(3);
  
  // Content assertions
  expect(out).toMatch(/faith|family|sister/i);
  expect(out).not.toMatch(/That wasn'?t luck|most people drift|that'?s why it hit/i);
  
  // Should include follow-up
  expect(out).toMatch(/\?/); // Should have a question mark for follow-up
});

test("Validation length controls work", async ({ page }) => {
  await page.goto("http://localhost:3000/validation");

  // Test 1-line
  await page.getByLabel("Length").selectOption("1-line");
  await page.getByRole("textbox").fill("Test message for 1-line validation.");
  await page.getByRole("button", { name: /Generate Validation/i }).click();
  
  await page.waitForSelector('[data-testid="validation-output"]', { timeout: 10000 });
  const oneLineOut = await page.getByTestId("validation-output").innerText();
  const oneLineCount = oneLineOut.trim().split(/\n+/).length;
  expect(oneLineCount).toBe(1);

  // Test short-paragraph
  await page.getByLabel("Length").selectOption("short-paragraph");
  await page.getByRole("button", { name: /Generate Validation/i }).click();
  
  await page.waitForSelector('[data-testid="validation-output"]', { timeout: 10000 });
  const paraOut = await page.getByTestId("validation-output").innerText();
  const paraCount = paraOut.trim().split(/\n+/).length;
  expect(paraCount).toBe(1); // Should be one paragraph (no line breaks)
  expect(paraOut.split(/[.!?]+/).filter(s => s.trim().length > 0).length).toBeGreaterThanOrEqual(3); // 3+ sentences
});

test("Validation relationship changes tone", async ({ page }) => {
  await page.goto("http://localhost:3000/validation");
  await page.getByRole("textbox").fill("I achieved something meaningful.");

  // Test as friend
  await page.getByLabel("Relationship").selectOption("friend");
  await page.getByRole("button", { name: /Generate Validation/i }).click();
  await page.waitForSelector('[data-testid="validation-output"]', { timeout: 10000 });
  const friendOut = await page.getByTestId("validation-output").innerText();

  // Test as mentor
  await page.getByLabel("Relationship").selectOption("mentor");
  await page.getByRole("button", { name: /Generate Validation/i }).click();
  await page.waitForSelector('[data-testid="validation-output"]', { timeout: 10000 });
  const mentorOut = await page.getByTestId("validation-output").innerText();

  // Should be different responses
  expect(friendOut).not.toBe(mentorOut);
  
  // Mentor should be more formal/guidance-oriented
  expect(mentorOut).toMatch(/guidance|wisdom|experience|teach/i);
});
