// Appends/refreshes the per-record prompt tables in ASSETS.md (records 02–F8):
// one image-generation prompt per parallax layer plus the ride and hazard
// sprites, built from each record's subject and chapter palette (§4.10).
// Record 01's hand-written section stays as it is. Run: npx tsx tools/gen-assets.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CHAPTERS, TOKENS } from '../src/data/palettes';
import { ACT_NAMES, OUTLINE, RECORDS } from '../src/data/records';

const FILE = join(import.meta.dirname, '..', 'ASSETS.md');
const START = '<!-- generated:start -->';
const END = '<!-- generated:end -->';

const RIDES: Record<string, string> = {
  canoe: 'a laterite wooden dugout canoe', cart: 'a small wooden bullock cart pulled by one friendly white bullock', boita: 'a small Kalinga boita ship with a striped sail',
  foot: 'running on foot', elephant: 'a gentle elephant in a sindoor-and-haldi caparison', boitaElephant: 'a boita ship carrying an elephant on deck, sitting low in the water',
  palanquin: 'a small palanquin carried by two running bearers', pressCart: 'a handcart carrying a small printing press', bicycle: 'an old black roadster bicycle',
  countryBoat: 'a small country boat with a single oar', dakota: 'a generic 1940s twin-engine propeller plane (no markings)', bus: 'a generic Odisha town bus with a hand-painted stripe (no names)',
  train: 'a generic small locomotive cab', scooter: 'an e-scooter', maglev: 'a sleek boita-shaped maglev pod with a soft radium-cyan glow', eboat: 'a small electric boat descended from the dugout canoe',
  glider: 'a hang-glider with an appliqué-patterned wing', lightsail: 'a little space suit with a fishbowl helmet on a sail-board', starBoita: 'a boita-shaped starship with glowing sails',
};

const hex = (k: string) => `${k} ${(TOKENS as Record<string, string>)[k] ?? ''}`.trim();
const out: string[] = [START, ''];
for (const o of OUTLINE.slice(1)) {
  const r = RECORDS[o.id];
  const ch = CHAPTERS[o.act];
  const pal = [`**${hex(ch.lead)} (lead)**`, ...ch.supports.map(hex)].join(' + ');
  const subj = `${r.place} — ${o.headline}`;
  const mood = o.somber ? ' Quiet, somber, drained toward sepia/indigo; no violence, no bodies.' : o.act === 7 ? ' Hopeful retro-future, as a 1980s Indian science picture-book imagined it.' : '';
  const ground = r.terrain === 'air' ? 'a sea of clouds with the sea far below' : r.terrain === 'orbit' ? 'space, with the Earth\'s curve and the Kalinga coast below' : r.terrain === 'land' ? 'land' : 'water';
  out.push(`## Record ${String(o.num).padStart(2, '0')} · ${o.dateLine} · ${r.place}`, '');
  out.push(`Act ${o.act} (${ACT_NAMES[o.act]}): ${pal}. ${ch.note}.${mood} Kind: ${r.kind}${r.kind === 'speculative' ? ' (label SPECULATIVE · NOT HISTORY)' : ''}.`, '');
  out.push('| Layer file | Size | Parallax | Prompt |', '|---|---|---|---|');
  out.push(`| \`sky.webp\` | 1280×${r.terrain === 'air' || r.terrain === 'orbit' ? 720 : 470}, opaque | 0 | Sky over ${subj}. ${o.act === 4 ? 'Faded indigo and sepia' : r.mech.night ? 'Night: indigo with turmeric stars' : 'Warm old-paper cream at the horizon fading to pale seafoam or soft haldi'}, faint printed halftone. No sun disc, no clouds. |`);
  out.push(`| \`clouds.webp\` | 2048×250 | 0.04 | ${r.mech.rain ? 'Heavy rain clouds, storm-grey with indigo shadows' : 'Soft gouache cumulus banks with warm undersides'}; tiles horizontally. |`);
  out.push(`| \`far0.webp\` | 2048×200 | 0.08 | Distant ${ground === 'land' ? 'hills and treelines' : 'horizon'} for ${r.place}, hazed toward cream. |`);
  out.push(`| \`mid.webp\` | 2048×260 | 0.3 | The main historical subject, staged clearly: ${subj}. ${r.fact.split('. ')[0]}. People going about their lives, ~25–35 px tall; temples and deities only as respectful background. |`);
  out.push(`| \`near.webp\` | 2048×140 | 0.55 | Near props for ${r.place}: stalls, trees, people, animals; nothing on the lane line (bottom 10 px). |`);
  out.push(`| \`fore.webp\` | 2048×120 | 1.32 | Sparse foreground at the bottom edge (grass, flowers, stones or reeds); mostly in the bottom 50 px. |`);
  out.push('');
  out.push(`- **Ride sprite** — Taapoi (same design as Record 01) on ${RIDES[r.ride] ?? r.ride}, side view facing right; 6–8 frame cycle, a jump pose and a bump pose.`);
  const hz = Object.entries(r.hazards).map(([a, v]) => `${v} (${a})`).join(', ');
  if (hz) out.push(`- **Hazards** (dark rim, never in the lead colour; cozy if animals): ${hz}.`);
  out.push('');
}
out.push(END);
const md = readFileSync(FILE, 'utf8');
const block = out.join('\n');
writeFileSync(FILE, md.includes(START) ? md.replace(new RegExp(`${START}[\\s\\S]*${END}`), block) : `${md.trimEnd()}\n\n---\n\n${block}\n`);
console.log('ASSETS.md: prompts for', OUTLINE.length - 1, 'records');
