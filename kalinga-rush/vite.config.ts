import { defineConfig, type Plugin } from 'vite';
import { readdirSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { cssTokenBlock, FIXED, FRAME } from './src/data/palettes';

/** Injects the palette as CSS custom properties so CSS never holds a colour literal. */
function paletteTokens(): Plugin {
  return {
    name: 'kr-palette-tokens',
    transformIndexHtml(html) {
      // A little diya favicon, coloured from the palette.
      const d = FIXED.diya;
      const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' rx='8' fill='${FRAME.frame}'/><path d='M20 6C25 13 26 18 20 23 14 18 15 13 20 6Z' fill='${d.flame}'/><path d='M20 13C22.5 16 22.5 19 20 21.5 17.5 19 17.5 16 20 13Z' fill='${d.core}'/><path d='M5 24C10 36 30 36 35 24 28 27 12 27 5 24Z' fill='${d.body}'/></svg>`;
      const icon = `<link rel="icon" href="data:image/svg+xml,${encodeURIComponent(svg)}" />`;
      const theme = `<meta name="theme-color" content="${FRAME.frame}" />`;
      return html.replace('</head>', `<style id="kr-tokens">${cssTokenBlock()}</style>\n${icon}\n${theme}\n</head>`);
    },
  };
}

/** virtual:painted-art — which /public/art/<record>/<layer>.webp files exist (§4.10). */
function paintedArt(): Plugin {
  const id = 'virtual:painted-art';
  return {
    name: 'kr-painted-art',
    resolveId(src) {
      return src === id ? '\0' + id : null;
    },
    load(resolved) {
      if (resolved !== '\0' + id) return null;
      const root = join(__dirname, 'public', 'art');
      const out: Record<string, string[]> = {};
      if (existsSync(root)) {
        for (const rec of readdirSync(root)) {
          const dir = join(root, rec);
          if (!statSync(dir).isDirectory()) continue;
          const layers = readdirSync(dir).filter((f) => f.endsWith('.webp')).map((f) => f.replace(/\.webp$/, ''));
          if (layers.length) out[rec] = layers;
        }
      }
      return `export default ${JSON.stringify(out)};`;
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [paletteTokens(), paintedArt()],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 2000,
  },
  server: { host: '127.0.0.1', port: 5173 },
});
