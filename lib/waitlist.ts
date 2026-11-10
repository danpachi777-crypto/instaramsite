import { waitlistSchema, type WaitlistInput } from "@/lib/validation";
import { HttpError, readJson, json } from "@/lib/http";
export const CONSENT_VERSION = "2026-11-10-v1";
export const SUCCESS_MESSAGE =
  "ありがとうございます。お申し込みを受け付けました。ご案内できる情報が整い次第、お知らせします。";
export type Registration = Omit<WaitlistInput, "consent" | "website"> & {
  consent_at: string;
  created_at: string;
  consent_version: string;
};
export type WaitlistDependencies = {
  limit: () => Promise<void>;
  save: (value: Registration) => Promise<void>;
  now: () => Date;
};
export async function registerWaitlist(
  request: Request,
  dependencies: WaitlistDependencies,
) {
  const parsed = waitlistSchema.safeParse(await readJson(request));
  if (!parsed.success)
    throw new HttpError(
      400,
      "メールアドレス、同意欄、選択したテンプレートを確認してください。",
    );
  await dependencies.limit();
  if (parsed.data.website)
    throw new HttpError(400, "入力内容を確認して、もう一度お試しください。");
  const { consent: _consent, website: _website, ...input } = parsed.data;
  void _consent;
  void _website;
  const now = dependencies.now().toISOString();
  await dependencies.save({
    ...input,
    template_id: input.template_id ?? null,
    consent_at: now,
    created_at: now,
    consent_version: CONSENT_VERSION,
  });
  return json({ message: SUCCESS_MESSAGE });
}
