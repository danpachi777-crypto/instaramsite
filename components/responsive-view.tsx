"use client";
import { useSyncExternalStore, type ReactNode } from "react";
const media = "(min-width: 601px) and (any-pointer: fine), (min-width: 1200px)";
function subscribe(change: () => void) {
  const query = window.matchMedia(media);
  query.addEventListener("change", change);
  return () => query.removeEventListener("change", change);
}
export function ResponsiveView({ desktop, mobile }: { desktop: ReactNode; mobile: ReactNode }) {
  const isDesktop = useSyncExternalStore(subscribe, () => window.matchMedia(media).matches, () => false);
  return isDesktop ? desktop : mobile;
}
