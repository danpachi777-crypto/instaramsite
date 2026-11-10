import "server-only";
import { requireAdmin } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/service";
import { assertOrigin, readJson, HttpError, json } from "@/lib/http";
import { siteUrl } from "@/lib/env";
import { templateSchema, uuid } from "@/lib/validation";
import { revalidatePath } from "next/cache";
export async function saveTemplate(request: Request, id?: string) {
  assertOrigin(request, siteUrl());
  await requireAdmin();
  if (id && !uuid.safeParse(id).success)
    throw new HttpError(400, "対象を確認してください。");
  const input = templateSchema.safeParse(await readJson(request, 8192));
  if (!input.success)
    throw new HttpError(
      400,
      input.error.issues[0]?.message ?? "入力内容を確認してください。",
    );
  const db = serviceClient();
  let oldSlug: string | undefined;
  if (id) {
    const { data, error } = await db
      .from("templates")
      .select("slug")
      .eq("id", id)
      .single();
    if (error || !data)
      throw new HttpError(404, "テンプレートが見つかりません。");
    oldSlug = data.slug;
  }
  const value = {
    ...input.data,
    preview_url: input.data.preview_url || null,
    poster_url: input.data.poster_url || null,
  };
  const result = id
    ? await db
        .from("templates")
        .update(value)
        .eq("id", id)
        .select("id")
        .single()
    : await db.from("templates").insert(value).select("id").single();
  if (result.error?.code === "23505")
    throw new HttpError(
      409,
      "このURL名は使われています。別の名前を指定してください。",
    );
  if (result.error) throw result.error;
  revalidatePath("/");
  revalidatePath("/templates");
  revalidatePath(`/templates/${input.data.slug}`);
  if (oldSlug) revalidatePath(`/templates/${oldSlug}`);
  revalidatePath("/admin/templates");
  return json({ redirect: "/admin/templates" });
}
