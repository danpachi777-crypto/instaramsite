"use client";
import { useState, type PointerEvent } from "react";
import Link from "next/link";
import { Preview } from "./preview";
import { useI18n } from "./i18n";
import { favoritesKey, readFavorites } from "@/lib/favorites";
import type { Template } from "@/lib/validation";
import { ideaTitle } from "@/lib/i18n";
import { useFavorites, readFavoritesSnapshot } from "./use-favorites";
export { useFavorites } from "./use-favorites";
export function IdeaCard({ template, index = 0 }: { template: Template; index?: number }) {
  const { t, locale } = useI18n();
  const title = ideaTitle(locale, template.slug, template.title);
  const localized = { ...template, title };
  const saved = useFavorites().includes(template.slug);
  const [error, setError] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const toggle = () => {
    try {
      const existing = readFavorites(readFavoritesSnapshot());
      const updated = saved ? existing.filter(slug => slug !== template.slug) : [...existing, template.slug];
      localStorage.setItem(favoritesKey, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent("motion:favorites", { detail: { added: !saved, slug: template.slug } }));
      setCelebrating(!saved);
      setError(false);
    } catch { setError(true); }
  };
  const tilt = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const visual = event.currentTarget.querySelector(".idea-card-visual")?.getBoundingClientRect() ?? bounds;
    if (!bounds.width || !bounds.height || !visual.width || !visual.height) return;
    event.currentTarget.style.setProperty("--spotlight-x", `${Math.max(0, Math.min(100, (event.clientX - visual.left) / visual.width * 100))}%`);
    event.currentTarget.style.setProperty("--spotlight-y", `${Math.max(0, Math.min(100, (event.clientY - visual.top) / visual.height * 100))}%`);
    event.currentTarget.style.setProperty("--tilt-x", `${-(event.clientY - bounds.top - bounds.height / 2) / bounds.height * 4}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${(event.clientX - bounds.left - bounds.width / 2) / bounds.width * 5}deg`);
  };
  return <article className="template-card idea-card" onPointerMove={tilt} onPointerLeave={event => { event.currentTarget.style.setProperty("--tilt-x", "0deg"); event.currentTarget.style.setProperty("--tilt-y", "0deg"); }} onDragStart={event => event.preventDefault()}>
    <div className="idea-card-visual">
      {template.preview_url ? <Preview template={localized} /> : <Link href={`/templates/${template.slug}`} aria-label={`${title} — ${t("details")}`}><Preview template={localized} /></Link>}
      <button className={`favorite-button${celebrating ? " is-just-saved" : ""}`} type="button" aria-label={t(saved ? "removeFavorite" : "addFavorite")} aria-pressed={saved} onClick={toggle} onAnimationEnd={() => setCelebrating(false)}><svg viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg></button>
    </div>
    <div className="card-meta"><span>{t(template.category)}</span><span>{String(index + 1).padStart(2, "0")}</span></div>
    <h3><Link href={`/templates/${template.slug}`}>{title}</Link></h3>
    <Link className="card-link" href={`/templates/${template.slug}`}>{t("details")}</Link>
    {error && <p role="status" className="favorite-error">{t("saveError")}</p>}
  </article>;
}
