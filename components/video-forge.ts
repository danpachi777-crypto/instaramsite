import * as THREE from "three";
import { createMiniMedallion } from "./scene-medallion";

const smooth = (value: number) => {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

export function createVideoForge(matcap: THREE.Texture) {
  const placement = new THREE.Group();
  placement.position.set(-6.6, 80.2, 0.4);
  placement.rotation.y = 0.785;
  const group = new THREE.Group();
  group.position.set(0.85, 1, 0);
  group.scale.setScalar(0.8);
  placement.add(group);
  const metal = new THREE.MeshMatcapMaterial({ matcap, color: "#8b9b70" });
  const cube = new THREE.BoxGeometry();
  const addBox = (
    parent: THREE.Object3D,
    x: number,
    y: number,
    z: number,
    sx: number,
    sy: number,
    sz: number,
  ) => {
    const mesh = new THREE.Mesh(cube, metal);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    parent.add(mesh);
    return mesh;
  };
  const curveLine = (curve: THREE.Curve<THREE.Vector3>) => {
    group.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(curve.getPoints(32)),
        new THREE.LineBasicMaterial({
          color: "#b4cb86",
          transparent: true,
          opacity: 0.18,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      ),
    );
  };
  const lanes = [3.06, 2.3, 1.54, 0.78].map((y, lane) => {
    const z = -0.62 + lane * 0.44;
    const curve = new THREE.CurvePath<THREE.Vector3>();
    curve.add(
      new THREE.LineCurve3(
        new THREE.Vector3(-6, y, z),
        new THREE.Vector3(-4.2, y, z),
      ),
    );
    curve.add(
      new THREE.QuadraticBezierCurve3(
        new THREE.Vector3(-4.2, y, z),
        new THREE.Vector3(-2.5, 0.55 * y, 0.45 * z),
        new THREE.Vector3(-0.72, -0.36, 0),
      ),
    );
    curveLine(curve);
    const coins = Array.from({ length: 3 }, () => {
      const coin = createMiniMedallion(matcap, lane === 2);
      group.add(coin);
      return coin;
    });
    return { curve, coins, speed: [0.055, 0.06, 0.07, 0.08][lane] };
  });
  const inlet = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(-2.72, -1.48, 0.34),
    new THREE.Vector3(-1.18, -1.45, 0.52),
    new THREE.Vector3(-0.25, -0.58, 0.12),
  );
  const outlet = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(0.72, -0.36, 0.04),
    new THREE.Vector3(2.25, 0.66, 0.16),
    new THREE.Vector3(4.32, 0.58, 0.18),
  );
  curveLine(inlet);
  curveLine(outlet);
  const work = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.12, 0.12, 0.12),
    new THREE.MeshBasicMaterial({
      color: "#bfda8d",
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    18,
  );
  work.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  work.frustumCulled = false;
  group.add(work);
  const output = Array.from({ length: 6 }, () => {
    const coin = createMiniMedallion(matcap);
    group.add(coin);
    return coin;
  });
  addBox(group, 0, -1.2, 0, 1.82, 0.18, 1.12);
  addBox(group, 0, -1.47, 0, 0.62, 0.42, 0.62);
  addBox(group, 0, -1.7, 0, 1.34, 0.12, 0.92);
  const forge = new THREE.Group();
  forge.position.y = -0.43;
  group.add(forge);
  const glassMaterial = new THREE.MeshBasicMaterial({
    color: "#a1c568",
    transparent: true,
    opacity: 0.2,
    depthWrite: false,
  });
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(1.35, 1.35, 1.35),
    glassMaterial,
  );
  forge.add(glass);
  forge.add(
    new THREE.LineSegments(
      new THREE.EdgesGeometry(glass.geometry),
      new THREE.LineBasicMaterial({
        color: "#c1de8f",
        transparent: true,
        opacity: 0.75,
      }),
    ),
  );
  const points: THREE.Vector3[] = [];
  for (let x = -1; x <= 1; x++)
    for (let y = -1; y <= 1; y++)
      for (let z = -1; z <= 1; z++)
        if (x || y || z)
          points.push(new THREE.Vector3(x, y, z).multiplyScalar(1.15 / 3));
  const core = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.18, 0.18, 0.18),
    new THREE.MeshBasicMaterial(),
    points.length,
  );
  const dummy = new THREE.Object3D(),
    color = new THREE.Color();
  points.forEach((point, i) => {
    dummy.position.copy(point);
    dummy.updateMatrix();
    core.setMatrixAt(i, dummy.matrix);
    core.setColorAt(i, color.set("#b5c58e"));
  });
  forge.add(core);
  const striker = new THREE.Group();
  striker.position.y = 1.35;
  group.add(striker);
  addBox(striker, 0, 0, 0, 0.92, 0.22, 0.66);
  addBox(striker, 0, 0.9, 0, 0.17, 1.58, 0.17);
  const glowMaterial = new THREE.MeshBasicMaterial({
    color: "#dbf3a6",
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const glow = new THREE.Mesh(
    new THREE.BoxGeometry(0.76, 0.035, 0.54),
    glowMaterial,
  );
  glow.position.y = -0.14;
  striker.add(glow);
  const rings = Array.from({ length: 3 }, () => {
    const points = Array.from(
      { length: 48 },
      (_, i) =>
        new THREE.Vector3(
          Math.cos((i / 48) * Math.PI * 2),
          Math.sin((i / 48) * Math.PI * 2),
          0,
        ),
    );
    const ring = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({
        color: "#c5e586",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    ring.position.set(0, -0.43, 0.72);
    group.add(ring);
    return ring;
  });
  const sparks = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.05, 0.05, 0.16),
    new THREE.MeshBasicMaterial({
      color: "#e5f7c4",
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    18,
  );
  sparks.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  sparks.frustumCulled = false;
  group.add(sparks);
  return {
    group: placement,
    content: group,
    update(time: number) {
      lanes.forEach(({ curve, coins, speed }, lane) =>
        coins.forEach((coin, i) => {
          const t = (time * speed + i / 3) % 1;
          coin.position.copy(curve.getPoint(t));
          coin.scale.setScalar(
            Math.max(
              0.001,
              0.6 * smooth(t / 0.07) * (1 - smooth((t - 0.9) / 0.1)),
            ),
          );
          coin.rotation.set(
            0,
            0.2 * Math.sin(time * 0.6 + i * 1.7 + lane),
            time * 0.65 + i * 1.7 + lane,
          );
        }),
      );
      output.forEach((coin, i) => {
        const t = (time * (0.11 + (i % 2) * 0.012) + i / 6) % 1;
        coin.position.copy(outlet.getPoint(t));
        coin.scale.setScalar(
          Math.max(
            0.001,
            0.52 * smooth(t / 0.08) * (1 - smooth((t - 0.88) / 0.12)),
          ),
        );
        coin.rotation.set(
          0,
          0.24 * Math.sin(time * 0.8 + i * 1.13),
          time * 1.1 + i * 1.13,
        );
      });
      for (let i = 0; i < 18; i++) {
        const t = (time * (0.12 + (i % 5) * 0.01) + i / 18) % 1;
        dummy.position.copy(inlet.getPoint(t));
        dummy.position.y += 0.04 * Math.sin(time * 2.2 + i);
        dummy.rotation.set(0, time * 1.8 + i, 0);
        dummy.scale.setScalar(
          Math.max(0.001, Math.sin(Math.PI * t) * (0.7 + (i % 4) * 0.13)),
        );
        dummy.updateMatrix();
        work.setMatrixAt(i, dummy.matrix);
      }
      work.instanceMatrix.needsUpdate = true;
      const cycle = (time * 0.32) % 1;
      const strike =
        cycle >= 0.66 && cycle < 0.76
          ? smooth((cycle - 0.66) / 0.1)
          : cycle >= 0.76 && cycle < 0.9
            ? 1 - smooth((cycle - 0.76) / 0.14)
            : 0;
      const sinceImpact = (cycle + 0.24) % 1,
        flash = 1 - smooth(sinceImpact / 0.11);
      striker.position.y = 1.35 - 0.86 * strike;
      glowMaterial.opacity = 0.1 + 0.3 * flash;
      forge.scale.setScalar(1 + 0.08 * flash);
      glassMaterial.opacity = 0.2 + 0.12 * flash;
      points.forEach((_, i) =>
        core.setColorAt(
          i,
          color.setRGB(
            0.42 + flash * 0.2,
            0.47 + flash * 0.18,
            0.29 + flash * 0.22,
          ),
        ),
      );
      if (core.instanceColor) core.instanceColor.needsUpdate = true;
      rings.forEach((ring, i) => {
        const t = (sinceImpact - i * 0.035) / 0.22;
        ring.visible = t >= 0 && t <= 1;
        if (ring.visible) {
          ring.scale.setScalar(0.7 + 1.65 * t);
          ring.material.opacity = 0.58 * (1 - smooth(t));
        }
      });
      for (let i = 0; i < 18; i++) {
        const t = (sinceImpact - (i % 4) * 0.011) / 0.2,
          angle = i * 2.399963;
        if (t >= 0 && t <= 1) {
          dummy.position.set(
            Math.cos(angle) * (0.65 + (i % 3) * 0.3) * t,
            0.25 + (0.45 + (i % 4) * 0.25) * t - t * t * 0.6,
            Math.sin(angle) * (0.35 + (i % 3) * 0.2) * t,
          );
          dummy.rotation.set(0, 0, angle + t * Math.PI * 1.5);
          dummy.scale.setScalar(
            Math.max(0.001, (0.65 + (i % 4) * 0.25) * (1 - smooth(t))),
          );
        } else {
          dummy.position.set(0, -50, 0);
          dummy.scale.setScalar(0.001);
        }
        dummy.updateMatrix();
        sparks.setMatrixAt(i, dummy.matrix);
      }
      sparks.instanceMatrix.needsUpdate = true;
    },
  };
}
