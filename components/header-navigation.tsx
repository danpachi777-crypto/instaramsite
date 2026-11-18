"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { LanguagePicker, useI18n } from "./i18n";
import { useFavorites } from "./use-favorites";
export function FavoriteCount() {
  const favorites = useFavorites();
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    const saved = (event: Event) => {
      if ((event as CustomEvent<{ added?: boolean }>).detail?.added) setPulse(value => value + 1);
    };
    window.addEventListener("motion:favorites", saved);
    return () => window.removeEventListener("motion:favorites", saved);
  }, []);
  return <span className="favorite-count-slot" aria-live="polite" aria-atomic="true">{favorites.length > 0 && <span key={pulse} className={`favorite-count${pulse ? " is-just-saved" : ""}`}>{favorites.length > 99 ? "99+" : favorites.length}</span>}</span>;
}
export function HeaderNavigation() {
  const path = usePathname();
  const { t } = useI18n();
  return <nav aria-label={t("explore")}>
    <Link href="/" aria-current={path === "/" ? "page" : undefined}>{t("home")}</Link>
    <Link href="/templates" aria-current={path.startsWith("/templates") ? "page" : undefined}>{t("explore")}</Link>
    <Link className="favorites-nav-link" href="/favorites" aria-current={path === "/favorites" ? "page" : undefined}>{t("favorites")}<FavoriteCount /></Link>
    <LanguagePicker />
  </nav>;
}
