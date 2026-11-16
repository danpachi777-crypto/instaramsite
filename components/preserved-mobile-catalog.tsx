import type { Template } from "@/lib/validation";
import Link from "next/link";
import { categories, categorySchema } from "@/lib/validation";


import { MobileTemplateCard as TemplateCard, MobileEmptyTemplates as EmptyTemplates } from "./preserved-mobile-site";
export function MobileCatalog({templates, selected}: {templates: Template[]; selected?: string}) {
  const parsed = categorySchema.safeParse(selected);
  const filtered = selected
    ? parsed.success
      ? templates.filter((t) => t.category === parsed.data)
      : []
    : templates;
  return (
    <main className="container section catalog">
      <div className="catalog-heading">
        <span className="eyebrow">テンプレート</span>
        <h1>
          あなたの「つくりたい」は、
          <br />
          どんなスタイル？
        </h1>
        <p>ひらめきに出会う、小さなスタイルライブラリー。</p>
      </div>
      <nav className="filters" aria-label="カテゴリーで絞り込む">
        <Link href="/templates" aria-current={!selected ? "page" : undefined}>
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
        {parsed.success ? ` · ${categories[parsed.data]}` : ""}
      </p>
      {filtered.length ? (
        <div className="template-grid">
          {filtered.map((t, i) => (
            <TemplateCard key={t.id} template={t} index={i} />
          ))}
        </div>
      ) : selected ? (
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
    </main>
  );
}
