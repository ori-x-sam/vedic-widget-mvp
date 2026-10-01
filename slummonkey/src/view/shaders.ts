// All GLSL in one place. Every tunable is a uniform fed from look/*.css tokens.
import * as THREE from "three";
import type { Tokens } from "../core/tokens";

const v3 = (t: Tokens, n: string, d: number[]) => { const v = t.vec(n, d); return new THREE.Vector3(v[0] ?? d[0], v[1] ?? d[1], v[2] ?? d[2]); };
const col = (t: Tokens, n: string) => new THREE.Color().setRGB(...t.color(n));

const NOISE = /* glsl */ `
float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float a=0.5, s=0.0; for(int i=0;i<4;i++){ s+=a*vnoise(p); p*=2.03; a*=0.5; } return s; }
`;

/** Cutout-puppet part: texture + cel rim light + cel shade + hit flash + parry pulse. */
export function characterMaterial(t: Tokens, map: THREE.Texture): THREE.ShaderMaterial {
  const dir = t.vec("--rim-dir", [-0.6, 0.8]);
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      map: { value: map },
      uRimColor: { value: col(t, "--rim-color") },
      uRim: { value: t.num("--rim-amount", 0.5) },
      uRimOff: { value: new THREE.Vector2(dir[0], dir[1]).normalize().multiplyScalar(t.num("--rim-offset", 0.01)) },
      uShadeColor: { value: col(t, "--shade-color") },
      uShade: { value: t.num("--shade-amount", 0.2) },
      uFlash: { value: 0 },
      uFlashColor: { value: col(t, "--hit-flash") },
      uAlpha: { value: 1 },
      uParry: { value: 0 },
      uParryColor: { value: col(t, "--parry") },
      uTint: { value: new THREE.Vector4(1, 1, 1, 0) },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D map; uniform vec3 uRimColor; uniform float uRim; uniform vec2 uRimOff;
      uniform vec3 uShadeColor; uniform float uShade; uniform float uFlash; uniform vec3 uFlashColor;
      uniform float uAlpha; uniform float uParry; uniform vec3 uParryColor; uniform vec4 uTint; uniform float uTime;
      varying vec2 vUv;
      void main(){
        vec4 c = texture2D(map, vUv);
        if (c.a < 0.02) discard;
        // cel rim: light comes from uRimOff direction; where the texture ends toward the light, add rim
        float toward = texture2D(map, vUv + uRimOff).a;
        float away = texture2D(map, vUv - uRimOff * 1.4).a;
        float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
        float notInk = smoothstep(0.12, 0.25, lum);
        vec3 rgb = c.rgb;
        rgb = mix(rgb, uRimColor, (1.0 - toward) * uRim * notInk);
        rgb = mix(rgb, rgb * uShadeColor * 2.2, (1.0 - away) * uShade * notInk);
        rgb = mix(rgb, uTint.rgb, uTint.a * notInk);
        float pulse = 0.5 + 0.5 * sin(uTime * 6.2831 * 1.0);
        rgb = mix(rgb, uParryColor, uParry * (0.45 + 0.25 * pulse) * notInk);
        rgb = mix(rgb, uFlashColor, uFlash * notInk);
        gl_FragColor = vec4(rgb, c.a * uAlpha);
        #include <colorspace_fragment>
      }`,
  });
}

/** Instanced sprites from an atlas (bullets, particles, decals). */
export function spriteBatchMaterial(t: Tokens, atlas: THREE.Texture, additive = false): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    uniforms: {
      map: { value: atlas },
      uParryColor: { value: col(t, "--parry") },
      uGlowColor: { value: col(t, "--parry-glow") },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `
      attribute vec4 iXform; // x, y, rot, scale
      attribute vec2 iSize;  // w, h
      attribute vec4 iUv;    // u0 v0 u1 v1
      attribute vec4 iColor; // tint rgb, alpha
      attribute float iParry;
      varying vec2 vUv; varying vec4 vColor; varying float vParry; varying vec2 vLocal;
      void main(){
        vec2 p = position.xy * iSize * iXform.w;
        float c = cos(iXform.z), s = sin(iXform.z);
        p = vec2(c*p.x - s*p.y, s*p.x + c*p.y) + iXform.xy;
        vUv = mix(iUv.xy, iUv.zw, uv);
        vColor = iColor; vParry = iParry; vLocal = position.xy;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 0.0, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D map; uniform vec3 uParryColor; uniform vec3 uGlowColor; uniform float uTime;
      varying vec2 vUv; varying vec4 vColor; varying float vParry; varying vec2 vLocal;
      void main(){
        vec4 c = texture2D(map, vUv);
        vec3 rgb = c.rgb * vColor.rgb;
        float a = c.a * vColor.a;
        if (vParry > 0.5) {
          // parry glow halo around the reserved-color sprite
          float r = length(vLocal) * 2.0;
          float halo = smoothstep(1.0, 0.55, r) * (0.55 + 0.45 * sin(uTime * 14.0));
          rgb = mix(uGlowColor, rgb, c.a);
          a = max(a, halo * 0.55);
        }
        if (a < 0.01) discard;
        gl_FragColor = vec4(rgb, a);
        #include <colorspace_fragment>
      }`,
  });
}

/** Painted background layer: watercolor paper grain, brush wobble, pigment edges, distance haze. */
export function paperMaterial(t: Tokens, map: THREE.Texture, haze: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      map: { value: map },
      uGrain: { value: t.num("--paper-grain", 0.1) },
      uScale: { value: t.num("--paper-scale", 3) },
      uBrush: { value: t.num("--brush-noise", 0.003) },
      uEdge: { value: t.num("--pigment-edge", 0.3) },
      uWash: { value: t.num("--wash", 0.1) },
      uHaze: { value: haze },
      uHazeColor: { value: col(t, "--haze-color") },
      uRepeat: { value: new THREE.Vector2(1, 1) },
      uOffset: { value: new THREE.Vector2(0, 0) },
      uTime: { value: 0 },
      uSeed: { value: Math.random() * 10 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec2 vWorld;
      void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xy; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D map; uniform float uGrain, uScale, uBrush, uEdge, uWash, uHaze, uTime, uSeed;
      uniform vec3 uHazeColor; uniform vec2 uRepeat, uOffset;
      varying vec2 vUv; varying vec2 vWorld;
      ${NOISE}
      void main(){
        vec2 uv = vUv * uRepeat + uOffset;
        vec2 wob = vec2(fbm(vWorld * 0.02 + uSeed), fbm(vWorld * 0.02 + uSeed + 7.0)) - 0.5;
        vec2 suv = uv + wob * uBrush;
        vec4 c = texture2D(map, fract(suv));
        if (c.a < 0.01) discard;
        // pigment pooling at shape edges (watercolor dark rim)
        float e = 0.0;
        vec2 px = vec2(0.0025, 0.0025);
        e += abs(texture2D(map, fract(suv + vec2(px.x, 0.0))).a - c.a);
        e += abs(texture2D(map, fract(suv + vec2(0.0, px.y))).a - c.a);
        float lumNb = dot(texture2D(map, fract(suv + px * 1.5)).rgb, vec3(0.333));
        float lum = dot(c.rgb, vec3(0.333));
        float edge = clamp(abs(lum - lumNb) * 3.0 + e, 0.0, 1.0);
        vec3 rgb = c.rgb * (1.0 - edge * uEdge * 0.5);
        // wash blotches + paper grain
        float wash = fbm(vWorld * 0.004 + uSeed * 3.0);
        rgb *= 1.0 - (wash - 0.5) * uWash * 2.0;
        float grain = fbm(vWorld * uScale * 0.12) * 0.6 + hash(floor(vWorld * 0.9)) * 0.4;
        rgb *= 1.0 - (grain - 0.5) * uGrain * 2.0;
        rgb = mix(rgb, uHazeColor, uHaze);
        gl_FragColor = vec4(rgb, c.a);
        #include <colorspace_fragment>
      }`,
  });
}

