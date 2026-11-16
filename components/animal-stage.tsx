"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/addons/shaders/FXAAShader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { createGlassPhone } from "./glass-phone";
import { phoneSpread } from "./cinema-timeline";
import { buildReferenceWorld } from "./reference-world";
import { sceneProgress } from "./scene-timeline";
import phoneLayout from "../public/motion/world/phone-layout.json";

type Actor = {
  group: THREE.Group;
  start: THREE.Vector3;
  target: THREE.Vector3;
  delay: number;
  phase: number;
  angle: number;
};

const actorSpecs = [
  { model: "cat", x: -9.11147, z: -2.714656, height: 0.74, angle: 1.1 },
  { model: "dog", x: 6.740244, z: 1.60026, height: 1.02, angle: 0.8 },
  { model: "capybara", x: -4.851855, z: -8.106078, height: 0.78, angle: 0.55 },
  { model: "penguin", x: 3.780802, z: -3.392864, height: 0.93, angle: -0.4 },
  { model: "rabbit", x: -2.204973, z: 6.756413, height: 0.81, angle: -0.8 },
  { model: "cat", x: 2.061545, z: 6.527773, height: 0.74, angle: -1.1 },
  { model: "capybara", x: -2.498515, z: -4.37539, height: 0.56, angle: 0.75 },
  { model: "rabbit", x: 3.572883, z: -7.005407, height: 0.61, angle: -0.6 },
] as const;

function smoothstep(value: number) {
  const x = THREE.MathUtils.clamp(value, 0, 1);
  return x * x * (3 - 2 * x);
}

