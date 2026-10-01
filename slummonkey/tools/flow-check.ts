// End-to-end flow on a phone-sized touch viewport: title -> comic -> island -> shop -> fight (touch input) -> pause.
// Saves screenshots to shots/flow-*.png and prints draw calls / fps. Usage: npx tsx tools/flow-check.ts
import { chromium } from "playwright";
import { createServer } from "vite";
import { join } from "node:path";
import { mkdirSync } from "node:fs";
import { ROOT } from "./node-sources";

async function main() {
  mkdirSync(join(ROOT, "shots"), { recursive: true });
  const server = await createServer({ root: ROOT, logLevel: "error", server: { port: 0, host: "127.0.0.1" } });
  await server.listen();
  const port = (server.httpServer!.address() as { port: number }).port;
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium", args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"] });
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const shot = (n: string) => page.screenshot({ path: join(ROOT, "shots", `flow-${n}.png`) });
  await page.goto(`http://127.0.0.1:${port}/`);
  await page.waitForFunction(() => (window as any).__ready === true, null, { timeout: 120000 });
  await page.waitForTimeout(500);
  await shot("1-title");
  await page.tap("text=New Game");
  await page.waitForTimeout(1200);
  await shot("2-comic");
  for (let i = 0; i < 8; i++) { await page.tap(".comic-page", { force: true }).catch(() => {}); await page.waitForTimeout(250); }
  await page.waitForFunction(() => !!(window as any).app.overworld, null, { timeout: 60000 });
  await page.waitForTimeout(1500);
  await shot("3-island");
  // walk with the floating joystick: touch in the left zone and drag up-left toward the shop
  const cdp = await ctx.newCDPSession(page);
  const touch = async (type: string, pts: { x: number; y: number; id: number }[]) =>
    cdp.send("Input.dispatchTouchEvent", { type, touchPoints: pts.map((p) => ({ x: p.x, y: p.y, id: p.id })) } as any);
  await touch("touchStart", [{ x: 150, y: 260, id: 1 }]);
  await touch("touchMove", [{ x: 120, y: 290, id: 1 }]);
  await page.waitForTimeout(400);
  await shot("4-joystick");
  await touch("touchEnd", []);
  await page.evaluate(() => (window as any).app.shop());
  await page.waitForTimeout(400);
  await shot("5-shop");
  await page.evaluate(() => (window as any).app.fight("boss", "gajraj"));
  await page.waitForFunction(() => ((window as any).app.session?.world?.t ?? 0) > 0.5, null, { timeout: 60000 });
  // hold SHOOT with the right thumb and push the stick with the left
  const btn = await page.evaluate(() => { const r = document.querySelector('.tbtn[data-id="shoot"]')!.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await touch("touchStart", [{ x: 150, y: 280, id: 1 }, { x: btn.x, y: btn.y, id: 2 }]);
  await touch("touchMove", [{ x: 190, y: 280, id: 1 }, { x: btn.x, y: btn.y, id: 2 }]);
  await page.waitForFunction(() => ((window as any).app.session?.world?.t ?? 0) > 2.5, null, { timeout: 60000 });
  const stats = await page.evaluate(() => {
    const a = (window as any).app;
    const info = a.view.renderer.info.render;
    return { sceneDrawCalls: a.view.sceneCalls, postCalls: info.calls, triangles: info.triangles, fps: Math.round(a.engine.fps), shots: a.session.world.player.stats.shots, px: Math.round(a.session.world.player.x), dpr: a.view.renderer.getPixelRatio() };
  });
  await shot("6-fight-touch");
  await touch("touchEnd", []);
  await page.tap(".pause-btn");
  await page.waitForTimeout(300);
  await shot("7-pause");
  console.log(JSON.stringify({ stats, errors }, null, 1));
  await browser.close();
  await server.close();
}
void main();
