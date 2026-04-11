import { describe, it, expect } from 'vitest';
import { normalizeAnswers, emptyOnboardingAnswers } from './policy-engine';

describe('policy-engine', () => {
  describe('normalizeAnswers', () => {
    it('should return empty answers when passed null or undefined', () => {
      const result1 = normalizeAnswers();
      const result2 = normalizeAnswers(null);

      expect(result1.businessName).toBe("");
      expect(result1.websiteUrl).toBe("");
      expect(result2.businessName).toBe("");
    });

    it('should preserve provided valid answers', () => {
      const input = {
        businessName: "TestCorp",
        websiteUrl: "https://testcorp.com",
        userAccounts: "Yes"
      };

      const result = normalizeAnswers(input);

      expect(result.businessName).toBe("TestCorp");
      expect(result.websiteUrl).toBe("https://testcorp.com");
      expect(result.userAccounts).toBe("Yes");
      expect(result.acceptsPayments).toBe(""); // default
    });
  });
});
