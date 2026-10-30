/**
 * Mustaqbalat — Extension Popup Controller
 * Works seamlessly both inside Browser Extension context (chrome.*)
 * and inside the Zero-Install Web Studio simulator (localStorage + postMessage).
 */
(function () {
  "use strict";

  const STORAGE_KEY_SETTINGS = "mustaqbalat_settings_v1";
  const STORAGE_KEY_USAGE = "mustaqbalat_usage_v1";
  const STORAGE_KEY_BROKEN_SITES = "mustaqbalat_broken_sites_v1";

  const PRESET_PALETTES = [
    { id: "amber", name: "عنبر دافئ", hex: "#F59E0B", opacity: 18, blend: "multiply" },
    { id: "candle", name: "ضوء الشموع", hex: "#EA580C", opacity: 22, blend: "multiply" },
    { id: "sepia", name: "ورق القراءة", hex: "#D6B88A", opacity: 24, blend: "multiply" },
    { id: "forest", name: "أخضر مريح", hex: "#10B981", opacity: 14, blend: "multiply" },
    { id: "rose", name: "وردي هادئ", hex: "#F43F5E", opacity: 14, blend: "soft-light" },
    { id: "moon", name: "أزرق قمري", hex: "#38BDF8", opacity: 15, blend: "multiply" },
    { id: "violet", name: "بنفسجي خافت", hex: "#8B5CF6", opacity: 15, blend: "multiply" },
    { id: "slate", name: "رمادي سينمائي", hex: "#334155", opacity: 25, blend: "multiply" }
  ];

  const DEFAULT_SETTINGS = {
    globalEnabled: true,
    brightness: 88,
    contrast: 100,
    warmth: 12,
    saturation: 100,
    hueRotate: 0,
    pageColorDim: 8,
    method: "hybrid",
    overlayOpacity: 14,
    tintEnabled: false,
    tintColor: "#F59E0B",
    tintOpacity: 18,
    tintBlendMode: "multiply",
    darkMode: "off",
    pdfEnabled: true,
    pdfExtraDim: 10,
    showInPageHud: true,
    hudMinimized: false,
    hudPosition: "bottom-left",
    githubRepo: "Mohamed7AbdELhalim/Mustaqbalat",
    excludedSites: [],
    siteOverrides: {}
  };

  let settings = Object.assign({}, DEFAULT_SETTINGS);
  let activeTabInfo = {
    id: null,
    url: "https://example.com",
    hostname: "example.com",
    isPdf: false,
    restricted: false,
    restrictedReason: ""
  };
  let chartRange = "7d";

  const isExtensionEnv =
    typeof chrome !== "undefined" &&
    chrome.storage &&
    chrome.storage.local &&
    typeof chrome.storage.local.get === "function";

  const $ = (id) => document.getElementById(id);

  // Storage helpers
  async function storageGet(key, fallback) {
    if (isExtensionEnv) {
      return new Promise((resolve) => {
        chrome.storage.local.get([key], (res) => {
          resolve(res && res[key] !== undefined ? res[key] : fallback);
        });
      });
    }
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  async function storageSet(key, val) {
    if (isExtensionEnv) {
      return new Promise((resolve) => {
        chrome.storage.local.set({ [key]: val }, resolve);
      });
    }
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (_) {}
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "MUSTAQBALAT_STUDIO_SYNC", key, value: val }, "*");
    }
  }

  function sanitizeHex(hex) {
    if (typeof hex !== "string") return "#F59E0B";
    const c = hex.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(c)) return c.toUpperCase();
    if (/^#[0-9a-fA-F]{3}$/.test(c)) {
      return ("#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3]).toUpperCase();
    }
    if (/^[0-9a-fA-F]{6}$/.test(c)) return ("#" + c).toUpperCase();
    return null;
  }

  function hexToRgb(hex) {
    const valid = sanitizeHex(hex) || "#F59E0B";
    return {
      r: parseInt(valid.slice(1, 3), 16),
      g: parseInt(valid.slice(3, 5), 16),
      b: parseInt(valid.slice(5, 7), 16)
    };
  }

  function rgbToHex(r, g, b) {
    const toH = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
    return ("#" + toH(r) + toH(g) + toH(b)).toUpperCase();
  }

  function hslToRgb(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  }

  // Draw Interactive Color Wheel
  let wheelImageCache = null;
  function drawColorWheel(selectedHex) {
    const canvas = $("colorWheelCanvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const radius = size / 2;

    if (!wheelImageCache) {
      const img = ctx.createImageData(size, size);
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const dx = x - radius;
          const dy = y - radius;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const idx = (y * size + x) * 4;
          if (dist <= radius) {
            const angle = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
            const sat = Math.min(1, dist / radius);
            const light = 1 - sat * 0.5;
            const rgb = hslToRgb(angle, sat, light);
            img.data[idx] = rgb.r;
            img.data[idx + 1] = rgb.g;
            img.data[idx + 2] = rgb.b;
            img.data[idx + 3] = 255;
          } else {
            img.data[idx + 3] = 0;
          }
        }
      }
      wheelImageCache = img;
    }

    ctx.putImageData(wheelImageCache, 0, 0);

    // Center preview ring with selected color
    ctx.beginPath();
    ctx.arc(radius, radius, 14, 0, Math.PI * 2);
    ctx.fillStyle = sanitizeHex(selectedHex) || "#F59E0B";
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#FFFFFF";
    ctx.stroke();
  }

  function setupColorWheelEvents() {
    const canvas = $("colorWheelCanvas");
    if (!canvas) return;
    let dragging = false;

    const pickAt = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      const radius = canvas.width / 2;
      const dx = x - radius;
      const dy = y - radius;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > radius || dist < 14) return;

      const angle = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
      const sat = Math.min(1, dist / radius);
      const light = 1 - sat * 0.5;
      const rgb = hslToRgb(angle, sat, light);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      applyNewHexColor(hex, true);
    };

    canvas.addEventListener("mousedown", (e) => {
      dragging = true;
      pickAt(e);
    });
    window.addEventListener("mousemove", (e) => {
      if (dragging) pickAt(e);
    });
    window.addEventListener("mouseup", () => {
      dragging = false;
    });
  }

  function applyNewHexColor(hex, autoEnableTint) {
    const valid = sanitizeHex(hex);
    if (!valid) return;
    const rgb = hexToRgb(valid);
    $("hexInput").value = valid;
    $("nativeColorPicker").value = valid;
    $("rgbR").value = rgb.r;
    $("rgbG").value = rgb.g;
    $("rgbB").value = rgb.b;
    $("rgbRVal").textContent = rgb.r;
    $("rgbGVal").textContent = rgb.g;
    $("rgbBVal").textContent = rgb.b;
    drawColorWheel(valid);

    const patch = { tintColor: valid };
    if (autoEnableTint) {
      patch.tintEnabled = true;
      $("tintEnabledCheck").checked = true;
    }
    updateAndSave(patch);
  }

  function renderSwatches() {
    const container = $("swatchesContainer");
    if (!container) return;
    container.innerHTML = "";
    PRESET_PALETTES.forEach((p) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "swatch-btn";
      btn.style.backgroundColor = p.hex;
      btn.title = `${p.name} (${p.hex})`;
      btn.addEventListener("click", () => {
        $("tintOpacityRange").value = p.opacity;
        $("tintOpacityVal").textContent = `${p.opacity}%`;
        $("tintBlendSelect").value = p.blend;
        updateAndSave({
          tintOpacity: p.opacity,
          tintBlendMode: p.blend
        });
        applyNewHexColor(p.hex, true);
      });
      container.appendChild(btn);
    });
  }

  async function detectActiveTab() {
    if (isExtensionEnv && chrome.tabs && chrome.tabs.query) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab && tab.url) {
          activeTabInfo.id = tab.id;
          activeTabInfo.url = tab.url;
          activeTabInfo.isPdf = tab.url.toLowerCase().endsWith(".pdf");
          try {
            activeTabInfo.hostname = new URL(tab.url).hostname || "local-file";
          } catch (_) {
            activeTabInfo.hostname = tab.url.split(":")[0] || "browser";
          }

          if (chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage(
              { type: "MUSTAQBALAT_CHECK_URL_SUPPORT", url: tab.url },
              (resp) => {
                if (resp && resp.restricted) {
                  activeTabInfo.restricted = true;
                  activeTabInfo.restrictedReason = resp.reason;
                  renderSiteHeader();
                }
              }
            );
          }
        }
      } catch (_) {}
    } else {
      // Web Studio simulator mode
      activeTabInfo.url = window.location.origin + "/demo-page";
      activeTabInfo.hostname = window.location.hostname || "mustaqbalat.web.app";
    }
    renderSiteHeader();
    $("issueSiteUrlInput").value = activeTabInfo.url;
  }

  function renderSiteHeader() {
    $("currentHostLabel").textContent = activeTabInfo.hostname;
    $("pdfDetectedBadge").hidden = !activeTabInfo.isPdf;

    const isExcluded =
      Array.isArray(settings.excludedSites) &&
      settings.excludedSites.includes(activeTabInfo.hostname);
    const active = settings.globalEnabled && !isExcluded && !activeTabInfo.restricted;

    $("siteDot").className = active ? "site-dot" : "site-dot off";
    $("toggleSiteExcludeBtn").textContent = isExcluded ? "تفعيل بالموقع" : "استثناء الموقع";

    if (activeTabInfo.restricted) {
      $("restrictedBanner").hidden = false;
      $("restrictedReasonText").textContent = activeTabInfo.restrictedReason;
    } else {
      $("restrictedBanner").hidden = true;
    }
  }

  function populateControlsFromSettings() {
    $("globalEnabledToggle").checked = Boolean(settings.globalEnabled);
    $("globalStateText").textContent = settings.globalEnabled ? "مفعّل للكل" : "متوقف مؤقتاً";

    $("brightnessRange").value = settings.brightness;
    $("brightnessVal").textContent = `${settings.brightness}%`;

    $("overlayRange").value = settings.overlayOpacity;
    $("overlayVal").textContent = `${settings.overlayOpacity}%`;

    $("methodSelect").value = settings.method || "hybrid";
    $("darkModeSelect").value = settings.darkMode || "off";

    $("pageColorDimRange").value = settings.pageColorDim;
    $("pageColorDimVal").textContent = `${settings.pageColorDim}%`;

    $("contrastRange").value = settings.contrast;
    $("contrastVal").textContent = `${settings.contrast}%`;

    $("pdfEnabledCheck").checked = Boolean(settings.pdfEnabled);
    $("pdfExtraDimRange").value = settings.pdfExtraDim;
    $("pdfExtraDimVal").textContent = `${settings.pdfExtraDim}%`;

    $("tintEnabledCheck").checked = Boolean(settings.tintEnabled);
    $("tintOpacityRange").value = settings.tintOpacity;
    $("tintOpacityVal").textContent = `${settings.tintOpacity}%`;
    $("tintBlendSelect").value = settings.tintBlendMode || "multiply";

    const hex = sanitizeHex(settings.tintColor) || "#F59E0B";
    const rgb = hexToRgb(hex);
    $("hexInput").value = hex;
    $("nativeColorPicker").value = hex;
    $("rgbR").value = rgb.r;
    $("rgbG").value = rgb.g;
    $("rgbB").value = rgb.b;
    $("rgbRVal").textContent = rgb.r;
    $("rgbGVal").textContent = rgb.g;
    $("rgbBVal").textContent = rgb.b;
    drawColorWheel(hex);

    $("warmthRange").value = settings.warmth;
    $("warmthVal").textContent = `${settings.warmth}%`;

    $("saturationRange").value = settings.saturation;
    $("saturationVal").textContent = `${settings.saturation}%`;

    $("hueRotateRange").value = settings.hueRotate;
    $("hueRotateVal").textContent = `${settings.hueRotate}°`;

    $("showHudCheck").checked = Boolean(settings.showInPageHud);
    $("hudPosSelect").value = settings.hudPosition || "bottom-left";
    $("githubRepoInput").value = settings.githubRepo || "Mohamed7AbdELhalim/Mustaqbalat";

    renderSiteHeader();
  }

  async function updateAndSave(partial) {
    settings = Object.assign({}, settings, partial);
    await storageSet(STORAGE_KEY_SETTINGS, settings);

    if (isExtensionEnv && activeTabInfo.id && chrome.tabs && chrome.tabs.sendMessage) {
      chrome.tabs.sendMessage(
        activeTabInfo.id,
        { type: "MUSTAQBALAT_UPDATE_SETTINGS", payload: partial },
        (resp) => {
          if (chrome.runtime.lastError) return;
          if (resp && resp.telemetry) renderLiveTelemetry(resp.telemetry);
        }
      );
    }
    renderSiteHeader();
  }

  function renderLiveTelemetry(t) {
    if (!t) return;
    $("liveFootprintKB").textContent = `${t.extensionFootprintKB || 18} KB`;
    $("liveApplyMs").textContent = `${Number(t.lastApplyMs || 0.22).toFixed(2)} ms`;
    $("liveFps").textContent = `${t.fps || 60} FPS`;
    $("liveDomNodes").textContent = `${t.domNodes || 6} عناصر`;
    if (t.isPdf) $("pdfDetectedBadge").hidden = false;
  }

  function pollActiveTabTelemetry() {
    if (isExtensionEnv && activeTabInfo.id && chrome.tabs && chrome.tabs.sendMessage) {
      chrome.tabs.sendMessage(
        activeTabInfo.id,
        { type: "MUSTAQBALAT_GET_TELEMETRY" },
        (resp) => {
          if (chrome.runtime.lastError) return;
          if (resp && resp.telemetry) renderLiveTelemetry(resp.telemetry);
        }
      );
    } else if (window.parent && window.parent.MustaqbalatEngine) {
      renderLiveTelemetry(window.parent.MustaqbalatEngine.getLiveTelemetry());
    }
  }

  // Mini Usage Chart (Days & Weeks)
  async function renderMiniUsageChart() {
    const history = (await storageGet(STORAGE_KEY_USAGE, {})) || {};
    const canvas = $("miniUsageChart");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const points = [];
    const now = new Date();

    if (chartRange === "7d") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const item = history[key] || null;
        points.push({
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          minutes: item ? item.activeMinutes : i === 0 ? 1 : 0,
          memKB: item ? item.avgFootprintKB : i === 0 ? 18 : 0,
          pages: item ? item.pagesCount : i === 0 ? 1 : 0
        });
      }
    } else {
      for (let wk = 3; wk >= 0; wk--) {
        let mins = 0;
        let memSum = 0;
        let memCnt = 0;
        let pages = 0;
        for (let dIdx = 0; dIdx < 7; dIdx++) {
          const d = new Date(now);
          d.setDate(now.getDate() - (wk * 7 + dIdx));
          const key = d.toISOString().slice(0, 10);
          const item = history[key];
          if (item) {
            mins += item.activeMinutes || 0;
            memSum += item.avgFootprintKB || 18;
            memCnt++;
            pages += item.pagesCount || 0;
          }
        }
        points.push({
          label: wk === 0 ? "هذا الأسبوع" : `قبل ${wk} أ`,
          minutes: Number(mins.toFixed(1)),
          memKB: memCnt ? Math.round(memSum / memCnt) : wk === 0 ? 18 : 0,
          pages: pages || (wk === 0 ? 1 : 0)
        });
      }
    }

    const totalMins = points.reduce((s, p) => s + p.minutes, 0);
    const nonZeroMem = points.filter((p) => p.memKB > 0);
    const avgMem = nonZeroMem.length
      ? Math.round(nonZeroMem.reduce((s, p) => s + p.memKB, 0) / nonZeroMem.length)
      : 18;
    const totalPages = points.reduce((s, p) => s + p.pages, 0);

    $("sumActiveTime").textContent =
      totalMins >= 60 ? `${(totalMins / 60).toFixed(1)} س` : `${Math.max(1, Math.round(totalMins))} د`;
    $("sumAvgMem").textContent = `${avgMem} KB`;
    $("sumPagesCount").textContent = `${Math.max(1, totalPages)}`;

    const maxVal = Math.max(10, ...points.map((p) => p.minutes));
    const padLeft = 18;
    const padRight = 18;
    const padTop = 16;
    const padBottom = 24;
    const plotW = w - padLeft - padRight;
    const plotH = h - padTop - padBottom;
    const step = plotW / points.length;

    // Grid lines
    ctx.strokeStyle = "rgba(148,163,184,0.12)";
    ctx.lineWidth = 1;
    for (let g = 0; g <= 2; g++) {
      const gy = padTop + (plotH * g) / 2;
      ctx.beginPath();
      ctx.moveTo(padLeft, gy);
      ctx.lineTo(w - padRight, gy);
      ctx.stroke();
    }

    // Bars (Active Minutes) + Dots (Memory KB)
    points.forEach((p, idx) => {
      const barW = Math.min(28, step * 0.55);
      const x = padLeft + idx * step + (step - barW) / 2;
      const barH = Math.max(3, (p.minutes / maxVal) * plotH);
      const y = padTop + plotH - barH;

      const grad = ctx.createLinearGradient(0, y, 0, padTop + plotH);
      grad.addColorStop(0, "#F59E0B");
      grad.addColorStop(1, "rgba(245, 158, 11, 0.25)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 4);
      ctx.fill();

      ctx.fillStyle = "#94A3B8";
      ctx.font = "10px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(p.label, x + barW / 2, h - 7);
    });
  }

  // Broken Sites & GitHub Issues
  async function renderBrokenSitesList() {
    const list = (await storageGet(STORAGE_KEY_BROKEN_SITES, [])) || [];
    $("brokenCountBadge").textContent = list.length;
    const ul = $("brokenSitesList");
    if (!list.length) {
      ul.innerHTML = `<li class="empty-item">لا توجد مواقع مبلّغ عنها حالياً.</li>`;
      return;
    }
    ul.innerHTML = "";
    list.slice(0, 12).forEach((entry) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span dir="ltr" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:210px;">
          ${entry.hostname || entry.siteUrl}
        </span>
        <div style="display:flex;gap:4px;">
          <button type="button" class="btn-xs" data-open-gh="${entry.siteUrl}">GitHub ↗</button>
          <button type="button" class="btn-xs" data-remove-id="${entry.id}">✕</button>
        </div>
      `;
      ul.appendChild(li);
    });

    ul.querySelectorAll("[data-open-gh]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const url = createGitHubIssueLink({
          siteUrl: btn.getAttribute("data-open-gh"),
          type: "site-incompatible",
          description: "موقع مسجل في قائمة المواقع التي لم تستجب للإضافة."
        });
        openUrl(url);
      });
    });

    ul.querySelectorAll("[data-remove-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-remove-id");
        const curr = (await storageGet(STORAGE_KEY_BROKEN_SITES, [])) || [];
        const filtered = curr.filter((x) => x.id !== id);
        await storageSet(STORAGE_KEY_BROKEN_SITES, filtered);
        renderBrokenSitesList();
      });
    });
  }

  function createGitHubIssueLink({ siteUrl, type, description }) {
    const repo = ($("githubRepoInput").value || "Mohamed7AbdELhalim/Mustaqbalat").trim();
    const isSite = type === "site-incompatible";
    const isFeature = type === "feature-request";
    const prefix = isSite
      ? "[موقع لم تعمل معه الإضافة]"
      : isFeature
      ? "[اقتراح ميزة]"
      : "[مشكلة تقنية]";

    let host = siteUrl;
    try {
      host = new URL(siteUrl).hostname || siteUrl;
    } catch (_) {}

    const title = `${prefix} ${host}`;
    const labels = isSite ? "incompatible-site,bug" : isFeature ? "enhancement" : "bug";
    const body = [
      "### تفاصيل البلاغ من إضافة مستقبلات",
      `- **النوع:** ${prefix}`,
      `- **رابط الموقع / الملف:** \`${siteUrl}\``,
      activeTabInfo.restricted ? `- **ملاحظة المتصفح:** ${activeTabInfo.restrictedReason}` : "",
      "",
      "### وصف المستخدم",
      description || "لم تعمل طبقات التعتيم أو الوضع الداكن كما هو متوقع على هذه الصفحة.",
      "",
      "### إعدادات الأداة وقت البلاغ",
      `- السطوع: \`${settings.brightness}%\` | طبقة التعتيم: \`${settings.overlayOpacity}%\``,
      `- الوضع الداكن: \`${settings.darkMode}\` | الآلية: \`${settings.method}\``,
      `- اللون المخصص HEX: \`${settings.tintEnabled ? settings.tintColor : "غير مفعل"}\``
    ]
      .filter(Boolean)
      .join("\n");

    const params = new URLSearchParams({ title, labels, body });
    return `https://github.com/${repo}/issues/new?${params.toString()}`;
  }

  function openUrl(url) {
    if (isExtensionEnv && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }

  function showGithubMsg(text, isError) {
    const el = $("githubStatusMsg");
    el.hidden = false;
    el.textContent = text;
    el.style.background = isError ? "rgba(239,68,68,0.18)" : "rgba(34,197,94,0.16)";
    el.style.color = isError ? "#FCA5A5" : "#86EFAC";
  }

  function bindEvents() {
    // Tabs switching
    document.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
        document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
        btn.classList.add("active");
        const target = $("tab-" + btn.dataset.tab);
        if (target) target.classList.add("active");
        if (btn.dataset.tab === "usage") {
          pollActiveTabTelemetry();
          renderMiniUsageChart();
        }
        if (btn.dataset.tab === "github") {
          renderBrokenSitesList();
        }
      });
    });

    // Global switch
    $("globalEnabledToggle").addEventListener("change", (e) => {
      const enabled = e.target.checked;
      $("globalStateText").textContent = enabled ? "مفعّل للكل" : "متوقف مؤقتاً";
      updateAndSave({ globalEnabled: enabled });
    });

    // Per-site exclude toggle
    $("toggleSiteExcludeBtn").addEventListener("click", () => {
      const host = activeTabInfo.hostname;
      const list = Array.isArray(settings.excludedSites) ? [...settings.excludedSites] : [];
      const idx = list.indexOf(host);
      if (idx >= 0) list.splice(idx, 1);
      else list.push(host);
      updateAndSave({ excludedSites: list });
    });

    // Quick report site jump
    $("quickReportSiteBtn").addEventListener("click", () => {
      document.querySelector('[data-tab="github"]').click();
      $("issueTypeSelect").value = "site-incompatible";
      $("issueSiteUrlInput").value = activeTabInfo.url;
      $("issueDescInput").focus();
    });

    // Brightness slider + chips
    $("brightnessRange").addEventListener("input", (e) => {
      const val = Number(e.target.value);
      $("brightnessVal").textContent = `${val}%`;
      updateAndSave({ brightness: val });
    });

    document.querySelectorAll(".preset-chip").forEach((chip) => {
      chip.addEventListener("click", () => {
        const val = Number(chip.dataset.brightness);
        $("brightnessRange").value = val;
        $("brightnessVal").textContent = `${val}%`;
        updateAndSave({ brightness: val });
      });
    });

    // Overlay layer & Modes
    $("overlayRange").addEventListener("input", (e) => {
      const val = Number(e.target.value);
      $("overlayVal").textContent = `${val}%`;
      updateAndSave({ overlayOpacity: val });
    });

    $("methodSelect").addEventListener("change", (e) => {
      updateAndSave({ method: e.target.value });
    });

    $("darkModeSelect").addEventListener("change", (e) => {
      updateAndSave({ darkMode: e.target.value });
    });

    $("pageColorDimRange").addEventListener("input", (e) => {
      const val = Number(e.target.value);
      $("pageColorDimVal").textContent = `${val}%`;
      updateAndSave({ pageColorDim: val });
    });

    $("contrastRange").addEventListener("input", (e) => {
      const val = Number(e.target.value);
      $("contrastVal").textContent = `${val}%`;
      updateAndSave({ contrast: val });
    });

    // PDF Controls
    $("pdfEnabledCheck").addEventListener("change", (e) => {
      updateAndSave({ pdfEnabled: e.target.checked });
    });

    $("pdfExtraDimRange").addEventListener("input", (e) => {
      const val = Number(e.target.value);
      $("pdfExtraDimVal").textContent = `${val}%`;
      updateAndSave({ pdfExtraDim: val });
    });

    $("openPdfViewerBtn").addEventListener("click", () => {
      const targetUrl = isExtensionEnv
        ? chrome.runtime.getURL("pages/pdf-viewer.html")
        : "../pages/pdf-viewer.html";
      openUrl(targetUrl);
    });

    // Color Studio
    $("tintEnabledCheck").addEventListener("change", (e) => {
      updateAndSave({ tintEnabled: e.target.checked });
    });

    $("hexInput").addEventListener("input", (e) => {
      const valid = sanitizeHex(e.target.value);
      if (valid) applyNewHexColor(valid, true);
    });

    $("nativeColorPicker").addEventListener("input", (e) => {
      applyNewHexColor(e.target.value, true);
    });

    $("eyeDropperBtn").addEventListener("click", async () => {
      if ("EyeDropper" in window) {
        try {
          const dropper = new window.EyeDropper();
          const result = await dropper.open();
          if (result && result.sRGBHex) applyNewHexColor(result.sRGBHex, true);
        } catch (_) {}
      } else {
        $("nativeColorPicker").click();
      }
    });

    ["rgbR", "rgbG", "rgbB"].forEach((id) => {
      $(id).addEventListener("input", () => {
        const hex = rgbToHex($("rgbR").value, $("rgbG").value, $("rgbB").value);
        applyNewHexColor(hex, true);
      });
    });

    $("tintOpacityRange").addEventListener("input", (e) => {
      const val = Number(e.target.value);
      $("tintOpacityVal").textContent = `${val}%`;
      updateAndSave({ tintOpacity: val, tintEnabled: true });
      $("tintEnabledCheck").checked = true;
    });

    $("tintBlendSelect").addEventListener("change", (e) => {
      updateAndSave({ tintBlendMode: e.target.value });
    });

    $("warmthRange").addEventListener("input", (e) => {
      const val = Number(e.target.value);
      $("warmthVal").textContent = `${val}%`;
      updateAndSave({ warmth: val });
    });

    $("saturationRange").addEventListener("input", (e) => {
      const val = Number(e.target.value);
      $("saturationVal").textContent = `${val}%`;
      updateAndSave({ saturation: val });
    });

    $("hueRotateRange").addEventListener("input", (e) => {
      const val = Number(e.target.value);
      $("hueRotateVal").textContent = `${val}°`;
      updateAndSave({ hueRotate: val });
    });

    // Usage Tab
    $("showHudCheck").addEventListener("change", (e) => {
      updateAndSave({ showInPageHud: e.target.checked });
    });

    $("hudPosSelect").addEventListener("change", (e) => {
      updateAndSave({ hudPosition: e.target.value });
    });

    $("refreshTelemetryBtn").addEventListener("click", () => {
      pollActiveTabTelemetry();
      renderMiniUsageChart();
    });

    document.querySelectorAll(".seg-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        chartRange = btn.dataset.range;
        renderMiniUsageChart();
      });
    });

    $("openDashboardBtn").addEventListener("click", () => {
      const targetUrl = isExtensionEnv
        ? chrome.runtime.getURL("pages/dashboard.html")
        : "../pages/dashboard.html";
      openUrl(targetUrl);
    });

    // GitHub Reporting
    $("githubRepoInput").addEventListener("change", (e) => {
      updateAndSave({ githubRepo: e.target.value.trim() || "Mohamed7AbdELhalim/Mustaqbalat" });
    });

    $("submitGithubIssueBtn").addEventListener("click", async () => {
      const repo = ($("githubRepoInput").value || "Mohamed7AbdELhalim/Mustaqbalat").trim();
      const type = $("issueTypeSelect").value;
      const siteUrl = ($("issueSiteUrlInput").value || activeTabInfo.url).trim();
      const description = $("issueDescInput").value.trim();
      const token = $("githubTokenInput").value.trim();

      // Save to local log if site-incompatible
      if (type === "site-incompatible") {
        await saveBrokenSiteLocally(siteUrl, description);
      }

      if (token) {
        try {
          showGithubMsg("جاري إرسال البلاغ مباشرة إلى GitHub API...", false);
          const issueUrl = createGitHubIssueLink({ siteUrl, type, description });
          const parsed = new URL(issueUrl);
          const title = parsed.searchParams.get("title");
          const body = parsed.searchParams.get("body");
          const labels = (parsed.searchParams.get("labels") || "").split(",").filter(Boolean);

          const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
            method: "POST",
            headers: {
              Accept: "application/vnd.github+json",
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ title, body, labels })
          });
          if (res.ok) {
            const data = await res.json();
            showGithubMsg(`تم إنشاء البلاغ بنجاح رقم #${data.number}!`, false);
            if (data.html_url) openUrl(data.html_url);
            return;
          } else {
            showGithubMsg("تعذر الإرسال عبر التوكن، سيتم فتح صفحة GitHub الجاهزة مباشرة.", true);
          }
        } catch (_) {
          showGithubMsg("سيتم فتح صفحة البلاغ المُعبّأة في GitHub مباشرة.", false);
        }
      }

      const ghUrl = createGitHubIssueLink({ siteUrl, type, description });
      showGithubMsg("تم تجهيز البلاغ وفتحه في GitHub Issues!", false);
      openUrl(ghUrl);
    });

    $("logBrokenSiteLocalBtn").addEventListener("click", async () => {
      const siteUrl = ($("issueSiteUrlInput").value || activeTabInfo.url).trim();
      const description = $("issueDescInput").value.trim();
      await saveBrokenSiteLocally(siteUrl, description, true);
      showGithubMsg("تم حفظ الموقع في السجل واستثناؤه محلياً.", false);
    });

    // Reset Defaults
    $("resetDefaultsBtn").addEventListener("click", async () => {
      settings = Object.assign({}, DEFAULT_SETTINGS);
      await storageSet(STORAGE_KEY_SETTINGS, settings);
      populateControlsFromSettings();
    });
  }

  async function saveBrokenSiteLocally(siteUrl, description, alsoExclude) {
    let hostname = siteUrl;
    try {
      hostname = new URL(siteUrl).hostname || siteUrl;
    } catch (_) {}

    const list = (await storageGet(STORAGE_KEY_BROKEN_SITES, [])) || [];
    list.unshift({
      id: Date.now().toString(36),
      siteUrl,
      hostname,
      description: description || "لم تستجب الصفحة للتعتيم",
      reportedAt: new Date().toISOString()
    });
    await storageSet(STORAGE_KEY_BROKEN_SITES, list.slice(0, 100));

    if (alsoExclude && hostname) {
      const ex = Array.isArray(settings.excludedSites) ? [...settings.excludedSites] : [];
      if (!ex.includes(hostname)) ex.push(hostname);
      await updateAndSave({ excludedSites: ex });
    }
    renderBrokenSitesList();
  }

  async function bootstrap() {
    const saved = await storageGet(STORAGE_KEY_SETTINGS, null);
    settings = Object.assign({}, DEFAULT_SETTINGS, saved || {});
    renderSwatches();
    setupColorWheelEvents();
    populateControlsFromSettings();
    bindEvents();
    await detectActiveTab();
    pollActiveTabTelemetry();
    renderMiniUsageChart();
    renderBrokenSitesList();
  }

  bootstrap();
})();
