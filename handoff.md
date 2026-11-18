# Handoff

Last update: 18/11/2026.

## 1. Goals

- Build "The Atumatik DoRe", a static voice-controlled automatic sliding door demo and hardware guide for GitHub Pages (`ADM1SH/the-atumatik-dore`).
- Provide two pages (`index.html` and `guide.html`) in plain HTML, CSS, and ES modules with zero build step.
- Support Mode A (offline coded commands), Mode B (browser-direct Groq API rules with user-supplied key), and a lazy-loaded `Xenova/wavlm-base-plus-sv` speaker lock with PDPA 2010 notice.
- Keep voice setup state per device: consent, enrolment progress, voiceprint, and the cached voice model survive reloads and page changes (BUG-006).
- Complete Section 15 checks, Lighthouse audits, Argon Step 7 review, and Step 10.6 GitHub Pages deployment.

## 2. Current state

- Phases 1 to 9 are complete on branch `main`.
- The BUG-006 fix (saved state per device) is in the working tree. It is NOT committed and NOT pushed. The live site `https://adm1sh.github.io/the-atumatik-dore/` still serves the build without the fix until Adam commits and pushes.
- `node --test tests/` passes `25/25`.
- Browser pane check on `localhost` (18/11/2026, seeded voiceprint): reload keeps consent, shows five "Captured (saved)" rows, loads the cached model in the background, sends zero `huggingface.co` requests, and shows zero console errors.
- Default threshold `0.78` remains `PROVISIONAL` until Adam tests live audio from two human speakers.

## 3. Active files

- `index.html`, `guide.html`, `404.html`, `robots.txt`, `sitemap.xml` (live GitHub Pages site)
- `design/tokens.css`, `assets/styles.css`, `assets/favicon.svg`, `assets/og-share.png`, `assets/fonts/` (tokens, self-hosted fonts, icons)
- `design/boards/*.png` (6 light, dark, and mobile verification screenshots)
- `src/door-fsm.js`, `src/mode-a.js`, `src/mode-b.js`, `src/voiceprint.js`, `src/audio.js`, `src/app.js` (application ES modules)
- `tests/door-fsm.test.js`, `tests/mode-a.test.js`, `tests/voiceprint-storage.test.js` (`node --test` unit tests)
- `decisions.md`, `SECURITY.md`, `bugs.md`, `audit.md`, `testing.md`, `implementation_plan.md`, `task_today.md`, `handoff.md` (project records)

## 4. Changes made

- `src/voiceprint.js`: added `loadConsent`, `saveConsent`, `loadEnrolmentProgress`, `saveEnrolmentProgress`, `isModelCached`, and `requestPersistentStorage`. `saveVoiceprint` and `deleteVoiceprint` now clear unfinished enrolment vectors. Progress text says "Loading ... from device cache" when the model is cached.
- `src/app.js`: restores the consent tick and unfinished enrolment at load, shows a saved voiceprint as five "Captured (saved)" rows with disabled record buttons, and loads the model in the background only when it is cached, a voiceprint exists, and consent is saved.
- `index.html`: the PDPA notice now says this browser remembers consent and unfinished vectors and keeps the model files in its cache.
- `tests/voiceprint-storage.test.js`: 8 new tests. They failed before the fix.
- Docs: BUG-006 in `bugs.md`, DEC-010 in `decisions.md`, section 2 of `SECURITY.md` (including the shared-origin risk), and section 3 of `testing.md`.

## 5. Failed attempts

- Autobotic returned HTTP `404` and RS Components Malaysia returned HTTP `503` during price checks. Used Cytron Malaysia and Mybotic Malaysia (`200`) instead.
- `@huggingface/transformers@4.3.2/dist/transformers.web.js` failed with bare specifier `"onnxruntime-web/webgpu"`. Switched to `transformers.min.js`.
- Strict CSP blocked `blob:` WASM loading on `index.html` and `robots.txt` on `guide.html`. Updated CSP directives and re-verified zero errors.
- The Claude in Chrome profile held no voiceprint and no model cache on 18/11/2026, so it could not show Adam's real state. The cache check ran in the browser pane instead. It proved the model cache survives a reload.
- Chrome denied `navigator.storage.persist()` on a fresh `localhost` profile. Automatic eviction under low disk space is still possible.

## 6. Next steps

1. Ask Adam to commit and push the BUG-006 fix to `main` so GitHub Pages serves it.
2. On desktop Chrome and Android Chrome: enrol 2 sentences, reload, record the other 3, and reload again. Check that the fifth sentence turns all rows to "Captured (saved)".
3. Enrol Adam's voice across all five sentences and test live scores against a second speaker.
4. Record live scores in `decisions.md` and update `DEFAULT_THRESHOLD` in `src/voiceprint.js` if needed.
5. Optionally test Mode B in the browser with a temporary Groq key from console.groq.com.
