"use client";

import { useId, type CSSProperties } from "react";
import phones from "./loading-phones.json";

/** Projected from the existing handset layout and the opening camera, not a new scene. */
export function PhoneLoading() {
  const id = useId().replaceAll(":", "");
  const mask = `phone-loading-mask-${id}`;
  const reflection = `phone-loading-reflection-${id}`;
  return (
    <svg className="phone-loading-art" viewBox="0 0 1280 800" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={reflection} x1="0" y1="0" x2="1" y2="0.35" gradientUnits="objectBoundingBox">
          <stop offset="0.36" stopColor="#dce4d0" stopOpacity="0" />
          <stop offset="0.48" stopColor="#dce4d0" stopOpacity="0.05" />
          <stop offset="0.5" stopColor="#e6eddd" stopOpacity="0.65" />
          <stop offset="0.56" stopColor="#dce4d0" stopOpacity="0.08" />
          <stop offset="0.68" stopColor="#dce4d0" stopOpacity="0" />
        </linearGradient>
        <mask id={mask} maskUnits="userSpaceOnUse" x="0" y="0" width="1280" height="800">
          {phones.map((phone, index) => <g key={index}>
            <path d={phone.glass} fill="white" fillOpacity={phone.opacity * 0.32} />
            <path d={phone.outline} stroke="white" strokeWidth="1" strokeOpacity={phone.opacity} />
          </g>)}
        </mask>
      </defs>
      <g stroke="#b6c4aa" strokeWidth="0.8" strokeLinejoin="round">
        {phones.map((phone, index) => <path
          key={index}
          d={phone.outline}
          pathLength="1"
          className="phone-loading-outline"
          style={{ "--stroke-delay": `${phone.delay}s`, "--stroke-opacity": phone.opacity } as CSSProperties}
        />)}
      </g>
      <g mask={`url(#${mask})`}>
        <rect className="phone-loading-reflection" x="0" y="0" width="1280" height="800" fill={`url(#${reflection})`} />
      </g>
    </svg>
  );
}
