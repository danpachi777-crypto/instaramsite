import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/addons/loaders/KTX2Loader.js";
import { Reflector } from "three/addons/objects/Reflector.js";
import { createWorldScreening } from "./world-screening";
import {
  createReferenceAtmosphere,
  atmosphereFragment,
} from "./reference-atmosphere";

type Placement = [number[], number[], number[], { section?: number | false }];
type Path = [number[][], { stops: number[] }];
export type WorldLayout = {
  paths: { cam: Path; tgt: Path; reveal: Path };
  objects: Record<string, Placement[]>;
  city0: Placement[];
  city1: Placement[];
  city2: Placement[];
  people: Placement[];
  cars: Record<string, number[][]>;
  signs: Record<string, Placement[]>;
};

const vertex = /* glsl */ `
  varying vec2 surfaceUv;
  varying vec3 worldPosition;
  varying vec3 painted;
  void main() {
    surfaceUv = uv;
    painted = color.rgb;
    vec4 world = modelMatrix * vec4(position, 1.0);
    worldPosition = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;
// Baked lighting retains the reference geometry's surface detail. A palette
// mapping preserves MOTION's olive/lime colours without baking new flat images.
const fragment = /* glsl */ `
  uniform sampler2D lighting;
  uniform sampler2D detail;
  uniform sampler2D rails;
  uniform sampler2D pattern;
  uniform float useDetails;
  uniform float revealHeight;
  uniform float revealEnabled;
  varying vec2 surfaceUv;
  varying vec3 worldPosition;
  varying vec3 painted;
  ${atmosphereFragment}
  void main() {
    vec3 baked = texture2D(lighting, surfaceUv).rgb;
    float value = max(baked.r,max(baked.g,baked.b));
    float grain = texture2D(detail,surfaceUv*35.0).r;
    float balcony = texture2D(rails,surfaceUv).r;
    value *= mix(1.0,0.62+grain*0.76,useDetails*(1.0-painted.r));
    value += painted.r*balcony*0.1*useDetails;
    vec3 result = mix(vec3(0.006,0.01,0.004),vec3(0.24,0.32,0.1),pow(value,1.4));
    float cell = texture2D(pattern,surfaceUv*20.0).r;
    float edge = worldPosition.y - revealHeight - cell*11.1;
    if(revealEnabled>0.5 && edge>9.2) discard;
    float rim = revealEnabled*smoothstep(0.0,4.7,edge);
    result = mix(result,vec3(0.84,0.97,0.55)*0.65,rim);
    result = atmosphere(result,worldPosition);
    gl_FragColor=vec4(result,1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

function place(object: THREE.Object3D, transform: Placement) {
  object.position.fromArray(transform[0]);
  object.quaternion.fromArray(transform[1]);
  object.scale.fromArray(transform[2]);
}

export async function buildReferenceWorld(
  scene: THREE.Scene,
  renderer: THREE.WebGLRenderer,
  camera: THREE.PerspectiveCamera,
) {
  const root = new THREE.Group();
  scene.add(root);
  const air = createReferenceAtmosphere(root);
  const layout = (await fetch("/motion/world/layout.json").then((r) =>
    r.json(),
  )) as WorldLayout;
  const draco = new DRACOLoader().setDecoderPath("/motion/decoders/draco/");
  const ktx = new KTX2Loader()
    .setTranscoderPath("/motion/decoders/basis/")
    .setWorkerLimit(2)
    .detectSupport(renderer);
  const loader = new GLTFLoader().setDRACOLoader(draco);
  const textureCache = new Map<string, Promise<THREE.CompressedTexture>>();
  const texture = (name: string) => {
    if (!textureCache.has(name))
      textureCache.set(
        name,
        ktx.loadAsync("/motion/world/images/" + name + ".ktx2").then((t) => {
          t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.colorSpace = THREE.NoColorSpace;
          return t;
        }),
      );
    return textureCache.get(name)!;
  };
  const materials: { material: THREE.ShaderMaterial; section: number }[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const white = new THREE.DataTexture(
    new Uint8Array([128, 128, 128, 255]),
    1,
    1,
  );
  white.needsUpdate = true;
  const surface = async (map: string, details: boolean, section: number) => {
    const material = new THREE.ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: fragment,
      vertexColors: true,
      side: THREE.FrontSide,
      uniforms: {
        lighting: { value: await texture(map) },
        detail: { value: details ? await texture("walls-2") : white },
        rails: {
          value: details ? await texture("rails-" + map.split("-b")[0]) : white,
        },
        pattern: { value: details ? await texture("hex") : white },
        useDetails: { value: details ? 1 : 0 },
        revealHeight: { value: -55 },
        revealEnabled: { value: details ? 1 : 0 },
        ...air.uniforms,
      },
    });
    materials.push({ material, section });
    return material;
  };
  const geometry = async (name: string) => {
    const model = await loader.loadAsync(
      "/motion/world/models/" + name + ".glb",
    );
    const mesh = model.scene.children[0] as THREE.Mesh;
    const geo = mesh.geometry;
    if (!geo.getAttribute("color")) {
      geo.setAttribute(
        "color",
        new THREE.BufferAttribute(
          new Float32Array(geo.getAttribute("position").count * 3),
          3,
        ),
      );
    }
    geometries.push(geo);
    return geo;
  };
  await Promise.all(
    (["city0", "city1", "city2"] as const).map(async (name) => {
      const geo = await geometry(name);
      const maps = await Promise.all(
        [0, 1, 2, 3].map((i) =>
          surface(name + "-b" + i + "-lightmap", true, i),
        ),
      );
      layout[name].forEach((transform) => {
        const dummy = new THREE.Object3D();
        dummy.quaternion.fromArray(transform[1]);
        const angle = Math.round(THREE.MathUtils.radToDeg(dummy.rotation.y));
        const face = ((Math.round(angle / 90) % 4) + 4) % 4;
        const mesh = new THREE.Mesh(geo, maps[face]);
        place(mesh, transform);
        root.add(mesh);
      });
    }),
  );
  await Promise.all(
    [
      ["floor", "floor-lightmap"],
      ["base-top", "base-lightmap"],
      ["bridges", "bridges-lightmap"],
    ].map(async ([name, map]) => {
      const [geo, mat] = await Promise.all([
        geometry(name),
        surface(map, false, 0),
      ]);
      const mesh = new THREE.Mesh(geo, mat);
      place(mesh, layout.objects[name][0]);
      root.add(mesh);
    }),
  );
  const mirror = new Reflector(new THREE.PlaneGeometry(25.8, 25.8), {
    color: 0x5c7043,
    textureWidth: Math.round(renderer.domElement.width / 2),
    textureHeight: Math.round(renderer.domElement.height / 2),
    clipBias: 0.003,
  });
  mirror.rotation.x = -Math.PI / 2;
  mirror.position.y = 3.005;
  const mirrorMaterial = mirror.material as THREE.ShaderMaterial;
  mirrorMaterial.transparent = true;
  mirrorMaterial.fragmentShader = mirrorMaterial.fragmentShader
    .replace(
      "vec4 base = texture2DProj( tDiffuse, vUv );",
      `
      vec2 projected=vUv.xy/vUv.w;
      vec4 base=texture2D(tDiffuse,projected)*.4;
      base+=texture2D(tDiffuse,projected+vec2(.004,0.))*.15;
      base+=texture2D(tDiffuse,projected-vec2(.004,0.))*.15;
      base+=texture2D(tDiffuse,projected+vec2(0.,.004))*.15;
      base+=texture2D(tDiffuse,projected-vec2(0.,.004))*.15;
    `,
    )
    .replace(
      "#include <tonemapping_fragment>",
      "gl_FragColor.a = 0.28;\n#include <tonemapping_fragment>",
    );
  root.add(mirror);
  const renderReflection = mirror.onBeforeRender.bind(mirror);
  let mirrorFrame = 0;
  mirror.onBeforeRender = (...args) => {
    if (mirrorFrame++ % 2 === 0) renderReflection(...args);
  };

  const cameraPath = new THREE.CatmullRomCurve3(
    layout.paths.cam[0].map((p) => new THREE.Vector3().fromArray(p)),
  );
  const targetPath = new THREE.CatmullRomCurve3(
    layout.paths.tgt[0].map((p) => new THREE.Vector3().fromArray(p)),
  );
  cameraPath.arcLengthDivisions = 200;
  targetPath.arcLengthDivisions = 200;
  const stops = layout.paths.cam[1].stops.map((v) => v / 100);
  const targets = layout.paths.tgt[1].stops.map((v) => v / 100);
  const [car0, car1, carMap0, carMap1, matcap] = await Promise.all([
    geometry("car0"),
    geometry("car1"),
    texture("car0"),
    texture("car1"),
    texture("matcap"),
  ]);
  const screening = createWorldScreening(root);
  car0.rotateY(-Math.PI / 2);
  car1.rotateY(-Math.PI / 2);
  const carMaterials = [carMap0, carMap1].map(
    (map) => new THREE.MeshMatcapMaterial({ map, matcap, color: "#b1c98c" }),
  );
  const trailMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader:
      "varying vec2 trailUv;void main(){trailUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader:
      "varying vec2 trailUv;void main(){float strength=pow(1.-trailUv.x,2.)*pow(1.-abs(trailUv.y*2.-1.),2.);gl_FragColor=vec4(vec3(.67,.82,.4),strength*.8);}",
  });
  const flyingCars = Object.entries(layout.cars).map(([name, points], i) => {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3().fromArray(p)),
    );
    curve.arcLengthDivisions = 1024;
    const car = new THREE.Mesh(
      i % 2 ? car0 : car1,
      carMaterials[i % 2 ? 0 : 1],
    );
    root.add(car);
    const trailGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(26 * 2 * 3),
      uvs = new Float32Array(26 * 2 * 2),
      indices: number[] = [];
    for (let p = 0; p < 26; p++) {
      uvs.set([p / 25, 0, p / 25, 1], p * 4);
      if (p < 25) {
        const n = p * 2;
        indices.push(n, n + 1, n + 2, n + 1, n + 3, n + 2);
      }
    }
    trailGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage),
    );
    trailGeometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    trailGeometry.setIndex(indices);
    const trail = new THREE.Mesh(trailGeometry, trailMaterial);
    trail.frustumCulled = false;
    root.add(trail);
    return {
      name,
      curve,
      car,
      trail,
      length: curve.getLength(),
      phase: (i * 0.32) % 0.9,
    };
  });
  const up = new THREE.Vector3(0, 1, 0),
    forward = new THREE.Vector3(1, 0, 0),
    tangent = new THREE.Vector3(),
    side = new THREE.Vector3(),
    point = new THREE.Vector3();
  const signGeometry = await geometry("sign");
  const signMaterials: THREE.ShaderMaterial[] = [];
  await Promise.all(
    Object.entries(layout.signs).map(async ([name, placements]) => {
      const map = await texture("signs/sign_" + name.slice(5));
      const material = new THREE.ShaderMaterial({
        vertexShader: vertex,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          map: { value: map },
          time: { value: 0 },
          front: { value: -50 },
        },
        fragmentShader: `
        uniform sampler2D map;uniform float time;uniform float front;
        varying vec2 surfaceUv;varying vec3 worldPosition;
        void main(){
          if(worldPosition.y>front)discard;
          float mask=texture2D(map,surfaceUv).r;
          float pulse=.65+.35*sin(time*1.8+surfaceUv.y*8.);
          float haze=1.-smoothstep(24.,250.,distance(cameraPosition,worldPosition));
          gl_FragColor=vec4(vec3(.78,.94,.52)*pulse,mask*haze*.7);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      });
      signMaterials.push(material);
      placements.forEach((transform) => {
        if (transform[3].section === 0) return;
        const sign = new THREE.Mesh(signGeometry, material);
        place(sign, transform);
        root.add(sign);
      });
    }),
  );
  await renderer.compileAsync(scene, camera);
  let revealStart: number | null = null;
  return {
    layout,
    update(
      progress: number,
      time: number,
      intro: number,
      mouse: THREE.Vector2,
      openingSpread = 0,
    ) {
      air.update(progress);
      if (progress > 0.008 && revealStart === null) revealStart = time;
      const revealTime = revealStart === null ? 0 : time - revealStart;
      signMaterials.forEach((material) => {
        material.uniforms.time.value = time;
        material.uniforms.front.value =
          -55 + Math.min(revealTime / 10, 1) * 240;
      });
      for (const moving of flyingCars) {
        moving.car.visible = moving.trail.visible = revealStart !== null;
        if (revealStart === null) continue;
        const t = (revealTime * 0.05382 + moving.phase) % 0.9;
        const head = Math.min(0.97, t + 30 / moving.length);
        moving.car.position.copy(moving.curve.getPointAt(head));
        tangent.copy(moving.curve.getTangentAt(head)).normalize();
        moving.car.quaternion.setFromUnitVectors(forward, tangent);
        moving.car.position.y +=
          Math.sin(time * 0.2 * Math.PI * 2) *
          Math.sin(time * 0.3 * Math.PI * 2) *
          0.4;
        const positions = moving.trail.geometry.getAttribute(
          "position",
        ) as THREE.BufferAttribute;
        for (let p = 0; p < 26; p++) {
          const at = Math.max(0, head - ((p / 25) * 30) / moving.length);
          point.copy(moving.curve.getPointAt(at));
          tangent.copy(moving.curve.getTangentAt(at));
          side
            .crossVectors(tangent, up)
            .normalize()
            .multiplyScalar(1 - p / 26);
          positions.setXYZ(
            p * 2,
            point.x + side.x,
            point.y + side.y,
            point.z + side.z,
          );
          positions.setXYZ(
            p * 2 + 1,
            point.x - side.x,
            point.y - side.y,
            point.z - side.z,
          );
        }
        positions.needsUpdate = true;
      }
      materials.forEach(({ material, section }) => {
        material.uniforms.revealHeight.value =
          -55 + Math.min(revealTime / (8 + section * 1.1), 1) * 240;
      });
      let targetProgress = 0;
      for (let i = 0; i < stops.length - 1; i++) {
        if (progress >= stops[i]) {
          const local = THREE.MathUtils.clamp(
            (progress - stops[i]) / (stops[i + 1] - stops[i]),
            0,
            1,
          );
          targetProgress = THREE.MathUtils.lerp(
            targets[i],
            targets[i + 1],
            local,
          );
        }
      }
      camera.position.copy(cameraPath.getPointAt(progress));
      camera.lookAt(targetPath.getPointAt(targetProgress));
      const entrance = 1 - Math.pow(1 - intro, 5);
      camera.translateY(5 * (1 - entrance));
      camera.translateZ(15 * (1 - entrance));
      const pitch = THREE.MathUtils.smoothstep((progress - 0.86) / 0.13, 0, 1);
      camera.rotateX(1.35 * pitch);
      const pivot = progress < 0.20465599 ? 15 : progress < 0.451908 ? 10 : 12;
      camera.translateZ(-pivot);
      camera.rotateY(-mouse.x * 0.05);
      camera.rotateX(mouse.y * 0.035);
      camera.translateZ(pivot);
      camera.position.x += Math.sin(time * 0.21) * 0.026;
      camera.position.y += Math.sin(time * 0.17 + 1.2) * 0.02;
      screening.update(progress, time, openingSpread, camera);
      mirror.visible = progress < 0.14;
    },
    dispose() {
      flyingCars.forEach(({ car, trail }) => {
        car.removeFromParent();
        trail.removeFromParent();
        trail.geometry.dispose();
      });
      carMaterials.forEach((material) => material.dispose());
      trailMaterial.dispose();
      signMaterials.forEach((material) => material.dispose());
      screening.dispose();
      air.dispose();
      root.removeFromParent();
      materials.forEach(({ material }) => material.dispose());
      geometries.forEach((g) => g.dispose());
      mirror.dispose();
      white.dispose();
      void Promise.all(textureCache.values()).then((textures) =>
        textures.forEach((t) => t.dispose()),
      );
      draco.dispose();
      ktx.dispose();
    },
  };
}
