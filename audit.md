# Launch and Performance Audit

Last update: 18/11/2026 (car demo update in section 6).

## 1. Website Performance Metrics (Model Unloaded)

Pre-build baselines before initial HTML authoring are `none`.
Intermediate `Before` numbers show first-pass local measurements before the `connect-src 'self'` fix, font preloads, and `font-display: optional`.
The `chrome-devtools-mcp` Lighthouse v13.6.0 runner outputs Accessibility, Best Practices, SEO, and Agentic Browsing categories. Chrome Performance Trace measured cold LCP and CLS.

| Metric | `index.html` Before | `index.html` After | `guide.html` Before | `guide.html` After |
|---|---|---|---|---|
| Lighthouse Performance | none | N/A (measured via Chrome Trace below) | none | N/A (measured via Chrome Trace below) |
| Lighthouse Accessibility (Mobile / Desktop) | none | 100 / 100 | 100 / 100 | 100 / 100 |
| Lighthouse Best Practices (Mobile / Desktop) | none | 100 / 100 | 100 / 100 | 100 / 100 |
| Lighthouse SEO (Mobile / Desktop) | none | 100 / 100 | 92 / 92 | 100 / 100 |
| Lighthouse Agentic Browsing (Mobile / Desktop) | none | 100 / 100 | 49 / 50 | 100 / 100 |
| LCP Desktop Cold (1x CPU) | none | 46 ms | 46 ms | 26 ms |
| LCP Mobile Cold (Slow 4G, 4x CPU) | none | 1,401 ms -> 1,505 ms | 1,352 ms -> 1,492 ms | 1,492 ms |
| CLS Mobile Cold (Slow 4G, 4x CPU) | none | 0.00 | 0.14 | 0.00 |
| CLS Lighthouse Mobile | none | 0 | 0.065 | 0 |
| Total JS size (6 local modules, model unloaded) | none | 53,631 B | 53,631 B | 53,631 B |
| Total CSS size (`tokens.css` + `styles.css`) | none | 13,509 B | 13,509 B | 13,509 B |
| Total WOFF2 font weight (`Jost` + `IBM Plex Mono`) | none | 24,112 B | 24,112 B | 24,112 B |
| Total image weight (`favicon.svg` + `og-share.png`) | none | 6,981 B | 6,981 B | 6,981 B |

## 2. Performance Checklist

| Item | Status | Notes |
|---|---|---|
| 1. Compress images | Done | Optimized `assets/og-share.png` (`6,567` bytes) and `assets/favicon.svg` (`414` bytes). |
| 2. Modern image formats | Done | SVG favicon and compact `6,567` B PNG share card for OG compatibility. |
| 3. Lazy load below the fold | N/A | Only header 28x28 brand mark renders on page (`og-share.png` is social metadata). |
| 4. Remove unused code | Done | Six plain ES modules total `53,631` bytes with zero unused exports. |
| 5. Reduce JavaScript | Done | Loads `@huggingface/transformers@4.3.2` only after explicit user action in Voice Setup. |
| 6. Optimize fonts | Done | Self-hosted latin WOFF2 subsets (`24,112` bytes), preloaded in `<head>`, `font-display: optional`. |
| 7. Cache static files | N/A | GitHub Pages sets default cache headers and offers no custom header config. |
| 8. Stop loading unused scripts | Done | Zero third-party scripts load during initial page boot. |
| 9. Fix layout shifts | Done | Fixed `guide.html` Slow 4G mobile CLS from `0.14` to `0.00` (Lighthouse `0.065` to `0`). |
| 10. Improve LCP | Done | Non-blocking initial layout achieves `46 ms` (`index.html`) and `26 ms` (`guide.html`) desktop LCP. |
| 11. Reduce interaction delays | Done | Synchronous state changes in `src/car.js` run immediately. CSS animates for `0.6 s`. |
| 12. Test on slow mobile connection | Done | Tested `Slow 4G` plus `4x` CPU slowdown on `375x812` viewport (`CLS 0.00`). |
| 13. Run Lighthouse | Done | Audited `index.html` and `guide.html` on mobile and desktop with model unloaded. |
| 14. Fix Lighthouse issues | Done | Fixed `connect-src 'self'` and font preloads so all 4 audited categories score `100`. |

## 3. Protect Checklist (20 Items)

