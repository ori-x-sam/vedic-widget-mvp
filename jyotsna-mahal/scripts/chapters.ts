// `npm run chapters`: the state each day and each night starts in, for the menu's chapters (src/chapters.json).
// Run it after changing content; a unit test fails while the file is out of step.
import { writeFileSync } from 'node:fs';
import { chapters } from '../src/solver';

const c = chapters();
writeFileSync('src/chapters.json', JSON.stringify(c) + '\n');
console.log(`src/chapters.json: ${c.days.length} days, ${c.nights.length} nights`);
