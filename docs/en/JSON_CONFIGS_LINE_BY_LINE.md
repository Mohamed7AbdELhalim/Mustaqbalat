> **تنبيه النسخة العربية:** تتوفر النسخة العربية الأصلية المطابقة تماماً لهذا المرجع في **[`docs/ar/JSON_CONFIGS_LINE_BY_LINE.md`](../ar/JSON_CONFIGS_LINE_BY_LINE.md)**. | **[الصفحة الرئيسية بالعربية](../../README.md)**

# Line-by-Line Reference for JSON Configuration Files

Per `RFC 8259`, strict `.json` files prohibit inline `//` or `/* */` comments; inserting comments inside them causes Chromium/Firefox to reject `manifest.json` and `Node.js` to reject `package.json`. To ensure every single line across the entire repository is documented without exception, this reference explains all `117` lines across the four `.json` configuration files, how each line relates to the preceding line, and how it connects to the codebase.

> **Note:** All other 16 source, style, markup, and workflow files (`10,088` lines across `.js`, `.css`, `.html`, and `.yml`) contain exhaustive line-by-line technical commentary directly inside the source files themselves with zero lines of original code removed.

---

## 1. `extension/manifest.json` (70 Lines)

| Line | Original Line Content | Technical Purpose, Relation to Previous Line & Project Connection |
| :---: | :--- | :--- |
| 1 | `{` | Opens the root WebExtension descriptor object. |
| 2 | `"manifest_version": 3,` | Declares `Manifest V3` compliance required by modern Chromium browsers and supported by Firefox. |
| 3 | `"name": "مستقبلات للراحة البصرية \| Mustaqbalat",` | Defines the full display title shown in browser extension managers following the manifest version. |
| 4 | `"short_name": "مستقبلات",` | Provides the concise toolbar/UI short title derived from `name`. |
| 5 | `"version": "1.0.0",` | Sets the semantic version matching `package.json` and `CHANGELOG.en.md`. |
| 6 | `"description": "أداة خفيفة تعمل افتراضياً...",` | Summarizes core capabilities (brightness decrease/boost, overlays, dark mode, HEX, PDF, telemetry, GitHub). |
| 7 | `"default_locale": "ar",` | Binds the default localization bundle to `extension/_locales/ar/messages.json`. |
| 8 | `"permissions": [` | Opens the minimal browser API permission array. |
| 9 | `"storage",` | Grants access to `chrome.storage.local` for settings and usage history persistence. |
| 10 | `"activeTab",` | Enables safe interaction with the currently active tab when opening the popup. |
| 11 | `"tabs",` | Allows `popup.js` and `service-worker.js` to inspect tab URLs for PDF detection and per-site exclusions. |
| 12 | `"scripting",` | Allows `service-worker.js` to inject the engine into pre-existing open tabs right upon installation. |
| 13 | `"alarms"` | Enables lightweight 60-minute periodic alarms for pruning usage history without keeping background RAM resident. |
| 14 | `],` | Closes the API `permissions` array. |
| 15 | `"host_permissions": [` | Opens host origin permissions complementing API permissions. |
| 16 | `"<all_urls>"` | Authorizes automatic default-on operation across all webpages and PDF documents. |
| 17 | `],` | Closes `host_permissions`. |
| 18 | `"action": {` | Opens toolbar button configuration. |
| 19 | `"default_title": "مستقبلات للراحة البصرية...",` | Sets the hover tooltip on the browser toolbar icon. |
| 20 | `"default_popup": "popup/popup.html",` | Connects toolbar clicks to the 4-tab popup controller UI (`extension/popup/popup.html`). |
| 21 | `"default_icon": {` | Opens toolbar icon resolution mappings. |
| 22–25 | `"16".."128": "icons/icon*.png"` | Maps display pixel densities to the PNG assets in `extension/icons/`. |
| 26 | `}` | Closes `default_icon`. |
| 27 | `},` | Closes `action`. |
| 28–33 | `"icons": { "16".."128": ... },` | Registers package-level icons for browser management pages and store listings reusing the same four PNGs. |
| 34 | `"background": {` | Opens MV3 event-driven background configuration. |
| 35 | `"service_worker": "background/service-worker.js"` | Registers `extension/background/service-worker.js` as the non-persistent background worker. |
| 36 | `},` | Closes `background`. |
| 37 | `"content_scripts": [` | Opens automatic content-script injection descriptors. |
| 38 | `{` | Opens the primary engine content-script entry. |
| 39–41 | `"matches": [ "<all_urls>" ],` | Injects by default across all supported schemes and domains. |
| 42–44 | `"js": [ "core/mustaqbalat-engine.js" ],` | Loads the core visual dimming, dark-mode, PDF, HEX, and HUD engine. |
| 45 | `"run_at": "document_start",` | Executes prior to first paint to prevent bright white page flashes. |
| 46 | `"all_frames": true,` | Extends dimming layers and filters into nested `<iframe>` documents. |
| 47 | `"match_origin_as_fallback": true` | Covers dynamically created `about:blank` / `blob:` child frames inheriting site origins. |
| 48 | `}` | Closes the content-script entry. |
| 49 | `],` | Closes `content_scripts`. |
| 50 | `"options_page": "pages/dashboard.html",` | Maps the browser's Extension Options menu directly to the multi-week analytics dashboard. |
| 51–61 | `"web_accessible_resources": [ ... ],` | Exposes `pages/dashboard.html`, `pages/pdf-viewer.html`, and `icons/*` for safe navigation. |
| 62–68 | `"browser_specific_settings": { "gecko": { "id": "mustaqbalat@visual-comfort.org", "strict_min_version": "109.0" } }` | Declares the Gecko add-on identifier and minimum Firefox MV3 version (`109.0`). |
| 69–70 | `}` | Closes `extension/manifest.json`. |

