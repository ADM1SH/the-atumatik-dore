# Handoff

Last update: 15/11/2026 (20:09 Asia/Kuala_Lumpur).

## 1. Goals

- Build "The Atumatik DoRe", a static voice-controlled automatic sliding door demo and hardware guide for GitHub Pages (`ADM1SH/the-atumatik-dore`).
- Provide two pages (`index.html` and `guide.html`) in plain HTML, CSS, and ES modules with zero build step.
- Support Mode A (offline coded commands), Mode B (browser-direct Groq API rules with user-supplied key), and a lazy-loaded `Xenova/wavlm-base-plus-sv` speaker lock with PDPA 2010 notice.
- Complete Section 15 checks, Lighthouse audits, Argon Step 7 review, and Step 10.6 GitHub Pages deployment.

## 2. Current state

- Phases 1 to 9 are complete on branch `main`.
- Argon approved Step 7 security review before Step 10.6 ran.
- GitHub Pages is active with `https_enforced: true` at `https://adm1sh.github.io/the-atumatik-dore/`.
- Live HTTPS URLs (`index.html`, `guide.html`, `robots.txt`) return HTTP `200` with zero console errors in Chrome.
- Default threshold `0.78` remains `PROVISIONAL` until Adam tests live audio from two human speakers.

## 3. Active files

- `index.html`, `guide.html`, `404.html`, `robots.txt`, `sitemap.xml` (live GitHub Pages site)
- `design/tokens.css`, `assets/styles.css`, `assets/favicon.svg`, `assets/og-share.png`, `assets/fonts/` (tokens, self-hosted fonts, icons)
- `design/boards/*.png` (6 light, dark, and mobile verification screenshots)
- `src/door-fsm.js`, `src/mode-a.js`, `src/mode-b.js`, `src/voiceprint.js`, `src/audio.js`, `src/app.js` (application ES modules)
- `tests/door-fsm.test.js`, `tests/mode-a.test.js` (`node --test` unit tests)
- `decisions.md`, `SECURITY.md`, `bugs.md`, `audit.md`, `testing.md`, `implementation_plan.md`, `task_today.md`, `handoff.md` (project records)

## 4. Changes made

- Enabled GitHub Pages on `ADM1SH/the-atumatik-dore` (`main` `/`) via Step 10.6 after Argon Step 7 approval.
- Verified live HTTPS load, assets (`200`), and zero CSP errors across `https://adm1sh.github.io/the-atumatik-dore/` and `guide.html`.
- Completed documentation updates in `implementation_plan.md`, `testing.md`, `audit.md`, `task_today.md`, and `handoff.md`.
- Fixed `BUG-004` in `src/audio.js` and `src/app.js` so push-to-talk waits up to `1800` ms after release for final speech results.
- Added a `1550` ms push-to-talk regression test in `tests/mode-a.test.js` (`16/16` unit tests pass).
- Fixed `BUG-005` in `src/mode-b.js` (`max_tokens: 512`, `reasoning_effort: "low"`, and `400` error detail reporting) with `17/17` unit tests passing.

## 5. Failed attempts

- Autobotic returned HTTP `404` and RS Components Malaysia returned HTTP `503` during price checks. Used Cytron Malaysia and Mybotic Malaysia (`200`) instead.
- `@huggingface/transformers@4.3.2/dist/transformers.web.js` failed with bare specifier `"onnxruntime-web/webgpu"`. Switched to `transformers.min.js`.
- Strict CSP blocked `blob:` WASM loading on `index.html` and `robots.txt` on `guide.html`. Updated CSP directives and re-verified zero errors.

## 6. Next steps

1. Open `https://adm1sh.github.io/the-atumatik-dore/` in Chrome or Edge on desktop and Android.
2. Enrol Adam's voice across all five sentences and test live scores against a second speaker.
3. Record live scores in `decisions.md` and update `DEFAULT_THRESHOLD` in `src/voiceprint.js` if needed.
4. Optionally test Mode B in the browser with a temporary Groq key from console.groq.com.
