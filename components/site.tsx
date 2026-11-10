import Link from "next/link";
import { categories, type Template } from "@/lib/validation";
import { Preview } from "@/components/preview";
export function Header() {
  return (
    <header className="site-header">
      <Link href="/" className="wordmark" aria-label="MOTION ホーム">
        MOTION<span className="brand-dot">•</span>
      </Link>
      <nav aria-label="メインメニュー">
        <Link href="/templates">テンプレート</Link>
        <Link href="/#how" className="nav-how">
          使い方
        </Link>
        <Link href="/#waitlist" className="nav-cta">
          先行案内に登録<span aria-hidden="true">↗</span>
        </Link>
      </nav>
    </header>
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
        <p className="micro">先行案内を受付中。動画生成・決済は未提供です。</p>
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
}: {
  template: Template;
  index?: number;
}) {
  return (
    <article className="template-card">
      <Link
        href={`/templates/${template.slug}`}
        aria-label={`${template.title}を詳しく見る`}
      >
        <Preview template={template} />
      </Link>
      <div className="card-meta">
        <span>{categories[template.category]}</span>
        <span>{String(index + 1).padStart(2, "0")}</span>
      </div>
      <h3>
        <Link href={`/templates/${template.slug}`}>{template.title}</Link>
      </h3>
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
      <Link className="button secondary" href="/#waitlist">
        先行案内に登録する ↗
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
