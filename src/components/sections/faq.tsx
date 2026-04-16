"use client";

import { motion, useReducedMotion } from "framer-motion";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqItems = [
  {
    question: "What documents do I get with PolicyPack?",
    answer:
      "You get expert-guided legal pages tailored to how your SaaS collects data, uses vendors, and serves customers, starting with the pages most likely to matter first.",
  },
  {
    question: "How do refreshes work?",
    answer:
      "PolicyPack saves your setup so you can regenerate drafts quickly when your product, billing flow, or target markets change.",
  },
  {
    question: "Do I still need a lawyer review?",
    answer:
      "Yes, the pages are generated using the recommendations of leading legal experts and current compliance patterns. If you want extra reassurance, you can still ask a lawyer to review the final text before publishing.",
  },
  {
    question: "Who is this best for?",
    answer:
      "It is designed for founders, indie hackers, and SaaS teams that need fast, trustworthy legal docs without enterprise process overhead.",
  },
  {
    question: "Can I start with a one-time pack and upgrade later?",
    answer:
      "Yes. You can begin with the smaller three-page pack, then move to the full workspace later if you need more pages, exports, or broader document coverage.",
  },
  {
    question: "Which three pages matter most for an early launch?",
    answer:
      "For most SaaS launches, the highest-priority set is Privacy Policy, Terms of Service, and Refund Policy or Cookie Policy depending on your billing flow and target market.",
  },
  {
    question: "Does PolicyPack support app launches as well as websites?",
    answer:
      "Yes. The drafting logic is built for websites, SaaS products, and app launches where privacy disclosures, payment readiness, and platform review all matter.",
  },
  {
    question: "Are the pages written in hard legal jargon?",
    answer:
      "No. PolicyPack aims for clear, founder-friendly language first, while still keeping the structure and disclosures strong enough for launch reviews and customer trust.",
  },
  {
    question: "Can I ask for a fresh set later without redoing everything?",
    answer:
      "Yes. Your last setup stays saved to your workspace, so you can generate again from the same answers or start a brand-new setup whenever you want.",
  },
  {
    question: "Can I start simple and upgrade later?",
    answer:
      "Yes. You can begin with a smaller one-time pack, then move to the full workspace whenever you need more pages, exports, or broader compliance coverage.",
  },
];

export function FaqSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="faq" className="scroll-mt-24 bg-black py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6 sm:px-10 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-[11px] font-medium uppercase tracking-[0.32em] text-teal-200/70">
            FAQ
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white sm:text-4xl">
            Common questions, answered clearly.
          </h2>
          <p className="mt-4 text-base leading-7 text-white/62">
            The essentials you need before adding PolicyPack to your SaaS
            workflow.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="soft-panel mt-10 w-full rounded-[28px] p-3 sm:p-4"
        >
          <Accordion defaultValue={["item-0"]} multiple>
            {faqItems.map((item, index) => (
              <AccordionItem
                key={item.question}
                value={`item-${index}`}
                className="rounded-[20px] border-b-0 border border-transparent px-3 py-1 data-[open]:border-white/[0.08] data-[open]:bg-white/[0.02]"
              >
                <AccordionTrigger className="py-4 text-base font-medium text-white hover:no-underline">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="pb-4 text-sm leading-7 text-white/60">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
