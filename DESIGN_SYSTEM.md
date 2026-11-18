# Design System: The Atumatik DoRe

Last update: 15/11/2026.

## 1. Design Heritage and Note on ADM UI Kit

Preflight searched the workspace parent directory for `ADM UI Kit` on 15/11/2026 and found no matching directory.
This project uses a dedicated Bauhaus and Dieter Rams token set in `design/tokens.css`.
Every component uses sharp geometry, clear hierarchy, high contrast, and functional primary accents on warm neutral surfaces.
No generic gradients, glassmorphism, floating glows, decorative icons, or AI copy tropes appear anywhere.

## 2. Color Tokens

| Token | Light Mode | Dark Mode | Role |
|---|---|---|---|
| `--bg` | `#F4F3EF` | `#101010` | Warm architectural canvas and matte dark canvas |
| `--surface` | `#FFFFFF` | `#1A1A1A` | Primary control panel surface |
| `--surface-alt` | `#EAE8E1` | `#242424` | Secondary inset surface and track rail |
| `--ink` | `#141414` | `#F4F3EF` | Primary text (contrast >= 14:1) |
| `--ink-muted` | `#4A4A46` | `#B8B6AE` | Secondary labels (contrast >= 5.5:1) |
| `--border` | `#141414` | `#3D3D38` | Crisp 2px structural rule lines |
| `--accent-primary` | `#1D4ED8` | `#60A5FA` | Primary Bauhaus blue action and focus ring |
| `--accent-danger` | `#C81E1E` | `#F87171` | Lock, deny, delete, and obstacle signal |
| `--accent-warn` | `#92400E` | `#FBBF24` | Hold, provisional state, and caution badges |
| `--accent-ok` | `#166534` | `#4ADE80` | Accepted speaker and unlocked signal |

## 3. Typography and Spacing

- Display and UI font: `Jost` (`assets/fonts/jost-latin.woff2`), geometric sans with Bauhaus lineage.
- Monospace font: `IBM Plex Mono` (`assets/fonts/ibm-plex-mono-latin.woff2`), tabular numerals for timestamps, scores, and thresholds.
- Base spacing unit: `4 px`. Layout scale uses `8 px`, `16 px`, `24 px`, and `32 px`.
- Minimum interactive target size: `44 px` height and width with at least `8 px` gap between controls.

## 4. UX Law Mapping (Principle -> UX Law -> Concrete Rule)

| Design Principle | UX Law | Concrete Implementation Rule |
|---|---|---|
| Standard navigation and controls | Jakob's Law | Place top navigation at top-left, standard buttons with clear text labels, and theme switch at top-right. |
| Safe and effortless tapping | Fitts's Law | Make the Push-to-Talk trigger at least `56 px` tall near center, enforce `44x44 px` minimum buttons, and separate "Delete my voiceprint" and "Forget key" from safe actions by at least `16 px`. |
| Structured scannable panels | Miller's Law | Group controls into distinct numbered sections (Car Model, Voice Control, Voice Setup, Car Controls, Event Log) separated by `24 px` spacing and `2 px` borders. |
| Clear low-friction choices | Hick's Law | Keep mode selection to two explicit radio buttons (Mode A vs Mode B) and label every control with plain words instead of bare icons. |
| Tolerant command parsing | Postel's Law | Strip punctuation and mixed case in Mode A while producing strict normalized states and validated JSON actions in Mode B. |
| Clear feedback on peaks and failures | Peak-End Rule | Show crisp per-sentence completion badges during 5-step enrolment and gentle, actionable plain-text messages for microphone denial, short clips, and API errors. |
| Disciplined visual polish | Aesthetic-Usability Effect | Apply consistent `2 px` structural borders, aligned monospace data tables, and light/dark board parity while verifying real usability in Browser QA. |
| Unmistakable state and primary triggers | Von Restorff Effect | Distinguish Push-to-Talk and Lock warning with color, solid border, text badge, and `aria-live="polite"`. Keep `3 px` `:focus-visible` outlines and `prefers-reduced-motion`. |
| System absorbs complexity | Tesler's Law | Pre-fill realistic Mode B example rules, automatically select a fast Groq model via `/openai/v1/models`, and cache the ONNX model in the browser after first download. |
| Immediate response and deliberate friction | Doherty Threshold | Render car state updates under `50 ms` (CSS animation `0.6 s`, `0 s` under reduced motion), display download byte percentages during model fetch, and require deliberate hold-to-talk and confirmation text for voiceprint deletion. |