| Item | Status | Notes |
|---|---|---|
| 1. Add rate limiting | N/A | Static browser client with no backend endpoint. Client disables Talk button during flight. |
| 2. Set API limits | Done | `src/app.js` enforces one Groq call at a time, trims rules to `1,200` chars, and omits auto-retry. |
| 3. Set spending caps | N/A | Users supply free Groq keys. UI tells users to delete temporary keys after testing. |
| 4. Add error handling | Done | Covers `401` (live tested), `429`, `5xx`, `Offline` (unit tested), mic denial (tested), and non-Chrome/Edge UA (tested). |
| 5. Add loading states | Done | Shows ONNX download progress bar and Groq checking status messages. |
| 6. Add empty states | Done | Empty event log and unenrolled voice setup render explicit messages. |
| 7. Handle failed requests | Done | Maps HTTP and fetch failures to plain-text user messages. |
| 8. Handle API timeouts | Done | Aborts Groq calls after `8000` ms using `AbortController`. |
| 9. Prevent duplicate submissions | Done | Disables Talk button while a Mode B request runs. |
| 10. Prevent duplicate payments | N/A | No payment system exists in this static demo. |
| 11. Optimize DB queries | N/A | No database exists. |
| 12. Add DB indexes | N/A | No database exists. |
| 13. Paginate large results | N/A | Event log holds in-memory session rows only. |
| 14. Compress uploaded files | N/A | No file upload endpoint exists. |
| 15. Limit upload size | N/A | No file upload endpoint exists. Voice clips stay local in memory. |
| 16. Cache repeat requests | Done | Browser Cache API reused cached Hugging Face ONNX files in `653 ms` on reload. |
| 17. Add uptime monitoring | N/A | Static site hosted on GitHub Pages. |
| 18. Add error logging | Done | Records plain errors inside the in-memory Event Log without telemetry. |
| 19. Test simultaneous users | N/A | Pure client-side static site with no shared backend state. |
| 20. Test backup restoration | N/A | No database or server-side persistent storage exists. |

## 4. Security Checklist (20 Items)

| Item | Status | Notes |
|---|---|---|
| 1. Hide API keys | Done | Zero keys in repository. User key stays in browser `localStorage` only. |
| 2. Purge Git secrets | Done | Ran regex scan across repository (`0` keys, paths, emails, or em dashes). |
| 3. Public DB key only | N/A | No database exists. |
| 4. Row-level security | N/A | No database exists. |
| 5. Encrypt sensitive data | N/A | Browser `localStorage` holds only user-entered Groq key and numeric mean vector locally. |
| 6. Server-side auth | N/A | No backend server exists. |
| 7. Lock record access | N/A | No multi-user server records exist. |
| 8. Block field tampering | N/A | No backend ORM or mass assignment exists. |
| 9. Session cookies | N/A | No cookies are used. |
| 10. Hash passwords | N/A | No user password accounts exist. |
| 11. Rate limit login | N/A | No login endpoint exists. |
| 12. Bot protection | N/A | No public backend form exists. |
| 13. Parameterized queries | N/A | No SQL database exists. |
| 14. Validate all input | Done | Mode B uses hand-written JSON checks, and Mode A uses word boundaries (`node --test` verified). |
| 15. Escape user content | Done | Log rows and messages render via `textContent` instead of HTML string insertion. |
| 16. Restrict uploads | N/A | No file upload mechanism exists. |
| 17. Trim API responses | Done | Extracts only validated `action` and max `80`-char `reason` from Groq output. |
| 18. Security headers | Done | `<meta http-equiv="Content-Security-Policy">` verified with zero CSP errors. GitHub Pages limits documented in `SECURITY.md`. |
| 19. Force HTTPS | Done | Verified `https_enforced: true` on `https://adm1sh.github.io/the-atumatik-dore/` after Step 10.6 Pages setup. |
| 20. Scan dependencies | Done | Zero `package.json` runtime dependencies. Pinned `@huggingface/transformers@4.3.2` shows zero npm deprecation. |

## 5. Site Polish Checklist (20 Items)

