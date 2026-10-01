// Balance bot: plays every boss/level headlessly with the heuristic Bot and reports
// median time-to-kill, win rate, deaths and what actually caused each death, per phase.
// It flags things that look UNFAIR instead of silently nerfing them.
// Usage: npx tsx tools/balance-bot.ts [id ...] [--runs=24] [--skill=0.7] [--json]
import { loadContent } from "../src/core/content";
import { InputMerger } from "../src/core/input";
import { World } from "../src/rules/world";
import { Bot } from "../src/bot/bot";
import { parseCssTokens } from "../src/core/tokens";
import { nodeKdlFiles, nodeCssFiles } from "./node-sources";

interface Run { win: boolean; t: number; phaseReached: string; deathBy?: string; deathPhase?: string; untelegraphed?: boolean; spawnedAgo?: number; hits: { by: string; phase: string; t: number }[]; parries: number; safeViolations: number; frames: number; errors: string[] }

const arg = (k: string, d: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1] ?? d;
const RUNS = Number(arg("runs", "24"));
const SKILL = Number(arg("skill", "0.7"));
const MAX_T = Number(arg("max", "300"));

export function playOnce(id: string, seed: number, skill: number, god = false): Run {
  const content = loadContent(nodeKdlFiles());
  const kind = content.bosses[id] ? "boss" : "level";
  const w = new World(content, { weapons: ["coin", "mirchi"], super: "to-the-moon", charm: "" }, seed);
  if (kind === "boss") w.startBoss(id); else w.startLevel(id);
  const bot = new Bot({ skill, seed: seed * 7 + 1, reaction: 0.22 - skill * 0.08 });
  const merger = new InputMerger();
  merger.add(() => bot.step(w));
  const hits: Run["hits"] = [];
  // safe zones in world space at a reference 19.5:9 phone (view 720 tall => 1560 wide)
  const tokens = parseCssTokens(Object.values(nodeCssFiles()).join("\n"));
  const floorFrac = parseFloat(tokens["--floor-frac"] ?? "0.27");
  const viewH = 720, viewW = 1560;
  const zones = content.controls.safe.map((s) => ({ x0: (s.x - 0.5) * viewW, x1: (s.x + s.w - 0.5) * viewW, y0: -floorFrac * viewH + s.y * viewH, y1: -floorFrac * viewH + (s.y + s.h) * viewH }));
  let safeViolations = 0, frames = 0;
  while (!w.result && w.t < MAX_T) {
    w.step(merger.frame());
    for (const e of w.events) {
      if (e.type === "player-hurt") hits.push({ by: e.s ?? "?", phase: w.phase?.id ?? w.level?.id ?? "", t: w.t });
    }
    w.events.length = 0;
    if (god && w.player.hp < 2) w.player.hp = 3;
    frames++;
    if (frames % 6 === 0) {
      for (const q of w.projs.live) if (q.hostile && q.len === 0) {
        const sx = q.x - w.camX, sy = q.y - w.camY;
        if (zones.some((z) => sx > z.x0 && sx < z.x1 && sy > z.y0 && sy < z.y1)) { safeViolations++; break; }
      }
    }
  }
  const d = w.deaths[0];
  return {
    win: w.result === "win", t: w.t, phaseReached: w.phase?.id ?? w.level?.id ?? "", deathBy: d?.by, deathPhase: d?.phase,
    untelegraphed: d ? !d.telegraphed && d.spawnedAgo < 0.3 : undefined, spawnedAgo: d?.spawnedAgo, hits, parries: w.player.stats.parries,
    safeViolations, frames: frames / 6, errors: w.errors,
  };
}

