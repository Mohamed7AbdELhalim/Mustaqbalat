/**
 * Mustaqbalat — Zero-Disk-Space Web-to-Extension & Instant Web Add-on Converter
 * Converts the tool in-memory (0 server/SDK required) into:
 *  1) Zero-Storage Bookmarklet (0 Bytes on disk — drag & drop to browser bar)
 *  2) Auto-Run All-Sites Userscript (.user.js — runs by default on all URLs)
 *  3) Packed Browser Extension (.zip Manifest V3 for Chrome/Edge/Brave & Firefox)
 *  4) Installable Web App Manifest (PWA shortcut)
 */
(function (globalScope) {
  "use strict";

  const EXTENSION_FILES = [
    "manifest.json",
    "_locales/ar/messages.json",
    "core/mustaqbalat-engine.js",
    "background/service-worker.js",
    "popup/popup.html",
    "popup/popup.css",
    "popup/popup.js",
    "pages/dashboard.html",
    "pages/dashboard.js",
    "pages/pdf-viewer.html",
    "pages/pdf-viewer.js",
    "icons/icon16.png",
    "icons/icon32.png",
    "icons/icon48.png",
    "icons/icon128.png"
  ];

  // Lightweight safe JS compressor for Bookmarklets (strips comments & excess whitespace)
  function compactJsForBookmarklet(source, presetObj) {
    const presetLine = presetObj
      ? `window.__MUSTAQBALAT_PRESET__=${JSON.stringify(presetObj)};`
      : "";
    const noBlockComments = source.replace(/\/\*[\s\S]*?\*\//g, "");
    const lines = noBlockComments
      .split("\n")
      .map((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith("//")) return "";
        return trimmed;
      })
      .filter(Boolean);
    const body = presetLine + lines.join("\n").replace(/\s{2,}/g, " ");
    return "javascript:" + encodeURIComponent(`(function(){${body}})();`);
  }

  function buildUserscriptSource(widgetSource, presetObj) {
    const presetLine = presetObj
      ? `window.__MUSTAQBALAT_PRESET__ = ${JSON.stringify(presetObj)};`
      : "";
    return [
      "// ==UserScript==",
      "// @name         مستقبلات للراحة البصرية | Mustaqbalat Web Add-on",
      "// @namespace    https://github.com/Mohamed7AbdELhalim/Mustaqbalat",
      "// @version      1.0.0",
      "// @description  يعمل افتراضياً على كل الصفحات لتقليل/زيادة السطوع، طبقات التعتيم، الوضع الداكن، ألوان HEX، ودعم PDF باستهلاك شبه صفري.",
      "// @author       Mustaqbalat",
      "// @match        *://*/*",
      "// @match        file:///*.pdf",
      "// @run-at       document-idle",
      "// @grant        none",
      "// ==/UserScript==",
      "",
      presetLine,
      widgetSource
    ].join("\n");
  }

  // Pure-JS CRC32 + PKZIP encoder (0 dependencies, works in any modern browser)
  const crcTable = (function () {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) {
        c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      }
      table[n] = c >>> 0;
    }
    return table;
  })();

  function crc32(bytes) {
    let crc = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) {
      crc = crcTable[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function createZipBlob(entries) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    for (const entry of entries) {
      const nameBytes = encoder.encode(entry.name);
      const dataBytes =
        entry.data instanceof Uint8Array ? entry.data : encoder.encode(String(entry.data));
      const crc = crc32(dataBytes);
      const size = dataBytes.length;

      // Local file header (30 bytes + name)
      const localHeader = new Uint8Array(30 + nameBytes.length);
      const lv = new DataView(localHeader.buffer);
      lv.setUint32(0, 0x04034b50, true); // signature
      lv.setUint16(4, 20, true);         // version needed
      lv.setUint16(6, 0x0800, true);     // UTF-8 flag
      lv.setUint16(8, 0, true);          // store method (0)
      lv.setUint16(10, 0, true);         // mod time
      lv.setUint16(12, 0x559e, true);    // mod date
      lv.setUint32(14, crc, true);
      lv.setUint32(18, size, true);
      lv.setUint32(22, size, true);
      lv.setUint16(26, nameBytes.length, true);
      lv.setUint16(28, 0, true);
      localHeader.set(nameBytes, 30);

      localParts.push(localHeader, dataBytes);

      // Central directory header (46 bytes + name)
      const centralHeader = new Uint8Array(46 + nameBytes.length);
      const cv = new DataView(centralHeader.buffer);
      cv.setUint32(0, 0x02014b50, true);
      cv.setUint16(4, 20, true);
      cv.setUint16(6, 20, true);
      cv.setUint16(8, 0x0800, true);
      cv.setUint16(10, 0, true);
      cv.setUint16(12, 0, true);
      cv.setUint16(14, 0x559e, true);
      cv.setUint32(16, crc, true);
      cv.setUint32(20, size, true);
      cv.setUint32(24, size, true);
      cv.setUint16(28, nameBytes.length, true);
      cv.setUint16(30, 0, true);
      cv.setUint16(32, 0, true);
      cv.setUint16(34, 0, true);
      cv.setUint16(36, 0, true);
      cv.setUint32(38, 0, true);
      cv.setUint32(42, offset, true);
      centralHeader.set(nameBytes, 46);

      centralParts.push(centralHeader);
      offset += localHeader.length + size;
    }

    const centralSize = centralParts.reduce((s, p) => s + p.length, 0);
    const eocd = new Uint8Array(22);
    const ev = new DataView(eocd.buffer);
    ev.setUint32(0, 0x06054b50, true);
    ev.setUint16(4, 0, true);
    ev.setUint16(6, 0, true);
    ev.setUint16(8, entries.length, true);
    ev.setUint16(10, entries.length, true);
    ev.setUint32(12, centralSize, true);
    ev.setUint32(16, offset, true);
    ev.setUint16(20, 0, true);

    return new Blob([...localParts, ...centralParts, eocd], { type: "application/zip" });
  }

  async function buildExtensionPackage({ targetBrowser = "chromium", customDefaults = null } = {}) {
    const entries = [];
    for (const relPath of EXTENSION_FILES) {
      const resp = await fetch(`./extension/${relPath}`);
      if (!resp.ok) throw new Error(`تعذر قراءة الملف: ${relPath}`);

      if (relPath.endsWith(".png")) {
        const buf = await resp.arrayBuffer();
        entries.push({ name: relPath, data: new Uint8Array(buf) });
      } else {
        let text = await resp.text();
        if (relPath === "manifest.json" && targetBrowser === "firefox") {
          const manifest = JSON.parse(text);
          // Firefox MV3 supports background.scripts alongside service_worker
          manifest.background = {
            scripts: ["background/service-worker.js"]
          };
          text = JSON.stringify(manifest, null, 2);
        }
        if (
          customDefaults &&
          (relPath === "core/mustaqbalat-engine.js" || relPath === "background/service-worker.js")
        ) {
          text = text.replace(
            "brightness: 88,",
            `brightness: ${Number(customDefaults.brightness) || 88},`
          );
          text = text.replace(
            "overlayOpacity: 14,",
            `overlayOpacity: ${Number(customDefaults.overlay) ?? 14},`
          );
          if (customDefaults.tintColor) {
            text = text.replace(
              'tintColor: "#F59E0B",',
              `tintColor: "${customDefaults.tintColor}",`
            );
          }
        }
        entries.push({ name: relPath, data: text });
      }
    }

    const blob = createZipBlob(entries);
    return {
      blob,
      sizeBytes: blob.size,
      fileCount: entries.length,
      entries: entries.map((e) => ({
        name: e.name,
        bytes: e.data instanceof Uint8Array ? e.data.length : new TextEncoder().encode(e.data).length
      }))
    };
  }

  async function generateWebAddons(presetObj) {
    const resp = await fetch("./converter/web-widget-runtime.js");
    const widgetSource = await resp.text();
    const bookmarkletHref = compactJsForBookmarklet(widgetSource, presetObj);
    const userscriptText = buildUserscriptSource(widgetSource, presetObj);

    return {
      bookmarkletHref,
      bookmarkletChars: bookmarkletHref.length,
      userscriptText,
      userscriptBytes: new Blob([userscriptText]).size
    };
  }

  globalScope.MustaqbalatConverter = {
    generateWebAddons,
    buildExtensionPackage,
    compactJsForBookmarklet
  };
})(typeof window !== "undefined" ? window : globalThis);
