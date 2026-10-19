# The budget model

Where the starting numbers in `content/cards.kdl` came from (BRIEF.md §3.3). The model gives the sim a sensible start;
the sim and the designer have the last word, and the agent never retunes a number without the designer choosing a lever.

A unit's fighting value is roughly **HP × DPS** (Lanchester's square law), so its budget grows with **cost²**:

    HP × DPS ≈ 11,000 × cost² × modifiers

A plain 3-cost melee unit at medium speed works out to 900 HP × 110 DPS.

| Modifier | Factor |
|---|---|
| ranged | ×0.55 |
| splash | ×0.75 |
| fast | ×0.85 |
| very fast | ×0.75 |
| slow | ×1.15 |
| ability weight | ×(1 − w), w between 0.08 and 0.35 |

Role decides how the budget splits, as the HP : DPS ratio: Rakshak 14–25 · Yoddha 5–10 · Dhanurdhara 3–5. Spells and
supports are tuned in the sim against units of the same cost.

`npm run sim` (until the match core exists) prints the content's sums: the cost curve (3/4/4/4/3/1/1 from 2 to 8,
average 4.35), the starter decks' averages, and the Prana a player gets over regulation time (~116.7).
