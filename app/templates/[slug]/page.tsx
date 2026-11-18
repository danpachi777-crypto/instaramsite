import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicTemplate } from "@/lib/templates";
import { configIssue, isDemo } from "@/lib/env";
import { Preview } from "@/components/preview";
import { WaitlistForm } from "@/components/waitlist-form";
import { ResponsiveView } from "@/components/responsive-view";
import { MobileDetail } from "@/components/preserved-mobile-detail";
import { IdeaName, T } from "@/components/i18n";
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
  const demo = isDemo();
  return <ResponsiveView mobile={<MobileDetail template={template} demo={demo} />} desktop={(
    <main className="container section template-detail">
      <Link className="back-link" href="/templates">
        <T k="back" />
      </Link>
      <div className="detail-grid">
        <div className="detail-preview">
          <p className="media-title"><IdeaName slug={template.slug} original={template.title} /> — <T k={template.preview_url ? "viewIdeas" : "preparing"} /></p>
          <Preview template={template} eager />
        </div>
        <div className="detail-copy">
          <span className="eyebrow">
            <T k={template.category} /> · {template.aspect_ratio}
          </span>
          <h1><IdeaName slug={template.slug} original={template.title} /></h1>
          <p className="detail-description" lang="ja" dir="auto">{template.description}</p>
          <div className="usage">
            <h2><T k="step2" /></h2>
            <p><T k="catalogIntro" /></p>
          </div>
          {demo ? <Link className="button primary" href="/templates"><T k="allIdeas" /></Link> : <a className="button primary" href="#template-waitlist"><T k="earlyAccess" /></a>}
          <p className="micro">
            <T k={demo ? "unavailable" : "earlyDescription"} />
          </p>
        </div>
      </div>
      <section className="signup-section detail-signup" id="template-waitlist">
        <div>
          <span className="eyebrow"><T k="earlyAccess" /></span>
          <h2>
            <T k={demo ? "earlyPreparing" : "step3"} />
          </h2>
          <p><T k={demo ? "demoIntro" : "earlyDescription"} /></p>
        </div>
        <WaitlistForm
          demo={demo}
          source="template"
          templateId={template.id}
        />
      </section>
    </main>
  )} />;
}
