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

const SHOTS = [
  ["boss=gajraj&phase=0&seed=3", "gajraj-p1", 5],
  ["boss=gajraj&phase=1&seed=3", "gajraj-p2", 5],
  ["boss=gajraj&phase=2&seed=3", "gajraj-p3", 5],
] as const;

async function main() {
  const args = process.argv.slice(2);
  mkdirSync(join(ROOT, "shots"), { recursive: true });
  const list: (readonly [string, string, number])[] = args[0] === "--all" || !args.length ? [...SHOTS] : [[args[0], args[1] ?? "shot", Number(args[2] ?? 4)]];
  const w = Number(args[3] ?? 1280), h = Number(args[4] ?? 600);
  await withGame(async (open) => {
    for (const [q, name, wait] of list) {
      const page = await open(q, w, h);
      await page.waitForTimeout(wait * 1000);
      const out = join(ROOT, "shots", name.endsWith(".png") ? name : `${name}.png`);
      await page.screenshot({ path: out });
      console.log("saved", out);
      await page.close();
    }
  });
}

if (import.meta.url === `file://${process.argv[1]}`) void main();
