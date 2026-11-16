import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

function roundedOutline(path: THREE.Shape | THREE.Path, width: number, height: number, radius: number) {
  const x = -width / 2, y = -height / 2;
  path.moveTo(x + radius, y);
  path.lineTo(x + width - radius, y);
  path.quadraticCurveTo(x + width, y, x + width, y + radius);
  path.lineTo(x + width, y + height - radius);
  path.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  path.lineTo(x + radius, y + height);
  path.quadraticCurveTo(x, y + height, x, y + height - radius);
  path.lineTo(x, y + radius);
  path.quadraticCurveTo(x, y, x + radius, y);
}

/** Open metal bezel and separate glass sheets, rather than a solid coloured block. */
export function createGlassPhone() {
  const group = new THREE.Group();
  const materials: THREE.MeshPhysicalMaterial[] = [];
  const material = (options: THREE.MeshPhysicalMaterialParameters) => {
    const result = new THREE.MeshPhysicalMaterial({
      transparent: true, depthWrite: false, envMapIntensity: 0.45, fog: false,
      ...options,
    });
    result.userData.restOpacity = result.opacity;
    materials.push(result);
    return result;
  };
  const metal = material({ color: "#a5aca0", metalness: 0.88, roughness: 0.3, opacity: 0.72, clearcoat: 0.22 });
  const glass = material({ color: "#d7e0cf", metalness: 0, roughness: 0.13, opacity: 0.38, transmission: 0.72, thickness: 0.035, ior: 1.46, clearcoat: 0.35 });
  const backGlass = material({ color: "#9caa91", roughness: 0.2, opacity: 0.22, transmission: 0.6, thickness: 0.02, ior: 1.46 });
  const dark = material({ color: "#10170f", metalness: 0.45, roughness: 0.28, opacity: 0.88 });
  const lensGlass = material({ color: "#394e46", roughness: 0.08, metalness: 0.15, transmission: 0.4, thickness: 0.01, opacity: 0.72 });
  const outer = new THREE.Shape();
  roundedOutline(outer, 1.36, 2.7, 0.18);
  const inner = new THREE.Path();
  roundedOutline(inner, 1.19, 2.51, 0.13);
  outer.holes.push(new THREE.Path(inner.getPoints(12).reverse()));
  const bezel = new THREE.Mesh(new THREE.ExtrudeGeometry(outer, {
    depth: 0.14, bevelEnabled: true, bevelThickness: 0.012,
    bevelSize: 0.009, bevelSegments: 2, curveSegments: 8, steps: 1,
  }), metal);
  bezel.name = "metal-bezel";
  bezel.position.z = -0.07;
  group.add(bezel);
  const add = (geometry: THREE.BufferGeometry, surface: THREE.Material, x: number, y: number, z: number) => {
    const mesh = new THREE.Mesh(geometry, surface);
    mesh.position.set(x, y, z);
    group.add(mesh);
    return mesh;
  };
  add(new RoundedBoxGeometry(1.19, 2.51, 0.024, 3, 0.12), glass, 0, 0, 0.086);
  add(new RoundedBoxGeometry(1.19, 2.51, 0.02, 3, 0.12), backGlass, 0, 0, -0.086);
  add(new RoundedBoxGeometry(0.34, 0.085, 0.018, 3, 0.035), dark, 0, 1.12, 0.107);
  add(new THREE.CircleGeometry(0.023, 12), lensGlass, 0.105, 1.12, 0.119);
  add(new RoundedBoxGeometry(0.31, 0.025, 0.008, 2, 0.01), metal, 0, -1.14, 0.106);
  add(new RoundedBoxGeometry(0.46, 0.5, 0.036, 3, 0.085), backGlass, -0.29, 0.92, -0.113);
  for (const [x, y] of [[-0.4, 1.03], [-0.19, 0.83]]) {
    const mount = add(new THREE.RingGeometry(0.057, 0.079, 18), metal, x, y, -0.14);
    mount.rotation.y = Math.PI;
    const lens = add(new THREE.CircleGeometry(0.057, 18), lensGlass, x, y, -0.142);
    lens.rotation.y = Math.PI;
  }
  add(new RoundedBoxGeometry(0.022, 0.24, 0.055, 2, 0.009), metal, 0.687, 0.35, 0);
  for (const y of [0.37, 0.02]) add(new RoundedBoxGeometry(0.022, 0.19, 0.055, 2, 0.009), metal, -0.687, y, 0);
  group.updateMatrixWorld(true);
  return {
    group,
    materials,
    fade(amount: number) {
      materials.forEach(surface => { surface.opacity = (surface.userData.restOpacity as number) * amount; });
    },
  };
}
