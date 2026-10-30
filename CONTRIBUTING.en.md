> **تنبيه النسخة العربية:** تتوفر النسخة العربية الأصلية المطابقة تماماً لدليل المساهمة في **[`CONTRIBUTING.md`](./CONTRIBUTING.md)**. | **[الصفحة الرئيسية بالعربية](./README.md)**

# Contributing to Mustaqbalat

This manual defines the engineering invariants and procedural steps required to contribute to the **Mustaqbalat** repository. Read and follow every requirement below before opening a Pull Request or submitting architectural changes.

---

## 1. Mandatory Project Engineering Invariants

Mustaqbalat is engineered for devices with strict storage and memory limits. Every contribution must preserve four non-negotiable invariants:
1. **Zero External Dependencies (`0 npm dependencies`):** Never add packages to `dependencies` or `devDependencies` in `package.json`. Implement all features strictly with native browser `Web APIs` and built-in `Node.js` core modules for CLI validation/serving.
2. **No-Build Direct Execution:** Every file under `extension/` and `converter/` must execute directly in the browser without requiring bundlers or transpilers (`Webpack`, `Vite`, `Rollup`, `TypeScript`).
3. **Line-by-Line Technical Commentary & Non-Destructive Edits:** Source files maintain exhaustive line-by-line Arabic technical comments explaining each line, its relation to the preceding line, and its role in the system. Document newly added lines with the same serious technical precision, and never delete existing working functionality or valid commentary arbitrarily.
4. **Strict 1:1 Arabic/English Documentation Parity:** Any user-facing or architecture-facing change must be updated identically in both the primary Arabic document (`README.md` or `docs/ar/*`) and its English mirror (`README.en.md` or `docs/en/*`).

---

## 2. Contribution Categories & Exact Implementation Paths

This section covers every type of contribution a developer may submit:

### A. Fixing Website Compatibility Issues (Dimming or Dark Mode)
1. Check open issues labeled `incompatible-site` in `GitHub Issues`.
2. Identify the root DOM/CSS conflict (e.g., competing maximum `z-index` stacking contexts, background video overlays, or `<canvas>` elements double-inverting under Smart Dark Mode).
3. Implement targeted adjustments in `extension/core/mustaqbalat-engine.js` via `buildDarkModeCss()` or `getEffectiveSettings()`, ensuring `lastApplyMs` stays well below `1 ms`.

### B. Enhancing Brightness Filters, Viewport Overlays, or PDF Support
1. When modifying luminance bounds (`20%–150%`) or overlay composition:
   - Update `extension/core/mustaqbalat-engine.js` (`DEFAULT_SETTINGS` and `applyVisualSettings`).
   - Keep `min`/`max` slider attributes consistent across `extension/popup/popup.html`, `extension/pages/pdf-viewer.html`, and `converter/web-widget-runtime.js`.
2. When extending the built-in PDF viewer (`extension/pages/pdf-viewer.js`), preserve `URL.createObjectURL` and `URL.revokeObjectURL` lifecycle management so disk consumption remains `0 bytes`.

### C. Adding Color Palettes or Extending the `HEX` & Color Wheel Studio
1. To add visual-comfort color presets: append descriptors to `PRESET_PALETTES` in `extension/popup/popup.js` and verify grid layout in `extension/popup/popup.css`.
2. When modifying `drawColorWheel()`, preserve `wheelImageCache` pixel caching so mouse-drag color picking does not recompute pixel buffers per frame.

### D. Extending the Live In-Page HUD or Multi-Week Usage Analytics
1. Maintain backward compatibility with existing `mustaqbalat_usage_v1` records by falling back cleanly when reading new properties (`item.newField || 0`).
2. Keep the 90-day automatic pruning window intact inside `extension/background/service-worker.js` to bound browser storage growth.

### E. Modifying the Zero-Disk-Space Converter & In-RAM `PKZIP` Packager (`converter/`)
1. Changes in `converter/web-widget-runtime.js` must remain compatible with `minifyJsPreservingStrings()` in `converter/web-addon-converter.js`.
2. Verify that compiled Bookmarklet payloads pass automated URI decoding and `vm.Script` syntax validation in `scripts/validate-and-convert.js` (specifically avoid placing literal `*/` sequences inside `/* ... */` block comments).

### F. Improving Documentation, Localization, or Issue Templates
1. Maintain a formal, serious, factual engineering tone free of marketing hype or fluff.
2. Verify all relative Markdown links across `README.md`, `README.en.md`, `docs/ar/`, and `docs/en/`.

---

## 3. Zero-Install Local Development Setup

Because the repository has zero external dependencies, `npm install` is unnecessary:

```bash
# 1. Clone the repository
git clone https://github.com/Mohamed7AbdELhalim/Mustaqbalat.git
cd Mustaqbalat

# 2. Run automated validation to verify baseline integrity
npm test

# 3. Start the local HTTP preview server on port 3000
npm start
```

Open `http://localhost:3000` to test the live studio, popup simulator bridge, zero-space converter, RAM PDF viewer, and analytics dashboard—or load `extension/` directly via **Load unpacked** in your browser.

---

## 4. Mandatory Pre-PR Verification Checklist

Before submitting a Pull Request, verify every item below:

- [ ] `npm test` exits with code `0` (all Manifest V3 checks, asset checks, `vm.Script` syntax checks, and decoded Bookmarklet compilation checks pass).
- [ ] Zero external dependencies, `node_modules`, or build artifacts were introduced.
- [ ] Canonical storage keys (`mustaqbalat_settings_v1`, `mustaqbalat_usage_v1`, `mustaqbalat_broken_sites_v1`) remain unchanged so existing user data is preserved.
- [ ] Changes function identically in both Browser Extension context (`chrome.*`) and Web Studio Simulator context (`localStorage` + `postMessage`).
- [ ] All newly added lines include clear Arabic technical comments without deleting existing code.
- [ ] Both Arabic and English documentation files were updated in 1:1 parity where applicable.

---

## 5. Commit Message & Pull Request Conventions

Use concise, technical commit subjects describing the exact subsystem and change:
- `fix(engine): preserve SVG canvas colors in smart dark mode`
- `feat(pdf): add keyboard brightness shortcuts in RAM PDF viewer`
- `docs(bilingual): document new site-override rule in AR and EN guides`

Complete all sections of `.github/PULL_REQUEST_TEMPLATE.md` including problem statement, technical approach, and `npm test` output.
