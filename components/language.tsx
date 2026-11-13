"use client";

import { useEffect, useRef, useState } from "react";
import { isLanguageCode, languageEvent, languages, languageStorageKey, type LanguageCode } from "@/lib/languages";

function savedLanguage(): LanguageCode {
  try {
    const value = localStorage.getItem(languageStorageKey);
    return value && isLanguageCode(value) ? value : "ja";
  } catch {
    return "ja";
  }
}

export function LanguageSwitcher() {
  const [language, setLanguage] = useState<LanguageCode>("ja");
  const details = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const sync = () => setLanguage(savedLanguage());
    sync();
    window.addEventListener(languageEvent, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(languageEvent, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const choose = (code: LanguageCode) => {
    try { localStorage.setItem(languageStorageKey, code); } catch { /* Private browsing */ }
    setLanguage(code);
    if (details.current) details.current.open = false;
    window.dispatchEvent(new Event(languageEvent));
  };

  return (
    <details className="language-switcher" ref={details}>
      <summary aria-label="言語を選択">
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 4 6 4 9s-1 6-4 9c-3-3-4-6-4-9s1-6 4-9Z" />
        </svg>
        <span>Language</span>
        <span className="language-current" data-no-translate>{language.toUpperCase()}</span>
      </summary>
      <div className="language-options" role="group" aria-label="言語一覧">
        {languages.map(({ code, name }) => (
          <button key={code} type="button" lang={code} aria-pressed={language === code} onClick={() => choose(code)}>
            <span data-no-translate>{name}</span>
            {language === code && <span aria-hidden="true">✓</span>}
          </button>
        ))}
      </div>
    </details>
  );
}

type Target = { source: string; set: (value: string) => void };
const attributes = ["aria-label", "placeholder", "title", "alt"] as const;

export function SiteTranslator() {
  useEffect(() => {
    const originalText = new WeakMap<Text, string>();
    const renderedText = new WeakMap<Text, string>();
    const originalAttributes = new WeakMap<Element, Map<string, string>>();
    const renderedAttributes = new WeakMap<Element, Map<string, string>>();
    const cache = new Map<string, string>();
    let originalTitle = document.title;
    let renderedTitle = "";
    let language = savedLanguage();
    let timer: ReturnType<typeof setTimeout> | undefined;
    let generation = 0;
    let retries = 0;

    const translatable = (value: string) => /\p{L}/u.test(value) && !/^https?:\/\//.test(value) && !/[\w.+-]+@[\w.-]+/.test(value);
    const excluded = (element: Element | null) =>
      !!element?.closest("[data-no-translate], script, style, noscript, svg, textarea, code, pre");

    function collect(): Target[] {
      const targets: Target[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let current: Node | null;
      while ((current = walker.nextNode())) {
        const node = current as Text;
        if (excluded(node.parentElement)) continue;
        const actual = node.data;
        const previous = renderedText.get(node);
        if (!originalText.has(node) || (actual !== previous && actual !== originalText.get(node))) {
          originalText.set(node, actual);
        }
        const source = originalText.get(node)!;
        const trimmed = source.trim();
        if (!translatable(trimmed)) continue;
        targets.push({ source: trimmed, set(value) {
          const next = source.replace(trimmed, value);
          if (node.data !== next) node.data = next;
          renderedText.set(node, next);
        } });
      }

      for (const element of document.body.querySelectorAll("[aria-label], [placeholder], [title], [alt]")) {
        if (excluded(element)) continue;
        const originals = originalAttributes.get(element) ?? new Map<string, string>();
        const rendered = renderedAttributes.get(element) ?? new Map<string, string>();
        originalAttributes.set(element, originals);
        renderedAttributes.set(element, rendered);
        for (const attribute of attributes) {
          const actual = element.getAttribute(attribute);
          if (actual === null) continue;
          if (!originals.has(attribute) || (actual !== rendered.get(attribute) && actual !== originals.get(attribute))) {
            originals.set(attribute, actual);
          }
          const source = originals.get(attribute)!;
          if (!translatable(source)) continue;
          targets.push({ source, set(value) {
            if (element.getAttribute(attribute) !== value) element.setAttribute(attribute, value);
            rendered.set(attribute, value);
          } });
        }
      }

      const currentTitle = document.title;
      if (currentTitle !== renderedTitle && currentTitle !== originalTitle) originalTitle = currentTitle;
      if (translatable(originalTitle)) targets.push({ source: originalTitle, set(value) {
        if (document.title !== value) document.title = value;
        renderedTitle = value;
      } });
      return targets;
    }

    async function apply() {
      const run = ++generation;
      const targetLanguage = language;
      const targets = collect();
      const grouped = new Map<string, Target[]>();
      for (const target of targets) {
        const group = grouped.get(target.source) ?? [];
        group.push(target);
        grouped.set(target.source, group);
      }
      const missing: string[] = [];
      for (const [source, group] of grouped) {
        const translated = targetLanguage === "ja" ? source : cache.get(`${targetLanguage}\0${source}`);
        if (translated !== undefined) group.forEach((target) => target.set(translated));
        else {
          group.forEach((target) => target.set(source));
          missing.push(source);
        }
      }
      if (!missing.length) return;

      for (let offset = 0; offset < missing.length; offset += 100) {
        const batch = missing.slice(offset, offset + 100);
        try {
          const response = await fetch("/api/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ language: targetLanguage, texts: batch }),
          });
          if (!response.ok) throw new Error("Translation failed");
          const result: { translations?: (string | null)[] } = await response.json();
          if (!Array.isArray(result.translations) || result.translations.length !== batch.length) throw new Error("Invalid translations");
          if (run !== generation || targetLanguage !== language) return;
          let failed = false;
          batch.forEach((source, index) => {
            const translated = result.translations![index];
            if (typeof translated !== "string") { failed = true; return; }
            cache.set(`${targetLanguage}\0${source}`, translated);
            grouped.get(source)?.forEach((target) => target.set(translated));
          });
          if (failed && retries < 2) {
            retries++;
            timer = setTimeout(schedule, 2000 * retries);
          }
        } catch {
          // Keep the readable source text when the translation service is unavailable.
          if (retries < 2) {
            retries++;
            timer = setTimeout(schedule, 2000 * retries);
          }
          return;
        }
      }
    }

    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => { void apply(); }, 80);
    };
    const sync = () => {
      language = savedLanguage();
      retries = 0;
      document.documentElement.lang = language;
      document.documentElement.dir = ["ar", "ur", "fa"].includes(language) ? "rtl" : "ltr";
      schedule();
    };
    const observer = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => {
        if (mutation.type === "characterData") {
          const node = mutation.target as Text;
          return node.data !== renderedText.get(node);
        }
        if (mutation.type === "attributes") {
          const element = mutation.target as Element;
          const name = mutation.attributeName ?? "";
          return element.getAttribute(name) !== renderedAttributes.get(element)?.get(name);
        }
        return mutation.target !== document.head || document.title !== renderedTitle;
      })) schedule();
    });
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: [...attributes] });
    window.addEventListener(languageEvent, sync);
    window.addEventListener("storage", sync);
    sync();
    return () => {
      observer.disconnect();
      window.removeEventListener(languageEvent, sync);
      window.removeEventListener("storage", sync);
      clearTimeout(timer);
      generation++;
    };
  }, []);
  return null;
}
