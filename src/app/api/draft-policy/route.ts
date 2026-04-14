import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getAppUserProfileById,
  getLaunchCampaignSnapshot,
  saveGeneratedDocumentForUser,
  listGeneratedDocumentsForUser,
} from "@/lib/auth-data";
import { normalizeAnswers } from "@/lib/policy-engine";
import { getOpenRouterConfig, type OpenRouterGenerationTier } from "@/lib/ai-config";
import {
  runDraftingStagePublic,
  getDocumentTitle,
  normalizeMarkdown,
  buildEnrichedResearchContextPublic,
  buildFallbackPolicyMarkdownPublic,
  type PolicyDocumentType,
} from "@/lib/policy-generator";
import { getUserTier, isPageAvailableForTier } from "@/lib/tier-pages";

export const maxDuration = 55;

const TIER_MAX: Record<string, number> = { promo: 4, free: 2, starter: 3, premium: 7 };
const VALID_TYPES: PolicyDocumentType[] = [
  "about-us", "contact-us", "privacy-policy", "cookie-policy",
  "terms-of-service", "legal-disclaimer", "refund-policy",
];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  const body = (await request.json()) as {
    documentType?: PolicyDocumentType;
    answers?: unknown;
    researchSummary?: string;
    researchModel?: string;
  };

  if (!body.documentType || !VALID_TYPES.includes(body.documentType)) {
    return NextResponse.json({ error: "Invalid documentType." }, { status: 400 });
  }

  const [profile, launchSnapshot, generatedDocs] = await Promise.all([
    getAppUserProfileById(session.user.id),
    getLaunchCampaignSnapshot(session.user.id),
    listGeneratedDocumentsForUser(session.user.id),
  ]);

  const isPremium = profile?.isPremium ?? false;
  const planId = profile?.planId ?? "free";

  const userTier = getUserTier({
    isPremium,
    planId,
    isEligibleLaunchUser: launchSnapshot?.isEligibleLaunchUser ?? false,
  });

  if (!isPageAvailableForTier(body.documentType, userTier)) {
    return NextResponse.json(
      { error: "Page not available on your plan.", requiresCheckout: true },
      { status: 403 },
    );
  }

  const existingOtherDocs = generatedDocs.filter((d) => d.id !== body.documentType);
  const maxAllowed = TIER_MAX[userTier] ?? 2;
  if (existingOtherDocs.length >= maxAllowed) {
    return NextResponse.json(
      { error: "Document limit reached for your plan.", requiresCheckout: userTier !== "premium" },
      { status: 402 },
    );
  }

  const generationTier: OpenRouterGenerationTier = isPremium ? "premium" : "free";
  const config = getOpenRouterConfig(generationTier);
  const answers = normalizeAnswers(body.answers as object | undefined);
  const title = getDocumentTitle(body.documentType, answers);
  const generatedAt = new Date().toISOString();
  const researchSummary = body.researchSummary
    ?? buildEnrichedResearchContextPublic(body.documentType, answers, generationTier);
  const researchModel = body.researchModel ?? "built-in-regulations";

  if (!config.apiKey) {
    const markdown = buildFallbackPolicyMarkdownPublic(body.documentType, answers);
    const doc = { markdown, provider: "mock" as const, model: "template-fallback", generationTier, usedFallback: true, title, generatedAt, research: { model: researchModel, summary: researchSummary } };
    await saveGeneratedDocumentForUser(session.user.id, body.documentType, doc);
    return NextResponse.json(doc);
  }

  try {
    const draftResponse = await runDraftingStagePublic({
      answers,
      documentType: body.documentType,
      researchSummary,
      apiKey: config.apiKey,
      baseUrl: config.baseUrl,
      siteName: config.siteName,
      siteUrl: config.siteUrl,
      model: config.draftingModel,
      stream: true,
    });

    // If it's not a standard Response object, handle as error
    if (!(draftResponse instanceof Response) || !draftResponse.body) {
      throw new Error("Drafting stage did not return a streamable response.");
    }

    // Pass through the stream and capture chunks to save the document when finished
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    let accumulatedContent = "";

    const transformStream = new TransformStream({
      transform(chunk, controller) {
        // chunk is a Uint8Array
        const text = decoder.decode(chunk, { stream: true });
        
        // OpenRouter SSE format parsing
        const lines = text.split("\n");
        for (const line of lines) {
          if (line.startsWith("data: ") && line !== "data: [DONE]") {
            try {
              const data = JSON.parse(line.slice(6));
              const content = data.choices?.[0]?.delta?.content;
              if (content) {
                accumulatedContent += content;
                controller.enqueue(encoder.encode(content));
              }
            } catch {
              // Ignore parse errors on partial chunks
            }
          }
        }
      },
      async flush() {
        // Save the document once streaming is complete
        const markdown = normalizeMarkdown(accumulatedContent, title);
        const generated = {
          markdown,
          provider: "openrouter" as const,
          model: config.draftingModel,
          generationTier,
          usedFallback: false,
          title,
          generatedAt,
          research: { model: researchModel, summary: researchSummary },
        };
        await saveGeneratedDocumentForUser(session.user.id, body.documentType as PolicyDocumentType, generated);
      }
    });

    return new Response(draftResponse.body.pipeThrough(transformStream), {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      }
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Drafting failed.", details: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
