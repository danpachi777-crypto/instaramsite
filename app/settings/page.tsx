import type { Metadata } from "next";
import Link from "next/link";
import { FavoriteSettings } from "@/components/favorites";
import { MobileNav } from "@/components/site";

export const metadata: Metadata = {
  title: "設定",
  alternates: { canonical: "/settings" },
  robots: { index: false, follow: true },
};

export default function SettingsPage() {
  return (
    <main className="container narrow section settings-page">
      <span className="eyebrow">SETTINGS</span>
      <h1>設定</h1>
      <FavoriteSettings />
      <section className="settings-panel">
        <h2>サイトについて</h2>
        <Link href="/privacy">プライバシーポリシー ↗</Link>
        <Link href="/terms">利用規約 ↗</Link>
        <Link href="/privacy#contact">お問い合わせ ↗</Link>
      </section>
      <MobileNav active="settings" />
    </main>
  );
}
