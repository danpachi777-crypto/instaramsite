"use client";

import { saveFavorites, useFavorites } from "@/components/favorite-store";

export function FavoriteButton({ slug, title }: { slug: string; title: string }) {
  const { ready, slugs } = useFavorites();
  const saved = slugs.includes(slug);
  return (
    <button
      type="button"
      className={`favorite-button${saved ? " is-saved" : ""}`}
      aria-label={`${title}をお気に入り${saved ? "から外す" : "に登録する"}`}
      aria-pressed={saved}
      disabled={!ready}
      onClick={() => saveFavorites(saved ? slugs.filter((item) => item !== slug) : [...slugs, slug])}
    >
      <span aria-hidden="true">{saved ? "♥" : "♡"}</span>
      <span>{saved ? "保存済み" : "お気に入り"}</span>
    </button>
  );
}
