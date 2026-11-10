import { requireAdmin } from "@/lib/auth";
import { serviceClient } from "@/lib/supabase/service";
import { parseFilters, EXPORT_LIMIT } from "@/lib/subscribers";
import { apiError, HttpError } from "@/lib/http";
import { csvRow } from "@/lib/csv";
import type { Subscriber } from "@/lib/validation";
export async function GET(request: Request) {
  try {
    await requireAdmin();
    const filters = parseFilters(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    // One SQL statement gives a consistent snapshot, regardless of API row limits.
    const { data, error } = await serviceClient().rpc("export_subscribers", {
      p_template: filters.template || null,
      p_from: filters.from
        ? new Date(`${filters.from}T00:00:00+09:00`).toISOString()
        : null,
      p_until: filters.to
        ? new Date(
            new Date(`${filters.to}T00:00:00+09:00`).getTime() + 86400000,
          ).toISOString()
        : null,
    });
    if (error || !Array.isArray(data))
      throw new Error("CSVを取得できませんでした。");
    if (data.length > EXPORT_LIMIT)
      throw new HttpError(
        400,
        "CSVは一度に10,000件までです。登録日で範囲を絞ってください。",
      );
    const rows = [
      "\uFEFF" +
        csvRow([
          "メールアドレス",
          "テンプレートID",
          "登録場所",
          "流入元",
          "流入種別",
          "キャンペーン",
          "コンテンツ",
          "同意日時",
          "同意の版",
          "登録日時",
        ]),
    ];
    for (const s of data as Subscriber[])
      rows.push(
        csvRow([
          s.email,
          s.template_id,
          s.source,
          s.utm_source,
          s.utm_medium,
          s.utm_campaign,
          s.utm_content,
          s.consent_at,
          s.consent_version,
          s.created_at,
        ]),
      );
    return new Response(rows.join(""), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="motion-subscribers.csv"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
