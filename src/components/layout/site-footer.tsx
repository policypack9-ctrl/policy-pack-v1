import Link from "next/link";
import { COMPANY_LEGAL_NAME, COMPANY_SUPPORT_EMAIL } from "@/lib/company";

const footerLinks = [
  { href: "/about-us", label: "About Us" },
  { href: "/contact-us", label: "Contact Us" },
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/cookie-policy", label: "Cookie Policy" },
  { href: "/terms-of-service", label: "Terms of Service" },
  { href: "/legal-disclaimer", label: "Legal Disclaimer" },
  { href: "/refund-policy", label: "Refund Policy" },
] as const;

export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#0A0A0A]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-6 sm:px-10 lg:flex-row lg:items-center lg:justify-between lg:px-12">
        <div>
          <p className="text-sm font-medium text-white/76">PolicyPack</p>
          <p className="mt-1 text-sm text-white/46">
            Expert-guided legal documents for growing SaaS teams.
          </p>
          <p className="mt-2 text-sm text-white/40">
            © 2026 {COMPANY_LEGAL_NAME}
          </p>
          <a
            href={`mailto:${COMPANY_SUPPORT_EMAIL}`}
            className="mt-1 inline-block text-sm text-white/52 transition-colors hover:text-white"
          >
            {COMPANY_SUPPORT_EMAIL}
          </a>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full border border-white/[0.08] bg-white/[0.02] px-3.5 py-2 text-sm text-white/62 transition-colors hover:bg-white/[0.05] hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
