# Product Requirements Document: The Atumatik DoRe

Last update: 18/11/2026.

## 1. Purpose

The Atumatik DoRe demonstrates a Proton Gen2 CPS (manual) car in a browser. The car has voice-controlled windows, a keyfob, a kick sensor for the doors, and a simulated child-in-car alert. No real hardware is controlled.
The target audience is a final year project group with no coding experience.
The site runs statically on GitHub Pages at `https://adm1sh.github.io/the-atumatik-dore/`.

## 2. Pages

The site contains two pages:
- `index.html`: Car model (side view and top-down view), voice control (Mode A and Mode B), speaker setup, car controls, and event log.
- `guide.html`: Concept guide that maps each demo feature to real hardware ideas, with safety limits.

## 3. Car State and Rules

The pure module `src/car.js` holds the engine, the lock, the keyfob carried flag, five doors (front left, front right, rear left, rear right, tailgate), and four window positions (0%, 50%, 100%).
Malaysia is right-hand drive. The driver window is front right. The passenger window is front left.
State changes at once. CSS animates the doors and windows. If the user enables `prefers-reduced-motion`, the animation time is 0.

| Action | Rule |
|---|---|
| `lock` | Refused while any door or the tailgate is open: "Close all doors first." |
| `unlock` | Clears the lock. |
| `window` | Works only when the engine is on or the keyfob is carried. Otherwise refused. |
| `kick` (open door) | Ignored with "Door already open". |
| `kick` (locked, no keyfob) | Ignored with "Locked: keyfob required". |
| `kick` (locked, keyfob carried) | Unlocks the whole car and opens the door. |
| `kick` (unlocked) | Opens the door. |
| `closeDoor` | Closes one door. Each door has a Close button. |
| Keyfob buttons | Always work. Windows down opens all windows. Windows up closes all. Lock is refused while a door is open. |

### Child Alert (Simulated)

The alert starts when all conditions are true: the engine is off, the car is locked, a child is set, the owner distance is above the alert distance, and the latest distance reading is greater than the one before it.
The alert shows a banner, a 60 second countdown, and a low-volume two-tone chime made with WebAudio.
A response stops the alert. The responses are: owner back within the alert distance, any keyfob button, an accepted voice command from the verified owner, and the Acknowledge button.
If nobody responds, every window below 50% moves to 50% and the chime continues until a response.
The alert cancels if the child is removed, the car is unlocked, or the engine starts.
After a response, the alert re-arms only when the owner comes back within the alert distance, or when the lock, the engine, or the child flag changes.
Demo only. This is not a child safety device.

## 4. Voice Input and Speaker Lock

Push-to-talk captures 16 kHz mono audio and runs `en-US` speech recognition while the user holds the button or `Space` key.
On release, the page checks clip length first and rejects clips shorter than 1.0 second as "too short".
Next, the page computes the cosine similarity score against the enrolled voiceprint in `localStorage`.
If the score is below the threshold, the page rejects the command and logs the event.
If the score meets or exceeds the threshold, the page sends the recognized text to the active mode.

Before any recording, the user reads a PDPA 2010 consent notice.
During voice setup, the user reads five fixed enrolment sentences.
The page extracts embeddings with `Xenova/wavlm-base-plus-sv` (quantized ONNX) via `@huggingface/transformers@4.3.2`.
The page loads the model only when the user opens voice setup or activates speaker verification.
Mode A and the manual car buttons work without downloading the model.
The page saves only the mean of the five normalized embeddings in `localStorage` and stores no audio.
The default threshold `0.78` is PROVISIONAL until the user tests with two real voices.
Users can adjust the threshold in the Log section, re-record, or delete the voiceprint with one click.

## 5. Control Modes

### Mode A (Coded Rules)

Mode A normalizes text to lowercase without punctuation and matches whole words.
The commands are `lock`, `unlock`, and window commands. A window command needs the word `window` or `windows`, one verb (`open`, `close`, `shut`, `half`, `halfway`), and one target (`driver`, `passenger`, `front left`, `front right`, `rear left`, `rear right`, `all`).
A bare `open` or `close`, two targets, or two actions in one sentence give "Not understood".
Mode A makes zero LLM or external AI API requests.
The page checks browser support for `processLocally` on `SpeechRecognition` and displays the result.

### Mode B (Groq AI Rules)

The user writes car rules in plain English in an editable textarea with a "Reset to example" button.
The user enters a personal Groq API key in a password field stored only in `localStorage`.
The system message combines fixed rules, user rules, the car state (engine, lock, keyfob carried, and window positions), and allowed actions. The prompt never carries the child sensor or the owner distance.
The user message wraps the spoken text inside delimiters and labels it as untrusted text.
The API request uses an 8-second timeout, runs one request at a time, and disables the talk button during flight.
Hand-written validation enforces JSON `{"action":"open|close|half|lock|unlock|deny|none","target":"front_left|front_right|rear_left|rear_right|all|none","reason":"max 80 characters"}`. A window action needs a window target. Other actions need target `none`.
The pure car module always validates the returned action.

## 6. Event Log

The event log stores records in memory only with a "Clear" button and an empty state.
Columns show time (`Asia/Kuala_Lumpur`, 24-hour), mode (Manual, Keyfob, Kick, Sensor, Mode A, Mode B), heard text, speaker status with score, action, and result.
Rejected voices appear with distinct row styling and explicit text labels.

## 7. Hardware Guide

`guide.html` is a concept guide. It maps each demo feature to a real hardware idea (voice brain, ESP32 bridge, keyfob distance, child presence radar). It lists parts with the date checked, a wiring caution, and an FAQ.
It states that real windows need anti-pinch protection, that a BLE signal gives a rough distance only, and that a radar can miss a sleeping child.
It makes no safety standard claim.

## 8. Out of Scope

- Direct USB, serial, Bluetooth, or Wi-Fi connection from this web page to real hardware.
- Backend servers, user accounts, databases, or cloud storage of audio.
- Non-English speech recognition or multi-speaker enrolment profiles.
- Offline fallback when Chrome cloud speech recognition cannot run locally.
- Safety certification of any kind. The child alert is a demo and not a safety device.
- Real car wiring. The guide never advises connection to airbags, CAN bus safety circuits, or the immobilizer.
