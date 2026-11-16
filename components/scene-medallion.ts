import * as THREE from "three";

export function createMiniMedallion(matcap: THREE.Texture, pale = false) {
  const group = new THREE.Group();
  const material = new THREE.MeshMatcapMaterial({
    matcap,
    color: pale ? "#dce5d0" : "#bdd58b",
  });
  const inset = material.clone();
  inset.color.multiplyScalar(0.7);
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(0.47, 0.47, 0.1, 40),
    inset,
  );
  body.rotation.x = Math.PI / 2;
  group.add(body);
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.55, 0.13, 40, 1, true),
    material,
  );
  rim.rotation.x = Math.PI / 2;
  group.add(rim);
  for (const side of [-1, 1]) {
    const face = new THREE.Mesh(
      new THREE.RingGeometry(0.44, 0.55, 40),
      material,
    );
    face.position.z = 0.065 * side;
    if (side < 0) face.rotation.y = Math.PI;
    group.add(face);
  }
  const emblem = new THREE.Shape();
  emblem.moveTo(-0.2, -0.25);
  emblem.lineTo(-0.2, 0.25);
  emblem.lineTo(0, -0.04);
  emblem.lineTo(0.2, 0.25);
  emblem.lineTo(0.2, -0.25);
  emblem.lineTo(0.13, -0.25);
  emblem.lineTo(0.13, 0.02);
  emblem.lineTo(0, -0.16);
  emblem.lineTo(-0.13, 0.02);
  emblem.lineTo(-0.13, -0.25);
  emblem.closePath();
  const geometry = new THREE.ExtrudeGeometry(emblem, {
    depth: 0.15,
    bevelEnabled: false,
    steps: 1,
  });
  geometry.translate(0, 0, -0.075);
  group.add(new THREE.Mesh(geometry, material));
  return group;
}

export function createMedallion(
  matcap: THREE.Texture,
  kind: "motion" | "bolt" = "motion",
  pale = false,
) {
  const group = new THREE.Group();
  const color = new THREE.Color(pale ? "#e9efe1" : "#b7d778");
  const metal = new THREE.MeshMatcapMaterial({ matcap, color });
  const recessed = metal.clone();
  recessed.color.multiplyScalar(0.76);
  const edge = metal.clone();
  edge.color.multiplyScalar(1.05);
  const body = new THREE.Mesh(
    new THREE.CylinderGeometry(1.46, 1.46, 0.24, 64),
    recessed,
  );
  body.rotation.x = Math.PI / 2;
  group.add(body);
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(1.7, 1.7, 0.3, 64, 1, true),
    edge,
  );
  rim.rotation.x = Math.PI / 2;
  group.add(rim);
  const sheen = new THREE.Mesh(
    new THREE.CylinderGeometry(1.715, 1.715, 0.31, 64),
    new THREE.MeshMatcapMaterial({
      matcap,
      color: color.clone().multiplyScalar(0.55),
      transparent: true,
      opacity: 0.2,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  sheen.rotation.x = Math.PI / 2;
  group.add(sheen);
  group.userData.sheen = sheen;
  const dummy = new THREE.Object3D();
  const ribbed = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.05, 0.028, 0.31),
    edge,
    72,
  );
  const ticks = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.022, 0.085, 0.018),
    edge,
    144,
  );
  for (let i = 0; i < 72; i++) {
    const angle = (i / 72) * Math.PI * 2;
    dummy.position.set(Math.cos(angle) * 1.72, Math.sin(angle) * 1.72, 0);
    dummy.rotation.z = angle;
    dummy.updateMatrix();
    ribbed.setMatrixAt(i, dummy.matrix);
    for (let side = 0; side < 2; side++) {
      dummy.position.set(
        Math.cos(angle) * 1.385,
        Math.sin(angle) * 1.385,
        side ? -0.128 : 0.128,
      );
      dummy.rotation.z = angle + Math.PI / 2;
      dummy.updateMatrix();
      ticks.setMatrixAt(side * 72 + i, dummy.matrix);
    }
  }
  group.add(ribbed, ticks);
  for (const side of [1, -1]) {
    const face = new THREE.Mesh(new THREE.RingGeometry(1.45, 1.7, 64), edge);
    face.position.z = 0.15 * side;
    if (side < 0) face.rotation.y = Math.PI;
    group.add(face);
    const inner = new THREE.Mesh(new THREE.RingGeometry(1.26, 1.315, 64), edge);
    inner.position.z = 0.125 * side;
    if (side < 0) inner.rotation.y = Math.PI;
    group.add(inner);
  }
  const traces: THREE.Vector3[] = [];
  const point = (radius: number, angle: number, z: number) =>
    new THREE.Vector3(Math.cos(angle) * radius, Math.sin(angle) * radius, z);
  for (const z of [-0.138, 0.138]) {
    for (const r of [0.62, 0.94, 1.24])
      for (let i = 0; i < 48; i++)
        traces.push(
          point(r, (i / 48) * Math.PI * 2, z),
          point(r, ((i + 1) / 48) * Math.PI * 2, z),
        );
    for (let i = 0; i < 20; i++) {
      const angle = i * 2.399963,
        offset = Math.sin(i * 12.7) * 0.22;
      traces.push(
        point(0.64, angle, z),
        point(0.98, angle, z),
        point(0.98, angle, z),
        point(0.98, angle + offset, z),
        point(0.98, angle + offset, z),
        point(1.26, angle + offset, z),
      );
    }
  }
  group.add(
    new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(traces),
      new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.38,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    ),
  );
  const symbol = new THREE.Shape();
  const points =
    kind === "motion"
      ? [
          [-0.68, -0.85],
          [-0.68, 0.85],
          [-0.42, 0.85],
          [0, 0.17],
          [0.42, 0.85],
          [0.68, 0.85],
          [0.68, -0.85],
          [0.4, -0.85],
          [0.4, 0.28],
          [0, -0.36],
          [-0.4, 0.28],
          [-0.4, -0.85],
        ]
      : [
          [0.32, 1],
          [-0.5, -0.08],
          [-0.08, -0.08],
          [-0.32, -1],
          [0.5, 0.12],
          [0.08, 0.12],
        ];
  points.forEach(([x, y], i) =>
    i ? symbol.lineTo(x, y) : symbol.moveTo(x, y),
  );
  symbol.closePath();
  const emblemGeometry = new THREE.ExtrudeGeometry(symbol, {
    depth: 0.42,
    bevelEnabled: true,
    bevelSize: 0.04,
    bevelThickness: 0.04,
    bevelSegments: 2,
    steps: 1,
  });
  emblemGeometry.center();
  const emblemMaterial = metal.clone();
  emblemMaterial.color.multiplyScalar(1.5);
  const emblem = new THREE.Mesh(emblemGeometry, emblemMaterial);
  emblem.scale.setScalar(0.82);
  group.add(emblem);
  return group;
}
