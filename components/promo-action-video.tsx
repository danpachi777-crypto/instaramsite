"use client";

import { useEffect, useRef } from "react";

export function PromoActionVideo({ kind = "bmx" }: { kind?: "bmx" | "car" }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const isCar = kind === "car";

  useEffect(() => {
    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePlayback = () => {
      const video = videoRef.current;
      if (!video) return;
      video.playbackRate = isCar ? 1.5 : 2.5;
      if (motionPreference.matches) {
        video.pause();
      } else {
        void video.play().catch(() => {
          // The poster stays visible if the browser blocks autoplay.
        });
      }
    };

    updatePlayback();
    motionPreference.addEventListener("change", updatePlayback);
    return () => motionPreference.removeEventListener("change", updatePlayback);
  }, [isCar]);

  return (
    <video
      ref={videoRef}
      className={isCar ? "stock-promo-car-video" : "stock-promo-video"}
      autoPlay={isCar}
      muted
      loop
      playsInline
      preload="metadata"
      poster={isCar ? "/demo/car-chase-action-poster.jpg" : "/demo/action-bmx-poster.jpg"}
      aria-hidden="true"
      tabIndex={-1}
    >
      <source src={isCar ? "/demo/car-chase-action.mp4" : "/demo/action-bmx.mp4"} type="video/mp4" />
    </video>
  );
}
