"use client";
/* eslint-disable @next/next/no-img-element -- 管理者指定の外部画像にも対応する。 */

import { useEffect, useRef, useState } from "react";

const demoSlugs = new Set([
  "runway-walk", "floating-product", "sunset-portrait", "cinematic-car",
  "neon-walk", "luxury-bottle", "dream-room", "outfit-switch",
  "orbit-object", "animal-adventure", "sports-moment",
]);

function motionSource(src: string) {
  const match = /^\/demo\/([a-z-]+)(-[23])?\.jpg$/.exec(src);
  return match && demoSlugs.has(match[1]) ? src.replace(/\.jpg$/, "-loop.mp4") : null;
}

export function MotionImage({ src, alt, className = "", eager = false, onError }: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
  onError?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const videoSrc = motionSource(src);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoSrc || failed) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let inView = false;
    const update = () => {
      if (inView && !document.hidden && !reducedMotion.matches) {
        void video.play().catch(() => video.pause());
      } else {
        video.pause();
      }
    };
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      update();
    }, { threshold: 0.05 });
    observer.observe(video);
    document.addEventListener("visibilitychange", update);
    reducedMotion.addEventListener("change", update);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", update);
      reducedMotion.removeEventListener("change", update);
      video.pause();
    };
  }, [videoSrc, failed]);

  if (!videoSrc || failed) {
    return <img className={className} src={src} alt={alt} loading={eager ? "eager" : "lazy"} decoding="async" onError={onError} />;
  }
  return (
    <video
      ref={videoRef}
      className={className}
      poster={src}
      muted
      loop
      playsInline
      preload="none"
      aria-label={alt || undefined}
      aria-hidden={alt ? undefined : true}
      onError={() => setFailed(true)}
    >
      <source src={videoSrc} type="video/mp4" />
      <img src={src} alt={alt} />
    </video>
  );
}
