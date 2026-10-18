# Odia strings to verify

Every Odia string must be checked by a native reader before release (brief §4.8). Tick each one off with
the reviewer's name and date. Strings are rendered in **Baloo Bhaina 2** (self-hosted Odia subset), falling
back to Noto Sans Oriya.

| Where | Odia | Meaning / transliteration | In game since | Verified by |
|---|---|---|---|---|
| Title screen label ("A picture reader · …") | ଆମ କଳିଙ୍ଗ | *Ama Kalinga* — "Our Kalinga", the textbook's name | Phase 1 | ☐ |
| Lesson card page numbers | ୦ ୧ ୨ ୩ ୪ ୫ ୬ ୭ ୮ ୯ | Odia numerals 0–9 (`odiaNumeral()` in `src/data/records.ts`) | Phase 1 (୧ on Lesson 1) | ☐ |
| Fake ending back cover | ସମାପ୍ତ | *samāpta* — "The End" (brief marks **verify**) | shipped (`src/scenes/FakeEnding.ts`) | ☐ |
| Supplementary Reader pamphlet, Act VII name, header | ଭବିଷ୍ୟତ | *bhabishyata* — "The Future" (brief marks **verify**) | shipped (`FakeEnding.ts`, `records.ts` ACT_NAMES) | ☐ |
| Lesson book / report card corner | ଆମ କଳିଙ୍ଗ | as above | shipped (`src/ui/pages.ts`) | ☐ |
| Record 34 letter platforms | ଅ ଆ ଇ ଈ ଉ ଊ ଏ ଐ ଓ ଔ କ ଖ ଗ ଘ ଙ ଚ ଛ ଜ ଝ ଞ ଟ ଠ ଡ ଢ ଣ ତ ଥ ଦ ଧ ନ ପ ଫ ବ ଭ ମ ଯ ର ଲ ଳ ଶ ଷ ସ ହ | vowels and consonants of the alphabet chart (`ODIA_LETTERS` in `src/systems/spawner.ts`) | shipped | ☐ |
| Scenery letters (Records 23, 34) | single letters drawn on kites and the chart | decorative; check each glyph renders | shipped (`src/art/scenes/act4.ts`, `act6.ts`) | ☐ |
| Various | ଓଡ଼ିଶା | *Odisha* | planned | ☐ |
| Various | କଳିଙ୍ଗ | *Kalinga* | Phase 1 (inside ଆମ କଳିଙ୍ଗ) | ☐ |

The term **Jhoti / Chita** (Odisha's rice-paste floor and wall drawing) is used in the reel intro's hook line notes; it matches Wikipedia's *Jhoti Chita* article. The reel intro itself shows only the English hook lines.

Checks for the reviewer: correct conjuncts (ଙ୍ଗ in କଳିଙ୍ଗ), the nukta in ଡ଼ (ଓଡ଼ିଶା), the digit shapes at small sizes,
and that nothing renders as tofu boxes on Android and iOS.
