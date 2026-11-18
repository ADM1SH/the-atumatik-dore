# System Architecture: The Atumatik DoRe

Last update: 18/11/2026.

## 1. End-to-End Voice Control Flow

```text
User holds Talk button or Space key
  -> src/audio.js records 16 kHz mono PCM + runs webkitSpeechRecognition (en-US)
User releases Talk button or Space key
  -> Clip duration < 1.0 s -> Reject ("Too short") and log
  -> If voiceprint exists in localStorage:
       src/voiceprint.js extracts embedding via Xenova/wavlm-base-plus-sv (q8)
       Computes cosine similarity against stored mean embedding
       Score < threshold -> Reject speaker and log (car unchanged)
  -> Mode A (coded): src/mode-a.js matches lock, unlock, or one window command with one target (0 API calls)
  -> Mode B (AI): src/mode-b.js sends rules + car state + delimited transcript to Groq
       Validates JSON response with hand-written parser
  -> Accepted voice command also answers an active child alert (src/child-alert.js)
  -> src/car.js applies the action against the car rules
  -> src/app.js sets CSS variables on the two SVGs, updates aria-live text, and writes the Asia/Kuala_Lumpur log
```

## 2. Module Responsibilities

| File | Role | Dependencies |
|---|---|---|
| `src/car.js` | Pure car state and rules (engine, lock, keyfob, doors, windows, kick, keyfob buttons, internal `ventilate`) | None |
| `src/child-alert.js` | Pure simulated child alert with injected `now`, `schedule`, and `cancelSchedule` | `src/car.js` interface |
| `src/chime.js` | Two-tone WebAudio chime with injected context factory | Web Audio API |
| `src/mode-a.js` | Pure lowercase normalizer and whole-word window and lock matcher | None |
| `src/mode-b.js` | Prompt builder, `/openai/v1/models` lookup, Groq `chat/completions` caller, strict JSON validator | Browser `fetch` |
| `src/voiceprint.js` | Lazy loader for `@huggingface/transformers@4.3.2`, embedding extractor, L2 normalization, cosine similarity | jsDelivr CDN + Hugging Face Hub |
| `src/audio.js` | Browser support detection, `processLocally` check, 16 kHz mono recorder, `webkitSpeechRecognition` | Web Audio API + Web Speech API |
| `src/app.js` | DOM wiring, push-to-talk lifecycle, enrolment controller, `localStorage` keys, MYT event log | All `src/` modules |

## 3. Data Storage and Persistence

| Data Item | Storage Location | Lifecycle |
|---|---|---|
| Groq API key | `localStorage["atumatik_groq_key"]` | Saved until user clicks "Forget key" |
| Enrolled voiceprint (mean Float32 array of 5 embeddings) | `localStorage["atumatik_voiceprint_v1"]` | Saved until user clicks "Delete my voiceprint" or "Record again" |
| Custom Mode B rules | `localStorage["atumatik_modeb_rules_v2"]` | Saved locally. "Reset to example" restores default rules. The old key `atumatik_modeb_rules` stays unread. |
| Car state, child sensor, owner distance, keyfob state | JavaScript memory | Never saved. Reset on page reload. |
| Cosine threshold value | `localStorage["atumatik_vp_threshold"]` | Default `0.78` (PROVISIONAL) |
| Quantized ONNX model files (`97.03 MB`) | Browser Cache API / IndexedDB (managed by transformers.js) | Cached after first download |
| Event log entries | JavaScript memory array | Cleared on page reload or "Clear" button click |
| Raw microphone audio | Short-lived JavaScript `Float32Array` | Discarded immediately after embedding computation |
