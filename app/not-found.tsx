import Link from "next/link";
export default function NotFound() {
  return (
    <main className="container narrow section empty-state">
      <span className="eyebrow">404</span>
      <h1>ページが見つかりません。</h1>
      <p>公開が終了したか、URLが変更された可能性があります。</p>
      <Link className="button primary" href="/templates">
        テンプレート一覧へ ↗
      </Link>
    </main>
  );
}
