import "server-only";
import { redirect } from "next/navigation";
import { authClient } from "@/lib/supabase/server";
import { serverEnv, isDemo } from "@/lib/env";
import { AccessError, assertAdmin } from "@/lib/access";
export async function requireAdmin() {
  if (isDemo()) throw new AccessError(403);
  const client = await authClient();
  const { data, error } = await client.auth.getUser();
  return assertAdmin(error ? null : data.user, serverEnv().adminIds);
}
export async function requireAdminPage() {
  try {
    return await requireAdmin();
  } catch (error) {
    if (error instanceof AccessError)
      redirect(
        `/admin/login?reason=${error.status === 403 ? "forbidden" : "login"}`,
      );
    throw error;
  }
}
