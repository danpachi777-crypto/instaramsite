"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
export function HeaderSurface() {
  const pathname = usePathname();
  useEffect(() => {
    const header = document.querySelector<HTMLElement>(".site-header");
    const update = () => { if (header) header.dataset.solid = String(pathname !== "/" || window.scrollY > 32); };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [pathname]);
  return null;
}
