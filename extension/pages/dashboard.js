/**
 * Mustaqbalat — Full Analytics Dashboard (Days & Weeks Resource Consumption)
 */
(function () {
  "use strict";

  const STORAGE_KEY_USAGE = "mustaqbalat_usage_v1";
  let currentHorizon = "7d";
  let demoMode = false;

  const isExtensionEnv =
    typeof chrome !== "undefined" &&
    chrome.storage &&
    chrome.storage.local &&
    typeof chrome.storage.local.get === "function";

  const $ = (id) => document.getElementById(id);

  // Hide studio back-link if inside packed extension
  if (isExtensionEnv && location.protocol.includes("extension")) {
    const link = $("backStudioLink");
    if (link) link.style.display = "none";
  }

  async function loadRealHistory() {
    if (isExtensionEnv) {
      return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY_USAGE], (res) => {
          resolve((res && res[STORAGE_KEY_USAGE]) || {});
        });
      });
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY_USAGE);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  function generateSyntheticMultiWeekHistory() {
    const out = {};
    const now = new Date();
    for (let i = 55; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      const wave = Math.sin(i * 0.45) * 0.35 + 0.85;
      const mins = Math.round((42 + ((i * 17) % 65)) * wave);
      const pages = Math.max(3, Math.round(mins / 4.2));
      const pdfs = i % 3 === 0 ? Math.max(1, Math.round(pages * 0.18)) : 0;
      const avgKB = 18 + (i % 7) * 2;
      out[key] = {
        date: key,
        activeMinutes: mins,
        pagesCount: pages,
        pdfsCount: pdfs,
        darkModeMinutes: Math.round(mins * 0.58),
        tintMinutes: Math.round(mins * 0.34),
        totalApplyMs: Number((pages * 0.38).toFixed(2)),
        avgFootprintKB: avgKB,
        peakFootprintKB: avgKB + 9
      };
    }
    return out;
  }

  function buildBuckets(historyMap, horizon) {
    const now = new Date();
    const buckets = [];

    if (horizon === "7d" || horizon === "14d") {
      const days = horizon === "7d" ? 7 : 14;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        const entry = historyMap[key] || {
          activeMinutes: i === 0 ? 1 : 0,
          pagesCount: i === 0 ? 1 : 0,
          pdfsCount: 0,
          darkModeMinutes: 0,
          tintMinutes: 0,
          totalApplyMs: i === 0 ? 0.32 : 0,
          avgFootprintKB: i === 0 ? 18 : 0,
          peakFootprintKB: i === 0 ? 20 : 0
        };
        buckets.push({
          label: `${d.getMonth() + 1}/${d.getDate()}`,
          fullLabel: key,
          ...entry
        });
      }
    } else {
      const weeks = horizon === "4w" ? 4 : 8;
      for (let w = weeks - 1; w >= 0; w--) {
        let activeMinutes = 0;
        let pagesCount = 0;
        let pdfsCount = 0;
        let darkModeMinutes = 0;
        let tintMinutes = 0;
        let totalApplyMs = 0;
        let kbSum = 0;
        let kbCount = 0;
        let peakKB = 0;

        const endDay = new Date(now);
        endDay.setDate(now.getDate() - w * 7);
        const startDay = new Date(now);
        startDay.setDate(now.getDate() - (w * 7 + 6));

        for (let dIdx = 0; dIdx < 7; dIdx++) {
          const d = new Date(now);
          d.setDate(now.getDate() - (w * 7 + dIdx));
          const key = d.toISOString().slice(0, 10);
          const item = historyMap[key];
          if (item) {
            activeMinutes += item.activeMinutes || 0;
            pagesCount += item.pagesCount || 0;
            pdfsCount += item.pdfsCount || 0;
            darkModeMinutes += item.darkModeMinutes || 0;
            tintMinutes += item.tintMinutes || 0;
            totalApplyMs += item.totalApplyMs || 0;
            if (item.avgFootprintKB) {
              kbSum += item.avgFootprintKB;
              kbCount++;
            }
            peakKB = Math.max(peakKB, item.peakFootprintKB || 0);
          }
        }

        buckets.push({
          label: w === 0 ? "الأسبوع الحالي" : `قبل ${w} أ`,
          fullLabel: `${startDay.toISOString().slice(5, 10)} ← ${endDay.toISOString().slice(5, 10)}`,
          activeMinutes: Number(activeMinutes.toFixed(1)),
          pagesCount: pagesCount || (w === 0 ? 1 : 0),
          pdfsCount,
          darkModeMinutes: Number(darkModeMinutes.toFixed(1)),
          tintMinutes: Number(tintMinutes.toFixed(1)),
          totalApplyMs: Number(totalApplyMs.toFixed(2)) || (w === 0 ? 0.35 : 0),
          avgFootprintKB: kbCount ? Math.round(kbSum / kbCount) : w === 0 ? 18 : 0,
          peakFootprintKB: peakKB || (w === 0 ? 22 : 0)
        });
      }
    }
    return buckets;
  }

  function formatDuration(mins) {
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = Math.round(mins % 60);
      return `${h} ساعة و ${m} د`;
    }
    return `${Math.round(mins)} دقيقة`;
  }

  function drawResourceChart(buckets) {
    const canvas = $("resourceChartCanvas");
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const pad = { top: 24, right: 26, bottom: 36, left: 38 };
    const pw = w - pad.left - pad.right;
    const ph = h - pad.top - pad.bottom;

    const maxKB = Math.max(40, ...buckets.map((b) => b.peakFootprintKB || b.avgFootprintKB || 20));
    const maxCpu = Math.max(5, ...buckets.map((b) => b.totalApplyMs || 1));

    // Grid
    ctx.strokeStyle = "rgba(148,163,184,0.12)";
    ctx.fillStyle = "#94A3B8";
    ctx.font = "11px system-ui, sans-serif";
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (ph * i) / 4;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();
      const val = Math.round(maxKB * (1 - i / 4));
      ctx.textAlign = "right";
      ctx.fillText(`${val}KB`, pad.left - 4, y + 4);
    }

    const step = pw / buckets.length;

    // Bars for Avg Memory KB
    buckets.forEach((b, idx) => {
      const barW = Math.min(30, step * 0.48);
      const x = pad.left + idx * step + (step - barW) / 2;
      const barH = Math.max(3, ((b.avgFootprintKB || 0) / maxKB) * ph);
      const y = pad.top + ph - barH;

      const grad = ctx.createLinearGradient(0, y, 0, pad.top + ph);
      grad.addColorStop(0, "#38BDF8");
      grad.addColorStop(1, "rgba(56, 189, 248, 0.18)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barW, barH, 5);
      ctx.fill();

      ctx.fillStyle = "#94A3B8";
      ctx.textAlign = "center";
      ctx.fillText(b.label, x + barW / 2, h - 12);
    });

    // Line for CPU Apply Time (ms)
    ctx.strokeStyle = "#22C55E";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    buckets.forEach((b, idx) => {
      const cx = pad.left + idx * step + step / 2;
      const cy = pad.top + ph - ((b.totalApplyMs || 0) / maxCpu) * (ph * 0.85);
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.stroke();

    buckets.forEach((b, idx) => {
      const cx = pad.left + idx * step + step / 2;
      const cy = pad.top + ph - ((b.totalApplyMs || 0) / maxCpu) * (ph * 0.85);
      ctx.fillStyle = "#22C55E";
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawDurationChart(buckets) {
    const canvas = $("durationChartCanvas");
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const pad = { top: 24, right: 26, bottom: 36, left: 38 };
    const pw = w - pad.left - pad.right;
    const ph = h - pad.top - pad.bottom;

    const maxMins = Math.max(15, ...buckets.map((b) => b.activeMinutes || 0));

    ctx.strokeStyle = "rgba(148,163,184,0.12)";
    ctx.fillStyle = "#94A3B8";
    ctx.font = "11px system-ui, sans-serif";
    for (let i = 0; i <= 4; i++) {
      const y = pad.top + (ph * i) / 4;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();
      const val = Math.round(maxMins * (1 - i / 4));
      ctx.textAlign = "right";
      ctx.fillText(`${val}د`, pad.left - 4, y + 4);
    }

    const step = pw / buckets.length;
    buckets.forEach((b, idx) => {
      const groupW = Math.min(36, step * 0.62);
      const barW = groupW / 2 - 2;
      const x1 = pad.left + idx * step + (step - groupW) / 2;
      const x2 = x1 + barW + 4;

      const h1 = Math.max(3, ((b.activeMinutes || 0) / maxMins) * ph);
      const h2 = Math.max(2, (((b.darkModeMinutes || 0) + (b.tintMinutes || 0) * 0.5) / maxMins) * ph);

      ctx.fillStyle = "#F59E0B";
      ctx.beginPath();
      ctx.roundRect(x1, pad.top + ph - h1, barW, h1, 4);
      ctx.fill();

      ctx.fillStyle = "#A78BFA";
      ctx.beginPath();
      ctx.roundRect(x2, pad.top + ph - Math.min(ph, h2), barW, Math.min(ph, h2), 4);
      ctx.fill();

      ctx.fillStyle = "#94A3B8";
      ctx.textAlign = "center";
      ctx.fillText(b.label, x1 + groupW / 2, h - 12);
    });
  }

  async function renderAll() {
    const rawHistory = demoMode ? generateSyntheticMultiWeekHistory() : await loadRealHistory();
    const storageBytes = new Blob([JSON.stringify(rawHistory)]).size;
    const buckets = buildBuckets(rawHistory, currentHorizon);

    const totalMins = buckets.reduce((s, b) => s + (b.activeMinutes || 0), 0);
    const totalDark = buckets.reduce((s, b) => s + (b.darkModeMinutes || 0), 0);
    const totalTint = buckets.reduce((s, b) => s + (b.tintMinutes || 0), 0);
    const totalCpu = buckets.reduce((s, b) => s + (b.totalApplyMs || 0), 0);
    const totalPages = buckets.reduce((s, b) => s + (b.pagesCount || 0), 0);
    const totalPdfs = buckets.reduce((s, b) => s + (b.pdfsCount || 0), 0);
    const activeMemBuckets = buckets.filter((b) => b.avgFootprintKB > 0);
    const avgMem = activeMemBuckets.length
      ? Math.round(activeMemBuckets.reduce((s, b) => s + b.avgFootprintKB, 0) / activeMemBuckets.length)
      : 18;
    const peakMem = Math.max(20, ...buckets.map((b) => b.peakFootprintKB || 0));

    $("kpiTotalDuration").textContent = formatDuration(totalMins);
    $("kpiDarkRatio").textContent = `منها ${formatDuration(totalDark)} في الوضع الداكن`;
    $("kpiAvgMemory").textContent = `${avgMem} KB`;
    $("kpiPeakMemory").textContent = `أقصى ذروة: ${peakMem} KB | حجم السجل: ${(storageBytes / 1024).toFixed(2)} KB`;
    $("kpiTotalCpuMs").textContent = `${totalCpu.toFixed(2)} ms`;
    $("kpiTotalPages").textContent = `${totalPages}`;
    $("kpiPdfCount").textContent = `شاملة ${totalPdfs} ملف PDF و ${Math.round(totalTint)} د تلوين HEX`;

    const titles = {
      "7d": "عرض يومي لآخر 7 أيام",
      "14d": "عرض يومي لآخر 14 يوماً",
      "4w": "عرض أسبوعي لآخر 4 أسابيع",
      "8w": "عرض أسبوعي لآخر 8 أسابيع"
    };
    $("tableModeSubtitle").textContent = titles[currentHorizon] + (demoMode ? " (بيانات محاكاة توضيحية)" : "");

    drawResourceChart(buckets);
    drawDurationChart(buckets);

    const tbody = $("historyTableBody");
    tbody.innerHTML = "";
    buckets
      .slice()
      .reverse()
      .forEach((b) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td><strong>${b.label}</strong> <span style="color:#94A3B8;font-size:11.5px;">(${b.fullLabel})</span></td>
          <td>${formatDuration(b.activeMinutes)}</td>
          <td>${formatDuration(b.darkModeMinutes)}</td>
          <td>${formatDuration(b.tintMinutes)}</td>
          <td>${b.avgFootprintKB || 0} KB</td>
          <td>${b.peakFootprintKB || 0} KB</td>
          <td>${(b.totalApplyMs || 0).toFixed(2)} ms</td>
          <td>${b.pagesCount} صفحة (${b.pdfsCount} PDF)</td>
        `;
        tbody.appendChild(tr);
      });
  }

  document.querySelectorAll("[data-horizon]").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll("[data-horizon]").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentHorizon = btn.dataset.horizon;
      renderAll();
    });
  });

  $("toggleDemoDataBtn").addEventListener("click", (e) => {
    demoMode = !demoMode;
    e.currentTarget.classList.toggle("demo-active", demoMode);
    e.currentTarget.textContent = demoMode ? "✓ العودة للبيانات الحقيقية" : "✨ محاكاة بيانات أسابيع";
    renderAll();
  });

  $("exportJsonBtn").addEventListener("click", async () => {
    const data = demoMode ? generateSyntheticMultiWeekHistory() : await loadRealHistory();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mustaqbalat-usage-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  $("clearHistoryBtn").addEventListener("click", async () => {
    demoMode = false;
    $("toggleDemoDataBtn").classList.remove("demo-active");
    $("toggleDemoDataBtn").textContent = "✨ محاكاة بيانات أسابيع";
    if (isExtensionEnv) {
      await new Promise((r) => chrome.storage.local.set({ [STORAGE_KEY_USAGE]: {} }, r));
    } else {
      localStorage.removeItem(STORAGE_KEY_USAGE);
    }
    renderAll();
  });

  renderAll();
})();
