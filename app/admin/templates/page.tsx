import Link from "next/link";
import { requireAdminPage } from "@/lib/auth";
import { configIssue } from "@/lib/env";
import { serviceClient } from "@/lib/supabase/service";
import { AdminShell } from "@/components/admin";
import { categories, type Template } from "@/lib/validation";
export default async function TemplatesAdmin() {
  if (configIssue()) return null;
  await requireAdminPage();
  const { data, error } = await serviceClient()
    .from("templates")
    .select("*")
    .order("sort_order")
    .order("created_at");
  if (error) throw new Error("管理データを取得できませんでした。");
  return (
    <AdminShell title="テンプレート管理">
      <Link className="button primary" href="/admin/templates/new">
        新しいテンプレートを作成 ＋
      </Link>
      <p className="field-help">
        編集画面で表示順・公開状態を変更できます。過去の登録との関連を残すため、削除せず非公開にしてください。
      </p>
      <div className="admin-template-list">
        {(data as Template[]).map((t) => (
          <Link
            key={t.id}
            href={`/admin/templates/${t.id}`}
            className="admin-template-item"
          >
            <span
              className={`status-badge ${t.is_published ? "published" : ""}`}
            >
              {t.is_published ? "公開中" : "下書き"}
            </span>
            <div>
              <h2>{t.title}</h2>
              <p>
                {categories[t.category]} · 表示順 {t.sort_order}
              </p>
            </div>
            <span aria-hidden="true">編集 ↗</span>
          </Link>
        ))}
      </div>
      {!data.length && (
        <p className="empty-state">テンプレートがありません。</p>
      )}
    </AdminShell>
  );
}
