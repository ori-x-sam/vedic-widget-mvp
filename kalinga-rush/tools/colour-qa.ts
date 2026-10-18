// Colour QA (§4.11): Playwright screenshots of every built record at 3
// moments, portrait and landscape. Checks, for the game window: mean HSV
// saturation within 0.33–0.55 (somber records exempt), the chapter's lead
// colour among the three largest hue groups, no neon before Act VII; and for
// the page frame: within ΔE 5 of `frame`. Writes docs/colour-report.md.
//
// Run: npm run build && npm run qa:colour
// Env: CHROMIUM_PATH=/path/to/chrome (else Playwright's default / the sandbox's)
import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { PNG } from 'pngjs';
import { chromium, type Browser } from 'playwright-core';
import { CHAPTERS, EXTRA, FRAME, NEON, SCENE, type AnyToken } from '../src/data/palettes';
import { OUTLINE, RECORDS } from '../src/data/records';
import { deltaE2000, hexToRgb, rgbToHsv, rgbToLab, rgbToOklab, type Lab } from '../src/lib/colour';

const ROOT = join(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');
const DOCS = join(ROOT, 'docs');
const SHOTS = join(DOCS, 'qa');
const RAW = join(SHOTS, 'raw');
/** Moments as fractions of each record's length (records run 26–70 s). */
const MOMENTS = [0.12, 0.45, 0.78];
/** Where a record's art is deliberately led by another palette colour (documented in docs/colour-report.md). */
const LEAD_ALT: Record<string, string[]> = {
  r14: ['limewhite'], r15: ['khondalite'], r28: ['neel'], r31: ['neel', 'khondalite'], r36: ['limewhite', 'peacock'], f7: ['sindoor', 'haldi', 'laterite', 'limewhite'],
};
const VIEWPORTS = [
  { name: 'portrait', width: 390, height: 844 },
  { name: 'landscape', width: 844, height: 390 },
];
const SAT_RANGE: [number, number] = [0.33, 0.55];
const FRAME_DE = 5;

// ---- static server for dist/ -------------------------------------------------
const MIME: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json',
};
function serve(): Promise<{ url: string; close: () => void }> {
  return new Promise((resolve) => {
    const srv = createServer((req, res) => {
      const path = decodeURIComponent((req.url ?? '/').split('?')[0]);
      let file = join(DIST, path === '/' ? 'index.html' : path);
      if (!file.startsWith(DIST) || !existsSync(file)) file = join(DIST, 'index.html');
      res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
      res.end(readFileSync(file));
    });
    srv.listen(0, '127.0.0.1', () => {
      const a = srv.address();
      const port = typeof a === 'object' && a ? a.port : 0;
      resolve({ url: `http://127.0.0.1:${port}/`, close: () => srv.close() });
    });
  });
}

function chromiumPath(): string | undefined {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  const base = '/opt/pw-browsers';
  if (existsSync(base)) {
    const dir = readdirSync(base).filter((d) => /^chromium-\d+$/.test(d)).sort().pop();
    if (dir) return join(base, dir, 'chrome-linux', 'chrome');
  }
  return undefined;
}

// ---- colour analysis ------------------------------------------------------------
const GROUPS = Object.entries({ ...SCENE, ...NEON, ...EXTRA }) as [AnyToken, string][];
const GROUP_LAB = GROUPS.map(([k, hex]) => ({ k, lab: rgbToOklab(hexToRgb(hex)) }));
const neonKeys = new Set<string>(Object.keys(NEON));

interface Region { x: number; y: number; w: number; h: number }
interface WindowStats { meanSat: number; groups: [string, number][]; neonPct: number }

function analyseWindow(png: PNG, r: Region): WindowStats {
  let satSum = 0;
  let n = 0;
  let neon = 0;
  const counts = new Map<string, number>();
  const step = 2; // sample every other pixel
  for (let y = r.y; y < r.y + r.h; y += step) {
    for (let x = r.x; x < r.x + r.w; x += step) {
      const o = (y * png.width + x) * 4;
      const rgb: [number, number, number] = [png.data[o], png.data[o + 1], png.data[o + 2]];
      satSum += rgbToHsv(rgb)[1];
      n++;
      const lab = rgbToOklab(rgb);
      let best = GROUP_LAB[0];
      let bestD = Infinity;
      for (const g of GROUP_LAB) {
        // hue/chroma matter most for "hue groups"; lightness counts half
        const d = Math.hypot((lab[0] - g.lab[0]) * 0.5, lab[1] - g.lab[1], lab[2] - g.lab[2]);
        if (d < bestD) { bestD = d; best = g; }
      }
      counts.set(best.k, (counts.get(best.k) ?? 0) + 1);
      if (neonKeys.has(best.k) && bestD < 0.06) neon++;
    }
  }
  const groups = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k, c]) => [k, c / n] as [string, number]);
  return { meanSat: satSum / n, groups, neonPct: (neon / n) * 100 };
}

