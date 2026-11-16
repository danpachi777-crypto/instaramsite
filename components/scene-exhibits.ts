import * as THREE from "three";
import { createVoxelHierarchy } from "./voxel-hierarchy";
import { createMedallion } from "./scene-medallion";
import { createVideoForge } from "./video-forge";
import { interfaceFontFamily } from "../lib/typography";
function line(parent: THREE.Object3D, points: THREE.Vector3[], opacity = 0.3) {
  const mesh = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(points),
    new THREE.LineBasicMaterial({
      color: "#b6de65",
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  parent.add(mesh);
  return mesh;
}
function label(
  parent: THREE.Object3D,
  text: string,
  x: number,
  y: number,
  size = 1,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 80;
  const context = canvas.getContext("2d")!;
  context.font = `400 34px ${interfaceFontFamily}`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillStyle = "#f0f1e9";
  context.fillText(text, 256, 40);
  const texture = new THREE.CanvasTexture(canvas);
  const sprite = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    }),
  );
  sprite.scale.set(5 * size, 0.78 * size, 1);
  sprite.position.set(x, y, 0.7);
  parent.add(sprite);
}
export function createSceneExhibits(
  root: THREE.Object3D,
  matcap: THREE.Texture,
) {
  const hierarchyRig = createVoxelHierarchy();
  const hierarchy = hierarchyRig.group;
  root.add(hierarchy);
  label(hierarchy, "IDEAS / STYLES / VIDEO", -2, 7, 0.7);
  const tokenGroup = new THREE.Group();
  tokenGroup.position.set(6.7, 53.2, -0.2);
  tokenGroup.rotation.y = -0.7;
  root.add(tokenGroup);
  const coins = [-2.9, 2.9].map((x, i) => {
    const coin = createMedallion(matcap, i ? "bolt" : "motion", !!i);
    coin.position.set(x, 0.6, 0);
    tokenGroup.add(coin);
    label(tokenGroup, i ? "AI VIDEO" : "MOTION", x, 3.2, 0.8);
    label(tokenGroup, i ? "Your next story" : "Creative styles", x, -1.7, 0.5);
    return coin;
  });
  const streamGeometry = new THREE.SphereGeometry(0.06, 6, 4);
  const streams = new THREE.InstancedMesh(
    streamGeometry,
    new THREE.MeshBasicMaterial({
      color: "#deeea8",
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    }),
    142,
  );
  streams.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  streams.frustumCulled = false;
  tokenGroup.add(streams);
  const sparkles = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(0.05, 0),
    new THREE.MeshBasicMaterial({
      color: "#ecf5da",
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
    16,
  );
  sparkles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  sparkles.frustumCulled = false;
  tokenGroup.add(sparkles);
  const transfer = [
    new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(-2.9, 0.6, 0.22),
      new THREE.Vector3(0, 1.6, 0.22),
      new THREE.Vector3(2.9, 0.6, 0.22),
    ),
    new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(2.9, 0.6, -0.22),
      new THREE.Vector3(0, 1.6, -0.22),
      new THREE.Vector3(-2.9, 0.6, -0.22),
    ),
  ];
  transfer.forEach((curve) => line(tokenGroup, curve.getPoints(50), 0.14));
  const networkRig = createVideoForge(matcap),
    network = networkRig.group;
  network.scale.setScalar(0.92);
  root.add(network);
  for (let lane = 0; lane < 4; lane++) {
    const y = 3.06 - lane * 0.76;
    label(
      networkRig.content,
      ["CAT", "DOG", "WILDLIFE", "FANTASY"][lane],
      -6.62,
      y,
      0.3,
    );
  }
  label(networkRig.content, "MOTION — VIDEO CREATION", -2.7, 3.3, 0.5);
  const dummy = new THREE.Object3D();
  const visibilityRanges: [THREE.Group, number, number, number][] = [
    [hierarchy, -1, 0.38, 1.24],
    [tokenGroup, 0.4, 0.62, 1],
    [network, 0.62, 0.76, 0.92],
  ];
  return {
    update(time: number, progress: number) {
      const smooth = (value: number) => {
        const t = THREE.MathUtils.clamp(value, 0, 1);
        return t * t * (3 - 2 * t);
      };
      visibilityRanges.forEach(([object, start, end, scale]) => {
        const visibility =
          smooth((progress - start) / 0.05) *
          (1 - smooth((progress - end) / 0.05));
        object.visible = visibility > 0.01;
        object.scale.setScalar(Math.max(0.001, scale * visibility));
      });
      if (hierarchy.visible) hierarchyRig.update(time);
      if (tokenGroup.visible) {
        coins.forEach((coin, i) => {
          coin.position.y = 0.6 + Math.sin(time * 0.9 + i * Math.PI) * 0.18;
          coin.rotation.set(
            Math.sin(time * (i ? 0.31 : 0.27) + i * 0.7) * 0.06,
            Math.sin(time * (i ? 0.36 : 0.32) + i * 2.1) * 0.3 * (i ? -1 : 1),
            Math.sin(time * (i ? 0.7 : 0.6) + i) * 0.07,
          );
          const sheen = coin.userData.sheen as THREE.Mesh<
            THREE.BufferGeometry,
            THREE.MeshMatcapMaterial
          >;
          sheen.material.opacity =
            0.12 +
            0.12 * Math.pow(Math.max(Math.sin(time * 0.9 + i * 2.4), 0), 12);
        });
        for (let i = 0; i < 142; i++) {
          if (i < 52) {
            const t = (time * (0.16 + (i % 5) * 0.03) + i * 0.618) % 1;
            dummy.position.copy(transfer[i % 2].getPoint(t));
            dummy.position.y += 0.08 * Math.sin(time * 3.2 + i);
            dummy.position.z += 0.06 * Math.sin(time * 2.6 + i * 2);
            dummy.scale.setScalar(
              Math.max(
                0.001,
                Math.sin(Math.PI * t) *
                  (i % 9 === 0 ? 1.9 : 0.7 + (i % 6) * 0.14),
              ),
            );
          } else {
            const particle = Math.floor((i - 52) / 3),
              tail = (i - 52) % 3,
              phase = particle * 2.399;
            const angle =
              time * (0.18 + (particle % 7) * 0.03) + phase - tail * 0.06;
            const breathe = 1 + 0.06 * Math.sin(time * 0.35 + phase);
            dummy.position.set(
              Math.cos(angle) * (5.9 + (particle % 3) * 0.27) * breathe,
              0.6 +
                Math.sin(angle * 2 + phase) * (0.25 + (particle % 4) * 0.15) +
                0.2 * Math.sin(time * (0.4 + (particle % 5) * 0.12) + phase),
              Math.sin(angle) * (2.1 + (particle % 3) * 0.2) * breathe,
            );
            dummy.scale.setScalar(
              Math.max(
                0.001,
                (0.55 + (particle % 5) * 0.2) *
                  (0.7 + 0.5 * Math.abs(Math.sin(time * 1.3 + phase * 3))) *
                  [1, 0.55, 0.3][tail],
              ),
            );
          }
          dummy.updateMatrix();
          streams.setMatrixAt(i, dummy.matrix);
        }
        streams.instanceMatrix.needsUpdate = true;
        for (let i = 0; i < 16; i++) {
          const angle = time * (0.5 + (i % 4) * 0.12) + i * 0.9,
            radius = 2.1 + (i % 3) * 0.25;
          dummy.position.set(
            (i < 8 ? -2.9 : 2.9) + Math.cos(angle) * radius,
            0.6 + Math.sin(angle * 1.4) * 1.1,
            Math.sin(angle) * 0.7,
          );
          dummy.scale.setScalar(0.7 + 0.8 * Math.abs(Math.sin(angle * 3)));
          dummy.updateMatrix();
          sparkles.setMatrixAt(i, dummy.matrix);
        }
        sparkles.instanceMatrix.needsUpdate = true;
      }
      if (network.visible) networkRig.update(time);
    },
    dispose() {
      for (const group of [hierarchy, tokenGroup, network]) {
        group.removeFromParent();
        group.traverse((object) => {
          if (
            object instanceof THREE.Mesh ||
            object instanceof THREE.Line ||
            object instanceof THREE.Sprite
          ) {
            if ("geometry" in object) object.geometry.dispose();
            const materials = Array.isArray(object.material)
              ? object.material
              : [object.material];
            materials.forEach((material) => {
              if ("map" in material)
                (material.map as THREE.Texture | null)?.dispose();
              material.dispose();
            });
          }
        });
      }
    },
  };
}
