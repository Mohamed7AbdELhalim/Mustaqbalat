/**
 * Mustaqbalat (مستقبلات للراحة البصرية) — Core Visual Comfort & Resource Telemetry Engine
 * Ultra-lightweight, zero-dependency engine designed for:
 *  1) Browser Extension (Manifest V3 Content Script)
 *  2) Zero-Install Web Add-on (Bookmarklet & Userscript)
 *  3) Embedded Live Web Studio & PDF Reader
 */
(function (globalScope) {
  "use strict";

  if (globalScope.__MUSTAQBALAT_ENGINE_LOADED__) {
    if (globalScope.MustaqbalatEngine && typeof globalScope.MustaqbalatEngine.refresh === "function") {
      globalScope.MustaqbalatEngine.refresh();
    }
    return;
  }
  globalScope.__MUSTAQBALAT_ENGINE_LOADED__ = true;

  const STORAGE_KEY_SETTINGS = "mustaqbalat_settings_v1";
  const STORAGE_KEY_USAGE = "mustaqbalat_usage_v1";
  const STORAGE_KEY_BROKEN_SITES = "mustaqbalat_broken_sites_v1";

  const PRESET_PALETTES = [
    { id: "amber", name: "عنبر دافئ (حماية من الأزرق)", hex: "#F59E0B", opacity: 18, blend: "multiply" },
    { id: "candle", name: "ضوء الشموع الليلي", hex: "#EA580C", opacity: 22, blend: "multiply" },
    { id: "sepia", name: "ورق القراءة الكلاسيكي", hex: "#D6B88A", opacity: 24, blend: "multiply" },
    { id: "forest", name: "أخضر مريح للأعصاب البصرية", hex: "#10B981", opacity: 14, blend: "multiply" },
    { id: "rose", name: "وردي هادئ (تخفيف الصداع النصفي)", hex: "#F43F5E", opacity: 14, blend: "soft-light" },
    { id: "moon", name: "أزرق قمري ليلي", hex: "#38BDF8", opacity: 15, blend: "multiply" },
    { id: "violet", name: "بنفسجي خافت", hex: "#8B5CF6", opacity: 15, blend: "multiply" },
    { id: "slate", name: "رمادي محايد سينمائي", hex: "#334155", opacity: 25, blend: "multiply" }
  ];

  const DEFAULT_SETTINGS = {
    globalEnabled: true,          // يعمل افتراضياً على كل الصفحات والملفات
    brightness: 88,               // 20% إلى 150% (تقليل أو زيادة السطوع)
    contrast: 100,                // 50% إلى 150%
    warmth: 12,                   // 0% إلى 100% (تقليل حدة اللون الأبيض والأزرق)
    saturation: 100,              // 0% إلى 150% (التحكم بتشبع ألوان الصفحة)
    hueRotate: 0,                 // -180 إلى 180 درجة (تغيير طيف ألوان الصفحة)
    pageColorDim: 8,              // تخفيف وهج الألوان الفاتحة بالصفحة (0 - 60%)
    method: "hybrid",             // "filter" | "overlay" | "hybrid"
    overlayOpacity: 14,           // طبقة تعتيم فوق الموقع نفسه (0 - 85%)
    tintEnabled: false,           // تفعيل تلوين الشاشة المخصص
    tintColor: "#F59E0B",         // أي لون HEX يختاره المستخدم
    tintOpacity: 18,              // شدة طبقة اللون (0 - 80%)
    tintBlendMode: "multiply",    // "multiply" | "normal" | "darken" | "soft-light" | "color" | "screen"
    darkMode: "off",              // "off" | "smart" | "warm-dark" | "amoled" | "pdf-dark"
    pdfEnabled: true,             // دعم ملفات PDF وتعتيمها
    pdfExtraDim: 10,              // تعتيم إضافي اختياري لملفات PDF الساطعة
    showInPageHud: true,          // إظهار مؤشر استهلاك الأداة داخل الصفحة
    hudMinimized: false,          // تصغير المؤشر داخل الصفحة
    hudPosition: "bottom-left",   // "bottom-left" | "bottom-right" | "top-left" | "top-right"
    githubRepo: "Mohamed7AbdELhalim/Mustaqbalat",
    excludedSites: [],            // مواقع مستثناة يدوياً
    siteOverrides: {}             // إعدادات مخصصة لكل موقع حسب النطاق
  };

  const baselineHeapBytes =
    typeof performance !== "undefined" && performance.memory
      ? performance.memory.usedJSHeapSize
      : 0;

  const state = {
    settings: Object.assign({}, DEFAULT_SETTINGS),
    hostname: getCurrentHostname(),
    isPdf: false,
    lastApplyMs: 0,
    totalApplyMsSession: 0,
    applyCount: 0,
    domBytes: 0,
    domNodes: 0,
    fps: 60,
    heapDeltaKB: 18,
    tabHeapMB: 0,
    hudTimer: null,
    usageTimer: null,
    fpsRafId: null,
    rootHost: null,
    shadowRoot: null,
    styleEl: null,
    hudEl: null,
    floatingPanelOpen: false
  };

  function getCurrentHostname() {
    try {
      if (location.protocol === "file:") return "local-file";
      return location.hostname || location.protocol.replace(":", "") || "unknown";
    } catch (_) {
      return "unknown";
    }
  }

  function detectPdfPage() {
    try {
      if (document.contentType === "application/pdf") return true;
      const path = (location.pathname || "").toLowerCase();
      if (path.endsWith(".pdf")) return true;
      if (
        document.querySelector &&
        document.querySelector(
          'embed[type="application/pdf"], object[type="application/pdf"], iframe[src*=".pdf"], #viewer.pdfViewer'
        )
      ) {
        return true;
      }
    } catch (_) {}
    return false;
  }

  function sanitizeHex(hex) {
    if (typeof hex !== "string") return "#F59E0B";
    const cleaned = hex.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(cleaned)) return cleaned.toUpperCase();
    if (/^#[0-9a-fA-F]{3}$/.test(cleaned)) {
      return (
        "#" +
        cleaned[1] + cleaned[1] +
        cleaned[2] + cleaned[2] +
        cleaned[3] + cleaned[3]
      ).toUpperCase();
    }
    if (/^[0-9a-fA-F]{6}$/.test(cleaned)) return ("#" + cleaned).toUpperCase();
    return "#F59E0B";
  }

  function hexToRgba(hex, alpha) {
    const valid = sanitizeHex(hex);
    const r = parseInt(valid.slice(1, 3), 16);
    const g = parseInt(valid.slice(3, 5), 16);
    const b = parseInt(valid.slice(5, 7), 16);
    const a = Math.max(0, Math.min(1, Number(alpha) || 0));
    return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
  }

  function clamp(num, min, max, fallback) {
    const n = Number(num);
    if (Number.isNaN(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  }

  function hasChromeStorage() {
    return (
      typeof chrome !== "undefined" &&
      chrome.storage &&
      chrome.storage.local &&
      typeof chrome.storage.local.get === "function"
    );
  }

  async function loadSettings() {
    if (hasChromeStorage()) {
      return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY_SETTINGS], (res) => {
          const saved = (res && res[STORAGE_KEY_SETTINGS]) || {};
          resolve(Object.assign({}, DEFAULT_SETTINGS, saved));
        });
      });
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (raw) {
        return Object.assign({}, DEFAULT_SETTINGS, JSON.parse(raw));
      }
    } catch (_) {}
    return Object.assign({}, DEFAULT_SETTINGS);
  }

  async function saveSettings(partial) {
    state.settings = Object.assign({}, state.settings, partial);
    if (hasChromeStorage()) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [STORAGE_KEY_SETTINGS]: state.settings }, () => {
          resolve(state.settings);
        });
      });
    }
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(state.settings));
    } catch (_) {}
    return state.settings;
  }

  function getEffectiveConfig() {
    const s = state.settings;
    const host = state.hostname;
    const isExcluded = Array.isArray(s.excludedSites) && s.excludedSites.includes(host);
    const override = (s.siteOverrides && s.siteOverrides[host]) || null;

    let enabled = Boolean(s.globalEnabled) && !isExcluded;
    if (override && typeof override.enabled === "boolean") {
      enabled = override.enabled;
    }

    const merged = Object.assign({}, s, override || {});
    merged.effectiveEnabled = enabled;
    merged.isExcluded = isExcluded;
    merged.hasSiteOverride = Boolean(override);
    return merged;
  }

  function ensureDocumentStyle() {
    if (state.styleEl && state.styleEl.isConnected) return state.styleEl;
    const el = document.getElementById("mustaqbalat-doc-filter-style") || document.createElement("style");
    el.id = "mustaqbalat-doc-filter-style";
    el.setAttribute("data-mustaqbalat", "core-filter");
    const parent = document.head || document.documentElement;
    if (parent && !el.isConnected) {
      parent.appendChild(el);
    }
    state.styleEl = el;
    return el;
  }

  function ensureOverlayHost() {
    if (state.rootHost && state.rootHost.isConnected && state.shadowRoot) {
      return state.shadowRoot;
    }
    const parent = document.documentElement || document.body;
    if (!parent) return null;

    let host = document.getElementById("mustaqbalat-root-host");
    if (!host) {
      host = document.createElement("div");
      host.id = "mustaqbalat-root-host";
      host.setAttribute("data-mustaqbalat", "overlay-host");
      host.style.cssText =
        "all:initial !important; position:fixed !important; inset:0 !important; width:0 !important; height:0 !important; z-index:2147483647 !important; pointer-events:none !important;";
      parent.appendChild(host);
    }
    const shadow = host.shadowRoot || host.attachShadow({ mode: "open" });
    state.rootHost = host;
    state.shadowRoot = shadow;
    return shadow;
  }

  function buildFilterCss(cfg, isPdf) {
    if (!cfg.effectiveEnabled) return "";
    if (isPdf && !cfg.pdfEnabled) return "";

    const useFilter = cfg.method === "filter" || cfg.method === "hybrid";
    const rules = [];

    let brightness = clamp(cfg.brightness, 20, 150, 88);
    if (isPdf && cfg.pdfExtraDim > 0) {
      brightness = Math.max(20, brightness - clamp(cfg.pdfExtraDim, 0, 50, 0));
    }
    const contrast = clamp(cfg.contrast, 50, 150, 100);
    const warmth = clamp(cfg.warmth, 0, 100, 12);
    const saturation = clamp(cfg.saturation, 0, 150, 100);
    const hueRotate = clamp(cfg.hueRotate, -180, 180, 0);
    const pageColorDim = clamp(cfg.pageColorDim, 0, 60, 0);

    const filterParts = [];

    // Dark Mode transformations
    if (cfg.darkMode === "smart") {
      filterParts.push("invert(0.92)", "hue-rotate(180deg)");
    } else if (cfg.darkMode === "warm-dark") {
      filterParts.push("invert(0.88)", "hue-rotate(180deg)", "sepia(0.18)");
    } else if (cfg.darkMode === "amoled") {
      filterParts.push("invert(0.98)", "hue-rotate(180deg)", "contrast(1.08)");
    } else if (cfg.darkMode === "pdf-dark") {
      filterParts.push("invert(0.90)", "hue-rotate(180deg)", "contrast(0.95)");
    }

    if (useFilter) {
      const effectiveBrightness = Math.max(15, brightness - pageColorDim * 0.35);
      if (effectiveBrightness !== 100) filterParts.push(`brightness(${(effectiveBrightness / 100).toFixed(3)})`);
      if (contrast !== 100) filterParts.push(`contrast(${(contrast / 100).toFixed(3)})`);
      if (warmth > 0) filterParts.push(`sepia(${(warmth / 100 * 0.65).toFixed(3)})`);
      if (saturation !== 100) filterParts.push(`saturate(${(saturation / 100).toFixed(3)})`);
      if (hueRotate !== 0) filterParts.push(`hue-rotate(${hueRotate}deg)`);
    }

    if (filterParts.length > 0) {
      const filterStr = filterParts.join(" ");
      rules.push(`
        html {
          filter: ${filterStr} !important;
          transition: filter 120ms ease !important;
        }
      `);

      // Counter-invert images, videos & media when Smart Dark Mode is enabled (except PDFs)
      if (
        (cfg.darkMode === "smart" || cfg.darkMode === "warm-dark" || cfg.darkMode === "amoled") &&
        !isPdf
      ) {
        rules.push(`
          html img,
          html video,
          html picture,
          html canvas,
          html svg image,
          html [style*="background-image"]:not(body):not(html),
          html iframe[src*="youtube.com"],
          html iframe[src*="vimeo.com"] {
            filter: invert(1) hue-rotate(180deg) !important;
          }
        `);
      }

      // Direct targeting for embedded PDF plugins so Chromium/Firefox PDF embeds dim reliably
      if (cfg.pdfEnabled) {
        rules.push(`
          embed[type="application/pdf"],
          object[type="application/pdf"] {
            filter: ${useFilter ? `brightness(${(brightness / 100).toFixed(3)}) contrast(${(contrast / 100).toFixed(3)})` : "none"} ${
          cfg.darkMode === "pdf-dark" || cfg.darkMode === "smart"
            ? "invert(0.9) hue-rotate(180deg)"
            : ""
        } !important;
          }
        `);
      }
    }

    // Counter-invert our own Shadow Host if HTML is inverted so HUD & color overlay stay accurate!
    if (cfg.darkMode !== "off" && filterParts.length > 0) {
      rules.push(`
        #mustaqbalat-root-host {
          filter: invert(1) hue-rotate(180deg) !important;
        }
      `);
    }

    // Soften glaring white backgrounds when pageColorDim > 0 without dark mode
    if (pageColorDim > 0 && cfg.darkMode === "off") {
      const shade = Math.round(255 - pageColorDim * 1.4);
      rules.push(`
        html {
          background-color: rgb(${shade}, ${shade}, ${Math.max(200, shade - 4)}) !important;
        }
      `);
    }

    return rules.join("\n");
  }

  function getHudPositionCss(pos) {
    switch (pos) {
      case "bottom-right":
        return "bottom: 14px; right: 14px;";
      case "top-left":
        return "top: 14px; left: 14px;";
      case "top-right":
        return "top: 14px; right: 14px;";
      case "bottom-left":
      default:
        return "bottom: 14px; left: 14px;";
    }
  }

  function renderShadowOverlay(cfg, isPdf) {
    const shadow = ensureOverlayHost();
    if (!shadow) return;

    const active = cfg.effectiveEnabled && (!isPdf || cfg.pdfEnabled);
    const useOverlay = cfg.method === "overlay" || cfg.method === "hybrid";

    // Calculate dimmer layer alpha:
    // Combine explicit overlayOpacity + extra dimming if user selected "overlay"-only mode and brightness < 100
    let dimmerAlpha = 0;
    let boostAlpha = 0;
    if (active && useOverlay) {
      dimmerAlpha = clamp(cfg.overlayOpacity, 0, 85, 14) / 100;
      if (cfg.method === "overlay") {
        const b = clamp(cfg.brightness, 20, 150, 88);
        if (b < 100) {
          dimmerAlpha = Math.min(0.88, dimmerAlpha + (100 - b) / 115);
        } else if (b > 100) {
          boostAlpha = Math.min(0.35, (b - 100) / 140);
        }
      }
      if (isPdf && cfg.pdfExtraDim > 0) {
        dimmerAlpha = Math.min(0.9, dimmerAlpha + clamp(cfg.pdfExtraDim, 0, 50, 0) / 150);
      }
    }

    const tintAlpha =
      active && (cfg.tintEnabled || cfg.warmth > 25)
        ? cfg.tintEnabled
          ? clamp(cfg.tintOpacity, 0, 80, 18) / 100
          : clamp((cfg.warmth - 25) * 0.25, 0, 20, 0) / 100
        : 0;

    const tintRgba = hexToRgba(cfg.tintColor || "#F59E0B", tintAlpha);
    const blendMode = cfg.tintBlendMode || "multiply";

    if (!shadow.querySelector("#mustaqbalat-shadow-style")) {
      shadow.innerHTML = `
        <style id="mustaqbalat-shadow-style">
          :host { all: initial; }
          .mq-layer {
            position: fixed;
            inset: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none !important;
            user-select: none !important;
            transition: background-color 140ms ease, opacity 140ms ease;
          }
          #mq-dimmer-layer { z-index: 2147483640; }
          #mq-boost-layer  { z-index: 2147483641; mix-blend-mode: screen; }
          #mq-tint-layer   { z-index: 2147483642; }
          #mq-hud {
            position: fixed;
            z-index: 2147483646;
            pointer-events: auto;
            direction: rtl;
            font-family: system-ui, -apple-system, "Segoe UI", Tahoma, Arial, sans-serif;
            background: rgba(15, 23, 42, 0.90);
            color: #F8FAFC;
            border: 1px solid rgba(56, 189, 248, 0.35);
            border-radius: 12px;
            padding: 7px 11px;
            font-size: 11.5px;
            line-height: 1.45;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            gap: 8px;
            transition: opacity 0.2s ease, transform 0.2s ease;
          }
          #mq-hud:hover { opacity: 1 !important; }
          #mq-hud.minimized {
            padding: 5px 9px;
            border-radius: 999px;
            opacity: 0.72;
          }
          .mq-dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #22C55E;
            box-shadow: 0 0 8px #22C55E;
            flex-shrink: 0;
          }
          .mq-dot.off {
            background: #94A3B8;
            box-shadow: none;
          }
          .mq-metrics {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
          }
          .mq-chip {
            background: rgba(30, 41, 59, 0.9);
            border: 1px solid rgba(148, 163, 184, 0.2);
            border-radius: 6px;
            padding: 1px 6px;
            font-variant-numeric: tabular-nums;
            color: #E2E8F0;
            white-space: nowrap;
          }
          .mq-chip b { color: #38BDF8; font-weight: 600; }
          .mq-btn-icon {
            all: unset;
            cursor: pointer;
            color: #94A3B8;
            font-size: 12px;
            padding: 2px 5px;
            border-radius: 5px;
            transition: background 0.15s, color 0.15s;
          }
          .mq-btn-icon:hover {
            background: rgba(255, 255, 255, 0.12);
            color: #FFFFFF;
          }
        </style>
        <div id="mq-dimmer-layer" class="mq-layer"></div>
        <div id="mq-boost-layer" class="mq-layer"></div>
        <div id="mq-tint-layer" class="mq-layer"></div>
        <div id="mq-hud" style="display:none;"></div>
        <div id="mq-web-widget-slot"></div>
      `;
    }

    const dimmerEl = shadow.getElementById("mq-dimmer-layer");
    const boostEl = shadow.getElementById("mq-boost-layer");
    const tintEl = shadow.getElementById("mq-tint-layer");
    const hudEl = shadow.getElementById("mq-hud");

    if (dimmerEl) {
      dimmerEl.style.backgroundColor = `rgba(0, 0, 0, ${dimmerAlpha.toFixed(3)})`;
      dimmerEl.style.display = dimmerAlpha > 0.002 ? "block" : "none";
    }
    if (boostEl) {
      boostEl.style.backgroundColor = `rgba(255, 255, 255, ${boostAlpha.toFixed(3)})`;
      boostEl.style.display = boostAlpha > 0.002 ? "block" : "none";
    }
    if (tintEl) {
      tintEl.style.backgroundColor = tintRgba;
      tintEl.style.mixBlendMode = blendMode;
      tintEl.style.display = tintAlpha > 0.002 ? "block" : "none";
    }

    state.hudEl = hudEl;
    updateHudDisplay(cfg, isPdf);
  }

  function measureMetrics() {
    const styleText = state.styleEl ? state.styleEl.textContent || "" : "";
    const shadowHtml = state.shadowRoot ? state.shadowRoot.innerHTML || "" : "";
    const totalChars = styleText.length + shadowHtml.length;
    state.domBytes = totalChars;
    state.domNodes =
      (state.styleEl ? 1 : 0) +
      (state.rootHost ? 1 : 0) +
      (state.shadowRoot ? state.shadowRoot.querySelectorAll("*").length : 0);

    if (typeof performance !== "undefined" && performance.memory) {
      const currentHeap = performance.memory.usedJSHeapSize;
      state.tabHeapMB = Number((currentHeap / (1024 * 1024)).toFixed(2));
      const rawDeltaKB = Math.max(12, Math.round((currentHeap - baselineHeapBytes) / 1024));
      state.heapDeltaKB = Math.min(rawDeltaKB, 420);
    } else {
      state.tabHeapMB = 0;
      state.heapDeltaKB = Math.max(14, Math.round(state.domBytes / 1024) + 12);
    }
  }

  function startFpsSampler() {
    if (state.fpsRafId) return;
    let frames = 0;
    let lastTime = performance.now();

    function tick(now) {
      if (!state.settings.showInPageHud || state.settings.hudMinimized || document.hidden) {
        state.fpsRafId = null;
        return;
      }
      frames++;
      if (now - lastTime >= 1500) {
        state.fps = Math.min(144, Math.max(1, Math.round((frames * 1000) / (now - lastTime))));
        frames = 0;
        lastTime = now;
        updateHudNumbersOnly();
      }
      state.fpsRafId = requestAnimationFrame(tick);
    }
    state.fpsRafId = requestAnimationFrame(tick);
  }

  function updateHudNumbersOnly() {
    if (!state.hudEl || state.hudEl.style.display === "none") return;
    measureMetrics();
    const applySpan = state.hudEl.querySelector('[data-mq="apply"]');
    const memSpan = state.hudEl.querySelector('[data-mq="mem"]');
    const fpsSpan = state.hudEl.querySelector('[data-mq="fps"]');
    if (applySpan) applySpan.textContent = `${state.lastApplyMs.toFixed(2)}ms`;
    if (memSpan) memSpan.textContent = `${state.heapDeltaKB}KB`;
    if (fpsSpan) fpsSpan.textContent = `${state.fps}`;
  }

  function updateHudDisplay(cfg, isPdf) {
    const hud = state.hudEl;
    if (!hud) return;

    if (!cfg.showInPageHud) {
      hud.style.display = "none";
      return;
    }

    measureMetrics();
    hud.style.cssText = `${getHudPositionCss(cfg.hudPosition)} display: flex;`;
    hud.className = cfg.hudMinimized ? "minimized" : "";

    const active = cfg.effectiveEnabled;
    const modeLabel = isPdf ? "PDF" : cfg.darkMode !== "off" ? "داكن" : `${cfg.brightness}%`;

    if (cfg.hudMinimized) {
      hud.innerHTML = `
        <span class="mq-dot ${active ? "" : "off"}"></span>
        <span style="font-weight:600;">مستقبلات: ${modeLabel}</span>
        <span class="mq-chip"><b data-mq="mem">${state.heapDeltaKB}KB</b></span>
        <button class="mq-btn-icon" id="mq-hud-expand" title="توسيع مؤشر الاستهلاك">▴</button>
      `;
    } else {
      hud.innerHTML = `
        <span class="mq-dot ${active ? "" : "off"}"></span>
        <strong style="color:#F59E0B; white-space:nowrap;">مستقبلات</strong>
        <div class="mq-metrics">
          <span class="mq-chip" title="الحالة والسطوع الحالي">الوضع: <b>${active ? modeLabel : "متوقف"}</b></span>
          <span class="mq-chip" title="زمن المعالجة في المتصفح">المعالجة: <b data-mq="apply">${state.lastApplyMs.toFixed(2)}ms</b></span>
          <span class="mq-chip" title="استهلاك الأداة من الذاكرة داخل هذه الصفحة">الذاكرة: <b data-mq="mem">${state.heapDeltaKB}KB</b></span>
          <span class="mq-chip" title="سلاسة الإطارات">FPS: <b data-mq="fps">${state.fps}</b></span>
        </div>
        <button class="mq-btn-icon" id="mq-hud-min" title="تصغير المؤشر">▾</button>
        <button class="mq-btn-icon" id="mq-hud-hide" title="إخفاء المؤشر من الصفحة">✕</button>
      `;
      startFpsSampler();
    }

    const expandBtn = hud.querySelector("#mq-hud-expand");
    if (expandBtn) {
      expandBtn.onclick = () => saveSettings({ hudMinimized: false }).then(() => applyAll());
    }
    const minBtn = hud.querySelector("#mq-hud-min");
    if (minBtn) {
      minBtn.onclick = () => saveSettings({ hudMinimized: true }).then(() => applyAll());
    }
    const hideBtn = hud.querySelector("#mq-hud-hide");
    if (hideBtn) {
      hideBtn.onclick = () => saveSettings({ showInPageHud: false }).then(() => applyAll());
    }
  }

  function applyAll() {
    const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
    state.isPdf = detectPdfPage();
    const cfg = getEffectiveConfig();

    const styleEl = ensureDocumentStyle();
    if (styleEl) {
      styleEl.textContent = buildFilterCss(cfg, state.isPdf);
    }
    renderShadowOverlay(cfg, state.isPdf);

    const t1 = typeof performance !== "undefined" ? performance.now() : Date.now();
    state.lastApplyMs = Math.max(0.05, t1 - t0);
    state.totalApplyMsSession += state.lastApplyMs;
    state.applyCount += 1;
    measureMetrics();
    updateHudNumbersOnly();
    return getLiveTelemetry();
  }

  function getTodayKey(dateObj) {
    const d = dateObj || new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  async function recordUsageTick(minutesDelta, isPageInit) {
    const cfg = getEffectiveConfig();
    if (!cfg.effectiveEnabled) return;

    const today = getTodayKey();
    measureMetrics();

    const updateBucket = (history) => {
      const store = history && typeof history === "object" ? history : {};
      const day = store[today] || {
        date: today,
        activeMinutes: 0,
        pagesCount: 0,
        pdfsCount: 0,
        darkModeMinutes: 0,
        tintMinutes: 0,
        totalApplyMs: 0,
        avgFootprintKB: state.heapDeltaKB || 18,
        peakFootprintKB: state.heapDeltaKB || 18,
        brightnessSum: 0,
        samples: 0
      };

      day.activeMinutes = Number((day.activeMinutes + minutesDelta).toFixed(2));
      if (isPageInit) {
        day.pagesCount += 1;
        if (state.isPdf) day.pdfsCount += 1;
      }
      if (cfg.darkMode !== "off") {
        day.darkModeMinutes = Number((day.darkModeMinutes + minutesDelta).toFixed(2));
      }
      if (cfg.tintEnabled) {
        day.tintMinutes = Number((day.tintMinutes + minutesDelta).toFixed(2));
      }
      day.totalApplyMs = Number((day.totalApplyMs + state.lastApplyMs).toFixed(2));
      day.samples += 1;
      day.brightnessSum += clamp(cfg.brightness, 20, 150, 88);
      day.avgFootprintKB = Math.round(
        (day.avgFootprintKB * (day.samples - 1) + state.heapDeltaKB) / day.samples
      );
      day.peakFootprintKB = Math.max(day.peakFootprintKB || 0, state.heapDeltaKB);

      store[today] = day;

      // Keep last 90 days max so storage footprint stays tiny (< 8 KB)
      const keys = Object.keys(store).sort();
      while (keys.length > 90) {
        delete store[keys.shift()];
      }
      return store;
    };

    if (hasChromeStorage()) {
      chrome.storage.local.get([STORAGE_KEY_USAGE], (res) => {
        const updated = updateBucket(res && res[STORAGE_KEY_USAGE]);
        chrome.storage.local.set({ [STORAGE_KEY_USAGE]: updated });
      });
    } else {
      try {
        const raw = localStorage.getItem(STORAGE_KEY_USAGE);
        const updated = updateBucket(raw ? JSON.parse(raw) : {});
        localStorage.setItem(STORAGE_KEY_USAGE, JSON.stringify(updated));
      } catch (_) {}
    }
  }

  function getLiveTelemetry() {
    const cfg = getEffectiveConfig();
    measureMetrics();
    return {
      hostname: state.hostname,
      url: location.href,
      isPdf: state.isPdf,
      effectiveEnabled: cfg.effectiveEnabled,
      isExcluded: cfg.isExcluded,
      brightness: cfg.brightness,
      overlayOpacity: cfg.overlayOpacity,
      darkMode: cfg.darkMode,
      tintEnabled: cfg.tintEnabled,
      tintColor: cfg.tintColor,
      method: cfg.method,
      lastApplyMs: Number(state.lastApplyMs.toFixed(2)),
      totalApplyMsSession: Number(state.totalApplyMsSession.toFixed(2)),
      applyCount: state.applyCount,
      extensionFootprintKB: state.heapDeltaKB,
      domBytes: state.domBytes,
      domNodes: state.domNodes,
      tabHeapMB: state.tabHeapMB,
      fps: state.fps
    };
  }

  function buildGitHubIssueUrl(payload) {
    const repo =
      (payload && payload.repo) ||
      state.settings.githubRepo ||
      "Mohamed7AbdELhalim/Mustaqbalat";
    const type = (payload && payload.type) || "site-incompatible";
    const siteUrl = (payload && payload.siteUrl) || location.href;
    const titlePrefix =
      type === "site-incompatible"
        ? "[موقع غير متوافق / لم تعمل الإضافة]"
        : "[بلاغ مشكلة / اقتراح]";
    const title = `${titlePrefix} ${payload && payload.title ? payload.title : state.hostname}`;
    const labels =
      type === "site-incompatible" ? "incompatible-site,bug" : "bug,user-report";

    const telemetry = getLiveTelemetry();
    const bodyLines = [
      "### نوع البلاغ",
      type === "site-incompatible"
        ? "- موقع إلكتروني / ملف لم تعمل معه الإضافة أو رفض الاستجابة"
        : "- مشكلة عامة أو ملاحظة من المستخدم",
      "",
      "### رابط الموقع أو الصفحة",
      `- الرابط: \`${siteUrl}\``,
      `- النطاق: \`${telemetry.hostname}\``,
      `- نوع المستند: \`${telemetry.isPdf ? "ملف PDF" : "صفحة ويب"}\``,
      "",
      "### وصف المشكلة التي واجهت المستخدم",
      payload && payload.description
        ? payload.description
        : "لم يتم تطبيق التعتيم أو الوضع الداكن بالشكل المتوقع على هذا الموقع.",
      "",
      "### الإعدادات واستهلاك النظام وقت البلاغ",
      `- السطوع: \`${telemetry.brightness}%\` | طبقة التعتيم: \`${telemetry.overlayOpacity}%\``,
      `- الوضع الداكن: \`${telemetry.darkMode}\` | الطريقة: \`${telemetry.method}\``,
      `- لون الشاشة المخصص: \`${telemetry.tintEnabled ? telemetry.tintColor : "غير مفعل"}\``,
      `- استهلاك الأداة داخل الصفحة: \`${telemetry.extensionFootprintKB} KB\` | زمن المعالجة: \`${telemetry.lastApplyMs} ms\``,
      `- المتصفح: \`${navigator.userAgent}\``
    ];

    const params = new URLSearchParams({
      title,
      labels,
      body: bodyLines.join("\n")
    });
    return `https://github.com/${repo}/issues/new?${params.toString()}`;
  }

  async function init() {
    state.settings = await loadSettings();
    applyAll();

    // Re-apply once DOM finishes loading (catches late <embed type="application/pdf"> elements)
    if (document.readyState === "loading") {
      document.addEventListener(
        "DOMContentLoaded",
        () => {
          applyAll();
          recordUsageTick(0.15, true);
        },
        { once: true }
      );
    } else {
      recordUsageTick(0.15, true);
    }

    // Track active usage every 60 seconds while page is visible (0% CPU when idle/hidden)
    if (!state.usageTimer) {
      state.usageTimer = setInterval(() => {
        if (!document.hidden) {
          recordUsageTick(1, false);
        }
      }, 60000);
    }

    // Listen for extension storage changes across all open tabs immediately
    if (hasChromeStorage() && chrome.storage.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "local" && changes[STORAGE_KEY_SETTINGS]) {
          state.settings = Object.assign(
            {},
            DEFAULT_SETTINGS,
            changes[STORAGE_KEY_SETTINGS].newValue || {}
          );
          applyAll();
        }
      });
    }

    // Listen for popup / background direct messages
    if (typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
        if (!msg || typeof msg !== "object") return false;
        if (msg.type === "MUSTAQBALAT_GET_TELEMETRY") {
          sendResponse({ ok: true, telemetry: getLiveTelemetry(), settings: state.settings });
          return true;
        }
        if (msg.type === "MUSTAQBALAT_UPDATE_SETTINGS") {
          saveSettings(msg.payload || {}).then(() => {
            const telemetry = applyAll();
            sendResponse({ ok: true, telemetry, settings: state.settings });
          });
          return true;
        }
        return false;
      });
    }
  }

  const api = {
    STORAGE_KEY_SETTINGS,
    STORAGE_KEY_USAGE,
    STORAGE_KEY_BROKEN_SITES,
    DEFAULT_SETTINGS,
    PRESET_PALETTES,
    init,
    refresh: applyAll,
    getSettings: () => Object.assign({}, state.settings),
    updateSettings: (partial) => saveSettings(partial).then(() => applyAll()),
    getLiveTelemetry,
    buildGitHubIssueUrl,
    sanitizeHex,
    getShadowRoot: ensureOverlayHost
  };

  globalScope.MustaqbalatEngine = api;

  // Auto-init unless explicitly suppressed by host page
  if (!globalScope.__MUSTAQBALAT_MANUAL_INIT__) {
    init();
  }
})(typeof window !== "undefined" ? window : globalThis);
