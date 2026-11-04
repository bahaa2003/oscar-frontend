# OSCAR theme customization audit

Scope: OSCAR frontend and its existing `/api/admin/theme` and `/api/theme/published` APIs. All test writes use temporary MongoDB databases. No deployment, production DB access, environment-file changes, payment-policy changes or subscription-permission changes.

## Confirmed causes and fixes

- `Dashboard.jsx` used fixed category columns, so authenticated customers did not receive the published layout. It now uses the same grid mapping as `PublicCatalog.jsx` and `Products.jsx`.
- Product-column validation and frontend readers accepted only 2, 3 and 4. Editor, validator and all readers now accept 2–6. Existing saved configurations and defaults remain valid.
- The existing schema has one desktop layout, not separate saved tablet/mobile layouts. Products retain the existing tablet maximum of 3 and mobile maximum of 2; categories retain a mobile maximum of 2. The actual iframe viewport tests these responsive rules.
- Several published typography variables and the compact/outline flags had no CSS consumers. They now affect the public components. Most selectable fonts were never loaded; allowlisted font stylesheets now load on demand for the chosen Arabic/English families (Arial remains a system font), using the [documented Google Fonts stylesheet API](https://developers.google.com/fonts/docs/css2).
- Old `!important` decorations in CSS layers overrode published header colors and sidebar corner radius. Published chrome rules now have priority in the appropriate layer. Layout offsets use the chosen header height and sidebar width.
- The plain category-card variant ignored per-category neon. Product-list and purchase neon settings previously affected demonstrations only; they now affect the real product grid and purchase panel.
- A logged-in preview iframe passed the redirect check but still returned `null`. The authenticated preview now renders the real public catalog. A ready-message handshake applies draft settings after its React tree mounts. No demonstration catalog is used to apply or test production settings.
- The published theme loaded once and transient fetch errors erased it. Successful publishes update the current React context, notify same-origin tabs with BroadcastChannel, and invalidate stale in-flight reads. Focus/visibility refresh and a 30-second visible-page refresh pick up changes from other sessions. Failed reads preserve the last confirmed theme. Theme GET responses are `no-store`; no theme configuration is persisted in local storage.
- Repeated section and history publish controls have been removed. A single `نشر التغييرات` control saves the shared draft, then publishes the exact server-validated snapshot. History loads a version into that same draft. Confirmation uses a synchronous in-flight guard and performs one publish request. Rejected or malformed API responses cannot generate a publish-success event.

## Setting-to-component mapping

All visual settings remain in the version-2 theme configuration. Draft save, validation, publication and history retain the complete configuration.

| Configuration field | Public consumer |
| --- | --- |
| `layout.productsPerRow` | Shared `getThemeGridStyles`; all product grids in `Products`, `PublicCatalog`, and product loading grids |
| `layout.categoriesPerRow` | Same helper; `Dashboard`, `Products`, `PublicCatalog`, category loading grids |
| `modes.*.presetId` and `colors.*` | `platformThemeStyles` → root CSS tokens; storefront backgrounds, surfaces, text, borders and accents |
| `typography.arabicFont`, `englishFont`, `baseSize`, `headingWeight` | Published root/language CSS and storefront headings |
| `buttons.radius`, `buttons.style` | Shared primary `Button` and the purchase confirmation button |
| `cards.radius`, `cards.shadow` | Product/category cards and shared premium cards; configured surface/border colors replace conflicting decorations |
| `navigation.style` | Compact sidebar links and mobile navigation spacing |
| `neon.hero` | Actual `HeroSlider` frame |
| `neon.categories`, `neon.categoryCards[id]` | Both plain and neon `CategoryCard` variants; a per-category value overrides the section default |
| `neon.bestSellers` | Existing storefront product grids; no artificial best-sellers catalog is created |
| `neon.purchase` | Actual `ProductPurchasePage` panel; opening the panel is tested without submitting a purchase |
| `chrome.modes.*.header` (template, height, width, radius, colors) | `Header`, `PublicCatalog`, `Layout` positioning and spacing |
| `chrome.modes.*.bottomNav` | Existing `PlatformBottomNav`, independently for light and dark modes |
| `brand.sidebarTemplate`, `sidebarMetrics` | `Sidebar`, `PublicSidebar`, published template rules and `Layout` offsets |
| `brand.logoPath`, `logoWidth` | `BrandMark` used by header/sidebar; existing per-context size scaling remains intact |
| `brand.slides` | `HeroSlider` replacements; blank slots retain the existing store images |
| `brand.marqueeTextArabic` | Arabic text in `HeroSlider` |
| `brand.targetBannerPath` | `BuyTarget` and the customer `Dashboard` target link |

WhatsApp contacts and the private notification recipient remain operational payment settings with their existing dedicated save action and ULTRA checks. They are deliberately not copied into the publicly readable theme configuration, which would expose the private recipient. This audit does not change their storage or permissions; existing backend tests cover their ULTRA protection and persistence.

## Data and publish contract

`Editor shared draft → POST /admin/theme/draft → validated database draft → POST /admin/theme/publish → database published + history → successful publish event → public components`.

The preview iframe receives only the draft and cannot change its parent theme. Merely selecting values or saving a draft does not alter the public theme. All saved values remain numeric and are validated by the backend. Missing legacy layout fields retain their documented defaults (4 products and 3 categories). No migration or new index is needed for the expanded allowlist.

## Reproducible validation

Frontend: `npm run lint` (the project's TypeScript check), `npm run build`, `git diff --check`.

Backend: `npm test -- --runTestsByPath src/tests/theme.test.js`, `npm test -- --detectOpenHandles`, and Node syntax checks for changed backend files.

Browser: from the backend, `npm run test:theme:browser -- "D:\projects\oscar\oscar frontend"`. Requires installed Chrome/Chromium (`CHROME_BIN` may specify its executable), the frontend's existing Vite dependencies and access to Google Fonts for the web-font download check. The runner starts temporary MongoDB, a real local backend and an isolated Vite process, creates disposable database fixtures, and uses separate Chromium browser contexts. It rejects external HTTP requests except read-only Google Fonts requests in the font test. Only its failure-injection cases substitute deliberately failed HTTP responses; successful flows use real APIs and MongoDB. The runner closes the browser, backend, Vite process and MongoDB and removes its own uploaded image fixture.

Checks include exact computed grid columns, authenticated preview isolation (including actual mobile navigation), one publish request under double confirmation, history-to-draft publication, refresh and incognito persistence, failed save/publish/`success:false` responses, delayed pre-publish reads in a second same-origin tab, uploaded images, CSS-computed typography/cards/chrome/neon and independent light/dark navigation.

## Recorded results

| Check | Result |
| --- | --- |
| Focused backend theme suite | PASS — 41/41, including every 2–6 product / 2–3 category combination through draft, MongoDB, publication and public HTTP reads |
| Final complete backend run | PASS — 24 suites, 754/754 tests; JSON results retained in the temporary audit report |
| Real Chromium integration runner | PASS — 12 scenarios; actual layout, upload, theme CSS, a downloaded Tajawal font, responsive views, draft isolation, delayed stale reads, failed requests and publish counts checked |
| Google font stylesheets | PASS — all 13 web-font families returned HTTP 200 and `@font-face` definitions; Arial is provided by the operating system |
| Frontend build | PASS; existing mixed dynamic/static `useSystemStore` import warning remains |
| Project lint / TypeScript | PASS — `npm run lint` invokes `tsc --noEmit`; no separate ESLint command is configured |
| Changed backend Node syntax and Git whitespace | PASS |
| Production behavior/deployment | NOT TESTED — no production connection or deployment was performed |

One unrelated intermittent test remains documented: the first complete run with `--detectOpenHandles` produced 753 passes and a failure at `src/tests/walletRecoveryHttp.test.js:209`, expecting concurrent recovery HTTP statuses `[200,422]` but receiving `[200,200]`. The exact failure was reproduced on the unmodified previous backend commit `d9cdda1` in its existing release worktree. The current wallet suite then passed 7/7 independently and the final complete run passed 754/754. Wallet/deposit/recovery code and that test are byte-for-byte unchanged by this work. No assertion was relaxed; this remains a pre-existing timing-sensitive test rather than a claimed financial repair. The detect-open-handles run exited normally after its assertion failure and did not report open resources. Existing Node `punycode` warnings and expected test-only WhatsApp failure logs remain visible.

## Changed files

Frontend root: `D:\projects\oscar\oscar frontend`.

- `src/theme/platformTheme.js`: shared layout options, chrome styles, loaded font families, token aliases, real neon flags and sidebar radius.
- `src/theme/publishThemeDraft.js` (new): verified save-then-publish snapshot flow.
- `src/context/ThemeContext.jsx`: publish refresh, cache/race protection, cross-tab updates, retryable public reads and preview readiness.
- `src/services/realApi.js`: validate theme response envelopes and saved drafts; uncached public reads.
- `src/pages/admin/PlatformThemeEditor.jsx`: one publish control, shared draft/history workflow, full column choices, accurate responsive hints and real catalog previews.
- `src/pages/admin/StorefrontThemePreview.jsx`: isolated real-catalog iframe and ready-message handshake.
- `src/pages/admin/PlatformThemeEditor.css`: remove obsolete simulated-store rules; retain viewport toolbar/frame styling.
- `src/pages/Dashboard.jsx`, `src/pages/Products.jsx`, `src/pages/PublicCatalog.jsx`: apply the shared published grids; public header styles and authenticated-preview behavior.
- `src/components/home/CategoryCard.jsx`, `src/components/products/LoadingSkeleton.jsx`: category neon and matching loading grids.
- `src/components/layout/Header.jsx`, `src/components/layout/Layout.jsx`: apply header measurements/templates and matching shell offsets.
- `src/components/layout/PlatformBottomNav.jsx`: show the real navigation in a draft preview while keeping its preview links from leaving the preview catalog.
- `src/components/ui/Button.jsx`, `src/pages/ProductPurchasePage.jsx`: connect primary-button style/radius and purchase neon.
- `src/components/ui/Toast.jsx`: accessible status/error roles and testable toast types.
- `src/index.css`: connect published styles and resolve conflicting legacy/layer declarations without changing subscription checks.
- `docs/theme-customization-audit.md` (new): mapping, evidence, limits and deployment order.

Backend root: `D:\projects\oscar\oscar-backend-main`.

- `src/modules/theme/theme.validation.v2.js`: accept 2–6 product columns while preserving the version-2 schema and legacy defaults.
- `src/modules/theme/theme.routes.js`, `src/modules/theme/platform.routes.js`: prevent theme-response caching.
- `src/tests/theme.test.js`: add layout round-trip and rejected-write protection tests.
- `scripts/test-theme-storefront.cjs` (new): isolated real browser/API/MongoDB audit and cleanup.
- `package.json`: expose `test:theme:browser`; dependencies and lockfile are unchanged.

## Deployment order

Deploy the compatible backend allowlist/cache changes before the new frontend, so 5/6-column requests are accepted. Existing 2/3/4-column configurations continue working throughout. Rebuild the frontend with OSCAR's existing production environment. This work does not deploy or modify server configuration. Rolling back frontend code alone remains compatible with existing 2/3/4-column themes; do not roll back the backend allowlist while a 5/6-column theme is stored, because the older validator cannot read those configurations.
