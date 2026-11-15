# Implementation Plan: The Atumatik DoRe

Last update: 15/11/2026.

| Phase | Owner | Status | Scope |
|---|---|---|---|
| Phase 1 | Argon (Orchestrator) | [x] Complete | Plan, preflight checks, and fact verification |
| Phase 2 | Argon + Hydrogen | [x] In progress | Gitignore and 14 STE documentation files |
| Phase 3 | Hydrogen | [ ] Pending | Git initialization, secret scan, initial docs push (steps 10.1 to 10.5) |
| Phase 4 | Hydrogen | [ ] Pending | Design tokens, self-hosted fonts, static assets, and 6 board screenshots |
| Phase 5 | Hydrogen | [ ] Pending | Pure modules (`door-fsm.js`, `mode-a.js`, `mode-b.js`) and `node --test` suite |
| Phase 6 | Hydrogen | [ ] Pending | Interactive UI, audio capture, lazy voiceprint model, Groq integration, hardware guide |
| Phase 7 | Hydrogen | [ ] Pending | Section 15 QA checks, CSP model load test, synthetic voice smoke test, Lighthouse |
| Phase 8 | Argon (Orchestrator) | [ ] Pending | Security, consent, CSP, rate-limit, and voiceprint review |
| Phase 9 | Hydrogen + Argon | [ ] Pending | Enable GitHub Pages (step 10.6), live URL verification, final audit and handoff |

## Checklist

- [x] Verify Section 4 facts and Malaysian hardware prices on 15/11/2026.
- [x] Approve assumptions, fallback model `openai/gpt-oss-20b`, and PROVISIONAL `0.78` threshold notice.
- [ ] Write all 14 STE documentation files and `.gitignore`.
- [ ] Initialize Git on `main`, scan for secrets and paths, create public repo, and push docs.
- [ ] Create `design/tokens.css`, self-host `Jost` and `IBM Plex Mono` WOFF2 fonts, and capture 6 screenshots.
- [ ] Build `src/door-fsm.js`, `src/mode-a.js`, `src/mode-b.js`, and verify `node --test`.
- [ ] Build `src/audio.js`, `src/voiceprint.js`, `src/app.js`, `index.html`, `guide.html`, `404.html`, `robots.txt`, and `sitemap.xml`.
- [ ] Run Section 15 checks, Lighthouse audits, and synthetic two-voice smoke test.
- [ ] Hand back to Argon for Step 7 security review before enabling GitHub Pages.
- [ ] Enable GitHub Pages and run live URL checks.
