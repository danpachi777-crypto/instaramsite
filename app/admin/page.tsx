import { requireAdminPage } from "@/lib/auth";
import { configIssue } from "@/lib/env";
import { serviceClient } from "@/lib/supabase/service";
import { AdminShell, formatDate } from "@/components/admin";
export default async function Admin() {
  if (configIssue()) return null;
  await requireAdminPage();
  const db = serviceClient();
  const [subscribers, templates, recent] = await Promise.all([
    db.from("subscribers").select("id", { count: "exact", head: true }),
    db
      .from("templates")
      .select("id", { count: "exact", head: true })
      .eq("is_published", true),
    db
      .from("subscribers")
      .select("id,email,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  if (subscribers.error || templates.error || recent.error)
    throw new Error("集計を取得できませんでした。");
  return (
    <AdminShell title="概要">
      <div className="stats">
        <div>
          <span>登録者数</span>
          <strong>{subscribers.count ?? 0}</strong>
        </div>
        <div>
          <span>公開テンプレート数</span>
          <strong>{templates.count ?? 0}</strong>
        </div>
      </div>
      <h2>最近の登録</h2>
      <div className="panel">
        {recent.data?.length ? (
          <ul className="recent-list">
            {recent.data.map((s) => (
              <li key={s.id}>
                <span>{s.email}</span>
                <time>{formatDate(s.created_at)}</time>
              </li>
            ))}
          </ul>
        ) : (
          <p>登録はまだありません。</p>
        )}
      </div>
    </AdminShell>
  );
}
