import Phaser from 'phaser';
// Inter Tight + Baloo Bhaina 2 (with its Odia subset), self-hosted so the game
// works offline and paints fast; same families as the brief's Google Fonts.
import '@fontsource/inter-tight/latin-600.css';
import '@fontsource/inter-tight/latin-700.css';
import '@fontsource/inter-tight/latin-800.css';
import '@fontsource/inter-tight/latin-900.css';
import '@fontsource/baloo-bhaina-2/latin-500.css';
import '@fontsource/baloo-bhaina-2/latin-600.css';
import '@fontsource/baloo-bhaina-2/latin-700.css';
import '@fontsource/baloo-bhaina-2/latin-800.css';
import '@fontsource/baloo-bhaina-2/oriya-500.css';
import '@fontsource/baloo-bhaina-2/oriya-600.css';
import '@fontsource/baloo-bhaina-2/oriya-700.css';
import './styles.css';
import { GAME_W, GAME_H } from './config';
import { FRAME } from './data/palettes';
import { DEBUG } from './systems/debug';
import { input } from './systems/input';
import { initLayout, applyLayout } from './ui/layout';
import { Boot } from './scenes/Boot';
import { Title } from './scenes/Title';
import { Run } from './scenes/Run';
import { TitleCard } from './scenes/TitleCard';

async function fontsReady(): Promise<void> {
  if (!('fonts' in document)) return;
  const wanted = ['900 40px "Inter Tight"', '800 20px "Inter Tight"', '700 13px "Inter Tight"', '500 16px "Baloo Bhaina 2"'];
  const timeout = new Promise<void>((r) => setTimeout(r, 2500));
  try {
    await Promise.race([Promise.all(wanted.map((f) => document.fonts.load(f))).then(() => undefined), timeout]);
  } catch {
    // offline: fall back to system sans
  }
}

function playUrl(): string {
  const env = import.meta.env.VITE_PLAY_URL as string | undefined;
  if (env) return env;
  const host = location.host;
  if (!host || /^(localhost|127\.|0\.0\.0\.0)|claudeusercontent|sandbox|artifact/i.test(host)) return '';
  return (host + location.pathname).replace(/index\.html$/, '').replace(/\/$/, '');
}

async function main(): Promise<void> {
  if (DEBUG.palette) {
    const { renderPalettePage } = await import('./ui/palettePage');
    renderPalettePage();
    return;
  }
  const url = playUrl();
  const playLine = document.getElementById('title-play')!;
  if (url) document.getElementById('play-url')!.textContent = url;
  else playLine.style.display = 'none';

  const app = document.getElementById('app')!;
  input.attach(app);
  initLayout();
  await fontsReady();
  applyLayout();

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: GAME_W,
    height: GAME_H,
    backgroundColor: FRAME.frameEdge,
    banner: false,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
    // One texture per batch: Phaser 4's multi-texture batching dropped a
    // triangle of some quads (texture-index branching) on software GL, and the
    // scene is only a few dozen draws anyway.
    render: { antialias: true, powerPreference: 'high-performance', maxTextures: 1 },
    input: { keyboard: false, mouse: false, touch: false, gamepad: false },
    audio: { noAudio: true },
    scene: [Boot, Title, Run, TitleCard],
  });
  window.addEventListener('kr-layout', () => game.scale.refresh());
  (window as unknown as { __KR_GAME__: Phaser.Game }).__KR_GAME__ = game;
}

main();
