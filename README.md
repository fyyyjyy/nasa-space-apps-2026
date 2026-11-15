# Silent Explorers

A scroll-driven 3D story of robotic and crewed Moon and Mars missions (Three.js + Vite).

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | `validate-data`, `check-assets`, `vitest --run`, then the Vite build. Stops at the first failure |
| `npm run build:fast` / `npm run vite:build` | Vite build only, skips all checks |
| `npm test` | Run unit and property tests once |
| `npm run validate-data` | Validate `src/data/*.json` |
| `npm run check-assets` | Check texture and model budgets |
| `npm run reading-level` | Print a Flesch-Kincaid grade per chapter (an aid, not a gate; target grade 7 or lower) |

## Project structure

- `src/core/` pure logic (state machine, scroll math, quiz, validator), no DOM or WebGL
- `src/engine/` Three.js scene, camera, bodies, markers, quality control
- `src/ui/` DOM views (opening, story column, progress, summary, toast, WebGL fallback) and `strings.js`
- `src/data/` `missions.json` and `site.json`
- `src/styles/` CSS
- `public/` images, textures, models, audio
- `scripts/` validation, asset checks, reading level, model preparation
- `tests/` Vitest and fast-check tests

## Adding a mission

1. Add an entry to `src/data/missions.json` with chapters, coordinates, citations (nasa.gov source), callouts and quiz questions.
2. Put chapter images in `public/images/` and any model in `public/models/`.
3. Add credits for new assets to the matching CREDITS file.
4. Run `npm run validate-data`, `npm run check-assets` and `npm run reading-level`, then fix what they report.

## Data validation

`validate-data` checks required fields, citations, coordinates, quiz structure, audio source and licence, and that referenced ids resolve. `npm run build` fails if it reports errors.

## Asset budgets

`check-assets` enforces textures of at most 2048 px on a side and models of at most 5 MB. Exactly 2048 px and exactly 5 MB are accepted.

## Licences and credits

- `public/textures/CREDITS.md`
- `public/audio/CREDITS.md`
- `public/models/CREDITS.md`

Every texture, sound and model needs an entry with its source and licence.

## Known manual checks

These are not automated. Do them before submission:

- Fact-check each narrative claim against its cited nasa.gov page and review the reading-level report.
- Compare each 3D model with NASA reference photos.
- Check keyboard, screen reader and reduced-motion behaviour, and run the accessibility scan (`scripts/a11y-scan.mjs`).
- Check performance and loading on a low-end device and a slow connection.
