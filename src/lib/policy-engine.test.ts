import { describe, it, expect } from 'vitest';
import { 
  normalizeAnswers, 
  getProductName,
  formatAnswerList,
  resolvePrimaryRegion,
  getGenerationMessages,
  buildComplianceSnapshot,
  demoOnboardingAnswers,
  type OnboardingAnswers
} from './policy-engine';

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

  describe('getProductName', () => {
    it('should return "The Service" if businessName is empty', () => {
      expect(getProductName(normalizeAnswers({ businessName: "" }))).toBe("The Service");
      expect(getProductName(normalizeAnswers({ businessName: "   " }))).toBe("The Service");
    });

    it('should return trimmed businessName if provided', () => {
      expect(
        getProductName(normalizeAnswers({ businessName: "  Acme Corp  " })),
      ).toBe("Acme Corp");
    });
  });

  describe('formatAnswerList', () => {
    it('should return fallback if empty', () => {
      expect(formatAnswerList([], 'fallback')).toBe('fallback');
    });

    it('should return single item if array length is 1', () => {
      expect(formatAnswerList(['apple'], 'fallback')).toBe('apple');
    });

    it('should join with "and" if array length is 2', () => {
      expect(formatAnswerList(['apple', 'banana'], 'fallback')).toBe('apple and banana');
    });

    it('should use comma and "and" for multiple items', () => {
      expect(formatAnswerList(['apple', 'banana', 'orange'], 'fallback')).toBe('apple, banana, and orange');
    });
  });

  describe('resolvePrimaryRegion', () => {
    it('should return "your market" if no regions exist', () => {
      expect(resolvePrimaryRegion({ customerRegions: [], companyLocation: "" } as unknown as OnboardingAnswers)).toBe("your market");
    });

    it('should return "global audiences" if candidate is Global', () => {
      expect(resolvePrimaryRegion({ customerRegions: ["Global"], companyLocation: "" } as unknown as OnboardingAnswers)).toBe("global audiences");
    });

    it('should prioritize customerRegion over companyLocation', () => {
      expect(resolvePrimaryRegion({ customerRegions: ["Egypt"], companyLocation: "US" } as unknown as OnboardingAnswers)).toBe("Egypt");
    });

    it('should fallback to companyLocation if no customerRegion', () => {
      expect(resolvePrimaryRegion({ customerRegions: [], companyLocation: "US" } as unknown as OnboardingAnswers)).toBe("US");
    });
  });

  describe('getGenerationMessages', () => {
    it('should return core messages', () => {
      const messages = getGenerationMessages({ ...demoOnboardingAnswers, customerRegions: [], companyLocation: "", acceptsPayments: "No", vendors: [] });
      expect(messages).toContain('Analyzing Example SaaS data structures...');
      expect(messages).toContain('Mapping regulatory updates...');
      expect(messages).toContain('Generating final PolicyPack for Example SaaS...');
    });

    it('should include GDPR message if EU coverage', () => {
      const messages = getGenerationMessages({ ...demoOnboardingAnswers, customerRegions: ["European Union"] });
      expect(messages).toContain('Matching GDPR Article 13 compliance protocols...');
    });

    it('should include CCPA message if US coverage', () => {
      const messages = getGenerationMessages({ ...demoOnboardingAnswers, customerRegions: ["United States"] });
      expect(messages).toContain('Syncing CCPA & California Privacy requirements...');
    });

    it('should include payment message if Stripe is a vendor', () => {
      const messages = getGenerationMessages({ ...demoOnboardingAnswers, vendors: ["Stripe"] });
      expect(messages).toContain('Verifying PCI-DSS data handling clauses...');
    });

    it('should include AI message if OpenAI is a vendor', () => {
      const messages = getGenerationMessages({ ...demoOnboardingAnswers, vendors: ["OpenAI"] });
      expect(messages).toContain('Reviewing AI processor and model disclosure layers...');
    });
  });

  describe('buildComplianceSnapshot', () => {
    it('should generate a snapshot successfully', () => {
      const snapshot = buildComplianceSnapshot(demoOnboardingAnswers);
      expect(snapshot.healthScore).toBe(100);
      expect(snapshot.documents.length).toBeGreaterThan(0);
      expect(snapshot.businessName).toBe("Example SaaS");
    });
  });
});
