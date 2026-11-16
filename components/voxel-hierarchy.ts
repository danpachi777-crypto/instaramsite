import * as THREE from "three";

type Block = { born: number; source: number };
type Satellite = {
  parent: Block;
  lane: number;
  born: number;
  x: number;
  y: number;
  z: number;
  phase: number;
};

const ease = (value: number) => {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

/** Event-driven tiers: lower arrivals feed the middle tiers, then the top tier. */
export function createVoxelHierarchy() {
  const group = new THREE.Group();
  group.position.set(-17.3, 28.6, 2.5);
  group.rotation.y = 0.077;
  group.scale.setScalar(1.24);
  const specifications = [
    { y: 4.2, z: 0, size: 2.2, n: 7, slots: 7 },
    { y: 1.8, z: -1.6, size: 1.65, n: 5, slots: 11 },
    { y: 1.8, z: 1.6, size: 1.65, n: 5, slots: 11 },
    ...[-2.4, -0.8, 0.8, 2.4].map((z) => ({
      y: -0.6,
      z,
      size: 1.1,
      n: 4,
      slots: 14,
    })),
  ];
  let seed = 1234.567;
  const random = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  let voxelTotal = 0;
  const lanes = specifications.map((spec) => {
    const points: THREE.Vector3[] = [];
    for (let x = 0; x < spec.n; x++)
      for (let y = 0; y < spec.n; y++)
        for (let z = 0; z < spec.n; z++) {
          if ([x, y, z].some((v) => v === 0 || v === spec.n - 1))
            points.push(
              new THREE.Vector3(x, y, z)
                .addScalar(-(spec.n - 1) / 2)
                .divideScalar(spec.n),
            );
        }
    const start = voxelTotal;
    voxelTotal += points.length * spec.slots;
    return {
      ...spec,
      points,
      start,
      next: -16 - random() * 2,
      blocks: Array.from({ length: spec.slots }, (): Block => ({
        born: -1000,
        source: -1,
      })),
    };
  });
  const box = new THREE.BoxGeometry();
  const cores = new THREE.InstancedMesh(
    box,
    new THREE.MeshBasicMaterial(),
    voxelTotal,
  );
  const blockTotal = specifications.reduce((sum, spec) => sum + spec.slots, 0);
  const glass = new THREE.InstancedMesh(
    box,
    new THREE.MeshBasicMaterial({
      color: "#667e37",
      transparent: true,
      opacity: 0.17,
      depthWrite: false,
    }),
    blockTotal,
  );
  // A box edge buffer avoids the diagonal face lines produced by wireframe triangles.
  const edgeGeometry = new THREE.EdgesGeometry(box);
  const edgePositions = edgeGeometry.getAttribute("position");
  const outlinePositions = new Float32Array(
    blockTotal * edgePositions.count * 3,
  );
  const outlineGeometry = new THREE.BufferGeometry();
  outlineGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(outlinePositions, 3).setUsage(
      THREE.DynamicDrawUsage,
    ),
  );
  const outlines = new THREE.LineSegments(
    outlineGeometry,
    new THREE.LineBasicMaterial({
      color: "#b9d77b",
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
    }),
  );
  edgeGeometry.dispose();
  const satellites = new THREE.InstancedMesh(
    box,
    new THREE.MeshBasicMaterial({ color: "#a3b77c" }),
    28,
  );
  const satelliteGlass = new THREE.InstancedMesh(
    box,
    new THREE.MeshBasicMaterial({
      color: "#9dbb69",
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    }),
    28,
  );
  const attached: Satellite[] = [];
  const connectorsGeometry = new THREE.BufferGeometry();
  const connectorPositions = new Float32Array(96 * 6);
  connectorsGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(connectorPositions, 3).setUsage(
      THREE.DynamicDrawUsage,
    ),
  );
  const connectors = new THREE.LineSegments(
    connectorsGeometry,
    new THREE.LineBasicMaterial({
      color: "#bed88a",
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }),
  );
  for (const mesh of [cores, glass, satellites, satelliteGlass]) {
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    group.add(mesh);
  }
  outlines.frustumCulled = connectors.frustumCulled = false;
  group.add(outlines, connectors);
  const grid: THREE.Vector3[] = [];
  for (let x = -12; x <= 12; x += 2)
    grid.push(
      new THREE.Vector3(x, -3.1, -3.2),
      new THREE.Vector3(x, -3.1, 3.2),
    );
  for (let z = -3.2; z <= 3.21; z += 1.6)
    grid.push(new THREE.Vector3(-12, -3.1, z), new THREE.Vector3(12, -3.1, z));
  for (const lane of lanes)
    grid.push(
      new THREE.Vector3(-37.5, lane.y, lane.z),
      new THREE.Vector3(13.2, lane.y, lane.z),
    );
  group.add(
    new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(grid),
      new THREE.LineBasicMaterial({
        color: "#a0c568",
        transparent: true,
        opacity: 0.14,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    ),
  );
  const arrivals = [0, 0];
  let topArrivals = 0;
  let clock = 0;
  function spawn(laneIndex: number, born: number, source = -1) {
    const lane = lanes[laneIndex];
    const block = lane.blocks.reduce((oldest, current) =>
      current.born < oldest.born ? current : oldest,
    );
    if (born >= 0 && 14.5 - (clock - block.born) * 2 > -39) return null;
    block.born = born;
    block.source = source;
    return block;
  }
  function attach(block: Block, lane: number, born: number, count: number) {
    for (let i = 0; i < count; i++) {
      const slot = attached.findIndex((item) => item.parent.born !== item.born);
      if (slot < 0 && attached.length >= 28) break;
      const item = {
        parent: block,
        lane,
        born,
        x: 0.9 + 1.3 * random(),
        y: -(1.2 + 0.5 * random()),
        z: (i - count / 2) * 0.55,
        phase: attached.length * 1.7,
      };
      if (slot < 0) attached.push(item);
      else attached[slot] = item;
    }
  }
  function arrival(index: number, at: number) {
    const block = spawn(index, at);
    if (block) {
      const region = index < 5 ? 0 : 1;
      if (++arrivals[region] % 2 === 0) {
        const parent = spawn(region + 1, at, index);
        if (parent) {
          attach(parent, region + 1, at, 1 + Math.floor(2 * random()));
          if (++topArrivals % 2 === 0) spawn(0, at, region + 1);
        }
      }
      attach(block, index, at, 2 + Math.floor(3 * random()));
    }
    lanes[index].next = at + 2.4 * (0.65 + 0.85 * random());
  }
  function advance(until: number) {
    for (let safeguard = 0; safeguard < 256; safeguard++) {
      let index = 3;
      for (let i = 4; i < 7; i++)
        if (lanes[i].next < lanes[index].next) index = i;
      if (lanes[index].next > until) break;
      arrival(index, lanes[index].next);
    }
  }
  advance(0);
  const dummy = new THREE.Object3D(),
    color = new THREE.Color();
  const variation = Float32Array.from(
    { length: voxelTotal },
    (_, i) =>
      0.75 +
      THREE.MathUtils.euclideanModulo(Math.sin(i * 12.9898) * 43758.5453, 1) *
        0.3,
  );
  const scaleAt = (block: Block) =>
    ease((clock - block.born) / 0.3) *
    ease((14.5 - (clock - block.born) * 2 + 39) / 3);
  return {
    group,
    update(time: number) {
      clock = time;
      advance(time);
      let shell = 0,
        segments = 0;
      function connect(
        x: number,
        y: number,
        z: number,
        tx: number,
        ty: number,
        tz: number,
      ) {
        if (segments >= 96) return;
        connectorPositions.set([x, y, z, tx, ty, tz], segments++ * 6);
      }
      lanes.forEach((lane) => {
        const visible: number[] = [];
        lane.blocks.forEach((block, slot) => {
          const age = time - block.born,
            x = 14.5 - age * 2;
          const scale = scaleAt(block);
          const settled = ease((age - 0.15) / 1.3);
          const flash = Math.pow(Math.max(0, 1 - age), 3);
          const extent = lane.size * scale * (1 - 0.28 * settled);
          const voxelSize =
            (lane.size / lane.n) * 0.62 * scale * (1 - 0.2 * settled);
          lane.points.forEach((p, i) => {
            const index = lane.start + slot * lane.points.length + i;
            dummy.position.set(
              x + p.x * extent,
              lane.y + p.y * extent,
              lane.z + p.z * extent,
            );
            dummy.scale.setScalar(Math.max(0.001, voxelSize));
            dummy.updateMatrix();
            cores.setMatrixAt(index, dummy.matrix);
            const brightness = variation[index] * 0.65;
            color.setRGB(
              (0.68 + 0.16 * (1 - settled) + flash * 0.1) * brightness,
              (0.73 + 0.15 * (1 - settled) + flash * 0.09) * brightness,
              (0.48 + 0.08 * (1 - settled) + flash * 0.12) * brightness,
            );
            cores.setColorAt(index, color);
          });
          dummy.position.set(x, lane.y, lane.z);
          dummy.scale.setScalar(Math.max(0.001, lane.size * scale));
          dummy.updateMatrix();
          glass.setMatrixAt(shell, dummy.matrix);
          for (let i = 0; i < edgePositions.count; i++) {
            const size = lane.size * scale;
            outlinePositions.set(
              [
                x + edgePositions.getX(i) * size,
                lane.y + edgePositions.getY(i) * size,
                lane.z + edgePositions.getZ(i) * size,
              ],
              (shell * edgePositions.count + i) * 3,
            );
          }
          shell++;
          if (scale > 0.1) {
            visible.push(x);
            if (block.source >= 0) {
              const source = lanes[block.source];
              connect(
                x,
                lane.y - (lane.size * scale) / 2 - 0.1,
                lane.z,
                x,
                source.y + source.size / 2 + 0.1,
                source.z,
              );
            }
          }
        });
        visible.sort((a, b) => a - b);
        for (let i = 1; i < visible.length; i++)
          if (
            visible[i] - visible[i - 1] - lane.size > 0.3 &&
            visible[i] - visible[i - 1] - lane.size < 8
          )
            connect(
              visible[i - 1] + lane.size / 2 + 0.12,
              lane.y,
              lane.z,
              visible[i] - lane.size / 2 - 0.12,
              lane.y,
              lane.z,
            );
      });
      for (let i = 0; i < 28; i++) {
        const item = attached[i],
          valid = item && item.parent.born === item.born;
        let size = 0.001;
        if (valid) {
          const lane = lanes[item.lane],
            x = 14.5 - (time - item.born) * 2;
          const maturity = ease((time - item.born) / 1.1),
            scale = scaleAt(item.parent);
          dummy.position.set(
            x + item.x + (1 - maturity) * 2.2,
            lane.y + item.y + 0.12 * Math.sin(time * 2.4 + item.phase),
            lane.z + item.z,
          );
          size = Math.max(0.001, 0.34 * scale * maturity);
          if (scale > 0.1 && maturity > 0.2)
            connect(
              dummy.position.x,
              dummy.position.y + 0.24,
              dummy.position.z,
              x,
              lane.y - (lane.size * scale) / 2 - 0.08,
              lane.z,
            );
        } else dummy.position.set(0, -50, 0);
        dummy.scale.setScalar(size);
        dummy.updateMatrix();
        satellites.setMatrixAt(i, dummy.matrix);
        dummy.scale.setScalar((size * 0.5) / 0.34);
        dummy.updateMatrix();
        satelliteGlass.setMatrixAt(i, dummy.matrix);
      }
      for (const mesh of [cores, glass, satellites, satelliteGlass])
        mesh.instanceMatrix.needsUpdate = true;
      if (cores.instanceColor) cores.instanceColor.needsUpdate = true;
      outlines.geometry.getAttribute("position").needsUpdate = true;
      connectorsGeometry.setDrawRange(0, segments * 2);
      connectorsGeometry.getAttribute("position").needsUpdate = true;
    },
  };
}
