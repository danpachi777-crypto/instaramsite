import { requireAdmin } from "@/lib/auth";
import { authClient } from "@/lib/supabase/server";
import { siteUrl } from "@/lib/env";
import { assertOrigin, apiError, json } from "@/lib/http";
export async function POST(request: Request) {
  try {
    assertOrigin(request, siteUrl());
    await requireAdmin();
    const { error } = await (await authClient()).auth.signOut();
    if (error) throw error;
    return json({ redirect: "/admin/login" });
  } catch (error) {
    return apiError(error);
  }
}
