// Every model the content names, on a turntable under a plain light: the lineup shows them all at their true sizes
// side by side; One shows any one of them up close (pick it in the controls).
import type { Meta, StoryObj } from '@storybook/html-vite';
import * as THREE from 'three';
import { expect } from 'storybook/test';
import { C } from '../content';
import { loadModels, place } from '../view/models';

type Args = { model: string };
export default { title: 'Models', args: { model: 'raja' }, argTypes: { model: { control: 'select', options: Object.keys(C.model) } } } satisfies Meta<Args>;
type Story = StoryObj<Args>;

function stand(ids: string[], closeUp: boolean) {
  const el = document.createElement('div');
  Object.assign(el.style, { width: '844px', height: '390px', position: 'relative' });
  const r = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  r.setSize(844, 390); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.3;
  el.appendChild(r.domElement);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0x1a1d26);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x303040, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 2); key.position.set(3, 6, 5); scene.add(key);
  const cam = new THREE.PerspectiveCamera(closeUp ? 30 : 40, 844 / 390, 0.05, 200);
  el.dataset.loaded = 'no';
  void loadModels().then(() => {
    const row = new THREE.Group();
    let x = 0;
    for (const id of ids) {
      const p = place(id), box = new THREE.Box3().setFromObject(p.root), w = box.max.x - box.min.x;
      p.root.position.x = x - box.min.x; x += w + 0.4; row.add(p.root);
      if (closeUp) p.root.rotation.y = 0.6;
    }
    const b = new THREE.Box3().setFromObject(row), c = b.getCenter(new THREE.Vector3()), size = b.getSize(new THREE.Vector3());
    row.position.x -= c.x; scene.add(row);
    const d = Math.max(size.x / 2.2, size.y * 1.1, 1.2);
    cam.position.set(0, size.y * 0.6, d * (closeUp ? 2.6 : 1.4)); cam.lookAt(0, size.y * 0.45, 0);
    r.render(scene, cam);
    el.dataset.loaded = String(ids.length);
  });
  return el;
}

export const Lineup: Story = {
  render: () => stand(Object.keys(C.model).filter((m) => !['sal-tree', 'jeep', 'hands'].includes(m)), false),
  play: async ({ canvasElement }) => {
    const el = canvasElement.firstElementChild as HTMLElement;
    for (let i = 0; i < 100 && el.dataset.loaded === 'no'; i++) await new Promise((r) => setTimeout(r, 100));
    await expect(Number(el.dataset.loaded)).toBeGreaterThan(30);
  },
};

export const One: Story = { render: ({ model }) => stand([model], true) };
