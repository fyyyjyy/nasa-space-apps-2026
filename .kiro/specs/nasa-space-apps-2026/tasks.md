# Implementation Plan: Silent Explorers (nasa-space-apps-2026)

## Overview

Single-developer build of the Silent Explorers site in plain JavaScript (ES modules), Three.js and Vite, tested with Vitest and fast-check. The order keeps the project runnable early: scaffold and tokens, pure core modules with their property tests, the Three.js scene, data files and validator, hardware models, the story column, summary, quiz, journey mode and closing screen, audio, responsive work, accessibility and performance, then final integration and manual verification.

All paths follow the design's project layout (`src/core`, `src/engine`, `src/ui`, `src/audio`, `src/data`, `src/styles`, `public/`, `tests/`). Each property test is its own file under `tests/`, runs at least 100 iterations, and carries the comment `Feature: nasa-space-apps-2026, Property {n}: {title}`.

## Tasks

- [x] 1. Project scaffold, tokens and data skeletons
  - [x] 1.1 Initialise the Vite project
    - Create `package.json`, `vite.config.js`, `index.html` and the folder layout from the design (`src/core`, `src/engine`, `src/ui`, `src/audio`, `src/data`, `src/styles`, `public/models|textures|images|audio`, `tests/`)
    - Install `three`, `vite`, `vitest`, `jsdom`, `fast-check`
    - Add npm scripts: `dev`, `build`, `test` (`vitest --run`)
    - In `index.html` set `lang="en"`, the viewport meta with `viewport-fit=cover`, the Google Fonts preconnect and stylesheet links for Orbitron and Exo 2, one `<h1>`, a `<canvas>`, and `main`/`aside` landmarks
    - _Requirements: 12.1, 13.2, 13.8, 8.6_
  - [x] 1.2 Create style tokens and base styles
    - `src/styles/tokens.css`: colours `#FFFFFF`, `#E8E8E8`, `#A8D8EA`, `#B0B0B0` on `#0A0A0F`, overlay `rgba(10, 10, 15, 0.85)`, font stacks with `'Arial', sans-serif` and `'Georgia', serif` fallbacks, size and line-height tokens (body 18px+, heading 22px+, caption 14px+, none below 12px, line-height 1.6+)
    - `src/styles/base.css`: reset, full-screen canvas, `.btn-text` (borderless Orbitron, 120% scale on `:hover` inside `@media (hover: hover)` and on `:focus-visible`, transition at most 200 ms), 2px `#A8D8EA` focus outline
    - _Requirements: 12.1 to 12.12, 8.3, 8.4, 6.19_
  - [x] 1.3 Create data skeletons and strings module
    - `src/data/site.json` as specified in the design (title, subtitle, journey strings, fallback message, bodies with texture paths)
    - `src/data/missions.json` with metadata only for all six missions (id, journeyOrder, name, hardwareName, body, locationName, year, dates, finalStatus, tooltip at most 80 chars, description at most 160 chars, baseline `landing` and `referenceLanding` from the design table); chapters are added in section 18
    - `src/ui/strings.js` holding all other visible labels
    - _Requirements: 1.6, 3.4, 3.5, 10.1_
  - [x]* 1.4 Write example tests for style tokens
    - Assert font stacks and fallbacks, minimum sizes, line height and the overlay colour in the token CSS
    - _Requirements: 12.1 to 12.8, 12.10_

- [x] 2. State machine (core)
  - [x] 2.1 Implement `src/core/stateMachine.js`
    - Pure `transition(state, event)` with the full transition table for Explore and Journey modes, and `createStore` with `getState`, `dispatch`, `subscribe`
    - Invalid events return the same state object
    - `RETURN_TO_SPACE` takes `{ target: 'orbit' | 'opening' }`; `EXIT_JOURNEY` discards story scroll state
    - _Requirements: 2.5, 4.3, 4.5, 6.14, 6.19, 7.7, 10.5, 10.8, 10.9, 10.10_
  - [x]* 2.2 Write property test for state machine totality and invariants
    - **Property 22: State machine totality and invariants**
    - **Validates: Requirements 2.5, 4.3, 4.5**
  - [x]* 2.3 Write property test for mission selection and retargeting
    - **Property 23: Mission selection and retargeting**
    - **Validates: Requirements 4.3, 4.5**
  - [x]* 2.4 Write property test for Return to Space
    - **Property 24: Return to Space**
    - **Validates: Requirements 6.14, 6.19**
  - [x]* 2.5 Write property test for quiz open and close round trip
    - **Property 25: Quiz open and close round trip**
    - **Validates: Requirements 7.7**
  - [x]* 2.6 Write property test for Finish the Journey
    - **Property 28: Finish the Journey ends at the closing screen**
    - **Validates: Requirements 10.8**
  - [x]* 2.7 Write property test for Exit Journey and restart
    - **Property 29: Exit Journey and restart**
    - **Validates: Requirements 10.9, 10.10**

- [x] 3. Scroll maths (core)
  - [x] 3.1 Implement `src/core/scrollMath.js`
    - `normalizeProgress` (clamped, degenerate range safe), `activeChapterIndex`, `overallProgress`, `chapterLabel`, `interpolateKeyframe` (shortest-path rotation), `isPastLastChapter`
    - _Requirements: 6.5, 6.13, 6.15_
  - [x]* 3.2 Write property test for scroll progress normalisation
    - **Property 12: Scroll progress normalisation**
    - **Validates: Requirements 6.5, 6.15**
  - [x]* 3.3 Write property test for active chapter selection
    - **Property 13: Active chapter selection is consistent**
    - **Validates: Requirements 6.5, 6.13**
  - [x]* 3.4 Write property test for overall progress and chapter label
    - **Property 14: Overall progress and chapter label**
    - **Validates: Requirements 6.15**
  - [x]* 3.5 Write unit tests for `interpolateKeyframe` and `isPastLastChapter`
    - Cover endpoints, midpoint, angle wrap-around and the summary boundary
    - _Requirements: 6.5, 6.13_

