import { createServer } from 'vite';
import { chromium } from 'playwright-core';
const server = await createServer({ root: '/home/user/vedic-widget-mvp/kalinga-rush', server: { port: 0, host: '127.0.0.1' }, logLevel: 'error' });
await server.listen();
const port = (server.httpServer!.address() as any).port;
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await b.newPage({ viewport: { width: 700, height: 500 } });
await page.goto(`http://127.0.0.1:${port}/?record=5&god=1&auto=1&at=38`);
for (let i = 0; i < 4; i++) {
  await page.waitForTimeout(3000);
  console.log(await page.evaluate("JSON.stringify({fps: window.__KR_GAME__.loop.actualFps, t: window.__KR_GAME__.scene.getScene('Run')?.sim?.t, card: document.getElementById('card-layer').className})"));
}
await b.close(); await server.close();