export function AnimalStage({
  onReady,
  active,
}: {
  onReady?: () => void;
  active: boolean;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      onReady?.();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const room = new RoomEnvironment();
    const environmentGenerator = new THREE.PMREMGenerator(renderer);
    const environment = environmentGenerator.fromScene(room, 0.04);
    room.dispose();
    environmentGenerator.dispose();
    scene.environment = environment.texture;
    scene.environmentIntensity = 0.35;
    scene.fog = new THREE.Fog("#10140e", 0, 80);
    const camera = new THREE.PerspectiveCamera(
      45,
      mount.clientWidth / mount.clientHeight,
      1,
      500,
    );
    camera.filmGauge = 100;
    camera.setFocalLength(80);
    camera.position.set(0, 3.2, 12);
    camera.lookAt(0, 2.7, -1);
    scene.add(new THREE.AmbientLight("#c6d4ae", 0.24));

    const key = new THREE.SpotLight("#d7e7c3", 4.2, 24, Math.PI / 3.2, 0.8, 1.4);
    key.position.set(-6, 9, 7);
    key.target.position.set(0, 0.4, 0);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    scene.add(key, key.target);
    const backlight = new THREE.PointLight("#d5f86c", 9, 19, 1.5);
    backlight.position.set(0, 6.6, -1);
    scene.add(backlight);
    const side = new THREE.PointLight("#86a65b", 2.7, 16);
    side.position.set(6, 2.7, 3.5);
    scene.add(side);

    const ring = new THREE.Group();
    ring.position.set(0, 6.632504, 1.147684);
    scene.add(ring);
    const phoneCount = phoneLayout.length;
    const phoneModel = createGlassPhone();
    const phoneParts: { mesh: THREE.InstancedMesh; local: THREE.Matrix4 }[] = [];
    phoneModel.group.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      const mesh = new THREE.InstancedMesh(object.geometry, object.material, phoneCount);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      mesh.frustumCulled = false;
      ring.add(mesh);
      phoneParts.push({ mesh, local: new THREE.Matrix4().makeScale(0.49 / 2.7, 0.49 / 2.7, 0.49 / 2.7).multiply(object.matrixWorld) });
    });
    const phonePose = new THREE.Object3D();
    const phoneForward = new THREE.Vector3(0, 0, 1);
    const phoneNormal = new THREE.Vector3();
    const partMatrix = new THREE.Matrix4();

    const starsGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(3000 * 3);
    for (let i = 0; i < 3000; i++) {
      positions[i * 3] = Math.sin(i * 91.73) * 30;
      positions[i * 3 + 1] = Math.sin(i * 33.19) * 20;
      positions[i * 3 + 2] = Math.sin(i * 57.71) * 20;
    }
    starsGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3),
    );
    const dotCanvas = document.createElement("canvas");
    dotCanvas.width = dotCanvas.height = 32;
    const dotContext = dotCanvas.getContext("2d")!;
    const gradient = dotContext.createRadialGradient(16, 16, 0, 16, 16, 16);
    gradient.addColorStop(0, "#ffffff");
    gradient.addColorStop(0.12, "#f4ffd8");
    gradient.addColorStop(0.35, "#9fc94c80");
    gradient.addColorStop(1, "#8aa23f00");
    dotContext.fillStyle = gradient;
    dotContext.fillRect(0, 0, 32, 32);
    const dustTexture = new THREE.CanvasTexture(dotCanvas);
    const stars = new THREE.Points(
      starsGeometry,
      new THREE.PointsMaterial({
        color: "#e2f6b5",
        size: 0.14,
        map: dustTexture,
        transparent: true,
        opacity: 0.4,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    scene.add(stars);

    const actors: Actor[] = [];
    const loader = new GLTFLoader();
    const silhouette = new THREE.MeshStandardMaterial({
      color: "#010201",
      roughness: 1,
      metalness: 0,
    });
    let disposed = false;
    const worldPromise = buildReferenceWorld(scene, renderer, camera);
    let world: Awaited<ReturnType<typeof buildReferenceWorld>> | null = null;
    worldPromise
      .then((rig) => {
        if (disposed) rig.dispose();
        else world = rig;
      })
      .catch((error) => console.error("World loading failed", error));
    const actorPromise = Promise.all(
      actorSpecs.map(async (spec, index) => {
        try {
          const gltf = await loader.loadAsync(
            `/motion/animals/${spec.model}.glb`,
          );
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
              const originals = Array.isArray(object.material)
                ? object.material
                : [object.material];
              originals.forEach((item: THREE.Material) => item.dispose());
              object.material = silhouette;
              object.castShadow = true;
              object.receiveShadow = true;
            }
          });
          const group = new THREE.Group();
          group.add(figure);
          group.rotation.y = spec.angle;
          group.position.set(spec.x, 3, spec.z);
          scene.add(group);
          actors.push({
            group,
            start: new THREE.Vector3(spec.x, 3, spec.z),
            target: new THREE.Vector3(spec.x, 3, spec.z),
            delay: index * 0.11,
            phase: index * 1.27,
            angle: spec.angle,
          });
        } catch (error) {
          console.error("Animal model could not be loaded", spec.model, error);
        }
      }),
    );
    Promise.all([worldPromise, actorPromise])
      .then(() => {
        if (!disposed) onReady?.();
      })
      .catch((error) => {
        console.error("Scene is incomplete", error);
        if (!disposed) onReady?.();
      });

    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const fxaa = new ShaderPass(FXAAShader);
    fxaa.uniforms.resolution.value.set(
      1 / renderer.domElement.width,
      1 / renderer.domElement.height,
    );
    composer.addPass(fxaa);
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(mount.clientWidth, mount.clientHeight),
      0.55,
      0.45,
      0.95,
    );
    composer.addPass(bloom);
    composer.addPass(
      new ShaderPass({
        uniforms: {
          tDiffuse: { value: null },
          bend: { value: -0.068272 },
          fringe: { value: 0.0014 },
        },
        vertexShader:
          "varying vec2 screenUv;void main(){screenUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
        fragmentShader: `
        uniform sampler2D tDiffuse;uniform float bend;uniform float fringe;varying vec2 screenUv;
        void main(){
          vec2 relative=screenUv-.5;
          vec2 lens=screenUv+relative*dot(relative,relative)*bend;
          vec2 offset=relative*fringe;
          gl_FragColor=vec4(texture2D(tDiffuse,lens+offset).r,texture2D(tDiffuse,lens).g,texture2D(tDiffuse,lens-offset).b,1.);
        }
      `,
      }),
    );
    composer.addPass(new OutputPass());
    let started: number | null = null;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    let previous = performance.now();
    let frame = 0;
    let scroll = 0;
    let targetScroll = 0;
    const pointer = new THREE.Vector2();
    const smoothPointer = new THREE.Vector2();
    const onPointer = (event: PointerEvent) => {
      pointer.set(
        (event.clientX / window.innerWidth) * 2 - 1,
        1 - (event.clientY / window.innerHeight) * 2,
      );
    };
    window.addEventListener("pointermove", onPointer, { passive: true });
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
      camera.setFocalLength(80);
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      composer.setSize(width, height);
      fxaa.uniforms.resolution.value.set(
        1 / renderer.domElement.width,
        1 / renderer.domElement.height,
      );
    };
    const onScroll = () => {
      const track = mount.closest(".desktop-motion-track");
      if (!track) return;
      const rect = track.getBoundingClientRect();
      targetScroll = sceneProgress(-rect.top / window.innerHeight);
      visible = rect.bottom + window.innerHeight * 2 > 0;
    };
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    const render = () => {
      frame = window.requestAnimationFrame(render);
      const now = performance.now();
      const delta = Math.min((now - previous) / 1000, 0.05);
      previous = now;
      if (!visible || document.hidden) return;
      if (activeRef.current && started === null) started = now;
      const elapsed = reducedMotion
        ? 10
        : started === null
          ? 0
          : (now - started) / 1000;
      scroll = THREE.MathUtils.damp(scroll, targetScroll, 7, delta);
      smoothPointer.lerp(pointer, 1 - Math.exp(-2.45 * delta));
      const entered = smoothstep((elapsed - 0.5) / 2.2);
      const spread = Math.max(smoothstep((elapsed - 3.5) / 2.3), smoothstep(scroll / 0.07));
      ring.visible = spread < 0.999;
      ring.rotation.z = elapsed * 0.065;
      ring.rotation.y = Math.sin(elapsed * 0.21) * 0.12;
      ring.scale.setScalar(0.8 + entered * 0.2);
      ring.position.z = 1.147684;
      if (ring.visible)
        for (let i = 0; i < phoneCount; i++) {
          const blueprint = phoneLayout[i];
          const phase = i * 2.399963;
          phonePose.position
            .fromArray([...phoneSpread(blueprint.center, i, spread)])
            .multiplyScalar(0.75 + entered * 0.25);
          phonePose.quaternion.setFromUnitVectors(
            phoneForward,
            phoneNormal.fromArray(blueprint.normal).normalize(),
          );
          phonePose.rotateZ(Math.sin(phase) * 0.35 + elapsed * 0.02 + spread * Math.sin(i) * 0.5);
          phonePose.rotateY(spread * Math.sin(i * 0.7));
          phonePose.scale.setScalar(
            blueprint.size / 0.49,
          );
          phonePose.updateMatrix();
          phoneParts.forEach(({ mesh, local }) => mesh.setMatrixAt(i, partMatrix.multiplyMatrices(phonePose.matrix, local)));
        }
      if (ring.visible)
        phoneParts.forEach(({ mesh }) => {
          mesh.instanceMatrix.needsUpdate = true;
        });
      phoneModel.fade(1 - smoothstep((spread - 0.9) / 0.1));
      backlight.intensity = (6 + spread * 2) * (1 - spread) + 1.8;
      stars.rotation.y = elapsed * 0.004;
      actors.forEach(({ group, target, start, delay, phase, angle }) => {
        const arrival = smoothstep((elapsed - 0.45 - delay) / 1.8);
        group.position.lerpVectors(start, target, arrival);
        group.position.y += Math.sin(elapsed * 1.18 + phase) * 0.014;

        group.rotation.y = angle + Math.sin(elapsed * 0.45 + phase) * 0.035;
      });
      world?.update(scroll, elapsed, Math.min(elapsed / 3, 1), smoothPointer, spread);
      stars.position.copy(camera.position);
      if (visible && !document.hidden) composer.render();
    };
    render();

    return () => {
      disposed = true;
      world?.dispose();
      window.removeEventListener("pointermove", onPointer);
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      scene.traverse((object) => {
        if (
          object instanceof THREE.Mesh ||
          object instanceof THREE.Points ||
          object instanceof THREE.LineSegments
        ) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((item) => item.dispose());
        }
      });
      composer.dispose();
      dustTexture.dispose();
      scene.environment = null;
      environment.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [onReady]);

  return (
    <div ref={mountRef} className="desktop-motion-canvas" aria-hidden="true" />
  );
}
