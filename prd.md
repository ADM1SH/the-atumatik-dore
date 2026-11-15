# Product Requirements Document: The Atumatik DoRe

Last update: 15/11/2026.

## 1. Purpose

The Atumatik DoRe demonstrates a voice-controlled automatic sliding door in a browser.
The target audience is a final year project group with no coding experience.
The site runs statically on GitHub Pages at `https://adm1sh.github.io/the-atumatik-dore/`.

## 2. Pages

The site contains two pages:
- `index.html`: Door animation, voice control (Mode A and Mode B), speaker setup, and event log.
- `guide.html`: Real-world hardware guide for ESP32 and Raspberry Pi builds.

## 3. Door State Machine

The sliding door uses two animated panels and five states: `CLOSED`, `OPENING`, `OPEN`, `HOLD`, and `CLOSING`.
A `locked` flag exists only when the door state is `CLOSED`.

| Action | Rule |
|---|---|
| `open` | If state is `CLOSED` (unlocked) or `CLOSING`, move to `OPENING`. If locked, deny with "Door is locked." |
| `close` | If state is `OPEN` or `HOLD`, move to `CLOSING`. |
| `hold` | If state is `OPEN` or `OPENING`, move to `HOLD` and cancel auto-close. |
| `release` | If state is `HOLD`, move to `OPEN` and restart the 5-second timer. |
| `lock` | If state is `CLOSED`, set `locked` to true. Otherwise deny with "Close the door first." |
| `unlock` | Clear the `locked` flag. |
| `obstacle` | If state is `CLOSING`, move to `OPENING` and log "Obstacle". Otherwise log "Obstacle" only. |
| `auto-close` | After 5 seconds in `OPEN`, move to `CLOSING`. |

Each door transition animation takes 2 seconds.
If the user enables `prefers-reduced-motion`, change state immediately and display the state as text.
Announce state changes with `aria-live="polite"`.

## 4. Voice Input and Speaker Lock

Push-to-talk captures 16 kHz mono audio and runs `en-US` speech recognition while the user holds the button or `Space` key.
On release, the page checks clip length first and rejects clips shorter than 1.0 second as "too short".
Next, the page computes the cosine similarity score against the enrolled voiceprint in `localStorage`.
If the score is below the threshold, the page rejects the command and logs the event.
If the score meets or exceeds the threshold, the page sends the recognized text to the active mode.

Before any recording, the user reads a PDPA 2010 consent notice.
During voice setup, the user reads five door sentences.
The page extracts embeddings with `Xenova/wavlm-base-plus-sv` (quantized ONNX) via `@huggingface/transformers@4.3.2`.
The page loads the model only when the user opens voice setup or activates speaker verification.
Mode A and manual door buttons work without downloading the model.
The page saves only the mean of the five normalized embeddings in `localStorage` and stores no audio.
The default threshold `0.78` is PROVISIONAL until the user tests with two real voices.
Users can adjust the threshold in the Log section, re-record, or delete the voiceprint with one click.

## 5. Control Modes

### Mode A (Coded Rules)

Mode A normalizes text to lowercase without punctuation and matches whole words from a fixed table.
Mode A makes zero LLM or external AI API requests.
The page checks browser support for `processLocally` on `SpeechRecognition` and displays the result.

### Mode B (Groq AI Rules)

The user writes door rules in plain English in an editable textarea with a "Reset to example" button.
The user enters a personal Groq API key in a password field stored only in `localStorage`.
The system message combines fixed safety rules, user rules, current door state, and allowed actions.
The user message wraps the spoken text inside delimiters and labels it as untrusted text.
The API request uses an 8-second timeout, runs one request at a time, and disables the talk button during flight.
Hand-written validation enforces JSON `{"action":"open|close|hold|release|lock|unlock|deny|none","reason":"max 80 characters"}`.
The pure door state machine always validates the returned action.

## 6. Event Log

The event log stores records in memory only with a "Clear" button and an empty state.
Columns show time (`Asia/Kuala_Lumpur`, 24-hour), mode, heard text, speaker status with score, action, and result.
Rejected voices appear with distinct row styling and explicit text labels.

## 7. Hardware Guide

`guide.html` explains how a real door controller integrates microphone, speech recognition, speaker verification, command logic, and hardware relay.
It compares four architectures (A, B, C, D) and contrasts ESP32 and Raspberry Pi in MYR from Malaysian sellers dated 15/11/2026.
It gives step-by-step wiring, safety rules for dry-contact triggers, Arduino C++ code, Python code, and voice-lock limitations.

## 8. Out of Scope

- Direct USB, serial, Bluetooth, or Wi-Fi connection from this web page to real hardware.
- Backend servers, user accounts, databases, or cloud storage of audio.
- Non-English speech recognition or multi-speaker enrolment profiles.
- Offline fallback when Chrome cloud speech recognition cannot run locally.
- Safety certification for commercial or mains-powered automatic doors.
