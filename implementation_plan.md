# Implementation Plan: The Atumatik DoRe

Last update: 15/11/2026 (14:08 Asia/Kuala_Lumpur).

| Phase | Owner | Status | Scope |
|---|---|---|---|
| Phase 1 | Argon (Orchestrator) | [x] Complete | Plan, preflight checks, and fact verification |
| Phase 2 | Argon + Hydrogen | [x] Complete | Gitignore and 14 STE documentation files |
| Phase 3 | Hydrogen | [x] Complete | Git initialization, secret scan, initial docs push (steps 10.1 to 10.5) |
| Phase 4 | Hydrogen | [x] Complete | Design tokens, self-hosted fonts, static assets, and 6 board screenshots |
| Phase 5 | Hydrogen | [x] Complete | Pure modules (`door-fsm.js`, `mode-a.js`, `mode-b.js`) and `node --test` suite |
| Phase 6 | Hydrogen | [x] Complete | Interactive UI, audio capture, lazy voiceprint model, Groq integration, hardware guide |
| Phase 7 | Hydrogen | [x] Complete | Section 15 QA checks, CSP model load test, synthetic voice smoke test, Lighthouse |
| Phase 8 | Argon (Orchestrator) | [ ] Pending | Step 7 security, consent, CSP, rate-limit, and voiceprint review |
| Phase 9 | Hydrogen + Argon | [ ] Pending | Enable GitHub Pages (step 10.6), live URL verification, final audit and handoff |

## Checklist

- [x] Verify Section 4 facts and Malaysian hardware prices on 15/11/2026.
- [x] Approve assumptions, fallback model `openai/gpt-oss-20b`, and PROVISIONAL `0.78` threshold notice.
- [x] Write all 14 STE documentation files and `.gitignore`.
- [x] Initialize Git on `main`, scan for secrets and paths, create public repo, and push docs (`c02d058`).
- [x] Create `design/tokens.css`, self-host `Jost` and `IBM Plex Mono` WOFF2 fonts, and capture 6 screenshots.
- [x] Build `src/door-fsm.js`, `src/mode-a.js`, `src/mode-b.js`, and verify `node --test` (`15/15` pass).
- [x] Build `src/audio.js`, `src/voiceprint.js`, `src/app.js`, `index.html`, `guide.html`, `404.html`, `robots.txt`, and `sitemap.xml`.
- [x] Run Section 15 checks, Lighthouse audits, CSP model load, and synthetic two-voice smoke test.
- [ ] Hand back to Argon for Step 7 security review before enabling GitHub Pages.
- [ ] Enable GitHub Pages (step 10.6) and run live URL checks.
