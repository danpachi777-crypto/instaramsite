import * as THREE from "three";

const smooth = (value: number) => {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

export function createFinaleRocket(root: THREE.Object3D) {
  const group = new THREE.Group();
  group.position.y = 8;
  root.add(group);
  const rocket = new THREE.Group();
  rocket.scale.setScalar(1.35);
  group.add(rocket);
  const metal = new THREE.MeshBasicMaterial({
    vertexColors: true,
    transparent: true,
    fog: false,
  });
  const dark = new THREE.MeshBasicMaterial({
    color: "#1b2019",
    transparent: true,
    fog: false,
  });
  const finMaterial = new THREE.MeshBasicMaterial({
    color: "#838a79",
    transparent: true,
    fog: false,
  });
  const accent = new THREE.MeshBasicMaterial({
    color: "#b9d875",
    transparent: true,
    fog: false,
  });
  const shade = (geometry: THREE.BufferGeometry, value: number) => {
    const positions = geometry.getAttribute("position"),
      colors = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i++) {
      const light =
        0.42 +
        0.58 *
          (0.5 +
            0.5 *
              Math.cos(Math.atan2(positions.getX(i), positions.getZ(i)) - 0.8));
      colors.set(
        [value * light, value * 1.035 * light, value * 0.98 * light],
        i * 3,
      );
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geometry;
  };
  const cylinder = (
    top: number,
    bottom: number,
    height: number,
    y: number,
    material: THREE.Material = metal,
  ) => {
    const mesh = new THREE.Mesh(
      shade(new THREE.CylinderGeometry(top, bottom, height, 36), 0.66),
      material,
    );
    mesh.position.y = y;
    rocket.add(mesh);
    return mesh;
  };
  cylinder(2.6, 2.6, 26, 16.2);
  cylinder(2.66, 2.74, 3.2, 1.6, dark);
  cylinder(2.63, 2.63, 1.6, 29.9, dark);
  cylinder(2.6, 2.6, 14.5, 37.95);
  cylinder(1.6, 2.6, 4.2, 47.3);
  cylinder(0.02, 1.6, 2.8, 50.8, dark);
  for (const y of [
    6.5, 9.7, 12.9, 16.1, 19.3, 22.5, 25.7, 33.5, 36.5, 39.5, 42.5,
  ]) {
    const band = new THREE.Mesh(
      shade(new THREE.CylinderGeometry(2.615, 2.615, 0.09, 36, 1, true), 0.45),
      metal,
    );
    band.position.y = y;
    rocket.add(band);
  }
  for (let i = 0; i < 7; i++) {
    const engine = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.55, 1, 12),
      dark,
    );
    const angle = (i / 6) * Math.PI * 2;
    engine.position.set(
      i < 6 ? 1.5 * Math.cos(angle) : 0,
      0.35,
      i < 6 ? 1.5 * Math.sin(angle) : 0,
    );
    rocket.add(engine);
  }
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const brace = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.4, 0.45), dark);
    brace.position.set(2.8 * Math.cos(angle), 27.6, 2.8 * Math.sin(angle));
    brace.rotation.y = -angle - Math.PI / 2;
    rocket.add(brace);
  }
  const fin = (height: number, tip: number, width: number, depth: number) => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(width, (height - tip) * 0.4);
    shape.lineTo(width, (height - tip) * 0.4 + tip);
    shape.lineTo(0, height);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: false,
      steps: 1,
    });
    geometry.translate(0, 0, -depth / 2);
    return new THREE.Mesh(geometry, finMaterial);
  };
  for (const side of [-1, 1]) {
    const lower = fin(7.5, 4.4, 3.2, 0.42);
    lower.position.set(2.4 * side, 30.9, 0);
    lower.rotation.y = side < 0 ? Math.PI : 0;
    rocket.add(lower);
    const upper = fin(4.4, 2.6, 2.2, 0.34);
    upper.position.set(2.15 * side, 44, 0);
    upper.rotation.y = side < 0 ? Math.PI : 0;
    rocket.add(upper);
    for (const [x, y, w, h, d] of [
      [2.5, 34.4, 0.55, 6.4, 0.95],
      [2.2, 45.9, 0.45, 3.4, 0.75],
    ]) {
      const hinge = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), finMaterial);
      hinge.position.set(x * side, y, 0);
      rocket.add(hinge);
    }
  }
  const mark = new THREE.Shape();
  [
    [-0.7, -1],
    [-0.7, 1],
    [-0.4, 1],
    [0, 0.25],
    [0.4, 1],
    [0.7, 1],
    [0.7, -1],
    [0.4, -1],
    [0.4, 0.3],
    [0, -0.4],
    [-0.4, 0.3],
    [-0.4, -1],
  ].forEach(([x, y], i) => (i ? mark.lineTo(x, y) : mark.moveTo(x, y)));
  mark.closePath();
  const markGeometry = new THREE.ExtrudeGeometry(mark, {
    depth: 0.035,
    bevelEnabled: false,
  });
  for (const [y, scale] of [
    [18.2, 1],
    [37.6, 0.7],
  ]) {
    const emblem = new THREE.Mesh(markGeometry, accent);
    emblem.position.set(1.8364, y, 1.7836);
    emblem.rotation.y = 0.8;
    emblem.scale.setScalar(scale);
    rocket.add(emblem);
  }
  const plume = new THREE.Group();
  plume.position.y = 0.3;
  rocket.add(plume);
  for (const [top, bottom, height, strength, power] of [
    [0.9, 1.6, 8, 1.38, 2.4],
    [1.4, 2.9, 14, 1.1, 2],
    [2, 4.4, 21, 0.6, 1.5],
  ]) {
    const geometry = new THREE.CylinderGeometry(
        top,
        bottom,
        height,
        20,
        16,
        true,
      ),
      positions = geometry.getAttribute("position"),
      colors = new Float32Array(positions.count * 3);
    for (let i = 0; i < positions.count; i++) {
      const light =
        Math.pow((positions.getY(i) + height / 2) / height, power) * strength;
      colors.set([light * 0.84, light, light * 0.54], i * 3);
    }
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshBasicMaterial({
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        side: THREE.DoubleSide,
        fog: false,
      }),
    );
    mesh.position.y = -height / 2;
    plume.add(mesh);
  }
  const flashMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(1.3, 1.5, 0.95),
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    fog: false,
  });
  const flash = new THREE.Mesh(
    new THREE.SphereGeometry(1.7, 16, 12),
    flashMaterial,
  );
  flash.position.y = 0.4;
  rocket.add(flash);
  const padRings = Array.from({ length: 3 }, () => {
    const points = Array.from(
      { length: 64 },
      (_, i) =>
        new THREE.Vector3(
          Math.cos((i / 64) * Math.PI * 2),
          0,
          Math.sin((i / 64) * Math.PI * 2),
        ),
    );
    const ring = new THREE.LineLoop(
      new THREE.BufferGeometry().setFromPoints(points),
      new THREE.LineBasicMaterial({
        color: "#b9d875",
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    ring.position.y = 3.2;
    root.add(ring);
    return ring;
  });
  const domeMaterial = new THREE.MeshBasicMaterial({
    color: "#090d07",
    side: THREE.BackSide,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    fog: false,
  });
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(360, 24, 16),
    domeMaterial,
  );
  dome.position.y = 60;
  dome.renderOrder = 60;
  group.add(dome);
  return {
    update(time: number, progress: number, camera: THREE.Camera) {
      const t = smooth((progress - 0.72) / 0.28),
        cut = smooth((progress - 0.86) / 0.08);
      group.visible = t > 0.005;
      if (!group.visible) {
        padRings.forEach((ring) => (ring.visible = false));
        return;
      }
      const height =
          -80 +
          80 * smooth(t / 0.38) +
          230 * Math.pow(Math.max((t - 0.38) / 0.62, 0), 2),
        ignition = smooth((t - 0.36) / 0.06);
      rocket.position.set(
        0.05 * Math.sin(time * 23) * ignition * (1 - t),
        height,
        0.05 * Math.cos(time * 19) * ignition * (1 - t),
      );
      rocket.rotation.y =
        Math.atan2(camera.position.x, camera.position.z) - 0.8;
      const opacity = 1 - smooth((t - 0.87) / 0.1);
      [metal, dark, finMaterial, accent].forEach(
        (material) => (material.opacity = opacity),
      );
      rocket.visible = opacity > 0.01;
      const flicker =
          1 + 0.05 * Math.sin(time * 31) + 0.04 * Math.sin(time * 17.3),
        thrust = ignition * (1 - cut);
      plume.visible = thrust > 0.01;
      plume.scale.set(
        thrust * (0.94 + 0.06 * flicker),
        thrust * flicker,
        thrust * (0.94 + 0.06 * flicker),
      );
      flashMaterial.opacity =
        ignition * opacity * (0.45 + 0.12 * Math.sin(time * 41));
      flash.scale.setScalar(1 + 0.08 * Math.sin(time * 37));
      padRings.forEach((ring, i) => {
        const phase = (time * 0.45 + i / 3) % 1;
        ring.visible = true;
        ring.scale.set(1.5 + 10 * phase, 1, 1.5 + 10 * phase);
        ring.material.opacity =
          0.3 * (1 - phase) * ignition * (1 - smooth((t - 0.45) / 0.35));
      });
      domeMaterial.opacity = smooth((progress - 0.9) / 0.09);
    },
    dispose() {
      for (const object of [group, ...padRings]) {
        object.removeFromParent();
        object.traverse((child) => {
          if (child instanceof THREE.Mesh || child instanceof THREE.Line) {
            child.geometry.dispose();
            const materials = Array.isArray(child.material)
              ? child.material
              : [child.material];
            materials.forEach((material) => material.dispose());
          }
        });
      }
    },
  };
}
