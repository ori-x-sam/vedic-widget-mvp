// Regenerates the per-record section of HISTORY.md from src/data/records.ts so
// that every lesson card's text matches HISTORY.md exactly (definition of
// done). Hand-written verification notes live in tools/history-notes.ts.
// Run: npx tsx tools/gen-history.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { OUTLINE, RECORDS } from '../src/data/records';
import { NOTES, SOURCES } from './history-notes';

const FILE = join(import.meta.dirname, '..', 'HISTORY.md');
const START = '<!-- records:start -->';
const END = '<!-- records:end -->';

const kindLabel = { history: 'HISTORY', tradition: 'TRADITION', legend: 'LEGEND', speculative: 'SPECULATIVE · NOT HISTORY' } as const;
const out: string[] = [START, ''];
for (const o of OUTLINE) {
  const r = RECORDS[o.id];
  out.push(`### ${o.id} — Lesson ${o.num} · ${o.dateLine} · "${o.headline}"`);
  out.push('');
  out.push(`*${kindLabel[r.kind]} · Act ${o.act} · ${r.place} · ride: ${r.ride}*`);
  out.push('');
  out.push(`**Card:** ${r.fact}`);
  out.push('');
  out.push(`**Did you know?** ${r.didYouKnow}`);
  out.push('');
  out.push(`**Exercise:** ${r.exercise.prompt} → *${r.exercise.answer}*`);
  out.push('');
  if (r.dateNote) { out.push(`**Date note:** ${r.dateNote}`); out.push(''); }
  if (NOTES[o.id]) { out.push(`**Checked:** ${NOTES[o.id]}`); out.push(''); }
  out.push(`**Sources:** ${r.sources.map((k) => `\`${k}\` (${(SOURCES[k] ?? ['—']).join(' · ')})`).join('; ')}`);
  out.push('');
}
out.push(END);

const md = readFileSync(FILE, 'utf8');
const block = out.join('\n');
const next = md.includes(START) ? md.replace(new RegExp(`${START}[\\s\\S]*${END}`), block) : `${md.trimEnd()}\n\n---\n\n## All lessons, as shipped\n\n${block}\n`;
writeFileSync(FILE, next);
const missing = OUTLINE.flatMap((o) => RECORDS[o.id].sources.filter((k) => !SOURCES[k]));
if (missing.length) {
  console.error('missing source keys:', [...new Set(missing)].join(', '));
  process.exit(1);
}
console.log(`HISTORY.md: ${OUTLINE.length} lessons written`);
