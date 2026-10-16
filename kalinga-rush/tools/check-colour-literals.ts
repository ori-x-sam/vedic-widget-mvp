// Fails if a colour literal appears anywhere outside src/data/palettes.ts (§4.11).
// Run: npm run lint:colours
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const ALLOWED = new Set(['src/data/palettes.ts']);
const SCAN = ['src', 'index.html'];
const EXT = /\.(ts|css|html)$/;

const PATTERNS: { re: RegExp; what: string; only?: RegExp }[] = [
  { re: /#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?(?:[0-9a-fA-F]{2})?(?![0-9a-zA-Z_-])/g, what: 'hex colour' },
  { re: /\b0x[0-9a-fA-F]{6}\b/g, what: '0xRRGGBB number' },
  { re: /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(\s*[-\d.]/g, what: 'colour function' },
  {
    re: /:\s*[^;{}]*\b(?:white|black|red|green|blue|yellow|orange|pink|purple|gray|grey|brown|navy|teal|maroon|gold|silver|cyan|magenta)\b/g,
    what: 'named colour',
    only: /\.css$/,
  },
];

function walk(p: string, out: string[]): void {
  const full = join(ROOT, p);
  if (statSync(full).isDirectory()) {
    for (const f of readdirSync(full)) walk(join(p, f), out);
  } else if (EXT.test(p)) out.push(p);
}

const files: string[] = [];
for (const p of SCAN) walk(p, files);

const problems: string[] = [];
for (const f of files) {
  const rel = relative(ROOT, join(ROOT, f)).replace(/\\/g, '/');
  if (ALLOWED.has(rel)) continue;
  const lines = readFileSync(join(ROOT, f), 'utf8').split('\n');
  lines.forEach((line, i) => {
    // ignore comments that discuss colours
    let code = line.replace(/\/\/.*$/, '').replace(/\/\*.*?\*\//g, '');
    // custom properties and class names are names, not colours
    if (rel.endsWith('.css')) code = code.replace(/--[\w-]+/g, '').replace(/\.[a-zA-Z][\w-]*/g, '');
    for (const p of PATTERNS) {
      if (p.only && !p.only.test(rel)) continue;
      p.re.lastIndex = 0;
      const m = p.re.exec(code);
      if (m) problems.push(`${rel}:${i + 1}  ${p.what}: ${m[0].trim()}`);
    }
  });
}

if (problems.length) {
  console.error(`Colour literals found outside src/data/palettes.ts (${problems.length}):\n` + problems.map((p) => `  ${p}`).join('\n'));
  process.exit(1);
}
console.log(`lint:colours ✓ ${files.length} files, no colour literals outside palettes.ts`);
