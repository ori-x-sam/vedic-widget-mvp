import { defineConfig } from 'vite';

// main.ts awaits Pixi at the top level of boot; esnext keeps top-level await and modern syntax as written.
// base './': asset URLs are relative, so the build also runs from a subfolder (itch.io serves games from one).
// assetsInclude: models are binary glTF (models/*.glb, built by `npm run models`), imported as URLs.
// INLINE=1 (npm run build:page) inlines every asset, models included, as data URLs: a host that serves only scripts
// and pages (a claude.ai artifact) can then run the game from its page and its scripts alone.
const inline = !!process.env.INLINE;
export default defineConfig({
  base: './',
  build: { target: 'esnext', assetsInlineLimit: inline ? 100_000_000 : 4096, outDir: inline ? 'dist-page' : 'dist' },
  assetsInclude: ['**/*.glb'],
});
