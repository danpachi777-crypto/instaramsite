import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { CinemaWork } from "./cinema-timeline";
import { screenCopy } from "./screen-copy";
import { interfaceFontFamily } from "../lib/typography";

function roundedOutline(width: number, height: number, radius: number) {
  const shape = new THREE.Shape();
  const x = -width / 2, y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

export function createCinemaScreen(index: number, work?: CinemaWork) {
  const group = new THREE.Group();
  group.position.set(0, 5, -8 - index * 24);
  const materials: THREE.Material[] = [];
  const textures: THREE.Texture[] = [];
  let disposed = false;
  const housing = new THREE.MeshStandardMaterial({
    color: "#292c28", metalness: 0.05, roughness: 0.88,
    envMapIntensity: 0.08, transparent: true, opacity: 1,
  });
  const bezelMaterial = new THREE.MeshPhysicalMaterial({
    color: "#050605", metalness: 0, roughness: 1,
    sheen: 0.7, sheenColor: "#12150f", sheenRoughness: 1,
    specularIntensity: 0.04, clearcoat: 0,
    envMapIntensity: 0.025, transparent: true, opacity: 1,
  });
  const darkMaterial = new THREE.MeshStandardMaterial({
    color: "#050705", metalness: 0, roughness: 0.98, envMapIntensity: 0,
    transparent: true, opacity: 1,
  });
  for (const material of [housing, bezelMaterial, darkMaterial]) {
    material.userData.restOpacity = 1;
    materials.push(material);
  }
  // Deep matte housing and a light-absorbing velvet bezel keep attention on the image.
  const chassis = new THREE.Mesh(new RoundedBoxGeometry(14.46, 8.33, 0.86, 4, 0.13), housing);
  chassis.name = "display-chassis";
  chassis.position.z = -0.4;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  group.add(chassis);
  const rear = new THREE.Mesh(new RoundedBoxGeometry(14.12, 8, 0.08, 3, 0.1), darkMaterial);
  rear.position.z = -0.87;
  group.add(rear);
  const bezelShape = roundedOutline(14.36, 8.23, 0.13);
  const aperture = roundedOutline(14.06, 7.935, 0.065);
  bezelShape.holes.push(new THREE.Path(aperture.getPoints(10).reverse()));
  const bezel = new THREE.Mesh(new THREE.ExtrudeGeometry(bezelShape, {
    depth: 0.085, bevelEnabled: true, bevelThickness: 0.012,
    bevelSize: 0.012, bevelSegments: 2, curveSegments: 10, steps: 1,
  }), bezelMaterial);
  bezel.name = "display-bezel";
  bezel.position.z = 0.2;
  bezel.castShadow = true;
  group.add(bezel);
  const well = new THREE.Mesh(new RoundedBoxGeometry(14.12, 8, 0.035, 3, 0.07), darkMaterial);
  well.position.z = 0.04;
  well.receiveShadow = true;
  group.add(well);
  const vents = new THREE.InstancedMesh(new THREE.BoxGeometry(0.04, 0.46, 0.014), darkMaterial, 24);
  const ventPose = new THREE.Object3D();
  for (let slot = 0; slot < 24; slot++) {
    ventPose.position.set((slot - 11.5) * 0.19, -2.96, -0.918);
    ventPose.updateMatrix();
    vents.setMatrixAt(slot, ventPose.matrix);
  }
  group.add(vents);
  const canvas = document.createElement("canvas");
  canvas.width = 1600;
  canvas.height = 900;
  const context = canvas.getContext("2d")!;
  const copy = screenCopy[Math.min(screenCopy.length - 1, Math.max(0, index - 1))];
  const paintPlaceholder = () => {
    const gradient = context.createRadialGradient(800, 400, 20, 800, 450, 950);
    gradient.addColorStop(0, "#1b2317");
    gradient.addColorStop(0.7, "#10170a");
    gradient.addColorStop(1, "#080d06");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1600, 900);
    context.fillStyle = "#adbb9959";
    context.font = `400 20px ${interfaceFontFamily}`;
    context.textAlign = "left";
    context.textBaseline = "alphabetic";
    context.fillText(index === 0 ? "MOTION / PREVIEW" : `MOTION / SCREEN ${String(index).padStart(2, "0")}`, 70, 70);
    context.fillStyle = "#e4e9da";
    context.font = `400 44px ${interfaceFontFamily}`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(copy.join(""), 800, 450, 1400);
  };
  paintPlaceholder();
  const placeholder = new THREE.CanvasTexture(canvas);
  placeholder.colorSpace = THREE.SRGBColorSpace;
  textures.push(placeholder);
  if (document.fonts) {
    void document.fonts.ready.then(() => {
      if (disposed) return;
      paintPlaceholder();
      placeholder.needsUpdate = true;
    });
  }
  const projection = new THREE.MeshBasicMaterial({
    map: placeholder,
    transparent: true,
    color: "#e4e9da",
    depthWrite: false,
    side: THREE.FrontSide,
  });
  projection.userData.restOpacity = 1;
  materials.push(projection);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(14, 7.875), projection);
  screen.name = "display-projection";
  screen.position.z = 0.09;
  group.add(screen);
  let video: HTMLVideoElement | null = null;
  let playing = false;
  const setMedia = (texture: THREE.Texture, aspect: number) => {
    if (disposed) { texture.dispose(); return; }
    texture.colorSpace = THREE.SRGBColorSpace;
    textures.push(texture);
    projection.map = texture;
    projection.needsUpdate = true;
    const displayAspect = 16 / 9;
    screen.scale.set(Math.min(1, aspect / displayAspect), Math.min(1, displayAspect / aspect), 1);
  };
  if (work?.previewUrl) {
    video = document.createElement("video");
    video.crossOrigin = "anonymous";
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.addEventListener("loadeddata", () => {
      if (video && !disposed) setMedia(new THREE.VideoTexture(video), video.videoWidth / video.videoHeight);
    }, { once: true });
    video.src = work.previewUrl;
  } else if (work?.posterUrl) {
    new THREE.TextureLoader().load(work.posterUrl, texture => {
      const image = texture.image as HTMLImageElement;
      setMedia(texture, image.width / image.height);
    }, undefined, () => { /* Keep the planned-screen artwork if media is unavailable. */ });
  }
  return {
    group,
    update(opacity: number, play: boolean) {
      group.visible = opacity > 0.005;
      materials.forEach(material => { material.opacity = opacity * (material.userData.restOpacity as number); });
      if (video && play !== playing) {
        playing = play;
        if (play) void video.play().catch(() => { /* Muted autoplay may still be blocked. */ });
        else video.pause();
      }
    },
    dispose() {
      disposed = true;
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
      textures.forEach(texture => texture.dispose());
      group.traverse(object => {
        if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments) object.geometry.dispose();
      });
      materials.forEach(material => material.dispose());
      group.removeFromParent();
    },
  };
}
