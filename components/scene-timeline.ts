// Original camera path, with shorter travel and explicit readable holds (svh).
export const chapterAnchors = [0, 2.6, 6, 9.4, 14.6];
export const screenStops = [0, 0.20465599, 0.451908, 0.70932404];
const keyframes = [
  [0, 0], [0.6, 0.018],
  [2.6, screenStops[1]], [4.4, screenStops[1]],
  [6, screenStops[2]], [7.8, screenStops[2]],
  [9.4, screenStops[3]], [11.2, screenStops[3]],
  [14.6, 1], [16, 1],
];
export function sceneProgress(viewports: number) {
  const y = Math.max(0, viewports);
  for (let i = 0; i < keyframes.length - 1; i++) {
    const [start, before] = keyframes[i];
    const [end, after] = keyframes[i + 1];
    if (y <= end) {
      const t = (y - start) / (end - start);
      const eased = t * t * (3 - 2 * t);
      return before + (after - before) * eased;
    }
  }
  return 1;
}
export function scenePanel(viewports: number) {
  if (viewports < 0.7) return 0;
  if (viewports >= 2.4 && viewports <= 4.5) return 1;
  if (viewports >= 5.8 && viewports <= 7.9) return 2;
  if (viewports >= 9.2 && viewports <= 11.3) return 3;
  return -1;
}
export function sceneChapter(viewports: number) {
  return [0, 2.4, 5.8, 9.2, 12.4].reduce((current, start, index) => viewports >= start ? index : current, 0);
}
