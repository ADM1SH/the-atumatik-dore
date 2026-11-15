# Launch and Performance Audit

Last update: 15/11/2026.

## 1. Website Performance Metrics (Model Unloaded)

Baseline measurements before page build are `none`.
Post-build measurements will fill the `After` column during Phase 7 Lighthouse verification.

| Metric | `index.html` Before | `index.html` After | `guide.html` Before | `guide.html` After |
|---|---|---|---|---|
| Lighthouse Performance | none | pending | none | pending |
| Lighthouse Accessibility | none | pending | none | pending |
| Lighthouse Best Practices | none | pending | none | pending |
| Lighthouse SEO | none | pending | none | pending |
| LCP | none | pending | none | pending |
| CLS | none | pending | none | pending |
| Total JS size (model unloaded) | none | pending | none | pending |
| Total image weight | none | pending | none | pending |

## 2. Performance Checklist

| Item | Status | Notes |
|---|---|---|
| 1. Compress images | Pending | Compress `assets/og-share.png` and board PNGs |
| 2. Modern image formats | Pending | Keep SVG favicon and compressed PNG share card for OG compatibility |
| 3. Lazy load below the fold | Pending | Apply `loading="lazy"` to below-fold media if added |
| 4. Remove unused code | Pending | Keep plain ES modules minimal without unused imports |
| 5. Reduce JavaScript | Pending | Load `@huggingface/transformers` only on user action |
| 6. Optimize fonts | Pending | Self-host `Jost` and `IBM Plex Mono` latin WOFF2 subsets |
| 7. Cache static files | N/A | GitHub Pages sets default cache headers and offers no custom header config |
| 8. Stop loading unused scripts | Pending | Load zero third-party scripts on initial page boot |
| 9. Fix layout shifts | Pending | Set explicit dimensions on door viewport and share image |
| 10. Improve LCP | Pending | Render hero door frame and text immediately without JS blocking |
| 11. Reduce interaction delays | Pending | Keep pure FSM transitions synchronous in browser memory |
| 12. Test on slow mobile connection | Pending | Test 375 px mobile throttling and lazy model progress bar |
| 13. Run Lighthouse | Pending | Audit `index.html` and `guide.html` in Phase 7 |
| 14. Fix Lighthouse issues | Pending | Address any flagged items before deploy |

## 3. Protect Checklist (20 Items)

| Item | Status | Notes |
|---|---|---|
| 1. Add rate limiting | N/A | Static browser client with no backend endpoint. Client disables Talk button during flight. |
| 2. Set API limits | Pending | Enforce one Groq call at a time, max rule length, and no auto-retry. |
| 3. Set spending caps | N/A | Users supply free Groq keys. The UI tells users to use temporary keys. |
| 4. Add error handling | Pending | Handle 401, 429, 5xx, offline, mic denial, and unsupported browser states |
| 5. Add loading states | Pending | Show model download progress bar and Groq request pending state |
| 6. Add empty states | Pending | Show explicit empty-state messages in the log and voiceprint panel |
| 7. Handle failed requests | Pending | Map HTTP and fetch failures to plain-text user messages |
| 8. Handle API timeouts | Pending | Abort Groq requests after 8000 ms with `AbortController` |
| 9. Prevent duplicate submissions | Pending | Disable Talk button while a Mode B request is running |
| 10. Prevent duplicate payments | N/A | No payment system exists in this static demo |
| 11. Optimize DB queries | N/A | No database exists |
| 12. Add DB indexes | N/A | No database exists |
| 13. Paginate large results | N/A | Event log holds in-memory session rows only |
| 14. Compress uploaded files | N/A | No file upload endpoint exists |
| 15. Limit upload size | N/A | No file upload endpoint exists. Voice clips stay local in memory. |
| 16. Cache repeat requests | Pending | Browser Cache API caches Hugging Face ONNX files after first load |
| 17. Add uptime monitoring | N/A | Static site hosted on GitHub Pages |
| 18. Add error logging | Pending | Surface errors locally in the Event Log without sending telemetry |
| 19. Test simultaneous users | N/A | Pure client-side static site with no shared backend state |
| 20. Test backup restoration | N/A | No database or server-side persistent storage exists |

