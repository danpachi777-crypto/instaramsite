import { requireAdminPage } from "@/lib/auth";
import { configIssue } from "@/lib/env";
import { AdminShell } from "@/components/admin";
import { TemplateForm } from "@/components/admin-forms";
export default async function NewTemplate() {
  if (configIssue()) return null;
  await requireAdminPage();
  return (
    <AdminShell title="テンプレートを作成">
      <TemplateForm />
    </AdminShell>
  );
}