- [x] 4. Geo maths (core)
  - [x] 4.1 Implement `src/core/geo.js`
    - `latLonToVector3`, `vector3ToLatLon`, `greatCircleKm` (haversine), `BODY_RADIUS_KM`, using the design's axis convention
    - _Requirements: 3.1, 3.2, 4.2, 9.3_
  - [x]* 4.2 Write property test for latitude/longitude round trip
    - **Property 6: Latitude/longitude round trip**
    - **Validates: Requirements 3.1, 3.2, 4.2, 9.3**
  - [x]* 4.3 Write property test for great-circle distance
    - **Property 7: Great-circle distance is a metric**
    - **Validates: Requirements 9.3**

- [x] 5. Quiz logic (core)
  - [x] 5.1 Implement `src/core/quizLogic.js`
    - `shuffle` (Fisher-Yates, non-mutating), `buildQuizSession`, `scoreAnswer`, `scoreSession`, `messageForScore` (non-empty for 0 to 3)
    - _Requirements: 7.2, 7.3, 7.4, 7.6_
  - [x]* 5.2 Write property test for quiz session content preservation
    - **Property 20: Quiz session preserves content and correct answers**
    - **Validates: Requirements 7.2, 7.6**
  - [x]* 5.3 Write property test for quiz scoring
    - **Property 21: Quiz scoring**
    - **Validates: Requirements 7.3, 7.4**

- [x] 6. Journey plan (core)
  - [x] 6.1 Implement `src/core/journeyPlan.js`
    - `JOURNEY_ORDER`, `nextMission`, `continueLabel`, `journeyProgressLabel`; derive order from mission data and check against `JOURNEY_ORDER`
    - _Requirements: 10.3, 10.5, 10.7_
  - [x]* 6.2 Write property test for journey order and continue labels
    - **Property 26: Journey order and continue labels**
    - **Validates: Requirements 10.3, 10.5, 10.6**
  - [x]* 6.3 Write property test for journey progress label
    - **Property 27: Journey progress label**
    - **Validates: Requirements 10.7**

- [x] 7. Layout selector and contrast helper (core)
  - [x] 7.1 Implement `src/core/layoutSelector.js`
    - `STACKED_BREAKPOINT_PX = 768` and `selectLayout(width)`
    - _Requirements: 13.3_
  - [x]* 7.2 Write property test for the layout breakpoint
    - **Property 36: Layout selector matches the breakpoint**
    - **Validates: Requirements 13.3**
  - [x] 7.3 Implement `src/core/contrast.js`
    - WCAG 2.1 relative luminance, contrast ratio, and alpha compositing of the overlay over a background colour
    - _Requirements: 8.3, 12.9, 12.12_
  - [x]* 7.4 Write property test for text and focus colour contrast
    - **Property 34: Text and focus colour contrast**
    - **Validates: Requirements 8.3, 8.4, 12.9, 12.11, 12.12**

- [x] 8. Frame limiter and quality controller (core)
  - [x] 8.1 Implement `src/engine/frameLimiter.js`
    - `shouldRenderFrame(nowMs, lastRenderMs, maxFps = 60)` with a small tolerance
    - _Requirements: 1.4_
  - [x]* 8.2 Write property test for the 60 fps frame cap
    - **Property 2: Frame cap**
    - **Validates: Requirements 1.4**
  - [x] 8.3 Implement `src/engine/qualityController.js`
    - `QUALITY_LEVELS` (pixel ratio and star share per level), `MAX_LEVEL`, `nextQualityLevel(currentLevel, recentFps, secondsBelow30, secondsAtOrAbove55 = 0)`
    - _Requirements: 13.9_
  - [x]* 8.4 Write property test for the quality controller
    - **Property 35: Quality controller stays in range and steps down only after sustained low fps**
    - **Validates: Requirements 13.9**

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 10. Scene bootstrap and WebGL fallback
  - [x] 10.1 Implement `webglSupport.js` and `webglFallback.js`
    - `isWebGLAvailable()` tries `webgl2` then `webgl`; the fallback view shows `webglFallbackMessage` from `site.json`
    - _Requirements: 1.5, 8.6_
  - [x] 10.2 Implement `src/engine/sceneManager.js`
    - `init(canvas)`, `start`, `onResize`, `dispose`; renderer with `setPixelRatio(min(devicePixelRatio, 2))`, ambient and directional lights, render loop through `shouldRenderFrame`, pause when `document.hidden`, handle `webglcontextlost` and `webglcontextrestored`
    - _Requirements: 1.3, 1.4, 1.5_
  - [x] 10.3 Implement the `src/main.js` bootstrap
    - Import styles, load `site.json` and `missions.json`, create the store, check WebGL (dispatch `WEBGL_UNAVAILABLE` or init the scene), dispatch `ASSETS_READY`, start the loop
    - Page is runnable with `npm run dev` from this point
    - _Requirements: 1.3, 1.5_
  - [x]* 10.4 Write example test for the WebGL fallback
    - Mock `isWebGLAvailable` as false and assert the fallback message is shown and no scene code runs
    - _Requirements: 1.5, 8.6_

- [x] 11. Starfield
  - [x] 11.1 Implement `src/engine/starfield.js` and add it to the scene
    - `generateStarPositions(count, seed)` (seeded, stratified, at least 2000 stars), `countStarsPerQuadrant`, one `THREE.Points` object; register in `main.js`
    - _Requirements: 1.1_
  - [x]* 11.2 Write property test for starfield quadrant coverage
    - **Property 1: Starfield quadrant coverage**
    - **Validates: Requirements 1.1**

