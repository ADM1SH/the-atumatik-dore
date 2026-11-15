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

None.
