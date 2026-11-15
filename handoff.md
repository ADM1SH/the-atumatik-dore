# Handoff

Last update: 15/11/2026 (14:08 Asia/Kuala_Lumpur).

## 1. Goals

- Build "The Atumatik DoRe", a static voice-controlled automatic sliding door demo and hardware guide for GitHub Pages (`ADM1SH/the-atumatik-dore`).
- Provide two pages (`index.html` and `guide.html`) in plain HTML, CSS, and ES modules with zero build step.
- Support Mode A (offline coded commands), Mode B (browser-direct Groq API rules with user-supplied key), and a lazy-loaded `Xenova/wavlm-base-plus-sv` speaker lock with PDPA 2010 notice.
- Complete Section 15 checks, Lighthouse audits, Argon Step 7 review, and Step 10.6 GitHub Pages deployment.

## 2. Current state

- Phases 1 to 7 are complete on branch `main`.
- Unit tests (`15/15`), live `Xenova/wavlm-base-plus-sv` WASM model load, and Section 15 browser checks all passed.
- Synthetic smoke test scored `0.8503` (same) vs `0.6800` (different), marked `"synthetic, not an accuracy result"`.
- Lighthouse v13.6.0 scored `100` in Accessibility, Best Practices, SEO, and Agentic Browsing with cold Slow 4G `CLS 0.00`.
- Default threshold `0.78` stays `PROVISIONAL` until Adam runs live microphone calibration against two human speakers.
- Step 10.6 (enable GitHub Pages) awaits Argon Step 7 review first.

## 3. Active files

- `index.html`, `guide.html`, `404.html`, `robots.txt`, `sitemap.xml` (static pages and metadata)
- `design/tokens.css`, `assets/styles.css`, `assets/favicon.svg`, `assets/og-share.png`, `assets/fonts/` (tokens, self-hosted fonts, icons)
- `design/boards/*.png` (6 light, dark, and mobile verification screenshots)
- `src/door-fsm.js`, `src/mode-a.js`, `src/mode-b.js`, `src/voiceprint.js`, `src/audio.js`, `src/app.js` (application ES modules)
- `tests/door-fsm.test.js`, `tests/mode-a.test.js` (`node --test` unit tests)
- `decisions.md`, `SECURITY.md`, `bugs.md`, `audit.md`, `testing.md`, `implementation_plan.md`, `task_today.md`, `handoff.md` (project records)

## 4. Changes made

- Implemented the door state machine, Mode A matcher, Groq Mode B integration, Web Audio 16 kHz capture, and lazy `Xenova/wavlm-base-plus-sv` speaker lock (`src/voiceprint.js` using `transformers.min.js`).
- Added `index.html`, `guide.html` (verified `15/11/2026` Cytron MY and Mybotic MY prices), `404.html`, `robots.txt`, `sitemap.xml`, and `assets/styles.css`.
- Fixed CSP (`blob:` in `script-src` on `index.html`, `connect-src 'self'` on `guide.html` and `404.html`), added font preloads, and set `font-display: optional`.
- Verified `15/15` unit tests, synthetic smoke test, Section 15 checks, and Lighthouse `100` scores across all audited categories.

## 5. Failed attempts

- Autobotic returned HTTP `404` and RS Components Malaysia returned HTTP `503` during price checks. Used Cytron Malaysia and Mybotic Malaysia (`200`) instead.
- `@huggingface/transformers@4.3.2/dist/transformers.web.js` failed with bare specifier `"onnxruntime-web/webgpu"`. Switched to `transformers.min.js`.
- Strict CSP blocked `blob:` WASM loading on `index.html` and `robots.txt` on `guide.html`. Updated CSP directives and re-verified zero errors.

## 6. Next steps

1. Run Step 7 Argon review on `SECURITY.md`, `decisions.md`, `audit.md`, `index.html`, `src/mode-b.js`, `src/voiceprint.js`, and `src/app.js`.
2. After Argon approval, run Step 10.6 to enable GitHub Pages on `ADM1SH/the-atumatik-dore` (`main` `/`).
3. Open `https://adm1sh.github.io/the-atumatik-dore/` and verify HTTPS load, assets, and CSP with zero console errors.
4. Perform Adam's live two-speaker microphone calibration and physical Android Chrome/Edge check, then update `decisions.md` threshold from `PROVISIONAL`.
