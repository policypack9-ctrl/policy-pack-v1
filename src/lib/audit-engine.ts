
import type { StoredPolicySession } from "@/lib/policy-engine";

export type DocumentUpdate = {
  documentId: string;
  documentTitle: string;
  reason: string;
  priority: "high" | "medium" | "low";
  regulation: string;
};

export type AuditReport = {
  updates: DocumentUpdate[];
  checkedRegulations: number;
  triggeredRegulations: number;
};

type RegulationCheck = {
  id: string;
  name: string;
  region: string[];
  appliesWhen: (session: StoredPolicySession) => boolean;
  affectedDocuments: { id: string; title: string; reason: string; priority: "high" | "medium" | "low" }[];
};

const REGULATION_CHECKS: RegulationCheck[] = [
  {
    id: "gdpr-art13",
    name: "GDPR Article 13/14 Disclosure",
    region: ["European Union", "Global"],
    appliesWhen: () => true,
    affectedDocuments: [
      { id: "privacy-policy", title: "Privacy Policy", reason: "Updated data subject rights wording required under GDPR Art. 13/14", priority: "high" },
      { id: "cookie-policy", title: "Cookie Policy", reason: "Third-party cookie consent needs alignment with ePrivacy updates", priority: "medium" },
    ],
  },
  {
    id: "ccpa-cpra",
    name: "CCPA / CPRA Opt-Out",
    region: ["United States", "Global"],
    appliesWhen: (s) => s.answers.acceptsPayments === "Yes" || s.answers.userAccounts === "Yes",
    affectedDocuments: [
      { id: "privacy-policy", title: "Privacy Policy", reason: "CPRA requires updated Do Not Sell or Share language", priority: "high" },
      { id: "terms-of-service", title: "Terms of Service", reason: "California consumer rights section needs CPRA review", priority: "medium" },
    ],
  },
  {
    id: "payment-tos-2024",
    name: "Payment Processor TOS Update",
    region: ["All"],
    appliesWhen: (s) => s.answers.acceptsPayments === "Yes",
    affectedDocuments: [
      { id: "refund-policy", title: "Refund Policy", reason: "Updated dispute timelines require a 7-day refund window reference", priority: "high" },
      { id: "terms-of-service", title: "Terms of Service", reason: "Chargeback liability clause needs update for new processor rules", priority: "medium" },
    ],
  },
  {
    id: "ai-transparency",
    name: "AI Transparency Act",
    region: ["European Union", "Global", "United States"],
    appliesWhen: (s) => ["Heavy", "Light"].includes(s.answers.aiTransparencyLevel ?? ""),
    affectedDocuments: [
      { id: "about-us", title: "About Us", reason: "EU AI Act requires disclosure of AI use in your service", priority: "medium" },
      { id: "privacy-policy", title: "Privacy Policy", reason: "Automated decision-making disclosure required", priority: "high" },
      { id: "legal-disclaimer", title: "Legal Disclaimer", reason: "AI-generated content liability clause recommended", priority: "low" },
    ],
  },
  {
    id: "cookie-consent-tcf2",
    name: "IAB TCF 2.2 Cookie Consent",
    region: ["European Union", "Global"],
    appliesWhen: (s) => s.answers.outreachChannels.some((c) => /cookie/i.test(c)),
    affectedDocuments: [
      { id: "cookie-policy", title: "Cookie Policy", reason: "IAB TCF 2.2 requires updated vendor list and consent string", priority: "high" },
    ],
  },
  {
    id: "ftc-subscription",
    name: "FTC Subscription Cancellation Rules",
    region: ["United States", "Global"],
    appliesWhen: (s) => s.answers.acceptsPayments === "Yes",
    affectedDocuments: [
      { id: "refund-policy", title: "Refund Policy", reason: "New FTC rules require clear cancellation and refund terms", priority: "high" },
      { id: "terms-of-service", title: "Terms of Service", reason: "Auto-renewal disclosure must be prominent per FTC guidelines", priority: "medium" },
    ],
  },
];

/**
 * Run audit: checks applicable regulations against the user's session
 * and returns a deduplicated list of document updates needed.
 */
export function runAuditEngine(
  session: StoredPolicySession,
  primaryRegion: string,
  generatedDocumentIds: string[],
): AuditReport {
  const updates: DocumentUpdate[] = [];
  let triggered = 0;

  for (const check of REGULATION_CHECKS) {
    const regionMatch =
      check.region.includes("All") ||
      check.region.includes(primaryRegion) ||
      check.region.includes("Global");
    if (!regionMatch) continue;
    if (!check.appliesWhen(session)) continue;

    triggered++;

    for (const doc of check.affectedDocuments) {
      // Only flag documents that the user has already generated
      if (!generatedDocumentIds.includes(doc.id)) continue;

      // Deduplicate — same doc can appear once per priority level
      const existing = updates.find(
        (u) => u.documentId === doc.id && u.priority === doc.priority,
      );
      if (!existing) {
        updates.push({
          documentId: doc.id,
          documentTitle: doc.title,
          reason: doc.reason,
          priority: doc.priority,
          regulation: check.name,
        });
      }
    }
  }

  // Sort by priority: high → medium → low
  const ORDER = { high: 0, medium: 1, low: 2 };
  updates.sort((a, b) => ORDER[a.priority] - ORDER[b.priority]);

  return {
    updates,
    checkedRegulations: REGULATION_CHECKS.length,
    triggeredRegulations: triggered,
  };
}
