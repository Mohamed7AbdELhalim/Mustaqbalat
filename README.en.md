> **تنبيه النسخة العربية الأصلية:** تتوفر النسخة العربية الكاملة المطابقة تماماً (`1:1`) لتوثيق هذا المستودع (بما في ذلك دليل الاستخدام، والمرجع الهندسي المكتوب لصناعة البرنامج، وخريطة الهيكلة ودليل المطوّر، ودليل المساهمة، ودليل الرعاية المجتمعية والتواصل) عبر الرابط التالي: **[قراءة التوثيق باللغة العربية (`README.md`)](./README.md)** | **[مجلد التوثيق العربي `docs/ar/`](./docs/ar/)**

# Mustaqbalat | Visual Comfort & Screen Dimmer

<p align="left">
  <img src="./extension/icons/icon48.png" alt="Mustaqbalat Logo" width="44" align="left" />
  <strong>Standard Manifest V3 Browser Extension & Zero-Disk-Space Web Add-on Converter (0 Bytes on Disk)</strong><br/>
  Default-on screen brightness control (decrease & boost), website & PDF overlay layers, Smart Dark Mode, HEX studio & interactive color wheel, and multi-week resource telemetry integrated directly with GitHub.
</p>

---

## Documentation Index & Repository Map

All repository documentation is organized into dedicated modular files with strict `1:1` parity between the primary Arabic edition and this English edition:

