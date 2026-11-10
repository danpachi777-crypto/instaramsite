import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/auth";
import { configIssue } from "@/lib/env";
import { serviceClient } from "@/lib/supabase/service";
import { AdminShell } from "@/components/admin";
import { TemplateForm } from "@/components/admin-forms";
import { uuid } from "@/lib/validation";
export default async function EditTemplate({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (configIssue()) return null;
  await requireAdminPage();
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const { data, error } = await serviceClient()
    .from("templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("管理データを取得できませんでした。");
  if (!data) notFound();
  return (
    <AdminShell title="テンプレートを編集">
      <TemplateForm
        template={{
          ...data,
          preview_url: data.preview_url ?? "",
          poster_url: data.poster_url ?? "",
        }}
      />
    </AdminShell>
  );
}
