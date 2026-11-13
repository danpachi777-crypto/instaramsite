"use client";

import { useSyncExternalStore } from "react";

const key = "motion:favorites:v1";
const changed = "motion:favorites-changed";

function snapshot(): string {
  try {
    return window.localStorage.getItem(key) ?? "[]";
  } catch {
    return "[]";
  }
}

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(changed, listener);
  return () => {
    window.removeEventListener("storage", listener);
    window.removeEventListener(changed, listener);
  };
}

export function useFavorites() {
  const value = useSyncExternalStore(subscribe, snapshot, () => null);
  if (value === null) return { ready: false, slugs: [] as string[] };
  try {
    const parsed: unknown = JSON.parse(value);
    return {
      ready: true,
      slugs: Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [],
    };
  } catch {
    return { ready: true, slugs: [] as string[] };
  }
}

export function saveFavorites(slugs: string[]) {
  try {
    window.localStorage.setItem(key, JSON.stringify(slugs));
    window.dispatchEvent(new Event(changed));
  } catch {
    // Storage can be unavailable in private or restricted browsing modes.
  }
}
