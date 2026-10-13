// Every model the content names is built and committed, and every committed .glb keeps the rig contract in the header
// of models/kit.py: materials only body/trim/glow/cloth, an `idle` clip, everything under one `rig` root.
import { describe, expect, it } from 'vitest';
import { C } from './content';

const GLB = import.meta.glob<string>('../models/*.glb', { query: '?inline', import: 'default', eager: true });
const PY = import.meta.glob<string>('../models/*.py', { query: '?raw', import: 'default', eager: true });
const nameOf = (path: string) => path.split('/').pop()!.replace(/\.\w+$/, '');
const glbs = Object.keys(GLB).map(nameOf);

/** The JSON chunk of a binary glTF (inlined as a base64 data URL). */
function gltf(name: string) {
  const bin = atob(GLB[`../models/${name}.glb`]!.split(',')[1]!);
  const len = bin.charCodeAt(12) | (bin.charCodeAt(13) << 8) | (bin.charCodeAt(14) << 16) | (bin.charCodeAt(15) << 24);
  return JSON.parse(bin.slice(20, 20 + len)) as { materials?: { name: string }[]; animations?: { name: string }[]; extensionsRequired?: string[]; nodes: { name?: string; children?: number[] }[]; scenes: { nodes: number[] }[] };
}

describe('models', () => {
  it('every model in content/models.kdl has a script and a built .glb', () => {
    const scripts = Object.keys(PY).map(nameOf).filter((n) => n !== 'kit');
    expect(Object.keys(C.model).filter((m) => !scripts.includes(m) || !glbs.includes(m))).toEqual([]);
  });
  it('every .glb belongs to a model in content/models.kdl', () => {
    expect(glbs.filter((g) => !C.model[g])).toEqual([]);
  });
  for (const name of glbs) it(`${name}.glb keeps the rig contract`, () => {
    const g = gltf(name);
    expect((g.materials ?? []).map((m) => m.name).filter((m) => !['body', 'trim', 'glow', 'cloth'].includes(m))).toEqual([]);
    expect((g.animations ?? []).map((a) => a.name)).toContain('idle');
    expect(g.scenes[0]!.nodes.map((i) => g.nodes[i]!.name)).toEqual(['rig']);
    // Plain glTF: no required extension (quantised and compressed models failed to load on phones: stand-in boxes).
    expect(g.extensionsRequired ?? []).toEqual([]);
  });
});
