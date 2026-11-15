# Architecture and Project Decisions

Last update: 15/11/2026.

## Numbered Decisions

### DEC-001: Public GitHub Repository for GitHub Pages
- Date: 15/11/2026
- Choice: Host the project in public repository `ADM1SH/the-atumatik-dore`.
- Reason: Free GitHub Pages requires a public repository on standard free accounts.
- Constraint: No secrets, no personal data, no real email addresses, and no local filesystem paths can enter the repository.

### DEC-002: Static Stack with Zero Build Step
- Date: 15/11/2026
- Choice: Use plain HTML5, CSS, and native browser ES modules.
- Reason: A non-coding student group can read, open, and deploy files directly on GitHub Pages without Node build tools.

### DEC-003: Browser-Direct Groq API with Personal User Keys
- Date: 15/11/2026
- Choice: Send Mode B chat completion requests from the browser directly to `https://api.groq.com/openai/v1/chat/completions`.
- Reason: CORS preflight test on 15/11/2026 returned HTTP `204` with `access-control-allow-origin: *`. Users paste their own temporary Groq key into `localStorage`, so the repository holds zero credentials.

### DEC-004: Groq Model Discovery and Fallback ID
- Date: 15/11/2026
- Choice: Query `GET https://api.groq.com/openai/v1/models` after saving a key and select the first fast JSON model in priority order (`openai/gpt-oss-20b`, `llama-3.1-8b-instant`, `qwen/qwen3.8-27b`, `openai/gpt-oss-120b`, `llama-3.3-70b-versatile`). If `/openai/v1/models` fails or yields none of these, use hard-coded fallback `openai/gpt-oss-20b`.
- Reason: Live Groq documentation on 15/11/2026 confirms `openai/gpt-oss-20b` is active on the Free Plan (`30 RPM`, `1,000 RPD`, `8,000 TPM`) and supports strict JSON schema output.

### DEC-005: Client-Side Speaker Verification Model
- Date: 15/11/2026
- Choice: Use `Xenova/wavlm-base-plus-sv` (quantized ONNX, task `audio-xvector`) via `@huggingface/transformers@4.3.2` loaded lazily from `https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2/dist/transformers.min.js`.
- Reason: Live Hugging Face file inspection on 15/11/2026 measured `onnx/model_quantized.onnx` at `96.97 MB` (`101,683,453` bytes, or `97.03 MB` with JSON configs). This stays below `150 MB`. Using `transformers.min.js` (`587,917` bytes) bundles `onnxruntime-web` directly and avoids external bare specifier resolution errors found in `transformers.web.js`. Lazy loading preserves fast page load for Mode A.

### DEC-006: Voiceprint Enrolment Method and PROVISIONAL Threshold
- Date: 15/11/2026
- Choice: Record five door sentences at 16 kHz mono and compute L2-normalized embeddings. Average and L2-normalize the mean vector, then score new clips with cosine similarity. Set the initial default threshold to `0.78 (PROVISIONAL)` with a live slider from `0.50` to `0.95`.
- Reason: Averaging five short door commands reduces single-utterance variance in browser speech clips. The `0.78` value is PROVISIONAL until Adam tests his own live voice against a friend's live voice.

### DEC-007: Self-Hosted Fonts and Bauhaus-Rams Palette
- Date: 15/11/2026
- Choice: Self-host `Jost` and `IBM Plex Mono` as latin WOFF2 subsets under Open Font License (`OFL.txt`).
- Reason: Self-hosting avoids external Google Fonts requests under strict CSP and ensures consistent typography without Inter or AI slop tropes.

### DEC-008: Multi-AI File Split (`GEMINI.md` + `gemini_task.md`)
- Date: 15/11/2026
- Choice: Marked `N/A` for separate `gemini_task.md` file.
- Reason: This repository uses `GEMINI.md` and `implementation_plan.md` to track Argon (planning and review) and Hydrogen (implementation) phases in one source of truth.

### DEC-009: Raspberry Pi 4B 4 GB Hardware Recommendation
- Date: 15/11/2026
- Choice: Recommend Raspberry Pi 4 Model B (4 GB) paired with a dry-contact relay or ESP32 Wi-Fi bridge in `guide.html`.
- Reason: Cytron Malaysia (`RM438.20` board) and Mybotic (`RM490.00` kit) verified 15/11/2026 prices offer sufficient RAM for local voice processing. Pi Zero 2 W (`512 MB` RAM) lacks headroom, while Pi 5 kits cost more.

## Synthetic Two-Voice Smoke Test Results

Status: Executed on 15/11/2026 at 14:01 Asia/Kuala_Lumpur in headless Chrome WASM (`Xenova/wavlm-base-plus-sv` quantized `q8`, `512` normalized dimensions).

| Test Case | Cosine Similarity Score | Label |
|---|---|---|
| Synthetic voice 1 test clip against synthetic voice 1 mean (`5` clips) | `0.8503` | synthetic, not an accuracy result |
| Synthetic voice 2 test clip against synthetic voice 1 mean (`5` clips) | `0.6800` | synthetic, not an accuracy result |

- Default threshold note: Default `0.78` stays `PROVISIONAL`. Do not calibrate the final threshold from synthetic audio. Set the final threshold only after Adam tests live audio from two human speakers.
- Browser state note: `deleteVoiceprint()` and `localStorage.clear()` removed all temporary smoke-test entries after the run.

## Open Questions

1. Live voice calibration: Record Adam's accepted scores and one friend's rejected scores to finalize the default threshold after deployment.
2. Live Android Chrome and Edge check: Confirm hardware push-to-talk timing on a physical Android phone.
