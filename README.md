# The Atumatik DoRe

Last update: 15/11/2026.

The Atumatik DoRe is a browser-based voice-controlled automatic sliding door demo and hardware build guide for a final year project group.
Live site: `https://adm1sh.github.io/the-atumatik-dore/`

## How to Run the Demo (No Coding Required)

1. Open `https://adm1sh.github.io/the-atumatik-dore/` in Google Chrome or Microsoft Edge on desktop or Android.
2. Allow microphone access when the browser asks.
3. Click the door control buttons or hold the Talk button (or `Space` key) to control the door with Mode A (fixed words).
4. Optional: Open Voice Setup, read the PDPA 2010 consent text, and record the five door sentences to test the demo speaker lock.
5. Optional: Paste a temporary personal Groq API key from `https://console.groq.com/keys` to test Mode B plain-English rules.
6. Open the Hardware Guide page to inspect ESP32 and Raspberry Pi wiring, MYR pricing, and sample code.

## Local Verification (Developers)

Run the pure unit test suite with Node 20 or newer:

```bash
node --test
```

Serve the static files locally over HTTP:

```bash
python3 -m http.server 8123
```

## Documentation Index

| File | Description |
|---|---|
| `GEMINI.md` | Project rules, source-of-truth table, session workflow |
| `prd.md` | Product specification and out-of-scope list |
| `implementation_plan.md` | Project phases and checklists |
| `task_today.md` | Active task for the next session |
| `testing.md` | Automated unit test and browser QA checkboxes |
| `bugs.md` | Bug tracking template and known project risks |
| `audit.md` | Performance, protection, security, and site polish audit |
| `decisions.md` | Numbered architectural choices and smoke test logs |
| `ARCHITECTURE.md` | Control flow, module boundaries, and browser storage |
| `DESIGN_SYSTEM.md` | Bauhaus plus Dieter Rams tokens and UX law rules |
| `SECURITY.md` | Groq key safety, PDPA 2010 notice, CSP, and supply-chain risks |
| `CODE_STYLE.md` | ES module, HTML, and CSS coding rules |
| `handoff.md` | Six-section session continuity log |
