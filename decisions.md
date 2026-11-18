# Architecture and Project Decisions

Last update: 18/11/2026.

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

### DEC-010: Per-Device Persistence of Voice Setup
- Date: 18/11/2026
- Choice: Save the PDPA consent record, unfinished enrolment vectors, and the enrolled voiceprint in `localStorage`. Keep the voice model files in the browser Cache API (`transformers-cache`). After a reload, load the model in the background only when the model file is already cached, a voiceprint exists, and consent is saved. Never start the 97 MB download without a user click. Request persistent storage with `navigator.storage.persist()` after a model load.
- Reason: Adam had to repeat enrolment and consent after every reload. Browser storage is per browser profile and per device, which matches the request. Unticking the consent box removes the consent record. "Delete my voiceprint" removes the voiceprint and unfinished vectors but keeps consent, so "Re-record" does not ask for consent again.
- Limit: Private windows and "clear site data" erase everything. Chrome can deny `persist()`, and it did on a fresh `localhost` profile on 18/11/2026.

### DEC-011: Replace the Sliding Door with a Proton Gen2 CPS Car Demo
- Date: 18/11/2026
- Choice: Remove the sliding door simulation. Build a manual Proton Gen2 CPS (5-door hatchback, black body, bronze rims) as two inline SVG views (side and top-down) driven by one shared state. Add voice-controlled windows, a keyfob, a kick sensor for doors, and a simulated child-in-car alert. This supersedes the sliding door scope in earlier entries. Earlier entries stay as history.
- Reason: Adam asked for the change. The pure module `src/car.js` replaces `src/door-fsm.js`. Only the `{ ok, reason }` result shape and the no-DOM rule carried over.
- Rules decided: A voice command counts as a response to the child alert when the speaker is verified (or no voiceprint exists) and the command is recognized, even if the car refuses it. After a response, the alert re-arms only when the owner is back within the limit or the lock, engine, or child flag changes. The keyfob carried toggle is not a response. The Mode B rules key is `atumatik_modeb_rules_v2`.

### DEC-012: Car Model Sources, Scale, and Look
- Date: 18/11/2026
- Scale: 1 SVG unit is 10 mm in both views. Dimensions of the Gen2 1.6 CPS come from encycarpedia.com (`08-gen-2-1-6-cps-hatch`). Length is 4,310 mm, width is 1,725 mm, height is 1,435 mm, wheelbase is 2,600 mm, front track is 1,475 mm, rear track is 1,470 mm, and tyre size is 195/55 R15. Ground clearance 150 mm and rim 15 x 6.5 in come from pages that do not name the CPS and are approximate.
- Look: pre-facelift silhouette with the rear spoiler. The spoiler appears on pre-facelift cars in the reference photos, so it is not a facelift marker. A black roof cannot show on a black body. The label says "Proton Gen2 CPS (manual)" with no engine or gearbox claim, because no source was cited for them.
- Measurements from the reference drawing (pixel scan, not copied): the 2007 side drawing is squashed vertically by about 1.10 and tilted about 1 degree. Wheelbase over length matches the spec at 0.603. The 2005 top plan is 16% too long for the 5-door body, so the plan view uses the spec size and takes shape ideas only. The front and rear overhang split (about 877 mm and 828 mm) comes from the drawing.
- Inferred: the rear shape, the tailgate, the fuel flap (right side only, seen in the Serdang photo), and the whole top view.
- References (private tracing material, never committed): Wikimedia Commons photos by User:Two hundred percent (CC BY-SA), Vauxford (CC BY-SA 4.0), and Simon Yeo (CC BY 2.0). Licences are not yet re-checked on the file pages. The blueprint GIFs have an unclear licence. The SVG paths are built by hand from measured points. There is no auto-trace.

### DEC-013: Proton Gen2 CPS Model v2 (Branch `feat/gen2-model-v2`)
- Date: 18/11/2026
- Choice: Redraw `#car-side` (`viewBox="0 -26 480 216"`) and `#car-top` (`viewBox="0 0 480 370"`) with cubic Beziers at 1 SVG unit per 10 mm. Move the fuel flap and lock cylinder into `<g class="car-right-only">` hidden by `.is-mirrored`. Hinge `.side-tailgate` at the roof (`96px 42px`, `48 deg`) to clear the rounded-D quarter glass. Keep the 3-lens tail lamp fixed on the body. Draw 5-split-spoke bronze rims, curved top-down greenhouse glass, and open-door stroke outlines.
- Reason: Resolves BUG-007 and BUG-008 while keeping both views on the exact `480` unit horizontal scale and driving all animations through CSS variables in `renderCar`. The 4-corner wheel rim geometry and open-aperture contrast stay readable in both light and dark themes under strict CSP (`style-src 'self'`).
- Assets: Re-rendered `assets/favicon.svg`, `assets/og-share.png` (without the stray ground-line fragment), and all six boards in `design/boards/` (`1440 px` desktop, `375 px` mobile, true `light` and `dark` themes).

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
