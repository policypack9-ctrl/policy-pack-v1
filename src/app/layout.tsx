import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { AuthSessionProvider } from "@/components/providers/auth-session-provider";
import { getPublicAppUrl, PRODUCTION_APP_URL } from "@/lib/site-config";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const appUrl = getPublicAppUrl();

export const metadata: Metadata = {
  metadataBase: new URL(appUrl || PRODUCTION_APP_URL),
  title: {
    default: "PolicyPack | AI-Powered Legal Docs for SaaS",
    template: "%s | PolicyPack",
  },
  description: "Generate GDPR, CCPA, and Privacy Policies in minutes.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PolicyPack | AI-Powered Legal Docs for SaaS",
    description: "Generate GDPR, CCPA, and Privacy Policies in minutes.",
    url: PRODUCTION_APP_URL,
    siteName: "PolicyPack",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PolicyPack | AI-Powered Legal Docs for SaaS",
    description: "Generate GDPR, CCPA, and Privacy Policies in minutes.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetBrainsMono.variable} h-full scroll-smooth antialiased`}
    >
      <body className="flex min-h-full flex-col overflow-x-hidden bg-background text-foreground">
        <AuthSessionProvider>
          {children}
          <SiteFooter />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
