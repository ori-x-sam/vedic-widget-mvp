// Dev helper: open the game at a URL query on the dev server, wait, screenshot,
// and print console errors. Usage: npx tsx tools/play-shot.ts <outDir> "record=2&god=1" [waitMs] [w] [h]
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

const [outDir, ...qs] = process.argv.slice(2);
mkdirSync(outDir, { recursive: true });
const server = await createServer({ root: join(import.meta.dirname, '..'), server: { port: 0, host: '127.0.0.1' }, logLevel: 'error' });
await server.listen();
const addr = server.httpServer!.address();
const port = typeof addr === 'object' && addr ? addr.port : 5173;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required'] });
for (const spec of qs) {
  const [q, wait = '6000', w = '1280', h = '800'] = spec.split('|');
  const page = await browser.newPage({ viewport: { width: Number(w), height: Number(h) } });
  page.on('pageerror', (e) => console.error('pageerror', e.message, e.stack?.split('\n').slice(0, 3).join(' | ')));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error('console', m.type(), m.text()); });
  await page.goto(`http://127.0.0.1:${port}/?${q}`);
  await page.waitForTimeout(Number(wait));
  const file = join(outDir, q.replace(/[^a-z0-9]+/gi, '_') + '.png');
  await page.screenshot({ path: file });
  console.log(file);
  await page.close();
}
await browser.close();
await server.close();
