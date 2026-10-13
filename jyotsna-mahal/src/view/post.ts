// The frame after the render: multisampled (smooth edges), flames, bulbs and the moon blooming softly, then a film
// grade (a vignette, a little warmth in the lights and grain that moves) before tone mapping. Strengths are look
// tokens. The resolution adapts: on a slow phone the frame drops towards 1 device pixel per CSS pixel before it
// drops frames, and climbs back when there is time.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { LOOK } from './look';
import { QUALITY } from './quality';

/** Straight after the render: a pixel that came out NaN or infinite (a degenerate normal in a bump map, say) is put
    out, and the rest held to a sane brightness, before the bloom can spread one bad pixel over the whole frame. */
const SANE = {
  uniforms: { tDiffuse: { value: null } },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      bool bad = c.r != c.r || c.g != c.g || c.b != c.b || c.r > 6e4 || c.g > 6e4 || c.b > 6e4;
      gl_FragColor = bad ? vec4(0.0, 0.0, 0.0, 1.0) : vec4(min(c.rgb, vec3(64.0)), c.a);
    }`,
};

const GRADE = {
  uniforms: { tDiffuse: { value: null }, vignette: { value: 0 }, grain: { value: 0 }, time: { value: 0 }, aspect: { value: 1 } },
  vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float vignette, grain, time, aspect; varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      vec2 d = (vUv - 0.5) * vec2(aspect, 1.0);
      float v = smoothstep(0.95, 0.25, length(d) * 1.05);
      c.rgb *= mix(1.0, v, vignette);
      float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      // Warm lights, cool shadows: a whisper of split toning.
      c.rgb += (vec3(0.03, 0.015, -0.02) * smoothstep(0.3, 1.2, l) + vec3(-0.01, 0.0, 0.015) * (1.0 - smoothstep(0.0, 0.25, l))) * vignette;
      c.rgb += (hash(vUv * 1000.0 + fract(time * 7.13)) - 0.5) * grain * (0.35 + 0.65 * (1.0 - smoothstep(0.0, 0.6, l)));
      gl_FragColor = c;
    }`,
};

export type Post = ReturnType<typeof createPost>;

export function createPost(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera, w: number, h: number) {
  const maxRatio = Math.min(QUALITY.maxRatio, devicePixelRatio || 1);
  let ratio = maxRatio, cw = w, ch = h;
  const target = new THREE.WebGLRenderTarget(w * ratio, h * ratio, { type: THREE.HalfFloatType, samples: QUALITY.samples });
  const composer = new EffectComposer(renderer, target);
  composer.setPixelRatio(ratio);
  composer.setSize(w, h);
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new ShaderPass(SANE));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w / QUALITY.bloomDiv, h / QUALITY.bloomDiv), LOOK.BLOOM, 0.55, LOOK.BLOOM_THRESHOLD);
  composer.addPass(bloom);
  const grade = new ShaderPass(GRADE);
  grade.uniforms.vignette!.value = LOOK.VIGNETTE;
  grade.uniforms.grain!.value = LOOK.GRAIN;
  composer.addPass(grade);
  composer.addPass(new OutputPass());

  // Frame time, smoothed; how long it has been too slow or comfortably fast.
  let last = performance.now(), avg = 16, slowS = 0, fastS = 0;
  const apply = () => { renderer.setPixelRatio(ratio); composer.setPixelRatio(ratio); composer.setSize(cw, ch); };
  function adapt() {
    const t = performance.now(), dt = Math.min(200, t - last);
    last = t;
    avg += (dt - avg) * 0.05;
    const s = dt / 1000;
    if (avg > 24) { slowS += s; fastS = 0; } else if (avg < 15) { fastS += s; slowS = 0; } else { slowS = fastS = 0; }
    if (slowS > 1.5 && ratio > 1) { ratio = Math.max(1, ratio - 0.25); slowS = 0; apply(); }
    else if (slowS > 1.5 && ratio > 0.75) { ratio = 0.75; slowS = 0; apply(); }
    if (fastS > 5 && ratio < maxRatio) { ratio = Math.min(maxRatio, ratio + 0.25); fastS = 0; apply(); }
  }

  return {
    render(timeS: number) {
      adapt();
      grade.uniforms.time!.value = timeS;
      composer.render();
    },
    /** How much blooms, and from what brightness (the day is bright everywhere; only its glints should bloom). */
    bloom(strength: number, threshold: number) { bloom.strength = strength; bloom.threshold = threshold; },
    resize(w2: number, h2: number) {
      cw = w2; ch = h2;
      grade.uniforms.aspect!.value = w2 / h2;
      bloom.resolution.set(w2 / QUALITY.bloomDiv, h2 / QUALITY.bloomDiv);
      apply();
    },
  };
}
