/**
 * Mustaqbalat — Background Service Worker (Manifest V3)
 * Lightweight coordinator: initializes default-on settings, updates action badge,
 * injects into existing tabs on install, and detects restricted/refused pages.
 */

const STORAGE_KEY_SETTINGS = "mustaqbalat_settings_v1";
const STORAGE_KEY_USAGE = "mustaqbalat_usage_v1";
const STORAGE_KEY_BROKEN_SITES = "mustaqbalat_broken_sites_v1";

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

function isRestrictedBrowserUrl(url) {
  if (!url) return { restricted: true, reason: "صفحة فارغة أو داخلية للمتصفح" };
  const lower = url.toLowerCase();
  if (
    lower.startsWith("chrome://") ||
    lower.startsWith("edge://") ||
    lower.startsWith("brave://") ||
    lower.startsWith("opera://") ||
    lower.startsWith("vivaldi://") ||
    lower.startsWith("about:") ||
    lower.startsWith("moz-extension://")
  ) {
    return {
      restricted: true,
      reason: "صفحات النظام الداخلية للمتصفح تمنع عمل جميع الإضافات لأسباب أمنية."
    };
  }
  if (
    lower.includes("chromewebstore.google.com") ||
    lower.includes("chrome.google.com/webstore") ||
    lower.includes("addons.mozilla.org") ||
    lower.includes("microsoftedge.microsoft.com/addons")
  ) {
    return {
      restricted: true,
      reason: "متجر إضافات المتصفح يمنع تشغيل الإضافات الخارجية داخل صفحاته."
    };
  }
  return { restricted: false, reason: "" };
}

async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY_SETTINGS], (res) => {
      resolve(Object.assign({}, DEFAULT_SETTINGS, (res && res[STORAGE_KEY_SETTINGS]) || {}));
    });
  });
}

async function updateBadgeForTab(tabId, url) {
  try {
    const settings = await getSettings();
    const check = isRestrictedBrowserUrl(url);
    if (check.restricted) {
      await chrome.action.setBadgeText({ tabId, text: "!" });
      await chrome.action.setBadgeBackgroundColor({ tabId, color: "#EF4444" });
      return;
    }

    let host = "";
    try {
      host = new URL(url).hostname || "local-file";
    } catch (_) {
      host = "unknown";
    }

    const isExcluded = Array.isArray(settings.excludedSites) && settings.excludedSites.includes(host);
    const override = (settings.siteOverrides && settings.siteOverrides[host]) || null;
    let active = Boolean(settings.globalEnabled) && !isExcluded;
    if (override && typeof override.enabled === "boolean") active = override.enabled;

    if (!active) {
      await chrome.action.setBadgeText({ tabId, text: "OFF" });
      await chrome.action.setBadgeBackgroundColor({ tabId, color: "#64748B" });
      return;
    }

    const b = override && override.brightness ? override.brightness : settings.brightness;
    const isPdf = (url || "").toLowerCase().endsWith(".pdf");
    const text = isPdf ? "PDF" : `${b}%`;
    await chrome.action.setBadgeText({ tabId, text });
    await chrome.action.setBadgeBackgroundColor({ tabId, color: "#D97706" });
  } catch (_) {}
}

chrome.runtime.onInstalled.addListener(async () => {
  const existing = await new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEY_SETTINGS], (r) => resolve(r[STORAGE_KEY_SETTINGS]));
  });
  const merged = Object.assign({}, DEFAULT_SETTINGS, existing || {});
  await chrome.storage.local.set({ [STORAGE_KEY_SETTINGS]: merged });

  // Inject into currently open http/https tabs so it works immediately without reload
  try {
    const tabs = await chrome.tabs.query({ url: ["http://*/*", "https://*/*"] });
    for (const tab of tabs) {
      if (tab.id) {
        chrome.scripting
          .executeScript({
            target: { tabId: tab.id, allFrames: true },
            files: ["core/mustaqbalat-engine.js"]
          })
          .catch(() => {});
        updateBadgeForTab(tab.id, tab.url || "");
      }
    }
  } catch (_) {}
});

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (tab) updateBadgeForTab(tabId, tab.url || "");
  } catch (_) {}
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" || changeInfo.url) {
    updateBadgeForTab(tabId, (tab && tab.url) || changeInfo.url || "");
  }
});

chrome.storage.onChanged.addListener(async (changes, area) => {
  if (area === "local" && changes[STORAGE_KEY_SETTINGS]) {
    try {
      const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTab && activeTab.id) {
        updateBadgeForTab(activeTab.id, activeTab.url || "");
      }
    } catch (_) {}
  }
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || typeof msg !== "object") return false;

  if (msg.type === "MUSTAQBALAT_CHECK_URL_SUPPORT") {
    const info = isRestrictedBrowserUrl(msg.url || "");
    sendResponse(info);
    return true;
  }

  if (msg.type === "MUSTAQBALAT_SAVE_BROKEN_SITE") {
    chrome.storage.local.get([STORAGE_KEY_BROKEN_SITES], (res) => {
      const list = Array.isArray(res[STORAGE_KEY_BROKEN_SITES]) ? res[STORAGE_KEY_BROKEN_SITES] : [];
      const entry = Object.assign(
        {
          id: Date.now().toString(36),
          reportedAt: new Date().toISOString()
        },
        msg.entry || {}
      );
      list.unshift(entry);
      const trimmed = list.slice(0, 100);
      chrome.storage.local.set({ [STORAGE_KEY_BROKEN_SITES]: trimmed }, () => {
        sendResponse({ ok: true, list: trimmed });
      });
    });
    return true;
  }

  return false;
});
