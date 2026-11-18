# Testing Checklist: The Atumatik DoRe

Last update: 18/11/2026 (car demo).

## 1. Automated Unit Tests (`node --test`)

All 49 automated unit tests in `tests/car.test.js` (16), `tests/child-alert.test.js` (10), `tests/chime.test.js` (2), `tests/mode-a.test.js` (13), and `tests/voiceprint-storage.test.js` (8) passed (`0` failed) under Node `v26.11.1`.
The old `tests/door-fsm.test.js` (7 tests) was removed with the door. The door-specific cases of `tests/mode-a.test.js` were replaced.

- [x] Lock is refused while any door or the tailgate is open ("Close all doors first.") and works once all are closed.
- [x] Kick opens a door, Close closes it, and a repeat kick says "Door already open".
- [x] Kick on a locked car without the keyfob says "Locked: keyfob required". With the keyfob it unlocks the whole car and opens the door (all five doors).
- [x] Window commands are refused with the engine off and no keyfob, and work with either. Positions are 0, 50, or 100.
- [x] Keyfob windows down and up always work. Keyfob lock is refused with a door open.
- [x] `ventilate` raises windows below 50% to 50%, leaves wider windows, and ignores the window rule.
- [x] Child alert: needs every start condition. 59 s moves no windows. 60 s moves windows below 50% to 50% and leaves wider ones. A late tick still fires at the deadline.
- [x] Child alert: acknowledge, keyfob button, verified voice, and owner back within the limit each stop it. A stranger voice does not.
- [x] Child alert: child removed, car unlocked, and engine started each cancel it. Re-arm rules hold.
- [x] Chime stays silent until a user gesture unlocks audio. The Sound toggle off keeps it silent.
- [x] Mode A matches lock, unlock, and window commands with one target, and rejects bare `open`, no target, two targets, and two actions. Mode A never calls `fetch`.
- [x] Mode B prompt wraps speech in delimiters, carries the car state, and omits the child sensor and distance. The validator enforces action and target pairs.

## 2. Browser and Section 15 Checks

- [x] Unsupported browser banner displays clearly on Firefox 132 and Safari 17 user agents.
- [x] Microphone denied displays clear instructions to enable microphone permission (`NotAllowedError` verified).
- [x] Mode A triggers zero network requests to `api.groq.com` (unit test with a throwing `fetch`).
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
- [x] Lighthouse v13.6.0 audits score `100` in Accessibility, Best Practices, SEO, and Agentic Browsing on `index.html` (60 audits pass) and `guide.html` (57 pass), mobile and desktop, on `localhost` (18/11/2026). The live site before the change scored `100` (57 and 56 audits pass).
- [ ] Live human calibration: Adam records his live voice and a friend's live voice to confirm final threshold above or below PROVISIONAL `0.78`.
- [x] Live URL `https://adm1sh.github.io/the-atumatik-dore/` loads cleanly after Argon Step 7 review and Step 10.6 Pages deployment.

## 3. Saved State per Device (BUG-006, 18/11/2026)

- [x] Enrolment progress, consent, and model cache helpers pass 8 unit tests in `tests/voiceprint-storage.test.js`.
- [x] Reload on `localhost` keeps consent, shows five "Captured (saved)" rows with disabled record buttons, and loads the cached model with zero `huggingface.co` requests and zero console errors (browser pane, seeded voiceprint).
- [x] "Delete my voiceprint" re-enables the record buttons and keeps consent.
- [x] Two seeded partial vectors survive a visit to `guide.html` and back.
- [ ] Live device check: Adam enrols 2 sentences, reloads, records the other 3, and reloads again on desktop Chrome and on Android Chrome.
- [ ] Live microphone check of the fifth sentence: the rows re-render as saved and the record buttons become disabled.

## 4. Car Demo Browser Checks (18/11/2026, `localhost`)

- [x] Interactive rules passed in Chrome (`localhost:8768`, Model v2): window refused with engine off and no keyfob. Lock refused while a door is open. Kick tests passed for open, duplicate, locked without keyfob, and locked with keyfob. Keyfob lock, unlock, windows down, and windows up passed. Mirror toggle hid the right-side fuel flap and lock cylinder.
- [x] Child alert real-time 60 s run passed in Chrome: started with windows `0, 100, 50, 0`. At 58 s windows read `0, 100, 50, 0`. At 61.5 s windows moved to `50, 100, 50, 50` with the engine off and no keyfob.
- [x] Zero console errors on `index.html`, `guide.html`, and `404.html`. The CSP stays strict with zero inline styles and zero extra scripts.
- [x] At 375 px and 1440 px no page overflows horizontally except `.table-wrap` on `index.html`. Kick zones stay `44 x 44 px` with at least 13 px gap.
- [x] Contrast (WCAG formula, both themes): outline vs panel `15.67:1` or higher. Glass vs body `7.22:1`. Open cabin vs glass `4.10:1`. Rim vs tyre `5.22:1` or higher. Door line vs body `5.40:1`. Tail lamp vs body `3.27:1` or higher. Text meets `8.57:1` or higher.
- [x] Under `prefers-reduced-motion: reduce`, transition duration on all six animated model classes is `0s`.
- [x] BUG-006 restore passed after Model v2 with seeded voiceprint and consent. The page showed checked consent, five "Captured (saved)" rows, disabled record buttons, zero console errors, and zero `huggingface.co` requests. Storage was cleaned afterward.
- [ ] Not run: real microphone voice commands and a stranger voice with an enrolled voiceprint. Mode B with a live Groq key, an audible device chime, a real phone touch test, and post-Model-v2 Lighthouse also did not run.
