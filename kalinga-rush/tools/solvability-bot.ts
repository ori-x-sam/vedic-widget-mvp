// Solvability bot (§5): plays every record's generated pattern headlessly with
// frame-perfect inputs (beam search over the real simulation) at normal and
// Assist speed, for several seeds. Fails (exit 1) if any pattern is impossible.
// Run: npm run bot   (env SEEDS=5 to try more seeds)
import { OUTLINE, RECORDS } from '../src/data/records';
import { vehicle } from '../src/data/vehicles';
import { recordSpeed } from '../src/systems/difficulty';
import { buildLevel } from '../src/systems/spawner';
import { solveLevel } from '../src/systems/solver';

const LANE = 598;
const SEEDS = Number(process.env.SEEDS ?? 3);
let failed = 0;
const t0 = Date.now();
for (const o of OUTLINE) {
  const rec = RECORDS[o.id];
  const p = vehicle(rec.ride);
  const cells: string[] = [];
  for (const assist of [false, true]) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const level = buildLevel(rec, { seed, speed: recordSpeed(rec.num, assist), laneY: LANE, profile: p, assist });
      const res = solveLevel(level, p);
      if (!res.ok) {
        failed++;
        cells.push(`✗ seed ${seed}${assist ? ' assist' : ''} stuck at ${res.failedAt?.toFixed(1)}s`);
      } else cells.push('✓');
    }
  }
  const ok = cells.every((c) => c === '✓');
  console.log(`${ok ? '✓' : '✗'} ${String(o.num).padStart(2)} ${o.id.padEnd(3)} ${rec.ride.padEnd(13)} ${ok ? `${cells.length} patterns solvable` : cells.filter((c) => c !== '✓').join('; ')}`);
}
console.log(`\n${failed ? `✗ ${failed} unsolvable pattern(s)` : '✓ every record is solvable'} · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
process.exit(failed ? 1 : 0);
