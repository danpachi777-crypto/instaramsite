import { readFileSync, writeFileSync } from "node:fs";
import * as THREE from "three";

// Match the existing 3D opening at the end of the loading overlay's fade.
const phones = JSON.parse(readFileSync(new URL("../public/motion/world/phone-layout.json", import.meta.url), "utf8"));
const layout = JSON.parse(readFileSync(new URL("../public/motion/world/layout.json", import.meta.url), "utf8"));
const elapsed = 0.85;
const smooth = value => {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};
const entered = smooth((elapsed - 0.5) / 2.2);
const entrance = 1 - Math.pow(1 - elapsed / 3, 5);
const camera = new THREE.PerspectiveCamera(45, 1280 / 800, 1, 500);
camera.filmGauge = 100;
camera.setFocalLength(80);
camera.position.fromArray(layout.paths.cam[0][0]);
camera.lookAt(new THREE.Vector3().fromArray(layout.paths.tgt[0][0]));
camera.translateY(5 * (1 - entrance));
camera.translateZ(15 * (1 - entrance));
camera.position.x += Math.sin(elapsed * 0.21) * 0.026;
camera.position.y += Math.sin(elapsed * 0.17 + 1.2) * 0.02;
camera.updateMatrixWorld(true);
const ring = new THREE.Object3D();
ring.position.set(0, 6.632504, 1.147684);
ring.scale.setScalar(0.8 + entered * 0.2);
ring.rotation.z = elapsed * 0.065;
ring.rotation.y = Math.sin(elapsed * 0.21) * 0.12;
ring.updateMatrixWorld(true);

function outline(width, height, radius) {
  const shape = new THREE.Shape(), x = -width / 2, y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape.getPoints(4);
}
const frame = outline(1.36, 2.7, 0.18);
const glass = outline(1.19, 2.51, 0.12);
const data = phones.map((phone, index) => {
  const pose = new THREE.Object3D();
  pose.position.fromArray(phone.center).multiplyScalar(0.75 + entered * 0.25);
  pose.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3().fromArray(phone.normal).normalize());
  pose.rotateZ(Math.sin(index * 2.399963) * 0.35 + elapsed * 0.02);
  pose.scale.setScalar(phone.size / 2.7);
  pose.updateMatrixWorld(true);
  const matrix = new THREE.Matrix4().multiplyMatrices(ring.matrixWorld, pose.matrixWorld);
  const path = points => points.map((point, vertex) => {
    const p = new THREE.Vector3(point.x, point.y, 0.1).applyMatrix4(matrix).project(camera);
    return `${vertex ? "L" : "M"}${((p.x + 1) * 640).toFixed(2)},${((1 - p.y) * 400).toFixed(2)}`;
  }).join("") + "Z";
  const position = new THREE.Vector3().setFromMatrixPosition(matrix);
  const direction = new THREE.Vector3(0, 0, 1).applyQuaternion(pose.quaternion);
  const facing = Math.max(0, direction.dot(camera.position.clone().sub(position).normalize()));
  return {
    outline: path(frame), glass: path(glass),
    opacity: +(0.1 + facing * 0.62).toFixed(3),
    delay: +(((index * 37) % phones.length) / phones.length * 0.7).toFixed(3),
  };
});
writeFileSync(new URL("../components/loading-phones.json", import.meta.url), JSON.stringify(data));
console.log(`Generated ${data.length} handset outlines for the loading screen.`);
