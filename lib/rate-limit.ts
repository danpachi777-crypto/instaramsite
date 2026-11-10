import "server-only";
import { createHmac } from "node:crypto";
import { isIP } from "node:net";
import { serverEnv } from "@/lib/env";
import { serviceClient } from "@/lib/supabase/service";
import { HttpError } from "@/lib/http";
export function rateIdentifier(
  headers: Headers,
  secret: string,
  options: { vercel: boolean; development: boolean; now: number },
  scope = "waitlist",
) {
  // Vercel overwrites this header at its edge. Never use arbitrary X-Forwarded-For.
  const ip = options.vercel
    ? headers.get("x-vercel-forwarded-for")?.trim()
    : options.development
      ? "127.0.0.1"
      : undefined;
  if (!ip || !isIP(ip))
    throw new HttpError(
      503,
      "受付の保護設定を確認中です。時間をおいてお試しください。",
    );
  const window = Math.floor(options.now / 900000);
  return `${scope}:${createHmac("sha256", secret).update(`${scope}:${window}:${ip}`).digest("hex")}`;
}
export async function consumeRate(request: Request, scope = "waitlist") {
  const key = rateIdentifier(
    request.headers,
    serverEnv().hmacSecret,
    {
      vercel: process.env.VERCEL === "1",
      development: process.env.NODE_ENV === "development",
      now: Date.now(),
    },
    scope,
  );
  const { data, error } = await serviceClient().rpc("consume_rate_limit", {
    p_key: key,
    p_limit: scope === "login" ? 10 : 5,
  });
  if (error || typeof data !== "boolean")
    throw new HttpError(
      503,
      "ただいま受付できません。時間をおいてお試しください。",
    );
  if (!data)
    throw new HttpError(
      429,
      "送信回数が多くなっています。15分ほど待ってからお試しください。",
    );
}
