import type { Metadata } from "next";
import { getPublicTemplates } from "@/lib/templates";
import { configIssue } from "@/lib/env";
import { FavoriteList } from "@/components/favorites";
import { MobileNav } from "@/components/site";

export const metadata: Metadata = {
  title: "お気に入り",
  alternates: { canonical: "/favorites" },
  robots: { index: false, follow: true },
};

export default async function FavoritesPage() {
  if (configIssue()) return null;
  const templates = await getPublicTemplates();
  return (
    <main className="container section catalog">
      <div className="catalog-heading">
        <span className="eyebrow">FAVORITES</span>
        <h1>お気に入り</h1>
        <p>保存したスタイルを見返して、次のアイデアに。</p>
      </div>
      <FavoriteList templates={templates} />
      <MobileNav active="favorites" />
    </main>
  );
}
