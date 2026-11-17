import type { Metadata } from "next";
import Link from "next/link";
import { getPublicTemplates } from "@/lib/templates";
import { configIssue } from "@/lib/env";
import { categories } from "@/lib/validation";
import { MobileNav } from "@/components/site";
import { PromoActionVideo } from "@/components/promo-action-video";
import { MotionImage } from "@/components/motion-image";
import { HeroGallery } from "@/components/hero-gallery";

export const metadata: Metadata = { alternates: { canonical: "/" } };
const categoryPicks = ["fashion", "product", "lifestyle", "cinematic", "effects", "animals", "sports"] as const;

export default async function Home() {
  if (configIssue()) return null;
  const templates = await getPublicTemplates();
  const collection = [...templates.slice(4, 8), ...templates.slice(0, 4)].slice(0, 4);

  return (
    <main className="home-only stock-home">
      <section className="stock-hero" aria-labelledby="stock-hero-title">
        <div className="stock-hero-motion" aria-hidden="true" />
        <div className="stock-hero-inner">
          <span className="stock-hero-kicker">MOTION / CREATIVE LIBRARY</span>
          <h1 id="stock-hero-title" className="stock-glitch-title">
            <span className="stock-glitch-line">想像したシーンを、</span>
            <span className="stock-glitch-line">次の動画に。</span>
          </h1>
          <p>心が動く映像スタイルを見つけよう。</p>
          <form className="stock-search" action="/templates" role="search">
            <label htmlFor="home-search">スタイルを探す</label>
            <input id="home-search" name="q" type="search" placeholder="キーワードで検索" />
            <button type="submit" aria-label="検索する">検索 <span aria-hidden="true">↗</span></button>
          </form>
          <div className="stock-hero-tags" aria-label="人気のカテゴリー">
            <span>人気のカテゴリー</span>
            {categoryPicks.slice(0, 4).map((key) => <Link key={key} href={`/templates?category=${key}`}>{categories[key]}</Link>)}
          </div>
        </div>
      </section>

      <div className="stock-content">
        <div className="stock-promo-grid stock-wrap">
          <section className="stock-promo" aria-label="MOTIONのご案内">
            <PromoActionVideo />
            <div>
              <span className="stock-section-kicker">CREATE WHAT MOVES YOU</span>
              <h2>アイデアに、動きと広がりを。</h2>
              <p>気になるスタイルを見つけて、次の制作のヒントに。</p>
              <Link href="/templates">スタイルを見る <span aria-hidden="true">↗</span></Link>
            </div>
          </section>
          <section className="stock-promo stock-promo-car" aria-label="カーチェイスのスタイル">
            <PromoActionVideo kind="car" />
            <div>
              <span className="stock-section-kicker">CHASE THE MOMENT</span>
              <h2>一瞬を、映画のワンシーンに。</h2>
              <p>疾走感あふれるカーチェイスで、視線を奪う映像へ。</p>
              <Link href="/templates?category=cinematic">スタイルを見る <span aria-hidden="true">↗</span></Link>
            </div>
            <span className="stock-promo-credit">
              映像: <a href="https://commons.wikimedia.org/wiki/File:Drifting.webm" target="_blank" rel="noopener noreferrer">Drift Mechaniks / High Resolution Database</a> · <a href="https://creativecommons.org/licenses/by/3.0/" target="_blank" rel="noopener noreferrer">CC BY 3.0</a>（編集）
            </span>
          </section>
        </div>

        <section className="stock-section stock-wrap stock-gallery" aria-labelledby="featured-heading">
          {templates.length ? <HeroGallery templates={templates} /> : <p>新しいスタイルを準備中です。</p>}
        </section>

        <section className="stock-section stock-wrap stock-collection" aria-labelledby="collection-heading">
          <div className="stock-section-heading">
            <div><span className="stock-section-kicker">CURATED COLLECTION</span><h2 id="collection-heading">心をつかむ映像を探そう</h2><p>シーンや気分にぴったりのスタイルが見つかります。</p></div>
            <Link href="/templates">すべて見る <span aria-hidden="true">↗</span></Link>
          </div>
          <nav className="stock-category-tabs" aria-label="カテゴリーから探す">
            <Link href="/templates">すべて</Link>
            {categoryPicks.map((key) => <Link key={key} href={`/templates?category=${key}`}>{categories[key]}</Link>)}
          </nav>
          <div className="stock-collection-grid">
            {collection.map((template, index) => <Link className="stock-collection-card" href={`/templates/${template.slug}`} key={template.id}>
              {template.poster_url ? <MotionImage src={template.poster_url} alt="" /> : <span aria-hidden="true">M</span>}
              <span className="stock-card-category">{categories[template.category]}</span><span className="stock-card-title">{template.title}</span>
              <span className="stock-card-arrow" aria-hidden="true">↗</span><span className="stock-card-number" aria-hidden="true">0{index + 1}</span>
            </Link>)}
          </div>
        </section>

        <section className="stock-section stock-wrap stock-browse" aria-labelledby="browse-heading">
          <div className="stock-section-heading"><div><span className="stock-section-kicker">EXPLORE BY THEME</span><h2 id="browse-heading">テーマから見つける</h2></div></div>
          <div className="stock-theme-grid">
            {categoryPicks.map((key) => {
              const image = templates.find((template) => template.category === key)?.poster_url;
              return <Link href={`/templates?category=${key}`} key={key}>
                {image && <MotionImage src={image} alt="" />}
                <span>{categories[key]} <span aria-hidden="true">↗</span></span>
              </Link>;
            })}
          </div>
        </section>
      </div>
      <MobileNav active="home" />
    </main>
  );
}
