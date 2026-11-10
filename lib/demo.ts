import type { Template } from "@/lib/validation";
const entries = [
  [
    "runway-walk",
    "ランウェイウォーク",
    "fashion",
    "一歩ごとに、視線を集める。コーディネートのシルエットや質感を印象的に見せるスタイル。",
  ],
  [
    "floating-product",
    "浮かぶ商品",
    "product",
    "重力から自由になった商品が、主役に。新商品やパッケージの紹介に。",
  ],
  [
    "sunset-portrait",
    "夕暮れのポートレート",
    "lifestyle",
    "夕暮れの光に包まれる、静かな一瞬。日常の記録や人物の紹介に。",
  ],
  [
    "cinematic-car",
    "映画風の車のお披露目",
    "cinematic",
    "光と影のコントラストで、存在感を引き出す。車やプロダクトのお披露目に。",
  ],
  [
    "neon-walk",
    "ネオン街を歩く",
    "cinematic",
    "街の灯りが、いつもの景色を物語に変える。夜の世界観を伝えるリールに。",
  ],
  [
    "luxury-bottle",
    "高級ボトルのお披露目",
    "product",
    "輪郭をなぞる光で、細部まで美しく。ボトルやコスメのコンセプト紹介に。",
  ],
  [
    "dream-room",
    "夢のような部屋",
    "lifestyle",
    "想像の中の部屋を、ひとつの世界に。インテリアや暮らしのイメージづくりに。",
  ],
  [
    "outfit-switch",
    "コーディネート切り替え",
    "fashion",
    "装いが変わる、その瞬間を印象的に。着こなしや季節のスタイリング紹介に。",
  ],
  [
    "orbit-object",
    "不思議な物体の回転",
    "effects",
    "見慣れた形に、意外な動きを。アートや抽象的な世界観の表現に。",
  ],
] as const;
// Separate fixtures, never a production fallback. Database seeds remain drafts.
export const demoTemplates: Template[] = entries.map(
  ([slug, title, category, description], i) => ({
    id: `00000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`,
    slug,
    title,
    category,
    description,
    preview_url: "",
    poster_url: `/demo/${slug}.svg`,
    aspect_ratio: "9:16",
    is_published: true,
    sort_order: i,
    created_at: "2026-11-10T00:00:00Z",
    updated_at: "2026-11-10T00:00:00Z",
  }),
);
