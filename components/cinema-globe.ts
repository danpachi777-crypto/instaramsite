import * as THREE from "three";
import { createGlassPhone } from "./glass-phone";
import land from "../public/motion/cinema/earth-points.json";
import { clamp01, ease } from "./cinema-timeline";

function geographic(longitude: number, latitude: number, radius: number) {
  const lon = THREE.MathUtils.degToRad(longitude);
  const lat = THREE.MathUtils.degToRad(latitude);
  return new THREE.Vector3(Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)).multiplyScalar(radius);
}

export function createCinemaGlobe(z: number) {
  const group = new THREE.Group();
  group.position.set(0, 5, z);
  const earth = new THREE.Group();
  earth.name = "cinema-earth";
  earth.position.set(1.5, 1.2, -4);
  group.add(earth);
  const radius = 4.7;
  const globeMaterial = new THREE.MeshBasicMaterial({ color: "#111c10", transparent: true, fog: false });
  earth.add(new THREE.Mesh(new THREE.SphereGeometry(radius, 56, 40), globeMaterial));
  const landMaterial = new THREE.PointsMaterial({ color: "#afc9b3", size: 0.058, transparent: true, opacity: 0.72, sizeAttenuation: true });
  const landGeometry = new THREE.BufferGeometry().setFromPoints(land.map(([lon, lat]) => geographic(lon, lat, radius + 0.025)));
  earth.add(new THREE.Points(landGeometry, landMaterial));
  const gridMaterial = new THREE.LineBasicMaterial({ color: "#738f99", transparent: true, opacity: 0.15 });
  for (let lat = -60; lat <= 60; lat += 30) {
    const points = Array.from({ length: 129 }, (_, i) => geographic(i / 128 * 360, lat, radius + 0.015));
    earth.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMaterial));
  }
  for (let lon = 0; lon < 180; lon += 30) {
    const points = Array.from({ length: 129 }, (_, i) => {
      const angle = i / 128 * Math.PI * 2;
      return new THREE.Vector3(Math.sin(angle) * Math.sin(THREE.MathUtils.degToRad(lon)), Math.cos(angle), Math.sin(angle) * Math.cos(THREE.MathUtils.degToRad(lon))).multiplyScalar(radius + 0.015);
    });
    earth.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), gridMaterial));
  }
  const source = geographic(139.7, 35.7, 1).normalize();
  const identity = new THREE.Quaternion();
  const pathCount = 200;
  const routes = Array.from({ length: pathCount }, (_, index) => {
    const [lon, lat] = land[(index * 137 + 29) % land.length];
    const target = geographic(lon, lat, 1).normalize();
    const rotation = new THREE.Quaternion().setFromUnitVectors(source, target);
    const angle = source.angleTo(target);
    const points = Array.from({ length: 49 }, (_, step) => {
      const t = step / 48;
      return source.clone().applyQuaternion(identity.clone().slerp(rotation, t))
        .multiplyScalar(radius + 0.08 + Math.sin(Math.PI * t) * (0.5 + angle * 0.65));
    });
    const material = new THREE.LineBasicMaterial({ color: index % 5 ? "#8cb7b1" : "#c4d5a5", transparent: true, opacity: 0, depthWrite: false });
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
    line.name = `world-route-${index}`;
    earth.add(line);
    return { points, line, material, delay: (index % 17) / 17 * 0.4 };
  });
  const packets = new THREE.InstancedMesh(new THREE.SphereGeometry(0.033, 5, 4), new THREE.MeshBasicMaterial({ color: "#e1ead6", transparent: true }), pathCount);
  packets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  packets.frustumCulled = false;
  earth.add(packets);
  const dummy = new THREE.Object3D();
  const phoneModel = createGlassPhone();
  const phone = phoneModel.group;
  phone.name = "outbound-phone";
  group.add(phone);
  const flight = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.8, -3.8, 6), new THREE.Vector3(-3.5, -0.5, 5),
    new THREE.Vector3(-3, 3.4, 4), new THREE.Vector3(-0.2, 5.7, 2),
    new THREE.Vector3(1.5, 4.25, -0.1),
  ]);
  const flightMaterial = new THREE.LineBasicMaterial({ color: "#b4d4b6", transparent: true, opacity: 0 });
  const flightLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(flight.getPoints(96)), flightMaterial);
  group.add(flightLine);
  return {
    group,
    update(progress: number, time: number, reduced: boolean) {
      group.visible = progress > 0;
      if (!group.visible) return;
      const reveal = ease(progress / 0.2);
      globeMaterial.opacity = reveal;
      landMaterial.opacity = reveal * 0.72;
      gridMaterial.opacity = reveal * 0.15;
      // Keep Japan facing the viewer while the network reaches both hemispheres.
      earth.rotation.y = -2.438 + (reduced ? 0 : Math.sin(time * 0.1) * 0.18);
      const flightProgress = ease(progress / 0.58);
      phone.position.copy(flight.getPoint(flightProgress));
      phone.rotation.set(0.08, -0.22 + flightProgress * 0.6, -0.12 - Math.sin(flightProgress * Math.PI) * 0.55);
      const dissolve = ease((progress - 0.43) / 0.2);
      phone.visible = dissolve < 0.999;
      phoneModel.fade(1 - dissolve);
      phone.scale.setScalar(1.55 * (1 - dissolve * 0.4));
      flightLine.geometry.setDrawRange(0, Math.max(0, Math.floor(flightProgress * 97)));
      flightMaterial.opacity = 0.38 * ease(progress / 0.12);
      const network = clamp01((progress - 0.47) / 0.5);
      routes.forEach((route, index) => {
        const reach = ease((network - route.delay) / 0.55);
        route.line.geometry.setDrawRange(0, Math.floor(reach * route.points.length));
        route.material.opacity = reach > 0 ? 0.27 : 0;
        const packetAt = reduced ? reach : Math.min(reach, (time * 0.13 + index * 0.037) % 1);
        dummy.position.copy(route.points[Math.min(48, Math.floor(packetAt * 48))]);
        dummy.scale.setScalar(reach > 0.01 && packetAt > 0.01 ? 1 : 0.001);
        dummy.updateMatrix();
        packets.setMatrixAt(index, dummy.matrix);
      });
      packets.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      group.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Line || object instanceof THREE.Points) {
          geometries.add(object.geometry);
          const all = Array.isArray(object.material) ? object.material : [object.material];
          all.forEach(material => materials.add(material));
        }
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      group.removeFromParent();
    },
  };
}