## 4. Security Checklist (20 Items)

| Item | Status | Notes |
|---|---|---|
| 1. Hide API keys | Pending | Code holds zero keys. User key stays in browser `localStorage`. |
| 2. Purge Git secrets | Pending | Scan files before each commit with regex secret checks |
| 3. Public DB key only | N/A | No database exists |
| 4. Row-level security | N/A | No database exists |
| 5. Encrypt sensitive data | N/A | Browser `localStorage` stores user-provided key and numeric mean vector locally |
| 6. Server-side auth | N/A | No backend server exists |
| 7. Lock record access | N/A | No multi-user server records exist |
| 8. Block field tampering | N/A | No backend ORM or mass assignment exists |
| 9. Session cookies | N/A | No cookies are used |
| 10. Hash passwords | N/A | No user password accounts exist |
| 11. Rate limit login | N/A | No login endpoint exists |
| 12. Bot protection | N/A | No public backend form exists |
| 13. Parameterized queries | N/A | No SQL database exists |
| 14. Validate all input | Pending | Hand-written Mode B JSON validator and Mode A whole-word matcher |
| 15. Escape user content | Pending | Render log entries and transcripts with `textContent` only |
| 16. Restrict uploads | N/A | No file upload mechanism exists |
| 17. Trim API responses | Pending | Parse only `action` and `reason` up to 80 chars from Groq output |
| 18. Security headers | Pending | Use `<meta http-equiv="Content-Security-Policy">`. Document that GitHub Pages omits HSTS, X-Frame-Options, and X-Content-Type-Options. |
| 19. Force HTTPS | Pending | GitHub Pages serves HTTPS on `adm1sh.github.io` |
| 20. Scan dependencies | Pending | Zero npm runtime dependencies. Verify `@huggingface/transformers@4.3.2` status. |

## 5. Site Polish Checklist (20 Items)

| Item | Status | Notes |
|---|---|---|
| 1. Remove horizontal scroll | Pending | Verify `scrollWidth <= 375` at 375 px viewport |
| 2. Find broken links | Pending | Check internal and external links on both pages |
| 3. Add mobile menu | Pending | Responsive navigation links fit cleanly on 375 px |
| 4. Add favicon | Pending | Include `assets/favicon.svg` |
| 5. Fix page titles | Pending | Unique `<title>` on `index.html`, `guide.html`, and `404.html` |
| 6. Add meta description | Pending | Unique `<meta name="description">` per page |
| 7. Fix footer links | Pending | Link between Demo, Hardware Guide, and Repository |
| 8. Custom 404 page | Pending | Create `404.html` |
| 9. Update copyright year | Pending | Set year to 2026 |
| 10. Compress images | Pending | Compress `assets/og-share.png` |
| 11. Fix broken buttons | Pending | Verify all door, setup, key, and log buttons |
| 12. Add success messages | Pending | Show clear confirmation on save, enrol, and door actions |
| 13. Add error messages | Pending | Show clear plain-text errors for mic, key, and API failures |
| 14. Remove placeholder text | Pending | Keep example rules realistic without real emails |
| 15. Remove unused navigation | Pending | Keep navigation limited to Demo and Hardware Guide |
| 16. Fix mobile overflow | Pending | Wrap tables and code blocks cleanly on mobile |
| 17. Make logo clickable | Pending | Link brand mark to `index.html` |
| 18. Make phone number clickable | N/A | No contact phone number belongs on this FYP demo |
| 19. Make email clickable | N/A | No real email address is included in this public repo |
| 20. Mobile optimize | Pending | Verify 44x44 px touch targets and mobile screenshot boards |