/** Sky gradient with painted cloud wash. */
export function skyMaterial(t: Tokens, top: string, bottom: string): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    depthWrite: false,
    uniforms: {
      uTop: { value: col(t, top) }, uBottom: { value: col(t, bottom) }, uTime: { value: 0 },
      uGrain: { value: t.num("--paper-grain", 0.1) }, uCam: { value: new THREE.Vector2() },
    },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.9999, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTop, uBottom; uniform float uTime, uGrain; uniform vec2 uCam; varying vec2 vUv;
      ${NOISE}
      void main(){
        vec2 p = vUv * vec2(3.0, 1.6) + uCam * 0.00008;
        float n = fbm(p * 2.0 + vec2(uTime * 0.01, 0.0));
        vec3 c = mix(uBottom, uTop, smoothstep(0.0, 1.0, vUv.y + (n - 0.5) * 0.25));
        float cloud = smoothstep(0.55, 0.8, fbm(p * vec2(1.4, 3.0) + vec2(uTime * 0.015, 3.0)));
        c = mix(c, vec3(1.0, 0.97, 0.9), cloud * 0.35 * smoothstep(0.2, 0.8, vUv.y));
        c *= 1.0 - (fbm(vUv * 140.0) - 0.5) * uGrain;
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}

export function waterMaterial(t: Tokens): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { uTime: { value: 0 }, uA: { value: col(t, "--water") }, uB: { value: col(t, "--water-deep") }, uInk: { value: col(t, "--ink") }, uSheen: { value: t.num("--water-sheen", 0.3) } },
    vertexShader: /* glsl */ `varying vec2 vUv; varying vec2 vW; void main(){ vUv = uv; vec4 w = modelMatrix*vec4(position,1.0); vW = w.xy; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uSheen; uniform vec3 uA, uB, uInk; varying vec2 vUv; varying vec2 vW;
      ${NOISE}
      void main(){
        float wave = sin(vW.x * 0.03 + uTime * 2.0) * 6.0 + sin(vW.x * 0.071 - uTime * 1.3) * 4.0;
        float top = 1.0 - (wave + 12.0) / 600.0;
        if (vUv.y > top) discard;
        float d = top - vUv.y;
        vec3 c = mix(uA, uB, smoothstep(0.0, 0.5, d));
        float s = smoothstep(0.62, 0.8, fbm(vW * vec2(0.01, 0.04) + vec2(uTime * 0.3, 0.0)));
        c += s * uSheen;
        if (d < 0.012) c = uInk; else if (d < 0.03) c = mix(c, vec3(1.0), 0.6);
        gl_FragColor = vec4(c, 0.88);
        #include <colorspace_fragment>
      }`,
  });
}

