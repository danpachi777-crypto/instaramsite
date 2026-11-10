import Link from "next/link";
import { LogoutButton } from "@/components/admin-forms";
export function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="container section admin">
      <div className="admin-top">
        <div>
          <span className="eyebrow">運営管理</span>
          <h1>{title}</h1>
        </div>
        <LogoutButton />
      </div>
      <nav className="admin-nav" aria-label="管理メニュー">
        <Link href="/admin">概要</Link>
        <Link href="/admin/templates">テンプレート</Link>
        <Link href="/admin/subscribers">登録者</Link>
      </nav>
      {children}
    </main>
  );
}
export function formatDate(date: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tokyo",
  }).format(new Date(date));
}
