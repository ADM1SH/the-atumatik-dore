# Handoff

Last update: 15/11/2026.

## 1. Goals

- Build "The Atumatik DoRe", a static voice-controlled automatic sliding door demo and hardware guide for GitHub Pages (`ADM1SH/the-atumatik-dore`).
- Provide two pages (`index.html` and `guide.html`) in plain HTML, CSS, and ES modules with zero build step.
- Support Mode A (offline coded commands), Mode B (browser-direct Groq API rules with user-supplied key), and a lazy-loaded `Xenova/wavlm-base-plus-sv` speaker lock with PDPA 2010 notice.
- Complete Section 15 checks, Lighthouse audits, Argon review (Step 7), and GitHub Pages deployment.

## 2. Current state

- Argon approved the execution plan on 15/11/2026 with two corrections. Mark `"Hydrogen can request a new Argon review in the middle of a task"` as NOT CONFIRMED. Mark default threshold `0.78` as PROVISIONAL until live calibration.
- Writing `.gitignore` and the 14 STE documentation files before initializing Git and building application code.
- Section 4 facts and 15/11/2026 MYR hardware prices from Cytron Malaysia and Mybotic Malaysia are verified.

## 3. Active files

- `.gitignore` (ignores `argon_*.md`, `.DS_Store`, `.env*`, `node_modules/`)
- `GEMINI.md` (project rules and source-of-truth table)
- `prd.md`, `implementation_plan.md`, `task_today.md`, `testing.md`, `bugs.md`, `audit.md`, `decisions.md`, `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, `SECURITY.md`, `CODE_STYLE.md`, `README.md` (STE documentation set)
- `handoff.md` (this file)

## 4. Changes made

- Created `argon_setup_prompt.md` and `argon_door_demo_prompt.md` (kept untracked via `.gitignore`).
- Verified Section 4 technical facts on 15/11/2026 (Groq/OpenRouter/Gemini CORS, Groq Free Plan limits, `Xenova/wavlm-base-plus-sv` quantized size `96.97 MB`, `@huggingface/transformers@4.3.2`).
- Verified 15/11/2026 Malaysian hardware prices on Cytron Malaysia and Mybotic Malaysia.
- Authored `.gitignore` and the 14 STE documentation files.

## 5. Failed attempts

- Autobotic search endpoint returned HTTP 404 on 15/11/2026 (`autoboticedu.com` home had no store price). RS Components Malaysia returned HTTP 503. Used Mybotic Malaysia (`mybotic.com.my`) for live HTTP 200 MYR pricing instead.

## 6. Next steps

1. Run Git steps 10.1 to 10.5 to initialize `main`, scan for secrets/paths/emails/em dashes, commit docs, create `ADM1SH/the-atumatik-dore`, and push docs.
2. Self-host `Jost` and `IBM Plex Mono` WOFF2 fonts, create `design/tokens.css`, static assets, pure modules (`door-fsm.js`, `mode-a.js`, `mode-b.js`), and `node --test` tests.
3. Implement `src/audio.js`, `src/voiceprint.js`, `src/app.js`, `index.html`, `guide.html`, `404.html`, `robots.txt`, and `sitemap.xml`.
4. Run Section 15 checks, capture the 6 boards in `design/boards/`, verify CSP with live model load, run synthetic two-voice smoke test, and run Lighthouse.
5. Hand off to Argon for Step 7 review before enabling GitHub Pages (Step 10.6).
