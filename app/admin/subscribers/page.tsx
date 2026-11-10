import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { configIssue } from "@/lib/env";
import { serviceClient } from "@/lib/supabase/service";
import { AdminShell, formatDate } from "@/components/admin";
import { DeleteSubscriber } from "@/components/admin-forms";
import { parseFilters, getSubscriberPage, PAGE_SIZE } from "@/lib/subscribers";
import { HttpError } from "@/lib/http";
export default async function Subscribers({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  if (configIssue()) return null;
  await requireAdminPage();
  const params = await searchParams;
  let filters;
  try {
    filters = parseFilters(params);
  } catch (error) {
    if (!(error instanceof HttpError)) throw error;
    return (
      <AdminShell title="登録者管理">
        <p role="alert" className="notice">
          {error.message}
        </p>
        <Link href="/admin/subscribers">絞り込みを解除する</Link>
      </AdminShell>
    );
  }
  const db = serviceClient();
  const [{ rows, count }, templates] = await Promise.all([
    getSubscriberPage(db, filters),
    db.from("templates").select("id,title").order("sort_order"),
  ]);
  if (templates.error) throw new Error("テンプレートを取得できませんでした。");
  const titles = new Map((templates.data ?? []).map((t) => [t.id, t.title]));
  const query = new URLSearchParams();
  if (filters.template) query.set("template", filters.template);
  if (filters.from) query.set("from", filters.from);
  if (filters.to) query.set("to", filters.to);
  function pageHref(page: number) {
    const q = new URLSearchParams(query);
    q.set("page", String(page));
    return `/admin/subscribers?${q}`;
  }
  return (
    <AdminShell title="登録者管理">
      <form className="panel subscriber-filters" method="get">
        <div>
          <label htmlFor="filter-template">テンプレート</label>
          <select
            id="filter-template"
            name="template"
            defaultValue={filters.template ?? ""}
          >
            <option value="">すべて</option>
            {templates.data.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="filter-from">登録日（開始・日本時間）</label>
          <input
            id="filter-from"
            type="date"
            name="from"
            defaultValue={filters.from}
          />
        </div>
        <div>
          <label htmlFor="filter-to">登録日（終了・日本時間）</label>
          <input
            id="filter-to"
            type="date"
            name="to"
            defaultValue={filters.to}
          />
        </div>
        <button className="button primary" type="submit">
          絞り込む
        </button>
        <Link href="/admin/subscribers">解除</Link>
      </form>
      <div className="list-toolbar">
        <p>
          {count}件 · {filters.page}ページ目
        </p>
        <a
          className="button secondary small"
          href={`/api/admin/subscribers/export?${query}`}
        >
          絞り込み結果をCSV出力
        </a>
      </div>
      <p className="micro">
        CSVは全ページの対象を出力します（上限10,000件）。登録日で分割してください。
      </p>
      <div className="subscriber-list">
        {rows.map((s) => (
          <article key={s.id} className="panel subscriber">
            <div>
              <h2>{s.email}</h2>
              <p>
                {s.template_id
                  ? (titles.get(s.template_id) ?? "対象テンプレートなし")
                  : "テンプレート指定なし"}
              </p>
              <p className="micro">
                登録：{formatDate(s.created_at)}
                <br />
                同意：{formatDate(s.consent_at)} · {s.consent_version}
              </p>
              <dl className="attribution-data">
                <dt>登録場所</dt>
                <dd>
                  {{
                    hero: "紹介ページ",
                    footer: "ページ下部",
                    template: "テンプレート詳細",
                  }[s.source] ?? s.source}
                </dd>
                <dt>流入元</dt>
                <dd>
                  {[s.utm_source, s.utm_medium, s.utm_campaign, s.utm_content]
                    .filter(Boolean)
                    .join(" / ") || "指定なし"}
                </dd>
              </dl>
            </div>
            <DeleteSubscriber id={s.id} email={s.email} />
          </article>
        ))}
      </div>
      {!rows.length && (
        <p className="empty-state">該当する登録者はいません。</p>
      )}
      <nav className="pagination" aria-label="登録者のページ切り替え">
        {filters.page > 1 && (
          <Link className="button secondary" href={pageHref(filters.page - 1)}>
            ← 前のページ
          </Link>
        )}
        {filters.page * PAGE_SIZE < count && (
          <Link className="button secondary" href={pageHref(filters.page + 1)}>
            次のページ →
          </Link>
        )}
      </nav>
    </AdminShell>
  );
}
