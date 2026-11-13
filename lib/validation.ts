import { z } from "zod";
export const categories = {
  fashion: "ファッション",
  product: "商品紹介",
  lifestyle: "ライフスタイル",
  cinematic: "映画風",
  effects: "特殊効果",
  animals: "動物",
  sports: "スポーツ",
} as const;
export const categorySchema = z.enum([
  "fashion",
  "product",
  "lifestyle",
  "cinematic",
  "effects",
  "animals",
  "sports",
]);
export const aspectRatios = ["9:16", "1:1", "16:9", "4:5"] as const;
export const uuid = z.uuid();
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email({ error: "有効なメールアドレスを入力してください。" }));
export const utmKeys = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
] as const;
const utm = z
  .string()
  .max(100)
  .regex(/^[\p{L}\p{N} _.\-]*$/u)
  .optional();
export const waitlistSchema = z
  .strictObject({
    email: emailSchema,
    consent: z.literal(true),
    template_id: uuid.nullish(),
    source: z.enum(["hero", "footer", "template"]),
    website: z.string().max(200).optional(),
    utm_source: utm,
    utm_medium: utm,
    utm_campaign: utm,
    utm_content: utm,
  })
  .refine((v) => v.source !== "template" || !!v.template_id, {
    message: "テンプレートを選び直してください。",
    path: ["template_id"],
  });
export function validMedia(value: string) {
  if (
    /^\/demo\/[a-zA-Z0-9/_-]+\.(svg|png|jpe?g|webp|avif|mp4|webm)$/i.test(value)
  )
    return true;
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" &&
      !u.username &&
      !u.password &&
      !u.hash &&
      value.length <= 2048
    );
  } catch {
    return false;
  }
}
const mediaSchema = z
  .string()
  .max(2048)
  .refine(
    (v) => !v || validMedia(v),
    "HTTPSのURLか /demo/ 配下の素材パスを入力してください。",
  );
export const templateSchema = z
  .strictObject({
    slug: z
      .string()
      .min(1)
      .max(100)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        "URL名は半角英数字とハイフンで入力してください。",
      ),
    title: z.string().trim().min(1).max(80),
    description: z.string().trim().min(1).max(500),
    category: categorySchema,
    preview_url: mediaSchema,
    poster_url: mediaSchema,
    aspect_ratio: z.enum(aspectRatios),
    is_published: z.boolean(),
    sort_order: z.number().int().min(-100000).max(100000),
  })
  .refine((v) => !v.preview_url || !!v.poster_url, {
    path: ["poster_url"],
    message: "動画にはポスター画像も指定してください。",
  });
export const loginSchema = z.strictObject({
  email: emailSchema,
  password: z.string().min(1).max(128),
});
const dateSchema = z.iso.date().optional();
export const subscriberFiltersSchema = z
  .object({
    template: z.union([uuid, z.literal("")]).optional(),
    from: dateSchema,
    to: dateSchema,
    page: z.coerce.number().int().min(1).max(100000).default(1),
  })
  .refine(
    (v) => !v.from || !v.to || v.from <= v.to,
    "日付の範囲を確認してください。",
  );
export type Template = z.infer<typeof templateSchema> & {
  id: string;
  created_at: string;
  updated_at: string;
};
export type Subscriber = {
  id: string;
  email: string;
  template_id: string | null;
  source: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  consent_at: string;
  consent_version: string;
  created_at: string;
};
export type Filters = z.infer<typeof subscriberFiltersSchema>;
export type WaitlistInput = z.infer<typeof waitlistSchema>;
