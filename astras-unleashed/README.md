# Astras Unleashed

Twenty gods. Three worlds. Four ages. A real-time three-lane card battler in the Kalinga Rush look, built on the
Liora Labs game-bible starter (TypeScript, Vite, Pixi v8, KDL content, a CSS dialect for look, zustand, zod,
Storybook, vitest). The brief is `BRIEF.md`; working rules and the tweak map are in `CLAUDE.md`; the vocabulary
catalog is `docs/declarative-ui.md`.

**Status: Phase 1 (vocabulary) done, waiting at Gate 1.** No match rules exist yet.

## Commands

```sh
npm install
npm run dev              # the game (the title screen, for now), live
npm run storybook        # stories at http://localhost:6006: Foundation/Palette, Foundation/Prefabs, Screens
npm test                 # unit tests: words, content, contrast, engine, guards, catalog drift
npm run test:stories     # every story's play, headless Chromium
npm run typecheck
npm run build
npm run sim              # for now: the content's sums (cost curve, deck averages, Prana over regulation)
npm run shots -- <url> <out.png> [waitMs] [width] [height]
```

If Playwright's own Chromium isn't installed (a container with an older one), point the story tests and shots at an
existing build: `CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:stories`.

## Layout

| Path | What |
|---|---|
| `content/*.kdl` | the game's content: gods, classes, Kshetras, the match, decks, bots, Katha pages, blessings |
| `src/units.ts` `effects.ts` `cards.ts` `kshetras.ts` | behaviour words (pure core) |
| `src/content.ts`, `src/content-load.ts` | content kinds (zod) and the KDL loader |
| `src/meta.ts`, `src/store.ts`, `src/actions.ts` | what a save keeps; the stores; the one impure boundary |
| `src/screens/shared.*` | the palette and look (`:root`), shared prefabs, keyframes, painters, binding builders |
| `src/decl/` | the declarative UI engine (as copied from the starter) |
| `src/stories/` | Storybook stories and the story harness |
| `ref/kalinga/` | Kalinga Rush screenshots: the visual bar |
| `LORE.md`, `STRINGS_TO_VERIFY.md` | sources to verify; every Indic string, for a native reader |
| `docs/balance.md` | the budget model the starting numbers came from |
