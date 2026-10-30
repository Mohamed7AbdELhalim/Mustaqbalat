> **تنبيه النسخة العربية:** تتوفر النسخة العربية الأصلية المطابقة تماماً لهذا المرجع الهندسي في **[`docs/ar/HOW_IT_WAS_BUILT.md`](../ar/HOW_IT_WAS_BUILT.md)**. | **[الصفحة الرئيسية بالعربية](../../README.md)**

# How Mustaqbalat Was Built (Written Engineering Reference)

This document explains in pure written technical detail how **Mustaqbalat** was engineered from scratch, the rationale behind every architectural choice, mathematical formula, and file boundary, and how the entire system was constructed with **zero external dependencies (`0 npm dependencies`)** and zero bundler overhead to respect strict disk-storage constraints.

---

## 1. Foundational Engineering Principle: Zero-Dependency Architecture

Instead of relying on frontend frameworks (such as React or Vue), build bundlers (such as Webpack or Vite), or third-party charting and archive libraries that require downloading hundreds of megabytes into `node_modules`, Mustaqbalat was built exclusively on standard browser `Web Platform APIs` and built-in `Node.js` core modules for three engineering reasons:
1. **Minimal Disk and RAM Footprint:** Extension runtime assets execute directly in tens of kilobytes rather than multi-megabyte bundled artifacts.
2. **Zero Mandatory Build Step:** Any edit made by a contributor to a `.js`, `.css`, or `.html` file runs immediately in the browser without an intermediate compilation pipeline.
3. **In-RAM Self-Compilation:** Because the source code uses clean, standard JavaScript, the browser-side converter can read the runtime source as plain text and compile it directly in browser RAM into a `Bookmarklet`, a `Userscript`, or a binary `PKZIP` extension package without any backend build server.

---

## 2. Building the Core Visual & Dimming Engine (`extension/core/mustaqbalat-engine.js`)

The core engine was structured as a universal isolated IIFE `(function (global) { "use strict"; ... })(typeof window !== "undefined" ? window : globalThis)` capable of operating identically as a browser `Content Script` and as a direct runtime script inside the web studio:

### A. Eliminating White Flash at `document_start`
`extension/manifest.json` configures the content script with `"run_at": "document_start"`, `"matches": ["<all_urls>"]`, and `"all_frames": true`. Because `document.body` often does not yet exist at `document_start`, `ensureDomScaffold()` mounts the root layer container (`#mustaqbalat-root-layers`) directly onto `document.documentElement` (`<html>`), ensuring luminance reduction takes effect before the browser paints its first bright frame.

### B. Hybrid GPU Filter + Fixed Viewport Overlay Pipeline
Relying solely on CSS filters fails to cover native browser PDF `<embed>` plugins consistently, whereas relying solely on dark overlay divs cannot boost brightness above `100%` or adjust native page color warmth/saturation. `applyVisualSettings()` solves both limitations via a dual compositing pipeline:
1. **Root GPU Filter Path (`html.mustaqbalat-active-filter`):** Composes `brightness()`, `contrast()`, `sepia()`, `saturate()`, and `hue-rotate()` directly on the root element for hardware-accelerated GPU execution—supporting both **brightness reduction (`20%–99%`)** and **brightness boost (`101%–150%`)**.
2. **Fixed Viewport Overlay Path (`#mustaqbalat-dim-layer` & `#mustaqbalat-tint-layer`):** Two fixed full-viewport layers (`position: fixed; inset: 0; pointer-events: none; z-index: 2147483645`—one step below the 32-bit signed integer maximum reserved for the HUD) apply clean alpha dimming and `mix-blend-mode` color tinting without intercepting mouse clicks, scrolling, or text selection.

### C. Smart Dark Mode Without Expensive DOM Tree Traversal
Conventional dark-mode extensions iterate over thousands of DOM nodes calling `getComputedStyle`, causing layout thrashing and high CPU/memory usage. Mustaqbalat avoids DOM scanning completely by combining a root-level color inversion (`invert(0.92) hue-rotate(180deg)`) with targeted **counter-inversion rules** strictly matching visual media selectors:
`img, video, picture, canvas, svg image, [style*="background-image"], iframe[src*="youtube.com"], iframe[src*="vimeo.com"]`
Inverting the document once and counter-inverting media elements with a `180deg` hue rotation restores natural image and video colors mathematically in under `0.3 ms` regardless of page complexity.

### D. PDF Detection and Zero-Storage In-RAM PDF Reader
`detectPdfPage()` checks three structural signals: `.pdf` URL suffixes, `document.contentType === "application/pdf"`, and embedded `<embed type="application/pdf">` elements. When detected, `pdfExtraDim` adds dedicated dimming over bright white document backgrounds. Furthermore, `extension/pages/pdf-viewer.html` and `pdf-viewer.js` load local user PDF files via `URL.createObjectURL(file)` inside a controlled `<iframe>` beneath dedicated dimmer and tint layers, revoking prior object URLs via `URL.revokeObjectURL` on file replacement so zero bytes are written to disk and no RAM leaks occur.

