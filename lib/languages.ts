// Widely spoken languages with translation support. Keep Japanese as the default.
export const languages = [
  { code: "ja", name: "日本語" },
  { code: "en", name: "English" },
  { code: "zh-CN", name: "简体中文" },
  { code: "hi", name: "हिन्दी" },
  { code: "es", name: "Español" },
  { code: "ar", name: "العربية" },
  { code: "fr", name: "Français" },
  { code: "bn", name: "বাংলা" },
  { code: "pt", name: "Português" },
  { code: "ru", name: "Русский" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "ur", name: "اردو" },
  { code: "de", name: "Deutsch" },
  { code: "mr", name: "मराठी" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "te", name: "తెలుగు" },
  { code: "ha", name: "Hausa" },
  { code: "tr", name: "Türkçe" },
  { code: "pa", name: "ਪੰਜਾਬੀ" },
  { code: "sw", name: "Kiswahili" },
  { code: "tl", name: "Filipino" },
  { code: "ta", name: "தமிழ்" },
  { code: "yue", name: "粵語" },
  { code: "fa", name: "فارسی" },
  { code: "ko", name: "한국어" },
  { code: "th", name: "ไทย" },
  { code: "jw", name: "Basa Jawa" },
  { code: "it", name: "Italiano" },
  { code: "gu", name: "ગુજરાતી" },
  { code: "pl", name: "Polski" },
] as const;

export type LanguageCode = (typeof languages)[number]["code"];
export const languageCodes = new Set<string>(languages.map(({ code }) => code));
export const languageStorageKey = "motion-language";
export const languageEvent = "motion-language-change";

export function isLanguageCode(value: string): value is LanguageCode {
  return languageCodes.has(value);
}
