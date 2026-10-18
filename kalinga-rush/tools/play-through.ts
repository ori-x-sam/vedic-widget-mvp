// Integration smoke test: loads the real game on the dev server and autopilots
// through records via ?auto=1&god=1, checking that each record bakes, runs,
// and ends without page errors. Usage: npx tsx tools/play-through.ts 1,2,3 [seconds-each]
import { join } from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright-core';

const nums = (process.argv[2] ?? '1').split(',').map(Number);
const secs = Number(process.argv[3] ?? 8);
const server = await createServer({ root: join(import.meta.dirname, '..'), server: { port: 0, host: '127.0.0.1' }, logLevel: 'error' });
await server.listen();
const addr = server.httpServer!.address();
const port = typeof addr === 'object' && addr ? addr.port : 5173;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
let bad = 0;
for (const n of nums) {
  const page = await browser.newPage({ viewport: { width: 1000, height: 720 } });
  const errs: string[] = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(`http://127.0.0.1:${port}/?record=${n}&god=1&auto=1&at=${Math.max(0, secs - 3)}`);
  await page.waitForTimeout(secs * 1000);
  const ok = (await page.evaluate("!!document.querySelector('#game canvas') && document.getElementById('app').classList.contains('is-playing')")) as boolean;
  const hdr = await page.textContent('#hdr-headline');
  console.log(`${errs.length || !ok ? '✗' : '✓'} #${n} ${hdr?.trim().slice(0, 40)}${errs.length ? ' — ' + errs.slice(0, 2).join(' | ') : ''}`);
  if (errs.length || !ok) bad++;
  await page.close();
}
await browser.close();
await server.close();
process.exit(bad ? 1 : 0);
