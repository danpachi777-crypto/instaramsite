export const videoCategories = [
  { key: "fashion", label: "ファッション", icon: "👗", color: "#d76aa4" },
  { key: "product", label: "商品紹介", icon: "📦", color: "#e1994d" },
  { key: "lifestyle", label: "ライフスタイル", icon: "🧳", color: "#70b99b" },
  { key: "cinematic", label: "映画風", icon: "🎬", color: "#dc626c" },
  { key: "effects", label: "特殊効果", icon: "✨", color: "#8b65d5" },
  { key: "beauty", label: "美容", icon: "💄", color: "#da86b6" },
  { key: "food", label: "グルメ", icon: "🍜", color: "#df8654" },
  { key: "travel", label: "旅行", icon: "✈️", color: "#4b9dc1" },
  { key: "sports", label: "スポーツ", icon: "🏀", color: "#d17954" },
  { key: "animals", label: "動物", icon: "🦊", color: "#bc9d73" },
  { key: "pets", label: "ペット", icon: "🐾", color: "#bd9a74" },
  { key: "music", label: "音楽", icon: "🎵", color: "#a17bca" },
  { key: "gaming", label: "ゲーム", icon: "🎮", color: "#658bd1" },
  { key: "education", label: "学び", icon: "📚", color: "#7dba83" },
  { key: "anime", label: "アニメ風", icon: "🪄", color: "#bd79c9" },
  { key: "vlog", label: "日常Vlog", icon: "📱", color: "#7fa9a8" },
] as const;

export type VideoCategoryKey = (typeof videoCategories)[number]["key"];
