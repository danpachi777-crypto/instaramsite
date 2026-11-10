import { isDemo, siteUrl } from "@/lib/env";
import { assertOrigin, apiError, HttpError } from "@/lib/http";
import { registerWaitlist } from "@/lib/waitlist";
import { consumeRate } from "@/lib/rate-limit";
import { serviceClient } from "@/lib/supabase/service";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    if (isDemo())
      throw new HttpError(503, "デモ表示中：メール登録は利用できません");
    assertOrigin(request, siteUrl());
    return await registerWaitlist(request, {
      limit: () => consumeRate(request),
      now: () => new Date(),
      async save(input) {
        // Atomic publication check + insert, duplicate conflict does nothing.
        const { error } = await serviceClient().rpc("register_subscriber", {
          p_data: input,
        });
        if (error?.code === "22023")
          throw new HttpError(
            400,
            "選択したテンプレートは受付していません。一覧から選び直してください。",
          );
        if (error) throw new Error("保存できませんでした。");
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