- [x] 12. Celestial bodies and textures
  - [x] 12.1 Prepare Moon and Mars textures
    - Download the Moon and Mars colour maps from Solar System Scope, resize to at most 2048 px wide, save as `public/textures/moon_2k.jpg` and `mars_2k.jpg`, and note source and licence in `public/textures/CREDITS.md`
    - _Requirements: 1.2, 13.9_
  - [x] 12.2 Implement `src/engine/celestialBodies.js`
    - 64 by 64 `SphereGeometry` meshes with textures, each at least 5% of viewport width and fully in view from the initial camera pose, `getMesh`, `getRadius`, flat-colour fallback material when a texture fails; add to the scene in `main.js`
    - _Requirements: 1.2, 2.6_

- [x] 13. Camera rig
  - [x] 13.1 Implement `src/engine/cameraRig.js`
    - `easeInOutCubic`, `clampZoom` (at least `radius * 1.15`), `flyTo` (cancel and restart from the current pose, 2 to 4 s for bodies and 2 to 5 s for sites), `cancelFly`, `setInputEnabled`, `orbitBy`, `zoomBy`; ignore input while flying
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 4.1, 4.4, 4.5_
  - [x]* 13.2 Write property test for easing
    - **Property 4: Easing is a smooth monotonic ease-in-out**
    - **Validates: Requirements 4.4**
  - [x]* 13.3 Write property test for the zoom clamp
    - **Property 3: Zoom clamp keeps bodies visible and unpenetrated**
    - **Validates: Requirements 2.2**

- [x] 14. Mission markers and opening overlay
  - [x] 14.1 Implement `src/engine/markerManager.js`
    - `createMarkers` (three per body, parented to the body mesh, pulsing), pure `markerScreenRadius` capped at 2% of the smaller viewport dimension, `setHover`, `raycastPick`, `focusMarker`, DOM proxy buttons, tooltip (name and location, at most 80 chars) and click-expanded tooltip (year and description), fallback sprite and `console.error` when a marker throws
    - _Requirements: 3.1 to 3.6, 8.4_
  - [x]* 14.2 Write property test for the marker screen size bound
    - **Property 5: Marker screen size bound**
    - **Validates: Requirements 3.3**
  - [x]* 14.3 Write unit test for the marker error path
    - A throwing marker factory yields a fallback sprite, a console error and five other markers
    - _Requirements: 3.6_
  - [x] 14.4 Implement `src/ui/openingOverlay.js`
    - Title (Orbitron, `#FFFFFF`, text-shadow, at least 36 px) and subtitle (at least 18 px, wraps, centred), Moon and Mars selection controls, the borderless "Experience the Full Journey" button with 120% scale and hover sound hook, body name label from `site.json`
    - _Requirements: 1.6, 2.6, 10.1_
  - [x] 14.5 Wire the opening scene in `main.js`
    - Body selection dispatches `SELECT_BODY` and flies to orbit, marker activation dispatches `SELECT_MISSION` and starts a fly to the site pose, overlay shows or hides by screen
    - _Requirements: 2.3, 2.4, 2.6, 3.4, 3.5, 4.1_

- [x] 15. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 16. Data validator
  - [x] 16.1 Implement `src/core/dataValidator.js`
    - `isNasaUrl` (http or https, host `nasa.gov` or ending `.nasa.gov`), `validateMissions` (exact chapter counts and 3 to 6 range, images per chapter, caption at most 120 chars with NASA credit, tooltip at most 80, description at most 160, NASA image hosts and IDs, citations, keyframes, marker distance within 100 km), `validateQuizzes`, `validateAudio` (source, licence, id resolution), `validateAssetBudget` (textures at most 2048 px, models at most 5 MB, boundaries accepted)
    - _Requirements: 3.4, 3.5, 6.3, 6.12, 6.17, 6.18, 8.5, 9.2, 9.3, 11.9, 13.9_
  - [x]* 16.2 Write property test for asset budgets
    - **Property 37: Asset budgets reject oversized assets**
    - **Validates: Requirements 13.9**
  - [x] 16.3 Add `scripts/validate-data.js` and `scripts/check-assets.js`
    - Add npm scripts `validate-data` and `check-assets`; `check-assets` reads texture paths from `site.json`, model paths from `missions.json`, image widths and file sizes from `public/`, and fails the build on any violation
    - _Requirements: 13.9, 9.2_

- [x] 17. Landing coordinates
  - [x] 17.1 Record landing coordinates from NASA pages
    - For each of the six missions, take coordinates from the NASA mission page or mission report, then update `landing` and `referenceLanding` (with `source` URL) in `missions.json`
    - Known values: Surveyor 3 about 3° S, 23.41° W; Viking 1 22.483° N, 47.94° W; Apollo 11 0.6734° N, 23.473° E. Take Apollo 17, Opportunity and InSight from NASA mission pages
    - Replace the design's baseline for Viking 1 (22.27° N, 47.95° W) with the NASA page value and note the source
    - _Requirements: 3.1, 3.2, 9.3_
  - [x]* 17.2 Write property test for marker accuracy
    - **Property 8: Markers within 100 km of published coordinates**
    - Run over the real `missions.json` and over mutated copies that move a marker beyond 100 km
    - **Validates: Requirements 3.1, 3.2, 9.3**

