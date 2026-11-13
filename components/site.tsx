import Link from "next/link";
import { categories, type Template } from "@/lib/validation";
import { Preview } from "@/components/preview";
import { FavoriteButton } from "@/components/favorite-button";
import { LanguageSwitcher } from "@/components/language";
export function Header() {
  return (
    <header className="site-header">
      <div className="header-start">
        <LanguageSwitcher />
        <Link href="/" className="wordmark" aria-label="MOTION ホーム">
          MOTION<span className="brand-dot">•</span>
        </Link>
      </div>
      <nav aria-label="メインメニュー">
        <Link href="/">ホーム</Link>
        <Link href="/templates">探す</Link>
        <Link href="/favorites" className="nav-how">お気に入り</Link>
        <Link href="/settings" className="nav-cta">設定<span aria-hidden="true">↗</span></Link>
      </nav>
    </header>
  );
}
export function MobileNav({ active }: { active: "home" | "templates" | "favorites" | "settings" }) {
  return (
    <nav className="mobile-tabbar" aria-label="スマホ用メニュー">
      <Link href="/" aria-current={active === "home" ? "page" : undefined}>
        <span className="tab-icon" aria-hidden="true">⌂</span><span>ホーム</span>
      </Link>
      <Link href="/templates" aria-current={active === "templates" ? "page" : undefined}>
        <span className="tab-icon" aria-hidden="true">▦</span><span>探す</span>
      </Link>
      <Link href="/favorites" aria-current={active === "favorites" ? "page" : undefined}>
        <span className="tab-icon" aria-hidden="true">♡</span><span>お気に入り</span>
      </Link>
      <Link href="/settings" aria-current={active === "settings" ? "page" : undefined}>
        <span className="tab-icon" aria-hidden="true">⚙</span><span>設定</span>
      </Link>
    </nav>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <Link className="wordmark" href="/">
          MOTION
        </Link>
        <p>まだ見たことのない、自分のスタイルへ。</p>
      </div>
      <div className="footer-links">
        <Link href="/privacy">プライバシーポリシー</Link>
        <Link href="/terms">利用規約</Link>
        <Link href="/privacy#contact">お問い合わせ</Link>
      </div>
      <span className="micro">© MOTION</span>
    </footer>
  );
}
export function TemplateCard({
  template,
  index = 0,
  compact = false,
}: {
  template: Template;
  index?: number;
  compact?: boolean;
}) {
  return (
    <article className={`template-card${compact ? " compact-card" : ""}`}>
      <Link
        href={`/templates/${template.slug}`}
        aria-label={`${template.title}を詳しく見る`}
      >
        <Preview template={template} posterOnly={compact} />
      </Link>
      <div className="card-meta">
        <span>{categories[template.category]}</span>
        <span>{String(index + 1).padStart(2, "0")}</span>
      </div>
      <h3>
        <Link href={`/templates/${template.slug}`}>{template.title}</Link>
      </h3>
      <FavoriteButton slug={template.slug} title={template.title} />
      <Link className="card-link" href={`/templates/${template.slug}`}>
        詳しく見る <span aria-hidden="true">↗</span>
      </Link>
    </article>
  );
}
export function EmptyTemplates() {
  return (
    <div className="empty-state">
      <span className="eyebrow">ただいま準備中</span>
      <h2>新しいスタイルを、準備しています。</h2>
      <p>公開できる作例が整い次第、こちらでご紹介します。</p>
      <Link className="button secondary" href="/">
        ホームに戻る ↗
      </Link>
    </div>
  );
}
export function SetupNotice({ message }: { message: string }) {
  return (
    <main className="container narrow section">
      <span className="eyebrow">サイトの設定が必要です</span>
      <h1>公開の準備をしています。</h1>
      <p className="notice">{message}</p>
      <p>
        運営者はREADMEの設定手順を確認してください。設定値そのものは画面に表示していません。
      </p>
    </main>
  );
}
