> **تنبيه النسخة العربية:** تتوفر النسخة العربية الأصلية المطابقة تماماً لخريطة الهيكلة ودليل المطوّر في **[`docs/ar/ARCHITECTURE.md`](../ar/ARCHITECTURE.md)**. | **[الصفحة الرئيسية بالعربية](../../README.md)**

# Project Architecture Map & Developer Modification Guide

This document provides the complete architectural blueprint of the **Mustaqbalat** repository, detailing the purpose of every directory and file, how modules communicate across storage and message channels, and an explicit step-by-step playbook for developers modifying existing capabilities or adding new features without breaking system invariants.

---

## 1. Complete Repository Directory & File Tree

```text
Mustaqbalat/
├── .github/
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug-report.md                  # GitHub Issue template for technical bug reports
│   │   └── incompatible-site.md           # GitHub Issue template for websites resisting dimming
│   ├── workflows/
│   │   └── pages.yml                      # Automated CI validation & GitHub Pages deployment (commented line-by-line)
│   └── PULL_REQUEST_TEMPLATE.md           # Bilingual Pull Request verification template
│
├── assets/
│   └── sponsors/
│       ├── murtakiz-logo.svg              # Official Community Sponsor badge (Murtakiz) — customizable SVG
│       └── qabilah-logo.svg               # Qabilah professional contact logo slot — directly replaceable SVG
│
├── converter/                             # Zero-disk-space web add-on compilation engine
│   ├── web-addon-converter.js             # In-RAM compiler (Bookmarklet + Userscript + binary PKZIP)
│   └── web-widget-runtime.js              # Isolated Shadow DOM floating widget runtime
│
├── docs/                                  # Modular bilingual documentation (1:1 Arabic/English parity)
│   ├── ar/
│   │   ├── ARCHITECTURE.md                # Arabic Architecture Map & Developer Modification Guide
│   │   ├── COMMUNITY_AND_CONTACT.md       # Arabic Community Sponsorship (Murtakiz), Qabilah & Contact Directory
│   │   ├── HOW_IT_WAS_BUILT.md            # Arabic Written Engineering Build Reference
│   │   ├── JSON_CONFIGS_LINE_BY_LINE.md   # Arabic Line-by-Line Reference for JSON Configuration Files
│   │   └── USER_GUIDE.md                  # Arabic Comprehensive User Guide
│   └── en/
│       ├── ARCHITECTURE.md                # English Architecture Map & Developer Modification Guide (this file)
│       ├── COMMUNITY_AND_CONTACT.md       # English Community Sponsorship (Murtakiz), Qabilah & Contact Directory
│       ├── HOW_IT_WAS_BUILT.md            # English Written Engineering Build Reference
│       ├── JSON_CONFIGS_LINE_BY_LINE.md   # English Line-by-Line Reference for JSON Configuration Files
│       └── USER_GUIDE.md                  # English Comprehensive User Guide
│
├── extension/                             # Official Manifest V3 Browser Extension package
│   ├── _locales/
│   │   └── ar/
│   │       └── messages.json              # Official Arabic localization bundle for Chromium & Firefox
│   ├── background/
│   │   └── service-worker.js              # MV3 Service Worker: bootstrap, badge state, usage ledger, URL checks
│   ├── core/
│   │   └── mustaqbalat-engine.js          # Core visual engine (Brightness, Layers, Dark Mode, PDF, HEX, HUD)
│   ├── icons/
│   │   ├── icon16.png                     # Toolbar icon (16×16)
│   │   ├── icon32.png                     # Header & HiDPI toolbar icon (32×32)
│   │   ├── icon48.png                     # Extensions management page icon (48×48)
│   │   └── icon128.png                    # Store & installation dialog icon (128×128)
│   ├── pages/
│   │   ├── dashboard.html                 # Multi-day / multi-week resource analytics dashboard markup
│   │   ├── dashboard.js                   # Time-series aggregation, 2D Canvas charts & JSON export controller
│   │   ├── pdf-viewer.html                # Zero-storage in-RAM PDF dimmer & reader markup
│   │   └── pdf-viewer.js                  # Drag-and-drop Blob URL PDF controller & overlay synchronizer
│   ├── popup/
│   │   ├── popup.css                      # 4-tab RTL extension popup stylesheet
│   │   ├── popup.html                     # Extension popup markup (Controls, HEX Colors, Usage, GitHub)
│   │   └── popup.js                       # Popup controller, Canvas color wheel, mini chart & GitHub reporter
│   └── manifest.json                      # Standard Manifest V3 extension descriptor
│
├── scripts/
│   └── validate-and-convert.js            # Automated syntax, asset, MV3 & Bookmarklet validator (npm test)
│
├── index.html                             # Live interactive web studio & Zero-Disk-Space Converter UI
├── studio.js                              # PostMessage simulator bridge & converter UI controller
├── server.js                              # Zero-dependency local HTTP preview server (0.0.0.0:3000)
├── manifest.webmanifest                   # Progressive Web App (PWA) manifest for zero-storage web usage
├── package.json                           # Scripts & metadata descriptor (0 external dependencies)
├── README.md                              # Primary Arabic repository documentation
├── README.en.md                           # Exact 1:1 English repository documentation
├── CONTRIBUTING.md                        # Arabic Contribution Manual
├── CONTRIBUTING.en.md                     # Exact 1:1 English Contribution Manual
├── SECURITY.md                            # Arabic Security & Privacy Policy
├── SECURITY.en.md                         # Exact 1:1 English Security & Privacy Policy
├── CODE_OF_CONDUCT.md                     # Arabic Community Code of Conduct
├── CODE_OF_CONDUCT.en.md                  # Exact 1:1 English Community Code of Conduct
├── CHANGELOG.md                           # Arabic Technical Changelog
├── CHANGELOG.en.md                        # Exact 1:1 English Technical Changelog
└── LICENSE                                # Open-source MIT License
```

