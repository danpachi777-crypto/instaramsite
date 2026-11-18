import type { Metadata } from "next";
import Link from "next/link";
import { categories, categorySchema } from "@/lib/validation";
import { getPublicTemplates } from "@/lib/templates";
import { configIssue } from "@/lib/env";
import { TemplateCard, EmptyTemplates } from "@/components/site";
import { ResponsiveView } from "@/components/responsive-view";
import { MobileCatalog } from "@/components/preserved-mobile-catalog";
import { T } from "@/components/i18n";
export const metadata: Metadata = {
  title: "動画作例",
  alternates: { canonical: "/templates" },
};
export default async function Templates({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  if (configIssue()) return null;
  const selected = (await searchParams).category;
  const parsed = categorySchema.safeParse(selected);
  const templates = await getPublicTemplates();
  const filtered = selected
    ? parsed.success
      ? templates.filter((t) => t.category === parsed.data)
      : []
    : templates;
  return <ResponsiveView mobile={<MobileCatalog templates={templates} selected={selected} />} desktop={(
    <main className="container section catalog">
      <div className="catalog-heading">
        <span className="eyebrow"><T k="explore" /></span>
        <h1>
          <T k="catalogTitle" />
        </h1>
        <p><T k="catalogIntro" /></p>
      </div>
      <nav className="filters" aria-label="カテゴリーで絞り込む">
        <Link href="/templates" aria-current={!selected ? "page" : undefined}>
          <T k="all" />
        </Link>
        {(Object.keys(categories) as Array<keyof typeof categories>).map(key => (
          <Link
            key={key}
            href={`/templates?category=${key}`}
            aria-current={selected === key ? "page" : undefined}
          >
            <T k={key} />
          </Link>
        ))}
      </nav>
      <p className="result-count" role="status">
        <T k="results" values={{count: filtered.length}} />
        {parsed.success ? <> · <T k={parsed.data} /></> : ""}
      </p>
      {filtered.length ? (
        <div className="template-grid">
          {filtered.map((t, i) => (
            <TemplateCard key={t.id} template={t} index={i} />
          ))}
        </div>
      ) : selected ? (
        <div className="empty-state">
          <h2><T k="noResults" /></h2>
          <Link className="button secondary" href="/templates">
            <T k="clearFilter" />
          </Link>
        </div>
      ) : (
        <EmptyTemplates />
      )}
    </main>
  )} />;
}
