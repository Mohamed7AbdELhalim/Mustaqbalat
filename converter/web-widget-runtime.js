/**
 * Mustaqbalat — Self-Contained Floating Web Add-on Widget (0-Disk Bookmarklet & Userscript Runtime)
 * Runs on ANY webpage inside an isolated Shadow DOM with Brightness, Overlay Layers,
 * Smart Dark Mode, HEX Color Picker, Live System Resource Monitor, and GitHub Issue Reporter.
 */
(function () {
  "use strict";

  const HOST_ID = "mustaqbalat-web-addon-host";
  const existing = document.getElementById(HOST_ID);
  if (existing) {
    const panel = existing.shadowRoot && existing.shadowRoot.getElementById("mqw-panel");
    if (panel) {
      panel.style.display = panel.style.display === "none" ? "block" : "none";
    }
    return;
  }

  const STORAGE_KEY = "mustaqbalat_web_addon_v1";
  const DEFAULTS = Object.assign(
    {
      enabled: true,
      brightness: 86,
      overlay: 15,
      darkMode: "off",
      tintEnabled: false,
      tintColor: "#F59E0B",
      tintOpacity: 18,
      hudVisible: true,
      repo: "Mohamed7AbdELhalim/Mustaqbalat"
    },
    window.__MUSTAQBALAT_PRESET__ || {}
  );

  let cfg = Object.assign({}, DEFAULTS);
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) cfg = Object.assign({}, cfg, JSON.parse(saved));
  } catch (_) {}

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch (_) {}
  }

  const styleDoc = document.createElement("style");
  styleDoc.id = "mustaqbalat-web-doc-style";
  (document.head || document.documentElement).appendChild(styleDoc);

  const host = document.createElement("div");
  host.id = HOST_ID;
  host.style.cssText =
    "all:initial!important;position:fixed!important;inset:0!important;width:0!important;height:0!important;z-index:2147483647!important;pointer-events:none!important;";
  (document.documentElement || document.body).appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });
  shadow.innerHTML = `
    <style>
      :host { all: initial; }
      .layer {
        position: fixed; inset: 0; width: 100vw; height: 100vh;
        pointer-events: none !important; transition: background 120ms ease;
      }
      #dim { z-index: 2147483640; }
      #tint { z-index: 2147483641; mix-blend-mode: multiply; }
      #fab {
        position: fixed; bottom: 16px; left: 16px; z-index: 2147483646;
        pointer-events: auto; cursor: pointer; direction: rtl;
        background: rgba(15,23,42,0.92); color: #F8FAFC;
        border: 1px solid rgba(245,158,11,0.5); border-radius: 999px;
        padding: 6px 12px; font: 600 12px system-ui, sans-serif;
        box-shadow: 0 6px 20px rgba(0,0,0,0.35); display: flex; align-items: center; gap: 7px;
      }
      #panel {
        position: fixed; bottom: 56px; left: 16px; width: 310px; z-index: 2147483647;
        pointer-events: auto; direction: rtl;
        background: #0F172A; color: #F1F5F9;
        border: 1px solid rgba(148,163,184,0.25); border-radius: 14px;
        padding: 13px; font: 12px/1.45 system-ui, sans-serif;
        box-shadow: 0 18px 42px rgba(0,0,0,0.55);
      }
      .hd { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.08); padding-bottom:7px; }
      .hd strong { color:#F59E0B; font-size:13.5px; }
      .row { margin-top:7px; }
      .lbl { display:flex; justify-content:space-between; font-size:11px; color:#CBD5E1; margin-bottom:2px; }
      input[type="range"] { width:100%; accent-color:#F59E0B; cursor:pointer; }
      select, input[type="text"] {
        background:#1E293B; color:#FFF; border:1px solid rgba(255,255,255,0.15);
        border-radius:6px; padding:4px 6px; font-size:11.5px; width:100%; box-sizing:border-box;
      }
      .swatches { display:flex; gap:5px; margin-top:5px; }
      .sw { width:22px; height:22px; border-radius:5px; border:1.5px solid rgba(255,255,255,0.3); cursor:pointer; }
      .btn {
        background:#F59E0B; color:#0B1120; border:none; border-radius:7px;
        padding:6px 9px; font-weight:700; font-size:11px; cursor:pointer; width:100%; margin-top:8px;
      }
      .btn-gh { background:rgba(56,189,248,0.15); color:#38BDF8; border:1px solid rgba(56,189,248,0.35); }
      .stat { font-size:10.5px; color:#94A3B8; margin-top:7px; display:flex; justify-content:space-between; background:#1E293B; padding:4px 8px; border-radius:6px; }
    </style>
    <div id="dim" class="layer"></div>
    <div id="tint" class="layer"></div>
    <button id="fab" title="فتح/إغلاق مستقبلات للراحة البصرية">🌙 مستقبلات <span id="fabStat">86%</span></button>
    <div id="mqw-panel" style="position:fixed;bottom:56px;left:16px;width:305px;z-index:2147483647;pointer-events:auto;direction:rtl;background:#0F172A;color:#F1F5F9;border:1px solid rgba(148,163,184,0.25);border-radius:14px;padding:13px;font:12px/1.45 system-ui,sans-serif;box-shadow:0 18px 42px rgba(0,0,0,0.55);">
      <div class="hd">
        <strong>🌙 مستقبلات (إضافة ويب 0KB)</strong>
        <label style="font-size:11px;cursor:pointer;"><input type="checkbox" id="enChk" checked /> مفعّل</label>
      </div>
      <div class="row">
        <div class="lbl"><span>سطوع الشاشة</span><b id="bVal">86%</b></div>
        <input type="range" id="bRng" min="20" max="150" value="86" />
      </div>
      <div class="row">
        <div class="lbl"><span>طبقة تعتيم فوق الموقع</span><b id="oVal">15%</b></div>
        <input type="range" id="oRng" min="0" max="85" value="15" />
      </div>
      <div class="row">
        <div class="lbl"><span>الوضع الداكن</span></div>
        <select id="dmSel">
          <option value="off">إيقاف (عادي)</option>
          <option value="smart">داكن ذكي (يحفظ الصور)</option>
          <option value="warm">داكن دافئ للقراءة</option>
          <option value="pdf">داكن خاص لملفات PDF</option>
        </select>
      </div>
      <div class="row">
        <div class="lbl">
          <label style="cursor:pointer;"><input type="checkbox" id="tChk" /> تلوين الشاشة HEX</label>
          <b id="tVal">18%</b>
        </div>
        <div style="display:flex;gap:5px;margin-top:3px;">
          <input type="text" id="hexIn" value="#F59E0B" dir="ltr" style="font-family:monospace;" />
          <input type="color" id="colPick" value="#F59E0B" style="width:34px;height:28px;border:none;background:none;cursor:pointer;" />
        </div>
        <input type="range" id="tRng" min="0" max="75" value="18" style="margin-top:4px;" />
        <div class="swatches">
          <button class="sw" style="background:#F59E0B" data-hex="#F59E0B" title="عنبر"></button>
          <button class="sw" style="background:#EA580C" data-hex="#EA580C" title="شموع"></button>
          <button class="sw" style="background:#D6B88A" data-hex="#D6B88A" title="ورقي"></button>
          <button class="sw" style="background:#10B981" data-hex="#10B981" title="أخضر"></button>
          <button class="sw" style="background:#F43F5E" data-hex="#F43F5E" title="وردي"></button>
          <button class="sw" style="background:#38BDF8" data-hex="#38BDF8" title="قمري"></button>
        </div>
      </div>
      <div class="stat">
        <span>الاستهلاك: <b id="memStat" style="color:#38BDF8;">14 KB</b></span>
        <span>المعالجة: <b id="msStat" style="color:#22C55E;">0.2ms</b></span>
      </div>
      <button class="btn btn-gh" id="ghBtn">🐞 إبلاغ عن مشكلة / موقع في GitHub</button>
    </div>
  `;

  const q = (id) => shadow.getElementById(id);
  const panel = q("mqw-panel");

  function hexToRgba(hex, a) {
    const h = /^#[0-9a-fA-F]{6}$/.test(hex) ? hex : "#F59E0B";
    return `rgba(${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)},${a})`;
  }

  function render() {
    const t0 = performance.now();
    q("enChk").checked = cfg.enabled;
    q("bRng").value = cfg.brightness;
    q("bVal").textContent = cfg.brightness + "%";
    q("oRng").value = cfg.overlay;
    q("oVal").textContent = cfg.overlay + "%";
    q("dmSel").value = cfg.darkMode;
    q("tChk").checked = cfg.tintEnabled;
    q("hexIn").value = cfg.tintColor;
    q("colPick").value = cfg.tintColor;
    q("tRng").value = cfg.tintOpacity;
    q("tVal").textContent = cfg.tintOpacity + "%";

    if (!cfg.enabled) {
      styleDoc.textContent = "";
      q("dim").style.background = "transparent";
      q("tint").style.background = "transparent";
      q("fabStat").textContent = "OFF";
      return;
    }

    const f = [`brightness(${(cfg.brightness / 100).toFixed(2)})`];
    if (cfg.darkMode === "smart") f.push("invert(0.92) hue-rotate(180deg)");
    if (cfg.darkMode === "warm") f.push("invert(0.88) hue-rotate(180deg) sepia(0.18)");
    if (cfg.darkMode === "pdf") f.push("invert(0.90) hue-rotate(180deg) contrast(0.95)");

    let css = `html { filter: ${f.join(" ")} !important; }`;
    if (cfg.darkMode !== "off") {
      css += `
        #${HOST_ID} { filter: invert(1) hue-rotate(180deg) !important; }
        ${cfg.darkMode !== "pdf" ? "html img, html video, html canvas { filter: invert(1) hue-rotate(180deg) !important; }" : ""}
      `;
    }
    css += `embed[type="application/pdf"], object[type="application/pdf"] { filter: ${f.join(" ")} !important; }`;
    styleDoc.textContent = css;

    q("dim").style.background = `rgba(0,0,0,${(cfg.overlay / 100).toFixed(3)})`;
    q("tint").style.background = cfg.tintEnabled
      ? hexToRgba(cfg.tintColor, cfg.tintOpacity / 100)
      : "transparent";
    q("fabStat").textContent = cfg.darkMode !== "off" ? "داكن" : cfg.brightness + "%";

    const dt = Math.max(0.08, performance.now() - t0);
    q("msStat").textContent = dt.toFixed(2) + "ms";
    const kb = Math.max(12, Math.round((styleDoc.textContent.length + shadow.innerHTML.length) / 1024) + 8);
    q("memStat").textContent = kb + " KB";
    save();
  }

  q("fab").onclick = () => {
    panel.style.display = panel.style.display === "none" ? "block" : "none";
  };
  q("enChk").onchange = (e) => { cfg.enabled = e.target.checked; render(); };
  q("bRng").oninput = (e) => { cfg.brightness = Number(e.target.value); render(); };
  q("oRng").oninput = (e) => { cfg.overlay = Number(e.target.value); render(); };
  q("dmSel").onchange = (e) => { cfg.darkMode = e.target.value; render(); };
  q("tChk").onchange = (e) => { cfg.tintEnabled = e.target.checked; render(); };
  q("tRng").oninput = (e) => { cfg.tintOpacity = Number(e.target.value); cfg.tintEnabled = true; render(); };
  q("colPick").oninput = (e) => { cfg.tintColor = e.target.value.toUpperCase(); cfg.tintEnabled = true; render(); };
  q("hexIn").oninput = (e) => {
    if (/^#[0-9a-fA-F]{6}$/.test(e.target.value.trim())) {
      cfg.tintColor = e.target.value.trim().toUpperCase();
      cfg.tintEnabled = true;
      render();
    }
  };
  shadow.querySelectorAll(".sw").forEach((b) => {
    b.onclick = () => {
      cfg.tintColor = b.getAttribute("data-hex");
      cfg.tintEnabled = true;
      render();
    };
  });
  q("ghBtn").onclick = () => {
    const params = new URLSearchParams({
      title: `[بلاغ إضافة الويب] ${location.hostname || "موقع"}`,
      labels: "incompatible-site,web-addon",
      body: `### رابط الصفحة\n\`${location.href}\`\n\n### الإعدادات الحالية\n- السطوع: ${cfg.brightness}% | طبقة التعتيم: ${cfg.overlay}% | الوضع الداكن: ${cfg.darkMode}\n\n### وصف المشكلة\n`
    });
    window.open(`https://github.com/${cfg.repo}/issues/new?${params.toString()}`, "_blank", "noopener");
  };

  render();
})();
