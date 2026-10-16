// Packs dist/ into one self-contained HTML file (JS, CSS and woff2 fonts
// inlined) for hosts that only allow inline code, e.g. a claude.ai artifact.
// Run after `npm run build`:  npx tsx tools/build-single.ts [out.html] [--fragment]
// --fragment drops <!doctype>/<html>/<head>/<body> for hosts that add their own skeleton.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
const out = process.argv.find((a, i) => i > 1 && !a.startsWith('--')) ?? join(DIST, 'kalinga-rush-single.html');
const fragment = process.argv.includes('--fragment');

let html = readFileSync(join(DIST, 'index.html'), 'utf8');

// CSS: inline, with fonts as data URIs (woff2 only; every target browser has it).
html = html.replace(/<link rel="stylesheet"[^>]*href="\.\/(assets\/[^"]+\.css)"[^>]*>/g, (_m, href: string) => {
  const cssPath = join(DIST, href);
  let css = readFileSync(cssPath, 'utf8');
  css = css.replace(/,\s*url\([^)]+\.woff\)\s*format\("woff"\)/g, '');
  css = css.replace(/url\((?:\.\/|\/)?([^)"']+\.woff2)\)/g, (_u, f: string) => {
    const data = readFileSync(join(dirname(cssPath), f.replace(/^assets\//, ''))).toString('base64');
    return `url(data:font/woff2;base64,${data})`;
  });
  return `<style>${css}</style>`;
});

// JS: inline the module entry.
html = html.replace(/<script type="module" crossorigin src="\.\/(assets\/[^"]+\.js)"><\/script>/g, (_m, src: string) => {
  const js = readFileSync(join(DIST, src), 'utf8').replace(/<\/script/gi, '<\\/script');
  return `<script type="module">${js}</script>`;
});
html = html.replace(/<link rel="modulepreload"[^>]*>/g, '');

if (/src="\.\/assets|href="\.\/assets/.test(html)) throw new Error('an asset reference was not inlined');

if (fragment) {
  const title = html.match(/<title>[\s\S]*?<\/title>/)?.[0] ?? '';
  const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1] ?? '';
  const body = html.match(/<body>([\s\S]*?)<\/body>/)?.[1] ?? '';
  const headRest = head.replace(title, '').replace(/<meta charset[^>]*>/, '').replace(/<meta name="viewport"[^>]*>/, '');
  html = `${title}\n${headRest.trim()}\n${body.trim()}\n`;
}

writeFileSync(out, html);
console.log(`single-file build → ${out} (${(Buffer.byteLength(html) / 1024 / 1024).toFixed(2)} MB)`);
