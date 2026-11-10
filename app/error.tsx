"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="container narrow section empty-state">
      <h1>読み込みがうまくいきませんでした。</h1>
      <p>時間をおいて、もう一度お試しください。</p>
      <button className="button primary" onClick={reset}>
        もう一度読み込む
      </button>
    </main>
  );
}