- [x] 18. Mission content (chapters, callouts, keyframes, images)
  - [x] 18.1 Write Surveyor 3 chapters, callouts and keyframes
    - Six chapters covering Requirement 6 criterion 11 points 1 to 6, first-person narrator voice, at or below a 7th-grade reading level, no invented dialogue for Conrad, Bean or others
    - Each chapter has a science callout with a nasa.gov citation, and one keyframe (cameraOffset, lookAt, modelRotation, modelZoom, lightAzimuthDeg, lightIntensity)
    - Add mission-level `citations`, `dates` and `finalStatus`
    - _Requirements: 6.3, 6.11, 6.12, 9.1, 9.6, 9.7_
  - [x] 18.2 Select Surveyor 3 chapter images
    - For every chapter record NASA ID, `sourceUrl` on images.nasa.gov, descriptive `alt`, caption of at most 120 characters ending with "Credit: NASA ...", and a local WebP copy (at most about 1200 px wide) in `public/images/`
    - _Requirements: 6.3, 6.16, 6.17, 6.18, 8.5_
  - [x] 18.3 Write Apollo 11 chapters, callouts and keyframes
    - Four chapters covering Requirement 6 criterion 6 points 1 to 4 (1202 and 1201 alarms, about 17 seconds of fuel, "Houston, Tranquility Base here. The Eagle has landed", "magnificent desolation", about 21.6 kg of samples, laser retroreflector and 3.8 cm per year), attributing quotes to their speakers
    - _Requirements: 6.3, 6.6, 6.12, 9.1, 9.6, 9.7_
  - [x] 18.4 Select Apollo 11 chapter images
    - NASA ID, source URL, alt, caption (at most 120 chars) and credit, local WebP copy
    - _Requirements: 6.3, 6.16, 6.17, 6.18, 8.5_
  - [x] 18.5 Write Apollo 17 chapters, callouts and keyframes
    - Four chapters covering Requirement 6 criterion 7 points 1 to 4 (December 11 and 14, 1972, 35.9 km in about 4 h 26 min, orange soil at Shorty Crater, about 110 kg of samples, Cernan last on the Moon)
    - _Requirements: 6.3, 6.7, 6.12, 9.1, 9.7_
  - [x] 18.6 Select Apollo 17 chapter images
    - NASA ID, source URL, alt, caption (at most 120 chars) and credit, local WebP copy
    - _Requirements: 6.3, 6.16, 6.17, 6.18, 8.5_
  - [x] 18.7 Write Viking 1 chapters, callouts and keyframes
    - Five chapters covering Requirement 6 criterion 8 points 1 to 5, wording the life-detection results as inconclusive and not calling Viking 1 the first spacecraft to land on Mars
    - Include the Surveyor 3 cross-reference sentence in the first chapter, understandable on its own and identical in explore and journey modes
    - _Requirements: 6.3, 6.8, 6.12, 9.1, 9.7_
  - [x] 18.8 Select Viking 1 chapter images
    - NASA ID, source URL, alt, caption (at most 120 chars) and credit, local WebP copy
    - _Requirements: 6.3, 6.16, 6.17, 6.18, 8.5_
  - [x] 18.9 Write Opportunity chapters, callouts and keyframes
    - Four chapters covering Requirement 6 criterion 9 points 1 to 4; set `useVariationTrack` on the final chapter
    - Label "my battery is low and it's getting dark" as a poetic paraphrase by a journalist if used, and do not say Opportunity currently holds the driving record
    - Check the date of Perseverance passing Opportunity's distance against the NASA source before writing it (the requirement text reads October 11, 2026)
    - _Requirements: 6.3, 6.9, 6.12, 9.1, 9.6, 9.7, 11.5_
  - [x] 18.10 Select Opportunity chapter images
    - NASA ID, source URL, alt, caption (at most 120 chars) and credit, local WebP copy
    - _Requirements: 6.3, 6.16, 6.17, 6.18, 8.5_
  - [x] 18.11 Write InSight chapters, callouts and keyframes
    - Five chapters covering Requirement 6 criterion 10 points 1 to 5 (November 26, 2018 landing, April 6, 2019 first marsquake, Mole abandoned January 2021, more than 1,300 marsquakes, December 15 and 21, 2022, 2024 orbiter image)
    - _Requirements: 6.3, 6.10, 6.12, 9.1, 9.7_
  - [x] 18.12 Select InSight chapter images
    - NASA ID, source URL, alt, caption (at most 120 chars) and credit, local WebP copy
    - _Requirements: 6.3, 6.16, 6.17, 6.18, 8.5_
  - [x]* 18.13 Write property test for mission data completeness
    - **Property 15: Mission data completeness**
    - Run over the real `missions.json` and over mutations (extra chapter, long caption, missing alt)
    - **Validates: Requirements 3.4, 3.5, 6.3, 6.12, 6.17, 8.5**
  - [x]* 18.14 Write property test for the NASA citation domain
    - **Property 16: NASA citation domain**
    - Include lookalike hosts such as `nasa.gov.evil.com` and `notnasa.gov`
    - **Validates: Requirements 6.12, 9.2**
  - [x]* 18.15 Write property test for chapter image sources
    - **Property 17: Chapter image sources**
    - **Validates: Requirements 6.18**
  - [x]* 18.16 Write narrative smoke tests
    - Assert key facts and constraints in the data: Apollo 11 mentions 1202, 1201 and about 17 seconds; Viking 1 mentions November 11, 1982 and does not claim to be the first lander on Mars; Opportunity never presents the battery line as a literal message; Surveyor 3 mentions May 4, 1967 and has no invented dialogue; InSight mentions December 15 and December 21, 2022
    - _Requirements: 6.6 to 6.11, 9.6, 9.7_
  - [x] 18.17 Add `scripts/reading-level.js`
    - Print a Flesch-Kincaid grade per chapter as an aid (not a gate) and flag chapters above grade 7; add npm script `reading-level`, run it, and revise flagged text
    - _Requirements: 6.3_
  - [x] 18.18 Wire the validator into the load path in `main.js`
    - Development: throw with a readable error list. Production: log, skip invalid chapters, and show a friendly "mission content unavailable" message
    - _Requirements: 6.3, 9.2_

