import type { Metadata } from "next";
import { getPublicTemplates } from "@/lib/templates";
import { configIssue } from "@/lib/env";
import { MobileNav } from "@/components/site";
import { HeroGallery } from "@/components/hero-gallery";
export const metadata: Metadata = { alternates: { canonical: "/" } };
export default async function Home() {
  if (configIssue()) return null;
  const templates = await getPublicTemplates();
  return (
    <main className="home-only">
      <section className="hero container">
        <div className="mobile-discover-heading">
          <span>DISCOVER / MOTION</span>
          <strong>どんな動画を作りたい？</strong>
        </div>
        {templates.length ? <HeroGallery templates={templates} /> : (
          <div className="hero-placeholder">
            <span className="sculpture" aria-hidden="true">M</span>
            <span>新しいスタイルを準備中</span>
          </div>
        )}
      </section>
      <MobileNav active="home" />
    </main>
  );
}
