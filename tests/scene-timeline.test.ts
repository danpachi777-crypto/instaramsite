import { describe, expect, it } from "vitest";
import { chapterAnchors, sceneChapter, scenePanel, sceneProgress, screenStops } from "@/components/scene-timeline";
describe("readable city screenings", () => {
  it("holds each original camera position for at least 1.8 viewports with one matching chapter", () => {
    for (let index = 1; index <= 3; index++) {
      for (const offset of [0, 0.6, 1.2, 1.79]) {
        const height = chapterAnchors[index] + offset;
        expect(sceneProgress(height)).toBeCloseTo(screenStops[index], 8);
        expect(scenePanel(height)).toBe(index);
        expect(sceneChapter(height)).toBe(index);
      }
    }
  });
  it("travels monotonically, hides chapter numbers in travel, and reaches the globe", () => {
    let previous = 0;
    for (let height = 0; height <= 17; height += 0.025) {
      const progress = sceneProgress(height);
      expect(progress).toBeGreaterThanOrEqual(previous);
      expect(progress).toBeLessThanOrEqual(1);
      previous = progress;
    }
    expect(scenePanel(5)).toBe(-1);
    expect(scenePanel(8.5)).toBe(-1);
    expect(sceneChapter(14.6)).toBe(4);
    expect(sceneProgress(14.6)).toBe(1);
  });
});
