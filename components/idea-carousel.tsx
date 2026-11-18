"use client";
import { useEffect, useRef, useState } from "react";
import { IdeaCard } from "./idea-card";
import { useI18n } from "./i18n";
import type { Template } from "@/lib/validation";
export function IdeaCarousel({ templates }: { templates: Template[] }) {
  const { t } = useI18n();
  const track = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  const [position, setPosition] = useState({ progress: 0, fraction: 1, first: 1, last: templates.length });
  const drag = useRef({ active: false, moved: false, x: 0, scroll: 0 });
  useEffect(() => {
    const element = track.current;
    if (!element) return;
    let frame = 0;
    const measure = () => {
      const distance = Math.max(0, element.scrollWidth - element.clientWidth);
      const left = Math.max(0, Math.min(distance, element.scrollLeft));
      const firstCard = element.firstElementChild as HTMLElement | null;
      const gap = parseFloat(getComputedStyle(element).columnGap) || 24;
      const step = (firstCard?.offsetWidth ?? 0) + gap;
      const first = distance > 0 && step > gap ? Math.min(templates.length, Math.floor((left + 1) / step) + 1) : 1;
      const last = distance > 0 && step > gap ? Math.min(templates.length, Math.ceil((left + element.clientWidth - 16) / step)) : templates.length;
      setPosition({ progress: distance ? left / distance : 0, fraction: element.scrollWidth ? Math.min(1, element.clientWidth / element.scrollWidth) : 1, first, last: Math.max(first, last) });
    };
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    element.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const resize = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    resize?.observe(element);
    if (element.firstElementChild) resize?.observe(element.firstElementChild);
    schedule();
    return () => { cancelAnimationFrame(frame); element.removeEventListener("scroll", schedule); window.removeEventListener("resize", schedule); resize?.disconnect(); };
  }, [templates.length]);
  useEffect(() => {
    const element = shell.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setEntered(true); observer.disconnect(); }
    }, { threshold: 0.08 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const move = (direction: number) => track.current?.scrollBy({ left: direction * track.current.clientWidth * 0.8, behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
  return <div ref={shell} className="idea-carousel-shell" data-entered={entered}>
    <div className="idea-carousel-controls"><button type="button" aria-label={t("previous")} disabled={position.progress <= 0} onClick={() => move(-1)}>‹</button><button type="button" aria-label={t("next")} disabled={position.fraction >= 1 || position.progress >= 0.999} onClick={() => move(1)}>›</button></div>
    <div ref={track} className="idea-carousel" role="region" aria-label={t("carouselLabel")} tabIndex={0} dir="ltr"
      onKeyDown={event => { if (event.target !== event.currentTarget) return; if (event.key === "ArrowRight" || event.key === "ArrowLeft") { event.preventDefault(); move(event.key === "ArrowRight" ? 1 : -1); } }}
      onPointerDown={event => {
        drag.current.moved = false;
        if (event.pointerType !== "mouse" || event.button !== 0 || (event.target as HTMLElement).closest("button,video,input,select")) return;
        drag.current = { active: true, moved: false, x: event.clientX, scroll: event.currentTarget.scrollLeft };
      }}
      onPointerMove={event => {
        if (!drag.current.active) return;
        const delta = event.clientX - drag.current.x;
        if (Math.abs(delta) > 6) { drag.current.moved = true; event.currentTarget.setPointerCapture(event.pointerId); }
        if (drag.current.moved) { event.preventDefault(); event.currentTarget.dataset.dragging = "true"; event.currentTarget.scrollLeft = drag.current.scroll - delta; }
      }}
      onPointerUp={event => { drag.current.active = false; event.currentTarget.dataset.dragging = "false"; }}
      onPointerCancel={event => { drag.current.active = false; drag.current.moved = false; event.currentTarget.dataset.dragging = "false"; }}
      onLostPointerCapture={event => { drag.current.active = false; event.currentTarget.dataset.dragging = "false"; }}
      onClickCapture={event => { if (drag.current.moved) { event.preventDefault(); event.stopPropagation(); drag.current.moved = false; } }}>
      {templates.map((template, index) => <IdeaCard key={template.id} template={template} index={index} />)}
    </div>
    <div className="idea-carousel-position" dir="ltr">
      <div className="idea-carousel-progress" role="progressbar" aria-label={t("carouselLabel")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(position.progress * 100)} aria-valuetext={`${position.first}–${position.last} / ${templates.length}`}>
        <span style={{ width: `${position.fraction * 100}%`, left: `${position.progress * (1 - position.fraction) * 100}%` }} />
      </div>
      <span className="idea-carousel-range" aria-hidden="true">{String(position.first).padStart(2, "0")}–{String(position.last).padStart(2, "0")} <span>/ {String(templates.length).padStart(2, "0")}</span></span>
    </div>
  </div>;
}
