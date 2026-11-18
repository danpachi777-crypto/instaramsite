"use client";
import Link from "next/link";
import { IdeaCard, useFavorites } from "./idea-card";
import { useI18n } from "./i18n";
import type { Template } from "@/lib/validation";
import { boardTagline } from "@/lib/i18n";
export function FavoritesHeading() {
  const { t, locale } = useI18n();
  return <div className="favorites-board-heading"><h1>{t("favoriteHeading")}</h1><p className="section-intro">{boardTagline(locale)}</p><p className="favorites-storage-note">{t("favoriteIntro")}</p></div>;
}
export function FavoritesGallery({ templates }: { templates: Template[] }) {
  const favorites = useFavorites();
  const { t } = useI18n();
  const saved = templates.filter(template => favorites.includes(template.slug));
  return <><div className="favorites-board-summary"><span className="board-count">{t("results", { count: saved.length })}</span><Link href="/templates">{t("explore")} <span aria-hidden="true">↗</span></Link></div>{saved.length ? <div className="template-grid favorites-grid">{saved.map((template, index) => <IdeaCard key={template.id} template={template} index={index} />)}</div> : <div className="empty-state"><h2>{t("emptyFavorites")}</h2><p>{t("favoriteHint")}</p><Link className="button primary" href="/templates">{t("explore")}</Link></div>}</>;
}
