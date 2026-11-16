import Link from "next/link";

export function DesktopGlance() {
  return (
    <section className="desktop-glance" aria-label="MOTIONについて">
      <div className="desktop-reference-label">
        <span>MOTION AT A GLANCE</span>
      </div>
      <p>まだ見たことのない、自分のスタイルへ。</p>
      <div className="desktop-glance-grid">
        {[
          ["カテゴリー", "5つの世界", "スタイル一覧を見る", "/templates"],
          ["探し方", "作例から選ぶ", "使い方を見る", "/#how"],
          ["先行案内", "登録は無料", "登録について", "/#waitlist"],
          ["公開情報", "新しい表現へ", "最新のスタイル", "/#styles"],
        ].map(([label, value, link, href], i) => (
          <Link key={label} href={href}>
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.2"
              aria-hidden="true"
            >
              {i === 0 ? (
                <path d="M4 20V10M8 20V14M12 20V8M16 20V12M20 20V5" />
              ) : i === 1 ? (
                <>
                  <path d="M12 3 22 12 12 22 2 12z" />
                  <path d="M8 12h8m-4-4v8" />
                </>
              ) : i === 2 ? (
                <>
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 6v7l5 2" />
                </>
              ) : (
                <>
                  <path d="M4 4h16v16H4zM4 9h16M9 4v16" />
                </>
              )}
            </svg>
            <span className="desktop-glance-label">{label}</span>
            <span className="desktop-glance-value">{value}</span>
            <span className="desktop-glance-link">{link} +</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
