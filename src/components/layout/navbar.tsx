"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Scale } from "lucide-react";

import { NavbarAuthControls } from "@/components/layout/navbar-auth-controls";
import { PremiumButton } from "@/components/ui/premium-button";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export function Navbar() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.header
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 border-b border-white/10 bg-[#0A0A0A]/72 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 sm:px-10 lg:px-12">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-teal-200 shadow-[0_18px_40px_-24px_rgba(45,212,191,0.65)]">
            <Scale className="size-5" />
          </span>
          <span>
            <span className="block text-sm font-semibold tracking-[-0.03em] text-white">
              PolicyPack
            </span>
            <span className="block text-[11px] uppercase tracking-[0.28em] text-white/40">
              Legal In Minutes
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm font-medium text-white/60 transition-colors duration-300 hover:text-teal-200"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <NavbarAuthControls />
          <PremiumButton
            render={<Link href="/onboarding" />}
            nativeButton={false}
            className="h-11 px-4 text-sm sm:px-5"
          >
            Get Started
          </PremiumButton>
        </div>
      </div>
    </motion.header>
  );
}
