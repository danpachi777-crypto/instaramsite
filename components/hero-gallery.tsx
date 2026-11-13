"use client";

import Link from "next/link";
import { useState } from "react";
import { Preview } from "@/components/preview";
import { categories, type Template } from "@/lib/validation";
import { FavoriteButton } from "@/components/favorite-button";

export function HeroGallery({ templates }: { templates: Template[] }) {
  const [index, setIndex] = useState(0);
  if (templates.length === 0) return null;

  const safeIndex = index % templates.length;
  const template = templates[safeIndex];
  const change = (direction: number) => {
    setIndex((safeIndex + direction + templates.length) % templates.length);
  };
  const controls = (className: string) =>
    templates.length > 1 && (
      <div className={className} aria-label="スタイルの切り替え">
        <button type="button" onClick={() => change(-1)} aria-label="前のスタイルを見る">←</button>
        <span aria-live="polite">{safeIndex + 1} / {templates.length}</span>
        <button type="button" onClick={() => change(1)} aria-label="次のスタイルを見る">→</button>
      </div>
    );

  return (
    <>
      <div className="mobile-spotlight">
        <Preview key={template.id} template={template} eager posterOnly />
        {controls("spotlight-controls")}
        <div className="mobile-spotlight-content">
          <span className="spotlight-kicker">PICK UP · {categories[template.category]}</span>
          <h2>{template.title}</h2>
          <p>{template.description}</p>
          <FavoriteButton slug={template.slug} title={template.title} />
          <Link href={`/templates/${template.slug}`}>
            このスタイルを見る <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
      <div className="hero-visual">
        <div className="visual-top">
          <span>次の「つくりたい」を見つけよう</span>
          <span aria-hidden="true">↗</span>
        </div>
        <div className="hero-carousel">
          <Preview key={template.id} template={template} eager />
          {controls("hero-carousel-controls")}
        </div>
        <div className="visual-bottom">
          <Link href={`/templates/${template.slug}`}>{template.title}を見る ↗</Link>
          <FavoriteButton slug={template.slug} title={template.title} />
          <span className="visual-index">M / {String(safeIndex + 1).padStart(2, "0")}</span>
        </div>
      </div>
    </>
  );
}
