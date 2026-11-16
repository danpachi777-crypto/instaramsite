export type CinemaWork = {
  id: string;
  title: string;
  previewUrl?: string;
  posterUrl?: string;
  href?: string;
};

export const plannedScreenCount = 3;
export const screeningStart = 0.12;
export const screeningEnd = 0.72;
export const finaleStart = 0.78;

export function clamp01(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function ease(value: number) {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

/** The camera pauses at each screen, then travels forward to the next one. */
export function cinemaTimeline(progress: number, count: number) {
  const p = clamp01(progress);
  const screens = Math.max(1, count);
  const screening = clamp01((p - screeningStart) / (screeningEnd - screeningStart));
  const cursor = Math.min(screens - 0.00001, screening * screens);
  const index = Math.min(screens - 1, Math.floor(cursor));
  const local = cursor - index;
  const travel = index + (index < screens - 1 ? ease((local - 0.6) / 0.4) : 0);
  return {
    progress: p,
    screening,
    index,
    travel,
    phase: p < screeningStart ? "opening" : p < finaleStart ? "screening" : "world",
    finale: clamp01((p - finaleStart) / (1 - finaleStart)),
  } as const;
}

/** Stable outward routes; no handset ever travels back into the centre. */
export function phoneSpread(center: readonly number[], index: number, amount: number) {
  const delay = (index % 11) * 0.014;
  const t = clamp01((amount - delay) / (1 - delay));
  const length = Math.hypot(center[0], center[1], center[2]);
  const direction = length > 0.001
    ? center.map(value => value / length)
    : [Math.cos(index * 2.399963), Math.sin(index * 2.399963), 0];
  const distance = t * t * (48 + (index % 9) * 3);
  return [
    center[0] + direction[0] * distance,
    center[1] + direction[1] * distance,
    center[2] + direction[2] * distance,
  ] as const;
}