/** Final pass: grade, grain, gate weave, chroma, VHS tracking, scanlines, vignette, dust & scratches. */
export function postMaterial(t: Tokens, tex: THREE.Texture): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    uniforms: {
      tDiffuse: { value: tex },
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uGrain: { value: t.num("--grain", 0.08) },
      uGrainFps: { value: t.num("--grain-fps", 24) },
      uWeave: { value: t.num("--gate-weave", 0.002) },
      uChroma: { value: t.num("--chroma", 0.0015) },
      uTracking: { value: 0 },
      uScan: { value: t.num("--scanlines", 0.05) },
      uVig: { value: t.num("--vignette", 0.4) },
      uVigSoft: { value: t.num("--vignette-soft", 0.5) },
      uLift: { value: v3(t, "--grade-lift", [0.03, 0, 0.03]) },
      uGain: { value: v3(t, "--grade-gain", [1.05, 1, 0.9]) },
      uGamma: { value: t.num("--grade-gamma", 1) },
      uSat: { value: t.num("--saturation", 1) },
      uContrast: { value: t.num("--contrast", 1) },
      uFlicker: { value: t.num("--flicker", 0.02) },
      uDust: { value: t.num("--dust", 0.5) },
      uBloom: { value: t.num("--bloom", 0.15) },
      uFlash: { value: 0 },
    },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse; uniform float uTime, uGrain, uGrainFps, uWeave, uChroma, uTracking, uScan, uVig, uVigSoft;
      uniform vec3 uLift, uGain; uniform float uGamma, uSat, uContrast, uFlicker, uDust, uBloom, uFlash; uniform vec2 uRes;
      varying vec2 vUv;
      ${NOISE}
      void main(){
        float ft = floor(uTime * uGrainFps);
        vec2 uv = vUv;
        // gate weave (film sits slightly differently each frame)
        uv += (vec2(hash(vec2(ft, 1.0)), hash(vec2(ft, 2.0))) - 0.5) * uWeave;
        // VHS tracking: a band of horizontal tearing that rolls down the frame
        if (uTracking > 0.001) {
          float band = fract(uTime * 0.7);
          float d = abs(uv.y - (1.0 - band));
          float inBand = smoothstep(0.08, 0.0, d);
          uv.x += (hash(vec2(floor(uv.y * 160.0), ft)) - 0.5) * 0.04 * inBand * uTracking;
          uv.x += sin(uv.y * 80.0 + uTime * 40.0) * 0.002 * uTracking;
        }
        vec2 dir = (uv - 0.5);
        float ch = uChroma * (1.0 + uTracking * 4.0);
        vec3 c;
        c.r = texture2D(tDiffuse, uv + dir * ch).r;
        c.g = texture2D(tDiffuse, uv).g;
        c.b = texture2D(tDiffuse, uv - dir * ch).b;
        // cheap bloom: bright neighbours bleed
        vec2 px = 3.0 / uRes;
        vec3 b = vec3(0.0);
        b += texture2D(tDiffuse, uv + vec2(px.x, 0)).rgb; b += texture2D(tDiffuse, uv - vec2(px.x, 0)).rgb;
        b += texture2D(tDiffuse, uv + vec2(0, px.y)).rgb; b += texture2D(tDiffuse, uv - vec2(0, px.y)).rgb;
        b *= 0.25;
        c += max(b - 0.72, 0.0) * uBloom * 3.0;
        // grade: lift / gamma / gain, saturation, contrast
        c = c * uGain + uLift * (1.0 - c);
        c = pow(max(c, 0.0), vec3(uGamma));
        float l = dot(c, vec3(0.299, 0.587, 0.114));
        c = mix(vec3(l), c, uSat);
        c = (c - 0.5) * uContrast + 0.5;
        // flicker
        c *= 1.0 + (hash(vec2(ft, 9.0)) - 0.5) * uFlicker;
        // scanlines
        c *= 1.0 - uScan * (0.5 + 0.5 * sin(vUv.y * uRes.y * 1.5));
        // grain
        float g = hash(vUv * uRes * 0.5 + ft * 13.1) - 0.5;
        c += g * uGrain;
        // dust specks and an occasional vertical scratch
        float dust = step(0.9985 - uDust * 0.001, hash(floor(vUv * uRes / 3.0) + ft));
        c = mix(c, vec3(0.1, 0.05, 0.04), dust * 0.6);
        float sx = hash(vec2(floor(uTime * 2.0), 4.0));
        float scratch = smoothstep(0.0012, 0.0, abs(vUv.x - sx)) * step(0.6, hash(vec2(floor(uTime * 2.0), 5.0))) * uDust;
        c = mix(c, vec3(1.0, 0.96, 0.88), scratch * 0.5);
        // vignette
        float v = smoothstep(0.8, 0.8 - uVigSoft, length((vUv - 0.5) * vec2(1.25, 1.0)));
        c *= mix(1.0 - uVig, 1.0, v);
        c = mix(c, vec3(1.0), uFlash);
        gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
      }`,
  });
}

export function inkMaterial(t: Tokens, color = "--ink", alpha = 1): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color: col(t, color), transparent: true, opacity: alpha, depthWrite: false });
}
