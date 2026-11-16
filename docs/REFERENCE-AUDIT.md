# qu.ai desktop reference audit

Reference: https://www.qu.ai/  
Capture viewport: 1440 × 900, device pixel ratio 1  
Audited: 2026-11-13

## Evidence collected

The private working audit is stored at `C:/Users/shota/quai-reference-audit`. It contains the response inventory (`network.json`), delivered HTML/CSS/JavaScript, formatted scripts for inspection, and runtime assets. Third-party application JavaScript is kept out of this repository.

The delivered scene module was `9281.6bda0fb227ac8d8b.js`. Its material module was `1782.af267a64126224ff.js`. These identify scene construction, loading, camera movement, reveal animations, reflection and postprocessing. The scene layout is a JSON response at `/runtime/webgl/objectdata.unseen`, despite its extension.

## Confirmed construction

| Part | Observed implementation |
| --- | --- |
| Scroll | Lenis, 1.15 second duration, quartic ease out |
| Timeline | GSAP and ScrollTrigger; section-specific camera easing |
| Camera | Catmull–Rom position curve with 35 control points, target curve with 5 points |
| Lens | Film gauge 100, focal length 80, near 1, far 500 |
| Camera stops | 0, 20.465599, 45.1908, 70.932404, 100 percent |
| Target stops | 0, 26.3158, 50.675098, 78.520401, 100 percent |
| Geometry | Three city models, eight person models, floor, raised base, bridges and other scene objects |
| Lighting | Baked KTX2 maps, detail maps, procedural reveal materials and volumetric fog |
| Reflection | Separate reflected camera; reflection updated every other render; blurred reflection |
| Postprocessing | FXAA, bloom (strength 2.12, radius 1, threshold 0.717), lens distortion / colour fringe |
| Particles | 3,000 particles in a camera-relative volume |
| Logo | 165 separate four-vertex fragments, identified from connected geometry |
| English typography | Yapari 600, Monorama 400, Bai Jamjuree 400 |
| Hero heading at 1440 px | 79.1521 px font, 80.7352 px line height, 1384.03125 px wide, left 27.984375 px |
| Desktop root scale | 14 px + 6.2858 × ((viewport width − 1024 px) / 2816), capped at 20.2858 px |

At 1440 × 900 the measured document positions are:

| Flow element | Top | Height | Following bottom margin |
| --- | ---: | ---: | ---: |
| Hero trigger | 0 | 900 | 2250 |
| First description | 3150 | 900 | 4320 |
| Second description | 8370 | 900 | 4320 |
| Third description | 13590 | 900 | 4320 |
| Closing call to action | 18810 | 1800 | 80 |
| Lower resource panel | 20690 | 4332.09375 | 0 |

The local desktop layout now places its call to action at 18810 and its lower panel at 20690, matching these measured positions.

## Performance comparison

Measured sequentially in the same installed headless Chrome, at 1440 × 900 and DPR 1, after settling each page. Samples contain 120 animation-frame intervals. These are measurements on this machine, not a promise for other devices.

| Page / scroll | Median frame interval | 95th percentile |
| --- | ---: | ---: |
| Reference, top | 33.4 ms | 50.1 ms |
| Reference, 3600 px | 50 ms | 66.7 ms |
| Final local production build, top | 16.7 ms | 16.9 ms |
| Final local production build, 3600 px | 16.7 ms | 16.9 ms |
| Final local production build, 9000 px | 16.7 ms | 16.9 ms |
| Final local production build, 14000 px | 16.7 ms | 16.8 ms |

## Implementation based on the audit

- `components/reference-world.ts` loads scene geometry and baked maps, uses the measured camera path, and renders the reflection and reveal.
- `components/scene-timeline.ts` maps scroll distance through the observed camera stops and easing.
- `components/scene-exhibits.ts` implements the three moving centre exhibits in the observed positions. Its animation code is independently written.
- `components/voxel-hierarchy.ts` schedules lower-tier arrivals, feeds middle and upper tiers, settles the voxel cores, and draws the links and attached smaller blocks. The previous evenly spaced scrolling boxes have been replaced.
- `components/scene-medallion.ts` creates the layered metal rims, recessed faces, edge ribs, circuit traces and extruded MOTION / lightning emblems.
- `components/video-forge.ts` animates incoming objects along four curved lanes, a striking mechanism, impact rings, sparks, a voxel core and outgoing objects.
- `components/finale-rocket.ts` builds the final rocket, fins, engines, emissive plume, launch-pad rings and fade into the sky. The camera pitches upward during the measured final interval.
- `components/reference-atmosphere.ts` combines three spatial light volumes with the measured distance and height falloff. Its colour mapping is specific to MOTION.
- `public/motion/world/layout.json` contains the scene placement and camera data needed by this implementation.
- `public/motion/world/phone-layout.json` contains the 165 fragment centres, normals and sizes measured from the logo geometry. The implementation uses phone geometry in those positions.
- Basis and Draco decoders come from the installed Three.js package; their bundled licence is preserved.

User-directed differences remain intentional: MOTION's olive/lime colours, Japanese loading and hero text, phones that gather and disappear, smaller black animal silhouettes, and desktop-only activation.

The lower-page panels follow the reference's order and measured desktop dimensions: product introduction, three notes, four glance cards, six feature cards, a large video, three square editorial panels, four smaller videos and a five-column footer. The copy and destinations describe MOTION. The desktop registration dialog contains the existing single waitlist form; its demo-mode restriction remains in place.

The chapter markers navigate between real scroll anchors. The centre skip link, top menu, Escape handling, registration dialog and native video controls are functional. The mobile layout retains its three original header links and inline registration form, and does not mount the desktop scene canvas.

## Validation

- Production build and TypeScript compilation pass.
- Existing suite: 6 test files, 47 tests pass.
- Browser checks cover menu open / Escape close, registration open / Escape close, video playback, and no JavaScript errors or failed asset responses.
- Horizontal document width equals viewport width at 390, 1024, 1440 and 1920 pixels.
- Mobile at 390 × 844: desktop track hidden, original hero displayed, zero desktop canvases, three original header links.

The local performance numbers above were remeasured on the production build after the exhibit, rocket, atmosphere and local reference-font refinements. All four WebM clips were checked for advancing playback time and 1440 × 810 video dimensions. The four poster images were regenerated at 2880 × 1800.

## Outstanding comparison

The comparison has covered geometry, placement, camera movement, loading, the main scroll sequence, the final rocket and lower-page layout. This is an independent implementation, not a pixel-identical copy of the original application's shaders or all its motion code. The measured dimensions do not establish pixel identity.

The English reference fonts are Yapari 600 and Monorama 400. The exact delivered WOFF2 files are available only in this machine's ignored `public/motion/reference-fonts/` directory for local comparison. `MOTION_REFERENCE_PREVIEW=true` and the presence of its stylesheet enable this comparison mode. The files are excluded from Git; the ordinary build uses Michroma and Rajdhani fallbacks. Relevant providers: [Power Type](https://power-type.com/yapari/), [Indian Type Foundry licensing](https://www.indiantypefoundry.com/licensing). A webfont licence must be resolved before distributing those reference fonts as part of a published site.

Bai Jamjuree 400, the reference's body typeface, is included through Fontsource under its SIL Open Font License. The OFL licences for the distributable fonts are retained under `public/motion/fonts/`. Japanese glyphs use Noto Sans JP Variable because the reference's Latin display fonts do not contain them; their optical fit remains an adaptation for the requested Japanese copy.