---

## 3. Building the Mathematical Color Wheel & HEX Studio (`extension/popup/popup.js`)

To provide full color control without importing external color-picker packages:
1. `hslToRgb(h, s, l)` converts polar coordinates for every pixel inside the `132×132` `<canvas>` circle—where angle `atan2(dy, dx)` maps to `Hue` (`0°–360°`) and radial distance `dist / radius` maps to `Saturation`—into integer `R, G, B` values.
2. To avoid recalculating `17,424` pixels on every mouse drag event, the computed `ImageData` buffer is cached once in `wheelImageCache`. Subsequent drag frames blit the cached wheel via `ctx.putImageData(wheelImageCache, 0, 0)` and draw the center preview ring in under `0.1 ms`.
3. All four color inputs (Canvas wheel, regex-validated 3/6-digit `HEX` text input, native `window.EyeDropper` screen sampler, and `R/G/B` sliders) funnel through a single synchronization function `applyNewHexColor(hex, autoEnableTint)` to keep all controls strictly consistent.

---

## 4. Building the Telemetry HUD & Multi-Week Resource Analytics

Resource monitoring was built across two layers without external charting libraries:
1. **Live In-Page HUD:** Measures exact `applyVisualSettings()` CPU execution duration using high-resolution `performance.now()`, computes live `FPS` via a lightweight `requestAnimationFrame` counter, calculates serialized storage footprint in KB and injected DOM node count, and renders them inside a collapsible corner HUD.
2. **Historical Aggregation & 2D Canvas Charts (`service-worker.js` + `dashboard.js`):**
   - Every `60 seconds` of active visible tab usage (`document.visibilityState === "visible"`), the engine dispatches a usage delta to `service-worker.js`, which aggregates metrics under ISO date keys (`YYYY-MM-DD`) in `mustaqbalat_usage_v1` while pruning entries older than `90 days`.
   - `extension/pages/dashboard.js` implements a custom 2D `<canvas>` chart renderer that slices daily series (`7d`, `14d`) or rolls consecutive 7-day windows into weekly buckets (`4w`, `8w`), drawing gradient bars, CPU trend overlays, KPI summaries, and tabular breakdowns alongside a non-destructive `8-week` simulation toggle (`generateDemoHistory`) that never overwrites real stored data.

---

## 5. Building the Zero-Disk-Space Converter & Binary `PKZIP` Assembler (`converter/`)

The converter directly addresses tight local disk constraints through three pure-JS mechanisms:
1. **Shadow DOM Web Widget (`converter/web-widget-runtime.js`):** A self-contained runtime that mounts its floating control UI inside an isolated `ShadowRoot` (`attachShadow({ mode: "open" })`) so host website stylesheets can never distort its layout or typography.
2. **Bookmarklet & Userscript Compiler (`converter/web-addon-converter.js`):**
   - Fetches `web-widget-runtime.js` as text, runs a string-safe minifier (`minifyJsPreservingStrings`) that strips comments and blank lines without corrupting string literals or `https://` URLs, injects user presets via `window.__MUSTAQBALAT_PRESET__`, and encodes the result into a `0-byte` `javascript:...` Bookmarklet URI.
   - Wraps the same self-contained runtime with standard `==UserScript==` metadata (`@match *://*/*`, `@match file:///*.pdf`, `@run-at document-start`) for automatic execution in userscript managers.
3. **Zero-Library Binary `PKZIP` Builder (`buildZipBlob`):**
   - Instead of bundling `JSZip` (~90+ KB), `web-addon-converter.js` computes IEEE 802.3 `CRC-32` checksums (`0xEDB88320` polynomial) over `Uint8Array` buffers and writes PKZIP Local File Headers (`0x04034b50`), Central Directory Headers (`0x02014b50`), and the End of Central Directory Record (`0x06054b50`) via `DataView` directly in RAM, outputting valid Chrome/Edge/Brave and Firefox Manifest V3 `.zip` packages on the fly.

---

## 6. Building the Live Simulator Bridge & Automated Validator (`studio.js` & `scripts/validate-and-convert.js`)

1. **Live Simulator Bridge (`studio.js`):** Embeds the real extension popup (`extension/popup/popup.html`) inside an `<iframe>` on `index.html` and bridges storage writes via `window.postMessage` (`MUSTAQBALAT_STUDIO_SYNC`) directly into `window.MustaqbalatEngine` on the host page so visitors can test every slider, dark mode, PDF sheet, and `HEX` wheel live before installing anything.
2. **Automated Validation Suite (`scripts/validate-and-convert.js`):** Uses strictly built-in `Node.js` modules (`fs`, `path`, `vm`) via `npm test` to validate `manifest.json` structure, verify every referenced asset and icon, parse every JavaScript file through `new vm.Script(code)`, and compile, decode, and syntax-verify the generated Bookmarklet payload.
