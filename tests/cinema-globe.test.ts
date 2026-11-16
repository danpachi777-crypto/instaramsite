import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { createCinemaGlobe } from "../components/cinema-globe";

describe("worldwide delivery finale", () => {
  it("launches a handset and hands off to complete routes around the globe", () => {
    const finale = createCinemaGlobe(-100);
    const phone = finale.group.getObjectByName("outbound-phone")!;
    const routes: THREE.Line[] = [];
    finale.group.traverse(object => {
      if (object instanceof THREE.Line && object.name.startsWith("world-route-")) routes.push(object);
    });
    expect(routes.length).toBe(200);
    finale.update(0.2, 4, false);
    expect(phone.visible).toBe(true);
    const launchHeight = phone.position.y;
    finale.update(0.4, 6, false);
    expect(phone.position.y).toBeGreaterThan(launchHeight);
    finale.update(1, 10, false);
    expect(phone.visible).toBe(false);
    const destinations = new Set<string>();
    for (const route of routes) {
      const positions = route.geometry.getAttribute("position");
      expect(route.geometry.drawRange.count).toBe(positions.count);
      const endpoint = new THREE.Vector3().fromBufferAttribute(positions, positions.count - 1);
      destinations.add(endpoint.toArray().map(n => n.toFixed(2)).join(","));
      for (let index = 0; index < positions.count; index++) {
        const point = new THREE.Vector3().fromBufferAttribute(positions, index);
        expect(Number.isFinite(point.length())).toBe(true);
        expect(point.length()).toBeGreaterThan(4.7);
      }
    }
    expect(destinations.size).toBeGreaterThan(190);
    finale.dispose();
  });
});
