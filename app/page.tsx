import type { Metadata } from "next";
import Link from "next/link";
import { getPublicTemplates } from "@/lib/templates";
import { configIssue, isDemo } from "@/lib/env";
import { TemplateCard, EmptyTemplates } from "@/components/site";
import { Preview } from "@/components/preview";
import { WaitlistForm } from "@/components/waitlist-form";
export const metadata: Metadata = { alternates: { canonical: "/" } };
export default async function Home() {
  if (configIssue()) return null;
  const templates = await getPublicTemplates();
  return (
    <main>
      <section className="hero container">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="live-dot" />
            あなたの次のクリエイティブへ
          </p>
          <h1>
            次に話題になる
            <br />
            動画は、
            <br />
            <span>ここから。</span>
          </h1>
          <p className="hero-description">
            次のリールに使いたいAI動画スタイルを見つけよう。お気に入りのテンプレートを選んで、先行案内に登録できます。
          </p>
          <div className="hero-actions">
            <Link className="button primary" href="/templates">
              テンプレートを見る <span aria-hidden="true">↗</span>
            </Link>
            <Link className="text-link" href="#waitlist">
              先行案内に登録する <span aria-hidden="true">→</span>
            </Link>
          </div>
          <p className="hero-note">
            MOTIONは先行案内を受付中です。
            <br />
            動画生成と決済は、まだご利用いただけません。
          </p>
        </div>
        <div className="hero-visual">
          <div className="visual-top">
            <span>次の「つくりたい」を見つけよう</span>
            <span aria-hidden="true">↗</span>
          </div>
          <div className="hero-posters">
            {templates.length ? (
              templates.slice(0, 3).map((t, i) => (
                <div key={t.id} className={`hero-poster poster-${i}`}>
                  <Preview template={t} eager={i === 1} />
                  <span className="poster-title">{t.title}</span>
                </div>
              ))
            ) : (
              <div className="hero-placeholder">
                <span className="sculpture" aria-hidden="true">
                  M
                </span>
                <span>新しいスタイルを準備中</span>
              </div>
            )}
          </div>
          <div className="visual-bottom">
            <span>
              ひとつのスタイルから、
              <br />
              あなたらしい一本へ。
            </span>
            <span className="visual-index">M / 01</span>
          </div>
        </div>
      </section>
      <div className="manifesto">
        <div className="container">
          <span>選ぶのは、つくりたい見た目だけ。</span>
          <span>
            ひらめきを、次のリールへ。 <span aria-hidden="true">↗</span>
          </span>
        </div>
      </div>
      <section className="container section" id="styles">
        <div className="section-heading">
          <div>
            <span className="eyebrow">スタイルを探す</span>
            <h2>
              どんな世界を、
              <br className="mobile-only" />
              つくろう。
            </h2>
          </div>
          <Link className="text-link" href="/templates">
            すべてのテンプレート <span aria-hidden="true">↗</span>
          </Link>
        </div>
        {templates.length ? (
          <div className="template-grid featured">
            {templates.slice(0, 4).map((t, i) => (
              <TemplateCard key={t.id} template={t} index={i} />
            ))}
          </div>
        ) : (
          <EmptyTemplates />
        )}
      </section>
      <section className="how-section" id="how">
        <div className="container section">
          <span className="eyebrow">使い方</span>
          <h2>
            イメージが決まれば、
            <br />
            はじまりはすぐそこ。
          </h2>
          <div className="steps">
            {[
              [
                "スタイルを見る",
                "作例を眺めながら、気になる世界観を探しましょう。",
              ],
              [
                "テンプレートを選ぶ",
                "名前やカテゴリーから、次のリールのアイデアを見つけて。",
              ],
              [
                "先行案内に登録する",
                "気になるスタイルを選んで登録。新しい情報が整い次第、ご案内します。",
              ],
            ].map(([title, desc], i) => (
              <div key={title} className="step">
                <span className="step-number">0{i + 1}</span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="container section signup-section" id="waitlist">
        <div>
          <span className="eyebrow">先行案内</span>
          <h2>
            次のアイデアを、
            <br />
            <span className="accent">見逃さないで。</span>
          </h2>
          <p>
            気になるスタイルの続報を、メールで。
            <br />
            情報が整い次第、お知らせします。
          </p>
          <p className="micro">
            現在は先行案内の受付段階です。
            <br />
            ご登録は無料です。公開日や再生数を保証するものではありません。
          </p>
        </div>
        <WaitlistForm demo={isDemo()} source="footer" />
      </section>
    </main>
  );
}
