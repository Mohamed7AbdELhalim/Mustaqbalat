> **تنبيه النسخة العربية:** تتوفر النسخة العربية الأصلية المطابقة تماماً لسجل الإصدارات في **[`CHANGELOG.md`](./CHANGELOG.md)**. | **[الصفحة الرئيسية بالعربية](./README.md)**

# Technical Changelog

All notable architectural and functional changes to **Mustaqbalat** are documented in this file following `Semantic Versioning`.

---

## [1.0.0] — 2026-10-30

### Core Visual Engine & `Manifest V3` Browser Extension
- Built the core dimming and compositing engine (`extension/core/mustaqbalat-engine.js`) injecting by default at `document_start` across `<all_urls>` and `all_frames`.
- Implemented bidirectional screen luminance control: brightness reduction (`20%–99%`) and brightness boost (`101%–150%`).
- Added independent fixed viewport `Overlay Layers` supporting three execution modes (`hybrid`, `overlay`, `filter`).
- Implemented four Dark Mode profiles (`smart`, `warm-dark`, `amoled`, `pdf-dark`) with media counter-inversion preserving natural image and video colors.
- Built the Advanced Color Studio featuring an interactive mathematical `Canvas` color wheel, `HEX` code input, native `EyeDropper`, `RGB` sliders, 6 CSS blend modes, 8 preset visual-comfort palettes, and underlying page warmth/saturation/hue-rotation controls.
- Added automatic `PDF` detection and extra dimming alongside a zero-storage in-RAM `PDF` dimmer/reader (`0 bytes` written to disk).
- Implemented global master toggle, per-hostname site exclusions (`excludedSites`), and browser-restricted scheme detection.

### Live Resource Telemetry & Multi-Week Analytics
- Built the collapsible `In-Page Resource HUD` reporting real-time KB footprint, sub-millisecond CPU apply duration, and live `FPS`.
- Built the `MV3` background `Service Worker` (`service-worker.js`) and full analytics dashboard (`dashboard.html` / `dashboard.js`) tracking resource consumption across `7d`, `14d`, `4w`, and `8w` horizons with JSON export.

### Zero-Disk-Space Web Add-on Converter & GitHub Integration
- Engineered `converter/web-addon-converter.js` to compile `0-byte` `Shadow DOM` Bookmarklets, automatic `*://*/*` Userscripts, and pure-JS binary `PKZIP` extension archives directly in browser RAM with zero external libraries.
- Integrated 1-click `GitHub Issues` bug and incompatible-website reporting backed by structured repository issue templates.

### Line-by-Line Code Commentary & 1:1 Bilingual Documentation Suite
- Added exhaustive line-by-line Arabic technical comments across all 16 source, style, markup, and workflow files (`10,088` annotated lines) verified against the baseline snapshot with `0` deleted code lines.
- Published complete 1:1 Arabic and English documentation covering User Guide, Written Build Reference, Architecture & Developer Modification Map, Line-by-Line JSON Reference, Contribution Manual, Security Policy, Code of Conduct, Official Community Sponsorship (**Murtakiz**), and **Qabilah** / email contact channels.
