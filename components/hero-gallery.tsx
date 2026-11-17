"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Template } from "@/lib/validation";
import { MotionImage } from "@/components/motion-image";

const groupSize = 12;
const variantIntervalMs = 4500;
const demoVariantSlugs = new Set([
  "runway-walk", "floating-product", "sunset-portrait", "cinematic-car",
  "neon-walk", "luxury-bottle", "dream-room", "outfit-switch",
  "orbit-object", "animal-adventure", "sports-moment",
]);

function imageUrls(template: Template) {
  const poster = template.poster_url;
  if (poster === `/demo/${template.slug}.jpg` && demoVariantSlugs.has(template.slug)) {
    return [poster, `/demo/${template.slug}-2.jpg`, `/demo/${template.slug}-3.jpg`];
  }
  return [poster, poster, poster];
}

export function HeroGallery({ templates }: { templates: Template[] }) {
  const [page, setPage] = useState(0);
  const [variant, setVariant] = useState(0);
  const [paused, setPaused] = useState(false);
  const pageCount = Math.ceil(templates.length / groupSize);

  useEffect(() => {
    if (paused) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;
    const timer = window.setInterval(() => {
      if (!document.hidden && !reducedMotion.matches) {
        setVariant((current) => (current + 1) % 3);
      }
    }, variantIntervalMs);
    return () => window.clearInterval(timer);
  }, [paused]);

  if (!templates.length) return null;
  const visible = templates.slice(page * groupSize, (page + 1) * groupSize);
  const change = (direction: number) => {
    setPage((current) => (current + direction + pageCount) % pageCount);
    setVariant(0);
  };

  return (
    <div
      className="gallery-stage"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="gallery-heading">
        <div>
          <span className="gallery-eyebrow">EXPLORE / MOTION</span>
          <h2 id="featured-heading">次の「つくりたい」を見つけよう。</h2>
          <p>ショート動画の比率で、スタイルを見比べよう。</p>
        </div>
        {pageCount > 1 && (
          <div className="gallery-controls" aria-label="テンプレートの切り替え">
            <span>{String(page + 1).padStart(2, "0")} / {String(pageCount).padStart(2, "0")}</span>
            <button type="button" onClick={() => change(-1)} aria-label="前の12件を見る">←</button>
            <button type="button" onClick={() => change(1)} aria-label="次の12件を見る">→</button>
          </div>
        )}
      </div>
      <div className="gallery-grid" key={page}>
        {Array.from({ length: groupSize }, (_, slot) => {
          const isExtra = !visible[slot];
          const template = visible[slot] ?? templates[(page * groupSize + slot) % templates.length];
          const src = imageUrls(template)[(variant + (isExtra ? 1 : 0)) % 3];
          return (
            <article className="gallery-reel-card" key={`${template.id}-${slot}`}>
              <Link className="gallery-reel-media" href={`/templates/${template.slug}`} aria-label={`${template.title}の詳細を見る`}>
                {src ? <MotionImage key={src} src={src} alt="" eager /> : <span className="gallery-reel-fallback" aria-hidden="true">M</span>}
              </Link>
            </article>
          );
        })}
      </div>
    </div>
  );
}
