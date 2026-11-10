"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cleanAttribution, type Attribution } from "@/lib/utm";
let memory: Attribution = {};
const key = "motion-first-attribution-v1";
export function getAttribution(): Attribution {
  try {
    const stored = sessionStorage.getItem(key);
    if (stored)
      return cleanAttribution(new URLSearchParams(JSON.parse(stored)));
  } catch {
    /* Storage may be disabled by an in-app browser. */
  }
  return memory;
}
export function AttributionCapture() {
  const pathname = usePathname();
  const search = useSearchParams();
  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    if (Object.keys(getAttribution()).length) return;
    const value = cleanAttribution(new URLSearchParams(search.toString()));
    if (!Object.keys(value).length) return;
    memory = value;
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* Keep in module memory. */
    }
  }, [pathname, search]);
  return null;
}
