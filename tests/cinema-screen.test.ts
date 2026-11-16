import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as THREE from "three";
import { createCinemaScreen } from "../components/cinema-screen";

beforeEach(() => {
  const context = {
    createRadialGradient: () => ({ addColorStop() {} }),
    fillRect() {}, fillText() {},
  };
  vi.stubGlobal("document", {
    createElement: () => ({ width: 0, height: 0, getContext: () => context }),
  });
});
afterEach(() => vi.unstubAllGlobals());

describe("integrated cinema display", () => {
  it("has a solid rear shell and a recessed picture that is not hidden behind the shell", () => {
    const display = createCinemaScreen(1);
    display.group.position.set(0, 0, 0);
    display.group.updateMatrixWorld(true);
    const chassis = display.group.getObjectByName("display-chassis") as THREE.Mesh;
    const bezel = display.group.getObjectByName("display-bezel") as THREE.Mesh;
    const projection = display.group.getObjectByName("display-projection") as THREE.Mesh;
    const shellBounds = new THREE.Box3().setFromObject(chassis);
    const bezelBounds = new THREE.Box3().setFromObject(bezel);
    expect(shellBounds.max.z - shellBounds.min.z).toBeGreaterThan(0.5);
    expect(projection.position.z).toBeGreaterThan(shellBounds.max.z);
    expect(projection.position.z).toBeLessThan(bezelBounds.min.z);
    const centreRay = new THREE.Raycaster(new THREE.Vector3(0, 0, 3), new THREE.Vector3(0, 0, -1));
    expect(centreRay.intersectObject(bezel)).toHaveLength(0);
    const hits = centreRay.intersectObjects(display.group.children);
    expect(hits[0].object).toBe(projection);
    display.dispose();
  });

  it("fades the whole enclosure together with the projected image", () => {
    const display = createCinemaScreen(0);
    display.update(0.4, false);
    expect(display.group.visible).toBe(true);
    display.group.traverse(object => {
      if (object instanceof THREE.Mesh) {
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach(material => expect(material.opacity).toBeCloseTo(0.4));
      }
    });
    display.update(0, false);
    expect(display.group.visible).toBe(false);
    display.dispose();
  });
});
