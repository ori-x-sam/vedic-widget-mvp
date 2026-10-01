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

/** Cutout-puppet part: auto two-tone cel shading from the part's silhouette, a lit rim, ink lines that
 *  thicken on the shadow side, 12fps line boil, paper grain, hit flash and the parry pulse. */
export function characterMaterial(t: Tokens, map: THREE.Texture, texel = new THREE.Vector2(1 / 256, 1 / 256)): THREE.ShaderMaterial {
  const dir = t.vec("--rim-dir", [-0.6, 0.8]);
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      map: { value: map },
      uTexel: { value: texel },
      uLight: { value: new THREE.Vector2(dir[0], dir[1]).normalize() },
      uRimColor: { value: col(t, "--rim-color") },
      uRim: { value: t.num("--rim-amount", 0.5) },
      uShadeColor: { value: col(t, "--shade-color") },
      uShade: { value: t.num("--shade-amount", 0.35) },
      uShadeSoft: { value: t.num("--shade-soft", 0.08) },
      uBevel: { value: t.num("--bevel", 9) },
      uInkBias: { value: t.num("--ink-weight", 1.6) },
      uOutline: { value: t.num("--silhouette", 3) },
      uInk: { value: col(t, "--ink") },
      uGrain: { value: t.num("--char-grain", 0.12) },
      uBoil: { value: t.num("--line-boil", 0.6) },
      uFlash: { value: 0 },
      uFlashColor: { value: col(t, "--hit-flash") },
      uAlpha: { value: 1 },
      uParry: { value: 0 },
      uParryColor: { value: col(t, "--parry") },
      uTint: { value: new THREE.Vector4(1, 1, 1, 0) },
      uTime: { value: 0 },
      uFlipX: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D map; uniform vec2 uTexel; uniform vec2 uLight;
      uniform vec3 uRimColor; uniform float uRim; uniform vec3 uShadeColor; uniform float uShade; uniform float uShadeSoft; uniform float uBevel;
      uniform float uInkBias; uniform vec3 uInk; uniform float uGrain; uniform float uBoil; uniform float uOutline;
      uniform float uFlash; uniform vec3 uFlashColor; uniform float uAlpha; uniform float uParry; uniform vec3 uParryColor;
      uniform vec4 uTint; uniform float uTime; uniform float uFlipX;
      varying vec2 vUv;
      ${NOISE}
      float A(vec2 uv){ return texture2D(map, uv).a; }
      void main(){
        // line boil: the drawing shifts a hair every held frame (12fps), like re-inked cels
        float f = floor(uTime * 12.0);
        vec2 uv = vUv + (vec2(vnoise(vUv * 9.0 + f * 1.7), vnoise(vUv * 9.0 + f * 2.3 + 5.0)) - 0.5) * uTexel * 2.2 * uBoil;
        vec4 c = texture2D(map, uv);
        // light in texture space (art is mirrored when facing left)
        vec2 L = normalize(vec2(uLight.x * uFlipX, uLight.y));
        vec2 o = uTexel * uBevel;
        // ink weight: pull dark line pixels toward the shadow side so lines are thicker underneath
        vec4 cs = texture2D(map, uv + L * uTexel * uInkBias);
        float lumS = dot(cs.rgb, vec3(0.299, 0.587, 0.114));
        float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
        float isInkS = step(lumS, 0.16) * step(0.5, cs.a);
        float outer = 0.0;
        if (c.a < 0.5 && uOutline > 0.0) {
          for (int k = 0; k < 8; k++) { float a = float(k) * 0.7853982; outer = max(outer, A(uv + vec2(cos(a), sin(a)) * uTexel * uOutline)); }
        }
        if (c.a < 0.02 && isInkS < 0.5 && outer < 0.5) discard;
        if (c.a < 0.5 && outer >= 0.5) { gl_FragColor = vec4(uInk, uAlpha * smoothstep(0.5, 0.8, outer)); return; }
        if (isInkS > 0.5) { c = vec4(cs.rgb, max(c.a, cs.a)); lum = lumS; }
        float notInk = smoothstep(0.13, 0.24, lum);
        // fake normal from a blurred "fill field": alpha masked by ink, so every sub-shape bounded by
        // an ink line (ear, blanket, sleeve...) gets its own pillowy volume, not just the part outline
        vec2 g = vec2(0.0);
        for (int k = 0; k < 8; k++) {
          float a = float(k) * 0.7853982;
          vec2 d = vec2(cos(a), sin(a));
          for (int r = 1; r <= 3; r++) {
            vec2 suv = uv + d * o * (float(r) / 3.0);
            vec4 sc = texture2D(map, suv);
            float fill = sc.a * smoothstep(0.12, 0.22, dot(sc.rgb, vec3(0.299, 0.587, 0.114)));
            g += d * fill / float(r);
          }
        }
        g.y = -g.y;
        vec2 n = -g;
        float gl = length(g);
        float ndl = dot(normalize(n + 1e-4), L) * clamp(gl * 0.55, 0.0, 1.0);
        float shadow = smoothstep(uShadeSoft, -uShadeSoft, ndl + 0.02);           // crisp two-tone terminator
        float rim = smoothstep(0.30, 0.7, ndl) * smoothstep(0.4, 1.6, gl);         // thin lit edge
        float core = smoothstep(0.6, 2.2, gl);                                      // darker toward sub-shape edges
        vec3 rgb = c.rgb;
        rgb = mix(rgb, rgb * mix(vec3(1.0), uShadeColor * 2.4, 0.85), (shadow * uShade + core * 0.12) * notInk);
        rgb = mix(rgb, uRimColor, rim * uRim * notInk);
        // ink: warm and not pure black
        rgb = mix(uInk, rgb, notInk);
        // paper grain anchored to the screen so it doesn't swim with the part
        float gr = fbm(gl_FragCoord.xy * 0.35) - 0.5;
        rgb *= 1.0 + gr * uGrain * notInk;
        rgb = mix(rgb, uTint.rgb, uTint.a * notInk);
        float pulse = 0.5 + 0.5 * sin(uTime * 6.2831 * 1.0);
        rgb = mix(rgb, uParryColor, uParry * (0.45 + 0.25 * pulse) * notInk);
        rgb = mix(rgb, uFlashColor, uFlash * notInk);
        gl_FragColor = vec4(rgb, c.a * uAlpha);
        #include <colorspace_fragment>
      }`,
  });
}

/** A part's soft contact shadow cast onto whatever is behind it (ambient occlusion where parts overlap). */
export function partShadowMaterial(t: Tokens, map: THREE.Texture): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: { map: { value: map }, uColor: { value: col(t, "--shade-color") }, uAmount: { value: t.num("--part-shadow", 0.28) }, uAlpha: { value: 1 } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D map; uniform vec3 uColor; uniform float uAmount; uniform float uAlpha; varying vec2 vUv;
      void main(){ float a = texture2D(map, vUv).a; if (a < 0.02) discard; gl_FragColor = vec4(uColor * 0.5, a * uAmount * uAlpha); }`,
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

/** One-time bake (texture space): gouache/watercolour treatment of a painted layer — pigment pooling against
 *  ink lines, light-side lift, wash blotches, wet-edge blooms, paper grain. Runs once per layer at load. */
export function paperBakeMaterial(t: Tokens, map: THREE.Texture, w: number, h: number, wrap = new THREE.Vector2(0, 0)): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false, transparent: false,
    uniforms: {
      map: { value: map }, uTexSize: { value: new THREE.Vector2(w, h) },
      uGrain: { value: t.num("--paper-grain", 0.1) }, uScale: { value: t.num("--paper-scale", 3) },
      uEdge: { value: t.num("--pigment-edge", 0.3) }, uWash: { value: t.num("--wash", 0.1) }, uSeed: { value: Math.random() * 10 },
      uBgInk: { value: t.num("--bg-ink", 0.35) },
      uWrap: { value: wrap },
    },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D map; uniform vec2 uTexSize; uniform float uGrain, uScale, uEdge, uWash, uSeed, uBgInk; uniform vec2 uWrap; varying vec2 vUv;
      ${NOISE}
      vec2 W(vec2 uv) { return mix(clamp(uv, 0.0, 1.0), fract(uv), uWrap); }
      vec4 T(vec2 uv) { return texture2D(map, W(uv)); }
      // seamless noise across a tiled edge: cross-fade the field with itself shifted by one tile
      float fT(vec2 P, float f) {
        float a = fbm(P * f);
        if (uWrap.x > 0.5) { float u = P.x / uTexSize.x; a = mix(a, fbm((P - vec2(uTexSize.x, 0.0)) * f), u); }
        if (uWrap.y > 0.5) { float v = P.y / uTexSize.y; a = mix(a, fbm((P - vec2(0.0, uTexSize.y)) * f), v); }
        return a;
      }
      void main(){
        vec2 P = vUv * uTexSize;
        vec2 wob = vec2(fT(P + uSeed * 50.0, 0.02), fT(P + uSeed * 50.0 + 350.0, 0.02)) - 0.5;
        vec2 suv = vUv + wob * 1.4 / uTexSize;
        vec4 c = T(suv);
        vec2 px = 1.0 / uTexSize;
        float near = 0.0, lit = 0.0;
        for (int k = 0; k < 8; k++) {
          float a = float(k) * 0.7853982;
          vec2 d = vec2(cos(a), sin(a));
          vec4 s1 = T(suv + d * px * 7.0);
          vec4 s2 = T(suv + d * px * 16.0);
          float i1 = step(dot(s1.rgb, vec3(0.333)), 0.2) * s1.a + (1.0 - s1.a);
          float i2 = step(dot(s2.rgb, vec3(0.333)), 0.2) * s2.a + (1.0 - s2.a);
          near += i1 * 0.09 + i2 * 0.035;
          lit += dot(d, vec2(-0.6, 0.8)) * (i2 - i1);
        }
        float isInk = step(dot(c.rgb, vec3(0.333)), 0.2);
        vec3 rgb = c.rgb;
        // backgrounds don't get hard ink: lines become a darker, hue-shifted shade of the paint around them
        if (isInk > 0.5) {
          vec3 fillAvg = vec3(0.0); float wsum = 0.0;
          for (int k = 0; k < 8; k++) {
            float a = float(k) * 0.7853982;
            vec4 f = T(suv + vec2(cos(a), sin(a)) * px * 9.0);
            float ok = step(0.2, dot(f.rgb, vec3(0.333))) * f.a;
            fillAvg += f.rgb * ok; wsum += ok;
          }
          vec3 fillc = wsum > 0.0 ? fillAvg / wsum : c.rgb;
          rgb = mix(fillc * vec3(0.8, 0.74, 0.84), c.rgb, uBgInk);
        }
        rgb *= 1.0 - clamp(near, 0.0, 1.0) * uEdge * (1.0 - isInk);
        rgb *= 1.0 + clamp(-lit * 0.12, -0.12, 0.12) * (1.0 - isInk);
        float wash = fT(P + uSeed * 750.0, 0.004);
        rgb *= 1.0 - (wash - 0.5) * uWash * 2.0;
        float bloom = smoothstep(0.62, 0.7, fT(P + uSeed * 90.0, 0.011)) * (1.0 - isInk);
        rgb = mix(rgb, rgb * 0.86, bloom * uWash * 2.5);
        float grain = fT(P, uScale * 0.12) * 0.6 + hash(floor(P * 0.9)) * 0.4;
        rgb *= 1.0 - (grain - 0.5) * uGrain * 2.0;
        gl_FragColor = vec4(rgb, c.a);
      }`,
  });
}

/** Runtime painted layer: samples the baked texture (blurred by depth via mip bias), hazes and desaturates with distance. */
export function paperMaterial(t: Tokens, map: THREE.Texture, haze: number, desat = 0, dim = 1, blur = 0): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      map: { value: map },
      uHaze: { value: haze }, uDesat: { value: desat }, uDim: { value: dim }, uBlur: { value: blur }, uTint: { value: new THREE.Color(1, 1, 1) },
      uHazeColor: { value: col(t, "--haze-color") },
      uRepeat: { value: new THREE.Vector2(1, 1) },
      uOffset: { value: new THREE.Vector2(0, 0) },
      uTime: { value: 0 },
    },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D map; uniform float uHaze, uDesat, uDim, uBlur, uTime; uniform vec3 uHazeColor, uTint; uniform vec2 uRepeat, uOffset;
      varying vec2 vUv;
      void main(){
        vec4 c = texture2D(map, fract(vUv * uRepeat + uOffset), uBlur);
        if (c.a < 0.01) discard;
        vec3 rgb = c.rgb * uTint;
        float l = dot(rgb, vec3(0.299, 0.587, 0.114));
        rgb = mix(rgb, vec3(l), uDesat);
        rgb = mix(rgb, uHazeColor, uHaze) * uDim;
        gl_FragColor = vec4(rgb, c.a);
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
        float band = step(0.5, fract((vUv.y + sin(vW.x * 0.012 + uTime) * 0.01) * 18.0));
        c = mix(c, c * 0.88, band * 0.5);
        float foam = smoothstep(0.55, 0.75, fbm(vW * vec2(0.03, 0.08) + vec2(uTime * 0.8, 0.0)));
        c = mix(c, vec3(1.0), foam * smoothstep(0.15, 0.0, d) * 0.8);
        if (d < 0.012) c = uInk; else if (d < 0.035) c = mix(c, vec3(1.0), 0.75);
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
      uSharpen: { value: t.num("--sharpen", 0.6) },
      uFlash: { value: 0 },
    },
    vertexShader: /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tDiffuse; uniform float uTime, uGrain, uGrainFps, uWeave, uChroma, uTracking, uScan, uVig, uVigSoft;
      uniform vec3 uLift, uGain; uniform float uGamma, uSat, uContrast, uFlicker, uDust, uBloom, uFlash, uSharpen; uniform vec2 uRes;
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
        vec2 dir = (uv - 0.5) * smoothstep(0.15, 0.75, length(uv - 0.5) * 1.4); // fringing only toward the edges
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
        // unsharp mask: keeps ink edges crisp under the film treatment
        vec3 blur4 = (texture2D(tDiffuse, uv + vec2(1.0, 0.0) / uRes).rgb + texture2D(tDiffuse, uv - vec2(1.0, 0.0) / uRes).rgb + texture2D(tDiffuse, uv + vec2(0.0, 1.0) / uRes).rgb + texture2D(tDiffuse, uv - vec2(0.0, 1.0) / uRes).rgb) * 0.25;
        c += (c - blur4) * uSharpen;
        // grade: lift / gamma / gain, saturation, contrast
        float lumIn = dot(c, vec3(0.299, 0.587, 0.114));
        c = mix(c, c * uGain + uLift * (1.0 - c), smoothstep(0.08, 0.3, lumIn)); // keep the darkest inks clean
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
        // a handful of dust specks per frame (not a grid)
        float dust = 0.0;
        for (int k = 0; k < 4; k++) {
          vec2 dp = vec2(hash(vec2(ft, float(k) * 3.1)), hash(vec2(float(k) * 7.7, ft)));
          float r = (1.5 + 2.5 * hash(vec2(ft, float(k)))) / uRes.y;
          dust += smoothstep(r, r * 0.4, length((vUv - dp) * vec2(uRes.x / uRes.y, 1.0))) * step(0.5, hash(vec2(ft * 1.3, float(k))));
        }
        c = mix(c, vec3(0.12, 0.06, 0.05), clamp(dust, 0.0, 1.0) * 0.7 * uDust);

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
