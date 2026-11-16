import * as THREE from "three";

// The measured atmosphere combines three spatial light volumes with separate
// depth and height falloff. Colours are mapped into MOTION's existing palette.
export const atmosphereFragment = /* glsl */ `
  uniform vec3 mistPositions[3];
  uniform vec3 mistColours[3];
  uniform vec3 mistRanges[3];
  uniform vec2 mistDepth;
  uniform vec2 mistHeight;
  uniform vec3 mistOverlay;
  uniform float mistOverlayMix;
  vec3 atmosphere(vec3 surface,vec3 position){
    vec3 air=surface;
    for(int i=0;i<3;i++){
      float falloff=1.-smoothstep(mistRanges[i].x,mistRanges[i].y,distance(position,mistPositions[i]));
      air=mix(air,mistColours[i],falloff*mistRanges[i].z);
    }
    air=mix(air,mistOverlay,mistOverlayMix);
    float depth=-(viewMatrix*vec4(position,1.)).z;
    float depthAmount=smoothstep(mistDepth.x,mistDepth.y,depth);
    float heightAmount=1.-smoothstep(mistHeight.y,mistHeight.x,position.y-cameraPosition.y);
    return mix(mix(surface,air,depthAmount),air,heightAmount);
  }
`;

export function createReferenceAtmosphere(root: THREE.Object3D) {
  const positions = [
    new THREE.Vector3(-190, 263, -258),
    new THREE.Vector3(-296, 20, -17),
    new THREE.Vector3(146, 6.7, -230),
  ];
  const ranges = [
    new THREE.Vector3(0, 467.4, 0),
    new THREE.Vector3(50, 869.6, 1),
    new THREE.Vector3(16.9, 750, 0),
  ];
  const starts = [
    new THREE.Color("#556d32"),
    new THREE.Color("#748d3a"),
    new THREE.Color("#101b0a"),
  ];
  const ends = [
    new THREE.Color("#bdd984"),
    new THREE.Color("#566d2d"),
    new THREE.Color(0),
  ];
  const colours = starts.map((colour) => colour.clone());
  const overlayEnd = new THREE.Color("#17220b");
  const screenTint = new THREE.Color("#a5aaa2");
  const globeTint = new THREE.Color("#39786e");
  const globeOverlay = new THREE.Color("#0a1c1b");
  const uniforms = {
    mistPositions: { value: positions },
    mistColours: { value: colours },
    mistRanges: { value: ranges },
    mistDepth: { value: new THREE.Vector2(0, 37) },
    mistHeight: { value: new THREE.Vector2(-15.2, -75) },
    mistOverlay: { value: new THREE.Color(0) },
    mistOverlayMix: { value: 0.7065 },
  };
  const skyMaterial = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader:
      "varying vec3 worldPoint;void main(){vec4 world=modelMatrix*vec4(position,1.);worldPoint=world.xyz;gl_Position=projectionMatrix*viewMatrix*world;}",
    fragmentShader: `
      varying vec3 worldPoint;
      ${atmosphereFragment}
      void main(){
        gl_FragColor=vec4(atmosphere(vec3(0.),worldPoint),1.);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(250, 48, 32),
    skyMaterial,
  );
  sky.position.y = 249;
  sky.renderOrder = -1;
  root.add(sky);
  return {
    uniforms,
    update(progress: number) {
      const t = THREE.MathUtils.clamp(progress / 0.12, 0, 1),
        blend = (1 - Math.cos(t * Math.PI)) / 2;
      uniforms.mistDepth.value.set(
        23.91 * blend,
        THREE.MathUtils.lerp(37, 250, blend),
      );
      uniforms.mistHeight.value.set(
        THREE.MathUtils.lerp(-15.2, -47.8, blend),
        THREE.MathUtils.lerp(-75, -64.1, blend),
      );
      uniforms.mistOverlay.value.copy(overlayEnd).multiplyScalar(blend);
      uniforms.mistOverlayMix.value = THREE.MathUtils.lerp(0.7065, 0.51, blend);
      positions[0].y = THREE.MathUtils.lerp(263, 50, blend);
      ranges[0].set(0, THREE.MathUtils.lerp(467.4, 369.6, blend), blend);
      ranges[1].set(50, THREE.MathUtils.lerp(869.6, 260.87, blend), 1);
      ranges[2].set(
        THREE.MathUtils.lerp(16.9, 16.85, blend),
        THREE.MathUtils.lerp(750, 288.04, blend),
        1.304 * blend,
      );
      colours.forEach((colour, i) =>
        colour.lerpColors(starts[i], ends[i], blend),
      );
      // Gentle neutral light around the screenings, then teal in the globe scene.
      const screenMix = Math.max(...[0.20465599, 0.451908, 0.70932404].map(stop =>
        Math.max(0, 1 - Math.abs(progress - stop) / 0.075))) * 0.38;
      const globeMix = THREE.MathUtils.smoothstep(progress, 0.79, 0.97);
      colours.forEach((colour, i) => {
        if (i < 2) colour.lerp(screenTint, screenMix).lerp(globeTint, globeMix * 0.65);
      });
      uniforms.mistOverlay.value.lerp(globeOverlay, globeMix);
    },
    dispose() {
      sky.removeFromParent();
      sky.geometry.dispose();
      skyMaterial.dispose();
    },
  };
}
