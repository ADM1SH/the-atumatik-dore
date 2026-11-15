# Code Style Guide: The Atumatik DoRe

Last update: 15/11/2026.

## 1. JavaScript Rules

- Write standard ES modules (`import` and `export`) compatible with modern Chrome, Edge, and Node `node --test`.
- Keep pure logic (`src/door-fsm.js`, `src/mode-a.js`) completely free of `window`, `document`, or DOM globals.
- Validate all external data (Groq API payloads, `localStorage` JSON parses, speech transcripts) at module boundaries.
- Never write `innerHTML` with user-supplied or API-supplied strings. Use `textContent` and `createElement`.
- Use explicit error returns or typed error codes rather than silent failures.
- Keep functions short with early returns and shallow nesting.

## 2. CSS and HTML Rules

- Consume color, spacing, border, and typography values from `design/tokens.css`.
- Write semantic HTML5 landmarks (`header`, `nav`, `main`, `section`, `footer`), one `<h1>` per page, and sequential headings (`h2`, `h3`).
- Link every form control with explicit `<label for="...">` and `<input id="...">`.
- Preserve visible `:focus-visible` outlines and `@media (prefers-reduced-motion: reduce)` overrides.

## 3. Hygiene Rules

- Use zero em dashes and zero en dashes in comments, strings, UI labels, and documentation.
- Format displayed dates as `DD/MM/YYYY` and timestamps in `Asia/Kuala_Lumpur` (`24-hour`).
- Keep sample rules and example logs realistic with zero real email addresses.
