"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

type Actor = {
  group: THREE.Group;
  start: THREE.Vector3;
  target: THREE.Vector3;
  delay: number;
  phase: number;
};

const actorSpecs = [
  { model: "cat", x: -5.4, z: -1.1, height: 1.35, angle: 1.1 },
  { model: "dog", x: -3.55, z: -0.8, height: 1.75, angle: 0.8 },
  { model: "capybara", x: -1.1, z: 0.2, height: 1.35, angle: 0.55 },
  { model: "penguin", x: 1.25, z: -0.2, height: 1.6, angle: -0.4 },
  { model: "rabbit", x: 3.3, z: -0.7, height: 1.4, angle: -0.8 },
  { model: "cat", x: 5.5, z: -1.2, height: 1.35, angle: -1.1 },
] as const;

function smoothstep(value: number) {
  const x = THREE.MathUtils.clamp(value, 0, 1);
  return x * x * (3 - 2 * x);
}

export function AnimalStage({ onReady }: { onReady?: () => void }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
    } catch {
      onReady?.();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2("#10140e", 0.044);
    const camera = new THREE.PerspectiveCamera(46, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 3.2, 12);
    camera.lookAt(0, 2.7, -1);
    scene.add(new THREE.AmbientLight("#c6d4ae", 0.24));

    const key = new THREE.SpotLight("#d7e7c3", 7, 24, Math.PI / 3.2, 0.8, 1.4);
    key.position.set(-6, 9, 7);
    key.target.position.set(0, 0.4, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key, key.target);
    const backlight = new THREE.PointLight("#d5f86c", 16, 19, 1.5);
    backlight.position.set(0, 4.8, -3.5);
    scene.add(backlight);
    const side = new THREE.PointLight("#86a65b", 4.5, 16);
    side.position.set(6, 2.7, 3.5);
    scene.add(side);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(90, 90),
      new THREE.MeshStandardMaterial({ color: "#11170f", roughness: 0.32, metalness: 0.36 }),
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.22;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(65, 45, "#52683a", "#263221");
    grid.position.y = -0.205;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.13;
    scene.add(grid);

    const ring = new THREE.Group();
    ring.position.set(0, 4.4, -3.2);
    scene.add(ring);
    const ringMaterials = [
      new THREE.MeshStandardMaterial({ color: "#ecff9b", emissive: "#c6f46a", emissiveIntensity: 1.35, metalness: 0.25 }),
      new THREE.MeshStandardMaterial({ color: "#9dbd58", emissive: "#9fca52", emissiveIntensity: 0.96, metalness: 0.25 }),
      new THREE.MeshStandardMaterial({ color: "#526c30", emissive: "#67853a", emissiveIntensity: 0.55, metalness: 0.25 }),
    ];
    for (let index = 0; index < 112; index++) {
      if (index % 17 === 4 || index % 19 === 13) continue;
      const angle = (index / 112) * Math.PI * 2 + Math.sin(index * 3.1) * 0.1;
      const radius = 2.12 + Math.sin(index * 1.9) * 0.47 + (index % 11 === 0 ? 0.4 : 0);
      const size = 0.11 + (index % 6) * 0.055;
      const tile = new THREE.Mesh(
        new THREE.BoxGeometry(size, size * (index % 4 === 0 ? 1.75 : 1), 0.07),
        ringMaterials[index % 3],
      );
      tile.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, Math.sin(index * 2.7) * 0.23);
      tile.rotation.z = angle + Math.sin(index * 4.1) * 0.55;
      ring.add(tile);
    }
    ring.add(new THREE.Mesh(
      new THREE.TorusGeometry(1.7, 0.012, 5, 128),
      new THREE.MeshBasicMaterial({ color: "#b9e566", transparent: true, opacity: 0.22 }),
    ));

    const starsGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(260 * 3);
    for (let i = 0; i < 260; i++) {
      positions[i * 3] = (Math.sin(i * 91.73) * 0.5 + 0.5) * 34 - 17;
      positions[i * 3 + 1] = (Math.sin(i * 33.19) * 0.5 + 0.5) * 12;
      positions[i * 3 + 2] = (Math.sin(i * 57.71) * 0.5 + 0.5) * 24 - 12;
    }
    starsGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(
      starsGeometry,
      new THREE.PointsMaterial({ color: "#d5f86c", size: 0.047, transparent: true, opacity: 0.72 }),
    );
    scene.add(stars);

    const city = new THREE.Group();
    const cityMaterials: THREE.MeshStandardMaterial[] = [];
    const cityEdges: THREE.LineBasicMaterial[] = [];
    scene.add(city);
    for (let i = 0; i < 28; i++) {
      const x = i % 2 ? 5.7 + (i % 7) * 1.25 : -5.7 - (i % 7) * 1.25;
      const z = -5 - Math.floor(i / 2) * 1.2;
      const height = 3.2 + (i % 5) * 1.4;
      const width = 0.48 + (i % 3) * 0.26;
      const towerMaterial = new THREE.MeshStandardMaterial({
        color: "#1e281b", metalness: 0.55, roughness: 0.5, transparent: true, opacity: 0,
      });
      cityMaterials.push(towerMaterial);
      const tower = new THREE.Mesh(new THREE.BoxGeometry(width, height, width), towerMaterial);
      tower.position.set(x, height / 2 - 0.2, z);
      city.add(tower);
      const edgeMaterial = new THREE.LineBasicMaterial({ color: "#a2cf5b", transparent: true, opacity: 0 });
      cityEdges.push(edgeMaterial);
      tower.add(new THREE.LineSegments(new THREE.EdgesGeometry(tower.geometry), edgeMaterial));
    }

    const actors: Actor[] = [];
    const loader = new GLTFLoader();
    let disposed = false;
    Promise.all(actorSpecs.map(async (spec, index) => {
      try {
        const gltf = await loader.loadAsync(`/motion/animals/${spec.model}.glb`);
        if (disposed) return;
        const figure = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(figure);
        const size = new THREE.Vector3();
        bounds.getSize(size);
        const scale = spec.height / Math.max(size.y, 0.01);
        figure.scale.setScalar(scale);
        figure.position.y = -bounds.min.y * scale;
        figure.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.castShadow = true;
            object.receiveShadow = true;
          }
        });
        const group = new THREE.Group();
        group.add(figure);
        group.rotation.y = spec.angle;
        group.position.set(spec.x, -0.21, spec.z - 8);
        scene.add(group);
        actors.push({
          group,
          start: new THREE.Vector3(spec.x + (index % 2 ? 1.8 : -1.8), -0.21, spec.z - 8),
          target: new THREE.Vector3(spec.x, -0.21, spec.z),
          delay: index * 0.11,
          phase: index * 1.27,
        });
      } catch (error) {
        console.error("Animal model could not be loaded", spec.model, error);
      }
    })).then(() => { if (!disposed) onReady?.(); });

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(mount.clientWidth, mount.clientHeight), 0.62, 0.42, 0.76);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    const started = performance.now();
    let frame = 0;
    let scroll = 0;
    let visible = true;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(mount);
    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      if (!width || !height) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      composer.setSize(width, height);
    };
    const onScroll = () => {
      const track = mount.closest(".desktop-motion-track");
      if (!track) return;
      const rect = track.getBoundingClientRect();
      scroll = THREE.MathUtils.clamp(-rect.top / Math.max(1, rect.height - window.innerHeight), 0, 1);
    };
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    const render = () => {
      frame = window.requestAnimationFrame(render);
      const elapsed = (performance.now() - started) / 1000;
      const entered = smoothstep((elapsed - 0.5) / 2.2);
      ring.rotation.z = elapsed * 0.055 + scroll * 0.5;
      ring.rotation.y = Math.sin(elapsed * 0.21) * 0.17 + scroll * 0.32;
      ring.scale.setScalar(0.6 + entered * 0.4 + Math.sin(elapsed * 0.8) * 0.012);
      ring.position.z = -3.2 - scroll * 4.4;
      backlight.intensity = 13 + Math.sin(elapsed * 1.4) * 2.5;
      ringMaterials[0].emissiveIntensity = 1.22 + Math.sin(elapsed * 1.3) * 0.16;
      stars.rotation.y = elapsed * 0.004;
      actors.forEach(({ group, target, start, delay, phase }) => {
        const arrival = smoothstep((elapsed - 0.45 - delay) / 1.8);
        group.position.lerpVectors(start, target, arrival);
        group.position.y += Math.sin(elapsed * 1.18 + phase) * 0.014;
        group.position.z -= scroll * (2.4 + phase * 0.18);
        group.rotation.y += Math.sin(elapsed * 0.45 + phase) * 0.0003;
      });
      camera.position.x = scroll * 3.3 + Math.sin(elapsed * 0.22) * 0.08;
      camera.position.y = 3.2 + scroll * 1.65;
      camera.position.z = 12 - scroll * 4.8;
      camera.lookAt(0, 2.75, -1.4 - scroll * 5);
      const reveal = smoothstep((scroll - 0.08) / 0.28);
      city.visible = reveal > 0.002;
      cityMaterials.forEach((item) => { item.opacity = reveal * 0.9; });
      cityEdges.forEach((item) => { item.opacity = reveal * 0.32; });
      city.position.z = scroll * 1.4;
      if (visible && !document.hidden) composer.render();
    };
    render();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.Points || object instanceof THREE.LineSegments) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((item) => item.dispose());
        }
      });
      composer.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onReady]);

  return <div ref={mountRef} className="desktop-motion-canvas" aria-hidden="true" />;
}
