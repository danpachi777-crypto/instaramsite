import Link from "next/link";
import { categories, type Template } from "@/lib/validation";
import { isDemo } from "@/lib/env";
import { Preview } from "@/components/preview";
import { DesktopNavigation } from "@/components/desktop-navigation";
import { HeaderSurface } from "@/components/header-surface";
import { ResponsiveView } from "@/components/responsive-view";
import { MobileHeader, MobileFooter } from "@/components/preserved-mobile-site";
export function Header() {
  return <ResponsiveView mobile={<MobileHeader />} desktop={<header className="site-header unified-header">
    <HeaderSurface />
    <Link href="/" className="wordmark" aria-label="MOTION ホーム">MOTION<span className="brand-dot">•</span></Link>
    <nav aria-label="メインメニュー">
      <Link href="/templates" className="nav-examples">動画作例</Link>
      <Link href="/#styles" className="nav-styles">スタイルを探す</Link>
      <DesktopNavigation demo={isDemo()} />
    </nav>
  </header>} />;
}
export function Footer() {
  const demo = isDemo();
  return <ResponsiveView mobile={<MobileFooter />} desktop={<footer className="site-footer unified-footer">
    <div className="footer-brand"><Link className="wordmark" href="/">MOTION</Link>
      <p>リール向けのAI動画スタイルを探せる。</p>
      <p className="micro">{demo ? "先行案内は準備中。メール登録は利用できません。" : "先行案内を受付中です。"}<br />動画生成・決済は未提供です。</p>
    </div>
    <nav className="footer-directory" aria-label="フッターメニュー">
      <div><span>探す</span><Link href="/templates">動画作例</Link><Link href="/#styles">スタイルを探す</Link><Link href="/#how">使い方</Link><Link href="/#waitlist">{demo ? "先行案内は準備中" : "先行案内"}</Link></div>
      <div><span>カテゴリ</span>{Object.entries(categories).map(([key, label]) => <Link key={key} href={"/templates?category=" + key}>{label}</Link>)}</div>
      <div><span>インフォメーション</span><Link href="/terms">利用規約</Link><Link href="/privacy">プライバシーポリシー</Link><Link href="/privacy#contact">お問い合わせ</Link></div>
    </nav>
    <p className="footer-copyright micro">© MOTION</p>
  </footer>} />;
}
export function TemplateCard({ template, index = 0 }: {template: Template; index?: number}) {
  return <article className="template-card">
    {template.preview_url ? <><p className="media-title">{template.title}の作例</p><Preview template={template} /></> :
      <Link href={"/templates/" + template.slug} aria-label={template.title + "を詳しく見る"}><Preview template={template} /></Link>}
    <div className="card-meta"><span>{categories[template.category]}</span><span>{String(index + 1).padStart(2, "0")}</span></div>
    <h3><Link href={"/templates/" + template.slug}>{template.title}</Link></h3>
    <Link className="card-link" href={"/templates/" + template.slug}>詳しく見る <span aria-hidden="true">↗</span></Link>
  </article>;
}
export function EmptyTemplates() {
  return <div className="empty-state"><p className="eyebrow">動画作例は準備中</p><h2>新しいスタイルを、準備しています。</h2>
    <p>公開できる作例が整い次第、こちらでご紹介します。</p>
    <Link className="button secondary" href="/#styles">スタイルを探す ↗</Link>
  </div>;
}
export function SetupNotice({message}: {message: string}) {
  return <main className="container narrow section"><span className="eyebrow">サイトの設定が必要です</span><h1>公開の準備をしています。</h1><p className="notice">{message}</p><p>運営者はREADMEの設定手順を確認してください。設定値そのものは画面に表示していません。</p></main>;
}
