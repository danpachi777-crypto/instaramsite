import "server-only";
import { z } from "zod";
export class ConfigurationError extends Error {}
export function isDemo() {
  return process.env.DEMO_MODE === "true";
}
export function siteUrl() {
  const result = z.url().safeParse(process.env.NEXT_PUBLIC_SITE_URL);
  if (!result.success)
    throw new ConfigurationError(
      "NEXT_PUBLIC_SITE_URL にサイトの正式URLを設定してください。",
    );
  const url = new URL(result.data);
  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash ||
    !["https:", "http:"].includes(url.protocol)
  )
    throw new ConfigurationError(
      "NEXT_PUBLIC_SITE_URL にはパスや認証情報を含まないURLを設定してください。",
    );
  if (
    process.env.NODE_ENV === "production" &&
    !isDemo() &&
    url.protocol !== "https:" &&
    !["localhost", "127.0.0.1"].includes(url.hostname)
  )
    throw new ConfigurationError(
      "公開サイトのURLにはHTTPSを設定してください。",
    );
  return url.origin;
}
export function publicEnv() {
  const parsed = z
    .object({ url: z.url(), key: z.string().min(20) })
    .safeParse({
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    });
  if (!parsed.success)
    throw new ConfigurationError(
      "NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を設定してください。",
    );
  return parsed.data;
}
export function serverEnv() {
  const pub = publicEnv();
  const result = z
    .object({
      serviceKey: z.string().min(20),
      hmacSecret: z.string().min(32),
      adminIds: z.array(z.uuid()).min(1),
    })
    .safeParse({
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      hmacSecret: process.env.RATE_LIMIT_HMAC_SECRET,
      adminIds: (process.env.ADMIN_USER_IDS ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  if (!result.success)
    throw new ConfigurationError(
      "SUPABASE_SERVICE_ROLE_KEY、32文字以上の RATE_LIMIT_HMAC_SECRET、管理者UUIDの ADMIN_USER_IDS を確認してください。",
    );
  siteUrl();
  return { ...pub, ...result.data };
}
export function configIssue() {
  try {
    if (
      process.env.DEMO_MODE &&
      !["true", "false"].includes(process.env.DEMO_MODE)
    )
      throw new ConfigurationError(
        "DEMO_MODE は true または false に設定してください。",
      );
    siteUrl();
    if (!isDemo()) serverEnv();
    return null;
  } catch (error) {
    return error instanceof ConfigurationError
      ? error.message
      : "設定を確認してください。";
  }
}
