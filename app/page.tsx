/* eslint-disable @next/next/no-img-element -- Reuse existing category artwork. */
import type { Metadata } from "next";
import Link from "next/link";
import { getPublicTemplates } from "@/lib/templates";
import { configIssue, isDemo } from "@/lib/env";
import { EmptyTemplates } from "@/components/site";
import { IdeaCarousel } from "@/components/idea-carousel";
import { T } from "@/components/i18n";
import { WaitlistForm } from "@/components/waitlist-form";
import { DesktopMotion } from "@/components/desktop-motion";
import { ResponsiveView } from "@/components/responsive-view";
import { MobileHome } from "@/components/preserved-mobile-home";
export const metadata: Metadata = { alternates: { canonical: "/" } };
export default async function Home() {
  if (configIssue()) return null;
  const templates = await getPublicTemplates();
  const demo = isDemo();
  const featured = [...templates].sort((a, b) => Number(!!b.preview_url) - Number(!!a.preview_url));
  return <ResponsiveView mobile={<MobileHome templates={templates} demo={demo} />} desktop={(
    <main className="motion-home">
      <DesktopMotion />
      <section className="container section representative-examples" id="examples" aria-labelledby="examples-title">
        <div className="section-heading">
          <h2 id="examples-title"><T k="ideasHeading" /></h2>
          <Link className="text-link" href="/templates"><T k="allIdeas" /></Link>
        </div>
        <p className="section-intro"><T k="ideasIntro" /></p>
        {featured.length ? <IdeaCarousel templates={featured} /> : <EmptyTemplates />}
      </section>
      <section className="container section usage-section" id="how" aria-labelledby="how-title">
        <h2 id="how-title"><T k="howHeading" /></h2>
        <ol className="usage-steps">
          <li><h3><T k="step1" /></h3><p><T k="catalogIntro" /></p><Link href="/templates"><T k="explore" /></Link></li>
          <li><h3><T k="step2" /></h3><p><T k="ideasIntro" /></p><Link href="/templates"><T k="viewIdeas" /></Link></li>
          <li><h3><T k="step3" /></h3><p><T k={demo ? "demoIntro" : "earlyDescription"} /></p><Link href="#waitlist"><T k="earlyAccess" /></Link></li>
        </ol>
      </section>
      <section className="container section signup-section home-signup" id="waitlist">
        <div className="signup-copy"><p className="eyebrow"><T k="earlyAccess" /></p>
          <h2><T k={demo ? "earlyPreparing" : "step3"} /></h2>
          <p><T k={demo ? "demoIntro" : "earlyDescription"} /></p>
          {demo && <p className="micro"><T k="unavailable" /></p>}
        </div>
        <WaitlistForm demo={demo} source="footer" />
      </section>
    </main>
  )} />;
}