- [x] 19. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 20. Hardware models
  - [x] 20.1 Implement `src/ui/toast.js`
    - Non-blocking `aria-live="polite"` messages with a 5 second auto-dismiss
    - _Requirements: 4.6, 5.6_
  - [x] 20.2 Implement `src/engine/hardwareModelManager.js`
    - `load` (GLTF or OBJ by extension, 10 s timeout, placeholder wireframe box with "`<Mission>` – model unavailable" label on failure), `show` at the anchor from `geo`, `fitToView` (left half or top 40% aspect), `applyKeyframe` (at most 800 ms), `unload` with disposal, `clampModelZoom` (0.5 to 5), ambient plus directional plus fill lights with a minimum ambient level
    - _Requirements: 4.2, 5.1, 5.2, 5.5, 5.6, 5.7_
  - [x]* 20.3 Write property test for model fit
    - **Property 9: Model fits in view**
    - **Validates: Requirements 5.2**
  - [x]* 20.4 Write property test for model zoom clamp
    - **Property 10: Model zoom clamp**
    - **Validates: Requirements 5.4**
  - [x]* 20.5 Write property test for unload
    - **Property 11: Unload removes the model**
    - **Validates: Requirements 5.7**
  - [x]* 20.6 Write unit test for model load failure
    - Mocked loader rejection gives a labelled placeholder, a toast that dismisses after 5 s (fake timers), and a completed fly-in
    - _Requirements: 4.6, 5.6_
  - [x] 20.7 Source and prepare the six NASA 3D models
    - Download the six models from nasa3d.arc.nasa.gov, convert to GLB where useful, decimate heavy ones to about 150k triangles or fewer, and compress any file over 5 MB (Draco or Meshopt) to at most 5 MB
    - Save to `public/models/`, fill `model.path`, `format`, `sourceUrl`, `scale`, `groundOffset` in `missions.json`, and run `npm run check-assets`
    - _Requirements: 5.1, 9.4, 13.9_
  - [x] 20.8 Add model inspection controls
    - Pointer Events with an active-pointer map: one pointer rotates on both axes, two pointers pinch to zoom through `clampModelZoom`; manual rotation and zoom stored as an offset on top of the chapter keyframe
    - _Requirements: 5.3, 5.4_
  - [x] 20.9 Wire the fly-in to the model in `main.js`
    - On `FLY_IN`: `flyTo` the site pose (surface-level, within 500 m), start model load, show the model within 10 m of the recorded coordinates, show the toast on failure, dispatch `FLY_COMPLETE`; unload on leaving the site
    - _Requirements: 4.1, 4.2, 4.3, 4.5, 4.6, 5.7_

- [x] 21. Story column and scroll mapping
  - [x] 21.1 Implement `src/ui/storyColumn.js` rendering and `src/styles/story.css`
    - Render chapters (h2 title, narrative, images with captions, callout with citation link) from data; citation entries via a pure render function that keeps the label and shows "unavailable" with no link when `isNasaUrl` fails; column background `rgba(10, 10, 15, 0.85)`, fixed canvas, right half layout, colours and fonts from tokens
    - _Requirements: 6.1, 6.2, 6.3, 6.12, 6.17, 9.2, 9.5, 12.2, 12.3, 12.10, 12.11_
  - [ ]* 21.2 Write property test for citation rendering
    - **Property 18: Citation rendering never hides an entry**
    - **Validates: Requirements 9.5**
  - [x] 21.3 Add reveal animations and image fallback
    - `IntersectionObserver` (threshold 0.2) adds `.is-visible` to titles and paragraphs (at most 600 ms) and to images after their paragraph (at most 400 ms); `<img onerror>` swaps in a bordered text placeholder with alt text and caption; reduced-motion uses opacity only
    - _Requirements: 6.4, 6.16, 8.5_
  - [x] 21.4 Add scroll handling in `storyColumn.js`
    - Build chapter ranges (recompute with `ResizeObserver`), one rAF-throttled passive scroll handler using the 40% trigger line, emit `chapterActivated` and `progress`, signal `STORY_END` when `isPastLastChapter`
    - _Requirements: 6.5, 6.13_
  - [x] 21.5 Implement `src/ui/progressIndicators.js`
    - Scroll progress indicator ("Chapter n of N" plus a thin bar, summary not counted)
    - _Requirements: 6.15_
  - [x] 21.6 Add split layout to `sceneManager.js`
    - `setSplitLayout` using `camera.setViewOffset` for the left half (split) and top 40% (stacked), driven by `selectLayout` and a `matchMedia` change listener
    - _Requirements: 6.1, 6.2, 13.3_
  - [x] 21.7 Implement `src/ui/persistentControls.js`
    - Bottom-right borderless "Return to Space" button (Orbitron, `#FFFFFF`), 120% scale on hover or focus within 200 ms, hover sound hook, positioned with `env(safe-area-inset-*)`
    - _Requirements: 6.19, 13.8_
  - [x]* 21.8 Write unit tests for persistent button behaviour
    - Assert hover and focus scale, transition at most 200 ms, and the hover sound call
    - _Requirements: 6.19_
  - [x] 21.9 Wire the story in `main.js`
    - On `STORY`: show the column, progress indicator and persistent control, apply keyframes on `chapterActivated`, interpolate within a chapter from `progress`, decay manual model offset on chapter change; persistent button dispatches `RETURN_TO_SPACE` with target `opening` and stops the story, unloads the model and flies back
    - _Requirements: 6.1, 6.5, 6.13, 6.19_
  - [x] 21.10 Tune per-chapter keyframes in the browser
    - Step through all six missions with the real models and adjust each chapter's camera keyframe so the model is framed and lit well
    - _Requirements: 6.5, 5.2, 5.5_

