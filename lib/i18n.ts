import translations from "./locales.json";
import titles from "./idea-titles.json";
import forms from "./form-locales.json";
import boardTaglines from "./board-taglines.json";
export const languages = [
  ["ja", "日本語"], ["en", "English"], ["zh-CN", "简体中文"], ["zh-TW", "繁體中文"],
  ["ko", "한국어"], ["es", "Español"], ["fr", "Français"], ["de", "Deutsch"],
  ["pt", "Português"], ["it", "Italiano"], ["ru", "Русский"], ["ar", "العربية"],
  ["hi", "हिन्दी"], ["bn", "বাংলা"], ["id", "Bahasa Indonesia"], ["ms", "Bahasa Melayu"],
  ["th", "ไทย"], ["vi", "Tiếng Việt"], ["tr", "Türkçe"], ["fa", "فارسی"],
  ["ur", "اردو"], ["ta", "தமிழ்"], ["te", "తెలుగు"], ["mr", "मराठी"],
  ["sw", "Kiswahili"], ["nl", "Nederlands"], ["pl", "Polski"], ["uk", "Українська"],
  ["he", "עברית"], ["fil", "Filipino"],
] as const;
export type Locale = typeof languages[number][0];
export function boardTagline(locale: Locale) { return boardTaglines[locale]; }
export const messageKeys = [
  "home", "explore", "favorites", "language", "ideasHeading", "allIdeas", "viewIdeas", "ideasIntro",
  "details", "preparing", "all", "fashion", "product", "lifestyle", "cinematic", "effects",
  "favoriteHeading", "favoriteIntro", "emptyFavorites", "favoriteHint", "addFavorite", "removeFavorite", "saveError",
  "previous", "next", "carouselLabel", "hero", "chapter1", "chapter2", "chapter3", "globe1", "globe2", "skip",
  "earlyAccess", "earlyPreparing", "demoIntro", "unavailable", "earlyDescription", "how", "howHeading",
  "step1", "step2", "step3", "introFilm", "filmDescription", "footerTagline", "privacy", "terms", "contact", "information",
  "back", "catalogTitle", "catalogIntro", "results", "noResults", "clearFilter",
] as const;
export type MessageKey = typeof messageKeys[number];
export const formKeys = ["email", "required", "consent", "submit", "sending", "retry", "success", "error", "videoError", "unsupportedVideo"] as const;
export function formText(locale: Locale, key: typeof formKeys[number]) { return forms[locale].split("|")[formKeys.indexOf(key)]; }
export const localeMessages = Object.fromEntries(Object.entries(translations).map(([locale, messages]) => [locale, messages.split("|")])) as Record<Locale, string[]>;
export function normalizeLocale(value: string | null | undefined): Locale {
  return languages.some(([code]) => code === value) ? value as Locale : "ja";
}
export function isRtl(locale: Locale) { return ["ar", "fa", "ur", "he"].includes(locale); }
const ideaSlugs = ["runway-walk", "floating-product", "sunset-portrait", "cinematic-car", "neon-walk", "luxury-bottle", "dream-room", "outfit-switch", "orbit-object"];
export function ideaTitle(locale: Locale, slug: string, original: string) {
  const index = ideaSlugs.indexOf(slug);
  return index < 0 ? original : titles[locale].split("|")[index];
}
export function translate(locale: Locale, key: MessageKey, values: Record<string, string | number> = {}) {
  const pack = localeMessages[locale];
  const value = pack[messageKeys.indexOf(key)];
  return value.replace(/\{(\w+)\}/g, (_, name: string) => String(values[name] ?? ""));
}
