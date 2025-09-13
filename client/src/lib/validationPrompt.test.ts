import { generateValidationResponse } from "./validationPrompt";

const cases = [
  "i wore mismatched shoes at the airport and i want to die",
  "i'm spiraling about tomorrow's meeting",
  "i messed up and i feel like a failure",
  "i'm pissed, they walked all over me",
];

describe("generateValidationResponse", () => {
  test("validation responses are 2–3 lines and do not mirror", () => {
    for (const c of cases) {
      const out = generateValidationResponse(c);
      const lines = out.split("\n");
      
      // Should be 2-3 lines max
      expect(lines.length).toBeLessThanOrEqual(3);
      expect(lines.length).toBeGreaterThanOrEqual(2);
      
      // Should not contain significant chunks of input text
      const inputLower = c.toLowerCase();
      const outputLower = out.toLowerCase();
      
      // Check for mirroring: no 10+ character sequences should be identical
      for (let i = 0; i <= inputLower.length - 10; i++) {
        const substring = inputLower.slice(i, i + 10);
        if (substring.match(/[a-z]/)) {
          expect(outputLower).not.toContain(substring);
        }
      }
    }
  });

  test("detects embarrassment correctly", () => {
    const input = "i wore mismatched shoes at the airport and i want to die";
    const output = generateValidationResponse(input);
    
    // Should contain acknowledgment phrases
    expect(output).toMatch(/that (stings|rough|lot|gut punch)/);
    // Should contain dignity phrases
    expect(output).toMatch(/you're (human|allowed to feel this|not broken)/);
  });

  test("detects anxiety correctly", () => {
    const input = "i'm spiraling about tomorrow's meeting";
    const output = generateValidationResponse(input);
    
    expect(output).toMatch(/that (stings|rough|lot|gut punch)/);
    expect(output).toMatch(/you're (human|allowed to feel this|not broken)/);
  });

  test("detects shame correctly", () => {
    const input = "i messed up and i feel like a failure";
    const output = generateValidationResponse(input);
    
    expect(output).toMatch(/that (stings|rough|lot|gut punch)/);
    expect(output).toMatch(/you're (human|allowed to feel this|not broken)/);
  });

  test("detects anger correctly", () => {
    const input = "i'm pissed, they walked all over me";
    const output = generateValidationResponse(input);
    
    expect(output).toMatch(/that (stings|rough|lot|gut punch)/);
    expect(output).toMatch(/you're (human|allowed to feel this|not broken)/);
  });

  test("handles unknown emotions with default responses", () => {
    const input = "i feel confused about everything";
    const output = generateValidationResponse(input);
    
    expect(output).toMatch(/that (stings|rough|lot|gut punch)/);
    expect(output).toMatch(/you're (human|allowed to feel this|not broken)/);
    expect(output).toMatch(/(one small move forward beats perfect plans|you can carry this and still walk)/);
  });

  test("produces consistent format", () => {
    for (const c of cases) {
      const out = generateValidationResponse(c);
      const lines = out.split("\n");
      
      // Each line should be trimmed and non-empty
      lines.forEach(line => {
        expect(line.trim()).toBe(line);
        expect(line.length).toBeGreaterThan(0);
      });
      
      // Should end without trailing newline
      expect(out).not.toMatch(/\n$/);
    }
  });

  test("anti-mirroring works for long inputs", () => {
    const longInput = "i accidentally left the house w/ mismatching shoes & now I'm at the airport publicly suffering the consequences of my own stupidity and everyone is staring at me";
    const output = generateValidationResponse(longInput);
    
    // Should not contain large chunks from the input
    const inputLower = longInput.toLowerCase();
    const outputLower = output.toLowerCase();
    
    // Check that no significant phrases are mirrored
    const problematicPhrases = [
      "mismatching shoes",
      "at the airport",
      "publicly suffering",
      "my own stupidity",
      "everyone is staring"
    ];
    
    problematicPhrases.forEach(phrase => {
      expect(outputLower).not.toContain(phrase);
    });
  });
});
