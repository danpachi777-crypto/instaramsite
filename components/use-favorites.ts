"use client";
import { useMemo, useSyncExternalStore } from "react";
import { favoritesKey, readFavorites } from "@/lib/favorites";

const emptySnapshot = () => "[]";
export function readFavoritesSnapshot() {
  try { return localStorage.getItem(favoritesKey) || "[]"; } catch { return "[]"; }
}
function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener("motion:favorites", listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener("motion:favorites", listener);
  };
}
export function useFavorites() {
  const raw = useSyncExternalStore(subscribe, readFavoritesSnapshot, emptySnapshot);
  return useMemo(() => readFavorites(raw), [raw]);
}