- [x] 22. Summary and quiz
  - [x] 22.1 Implement `src/ui/summaryView.js`
    - Mission name, hardware, dates, final status, then "Test what you learned", then "Return to Space" (Explore), "Continue to Next Mission" or "Finish the Journey" (Journey, no Return to Space)
    - _Requirements: 6.13, 6.14, 7.1, 10.5_
  - [ ]* 22.2 Write property test for summary contents
    - **Property 19: Summary contains required fields**
    - **Validates: Requirements 6.13, 7.1, 10.5**
  - [x] 22.3 Write Surveyor 3 quiz questions
    - Three questions, four choices each, one correct, explanation and nasa.gov `sourceUrl`, from verified facts used in the chapters
    - _Requirements: 7.2, 7.5_
  - [x] 22.4 Write Apollo 11 quiz questions
    - Three questions, four choices each, one correct, explanation and nasa.gov `sourceUrl`
    - _Requirements: 7.2, 7.5_
  - [x] 22.5 Write Apollo 17 quiz questions
    - Three questions, four choices each, one correct, explanation and nasa.gov `sourceUrl`
    - _Requirements: 7.2, 7.5_
  - [x] 22.6 Write Viking 1 quiz questions
    - Three questions, four choices each, one correct, explanation and nasa.gov `sourceUrl`
    - _Requirements: 7.2, 7.5_
  - [x] 22.7 Write Opportunity quiz questions
    - Three questions, four choices each, one correct, explanation and nasa.gov `sourceUrl`
    - _Requirements: 7.2, 7.5_
  - [x] 22.8 Write InSight quiz questions
    - Three questions, four choices each, one correct, explanation and nasa.gov `sourceUrl`
    - _Requirements: 7.2, 7.5_
  - [x]* 22.9 Write unit tests for quiz data validation
    - `validateQuizzes` accepts `quizzes.json` and rejects mutations (two questions, three choices, two correct choices)
    - _Requirements: 7.2, 7.5_
  - [x] 22.10 Implement `src/ui/quizDialog.js` and `src/styles/dialog.css`
    - Native `<dialog>` with `showModal()`, `aria-labelledby`, focus moved in and trapped, Escape closes, 44 by 44 px `<button aria-label="Close quiz">` with a `#FFFFFF` X, overlay over the right half using the story column background, feedback within 1 s in an `aria-live` region, score out of 3 with message, retake with a freshly shuffled session; loaded with a dynamic import
    - _Requirements: 7.2, 7.3, 7.4, 7.6, 7.7_
  - [x]* 22.11 Write unit tests for the quiz dialog
    - Opens as a dialog, focus moves inside, Tab stays inside, Escape closes, close button name and 44 by 44 size, focus returns to "Test what you learned"
    - _Requirements: 7.7_
  - [x] 22.12 Wire summary and quiz in `main.js`
    - `STORY_END` shows the summary, `OPEN_QUIZ` and `CLOSE_QUIZ` open and close the dialog without changing story position, summary "Return to Space" flies to the orbit of the current body and unloads the model
    - _Requirements: 6.13, 6.14, 7.1, 7.7_

- [x] 23. Full Journey mode and closing screen
  - [x] 23.1 Implement `src/ui/transitionCards.js`
    - Journey intro card ("1967–2022") and per-mission transition card (name, hardware, year) shown for at most 3 s
    - _Requirements: 10.2, 10.6_
  - [x] 23.2 Add Journey controls and indicator
    - "Exit Journey" in `persistentControls.js` (same bottom-right slot, never shown together with "Return to Space") and "Mission n of 6 · Name" in `progressIndicators.js`
    - _Requirements: 10.7, 10.9_
  - [x] 23.3 Implement `src/ui/closingScreen.js`
    - Title "Silent Explorers", span 1967–2022, all six missions with hardware and year, "Explore on Your Own" action; loaded with a dynamic import
    - _Requirements: 10.8_
  - [x]* 23.4 Write unit tests for transition cards
    - Card text matches the next mission and auto-dismisses within 3 s (fake timers)
    - _Requirements: 10.6_
  - [x] 23.5 Wire Full Journey in `main.js`
    - Start from the opening button, show the intro card, play missions in order using the Explore story flow, "Continue to Next Mission" flies out and then to the next site, transition card, "Finish the Journey" flies to the opening view and shows the closing screen, "Explore on Your Own" returns to Explore mode, "Exit Journey" returns to orbit of the active body and discards the scroll position so the next start begins at mission 1
    - _Requirements: 10.1 to 10.10_

