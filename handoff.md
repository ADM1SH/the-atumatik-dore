# Handoff

Last update: 19/11/2026 (merged `feat/gen2-model-v2` into `feat/proton-gen2` and `main`).

## 1. Goals

- Replace the sliding door demo with a Proton Gen2 CPS (manual) car demo in a black body with bronze rims. Everything is a browser demo. No real hardware is controlled.
- Deliver Job 1 (read-only repository audit) and Job 2 (Proton Gen2 CPS SVG model v2, refreshed assets, and refreshed boards) in full auto mode.
- Keep Mode A, Mode B, the speaker lock, the PDPA 2010 notice, the strict CSP, and per-device persistence (BUG-006, DEC-010).
- Fast-forward merge `feat/gen2-model-v2` into `feat/proton-gen2` and `main` on Adam's approval, then push all three branches.

## 2. Current state

- `feat/gen2-model-v2`, `feat/proton-gen2`, and `main` all point to the same tip on 19/11/2026 (`61f2d51`, `5395f70`, `dc0f242`, `60129a4`, plus this merge update). All three branches are pushed to `origin` (`https://adm1sh.github.io/the-atumatik-dore/`).
- `node --test tests/` passes `49/49` (`0` failures).
- Headless Chrome checks (`localhost:8768`) passed after Model v2. Checks confirmed zero console errors, zero horizontal overflow (outside `.table-wrap` at 375 px), and `44 x 44` px kick zones with at least 13 px gap. Checks also verified `0s` reduced-motion transitions, mirror-hidden fuel flap, all car rules, BUG-006 restore, and a real-time 60 s alert moving windows to `[50, 100, 50, 50]`.
- Lighthouse v13.6.0 scored `100` in all four categories before Model v2 (`18/11/2026`). Lighthouse did not re-run after Model v2 because no local Lighthouse binary is installed here.
- BUG-007, BUG-008, BUG-009, and the OG image stray line (`BUG-012`) are fixed. Open items `BUG-010` to `BUG-017` remain in `bugs.md`.
- The `0.78` speaker threshold stays `PROVISIONAL`.

## 3. Active files

- `index.html`, `guide.html`, `404.html`, `assets/styles.css`, `design/tokens.css`, `assets/favicon.svg`, `assets/og-share.png`
- `design/boards/index-light.png`, `design/boards/index-dark.png`, `design/boards/index-mobile.png`, `design/boards/guide-light.png`, `design/boards/guide-dark.png`, `design/boards/guide-mobile.png`
- `src/car.js`, `src/child-alert.js`, `src/chime.js`, `src/mode-a.js`, `src/mode-b.js`, `src/app.js`, `src/audio.js`, `src/voiceprint.js`
- `tests/car.test.js`, `tests/child-alert.test.js`, `tests/chime.test.js`, `tests/mode-a.test.js`, `tests/voiceprint-storage.test.js`
- Docs: `bugs.md`, `decisions.md`, `DESIGN_SYSTEM.md`, `testing.md`, `audit.md`, `handoff.md`, `task_today.md`
- `.claude/launch.json` (untracked preview config, do not commit)

## 4. Changes made

- Cut branch `feat/gen2-model-v2` from `feat/proton-gen2` (`501d8ed`).
- Redrew `#car-side` (`viewBox="0 -26 480 216"`) with cubic Beziers, curved glass with mirror sail, and rounded-D quarter glass (`61f2d51`). Added right-only fuel flap and keyhole (`.car-right-only`), fixed 3-lens tail lamp, pylon spoiler, twin-projector headlamp, lower intake, and 5-split-spoke rims.
- Redrew `#car-top` (`viewBox="0 0 480 370"`) fitted to the `431 x 172.5` spec (`61f2d51`). Added bonnet creases, nose grille, curved windscreen, roof seams, tapered rear glass with spoiler, swinging doors with wing mirrors, and open-cabin strokes.
- Updated `assets/favicon.svg` and re-rendered `assets/og-share.png` without the stray line (`5395f70`). Re-captured all six boards at `1440 px` and `375 px` widths with verified light and dark themes.
- Updated `bugs.md`, `decisions.md` (`DEC-013`), `DESIGN_SYSTEM.md`, `testing.md`, `audit.md`, `task_today.md`, and `handoff.md`.

## 5. Failed attempts

- The `lighthouse` CLI binary is not installed globally or in the npm cache, and no `chrome_devtools` MCP server process is available in this session. Post-Model-v2 Lighthouse was left unverified rather than faked.
- First preview clip of `#car-model` truncated the bottom open door at viewport height 1400 px. Passing `captureBeyondViewport: true` resolved the clip check.

## 6. Next steps

1. Adam tests the live GitHub Pages deployment (`https://adm1sh.github.io/the-atumatik-dore/`) and confirms the Model v2 car views.
2. Run Lighthouse v13.6.0 on the live site (`index.html` and `guide.html`, mobile and desktop) after GitHub Pages builds.
3. Adam decides whether to fix remaining open items (`BUG-010` to `BUG-017`) in a follow-up change.
4. Hand tests for Adam: real mic voice commands in Mode A and Mode B, and a stranger voice against an enrolled voiceprint. Test Mode B with a live Groq key, audible chime on desktop and phone, phone kick touch, Commons licences, and live-site Lighthouse.
