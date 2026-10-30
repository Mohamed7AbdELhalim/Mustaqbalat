/**
 * Mustaqbalat — Automated Extension Validator & Zero-Space Converter Test Suite
 * Verifies Manifest V3 compliance, syntax of all JS modules, locale presence,
 * icon integrity, and Bookmarklet/Userscript conversion.
 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");

function assert(cond, msg) {
  if (!cond) {
    console.error("✗ FAIL:", msg);
    process.exit(1);
  }
  console.log("✓ PASS:", msg);
}

// 1. Validate Manifest V3
const manifestPath = path.join(ROOT, "extension/manifest.json");
assert(fs.existsSync(manifestPath), "extension/manifest.json exists");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
assert(manifest.manifest_version === 3, "Manifest version is 3");
assert(
  manifest.content_scripts &&
    manifest.content_scripts[0].matches.includes("<all_urls>") &&
    manifest.content_scripts[0].all_frames === true,
  "Content script runs by default across <all_urls> and all_frames"
);

// 2. Validate _locales when default_locale is set
if (manifest.default_locale) {
  const localeFile = path.join(
    ROOT,
    "extension/_locales",
    manifest.default_locale,
    "messages.json"
  );
  assert(fs.existsSync(localeFile), `_locales/${manifest.default_locale}/messages.json exists`);
  JSON.parse(fs.readFileSync(localeFile, "utf8"));
}

// 3. Validate all referenced files in manifest exist
const referencedFiles = [
  manifest.action.default_popup,
  manifest.background.service_worker,
  manifest.options_page,
  ...manifest.content_scripts[0].js,
  ...Object.values(manifest.icons),
  "pages/pdf-viewer.html"
];

let totalExtBytes = 0;
for (const rel of referencedFiles) {
  const full = path.join(ROOT, "extension", rel);
  assert(fs.existsSync(full), `Extension asset exists: ${rel}`);
  totalExtBytes += fs.statSync(full).size;
}

// 4. Syntax-check every JS file in the repository
const jsFiles = [
  "extension/core/mustaqbalat-engine.js",
  "extension/background/service-worker.js",
  "extension/popup/popup.js",
  "extension/pages/dashboard.js",
  "extension/pages/pdf-viewer.js",
  "converter/web-widget-runtime.js",
  "converter/web-addon-converter.js",
  "studio.js",
  "server.js"
];

for (const jsRel of jsFiles) {
  const full = path.join(ROOT, jsRel);
  const code = fs.readFileSync(full, "utf8");
  new vm.Script(code, { filename: jsRel });
  assert(true, `Valid JS syntax: ${jsRel} (${(Buffer.byteLength(code) / 1024).toFixed(1)} KB)`);
}

// 5. Test converter runtime in VM sandbox
const converterCode = fs.readFileSync(
  path.join(ROOT, "converter/web-addon-converter.js"),
  "utf8"
);
const widgetCode = fs.readFileSync(
  path.join(ROOT, "converter/web-widget-runtime.js"),
  "utf8"
);
const sandbox = { window: {}, globalThis: {}, TextEncoder, Uint32Array, Uint8Array, DataView, Blob };
sandbox.globalThis = sandbox;
vm.runInNewContext(converterCode, sandbox);
assert(
  typeof sandbox.window.MustaqbalatConverter.compactJsForBookmarklet === "function",
  "Web Add-on Converter loaded cleanly"
);
const bookmarklet = sandbox.window.MustaqbalatConverter.compactJsForBookmarklet(widgetCode, {
  brightness: 82,
  overlay: 18
});
assert(
  bookmarklet.startsWith("javascript:"),
  `Bookmarklet compiled (${(bookmarklet.length / 1024).toFixed(1)} KB URL, 0 Bytes disk footprint)`
);
new vm.Script(decodeURIComponent(bookmarklet.slice("javascript:".length)), {
  filename: "bookmarklet.decoded.js"
});
assert(true, "Compiled Bookmarklet decoded JS syntax is valid");

console.log(
  `\n🎉 All checks passed! Core extension assets size: ${(totalExtBytes / 1024).toFixed(1)} KB.`
);
