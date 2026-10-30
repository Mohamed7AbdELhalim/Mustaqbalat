/**
 * Mustaqbalat — Live Studio & Zero-Space Web Add-on Converter Controller
 */
(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  let latestAddons = null;

  // Listen for live updates from the embedded Extension Popup Simulator
  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || data.type !== "MUSTAQBALAT_STUDIO_SYNC") return;
    if (data.key === "mustaqbalat_settings_v1" && window.MustaqbalatEngine) {
      window.MustaqbalatEngine.updateSettings(data.value || {});
    }
  });

  // Switch between Live Webpage Demo and Inline PDF Demo
  document.querySelectorAll(".sb-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".sb-tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const mode = btn.dataset.stage;
      $("stageWeb").style.display = mode === "web" ? "block" : "none";
      $("stagePdf").style.display = mode === "pdf" ? "block" : "none";
    });
  });

  function getConverterPreset() {
    const hexRaw = ($("convHexColor").value || "#F59E0B").trim();
    const hex = /^#[0-9a-fA-F]{6}$/.test(hexRaw) ? hexRaw.toUpperCase() : "#F59E0B";
    return {
      enabled: true,
      brightness: Math.min(150, Math.max(20, Number($("convBrightness").value) || 86)),
      overlay: Math.min(85, Math.max(0, Number($("convOverlay").value) || 15)),
      darkMode: $("convDarkMode").value || "off",
      tintEnabled: hex !== "#F59E0B",
      tintColor: hex,
      tintOpacity: 18
    };
  }

  async function refreshWebAddons() {
    if (!window.MustaqbalatConverter) return;
    try {
      const preset = getConverterPreset();
      latestAddons = await window.MustaqbalatConverter.generateWebAddons(preset);
      $("bookmarkletLink").href = latestAddons.bookmarkletHref;
      $("bookmarkletCodeBox").value = latestAddons.bookmarkletHref;
      $("userscriptSizeBadge").textContent = `حجم السكربت: ${(latestAddons.userscriptBytes / 1024).toFixed(1)} كيلوبايت فقط`;
    } catch (err) {
      $("bookmarkletCodeBox").value = "تعذر توليد الكود: " + err.message;
    }
  }

  ["convBrightness", "convOverlay", "convDarkMode", "convHexColor"].forEach((id) => {
    $(id).addEventListener("input", refreshWebAddons);
    $(id).addEventListener("change", refreshWebAddons);
  });

  // Prevent accidental click on Bookmarklet link on the Studio page; instead run the live widget demo!
  $("bookmarkletLink").addEventListener("click", (e) => {
    e.preventDefault();
    launchStandaloneWebWidgetDemo();
  });

  $("copyBookmarkletBtn").addEventListener("click", async (e) => {
    if (!latestAddons) await refreshWebAddons();
    if (!latestAddons) return;
    try {
      await navigator.clipboard.writeText(latestAddons.bookmarkletHref);
      const orig = e.currentTarget.textContent;
      e.currentTarget.textContent = "✓ تم نسخ الكود للحافظة!";
      setTimeout(() => { e.currentTarget.textContent = orig; }, 2000);
    } catch (_) {
      $("bookmarkletCodeBox").select();
      document.execCommand("copy");
    }
  });

  function launchStandaloneWebWidgetDemo() {
    window.__MUSTAQBALAT_PRESET__ = getConverterPreset();
    const existingScript = document.getElementById("mq-live-widget-script");
    if (existingScript) {
      const host = document.getElementById("mustaqbalat-web-addon-host");
      if (host && host.shadowRoot) {
        const panel = host.shadowRoot.getElementById("mqw-panel");
        if (panel) panel.style.display = panel.style.display === "none" ? "block" : "none";
      }
      return;
    }
    const s = document.createElement("script");
    s.id = "mq-live-widget-script";
    s.src = "./converter/web-widget-runtime.js";
    document.body.appendChild(s);
  }

  $("testWebWidgetNowBtn").addEventListener("click", launchStandaloneWebWidgetDemo);

  $("installUserscriptBtn").addEventListener("click", async () => {
    if (!latestAddons) await refreshWebAddons();
    if (!latestAddons) return;
    const blob = new Blob([latestAddons.userscriptText], { type: "text/javascript;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mustaqbalat.user.js";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  });

  $("copyUserscriptBtn").addEventListener("click", async (e) => {
    if (!latestAddons) await refreshWebAddons();
    if (!latestAddons) return;
    try {
      await navigator.clipboard.writeText(latestAddons.userscriptText);
      const orig = e.currentTarget.textContent;
      e.currentTarget.textContent = "✓ تم النسخ!";
      setTimeout(() => { e.currentTarget.textContent = orig; }, 2000);
    } catch (_) {}
  });

  async function triggerZipBuild(targetBrowser) {
    const listBox = $("packageFilesList");
    listBox.textContent = "جاري تجميع وضغط ملفات الإضافة داخل الذاكرة المؤقتة (RAM)...";
    try {
      const preset = getConverterPreset();
      const result = await window.MustaqbalatConverter.buildExtensionPackage({
        targetBrowser,
        customDefaults: preset
      });
      const kb = (result.sizeBytes / 1024).toFixed(1);
      $("zipSizeBadge").textContent = `الحجم الفعلي للحزمة الكاملة: ${kb} كيلوبايت (${result.fileCount} ملف)`;
      listBox.innerHTML = result.entries
        .map((e) => `<div dir="ltr" style="display:flex;justify-content:space-between;"><span>${e.name}</span><b>${(e.bytes / 1024).toFixed(1)} KB</b></div>`)
        .join("");

      const url = URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        targetBrowser === "firefox"
          ? "mustaqbalat-firefox-mv3.zip"
          : "mustaqbalat-chromium-mv3.zip";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err) {
      listBox.textContent = "حدث خطأ أثناء التوليد: " + err.message;
    }
  }

  $("buildChromeZipBtn").addEventListener("click", () => triggerZipBuild("chromium"));
  $("buildFirefoxZipBtn").addEventListener("click", () => triggerZipBuild("firefox"));

  refreshWebAddons();
})();
