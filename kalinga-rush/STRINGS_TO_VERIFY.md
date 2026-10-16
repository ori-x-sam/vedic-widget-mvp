# Odia strings to verify

Every Odia string must be checked by a native reader before release (brief §4.8). Tick each one off with
the reviewer's name and date. Strings are rendered in **Baloo Bhaina 2** (self-hosted Odia subset), falling
back to Noto Sans Oriya.

| Where | Odia | Meaning / transliteration | In game since | Verified by |
|---|---|---|---|---|
| Title screen label ("A picture reader · …") | ଆମ କଳିଙ୍ଗ | *Ama Kalinga* — "Our Kalinga", the textbook's name | Phase 1 | ☐ |
| Lesson card page numbers | ୦ ୧ ୨ ୩ ୪ ୫ ୬ ୭ ୮ ୯ | Odia numerals 0–9 (`odiaNumeral()` in `src/data/records.ts`) | Phase 1 (୧ on Lesson 1) | ☐ |
| Fake ending back cover | ସମାପ୍ତ | *samāpta* — "The End" (brief marks **verify**) | Phase 6 | ☐ |
| Supplementary Reader | ଭବିଷ୍ୟତ | *bhabishyata* — "The Future" (brief marks **verify**) | Phase 6 | ☐ |
| Various | ଓଡ଼ିଶା | *Odisha* | planned | ☐ |
| Various | କଳିଙ୍ଗ | *Kalinga* | Phase 1 (inside ଆମ କଳିଙ୍ଗ) | ☐ |

Also verify before using: the term **Jhoti / Chita** for the rice-paste floor drawing in the optional reel intro (§8).

Checks for the reviewer: correct conjuncts (ଙ୍ଗ in କଳିଙ୍ଗ), the nukta in ଡ଼ (ଓଡ଼ିଶା), the digit shapes at small sizes,
and that nothing renders as tofu boxes on Android and iOS.
