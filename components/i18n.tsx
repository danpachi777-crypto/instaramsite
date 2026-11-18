"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { ideaTitle, isRtl, languages, normalizeLocale, translate, type Locale, type MessageKey } from "@/lib/i18n";
const LanguageContext = createContext({ locale: "ja" as Locale, setLocale: (_locale: Locale) => {} });
export function LanguageProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setLocale] = useState(initialLocale);
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtl(locale) ? "rtl" : "ltr";
    window.dispatchEvent(new CustomEvent("motion:language", { detail: locale }));
  }, [locale]);
  return <LanguageContext.Provider value={{ locale, setLocale: next => {
    document.cookie = `motion-language=${encodeURIComponent(next)}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
    setLocale(next);
  } }}>{children}</LanguageContext.Provider>;
}
export function useI18n() {
  const context = useContext(LanguageContext);
  return { ...context, t: (key: MessageKey, values?: Record<string, string | number>) => translate(context.locale, key, values) };
}
export function T({ k, values }: { k: MessageKey; values?: Record<string, string | number> }) { return useI18n().t(k, values); }
export function IdeasHeading() {
  const { locale, t } = useI18n();
  const text = t("ideasHeading");
  const start = locale === "ja" ? text.indexOf("ヒント") : -1;
  if (start < 0) return text;
  return <>{text.slice(0, start)}<span className="ideas-heading-hint">ヒント</span>{text.slice(start + "ヒント".length)}</>;
}
export function IdeaName({ slug, original }: { slug: string; original: string }) { return ideaTitle(useI18n().locale, slug, original); }
export function LanguagePicker() {
  const { locale, setLocale, t } = useI18n();
  return <label className="language-picker"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="12" cy="12" r="9" /><ellipse cx="12" cy="12" rx="4" ry="9" /><path d="M3 12h18" /></svg>
    <span className="sr-only">{t("language")}</span><select aria-label={t("language")} value={locale} onChange={event => setLocale(normalizeLocale(event.target.value))}>
      {languages.map(([code, label]) => <option key={code} value={code} lang={code}>{label}</option>)}
    </select>
  </label>;
}