---

## 2. `extension/_locales/ar/messages.json` (11 Lines)

| Line | Original Line Content | Technical Purpose, Relation to Previous Line & Project Connection |
| :---: | :--- | :--- |
| 1 | `{` | Opens the Arabic (`ar`) localization catalog referenced on line 7 of `manifest.json`. |
| 2 | `"extName": {` | Opens the localized extension title entry. |
| 3 | `"message": "مستقبلات للراحة البصرية \| Mustaqbalat",` | Defines the localized title string. |
| 4 | `"description": "اسم الإضافة"` | Documents the purpose of `extName` for localization tooling. |
| 5 | `},` | Closes `extName`. |
| 6 | `"extDescription": {` | Opens the localized extension summary entry. |
| 7 | `"message": "أداة خفيفة تعمل افتراضياً...",` | Defines the localized Arabic summary string. |
| 8 | `"description": "وصف الإضافة"` | Documents the purpose of `extDescription`. |
| 9 | `}` | Closes `extDescription`. |
| 10–11 | `}` | Closes `messages.json`. |

---

## 3. `manifest.webmanifest` (24 Lines)

| Line | Original Line Content | Technical Purpose, Relation to Previous Line & Project Connection |
| :---: | :--- | :--- |
| 1 | `{` | Opens the Progressive Web App (`PWA`) descriptor linked on line 9 of `index.html`. |
| 2 | `"name": "مستقبلات للراحة البصرية \| أداة التعتيم ومحول إضافات الويب",` | Full web app name when installed as a zero-storage browser shortcut. |
| 3 | `"short_name": "مستقبلات",` | Compact launcher label derived from `name`. |
| 4 | `"description": "منصة وأداة ويب خفيفة...",` | Summarizes the web studio and zero-disk-space add-on converter. |
| 5 | `"lang": "ar",` | Declares primary document language as Arabic. |
| 6 | `"dir": "rtl",` | Sets right-to-left layout direction matching `lang` on the preceding line. |
| 7 | `"start_url": "./index.html",` | Launches the main studio and converter page on startup. |
| 8 | `"display": "standalone",` | Opens in a clean standalone app window without browser chrome clutter. |
| 9 | `"background_color": "#070D19",` | Matches `--bg` in `index.html` so startup splash screens never flash white. |
| 10 | `"theme_color": "#0F172A",` | Colors the OS/window title bar in a low-glare dark slate tone. |
| 11–22 | `"icons": [ { "48x48" }, { "128x128" } ]` | Reuses `extension/icons/` PNG files directly so zero duplicate icon files consume repository space. |
| 23–24 | `}` | Closes `manifest.webmanifest`. |

---

## 4. `package.json` (12 Lines)

| Line | Original Line Content | Technical Purpose, Relation to Previous Line & Project Connection |
| :---: | :--- | :--- |
| 1 | `{` | Opens the Node.js project manifest (intentionally omitting `dependencies` and `devDependencies` for a 0-package footprint). |
| 2 | `"name": "mustaqbalat",` | Canonical lowercase package identifier. |
| 3 | `"version": "1.0.0",` | Synchronizes version metadata with `extension/manifest.json`. |
| 4 | `"description": "مستقبلات للراحة البصرية...",` | Technical summary of the extension and zero-space web converter. |
| 5 | `"private": true,` | Prevents accidental publication to the public `npm` registry. |
| 6 | `"scripts": {` | Opens standardized CLI commands used locally and in `.github/workflows/pages.yml`. |
| 7 | `"start": "node server.js",` | Starts the zero-dependency static HTTP preview server (`server.js`) on port `3000`. |
| 8 | `"dev": "node server.js",` | Alias for `start` providing a familiar development command. |
| 9 | `"test": "node scripts/validate-and-convert.js"` | Runs the automated MV3, asset, syntax (`vm.Script`), and Bookmarklet compiler test suite. |
| 10 | `}` | Closes `scripts`. |
| 11–12 | `}` | Closes `package.json`. |