- [x] 24. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 25. Audio
  - [x] 25.1 Source audio assets and licence notes
    - Download royalty-free or CC audio: one soft space ambient track, six mission tracks matching the moods in Requirement 11.3, Opportunity's quiet lower-register variation, and a UI hover sound; compress to Opus or AAC at about 96 kbps in `public/audio/`
    - Record title, author, URL and licence in `public/audio/CREDITS.md`
    - _Requirements: 11.2, 11.3, 11.5, 11.9_
  - [x] 25.2 Write `src/data/audio.json`
    - Tracks (`id`, `file`, `loop`, `gain`, `mood`, `source`, `license`), effects, `crossfadeMs: 2000`; mission `audio.trackId` and `variationTrackId` in `missions.json` resolve to these ids
    - _Requirements: 11.3, 11.9_
  - [x] 25.3 Implement `src/audio/audioEngine.js`
    - Lazy suspended `AudioContext`, `unlockOnGesture`, `playTrack`, `crossfadeTo` (linear ramps over 2 s), `preload`, `setMuted` and `isMuted`, `pushContext` and `popContext`, pure `resolveTrack`; fetch and decode errors are logged and skipped
    - _Requirements: 11.1, 11.2, 11.4, 11.5, 11.7, 11.8, 11.10, 11.12_
  - [x]* 25.4 Write property test for audio track resolution
    - **Property 30: Audio track resolution**
    - **Validates: Requirements 11.2, 11.3, 11.5, 11.11**
  - [x]* 25.5 Write property test for muted silence
    - **Property 31: Muted engine stays silent**
    - **Validates: Requirements 11.8, 11.12**
  - [x]* 25.6 Write property test for quiz audio context
    - **Property 32: Quiz audio context round trip**
    - **Validates: Requirements 11.12**
  - [x]* 25.7 Write property test for audio licensing data
    - **Property 33: Audio data licensing**
    - **Validates: Requirements 11.3, 11.9**
  - [x] 25.8 Implement `src/audio/uiSounds.js`
    - `playHover()` is a no-op before unlock and when muted
    - _Requirements: 6.19, 10.1, 10.9_
  - [x] 25.9 Implement `src/audio/audioController.js`
    - Persistent mute toggle with `aria-pressed`, label "Mute audio" or "Unmute audio", top-right with safe-area inset, 44 by 44 px, visible on every screen including the closing screen, `M` shortcut
    - _Requirements: 11.6, 11.7, 11.8, 13.6_
  - [x]* 25.10 Write unit tests for the audio engine with a mocked `AudioContext`
    - No playback before a gesture, ambient starts after the first gesture, crossfade ramp ends 2 s after start, preload runs before crossfade
    - _Requirements: 11.1, 11.4, 11.10_
  - [x] 25.11 Wire audio in `main.js`
    - Unlock on first `pointerdown`, `keydown` or `touchend`; crossfade by screen (opening, orbit, closing, quiz use space ambient; story and summary use the mission track); preload the next track on `FLY_IN` and `JOURNEY_TRANSITION`; Opportunity's variation on its final chapter; `pushContext` and `popContext` around the quiz, cleared by navigation actions; hover sound on all text buttons
    - _Requirements: 11.1 to 11.12, 6.19, 10.1, 10.9_

- [x] 26. Responsive and mobile
  - [x] 26.1 Add responsive layout CSS
    - Stacked layout below 768 px (model top 40dvh, story column bottom 60dvh, full width, same background) with a `vh` fallback before each `dvh`, `overflow: hidden` and `overscroll-behavior: none` on `html` and `body`, `min-width: 0` and wrapping so nothing scrolls horizontally at 320 px, safe-area padding at the story column bottom
    - _Requirements: 13.1, 13.3, 13.8_
  - [x] 26.2 Add touch press feedback and marker labels
    - When `(hover: none)` matches, apply the 120% scale and hover sound on `pointerdown` and remove it on `pointerup`, `pointercancel` and `pointerleave` for text buttons; show persistent mission-name labels (flip near the right edge, at least 14 px, `#FFFFFF`) beside marker proxies
    - _Requirements: 13.5, 13.6_
  - [x] 26.3 Add touch targets and gesture arbitration
    - `min-width` and `min-height` of 44 px on all interactive elements and marker proxy buttons (nearest-centre wins on overlap); `touch-action: pan-y` and `overscroll-behavior: contain` on the story column, `touch-action: none` on the canvas; multi-pointer handling in `cameraRig.js` and `hardwareModelManager.js`
    - _Requirements: 13.6, 13.7_
  - [x] 26.4 Add the narrow-screen quiz layout
    - Below 768 px the dialog is a full-width panel (`inset: auto 0 0 0`, `height: 60dvh`), `overflow-y: auto`, `overscroll-behavior: contain`, with a sticky 44 by 44 px close icon
    - _Requirements: 13.4_
  - [x] 26.5 Wire adaptive quality in `sceneManager.js`
    - Measure fps in the render loop, track `secondsBelow30` and `secondsAtOrAbove55`, call `nextQualityLevel` each second, apply `min(devicePixelRatio, levelPixelRatio)` and the star share, reset counters on level change
    - _Requirements: 13.9, 1.4, 8.2_
  - [x] 26.6 Handle resize and layout changes
    - Debounce resize with `requestAnimationFrame`, resize the canvas only when width or layout changes or height changes by more than a small threshold, recompute chapter ranges and the view offset on layout change
    - _Requirements: 13.1, 13.3, 13.8_
  - [x]* 26.7 Write unit tests for responsive behaviour
    - CSS rules give 44 px targets, hover scale is inside `@media (hover: hover)`, `noHover` press feedback toggles the scale and calls the sound, and the stacked media query matches `selectLayout`
    - _Requirements: 13.3, 13.5, 13.6_

- [x] 27. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 28. Accessibility and performance
  - [x] 28.1 Apply accessibility markup and behaviour
    - Alt text or `aria-label` on all images and the placeholder model, canvas `role="img"` with a label that updates with the current view, `aria-live="polite"` for chapter changes, quiz feedback and toasts, landmarks and heading order, `prefers-reduced-motion` handling for reveals, hover scale and camera tweens, visible `:focus-visible` on every control
    - _Requirements: 8.3, 8.4, 8.5, 6.4, 6.16_
  - [x]* 28.2 Write automated accessibility tests
    - Run axe (`vitest-axe`) on the opening view, story column, summary and quiz dialog
    - _Requirements: 8.3, 8.4, 8.5_
  - [x] 28.3 Apply performance and build settings
    - Vite code splitting (Three.js and loaders in one chunk, quiz and closing screen dynamic imports), build target and browserslist for the latest two versions of Chrome, Firefox, Safari and Edge plus iOS Safari and Android Chrome, `loading="lazy"`, `decoding="async"` and explicit dimensions on images, anisotropy capped at 4, dev-only FPS overlay
    - _Requirements: 8.1, 8.2, 13.2_

