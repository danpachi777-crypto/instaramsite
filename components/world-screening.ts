import * as THREE from "three";
import { createCinemaScreen } from "./cinema-screen";
import { createCinemaGlobe } from "./cinema-globe";
import { clamp01, ease } from "./cinema-timeline";
import { screenStops } from "./scene-timeline";

/** Projection surfaces travel with the original city camera; the city is untouched. */
export function createWorldScreening(root: THREE.Object3D) {
  const panels = screenStops.map((_, index) => createCinemaScreen(index));
  panels.forEach(panel => root.add(panel.group));
  const finale = createCinemaGlobe(0);
  finale.group.scale.setScalar(1.35);
  root.add(finale.group);
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  return {
    update(progress: number, time: number, spread: number, camera: THREE.PerspectiveCamera) {
      forward.set(0, 0, -1).applyQuaternion(camera.quaternion);
      right.set(1, 0, 0).applyQuaternion(camera.quaternion);
      up.set(0, 1, 0).applyQuaternion(camera.quaternion);
      panels.forEach((panel, index) => {
        const distance = Math.abs(progress - screenStops[index]);
        const presence = index === 0
          ? ease((spread - 0.86) / 0.14) * (1 - ease(progress / 0.1))
          : ease((0.095 - distance) / 0.045) * (1 - ease((progress - 0.755) / 0.035));
        const side = index === 2 ? -1 : 1;
        const local = progress - screenStops[index];
        const arrival = reduced ? 1 : ease((local + 0.095) / 0.055);
        const departure = reduced ? 0 : ease((local - 0.045) / 0.05);
        const movement = 1 - arrival + departure;
        const halfWidth = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 13 * camera.aspect;
        const fittedScale = Math.min(0.62, halfWidth * 0.44 / 7.23);
        panel.group.position.copy(camera.position)
          .addScaledVector(forward, index === 0 ? 15 : 13 + movement * 4.5)
          .addScaledVector(right, index === 0 ? 0 : side * (halfWidth * 0.48 + movement * 2.3))
          .addScaledVector(up, index === 0 ? 0.5 : 0.2 - (1 - arrival) * 0.9 + departure * 0.55);
        panel.group.quaternion.copy(camera.quaternion);
        if (index !== 0) {
          panel.group.rotateY(side * (-0.08 - (1 - arrival) * 0.3 + departure * 0.22));
          panel.group.rotateX((1 - arrival) * 0.045);
          panel.group.rotateZ(side * (-(1 - arrival) * 0.04 + departure * 0.025));
        }
        panel.group.scale.setScalar(index === 0
          ? 0.76 * (0.97 + presence * 0.03)
          : fittedScale * (0.92 + arrival * 0.08) * (1 - departure * 0.04));
        panel.update(presence, presence > 0.8 && !reduced);
      });
      const ending = clamp01((progress - 0.76) / 0.23);
      finale.group.position.copy(camera.position)
        .addScaledVector(forward, 23)
        .addScaledVector(right, -2.5)
        .addScaledVector(up, -0.5);
      finale.group.quaternion.copy(camera.quaternion);
      finale.update(ending, reduced ? 0 : time, reduced);
    },
    dispose() {
      panels.forEach(panel => panel.dispose());
      finale.dispose();
    },
  };
}
