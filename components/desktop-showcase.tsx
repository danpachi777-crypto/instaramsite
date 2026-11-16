"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const clips = [
  { name: "opening", title: "スタイルの誕生" },
  { name: "world", title: "立体の世界へ" },
  { name: "connection", title: "表現がつながる" },
  { name: "next", title: "次の一本へ" },
];
export function DesktopShowcase() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(
      "(min-width: 601px) and (any-pointer: fine), (min-width: 1200px)",
    );
    const update = () => setVisible(query.matches);
    const frame = requestAnimationFrame(update);
    query.addEventListener("change", update);
    return () => {
      cancelAnimationFrame(frame);
      query.removeEventListener("change", update);
    };
  }, []);
  if (!visible) return null;
  return (
    <section className="desktop-showcase" aria-label="MOTIONの映像">
      <div className="desktop-showcase-grid">
        {clips.map((clip, index) => (
          <figure key={clip.name}>
            <video
              controls
              playsInline
              muted
              loop
              preload="none"
              poster={`/motion/previews/${clip.name}.webp`}
              aria-label={clip.title}
            >
              <source
                src={`/motion/previews/${clip.name}.webm`}
                type="video/webm"
              />
              映像を再生するには、動画に対応したブラウザをご利用ください。
            </video>
            <figcaption>
              <span>{clip.title}</span>
              <span>0{index + 1} / MOTION</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <Link href="/templates" className="desktop-showcase-link">
        すべてのテンプレート +
      </Link>
    </section>
  );
}

export function DesktopExplainFilm() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const query = matchMedia(
      "(min-width: 601px) and (any-pointer: fine), (min-width: 1200px)",
    );
    const frame = requestAnimationFrame(() => setVisible(query.matches));
    const update = () => setVisible(query.matches);
    query.addEventListener("change", update);
    return () => {
      cancelAnimationFrame(frame);
      query.removeEventListener("change", update);
    };
  }, []);
  if (!visible) return null;
  return (
    <section className="desktop-explain-film" aria-label="MOTIONの世界">
      <video
        controls
        muted
        playsInline
        loop
        preload="none"
        poster="/motion/previews/world.webp"
        aria-label="MOTIONの3Dビジュアル"
      >
        <source src="/motion/previews/world.webm" type="video/webm" />
      </video>
      <Link href="/templates" className="desktop-reference-button">
        スタイルの世界を見る +
      </Link>
    </section>
  );
}
