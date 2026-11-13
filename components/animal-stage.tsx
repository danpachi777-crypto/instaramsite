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
  angle: number;
};

const actorSpecs = [
  { model: "cat", x: -5.4, z: -1.1, height: 0.74, angle: 1.1 },
  { model: "dog", x: -3.55, z: -0.8, height: 1.02, angle: 0.8 },
  { model: "capybara", x: -1.1, z: 0.2, height: 0.78, angle: 0.55 },
  { model: "penguin", x: 1.25, z: -0.2, height: 0.93, angle: -0.4 },
  { model: "rabbit", x: 3.3, z: -0.7, height: 0.81, angle: -0.8 },
  { model: "cat", x: 5.5, z: -1.2, height: 0.74, angle: -1.1 },
] as const;

function smoothstep(value: number) {
  const x = THREE.MathUtils.clamp(value, 0, 1);
  return x * x * (3 - 2 * x);
}

export function AnimalStage({ onReady, active }: { onReady?: () => void; active: boolean }) {
  const mountRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  useEffect(() => { activeRef.current = active; }, [active]);

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
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
      new THREE.MeshStandardMaterial({ color: "#11170f", emissive: "#182111", emissiveIntensity: 0.35, roughness: 0.32, metalness: 0.36 }),
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
    const phoneCount = 54;
    const frameMaterial = new THREE.MeshStandardMaterial({ color: "#788563", metalness: 0.8, roughness: 0.25 });
    const screenMaterial = new THREE.MeshStandardMaterial({
      color: "#a7cb64", emissive: "#8fb94b", emissiveIntensity: 0.75, roughness: 0.25,
    });
    const glassMaterial = new THREE.MeshStandardMaterial({ color: "#10180e", roughness: 0.2 });
    // Three instanced layers form every handset: metal frame, inset screen and camera bar.
    const phones = new THREE.InstancedMesh(new THREE.BoxGeometry(0.24, 0.49, 0.035), frameMaterial, phoneCount);
    const screens = new THREE.InstancedMesh(new THREE.BoxGeometry(0.208, 0.44, 0.008), screenMaterial, phoneCount);
    const cameras = new THREE.InstancedMesh(new THREE.BoxGeometry(0.075, 0.018, 0.009), glassMaterial, phoneCount);
    [phones, screens, cameras].forEach((mesh) => {
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      ring.add(mesh);
    });
    const phonePose = new THREE.Object3D();
    const screenOffset = new THREE.Matrix4().makeTranslation(0, 0, 0.022);
    const cameraOffset = new THREE.Matrix4().makeTranslation(0, 0.192, 0.028);
    const partMatrix = new THREE.Matrix4();

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
    const silhouette = new THREE.MeshStandardMaterial({ color: "#010201", roughness: 1, metalness: 0 });
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
            const originals = Array.isArray(object.material) ? object.material : [object.material];
            originals.forEach((item: THREE.Material) => item.dispose());
            object.material = silhouette;
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
          angle: spec.angle,
        });
      } catch (error) {
        console.error("Animal model could not be loaded", spec.model, error);
      }
    })).then(() => { if (!disposed) onReady?.(); });

    const composer = new EffectComposer(renderer);
    composer.renderTarget1.samples = 4;
    composer.renderTarget2.samples = 4;
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(mount.clientWidth, mount.clientHeight), 0.62, 0.42, 0.76);
    composer.addPass(bloom);
    composer.addPass(new OutputPass());
    let started: number | null = null;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let previous = performance.now();
    let frame = 0;
    let scroll = 0;
    let targetScroll = 0;
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
      targetScroll = THREE.MathUtils.clamp(-rect.top / Math.max(1, rect.height - window.innerHeight), 0, 1);
    };
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    const render = () => {
      frame = window.requestAnimationFrame(render);
      const now = performance.now();
      const delta = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      if (activeRef.current && started === null) started = now;
      const elapsed = reducedMotion ? 10 : started === null ? 0 : (now - started) / 1000;
      scroll = THREE.MathUtils.damp(scroll, targetScroll, 5.5, delta);
      const entered = smoothstep((elapsed - 0.5) / 2.2);
      const gather = smoothstep((elapsed - 3.5) / 2.3);
      const vanish = smoothstep((elapsed - 5.4) / 0.7);
      ring.visible = vanish < 1;
      ring.rotation.z = elapsed * 0.065;
      ring.rotation.y = Math.sin(elapsed * 0.21) * 0.12;
      ring.scale.setScalar(0.8 + entered * 0.2);
      ring.position.z = -3.2 - scroll * 4.4;
      for (let i = 0; i < phoneCount; i++) {
        const phase = i * 2.399963;
        const angle = i / phoneCount * Math.PI * 2 + elapsed * (0.06 + (i % 3) * 0.008);
        const radius = (2.05 + Math.sin(phase) * 0.4) * (1 - gather);
        phonePose.position.set(
          Math.cos(angle + gather * 1.8) * radius,
          Math.sin(angle + gather * 1.8) * radius,
          Math.sin(phase + elapsed * 0.25) * 0.24 * (1 - gather),
        );
        phonePose.rotation.set(Math.sin(phase + elapsed * 0.35) * 0.23 * (1 - gather), Math.cos(phase) * 0.38 * (1 - gather), Math.sin(phase) * 0.45 * (1 - gather));
        phonePose.scale.setScalar((0.72 + (i % 4) * 0.15) * (1 - gather * 0.85) * (1 - vanish));
        phonePose.updateMatrix();
        phones.setMatrixAt(i, phonePose.matrix);
        screens.setMatrixAt(i, partMatrix.multiplyMatrices(phonePose.matrix, screenOffset));
        cameras.setMatrixAt(i, partMatrix.multiplyMatrices(phonePose.matrix, cameraOffset));
      }
      [phones, screens, cameras].forEach((mesh) => { mesh.instanceMatrix.needsUpdate = true; });
      screenMaterial.emissiveIntensity = (0.65 + gather * 1.2) * (1 - vanish);
      backlight.intensity = (11 + gather * 4) * (1 - vanish) + 3;
      stars.rotation.y = elapsed * 0.004;
      actors.forEach(({ group, target, start, delay, phase, angle }) => {
        const arrival = smoothstep((elapsed - 0.45 - delay) / 1.8);
        group.position.lerpVectors(start, target, arrival);
        group.position.y += Math.sin(elapsed * 1.18 + phase) * 0.014;
        group.position.z -= scroll * (2.4 + phase * 0.18);
        group.rotation.y = angle + Math.sin(elapsed * 0.45 + phase) * 0.035;
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