---

## 2. Technology Stack & Engineering Rationale (Zero External Dependencies)

| Subsystem | Technology / Standard API | Engineering Rationale |
| :--- | :--- | :--- |
| Extension Architecture | `WebExtensions Manifest V3` | Native compatibility across Chrome, Edge, Brave, and Firefox using an event-driven, zero-idle-RAM `Service Worker`. |
| Core Language | `Vanilla JavaScript (ES2020+)` | Direct browser execution with zero build transpilers and zero `node_modules` disk usage, encapsulated via strict `IIFE` modules. |
| Visual Pipeline | `GPU CSS Filters` + `Fixed Viewport Layers` + `mix-blend-mode` | Sub-`0.3 ms` apply latency at steady `60 FPS`, supporting both brightness decrease and boost alongside PDF overlays. |
| Web Add-on Isolation | `Shadow DOM (attachShadow)` | Prevents host website CSS rules from leaking into or breaking the floating `Bookmarklet` / `Userscript` control widget. |
| Color Wheel & Charts | `HTML5 2D Canvas API` | Renders the polar HSL color wheel and multi-week resource charts with zero third-party charting libraries. |
| In-RAM Packaging | `Uint8Array` + `DataView` + `CRC-32 (PKZIP)` | Generates valid `.zip` browser packages directly in browser RAM without importing `JSZip`. |
| Local Server & CI Test | `Node.js` (`http`, `fs`, `path`, `vm`) | Runs live previews (`npm start`) and full syntax/bookmarklet verification (`npm test`) with zero external packages. |

---

## 3. Inter-Module Data & Message-Passing Topology

All project components coordinate through **3 canonical storage keys** and **5 explicit message contracts**:

### A. Shared Storage Keys (`chrome.storage.local` / `localStorage`)
1. `mustaqbalat_settings_v1`: Stores the complete visual configuration object (brightness, overlay opacity, method, dark mode, PDF settings, `HEX` tint settings, HUD position, GitHub repository slug, `excludedSites`, and `siteOverrides`).
   - **Writers:** `popup.js`, `service-worker.js` (initial install & keyboard toggle), `mustaqbalat-engine.js` (HUD minimize toggle), and `web-widget-runtime.js`.
   - **Readers / Live Listeners:** `mustaqbalat-engine.js`, `service-worker.js`, `pdf-viewer.js`, and `popup.js`.
2. `mustaqbalat_usage_v1`: Date-indexed telemetry map `{ "YYYY-MM-DD": { activeMinutes, darkMinutes, hexTintMinutes, pagesCount, pdfCount, avgFootprintKB, peakFootprintKB, totalApplyCpuMs } }`.
   - **Writers:** `service-worker.js` and `mustaqbalat-engine.js`.
   - **Readers:** `popup.js` (mini chart) and `dashboard.js` (full multi-week charts & JSON export).
3. `mustaqbalat_broken_sites_v1`: Bounded array (max 100 entries) of locally logged incompatible websites.
   - **Writer & Reader:** `popup.js`.

