import { describe, expect, it } from "vitest";
import phoneLayout from "../public/motion/world/phone-layout.json";
import { cinemaTimeline, phoneSpread, screeningStart, screeningEnd } from "../components/cinema-timeline";

describe("cinema journey", () => {
  it("holds each screen for reading before travelling continuously to the next", () => {
    const count = 3;
    const span = (screeningEnd - screeningStart) / count;
    for (let index = 0; index < count; index++) {
      expect(cinemaTimeline(screeningStart + (index + 0.15) * span, count).travel).toBeCloseTo(index);
      expect(cinemaTimeline(screeningStart + (index + 0.55) * span, count).travel).toBeCloseTo(index);
    }
    let previous = -1;
    for (let p = 0; p <= 1; p += 0.001) {
      const current = cinemaTimeline(p, count);
      expect(current.travel).toBeGreaterThanOrEqual(previous);
      expect(current.travel).toBeLessThanOrEqual(2);
      if (previous >= 0) expect(current.travel - previous).toBeLessThan(0.03);
      previous = current.travel;
    }
  });

  it("starts in the opening, ends at the world, and supports one or no configured works", () => {
    for (const count of [0, 1, 3, 6]) {
      expect(cinemaTimeline(-2, count).phase).toBe("opening");
      const ending = cinemaTimeline(2, count);
      expect(ending.phase).toBe("world");
      expect(ending.finale).toBe(1);
      expect(ending.index).toBe(Math.max(1, count) - 1);
      expect(Number.isFinite(ending.travel)).toBe(true);
    }
  });

  it("retains the handset circle and sends every handset outward without converging", () => {
    phoneLayout.forEach((phone, index) => {
      expect(phoneSpread(phone.center, index, 0)).toEqual(phone.center);
      let previous = Math.hypot(...phone.center);
      for (let step = 1; step <= 20; step++) {
        const position = phoneSpread(phone.center, index, step / 20);
        const distance = Math.hypot(...position);
        expect(distance).toBeGreaterThanOrEqual(previous - 0.000001);
        previous = distance;
      }
      expect(previous).toBeGreaterThan(40);
    });
  });
});
