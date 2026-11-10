import { configIssue, isDemo } from "@/lib/env";
import { LoginForm } from "@/components/admin-forms";
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  if (configIssue()) return null;
  const { reason } = await searchParams;
  return (
    <main className="container narrow section">
      <span className="eyebrow">運営管理</span>
      <h1>管理者ログイン</h1>
      {isDemo() ? (
        <p className="notice">デモ表示中は管理画面を利用できません。</p>
      ) : (
        <>
          <p>事前に登録した管理者のアカウントでログインしてください。</p>
          {reason === "forbidden" && (
            <p className="notice">このアカウントには管理者権限がありません。</p>
          )}
          <LoginForm />
        </>
      )}
    </main>
  );
}
