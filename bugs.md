# Bugs and Known Risks

Last update: 15/11/2026.

## Bug Report Template

```markdown
### BUG-NNN: Short title
- Date: DD/MM/YYYY
- Status: Open | Fixed
- Symptom: What happens in exact terms.
- Reproduction: Steps to reproduce the failure.
- Root cause: Proven cause from logs or failing test.
- Fix: Minimal change and verification test result.
```

## Open

None.

## Known Risks

1. **First-time voice model download (`97.03 MB`):** Enrolling or running speaker verification requires downloading `Xenova/wavlm-base-plus-sv` quantized ONNX (`96.97 MB`) plus config JSON files. Slow mobile connections take longer, so the UI keeps Mode A functional without the model and shows progress bars during download.
2. **Short voice clip variance (1 to 3 seconds):** Short push-to-talk utterances produce noisier speaker embeddings than longer speech samples. The default `0.78` cosine threshold is PROVISIONAL until calibrated against live recordings of Adam and a second speaker.
3. **Chrome cloud speech recognition:** Chrome `webkitSpeechRecognition` sends microphone audio to Google servers unless `processLocally` is supported and enabled by the browser.
4. **Groq free-tier quota variability:** Free-tier limits (`30 RPM`, `1,000 RPD`, `8,000 TPM` for `openai/gpt-oss-20b` on 15/11/2026) can change. The app disables the Talk button while a request runs and never auto-retries on HTTP `429`.

## Fixed

### BUG-001: External bare import in `transformers.web.js`
- Date: 15/11/2026
- Status: Fixed
- Symptom: Dynamic import of `@huggingface/transformers@4.3.2/dist/transformers.web.js` failed in Chrome with `Failed to resolve module specifier "onnxruntime-web/webgpu"`.
- Reproduction: Load voice model on `index.html` without an import map.
- Root cause: `transformers.web.js` leaves `onnxruntime-web/webgpu` external, and `transformers.min.js` bundles `onnxruntime-web` directly.
- Fix: Updated `TRANSFORMERS_CDN_URL` in `src/voiceprint.js` to `transformers.min.js` (`587,917` bytes) and verified model load in Chrome.

### BUG-002: Strict CSP blocked ORT `blob:` factory and `guide.html` `robots.txt` audit
- Date: 15/11/2026
- Status: Fixed
- Symptom: ONNX Runtime WASM failed to import its `blob:` factory script under `script-src`, and Lighthouse failed `robots-txt` on `guide.html` with a CSP violation under `connect-src 'none'`.
- Reproduction: Load `Xenova/wavlm-base-plus-sv` on `index.html` or run Lighthouse SEO on `guide.html`.
- Root cause: ONNX Runtime loads a generated `blob:` factory module via `import()`, and Lighthouse checks `/robots.txt` under page CSP.
- Fix: Added `blob:` to `script-src` on `index.html` and changed `connect-src 'none'` to `connect-src 'self'` on `guide.html` and `404.html`. Re-tested with zero CSP violations and Lighthouse SEO `100`.

### BUG-003: Mobile layout shift on `guide.html` under Slow 4G
- Date: 15/11/2026
- Status: Fixed
- Symptom: Cold Slow 4G mobile trace on `guide.html` measured `CLS 0.14`, and Lighthouse mobile measured `CLS 0.065`.
- Reproduction: Reload `guide.html` on `375x812` viewport with cache disabled and `Slow 4G` plus `4x` CPU slowdown.
- Root cause: `font-display: swap` allowed fallback text to paint before `jost-latin.woff2` arrived.
- Fix: Added `rel="preload"` tags for both self-hosted WOFF2 fonts in `index.html` and `guide.html`, and switched `@font-face` rules in `design/tokens.css` to `font-display: optional`. Re-tested cold Slow 4G mobile CLS at `0.00`.
