# Testing Checklist: The Atumatik DoRe

Last update: 18/11/2026.

## 1. Automated Unit Tests (`node --test`)

All 25 automated unit tests in `tests/door-fsm.test.js`, `tests/mode-a.test.js`, and `tests/voiceprint-storage.test.js` passed (`0` failed) under Node `v26.11.1`.

- [x] `open` transitions from `CLOSED` (unlocked) to `OPENING`.
- [x] `open` transitions from `CLOSING` to `OPENING`.
- [x] `open` fails with `"Door is locked."` when `locked` is true.
- [x] `close` transitions from `OPEN` or `HOLD` to `CLOSING`.
- [x] `hold` transitions from `OPEN` or `OPENING` to `HOLD` and clears auto-close timer.
- [x] `release` transitions from `HOLD` to `OPEN` and restarts 5-second auto-close timer.
- [x] `lock` succeeds only in `CLOSED` and fails with `"Close the door first."` in other states.
- [x] `unlock` clears the `locked` flag in `CLOSED`.
- [x] `obstacle` during `CLOSING` transitions to `OPENING` and logs `"Obstacle"`.
- [x] `obstacle` in non-closing states keeps current state and logs `"Obstacle"`.
- [x] `auto-close` transitions from `OPEN` to `CLOSING` after 5 seconds.
- [x] `reducedMotion` changes state at once without waiting 2 seconds.
- [x] Mode A normalizes case and punctuation and matches whole words only.
- [x] Mode A rejects unknown words with `"Not understood"`.
- [x] Mode B prompt builder wraps speech in delimiters and includes rules and door state.
- [x] Mode B JSON validator rejects malformed payloads, invalid actions, and long reasons.

## 2. Browser and Section 15 Checks

- [x] Unsupported browser banner displays clearly on Firefox 132 and Safari 17 user agents.
- [x] Microphone denied displays clear instructions to enable microphone permission (`NotAllowedError` verified).
- [x] Mode A triggers zero network requests to `api.groq.com`.
- [x] Mode B rejects empty API key before sending any request (`"No Groq API key saved"`, unit and Chrome tested).
- [x] Mode B surfaces `"Key rejected"` on HTTP `401` (live `api.groq.com/openai/v1/models` tested, plus unit test).
- [x] Mode B surfaces `"Limit reached, wait and try again"` on HTTP `429` (`tests/mode-a.test.js` unit tested).
- [x] Mode B surfaces `"Offline"` on network failure and `"Groq is not available"` on HTTP `5xx` (`tests/mode-a.test.js` unit tested).
- [x] Lazy model load fetches `Xenova/wavlm-base-plus-sv` quantized ONNX under active CSP with zero CSP errors.
- [x] Synthetic two-voice smoke test confirms pipeline execution (`0.8503` same synthetic voice vs `0.6800` second synthetic voice, `"synthetic, not an accuracy result"`).
- [x] Layout at `375 px` width produces zero horizontal scroll on `index.html`, `guide.html`, and `404.html`.
- [x] Dark mode meets `4.5:1` minimum text contrast on `index.html` (`5.92:1` min) and `guide.html` (`6.85:1` min).
- [x] Talk button triggers push-to-talk via keyboard `Space` key and pointer press in Chrome.
- [x] Repository scan reports zero em dashes, zero en dashes, zero secrets, zero local paths, and zero real emails.
- [x] Lighthouse v13.6.0 audits score `100` in Accessibility, Best Practices, SEO, and Agentic Browsing on `index.html` and `guide.html` with model unloaded.
- [ ] Live human calibration: Adam records his live voice and a friend's live voice to confirm final threshold above or below PROVISIONAL `0.78`.
- [x] Live URL `https://adm1sh.github.io/the-atumatik-dore/` loads cleanly after Argon Step 7 review and Step 10.6 Pages deployment.

## 3. Saved State per Device (BUG-006, 18/11/2026)

- [x] Enrolment progress, consent, and model cache helpers pass 8 unit tests in `tests/voiceprint-storage.test.js`.
- [x] Reload on `localhost` keeps consent, shows five "Captured (saved)" rows with disabled record buttons, and loads the cached model with zero `huggingface.co` requests and zero console errors (browser pane, seeded voiceprint).
- [x] "Delete my voiceprint" re-enables the record buttons and keeps consent.
- [x] Two seeded partial vectors survive a visit to `guide.html` and back.
- [ ] Live device check: Adam enrols 2 sentences, reloads, records the other 3, and reloads again on desktop Chrome and on Android Chrome.
- [ ] Live microphone check of the fifth sentence: the rows re-render as saved and the record buttons become disabled.
