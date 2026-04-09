import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
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
    default: "PolicyPack",
    template: "%s | PolicyPack",
  },
  description:
    "PolicyPack helps SaaS teams generate and maintain Privacy Policies, Terms of Service, and compliance documents that stay current.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PolicyPack",
    description:
      "Generate and maintain Privacy Policies, Terms of Service, and compliance documents for your SaaS product.",
    url: PRODUCTION_APP_URL,
    siteName: "PolicyPack",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PolicyPack",
    description:
      "Generate and maintain Privacy Policies, Terms of Service, and compliance documents for your SaaS product.",
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
        {children}
      </body>
    </html>
  );
}