- [x] 29. Final integration
  - [x] 29.1 Review wiring and error handling in `main.js`
    - Confirm every screen's engine, UI and audio side effects match the design table, and that each error row (context lost, marker, model, image, texture, citation, content, audio) has a visible fallback and never blocks the story
    - _Requirements: 1.5, 3.6, 4.6, 5.6, 9.5, 11.1_
  - [x] 29.2 Add the build pipeline
    - `npm run build` runs `validate-data`, `check-assets` and `vitest --run` before the Vite build
    - _Requirements: 9.2, 13.9_
  - [x]* 29.3 Write Playwright smoke tests
    - Opening scene loads, marker click reaches a story, scroll reaches the summary, quiz opens and closes, journey reaches the closing screen
    - _Requirements: 4.1, 6.13, 7.7, 10.8_

- [x] 30. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 31. Manual verification before submission (developer, non-code, not automated)
  - [x] 31.1 Fact-check every narrative claim
    - Check each chapter, callout and quiz answer against its cited nasa.gov page, confirm approximate figures are worded as approximate, check quotes are attributed, and review the reading-level report
    - _Requirements: 9.1, 9.6, 9.7, 7.5, 6.3_
  - [ ] 31.2 Compare each 3D model with NASA reference photos
    - Check shape, major components and markings for all six models; check marker positions against the textures (for example Tranquility Base on the near side)
    - _Requirements: 9.4, 9.3, 1.2_
  - [ ] 31.3 Measure performance
    - Measure at least 30 fps and the 10 second load (10 Mbps) on a modest laptop with integrated graphics and on a mid-range 4 GB phone; do a listening pass for mood, loudness and crossfade smoothness
    - _Requirements: 1.4, 8.1, 8.2, 13.9, 11.3_
  - [ ] 31.4 Run accessibility audits and manual passes
    - Run axe or Lighthouse, then a keyboard-only walkthrough (opening scene, story, quiz, journey) and a screen-reader pass (NVDA or VoiceOver) on the story column and quiz dialog
    - _Requirements: 8.3, 8.4, 8.5, 7.7, 12.9_
  - [ ] 31.5 Test on real phones
    - Test on a real iPhone (Safari) and Android phone (Chrome) in portrait and landscape: layout from 320 px, touch targets, press feedback, gesture arbitration, safe areas and toolbars, quiz panel
    - _Requirements: 13.1, 13.2, 13.4 to 13.8_
  - [x] 31.6 Check all licences and credits
    - Confirm image, audio, model and texture licences and that every credit appears in the site and in the `CREDITS.md` files
    - _Requirements: 6.17, 6.18, 11.9, 1.2_

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP.
- Each task references requirement numbers; property tests also name the design property.
- Property tests that read the real JSON (Properties 8, 15, 16, 17, 33) are placed after the content they check, and also run against mutated copies to prove the validator rejects bad data.
- `main.js` is edited by several wiring tasks, so those tasks are in separate waves.
- Section 31 is for the developer and is not meant for a coding agent.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "2.1", "3.1", "4.1", "5.1", "7.1", "7.3", "8.1", "8.3", "12.1"] },
    { "id": 2, "tasks": ["1.4", "2.2", "2.3", "2.4", "2.5", "2.6", "2.7", "3.2", "3.3", "3.4", "3.5", "4.2", "4.3", "5.2", "5.3", "6.1", "7.2", "7.4", "8.2", "8.4", "10.1", "13.1", "14.4", "16.1"] },
    { "id": 3, "tasks": ["6.2", "6.3", "10.2", "13.2", "13.3", "16.2", "16.3", "17.1"] },
    { "id": 4, "tasks": ["10.3", "10.4", "17.2", "18.1"] },
    { "id": 5, "tasks": ["11.1", "18.2"] },
    { "id": 6, "tasks": ["11.2", "12.2", "18.3"] },
    { "id": 7, "tasks": ["14.1", "18.4"] },
    { "id": 8, "tasks": ["14.2", "14.3", "14.5", "18.5"] },
    { "id": 9, "tasks": ["18.6", "20.1", "20.2", "21.1", "21.5", "21.6", "21.7", "22.1", "22.3", "22.10", "23.1", "23.3", "25.1", "25.3"] },
    { "id": 10, "tasks": ["18.7", "20.3", "20.4", "20.5", "20.6", "21.2", "21.8", "22.2", "22.4", "22.11", "23.2", "23.4", "25.2", "25.5", "25.6", "25.8", "25.9", "25.10"] },
    { "id": 11, "tasks": ["18.8", "20.8", "21.3", "22.5", "25.4", "25.7"] },
    { "id": 12, "tasks": ["18.9", "21.4", "22.6"] },
    { "id": 13, "tasks": ["18.10", "22.7"] },
    { "id": 14, "tasks": ["18.11", "22.8"] },
    { "id": 15, "tasks": ["18.12", "22.9"] },
    { "id": 16, "tasks": ["18.13", "18.14", "18.15", "18.16", "18.17", "18.18"] },
    { "id": 17, "tasks": ["20.7", "20.9"] },
    { "id": 18, "tasks": ["21.9"] },
    { "id": 19, "tasks": ["21.10", "22.12"] },
    { "id": 20, "tasks": ["23.5"] },
    { "id": 21, "tasks": ["25.11"] },
    { "id": 22, "tasks": ["26.1", "26.2", "26.4", "26.5"] },
    { "id": 23, "tasks": ["26.3", "26.6"] },
    { "id": 24, "tasks": ["26.7", "28.1"] },
    { "id": 25, "tasks": ["28.2", "28.3"] },
    { "id": 26, "tasks": ["29.1", "29.2"] },
    { "id": 27, "tasks": ["29.3"] },
    { "id": 28, "tasks": ["31.1", "31.2", "31.3", "31.4", "31.5", "31.6"] }
  ]
}
```
