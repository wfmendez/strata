import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { RightPanel } from "@/components/RightPanel";
import { Composer } from "@/components/Composer";
import { WalletPanel } from "@/components/WalletPanel";
import { LogoMark } from "@/components/Logo";
import { SignIn } from "@/components/SignIn";
import { MobileNav } from "@/components/MobileNav";
import { PriceProvider } from "@/components/PriceProvider";
import { getEthUsd } from "@/lib/eth-price";
import { getCurrentUser } from "@/lib/session";

const SITE_URL = "https://strata.local";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "STRATA — Own the Layer Beneath | SocialFi Real Estate",
  description:
    "Discover tokenized real estate deals, follow top property investors, and earn DeFi yield on STRATA — the social platform where every post is an opportunity.",
  applicationName: "STRATA",
  openGraph: {
    title: "STRATA — Own the Layer Beneath",
    description:
      "SocialFi for tokenized real estate. Post deals, follow investors, earn yield.",
    url: SITE_URL,
    siteName: "STRATA",
    images: [{ url: "/og.svg", width: 1200, height: 630 }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "STRATA — Own the Layer Beneath",
    description: "SocialFi for tokenized real estate. Built on-chain.",
    images: ["/og.svg"],
  },
  alternates: { canonical: SITE_URL },
  icons: { icon: "/logo.svg" },
};

export const viewport: Viewport = { themeColor: "#070B14" };

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "STRATA",
  applicationCategory: "FinanceApplication",
  operatingSystem: "Web",
  description:
    "SocialFi platform for tokenized real estate investing and DeFi yield.",
  url: SITE_URL,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [me, ethUsd] = await Promise.all([getCurrentUser(), getEthUsd()]);

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bg pb-20 text-text-primary lg:pb-0">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <PriceProvider price={ethUsd}>
          <Header />
          <div className="relative-content mx-auto flex w-full max-w-[1440px] gap-6 px-4 pt-6 sm:px-6 lg:gap-8">
            <Sidebar username={me.username} />
            <main className="min-w-0 flex-1">{children}</main>
            <RightPanel />
          </div>
          <Composer />
          <WalletPanel />
          <MobileNav username={me.username} />
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#0E1422",
                border: "1px solid #1E2A42",
                color: "#F0F4FF",
              },
            }}
          />
        </PriceProvider>
      </body>
    </html>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-bg/70 backdrop-blur-md">
      <div className="relative-content mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <LogoMark size={24} />
          <span className="text-[15px] font-semibold tracking-[0.18em]">STRATA</span>
        </Link>
        <div className="flex items-center gap-3">
          <span className="hidden text-[11px] uppercase tracking-[0.18em] text-text-secondary md:inline">
            Own the layer beneath
          </span>
          <span className="rounded-full border border-brand-violet/40 bg-brand-violet/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-violet">
            Beta
          </span>
          <SignIn />
        </div>
      </div>
    </header>
  );
}
