import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  subscriberFiltersSchema,
  type Filters,
  type Subscriber,
} from "@/lib/validation";
import { HttpError } from "@/lib/http";
export const PAGE_SIZE = 25;
export const EXPORT_LIMIT = 10000;
export function parseFilters(
  params: Record<string, string | string[] | undefined>,
) {
  const clean = Object.fromEntries(
    Object.entries(params).map(([key, value]) => [
      key,
      value === "" ? undefined : value,
    ]),
  );
  const result = subscriberFiltersSchema.safeParse(clean);
  if (!result.success)
    throw new HttpError(400, "絞り込み条件と日付を確認してください。");
  return result.data;
}
export function subscriberQuery(
  db: SupabaseClient,
  filters: Filters,
  head = false,
) {
  let query = db.from("subscribers").select("*", { count: "exact", head });
  if (filters.template) query = query.eq("template_id", filters.template);
  // Form dates are interpreted in Japan Standard Time, end-exclusive next day.
  if (filters.from)
    query = query.gte(
      "created_at",
      new Date(`${filters.from}T00:00:00+09:00`).toISOString(),
    );
  if (filters.to)
    query = query.lt(
      "created_at",
      new Date(
        new Date(`${filters.to}T00:00:00+09:00`).getTime() + 86400000,
      ).toISOString(),
    );
  return query
    .order("created_at", { ascending: false })
    .order("id", { ascending: false });
}
export async function getSubscriberPage(db: SupabaseClient, filters: Filters) {
  const start = (filters.page - 1) * PAGE_SIZE;
  const { data, error, count } = await subscriberQuery(db, filters).range(
    start,
    start + PAGE_SIZE - 1,
  );
  if (error) throw new Error("登録者一覧を取得できませんでした。");
  return { rows: (data ?? []) as Subscriber[], count: count ?? 0 };
}
