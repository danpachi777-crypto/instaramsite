import type { Metadata } from "next";
import Link from "next/link";
import { categories, categorySchema } from "@/lib/validation";
import { getPublicTemplates } from "@/lib/templates";
import { configIssue } from "@/lib/env";
import { TemplateCard, EmptyTemplates, MobileNav } from "@/components/site";
import { videoCategories, type VideoCategoryKey } from "@/lib/video-categories";
export const metadata: Metadata = {
  title: "テンプレート",
  alternates: { canonical: "/templates" },
};
export default async function Templates({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; categories?: string }>;
}) {
  if (configIssue()) return null;
  const params = await searchParams;
  const selected = params.category;
  const parsed = categorySchema.safeParse(selected);
  const knownKeys = new Set<string>(videoCategories.map((item) => item.key));
  const picked = !selected && params.categories
    ? params.categories.split(",").filter((key): key is VideoCategoryKey => knownKeys.has(key))
    : [];
  const templates = await getPublicTemplates();
  const filtered = selected
    ? parsed.success
      ? templates.filter((t) => t.category === parsed.data)
      : []
    : picked.length
      ? templates.filter((t) => picked.includes(t.category))
    : templates;
  return (
    <main className="container section catalog">
      <div className="catalog-heading">
        <h1>テンプレート</h1>
        <p>ひらめきに出会う、小さなスタイルライブラリー。</p>
      </div>
      <nav className="filters" aria-label="カテゴリーで絞り込む">
        <Link href="/templates" aria-current={!selected && !picked.length ? "page" : undefined}>
          すべて
        </Link>
        {Object.entries(categories).map(([key, label]) => (
          <Link
            key={key}
            href={`/templates?category=${key}`}
            aria-current={selected === key ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      <p className="result-count" role="status">
        {filtered.length}件のテンプレート
        {parsed.success ? ` · ${categories[parsed.data]}` : picked.length ? ` · ${picked.length}カテゴリを選択中` : ""}
      </p>
      {filtered.length ? (
        <div className="template-grid">
          {filtered.map((t, i) => (
            <TemplateCard key={t.id} template={t} index={i} compact />
          ))}
        </div>
      ) : selected || picked.length ? (
        <div className="empty-state">
          <h2>該当するテンプレートはありません。</h2>
          <p>別のカテゴリーも見てみましょう。</p>
          <Link className="button secondary" href="/templates">
            絞り込みを解除する
          </Link>
        </div>
      ) : (
        <EmptyTemplates />
      )}
      <MobileNav active="templates" />
    </main>
  );
}
