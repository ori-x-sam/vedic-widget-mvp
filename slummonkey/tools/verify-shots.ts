// Quick visual check: a few scenes at phone + desktop sizes into shots/verify-*.png.
import { join } from "node:path";
import { withGame, waitSim } from "./shoot";
import { ROOT } from "./node-sources";

const LIST: [string, string, number, number, number][] = [
  ["boss=gajraj&phase=0&seed=3&bot=0.8&god", "gajraj-land", 5, 844, 390],
  ["boss=raj&phase=3&seed=3&bot=0.8&god", "raj4-land", 5, 1280, 600],
  ["overworld", "ow-land", 2, 844, 390],
  ["overworld", "ow-port", 2, 390, 844],
  ["boss=dolly&phase=1&seed=3&bot=0.8&god", "dolly-port", 5, 390, 844],
  ["level=rickshaw-sky&seed=3&bot=0.8&god", "shmup", 6, 1280, 600],
];
await withGame(async (open) => {
  for (const [q, name, wait, w, h] of process.argv[2] ? LIST.filter((l) => l[1].startsWith(process.argv[2])) : LIST) {
    const page = await open(q + "&touch", w, h);
    await waitSim(page, wait);
    await page.screenshot({ path: join(ROOT, "shots", `verify-${name}.png`) });
    console.log("saved", name);
    await page.close();
  }
});