| Item | Status | Notes |
|---|---|---|
| 1. Remove horizontal scroll | Done | Verified `scrollWidth === 375` at `375x812` on `index.html`, `guide.html`, and `404.html`. |
| 2. Find broken links | Done | Verified HTTP `200` on live GitHub Pages root, `guide.html`, `robots.txt`, and all `11` external links. |
| 3. Add mobile menu | Done | Header navigation buttons wrap cleanly with `44x44` px touch targets on `375 px`. |
| 4. Add favicon | Done | Included `assets/favicon.svg` (`414` bytes). |
| 5. Fix page titles | Done | Unique `<title>` on `index.html`, `guide.html`, and `404.html`. |
| 6. Add meta description | Done | Unique `<meta name="description">` on all three HTML pages. |
| 7. Fix footer links | Done | Footer links connect Demo, Hardware Guide, and GitHub Repo cleanly. |
| 8. Custom 404 page | Done | Created `404.html` and verified typography and links at `375 px`. |
| 9. Update copyright year | Done | All footers display `15/11/2026`. |
| 10. Compress images | Done | `assets/og-share.png` (car, 1200 x 630) measures `35,752` bytes. |
| 11. Fix broken buttons | Done | Verified manual car buttons, kick zones, mode radios, key controls, log clear, and theme toggle in Chrome. |
| 12. Add success messages | Done | Live status confirms car state changes, alert start and stop, unlock, and key removal. |
| 13. Add error messages | Done | Verified locked warning, mic denied steps, unsupported UA banner, empty key, and `401` key rejection. |
| 14. Remove placeholder text | Done | Realistic example rules and zero placeholder personal emails. |
| 15. Remove unused navigation | Done | Navigation contains Demo and Hardware Guide links only. |
| 16. Fix mobile overflow | Done | Guide tables and code blocks scroll inside `.table-scroll` wrappers with zero body overflow. |
| 17. Make logo clickable | Done | Header brand mark and title link to `index.html`. |
| 18. Make phone number clickable | N/A | No contact phone number belongs on this FYP demo. |
| 19. Make email clickable | N/A | No real email address is included in this public repo. |
| 20. Mobile optimize | Done | Captured 6 boards (`design/boards/`), checked `44x44` px targets, and verified light/dark contrast `>= 4.70:1`. |

## 6. Car Demo Update and Model v2 (18/11/2026)

Lighthouse v13.6.0 scored 100 in all four categories on `localhost` before Model v2 (`18/11/2026`). Lighthouse did not re-run after Model v2 because no local Lighthouse binary is installed.

| Metric | `index.html` Before | `index.html` Model v1 | `index.html` Model v2 | `guide.html` After |
|---|---|---|---|---|
| Accessibility / Best Practices / SEO / Agentic Browsing (mobile) | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | Not re-run (local binary missing) | 100 / 100 / 100 / 100 |
| Same on desktop | 100 / 100 / 100 / 100 | 100 / 100 / 100 / 100 | Not re-run (local binary missing) | 100 / 100 / 100 / 100 |
| Audits passed | 57 | 60 | Not re-run | 57 |
| JS in `src/` (8 modules) | 53,631 B | 76,102 B | 76,102 B | n/a |
| CSS (`tokens.css` + `styles.css`) | 13,509 B | 15,965 B | 16,485 B | n/a |
| Image weight (`favicon.svg` + `og-share.png`) | 6,981 B | 36,454 B | 41,096 B | n/a |

Protect checklist for the new features:

| Item | Status | Notes |
|---|---|---|
| Rate limiting, API limits, spending caps | Unchanged | Same as section 3. Mode B still runs one call at a time with an 8 s timeout. |
| Error handling, loading and empty states | Done | Refused car actions show a plain reason. The alert banner and countdown show state. Disabled-by-rule actions log the reason. |
| Duplicate submissions | Done | Repeat actions (engine, lock, windows, doors) are refused without a change event. |
| Payments, DB, uploads, uptime, backups | N/A | No payment, database, upload, or server exists. |

Security checklist for the new features:

| Item | Status | Notes |
|---|---|---|
| Validate all input | Done | Mode A one-command rule, Mode B action and target pair check, and car action checks. |
| Escape user content | Done | All new text uses `textContent`. No `innerHTML`. |
| Secrets and storage | Done | The child flag, owner distance, keyfob state, and car state stay in memory. The repository scan found no secrets. |
| CSP | Done | No `style` attribute and no `<style>` block. SVG classes live in `styles.css`. Positions use `style.setProperty`. |
| Dependencies | Done | No new dependency. |

Site polish for the new features: favicon, OG image, `404.html`, and both pages updated. Boards re-captured (6) on 18/11/2026.