### B. Runtime Message Channels
1. `MUSTAQBALAT_GET_TELEMETRY` (`popup.js` → `mustaqbalat-engine.js` via `chrome.tabs.sendMessage`): Queries live tab metrics (`extensionFootprintKB`, `lastApplyMs`, `fps`, `domNodes`, `isPdf`).
2. `MUSTAQBALAT_UPDATE_SETTINGS` (`popup.js` → `mustaqbalat-engine.js`): Applies partial setting patches immediately and returns refreshed telemetry in the callback response.
3. `MUSTAQBALAT_USAGE_DELTA` (`mustaqbalat-engine.js` → `service-worker.js` via `chrome.runtime.sendMessage`): Flushes 60-second active visibility deltas into the daily usage ledger.
4. `MUSTAQBALAT_CHECK_URL_SUPPORT` (`popup.js` → `service-worker.js`): Checks whether the active tab URL uses a browser-restricted scheme (`chrome://`, `edge://`, `about:`, etc.).
5. `MUSTAQBALAT_STUDIO_SYNC` (`popup.js` inside `<iframe>` → `studio.js` on `index.html` via `window.postMessage`): Synchronizes the embedded popup simulator live with the host preview stage.

---

## 4. Developer Modification Playbook: Where to Edit or Add Features

Use the exact file and function map below whenever modifying an existing behavior or introducing a new feature:

### Scenario 1: Adding a New Visual Filter or Slider Control
1. **Core Engine (`extension/core/mustaqbalat-engine.js`):**
   - Add the new default property to `DEFAULT_SETTINGS`.
   - Apply the property inside `applyVisualSettings(reason)` (either pushing onto the `filters` array or updating layer styles in `buildDynamicCss()`).
2. **Extension Popup (`extension/popup/`):**
   - Add the `<input>` or `<select>` control in the target tab inside `extension/popup/popup.html`.
   - Add the matching default key to `DEFAULT_SETTINGS` in `extension/popup/popup.js`, populate its initial UI state in `populateControlsFromSettings()`, and bind its `input`/`change` event to `updateAndSave({ yourNewKey: value })` inside `bindEvents()`.
3. **Standalone Web Widget (optional feature parity):**
   - To expose the same control in compiled `Bookmarklet` and `Userscript` builds, add it to `DEFAULT_CFG` and `renderControls()` inside `converter/web-widget-runtime.js`.

### Scenario 2: Adding a New Dark Mode Profile
1. Open `extension/core/mustaqbalat-engine.js`, locate `buildDarkModeCss(mode, settings)`, and add an `else if (mode === "your-mode")` branch defining the root filter and media counter-inversion selectors.
2. Add `<option value="your-mode">` to `#darkModeSelect` inside `extension/popup/popup.html`.

### Scenario 3: Adding a New Preset Color Swatch
1. Open `extension/popup/popup.js` and append a new palette descriptor to `PRESET_PALETTES`:
   `{ id: "custom", name: "Palette Label", hex: "#RRGGBB", opacity: 18, blend: "multiply" }`.
2. Adjust `.swatches-grid` column count in `extension/popup/popup.css` if desired (or allow automatic grid wrapping).

### Scenario 4: Fixing Compatibility for a Specific Website
1. Inspect `getCurrentHostname()` inside `extension/core/mustaqbalat-engine.js`.
2. Either register per-site overrides via `settings.siteOverrides[host]` in `getEffectiveSettings()`, or add targeted CSS selector exclusions inside `buildDarkModeCss()`.

### Scenario 5: Adding a New Metric to the Days/Weeks Usage Dashboard
1. Emit the new metric field inside `flushUsageDelta()` in `extension/core/mustaqbalat-engine.js` and persist it inside `recordDailyUsageDelta()` in `extension/background/service-worker.js`.
2. Aggregate and render the field inside `buildSeries(history)` in `extension/pages/dashboard.js` and add the corresponding column or KPI element in `extension/pages/dashboard.html`.

### Scenario 6: Adding a New File Inside `extension/`
1. Place the file inside the appropriate subdirectory under `extension/`.
2. If the file should also be packaged into in-RAM `.zip` downloads generated by the web studio, add its relative path to the file manifest array inside `buildExtensionZipBlob()` in `converter/web-addon-converter.js`.
3. Run `npm test` to confirm `scripts/validate-and-convert.js` validates all paths, syntax, and compiled outputs cleanly.
