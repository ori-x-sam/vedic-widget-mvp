// Screenshot tool: boots the real game in headless Chromium and captures frames.
// Usage: npx tsx tools/shoot.ts "boss=gajraj&phase=0" out.png [waitSeconds] [width] [height]
//        npx tsx tools/shoot.ts --all   (every boss phase + levels + overworld -> shots/)
import { chromium } from "playwright";
import { createServer } from "vite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { ROOT } from "./node-sources";

export async function withGame<T>(fn: (open: (query: string, w?: number, h?: number) => Promise<import("playwright").Page>) => Promise<T>): Promise<T> {
  const server = await createServer({ root: ROOT, logLevel: "error", server: { port: 0, host: "127.0.0.1" } });
  await server.listen();
  const addr = server.httpServer!.address() as { port: number };
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM ?? "/opt/pw-browsers/chromium",
    args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"],
  });
  try {
    return await fn(async (query, w = 1280, h = 600) => {
      const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
      page.on("pageerror", (e) => console.error("[pageerror]", e.message));
      page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.error("[console]", m.text()); });
      await page.goto(`http://127.0.0.1:${addr.port}/?${query}`);
      await page.waitForFunction(() => (window as unknown as { __ready?: boolean }).__ready === true, null, { timeout: 120000 });
      return page;
    });
  } finally {
    await browser.close();
    await server.close();
  }
}

/** Wait for `secs` of simulated game time (headless GPUs run slower than real time). */
export async function waitSim(page: import("playwright").Page, secs: number) {
  const hasSession = await page.evaluate(() => !!(window as any).app?.session);
  if (!hasSession) { await page.waitForTimeout(secs * 1000); return; }
  await page.waitForFunction((s) => ((window as any).app?.session?.world?.t ?? 0) >= s, secs, { timeout: secs * 20000 + 30000, polling: 250 });
}

const SHOTS = [
  ["boss=gajraj&phase=0&seed=3&bot=0.8&god", "gajraj-p1", 6],
  ["boss=gajraj&phase=1&seed=3&bot=0.8&god", "gajraj-p2", 7],
  ["boss=gajraj&phase=2&seed=3&bot=0.8&god", "gajraj-p3", 7],
  ["boss=teen-tigada&phase=0&seed=3&bot=0.8&god", "tigada-p1", 7],
  ["boss=teen-tigada&phase=1&seed=3&bot=0.8&god", "tigada-p2", 7],
  ["boss=teen-tigada&phase=2&seed=3&bot=0.8&god", "tigada-p3", 7],
  ["boss=dolly&phase=0&seed=3&bot=0.8&god", "dolly-p1", 6],
  ["boss=dolly&phase=1&seed=3&bot=0.8&god", "dolly-p2", 6],
  ["boss=dolly&phase=2&seed=3&bot=0.8&god", "dolly-p3", 7],
  ["boss=raj&phase=0&seed=3&bot=0.8&god", "raj-p1", 6],
  ["boss=raj&phase=1&seed=3&bot=0.8&god", "raj-p2", 9],
  ["boss=raj&phase=2&seed=3&bot=0.8&god", "raj-p3", 9],
  ["boss=raj&phase=3&seed=3&bot=0.8&god", "raj-p4", 7],
  ["level=mela&seed=3&bot=0.8&god", "mela", 9],
  ["level=rickshaw-sky&seed=3&bot=0.8&god", "shmup", 8],
  ["overworld", "overworld", 3],
  ["level=mela&seed=5&bot=0.95&god", "mela-b", 5],
  ["story=intro", "story-intro", 2],
] as const;

async function main() {
  const args = process.argv.slice(2);
  mkdirSync(join(ROOT, "shots"), { recursive: true });
  const list: (readonly [string, string, number])[] = args[0] === "--all" || !args.length ? [...SHOTS] : [[args[0], args[1] ?? "shot", Number(args[2] ?? 4)]];
  const w = Number(args[3] ?? 1280), h = Number(args[4] ?? 600);
  await withGame(async (open) => {
    for (const [q, name, wait] of list) {
      const page = await open(q, w, h);
      await waitSim(page, wait);
      const out = join(ROOT, "shots", name.endsWith(".png") ? name : `${name}.png`);
      await page.screenshot({ path: out });
      console.log("saved", out);
      await page.close();
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) void main();
