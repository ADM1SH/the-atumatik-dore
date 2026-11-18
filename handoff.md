# Handoff

Last update: 18/11/2026 (wrap-up for Argon 4).

## 1. Goals

- Replace the sliding door demo with a Proton Gen2 CPS (manual) car demo in a black body with bronze rims. Everything is a browser demo. No real hardware is controlled.
- Add voice-controlled windows, a keyfob, a child-in-car alert, and a kick sensor for the doors.
- Keep Mode A, Mode B, the speaker lock, the PDPA 2010 notice, the strict CSP, and the per-device voice setup (BUG-006, DEC-010).
- Work on branch `feat/proton-gen2`. Do not push to `main`. Do not deploy to GitHub Pages.

## 2. Current state

- All six phases are built and committed on branch `feat/proton-gen2` (`59606a7`, `6ed784b`, `aac779a`). Nothing is pushed. `main` stays at `1225c43`. The wrap-up edits to `bugs.md`, `task_today.md`, `handoff.md`, and `GEMINI.md` are not committed.
- Open errors: BUG-007 to BUG-013 in `bugs.md`. The next task is the Argon 4 hand-off in `task_today.md`.
- `node --test tests/` passes `49/49` (was `25/25`).
- Lighthouse (v13.6.0, mobile and desktop) scores `100` in Accessibility, Best Practices, SEO, and Agentic Browsing on `index.html` (60 audits pass) and `guide.html` (57 pass) on `localhost`. The live site before the change scored `100` (57 and 56 pass).
- Browser pane checks on `localhost`: the rules, keyfob buttons, kick table, every alert response and cancel, and the 60 s ventilate (50, 100, 50, 50 read at 68 s) ran in the page, the BUG-006 restore was re-checked on the final `app.js`, zero console errors, no horizontal scroll at 375 px, kick zones `44 x 44` px, reduced motion gives `0 s` transitions.
- Six boards in `design/boards/` were captured again. `og-share.png` and `favicon.svg` now show the car. `404.html` text is updated.
- The repository scan found zero em dashes, zero en dashes, zero secrets, zero real emails, and no reference images tracked.
- The `0.78` speaker threshold stays `PROVISIONAL`.

## 3. Active files

- `index.html`, `guide.html`, `404.html`, `assets/styles.css`, `design/tokens.css`, `assets/favicon.svg`, `assets/og-share.png`
- `src/car.js`, `src/child-alert.js`, `src/chime.js`, `src/mode-a.js`, `src/mode-b.js`, `src/app.js`
- `tests/car.test.js`, `tests/child-alert.test.js`, `tests/chime.test.js`, `tests/mode-a.test.js`, `tests/voiceprint-storage.test.js`
- Docs: `prd.md`, `ARCHITECTURE.md`, `SECURITY.md`, `testing.md`, `audit.md`, `decisions.md` (DEC-011, DEC-012), `README.md`, `DESIGN_SYSTEM.md`, `CODE_STYLE.md`, `GEMINI.md`, `implementation_plan.md`
- `.claude/launch.json` (untracked preview config, do not commit)
- Reference images stay in the `Gen2 Reference` folder outside the repo. Do not commit them.

## 4. Changes made

- Phase 1: car SVGs (side and top-down, 1 unit per 10 mm), tokens, five-section layout, door removal, gate moved to `#car-model`.
- Phase 2: `src/car.js` (lock, window gate, kick, close door, keyfob buttons, internal `ventilate`) and tests. Door files removed with `git rm`.
- Phase 3: Mode A window vocabulary (one command per sentence), Mode B schema with `target`, car state in the prompt, voice wiring, Mode B rules key `atumatik_modeb_rules_v2`.
- Phase 4: `src/child-alert.js` (fixed deadline, injected clock), `src/chime.js` (WebAudio), banner with `role="alert"`, countdown with `role="timer"`, Sound toggle and status line.
- Phase 5: keyfob panel, keyfob buttons answer the alert, kick table tests.
- Phase 6: `guide.html` rewritten as a concept guide, `404.html`, favicon, OG image, docs, audit, boards.
- Parts check on 18/11/2026: Cytron Robo ESP32 RM62.58 listed but "Out Of Stock". No presence radar module found at Cytron or Mybotic (marked "not verified" in the guide).

## 5. Failed attempts

- The preview tab cached old CSS once. A forced reload fixed it.
- `PIL` is not installed. Image measurement used a Swift script in the scratchpad.
- A long `javascript_tool` wait timed out at 45 s. The page script still finished.
- The 2005 plan drawing is `16%` too long for the 5-door spec. The 2007 side drawing is squashed vertically by about `1.10`. Both were corrected from the spec.
- Mybotic search for `ld2410` returned no product. Cytron listed only a LoRaWAN radar (RM430.50, out of stock).

## 6. Next steps

1. Pass `argon_car_model_prompt.md` to Argon 4 with the six reference files from the `Gen2 Reference` folder. Argon 4 lists all errors first and waits for Adam's approval.
2. Adam reviews the branch and says when to commit the wrap-up edits and when to merge. Do not push to `main`.
3. Hand tests: on a real phone and on desktop Chrome, speak window commands with Mode A and Mode B, try a stranger voice with a voiceprint enrolled, listen to the chime after one click, and tap each kick zone.
4. Decide whether the guide needs a credit line for the reference photos.
5. Parked: on desktop Chrome and Android Chrome, enrol 2 sentences, reload, record the other 3, and reload again. Check that the fifth sentence turns all rows to "Captured (saved)".
6. Parked: enrol Adam's voice across all five sentences and test live scores against a second speaker. Record the scores in `decisions.md` and update `DEFAULT_THRESHOLD` in `src/voiceprint.js` if needed.
7. Parked: test Mode B with a temporary Groq key from console.groq.com.
