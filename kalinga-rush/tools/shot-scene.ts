// Screenshot composed scenes via the dev server's preview page.
// Usage: npx tsx tools/shot-scene.ts <outDir> r02:0.1,0.5 r03:0.3 ...
//        npx tsx tools/shot-scene.ts <outDir> '/preview-sprites.html?set=hazards'   (any dev page that sets window.__ready)
// Starts its own Vite dev server on a free port.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

const [outDir, ...specs] = process.argv.slice(2);
if (!outDir || !specs.length) {
  console.error('usage: tsx tools/shot-scene.ts <outDir> r02:0.1,0.5 ...');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
const server = await createServer({ root: join(import.meta.dirname, '..'), server: { port: 0, host: '127.0.0.1' }, logLevel: 'error' });
await server.listen();
const addr = server.httpServer!.address();
const port = typeof addr === 'object' && addr ? addr.port : 5173;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (e) => console.error('pageerror', e.message));
for (const spec of specs) {
  if (spec.startsWith('/')) {
    await page.goto(`http://127.0.0.1:${port}${spec}`);
    await page.waitForFunction('window.__ready', null, { timeout: 60000 }).catch(() => console.error(`${spec}: not ready`));
    const vp = (await page.evaluate('[document.documentElement.scrollWidth, document.documentElement.scrollHeight]')) as [number, number];
    await page.setViewportSize({ width: Math.min(2400, vp[0]), height: Math.min(3000, vp[1]) });
    const file = join(outDir, spec.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') + '.png');
    await page.screenshot({ path: file, fullPage: true });
    await page.setViewportSize({ width: 1280, height: 720 });
    console.log(file);
    continue;
  }
  const [id, ats = '0.1'] = spec.split(':');
  for (const at of ats.split(',')) {
    await page.goto(`http://127.0.0.1:${port}/preview.html?scene=${id}&at=${at}`);
    try {
      await page.waitForFunction('window.__ready', null, { timeout: 30000 });
    } catch {
      console.error(`${id}@${at}: not ready —`, (await page.textContent('body'))?.slice(0, 300));
      continue;
    }
    const info = await page.evaluate('window.__ready');
    const file = join(outDir, `${id}-${at}.png`);
    await page.locator('#c').screenshot({ path: file });
    console.log(file, JSON.stringify(info));
  }
}
await browser.close();
await server.close();
