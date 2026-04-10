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
      "You get an AI-generated Privacy Policy and Terms of Service tailored to how your SaaS collects data, uses vendors, and serves customers.",
  },
  {
    question: "How do automatic updates work?",
    answer:
      "PolicyPack monitors relevant privacy and disclosure changes, then prepares document refreshes so your legal pages do not drift out of date.",
  },
  {
    question: "Is this meant to replace a lawyer entirely?",
    answer:
      "It replaces a large amount of routine drafting and monitoring work. For specialized or high-risk legal questions, you can still escalate to counsel.",
  },
  {
    question: "Who is this best for?",
    answer:
      "It is designed for founders, indie hackers, and SaaS teams that need fast, trustworthy legal docs without enterprise process overhead.",
  },
];

export function FaqSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section id="faq" className="scroll-mt-24 bg-black py-24 sm:py-28 lg:py-32">
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
          className="soft-panel mx-auto mt-14 max-w-3xl rounded-[28px] p-3 sm:p-4"
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
