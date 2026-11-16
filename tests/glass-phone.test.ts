import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createGlassPhone } from "../components/glass-phone";

describe("semi-transparent phone", () => {
  it("leaves the centre of the metal frame open and uses transmissive glass", () => {
    const phone = createGlassPhone();
    const bezel = phone.group.getObjectByName("metal-bezel")!;
    phone.group.updateMatrixWorld(true);
    const ray = new THREE.Raycaster(new THREE.Vector3(0, 0, 2), new THREE.Vector3(0, 0, -1));
    expect(ray.intersectObject(bezel)).toHaveLength(0);
    expect(phone.materials.some(material => material.transmission > 0.5 && material.opacity < 0.5)).toBe(true);
    const opacity = phone.materials.map(material => material.opacity);
    phone.fade(0);
    expect(phone.materials.every(material => material.opacity === 0)).toBe(true);
    phone.fade(1);
    expect(phone.materials.map(material => material.opacity)).toEqual(opacity);
    phone.group.traverse(object => {
      if (object instanceof THREE.Mesh) object.geometry.dispose();
    });
    phone.materials.forEach(material => material.dispose());
  });
});
