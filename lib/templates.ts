import "server-only";
import { createClient } from "@supabase/supabase-js";
import { isDemo, publicEnv, serverEnv } from "@/lib/env";
import { demoTemplates } from "@/lib/demo";
import type { Template } from "@/lib/validation";
function publicDb() {
  serverEnv();
  const env = publicEnv();
  return createClient(env.url, env.key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}
function normalize(t: Template): Template {
  return {
    ...t,
    preview_url: t.preview_url ?? "",
    poster_url: t.poster_url ?? "",
  };
}
export async function getPublicTemplates(): Promise<Template[]> {
  if (isDemo()) return demoTemplates;
  const { data, error } = await publicDb()
    .from("templates")
    .select("*")
    .eq("is_published", true)
    .order("sort_order")
    .order("created_at");
  if (error)
    throw new Error(
      "テンプレートを読み込めませんでした。時間をおいて再度お試しください。",
    );
  return (data ?? []).map((t) => normalize(t as Template));
}
export async function getPublicTemplate(
  slug: string,
): Promise<Template | undefined> {
  if (isDemo()) return demoTemplates.find((t) => t.slug === slug);
  const { data, error } = await publicDb()
    .from("templates")
    .select("*")
    .eq("is_published", true)
    .eq("slug", slug)
    .maybeSingle();
  if (error)
    throw new Error(
      "テンプレートを読み込めませんでした。時間をおいて再度お試しください。",
    );
  return data ? normalize(data as Template) : undefined;
}
