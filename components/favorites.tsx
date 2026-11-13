"use client";

import Link from "next/link";
import type { Template } from "@/lib/validation";
import { TemplateCard } from "@/components/site";
import { saveFavorites, useFavorites } from "@/components/favorite-store";

export function FavoriteList({ templates }: { templates: Template[] }) {
  const { ready, slugs } = useFavorites();
  const bySlug = new Map(templates.map((template) => [template.slug, template]));
  const saved = slugs.map((slug) => bySlug.get(slug)).filter((template): template is Template => !!template);

  if (!ready) return <p role="status">お気に入りを読み込んでいます。</p>;
  if (saved.length === 0) {
    return (
      <div className="empty-state">
        <h2>お気に入りはまだありません。</h2>
        <p>気になるスタイルのハートを押すと、ここからいつでも見返せます。</p>
        <Link className="button secondary" href="/templates">スタイルを探す ↗</Link>
      </div>
    );
  }
  return (
    <>
      <p className="result-count" role="status">{saved.length}件のお気に入り</p>
      <div className="template-grid">
        {saved.map((template, index) => <TemplateCard key={template.id} template={template} index={index} />)}
      </div>
    </>
  );
}

export function FavoriteSettings() {
  const { ready, slugs } = useFavorites();
  return (
    <section className="settings-panel">
      <h2>お気に入り</h2>
      <p>{ready ? `${slugs.length}件保存しています。` : "読み込んでいます。"}</p>
      <p className="micro">このブラウザに保存されます。別の端末との同期はありません。</p>
      <button className="button secondary" type="button" disabled={!ready || slugs.length === 0} onClick={() => saveFavorites([])}>
        お気に入りをすべて削除
      </button>
    </section>
  );
}