const median = (a: number[]) => { if (!a.length) return NaN; const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

export function report(id: string, runs = RUNS, skill = SKILL) {
  const rs: Run[] = [];
  for (let i = 0; i < runs; i++) rs.push(playOnce(id, 1000 + i, skill));
  const god: Run[] = [];
  for (let i = 0; i < Math.max(4, runs / 4); i++) god.push(playOnce(id, 5000 + i, skill, true));
  const wins = rs.filter((r) => r.win);
  const causes: Record<string, number> = {};
  for (const r of rs) if (r.deathBy) causes[`${r.deathPhase} ← ${r.deathBy}`] = (causes[`${r.deathPhase} ← ${r.deathBy}`] ?? 0) + 1;
  const hitsBy: Record<string, number> = {};
  const phaseTime: Record<string, number> = {};
  for (const r of god) for (const h of r.hits) hitsBy[`${h.phase} ← ${h.by}`] = (hitsBy[`${h.phase} ← ${h.by}`] ?? 0) + 1;
  const flags: string[] = [];
  const unteleg = rs.filter((r) => r.untelegraphed);
  if (unteleg.length) flags.push(`UNFAIR? ${unteleg.length} death(s) from projectiles that hit < 0.3s after spawning with no telegraph in the last 2.5s: ${[...new Set(unteleg.map((r) => `${r.deathPhase}←${r.deathBy}`))].join(", ")}`);
  const timeouts = god.filter((r) => !r.win);
  if (timeouts.length) flags.push(`STUCK: ${timeouts.length}/${god.length} invulnerable runs could not finish within ${MAX_T}s (phase: ${[...new Set(timeouts.map((r) => r.phaseReached))].join(", ")})`);
  const sv = rs.reduce((a, r) => a + r.safeViolations, 0) / Math.max(1, rs.reduce((a, r) => a + r.frames, 0));
  if (sv > 0.05) flags.push(`SAFE-ZONE: hostile projectiles sit under the thumb zones ${(sv * 100).toFixed(1)}% of the time (target < 5%)`);
  const top = Object.entries(hitsBy).sort((a, b) => b[1] - a[1]);
  const totalHits = top.reduce((a, b) => a + b[1], 0);
  if (top[0] && top[0][1] / totalHits > 0.45 && totalHits > 8) flags.push(`HOTSPOT: "${top[0][0]}" causes ${(100 * top[0][1] / totalHits) | 0}% of all hits — check its telegraph/readability`);
  const errs = [...new Set(rs.flatMap((r) => r.errors))];
  if (errs.length) flags.push(`CONTENT ERRORS: ${errs.join("; ")}`);
  for (const r of god) for (const h of r.hits) phaseTime[h.phase] = (phaseTime[h.phase] ?? 0) + 1;
  return {
    id, runs, skill,
    winRate: wins.length / runs,
    medianTTK: median(wins.map((r) => r.t)),
    medianTTKgod: median(god.filter((r) => r.win).map((r) => r.t)),
    deaths: rs.length - wins.length,
    deathCauses: causes,
    hitsPerRunGod: Object.fromEntries(top.map(([k, v]) => [k, +(v / god.length).toFixed(2)])),
    parriesPerRun: +(rs.reduce((a, r) => a + r.parries, 0) / runs).toFixed(2),
    safeZonePct: +(sv * 100).toFixed(2),
    flags,
  };
}

function main() {
  const content = loadContent(nodeKdlFiles());
  const ids = process.argv.slice(2).filter((a) => !a.startsWith("--"));
  const list = ids.length ? ids : [...Object.keys(content.bosses), ...Object.keys(content.levels)];
  const out = list.map((id) => report(id));
  if (process.argv.includes("--json")) { console.log(JSON.stringify(out, null, 2)); return; }
  for (const r of out) {
    console.log(`\n══ ${r.id}  (bot skill ${r.skill}, ${r.runs} runs)`);
    console.log(`  win rate ${(r.winRate * 100).toFixed(0)}% · median TTK ${r.medianTTK.toFixed(1)}s (wins) · ${r.medianTTKgod.toFixed(1)}s (no-death runs) · parries/run ${r.parriesPerRun} · safe-zone ${r.safeZonePct}%`);
    console.log(`  deaths: ${r.deaths}`);
    for (const [k, v] of Object.entries(r.deathCauses).sort((a, b) => b[1] - a[1])) console.log(`    ${v}× ${k}`);
    console.log(`  hits per run (invulnerable runs, by phase ← cause):`);
    for (const [k, v] of Object.entries(r.hitsPerRunGod)) console.log(`    ${v}  ${k}`);
    for (const f of r.flags) console.log(`  ⚠ ${f}`);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
