# Project Rules: The Atumatik DoRe

Last update: 15/11/2026.

## 1. Project Scope

This public repository holds "The Atumatik DoRe", a static voice-controlled Proton Gen2 CPS car web demo for GitHub Pages.
No backend server, no database, and no build step exist in this repository.
This file holds project rules only.
Do not copy global personal rules or local machine paths into this repository.

## 2. Hard Constraints

- Write all documentation files in ASD-STE100 Simplified Technical English.
- Use zero em dashes and zero en dashes in all files and messages.
- Format all dates as DD/MM/YYYY.
- Display all timestamps in Asia/Kuala_Lumpur (24-hour format).
- Keep all code in plain HTML, CSS, and ES modules without bundlers or frameworks.
- Keep secrets, API keys, personal data, real email addresses, and local home paths out of the repository.
- Add no AI co-author lines to commits.

## 3. Source-of-Truth Table

| Concern | Authoritative File |
|---|---|
| Product requirements and scope | `prd.md` |
| Implementation phases and status | `implementation_plan.md` |
| Single task for next session | `task_today.md` |
| Test checklist | `testing.md` |
| Bugs and known risks | `bugs.md` |
| Performance and launch audit | `audit.md` |
| Architecture and numbered decisions | `decisions.md` |
| System flow and data storage | `ARCHITECTURE.md` |
| Design tokens and UX laws | `DESIGN_SYSTEM.md` |
| Security, CSP, and PDPA 2010 | `SECURITY.md` |
| JavaScript and CSS style rules | `CODE_STYLE.md` |
| Onboarding and usage index | `README.md` |
| Session continuity | `handoff.md` |

## 4. Session Start Procedure

1. Read `handoff.md`.
2. Read `task_today.md`.
3. Read only the files that `task_today.md` names.

## 5. Session End Procedure

1. Run `node --test` and all required checks.
2. Mark completed items in `implementation_plan.md` and `testing.md`.
3. Log new technical choices in `decisions.md`.
4. Write the next single task in `task_today.md`.
5. Update all six sections of `handoff.md` with relative paths only.
