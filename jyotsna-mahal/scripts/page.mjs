// After `INLINE=1 vite build`: dist-page/jyotsna-mahal.html, the game as an artifact page (no doctype, head or body:
// the host wraps it), beside its scripts in dist-page/assets. Models are already inlined into the scripts.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
const html = readFileSync('dist-page/index.html', 'utf8');
const head = html.slice(html.indexOf('<title>'), html.indexOf('</head>')).replace(/<link rel="preconnect"[^>]*>\n/g, '');
writeFileSync('dist-page/jyotsna-mahal.html', `${head}\n<div id="app"></div>\n`);
const files = readdirSync('dist-page/assets');
console.log(`dist-page/jyotsna-mahal.html + ${files.length} files: ${files.join(' ')}`);