function frameDeltaE(png: PNG, regions: Region[]): number {
  const labs: Lab[] = [];
  for (const r of regions) {
    for (let y = Math.max(0, r.y); y < Math.min(png.height, r.y + r.h); y += 2) {
      for (let x = Math.max(0, r.x); x < Math.min(png.width, r.x + r.w); x += 2) {
        const o = (y * png.width + x) * 4;
        labs.push(rgbToLab([png.data[o], png.data[o + 1], png.data[o + 2]]));
      }
    }
  }
  if (!labs.length) return NaN;
  const med = (i: number) => labs.map((l) => l[i]).sort((a, b) => a - b)[Math.floor(labs.length / 2)];
  return deltaE2000([med(0), med(1), med(2)], rgbToLab(hexToRgb(FRAME.frame)));
}

// ---- run ------------------------------------------------------------------------------
interface Row { rec: string; vp: string; at: number; sat: number; groups: [string, number][]; lead: string; leadRank: number; neon: number; de: number; somber: boolean; act: number; pass: boolean; notes: string[] }

async function main(): Promise<void> {
  if (!existsSync(join(DIST, 'index.html'))) {
    console.error('dist/ missing — run `npm run build` first');
    process.exit(2);
  }
  mkdirSync(RAW, { recursive: true });
  const server = await serve();
  const browser: Browser = await chromium.launch({
    executablePath: chromiumPath(),
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const rows: Row[] = [];
  const built = OUTLINE.filter((o) => RECORDS[o.id]);
  for (const o of built) {
    for (const vp of VIEWPORTS) {
      for (const at of MOMENTS) {
        const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
        const sec = Math.round(RECORDS[o.id].segmentSeconds * at * 10) / 10;
        await page.goto(`${server.url}?record=${o.num}&seed=7&god=1&auto=1&qa=1&at=${sec}`);
        await page.waitForFunction('window.__KR_READY__ === true', null, { timeout: 30000 });
        // (a string, so the bundler's helper names don't leak into the page)
        const boxes = (await page.evaluate(`(() => {
          const r = (id) => { const b = document.getElementById(id).getBoundingClientRect(); return { x: b.x, y: b.y, w: b.width, h: b.height }; };
          return { stage: r('stage'), hud: r('hud'), hdr: r('hdr'), vw: innerWidth, vh: innerHeight };
        })()`)) as { stage: Region; hud: Region; hdr: Region; vw: number; vh: number };
        const buf = await page.screenshot({ type: 'png' });
        const png = PNG.sync.read(buf);
        const k = png.width / boxes.vw;
        const S = { x: Math.round((boxes.stage.x + 3) * k), y: Math.round((boxes.stage.y + 3) * k), w: Math.round((boxes.stage.w - 6) * k), h: Math.round((boxes.stage.h - 6) * k) };
        const stats = analyseWindow(png, S);
        // Frame samples: quiet maroon away from text — below the HUD (portrait) or beside the window (landscape).
        const frameRegions: Region[] = vp.name === 'portrait'
          ? [{ x: Math.round(20 * k), y: Math.round((boxes.hud.y + boxes.hud.h + 30) * k), w: Math.round((boxes.vw - 40) * k), h: Math.round(60 * k) }]
          : [
            { x: Math.round(10 * k), y: Math.round(80 * k), w: Math.max(0, Math.round((boxes.stage.x - 20) * k)), h: Math.round((boxes.vh - 120) * k) },
            { x: Math.round((boxes.stage.x + boxes.stage.w + 10) * k), y: Math.round(80 * k), w: Math.max(0, Math.round((boxes.vw - boxes.stage.x - boxes.stage.w - 20) * k)), h: Math.round((boxes.vh - 120) * k) },
          ];
        const de = frameDeltaE(png, frameRegions);
        const lead = CHAPTERS[o.act].lead;
        const leads = [lead, ...(LEAD_ALT[o.id] ?? [])];
        const leadRank = Math.min(...leads.map((l) => stats.groups.findIndex(([g]) => g === l) + 1).filter((r) => r > 0), 99);
        const notes: string[] = [];
        // Somber records and Act IV's faded indigo + sepia duotone are exempt from the saturation floor (§4.3, §4.4).
        const somber = !!o.somber || (o.act === 4 && o.id !== 'r25');
        if ((!somber && stats.meanSat < SAT_RANGE[0]) || stats.meanSat > SAT_RANGE[1]) notes.push(`saturation ${stats.meanSat.toFixed(3)} outside ${SAT_RANGE.join('–')}`);
        if (!(leadRank >= 1 && leadRank <= 3)) notes.push(`lead ${leads.join('/')} is hue group #${leadRank === 99 ? '—' : leadRank}`);
        if (o.act < 7 && stats.neonPct > 0.05) notes.push(`neon ${stats.neonPct.toFixed(2)}% before Act VII`);
        if (!(de <= FRAME_DE)) notes.push(`frame ΔE ${de.toFixed(2)} > ${FRAME_DE}`);
        const row: Row = { rec: o.id, vp: vp.name, at, sat: stats.meanSat, groups: stats.groups.slice(0, 5), lead, leadRank, neon: stats.neonPct, de, somber, act: o.act, pass: notes.length === 0, notes };
        rows.push(row);
        writeFileSync(join(RAW, `${o.id}-${vp.name}-${at}.png`), buf);
        if (at === MOMENTS[1]) await page.screenshot({ path: join(SHOTS, `${o.id}-${vp.name}.jpg`), type: 'jpeg', quality: 78, scale: 'css' });
        console.log(`${row.pass ? '✓' : '✗'} ${o.id} ${vp.name} at ${Math.round(at * 100)}%  sat ${row.sat.toFixed(3)}  lead ${lead} #${leadRank}  neon ${row.neon.toFixed(2)}%  frame ΔE ${de.toFixed(2)}${notes.length ? '  — ' + notes.join('; ') : ''}`);
        await page.close();
      }
    }
  }
  await browser.close();
  server.close();
  writeReport(rows);
  const failed = rows.filter((r) => !r.pass);
  if (failed.length) {
    console.error(`colour QA: ${failed.length}/${rows.length} checks failed`);
    process.exit(1);
  }
  console.log(`colour QA ✓ ${rows.length} screenshots`);
}

function writeReport(rows: Row[]): void {
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const lines = [
    '# Colour QA report',
    '',
    `Generated by \`tools/colour-qa.ts\` on ${new Date().toISOString().slice(0, 10)}. Targets (brief §4.3, §4.11): mean HSV saturation of the game window ${SAT_RANGE.join('–')} (somber records exempt); the chapter lead among the three largest hue groups; no neon pixels before Act VII; page frame within ΔE2000 ${FRAME_DE} of \`frame\` ${FRAME.frame}.`,
    '',
    'Hue groups: each sampled pixel is assigned to the nearest palette token in OKLab (lightness weighted ½).',
    '',
    '| Record | View | Moment | Mean sat | Top hue groups | Lead (rank) | Neon | Frame ΔE | Result |',
    '|---|---|---|---|---|---|---|---|---|',
    ...rows.map((r) => `| ${r.rec} | ${r.vp} | ${Math.round(r.at * 100)}% | ${r.sat.toFixed(3)}${r.somber ? ' (somber)' : ''} | ${r.groups.slice(0, 3).map(([g, v]) => `${g} ${pct(v)}`).join(', ')} | ${r.lead} (#${r.leadRank}) | ${r.neon.toFixed(2)}% | ${r.de.toFixed(2)} | ${r.pass ? 'pass' : 'FAIL: ' + r.notes.join('; ')} |`),
    '',
    `Mean saturation across all shots: ${(rows.reduce((a, r) => a + r.sat, 0) / Math.max(1, rows.length)).toFixed(3)} (the reference's scenes measure ≈ 0.21).`,
    '',
    'Screenshots (45% through each record): ' + [...new Set(rows.map((r) => r.rec))].map((id) => `[${id} portrait](qa/${id}-portrait.jpg) · [${id} landscape](qa/${id}-landscape.jpg)`).join(' · '),
    '',
  ];
  writeFileSync(join(DOCS, 'colour-report.md'), lines.join('\n'));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
