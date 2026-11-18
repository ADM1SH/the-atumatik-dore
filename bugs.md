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

### BUG-007: Fuel flap is not drawn
- Date: 18/11/2026
- Status: Open
- Symptom: The side view has no fuel flap. The plan said to draw it on the right side only.
- Root cause: Skipped during Phase 1. The Serdang photo shows a rounded rectangle on the right rear quarter, above the rear arch and behind the rear door. The left side has none.
- Fix: Draw the flap in a right-side-only group so the mirror toggle hides it.

### BUG-008: The Gen2 model is a rough schematic
- Date: 18/11/2026
- Status: Open
- Symptom: The side silhouette is a smoothed polyline. The glass, spoiler wedge, tail lamp, mirror, and door cut-outs are crude. The tailgate polygon crosses the rear quarter light, and the lamp moves with the tailgate. The tailgate lifts only 40 degrees. The top view is mostly inferred, and doors appear as thin strips.
- Root cause: The model came from pixel measurements of one 2007 drawing and three photos, with hand-built paths.
- Fix: Redraw with better curves and detail. See `argon_car_model_prompt.md`.

### BUG-009: The six boards are slightly stale
- Date: 18/11/2026
- Status: Open
- Symptom: The boards were captured before the panel countdown readout was added to `index.html` and before the last wording fixes in `guide.html`.
- Fix: Capture the six boards again after the model work.

### BUG-010: `ownerVerified` is always true and the page wiring has no automated test
- Date: 18/11/2026
- Status: Open
- Symptom: In `src/app.js` the `ownerVerified` constant is always `true`, because rejected speakers return earlier. The stranger-voice rule is tested only at module level in `tests/child-alert.test.js`. No test covers the DOM wiring in `src/app.js` (941 lines).
- Fix: Pass the real speaker result to the alert, and add a wiring test or a browser script.

### BUG-011: Enrolment sentences and some names still say "door"
- Date: 18/11/2026
- Status: Open
- Symptom: `ENROLMENT_SENTENCES` in `src/voiceprint.js` are door sentences (kept on purpose, because the enrolment flow is frozen). Variables such as `fsmRes` and the `doorState` wording in old docs remain.
- Fix: Ask Adam before any change to `src/voiceprint.js`. Rename `fsmRes` in `src/app.js`.

### BUG-012: Small leftovers
- Date: 18/11/2026
- Status: Open
- Symptom: The old key `atumatik_modeb_rules` stays unread in browsers that used the door demo. Mode B invalid replies carry no `target` field. `assets/og-share.png` has a short stray ground-line fragment at the right. `.claude/launch.json` is untracked and `.gitignore` does not list it. The event log table scrolls inside its own box at 375 px.
- Fix: Clean each item, or record the choice in `decisions.md`.

### BUG-014: Chime and alert limits on real devices
- Date: 18/11/2026
- Status: Open
- Symptom: The chime repeat comes from a timer that Chrome slows in a background tab. The audio context unlocks only on the first click or key press, and the page does not resume it later. No real device has tested sound.
- Fix: Resume the audio context when the alert starts, schedule the tone pairs with the audio clock, and test on a phone and on desktop Chrome.

### BUG-015: Spec deviations and unverified guide content
- Date: 18/11/2026
- Status: Open
- Symptom: The countdown readout sits under the banner in Car Model. The task put it in the Child Sensor panel, so the panel holds a plain copy without `role="timer"`. The guide marks three claims "not verified" (keyless methods, board input limits, radar remarks). The guide lists no presence radar module and one out-of-stock ESP32 board. Mode A has no synonyms such as "windows down". A voice command that the car refuses still answers the child alert (DEC-011).
- Fix: Adam decides each item. Verify or remove the guide claims. Re-check the Commons licences on the file pages, then decide on a credit line.

### BUG-013: Checks that never ran
- Date: 18/11/2026
- Status: Open
- Symptom: Real microphone voice commands, a stranger voice with an enrolled voiceprint, Mode B with a live Groq key, an audible chime on a real device, a real phone touch test, and Lighthouse on the live site after deployment did not run.
- Fix: Run them by hand (see `handoff.md`).

## Known Risks

0. **Car demo (18/11/2026):** The child alert is a demo and not a safety device. Reference photos have licences that are not re-checked on the file pages (CC BY-SA and CC BY), and the blueprint licence is unclear. The chime repeat can stutter in a background tab. BLE distance is a rough guess and a radar can miss a sleeping child (stated in the guide).

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
