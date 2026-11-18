import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { LanguageProvider, T } from "@/components/i18n";
import { ResponsiveView } from "@/components/responsive-view";
import { normalizeLocale, isRtl } from "@/lib/i18n";
import { Header, Footer, SetupNotice } from "@/components/site";
import { AttributionCapture } from "@/components/attribution";
import { configIssue, isDemo, siteUrl } from "@/lib/env";
import "./globals.css";
import "@fontsource-variable/noto-sans-jp";
import "./fonts.css";
import "./desktop-motion.css";
import "./world-screening.css";
import "./phone-loading.css";
import "./ui-improvements.css";
import "./discovery.css";
import "./brand-typography.css";
import "./coral-discovery.css";
export const dynamic = "force-dynamic";
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0D100C",
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
      "お気に入りのAI動画テンプレートを見つけて、先行案内に登録。MOTIONは動画生成サービスの先行案内を受付中です。",
    openGraph: {
      title: "MOTION — 次に話題になる動画は、ここから。",
      description: "好みのAI動画スタイルを見つけよう。先行案内を受付中。",
      locale: "ja_JP",
      type: "website",
      images: [{ url: "/og.png", width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image" },
    robots: isDemo() ? { index: false, follow: false } : undefined,
  };
}
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const issue = configIssue();
  const locale = normalizeLocale((await cookies()).get("motion-language")?.value);
  return (
    <html lang={locale} dir={isRtl(locale) ? "rtl" : "ltr"} data-scroll-behavior="smooth">
      <head>
        <link rel="preload" href="/motion/fonts/Arimo-Variable.ttf" as="font" type="font/ttf" crossOrigin="anonymous" />
      </head>
      <body>
        <LanguageProvider initialLocale={locale}>
        <a href="#main" className="skip-link">
          本文へ移動
        </a>
        <Header />
        {isDemo() && (
          <div className="demo-banner">
            <ResponsiveView mobile="デモ表示中：メール登録は利用できません" desktop={<T k="unavailable" />} />
          </div>
        )}
        <Suspense>
          <AttributionCapture />
        </Suspense>
        <div id="main" tabIndex={-1}>
          {issue ? <SetupNotice message={issue} /> : children}
        </div>
        <Footer />
        </LanguageProvider>
      </body>
    </html>
  );
}
