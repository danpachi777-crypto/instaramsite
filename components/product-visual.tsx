"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

export function ProductVisual() {
  const mountRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mount.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#0b100c");
    const camera = new THREE.PerspectiveCamera(
      32,
      mount.clientWidth / mount.clientHeight,
      0.1,
      60,
    );
    camera.position.set(5.5, 5.5, 9.5);
    camera.lookAt(0, 2, 0);
    scene.add(new THREE.AmbientLight("#dce4d0", 1.2));
    const key = new THREE.DirectionalLight("#fff8e0", 3.3);
    key.position.set(-4, 12, 8);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key);
    const rim = new THREE.PointLight("#d5f86c", 32, 20);
    rim.position.set(2, 4, -3);
    scene.add(rim);
    const graphite = new THREE.MeshStandardMaterial({
      color: "#777c70",
      metalness: 0.35,
      roughness: 0.55,
    });
    const dark = new THREE.MeshStandardMaterial({
      color: "#10170e",
      metalness: 0.25,
      roughness: 0.7,
    });
    const lime = new THREE.MeshStandardMaterial({
      color: "#a4c650",
      emissive: "#526b20",
      emissiveIntensity: 0.15,
      metalness: 0.15,
      roughness: 0.5,
    });
    const white = new THREE.MeshStandardMaterial({
      color: "#f1f6e7",
      metalness: 0.1,
      roughness: 0.4,
    });
    const sculpture = new THREE.Group();
    sculpture.rotation.set(0.08, -0.3, -0.12);
    sculpture.position.y = 0.1;
    scene.add(sculpture);
    function piece(
      parent: THREE.Object3D,
      w: number,
      h: number,
      d: number,
      mat: THREE.Material,
      x: number,
      y: number,
      z: number,
    ) {
      const mesh = new THREE.Mesh(
        new RoundedBoxGeometry(w, h, d, 2, 0.035),
        mat,
      );
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    }
    [-2.8, 0, 2.8].forEach((x, index) => {
      const panel = new THREE.Group();
      panel.position.set(x, 2.75, index === 1 ? 1 : -0.4);
      panel.rotation.y = index === 0 ? 0.17 : index === 2 ? -0.18 : 0;
      sculpture.add(panel);
      if (index === 1) {
        piece(panel, 3.1, 3.9, 0.3, dark, 0, 0, 0);
        piece(panel, 2.67, 3.48, 0.32, lime, 0, 0, 0.24);
        const logo = new THREE.Shape();
        [
          [-0.7, -0.9],
          [-0.7, 0.9],
          [-0.4, 0.9],
          [0, 0.2],
          [0.4, 0.9],
          [0.7, 0.9],
          [0.7, -0.9],
          [0.4, -0.9],
          [0.4, 0.35],
          [0, -0.3],
          [-0.4, 0.35],
          [-0.4, -0.9],
        ].forEach(([px, py], i) => {
          if (i) logo.lineTo(px, py);
          else logo.moveTo(px, py);
        });
        logo.closePath();
        const mark = new THREE.Mesh(
          new THREE.ExtrudeGeometry(logo, {
            depth: 0.13,
            bevelEnabled: true,
            bevelSize: 0.015,
            bevelThickness: 0.015,
            bevelSegments: 2,
            steps: 1,
          }),
          white,
        );
        mark.position.z = 0.43;
        mark.castShadow = true;
        panel.add(mark);
      } else {
        for (let layer = 0; layer < 3; layer++) {
          const z = -layer * 0.19;
          piece(panel, 3.2, 0.23, 0.18, graphite, 0, 1.9, z);
          piece(panel, 3.2, 0.23, 0.18, graphite, 0, -1.9, z);
          piece(panel, 0.23, 3.8, 0.18, graphite, -1.49, 0, z);
          piece(panel, 0.23, 3.8, 0.18, graphite, 1.49, 0, z);
        }
        for (const y of [-0.7, 0.7])
          piece(panel, 2.7, 0.2, 0.22, graphite, 0, y, 0.08);
        for (const x of [-0.5, 0.5])
          piece(panel, 0.18, 3.5, 0.22, graphite, x, 0, 0.08);
      }
    });
    const tileGeometry = new THREE.BoxGeometry(0.22, 0.14, 0.22);
    const floor = new THREE.InstancedMesh(
      tileGeometry,
      new THREE.MeshStandardMaterial({ color: "#2d3429", roughness: 0.9 }),
      40 * 40,
    );
    const dummy = new THREE.Object3D();
    for (let x = 0; x < 40; x++)
      for (let z = 0; z < 40; z++) {
        dummy.position.set(
          (x - 20) * 0.26,
          Math.sin(x * 17 + z * 13) * 0.025 - 0.17,
          (z - 20) * 0.26,
        );
        dummy.updateMatrix();
        floor.setMatrixAt(x * 40 + z, dummy.matrix);
      }
    floor.receiveShadow = true;
    scene.add(floor);
    const trailMaterial = new THREE.MeshBasicMaterial({ color: "#b6da59" });
    for (const sign of [-1, 1]) {
      const curve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(sign * 5, -0.06, 5),
        new THREE.Vector3(sign * 2, -0.06, 2),
        new THREE.Vector3(sign * 2, -0.06, -1),
        new THREE.Vector3(0, -0.06, -3),
      ]);
      const trail = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 50, 0.025, 5, false),
        trailMaterial,
      );
      scene.add(trail);
    }
    const particles = new THREE.InstancedMesh(
      new THREE.BoxGeometry(0.06, 0.06, 0.06),
      lime,
      50,
    );
    for (let i = 0; i < 50; i++) {
      dummy.position.set(
        Math.sin(i * 31) * 5,
        Math.sin(i * 19) * 2 + 2.5,
        Math.cos(i * 17) * 3,
      );
      dummy.updateMatrix();
      particles.setMatrixAt(i, dummy.matrix);
    }
    scene.add(particles);
    let active = false,
      frame = 0,
      dirty = true;
    const observer = new IntersectionObserver(
      ([entry]) => {
        active = entry.isIntersecting;
        if (active) dirty = true;
      },
      { rootMargin: "200px" },
    );
    observer.observe(mount);
    const resize = () => {
      renderer.setSize(mount.clientWidth, mount.clientHeight);
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      dirty = true;
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    const tick = () => {
      frame = requestAnimationFrame(tick);
      if (active && dirty && !document.hidden) {
        renderer.render(scene, camera);
        dirty = false;
      }
    };
    tick();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      resizeObserver.disconnect();
      scene.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose();
          const materials = Array.isArray(o.material)
            ? o.material
            : [o.material];
          materials.forEach((m) => m.dispose());
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <div
      className="product-visual"
      ref={mountRef}
      role="img"
      aria-label="立体のMOTIONロゴと、重なるフレーム"
    />
  );
}
