import { authClient } from "@/lib/supabase/server";
import { isDemo, serverEnv, siteUrl } from "@/lib/env";
import { assertOrigin, readJson, apiError, json, HttpError } from "@/lib/http";
import { loginSchema } from "@/lib/validation";
import { assertAdmin } from "@/lib/access";
import { consumeRate } from "@/lib/rate-limit";
export async function POST(request: Request) {
  try {
    if (isDemo())
      throw new HttpError(403, "デモ表示中は管理画面を利用できません。");
    assertOrigin(request, siteUrl());
    const parsed = loginSchema.safeParse(await readJson(request));
    if (!parsed.success)
      throw new HttpError(
        400,
        "メールアドレスとパスワードを確認してください。",
      );
    await consumeRate(request, "login");
    const client = await authClient();
    const { error } = await client.auth.signInWithPassword(parsed.data);
    if (error)
      throw new HttpError(
        401,
        "ログインできませんでした。入力内容を確認してください。",
      );
    const { data, error: verifyError } = await client.auth.getUser();
    try {
      assertAdmin(verifyError ? null : data.user, serverEnv().adminIds);
    } catch {
      await client.auth.signOut();
      throw new HttpError(403, "このアカウントには管理者権限がありません。");
    }
    return json({ redirect: "/admin" });
  } catch (error) {
    return apiError(error);
  }
}