| Technical Topic | English Edition (1:1 Match) | النسخة العربية (الأصلية) |
| :--- | :--- | :--- |
| **Main Repository Overview** | **[`README.en.md`](./README.en.md)** *(You are here)* | **[`README.md`](./README.md)** |
| **Comprehensive User Guide** | **[`docs/en/USER_GUIDE.md`](./docs/en/USER_GUIDE.md)** | **[`docs/ar/USER_GUIDE.md`](./docs/ar/USER_GUIDE.md)** |
| **How Mustaqbalat Was Built (Written Reference)** | **[`docs/en/HOW_IT_WAS_BUILT.md`](./docs/en/HOW_IT_WAS_BUILT.md)** | **[`docs/ar/HOW_IT_WAS_BUILT.md`](./docs/ar/HOW_IT_WAS_BUILT.md)** |
| **Architecture Map & Developer Modification Guide** | **[`docs/en/ARCHITECTURE.md`](./docs/en/ARCHITECTURE.md)** | **[`docs/ar/ARCHITECTURE.md`](./docs/ar/ARCHITECTURE.md)** |
| **Line-by-Line Reference for JSON Configs** | **[`docs/en/JSON_CONFIGS_LINE_BY_LINE.md`](./docs/en/JSON_CONFIGS_LINE_BY_LINE.md)** | **[`docs/ar/JSON_CONFIGS_LINE_BY_LINE.md`](./docs/ar/JSON_CONFIGS_LINE_BY_LINE.md)** |
| **Community Sponsorship (Murtakiz), Qabilah & Contact** | **[`docs/en/COMMUNITY_AND_CONTACT.md`](./docs/en/COMMUNITY_AND_CONTACT.md)** | **[`docs/ar/COMMUNITY_AND_CONTACT.md`](./docs/ar/COMMUNITY_AND_CONTACT.md)** |
| **Contribution Manual & Pre-PR Checklists** | **[`CONTRIBUTING.en.md`](./CONTRIBUTING.en.md)** | **[`CONTRIBUTING.md`](./CONTRIBUTING.md)** |
| **Security & Local Privacy Policy** | **[`SECURITY.en.md`](./SECURITY.en.md)** | **[`SECURITY.md`](./SECURITY.md)** |
| **Community Code of Conduct** | **[`CODE_OF_CONDUCT.en.md`](./CODE_OF_CONDUCT.en.md)** | **[`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md)** |
| **Technical Changelog** | **[`CHANGELOG.en.md`](./CHANGELOG.en.md)** | **[`CHANGELOG.md`](./CHANGELOG.md)** |

---

## 1. Project Definition & Problem Statement

**Mustaqbalat** is an open-source engineering project addressing two concrete technical problems simultaneously:
1. **Visual Fatigue from High-Luminance Screens & Pure-White Surfaces:** Executes automatically by default across webpages and `PDF` documents to decrease or boost screen brightness, place transparent `Overlay Layers` over viewports, apply Smart Dark Mode without inverting images or videos, and tint screens with any `HEX` or color-wheel shade.
2. **Constrained Local Storage & System Overhead:** Engineered with strictly **zero external dependencies (`0 npm dependencies`)** and zero bundler bloat, paired with an in-RAM Web Add-on Converter that compiles Mustaqbalat on the fly into a `0-byte` drag-and-drop `Bookmarklet`, an automatic `Userscript`, or an ultra-compact `.zip` browser extension while measuring live KB memory and sub-millisecond CPU impact over days and weeks.

---

## 2. Complete Functional Specifications

| Capability Area | Technical Implementation Details |
| :--- | :--- |
| **Default-On Scope & Exclusions** | Injects automatically at `document_start` prior to first paint to eliminate bright white flashes across `<all_urls>` and `all_frames`, complete with a global master switch and per-hostname site exclusions (`excludedSites`). |
| **Bidirectional Brightness Control** | Continuous luminance range from `20%` (deep night dimming) through `100%` (native baseline) up to `150%` (brightness boost for dim displays), backed by 5 instant preset chips. |
| **Viewport Overlay Layers & Modes** | Independent full-viewport dimming overlay (`0%–85%`, `pointer-events: none`) with three compositing modes: `hybrid` (GPU filter + overlay), `overlay` only, or `filter` only, plus white-glare reduction and text contrast sliders. |
| **Webpage & PDF Dark Mode Profiles** | Four calibrated modes: `smart` (inverts bright surfaces while counter-inverting `img`, `video`, `picture`, and `canvas` media), `warm-dark`, `amoled` deep black, and `pdf-dark` tailored for white PDF pages. |
| **Advanced Color Studio (`HEX` & Wheel)** | Pixel-cached mathematical `Canvas` color wheel, validated `#HEX` input, native screen `EyeDropper API`, `RGB` channel sliders, 6 `mix-blend-mode` options, 8 preset visual-comfort swatches, and underlying page warmth, saturation, and hue-rotation sliders. |
| **PDF Dimming & Zero-Storage Reader** | Automatic detection of `.pdf` URLs and `<embed type="application/pdf">` plugins with dedicated extra PDF dimming, plus a built-in drag-and-drop `PDF` viewer reading local files strictly in browser RAM (`Blob URL` — `0 bytes` disk storage). |
| **Live HUD & Days/Weeks Analytics** | Collapsible `In-Page HUD` displaying live footprint (`~18 KB`), CPU apply time (`~0.20 ms`), and `FPS`, backed by a full 2D Canvas dashboard tracking usage across `7d`, `14d`, `4w`, and `8w` windows with JSON export. |
| **Zero-Disk-Space Web Converter** | Compiles customized presets directly in browser RAM into three targets: `0-byte` `Shadow DOM` `Bookmarklet`, `~8.5 KB` auto-run `Userscript`, or pure-JS binary `PKZIP / CRC-32` archives for Chromium and Firefox. |
| **GitHub Issue & Broken-Site Workflow** | Detects browser-restricted internal pages, maintains a local incompatible-sites log, and generates pre-populated diagnostic `GitHub Issues` (via direct URL form or optional `GitHub REST API` token). |

---

## 3. Technology Stack & Tooling

Built exclusively on open web standards and built-in runtime APIs with zero third-party packages:
- **Extension Standard:** `WebExtensions Manifest V3` (compatible with Chrome, Edge, Brave, Opera, and Firefox 109+).
- **Languages & Web APIs:** `HTML5`, `CSS3 Custom Properties & Blend Modes`, `Vanilla JavaScript (ES2020+)`, `Shadow DOM API`, `HTML5 2D Canvas API`, `EyeDropper API`, `Blob & URL Object APIs`, `TypedArrays (Uint8Array / DataView)`.
- **Local Preview & Validation:** `Node.js` built-in core modules (`http`, `fs`, `path`, `vm`) with `0` external `npm` packages.
- **CI/CD Pipeline:** `GitHub Actions` (`.github/workflows/pages.yml`) running automated validation prior to `GitHub Pages` deployment.

---

## 4. Quick Start & Operational Modes

For exhaustive control-by-control instructions, see the **[Complete User Guide (`docs/en/USER_GUIDE.md`)](./docs/en/USER_GUIDE.md)**. Summary of immediate launch options:

### Option A: Zero-Download / Zero-Disk-Space Usage (For Low-Storage Devices)
1. Open the live web studio (`index.html` via preview or `GitHub Pages`).
2. Navigate to the **Zero-Disk-Space Web Add-on Converter** section.
3. Choose your preferred initial presets, then drag the orange **Mustaqbalat — Visual Comfort** button onto your browser's `Bookmarks Bar` (`0 bytes` on disk), or generate the automatic `.user.js` script in one click.

### Option B: Full Browser Extension Installation (`extension/`)
1. Open your browser's extensions page (`chrome://extensions`, `edge://extensions`, or `brave://extensions`).
2. Enable **Developer mode**.
3. Click **Load unpacked** and select the `extension/` folder from this repository (or extract an in-RAM `.zip` generated by the studio converter).

### Option C: Local Developer Preview & Automated Validation
```bash
# Run automated Manifest V3, JS syntax (vm.Script), and Bookmarklet validation
npm test

# Start the zero-dependency local HTTP server on port 3000
npm start
```

---

## 5. How It Was Built & Line-by-Line Code Commentary

- **Written Engineering Reference:** A comprehensive written-only deep dive into how every algorithm, compositing pipeline, color wheel, telemetry ledger, and binary `PKZIP` builder was constructed is available in **[`docs/en/HOW_IT_WAS_BUILT.md`](./docs/en/HOW_IT_WAS_BUILT.md)**.
- **Line-by-Line Technical Commentary Across Source Files:** Every single one of the 16 code, style, markup, and workflow files (`10,088` total lines across `.js`, `.css`, `.html`, and `.yml`) contains line-by-line technical commentary explaining what each line does, how it relates to the preceding line, and how it connects to the system—mechanically verified against the original snapshot with **`0` deleted original code lines**.
- **Strict JSON Line-by-Line Reference:** Because `RFC 8259` forbids comments inside `.json` files, every line of `extension/manifest.json`, `messages.json`, `manifest.webmanifest`, and `package.json` is documented line-by-line in **[`docs/en/JSON_CONFIGS_LINE_BY_LINE.md`](./docs/en/JSON_CONFIGS_LINE_BY_LINE.md)**.

---

## 6. Project Structure Map & Developer Modification Guide

Below is the high-level repository layout. For the complete inter-module data graph and exact **"Where to Edit What"** instructions, consult **[`docs/en/ARCHITECTURE.md`](./docs/en/ARCHITECTURE.md)** and **[`CONTRIBUTING.en.md`](./CONTRIBUTING.en.md)**:

```text
Mustaqbalat/
├── extension/                  # Complete Manifest V3 Browser Extension package
│   ├── core/                   # Core visual engine (mustaqbalat-engine.js)
│   ├── background/             # MV3 Service Worker & daily/weekly ledger (service-worker.js)
│   ├── popup/                  # 4-tab RTL popup controller UI (HTML / CSS / JS)
│   ├── pages/                  # Multi-week analytics dashboard + zero-storage RAM PDF viewer
│   ├── _locales/ar/            # Official localization catalog
│   └── icons/                  # Extension icons (16, 32, 48, 128)
├── converter/                  # In-RAM Web Add-on Converter (Bookmarklet / Userscript / PKZIP)
├── scripts/                    # Automated syntax & package validator (validate-and-convert.js)
├── assets/sponsors/            # Customizable SVG logos (Murtakiz Community + Qabilah)
├── docs/ar/ & docs/en/         # Modular 1:1 bilingual engineering & user documentation
├── index.html & studio.js      # Live interactive web studio & popup simulator bridge
└── server.js & package.json    # Zero-dependency HTTP preview server & test scripts
```

---

## 7. Community Sponsorship & Official Contact Channels

For full details and logo customization instructions, see **[`docs/en/COMMUNITY_AND_CONTACT.md`](./docs/en/COMMUNITY_AND_CONTACT.md)**.

### A. Official Community Sponsor: The Community on Murtakiz

<p align="left">
  <a href="https://murtakiz.com" target="_blank" rel="noopener noreferrer">
    <img src="./assets/sponsors/murtakiz-logo.svg" alt="Murtakiz Community — Official Community Sponsor" height="54" />
  </a>
</p>

The **Community on Murtakiz (`مجتمع مرتكز`)** serves as the **Official Community Sponsor** of Mustaqbalat. In this capacity, the Murtakiz community showcases Mustaqbalat on its community page to users, introduces visitors to what this project is and the visual-comfort and low-storage challenges it solves, demonstrates how to run it across browsers, and connects users with the project's official issue and contribution channels.

### B. Connect via Qabilah & Custom Logo Support

<p align="left">
  <a href="https://qabilah.com" target="_blank" rel="noopener noreferrer">
    <img src="./assets/sponsors/qabilah-logo.svg" alt="Connect via Qabilah" height="54" />
  </a>
</p>

- **Qabilah Contact Link:** [`https://qabilah.com`](https://qabilah.com)
- **Adding or Replacing Qabilah's Official Logo:** The dedicated asset path `./assets/sponsors/qabilah-logo.svg` is pre-wired across both Arabic and English documentation so Qabilah's official logo file can be dropped in or replaced in place at any time without modifying Markdown references.

### C. Official Repository & Direct Inquiry Links

- **GitHub Repository:** [`https://github.com/Mohamed7AbdELhalim/Mustaqbalat`](https://github.com/Mohamed7AbdELhalim/Mustaqbalat)
- **Bug & Incompatible-Website Tracker (GitHub Issues):** [`https://github.com/Mohamed7AbdELhalim/Mustaqbalat/issues`](https://github.com/Mohamed7AbdELhalim/Mustaqbalat/issues)
- **Direct Inquiry & Contact Email:** [`algorithm-platforms.figment413@passinbox.com`](mailto:algorithm-platforms.figment413@passinbox.com)

---

## 8. License

Released as free and open-source software under the **[MIT License](./LICENSE)**.
