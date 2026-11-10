import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicTemplate } from "@/lib/templates";
import { configIssue, isDemo } from "@/lib/env";
import { categories } from "@/lib/validation";
import { Preview } from "@/components/preview";
import { WaitlistForm } from "@/components/waitlist-form";
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
          <p className="detail-description">{template.description}</p>
          <div className="usage">
            <h2>こんな制作に</h2>
            <p>
              {template.description} 気になる世界観を、次のリールのアイデアに。
            </p>
          </div>
          <a className="button primary" href="#template-waitlist">
            このテンプレートの先行案内に登録する{" "}
            <span aria-hidden="true">↗</span>
          </a>
          <p className="micro">
            作例を準備しているテンプレートには仮のイメージを表示しています。動画生成と決済は未提供です。
          </p>
        </div>
      </div>
      <section className="signup-section detail-signup" id="template-waitlist">
        <div>
          <span className="eyebrow">このスタイルが気になったら</span>
          <h2>
            「{template.title}」の
            <br />
            先行案内を受け取る。
          </h2>
          <p>選んだテンプレートと一緒にお申し込みを受け付けます。</p>
        </div>
        <WaitlistForm
          demo={isDemo()}
          source="template"
          templateId={template.id}
        />
      </section>
    </main>
  );
}
