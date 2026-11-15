# Testing Checklist: The Atumatik DoRe

Last update: 15/11/2026.

## 1. Automated Unit Tests (`node --test`)

- [ ] `open` transitions from `CLOSED` (unlocked) to `OPENING`.
- [ ] `open` transitions from `CLOSING` to `OPENING`.
- [ ] `open` fails with "Door is locked." when `locked` is true.
- [ ] `close` transitions from `OPEN` or `HOLD` to `CLOSING`.
- [ ] `hold` transitions from `OPEN` or `OPENING` to `HOLD` and clears auto-close timer.
- [ ] `release` transitions from `HOLD` to `OPEN` and restarts 5-second auto-close timer.
- [ ] `lock` succeeds only in `CLOSED` and fails with "Close the door first." in other states.
- [ ] `unlock` clears the `locked` flag in `CLOSED`.
- [ ] `obstacle` during `CLOSING` transitions to `OPENING` and logs "Obstacle".
- [ ] `obstacle` in non-closing states keeps current state and logs "Obstacle".
- [ ] `auto-close` transitions from `OPEN` to `CLOSING` after 5 seconds.
- [ ] `reducedMotion` completes state transitions immediately without waiting 2 seconds.
- [ ] Mode A normalizes case and punctuation and matches whole words only.
- [ ] Mode A rejects unknown words with "Not understood".
- [ ] Mode B prompt builder wraps speech in delimiters and includes rules and door state.
- [ ] Mode B JSON validator rejects malformed payloads, invalid actions, and long reasons.

## 2. Browser and Section 15 Checks

- [ ] Unsupported browser banner displays clearly on Firefox or Safari user agents.
- [ ] Microphone denied displays clear instructions to enable microphone permission.
- [ ] Mode A triggers zero network requests to `api.groq.com`.
- [ ] Mode B rejects empty API key before sending any request.
- [ ] Mode B surfaces "Key rejected" on HTTP `401`.
- [ ] Mode B surfaces "Limit reached, wait and try again" on HTTP `429`.
- [ ] Mode B surfaces "Offline" on network failure and "Groq is not available" on HTTP `5xx`.
- [ ] Lazy model load fetches `Xenova/wavlm-base-plus-sv` quantized ONNX (`96.97 MB`) under active CSP with zero CSP errors.
- [ ] Synthetic two-voice smoke test confirms pipeline execution and distinct scores for two different synthetic voices.
- [ ] Layout at `375 px` width produces zero horizontal scroll on `index.html` and `guide.html`.
- [ ] Dark mode meets `4.5:1` minimum text contrast on both pages.
- [ ] Talk button operates cleanly via keyboard (`Space` hold and release, plus `Tab` focus rings).
- [ ] Repository scan reports zero em dashes, zero secrets, zero local paths, and zero real emails.
- [ ] Lighthouse audits run on `index.html` and `guide.html` with model unloaded.
- [ ] Live URL `https://adm1sh.github.io/the-atumatik-dore/` loads cleanly after Pages deployment.
