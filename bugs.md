# Bugs and Known Risks

Last update: 18/11/2026.

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

### BUG-004: Push-to-talk speech recognition resolved before button release
- Date: 15/11/2026
- Status: Fixed
- Symptom: Holding the push-to-talk button longer than `1.5` seconds caused `Not understood (no speech recognized).` even during clear speech.
- Reproduction: Hold Talk for more than `1.5` seconds, speak clearly, and release the button.
- Root cause: `src/audio.js` started a `1500` ms fallback timer inside `start()` instead of after `recognition.stop()`. It also blocked `recognition.start()` behind `getUserMedia`, stopped mic tracks before speech flush finished, and forced `sampleRate: 16000`.
- Fix: Moved the `1800` ms fallback wait into `stop()`, started recognition at once, and stopped mic tracks after speech ends. Removed hardware `sampleRate` lock, added error mapping in `src/app.js`, and added a regression test in `tests/mode-a.test.js`.

### BUG-005: Groq `openai/gpt-oss-20b` returned HTTP 400 under 120 max_tokens
- Date: 15/11/2026
- Status: Fixed
- Symptom: Mode B voice command failed with `Mode B error: Request failed (400)` while using `openai/gpt-oss-20b`.
- Reproduction: Enable Mode B with a valid Groq key, speak a door command, and trigger `callGroqModeB`.
- Root cause: `src/mode-b.js` sent `max_tokens: 120` without `reasoning_effort: "low"` on a reasoning model, causing Groq JSON generation truncation (`400`), and omitted the server error detail.
- Fix: Raised `max_tokens` to `512`, set `reasoning_effort: "low"` for `openai/gpt-oss-*` models, surfaced `400` error details in `mapGroqHttpError`, and added unit tests in `tests/mode-a.test.js`.

### BUG-006: Voice setup and model state looked lost after every reload or page change
- Date: 18/11/2026
- Status: Fixed
- Symptom: After a reload or a visit to `guide.html`, the five sentence rows showed "Pending", the consent box was empty, Talk was blocked, and the model progress text said "Downloading ... 97.0 MB".
- Reproduction: Enrol a voiceprint, reload `index.html`. Or capture two sentences and reload.
- Root cause: Four gaps in `src/app.js` and `src/voiceprint.js`. Partial enrolment lived only in memory. The rows ignored a saved voiceprint. The consent tick was not saved. `transformers.js` reports "progress" events for cache hits, so the UI labelled a cache read as a download. Live check on 18/11/2026: the model files were already in the `transformers-cache` Cache API entry and a reload sent zero requests to `huggingface.co`.
- Fix: Save partial enrolment (`atumatik_enrol_partial_v1`) and consent (`atumatik_pdpa_consent_v1`) in `localStorage`. Show a saved voiceprint as "Captured (saved)" and disable the record buttons. Label cache reads as "Loading ... from device cache". Load the model in the background only when it is already cached, a voiceprint exists, and consent is saved. Request persistent storage after a model load. Added `tests/voiceprint-storage.test.js` (8 tests, failing before the fix, `25/25` pass after).
