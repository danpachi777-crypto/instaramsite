import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/service";
import { siteUrl } from "@/lib/env";
import { assertOrigin, readJson, json, apiError, HttpError } from "@/lib/http";
import { uuid, emailSchema } from "@/lib/validation";
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertOrigin(request, siteUrl());
    await requireAdmin();
    const id = uuid.safeParse((await context.params).id);
    const parsed = z
      .strictObject({ email: emailSchema, confirm: z.literal(true) })
      .safeParse(await readJson(request));
    if (!id.success || !parsed.success)
      throw new HttpError(400, "削除対象と確認欄を確認してください。");
    const { data, error } = await serviceClient()
      .from("subscribers")
      .delete()
      .eq("id", id.data)
      .eq("email", parsed.data.email)
      .select("id");
    if (error) throw error;
    if (!data?.length)
      throw new HttpError(
        404,
        "対象が見つかりません。画面を更新してください。",
      );
    return json({ message: "登録情報を削除しました。" });
  } catch (error) {
    return apiError(error);
  }
}
