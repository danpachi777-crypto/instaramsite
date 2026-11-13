import type { Metadata, Viewport } from "next";
import { Header, Footer, SetupNotice } from "@/components/site";
import { SiteTranslator } from "@/components/language";
import { configIssue, isDemo, siteUrl } from "@/lib/env";
import "./globals.css";
export const dynamic = "force-dynamic";
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#040506",
};
export async function generateMetadata(): Promise<Metadata> {
  let base: URL | undefined;
  try {
    base = new URL(siteUrl());
  } catch {
    /* Explicit setup notice in layout. */
  }
  return {
    metadataBase: base,
    title: {
      default: "MOTION — 次のリールに使いたいAI動画スタイル",
      template: "%s | MOTION",
    },
    description:
      "お気に入りのAI動画テンプレートを見つけて、作りたい動画のスタイルを探そう。",
    openGraph: {
      title: "MOTION — 次に話題になる動画は、ここから。",
      description: "好みのAI動画スタイルを見つけよう。",
      locale: "ja_JP",
      type: "website",
      images: [{ url: "/og.png", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
    robots: isDemo() ? { index: false, follow: false } : undefined,
  };
}
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const issue = configIssue();
  return (
    <html lang="ja" data-scroll-behavior="smooth">
      <body>
        <a href="#main" className="skip-link">
          本文へ移動
        </a>
        <Header />
        <SiteTranslator />
        <div id="main" tabIndex={-1}>
          {issue ? <SetupNotice message={issue} /> : children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
