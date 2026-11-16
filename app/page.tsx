/* eslint-disable @next/next/no-img-element -- Reuse existing category artwork. */
import type { Metadata } from "next";
import Link from "next/link";
import { getPublicTemplates } from "@/lib/templates";
import { configIssue, isDemo } from "@/lib/env";
import { categories } from "@/lib/validation";
import { TemplateCard, EmptyTemplates } from "@/components/site";
import { WaitlistForm } from "@/components/waitlist-form";
import { DesktopMotion } from "@/components/desktop-motion";
import { ResponsiveView } from "@/components/responsive-view";
import { MobileHome } from "@/components/preserved-mobile-home";
export const metadata: Metadata = { alternates: { canonical: "/" } };
const categoryArt: Record<string, string> = {
  fashion: "runway-walk", product: "luxury-bottle", lifestyle: "dream-room",
  cinematic: "cinematic-car", effects: "orbit-object",
};
const categoryDescriptions: Record<string, string> = {
  fashion: "服のシルエットや、着こなしの変化を。",
  product: "商品のかたちや質感を、印象的に。",
  lifestyle: "日常や暮らしを、ひとつの世界に。",
  cinematic: "光と構図で、映画のような一本へ。",
  effects: "意外な動きや、不思議な視覚表現を。",
};
export default async function Home() {
  if (configIssue()) return null;
  const templates = await getPublicTemplates();
  const demo = isDemo();
  const featured = [...templates].sort((a, b) => Number(!!b.preview_url) - Number(!!a.preview_url)).slice(0, 4);
  return <ResponsiveView mobile={<MobileHome templates={templates} demo={demo} />} desktop={(
    <main className="motion-home">
      <DesktopMotion />
      <section className="hero container mobile-home-hero">
        <div className="hero-copy">
          <h1>次に話題になる<br />動画は、ここから。</h1>
          <p className="hero-description">リール向けのAI動画スタイルを探せる、MOTION。</p>
          <Link className="button primary" href="/templates">動画作例を見る <span aria-hidden="true">↗</span></Link>
          <p className="hero-note">{demo ? "先行案内は準備中です。" : "気になったスタイルの先行案内を受け取れます。"}</p>
        </div>
      </section>
      <section className="container section representative-examples" id="examples" aria-labelledby="examples-title">
        <div className="section-heading">
          <div><p className="eyebrow">動画作例</p><h2 id="examples-title">次の一本の、ヒントに。</h2></div>
          <Link className="text-link" href="/templates">すべての動画作例を見る ↗</Link>
        </div>
        <p className="section-intro">リールに使いたい見た目や動きを、作例から探しましょう。映像が未公開のスタイルには「動画準備中」と表示しています。</p>
        {featured.length ? <div className="template-grid representative-grid">{featured.map((t, i) => <TemplateCard key={t.id} template={t} index={i} />)}</div> : <EmptyTemplates />}
      </section>
      <section className="container section category-section" id="styles" aria-labelledby="styles-title">
        <div className="section-heading"><div><p className="eyebrow">スタイルを探す</p><h2 id="styles-title">どんな世界を、つくろう。</h2></div></div>
        <div className="category-grid">
          {Object.entries(categories).map(([key, label]) => {
            const sample = templates.find(t => t.category === key && t.poster_url && !t.poster_url.endsWith(".svg"));
            return <Link className="category-card" href={"/templates?category=" + key} key={key}>
              <div className="category-image"><img src={sample?.poster_url || "/demo/" + categoryArt[key] + ".svg"} alt={label + "の" + (sample ? "作例カット" : "イメージイラスト")} loading="lazy" width="400" height="320" />{!sample && <span>イメージイラスト</span>}</div>
              <div><h3>{label}<span aria-hidden="true">↗</span></h3><p>{categoryDescriptions[key]}</p></div>
            </Link>;
          })}
        </div>
      </section>
      <section className="container section usage-section" id="how" aria-labelledby="how-title">
        <p className="eyebrow">使い方</p><h2 id="how-title">アイデアから、次の一本へ。</h2>
        <ol className="usage-steps">
          <li><span>01</span><h3>カテゴリを選ぶ</h3><p>服、商品、暮らし。つくりたい世界観から選びます。</p><Link href="#styles">スタイルを探す ↗</Link></li>
          <li><span>02</span><h3>作例を見る</h3><p>詳細ページで構図や動きを確かめます。映像がある作例は再生できます。</p><Link href="/templates">動画作例を見る ↗</Link></li>
          <li><span>03</span><h3>気になったスタイルの案内を受け取る</h3><p>{demo ? "先行案内は準備中です。現在はスタイルの閲覧まで体験できます。" : "作例の詳細ページから、そのスタイルの先行案内に登録できます。"}</p><Link href="#waitlist">先行案内の状況を見る ↗</Link></li>
        </ol>
      </section>
      <section className="container section signup-section home-signup" id="waitlist">
        <div className="signup-copy"><p className="eyebrow">先行案内</p>
          <h2>{demo ? "先行案内は準備中" : "気になるスタイルの、次の知らせを。"}</h2>
          <p>{demo ? "現在はデモ表示中です。カテゴリと作例の閲覧をご利用いただけます。" : "新しいスタイルの情報が整い次第、メールでお知らせします。"}</p>
          <p className="micro">動画生成・決済は未提供です。{demo ? "メール登録は利用できません。" : "登録は無料です。公開日や再生数を保証するものではありません。"}</p>
        </div>
        <WaitlistForm demo={demo} source="footer" />
      </section>
      <section className="container section site-film-section">
        <details><summary>MOTIONの紹介映像を見る <span>サイトの3D演出を紹介する映像です</span></summary>
          <figure><figcaption>MOTIONの紹介映像 — サイトの3D演出</figcaption>
            <video controls playsInline muted preload="none" poster="/motion/previews/world.webp" aria-label="MOTIONの紹介映像：サイトの3D演出"><source src="/motion/previews/world.webm" type="video/webm" /><track kind="captions" src="/demo/silent.vtt" srcLang="ja" label="無音の紹介映像" default /></video>
          </figure>
        </details>
      </section>
    </main>
  )} />;
}
