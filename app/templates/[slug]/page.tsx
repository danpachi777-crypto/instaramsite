import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicTemplate } from "@/lib/templates";
import { configIssue } from "@/lib/env";
import { categories } from "@/lib/validation";
import { Preview } from "@/components/preview";
import { MobileNav } from "@/components/site";
import { FavoriteButton } from "@/components/favorite-button";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  if (configIssue()) return { title: "準備中" };
  const t = await getPublicTemplate((await params).slug);
  if (!t) notFound();
  return {
    title: t.title,
    description: t.description,
    alternates: { canonical: `/templates/${t.slug}` },
    openGraph: { title: `${t.title} | MOTION`, description: t.description },
  };
}
export default async function TemplateDetail({ params }: Props) {
  if (configIssue()) return null;
  const template = await getPublicTemplate((await params).slug);
  if (!template) notFound();
  return (
    <main className="container section">
      <Link className="back-link" href="/templates">
        ← テンプレート一覧へ
      </Link>
      <div className="detail-grid">
        <div className="detail-preview">
          <Preview template={template} eager />
        </div>
        <div className="detail-copy">
          <span className="eyebrow">
            {categories[template.category]} · {template.aspect_ratio}
          </span>
          <h1>{template.title}</h1>
          <FavoriteButton slug={template.slug} title={template.title} />
          <p className="detail-description">{template.description}</p>
          <div className="usage">
            <h2>こんな制作に</h2>
            <p>
              {template.description} 気になる世界観を、次のリールのアイデアに。
            </p>
          </div>
          <button className="button primary" type="button" disabled aria-describedby="creation-status">
            このテンプレートで動画を作る <span aria-hidden="true">↗</span>
          </button>
          <p className="micro" id="creation-status">動画作成機能は準備中です。</p>
        </div>
      </div>
      <MobileNav active="templates" />
    </main>
  );
}
