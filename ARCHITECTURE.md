# System Architecture: The Atumatik DoRe

Last update: 15/11/2026.

## 1. End-to-End Voice Control Flow

```text
User holds Talk button or Space key
  -> src/audio.js records 16 kHz mono PCM + runs webkitSpeechRecognition (en-US)
User releases Talk button or Space key
  -> Clip duration < 1.0 s -> Reject ("Too short") and log
  -> If voiceprint exists in localStorage:
       src/voiceprint.js extracts embedding via Xenova/wavlm-base-plus-sv (q8)
       Computes cosine similarity against stored mean embedding
       Score < threshold -> Reject speaker and log (door state unchanged)
  -> Mode A (coded): src/mode-a.js normalizes text and checks command table (0 API calls)
  -> Mode B (AI): src/mode-b.js sends rules + door state + delimited transcript to Groq
       Validates JSON response with hand-written parser
  -> src/door-fsm.js applies action against door state rules
  -> src/app.js updates animated panels, aria-live text, and Asia/Kuala_Lumpur log
```

## 2. Module Responsibilities

| File | Role | Dependencies |
|---|---|---|
| `src/door-fsm.js` | Pure state machine (`CLOSED`, `OPENING`, `OPEN`, `HOLD`, `CLOSING`, `locked`, 5s auto-close) | None |
| `src/mode-a.js` | Pure lowercase normalizer and whole-word command matcher | None |
| `src/mode-b.js` | Prompt builder, `/openai/v1/models` lookup, Groq `chat/completions` caller, strict JSON validator | Browser `fetch` |
| `src/voiceprint.js` | Lazy loader for `@huggingface/transformers@4.3.2`, embedding extractor, L2 normalization, cosine similarity | jsDelivr CDN + Hugging Face Hub |
| `src/audio.js` | Browser support detection, `processLocally` check, 16 kHz mono recorder, `webkitSpeechRecognition` | Web Audio API + Web Speech API |
| `src/app.js` | DOM wiring, push-to-talk lifecycle, enrolment controller, `localStorage` keys, MYT event log | All `src/` modules |

## 3. Data Storage and Persistence

| Data Item | Storage Location | Lifecycle |
|---|---|---|
| Groq API key | `localStorage["atumatik_groq_key"]` | Saved until user clicks "Forget key" |
| Enrolled voiceprint (mean Float32 array of 5 embeddings) | `localStorage["atumatik_voiceprint_v1"]` | Saved until user clicks "Delete my voiceprint" or "Record again" |
| Custom Mode B rules | `localStorage["atumatik_modeb_rules"]` | Saved locally. "Reset to example" restores default rules. |
| Cosine threshold value | `localStorage["atumatik_vp_threshold"]` | Default `0.78` (PROVISIONAL) |
| Quantized ONNX model files (`97.03 MB`) | Browser Cache API / IndexedDB (managed by transformers.js) | Cached after first download |
| Event log entries | JavaScript memory array | Cleared on page reload or "Clear" button click |
| Raw microphone audio | Short-lived JavaScript `Float32Array` | Discarded immediately after embedding computation |
