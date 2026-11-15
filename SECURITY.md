# Security and Privacy Specification

Last update: 15/11/2026.

## 1. Groq API Key Handling

- The repository never holds any API key, token, or credential.
- The user enters a personal Groq key into `<input type="password">` on `index.html`.
- The key is stored only in that browser under `localStorage["atumatik_groq_key"]` and sent only to `https://api.groq.com/openai/v1/`.
- The user can remove the key at any time with the "Forget key" button.
- The UI instructs users to create a temporary key for this demo at `https://console.groq.com/keys` and delete it afterward.
- The UI warns users that anyone with access to the same browser profile can read `localStorage`.
- Code never logs the API key and never places it in query parameters.

## 2. Voice Data and PDPA 2010 (Malaysia) Compliance Notice

- Under PDPA 2010 (Malaysia), biometric voice data counts as personal data.
- Before any microphone capture, the page displays an explicit consent box.
- The page converts microphone audio into a numeric vector (`Float32Array`) and discards the raw audio immediately.
- Only the mean of the five normalized embeddings is saved in `localStorage["atumatik_voiceprint_v1"]`.
- One click on "Delete my voiceprint" wipes the stored vector from `localStorage`.
- The consent notice states two external transmissions.
- Chrome `webkitSpeechRecognition` sends audio to Google servers unless local recognition is active.
- Mode B sends recognized text (never audio) to Groq.
- Demo limitation: A voice recording or a similar-sounding speaker can pass the voiceprint check. This feature demonstrates speaker verification concepts and does not provide physical security.

## 3. Content Security Policy (CSP) and GitHub Pages Limits

- GitHub Pages serves static files without custom HTTP security response headers.
- Therefore, this project does NOT claim server-delivered `HSTS`, `X-Frame-Options`, or `X-Content-Type-Options` headers.
- Instead, `index.html`, `guide.html`, and `404.html` enforce `<meta http-equiv="Content-Security-Policy">` tags.
- `index.html` sets `default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self' https://cdn.jsdelivr.net blob: 'wasm-unsafe-eval'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self' https://cdn.jsdelivr.net https://huggingface.co https://us.aws.cdn.hf.co https://api.groq.com; worker-src 'self' blob:;`.
- `guide.html` and `404.html` set `default-src 'self'; base-uri 'self'; object-src 'none'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data:; connect-src 'self';`.
- Live Chrome checks confirmed `'wasm-unsafe-eval'` and `blob:` in `script-src` enable ONNX Runtime WASM loading on `index.html`.
- Setting `connect-src 'self'` on `guide.html` and `404.html` permits same-origin `robots.txt` checks without allowing external hosts.
- `object-src 'none'` and `base-uri 'self'` block plugin and base-tag hijacking.

## 4. Supply-Chain Risk Disclosure

- The single third-party package is `@huggingface/transformers` pinned to exact version `4.3.2` on jsDelivr.
- Loading code from a third-party CDN introduces supply-chain risk because the script runs in the page origin where `localStorage` lives.
- Mitigation: Pin the exact package version (`4.3.2`). Load the script only when the user opens Voice Setup or speaker verification. Load zero other third-party scripts.

## 5. Prompt Injection Defense in Mode B

- Mode B wraps spoken transcripts inside `<untrusted_speech>` delimiters and labels the speech as untrusted user data in the user prompt.
- Hand-written JSON validation rejects non-JSON output, unknown action strings, and overly long reasons.
- `src/door-fsm.js` enforces all physical door state rules regardless of AI output (`open` fails when `locked`, and `lock` fails when not `CLOSED`).
