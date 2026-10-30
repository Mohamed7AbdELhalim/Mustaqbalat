> **تنبيه النسخة العربية:** تتوفر النسخة العربية الأصلية المطابقة تماماً لهذا الدليل في **[`docs/ar/USER_GUIDE.md`](../ar/USER_GUIDE.md)**. | **[الصفحة الرئيسية بالعربية](../../README.md)**

# Mustaqbalat User Guide

This document provides direct technical instructions for operating all modes and tools of **Mustaqbalat (Visual Comfort & Screen Dimmer)**, covering both the zero-disk-space web add-on converter (0 bytes on disk) and the full Manifest V3 browser extension.

---

## Table of Contents
1. [Four Deployment Modes Based on Available Device Storage](#1-four-deployment-modes-based-on-available-device-storage)
2. [Default-On Operation, Global Switch, and Per-Site Exclusions](#2-default-on-operation-global-switch-and-per-site-exclusions)
3. [Brightness Control (Decrease & Boost) and Overlay Layers](#3-brightness-control-decrease--boost-and-overlay-layers)
4. [Dark Mode Profiles for Webpages and PDF Documents](#4-dark-mode-profiles-for-webpages-and-pdf-documents)
5. [Advanced Color Studio (HEX, Color Wheel, EyeDropper & Page Colors)](#5-advanced-color-studio-hex-color-wheel-eyedropper--page-colors)
6. [Zero-Storage PDF Dimming and Built-In Reader](#6-zero-storage-pdf-dimming-and-built-in-reader)
7. [Live In-Page System Resource HUD and Days/Weeks Analytics](#7-live-in-page-system-resource-hud-and-daysweeks-analytics)
8. [Reporting Incompatible Websites and Issues via GitHub](#8-reporting-incompatible-websites-and-issues-via-github)
9. [Browser-Restricted System Pages and Expected Behavior](#9-browser-restricted-system-pages-and-expected-behavior)

---

## 1. Four Deployment Modes Based on Available Device Storage

Mustaqbalat is engineered to run on devices with severely constrained storage without requiring heavy downloads or external runtimes:

### A. Instant Drag-and-Drop Web Add-on (Bookmarklet — 0 Bytes on Disk)
1. Open the main studio (`index.html`) and scroll to **Zero-Disk-Space Web Add-on Converter**.
2. Set your preferred initial defaults in the top preset bar (Default Brightness, Default Overlay Layer, Default Dark Mode, and Preferred Screen `HEX` Color).
3. Show your browser's Bookmarks Bar (`Ctrl + Shift + B` on Windows/Linux or `Cmd + Shift + B` on macOS).
4. Drag the orange **Mustaqbalat — Visual Comfort** button directly onto your Bookmarks Bar.
5. On any website or document, click the bookmark to mount the isolated floating control panel immediately with zero files written to disk.
6. **On Mobile Browsers:** Click **Copy Code (Mobile & Browser)**, create a new bookmark, and paste the copied `javascript:...` payload into the bookmark URL field.

### B. Automatic Cross-Site Web Script (Userscript — ~8.5 KB)
1. If you use a lightweight userscript manager (Violentmonkey, Tampermonkey, or Stay on mobile), click **Generate & Install .user.js Instantly** in the second converter card.
2. The script is generated in RAM with `@match *://*/*` and `@match file:///*.pdf` headers so it runs automatically by default across every webpage and PDF.

### C. In-Memory Browser Extension Package (In-RAM ZIP — ~38 KB)
1. In the third converter card, click either **Convert for Chrome / Edge / Brave** or **Convert for Firefox**.
2. The browser assembles a standard `.zip` archive directly in RAM containing your customized defaults and all `Manifest V3` files.

### D. Loading Unpacked Directly from the Repository (`extension/`)
1. Open your browser's extensions management page:
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
   - Brave: `brave://extensions`
2. Enable **Developer mode** at the top of the page.
3. Click **Load unpacked** and select the `extension/` directory inside this repository.
4. For local PDF files stored on your machine (`file:///...`), open the extension's **Details** page in the browser and enable **Allow access to file URLs**.

---

## 2. Default-On Operation, Global Switch, and Per-Site Exclusions

- **Default-On Execution:** Once active, the extension injects at `document_start` (before the browser paints the page) to prevent bright white flashes during navigation.
- **Master Switch (top-left of the popup):** Temporarily pauses Mustaqbalat across all open tabs or re-enables it with one click (`globalEnabled`).
- **Per-Site Exclusion:** The site bar below the header displays the active tab's hostname (e.g., `example.com`) alongside a green status dot when active. Clicking **Exclude Site** disables dimming and dark mode exclusively on that hostname (stored in `excludedSites`) while keeping Mustaqbalat active everywhere else.

---

## 3. Brightness Control (Decrease & Boost) and Overlay Layers

From Tab 1 (**Brightness & Layers**):

1. **Screen Brightness (`20%` to `150%`):**
   - `20%` to `99%`: Reduces screen brightness smoothly for night reading or overly bright monitors.
   - `100%`: Preserves native baseline luminance.
   - `101%` to `150%`: Boosts page luminance (`Brightness Boost`) for dim laptop panels or high-glare daylight environments.
   - Five quick-preset chips appear below the slider: `55%`, `75%`, `88%`, `100%`, and `+125%`.
2. **Website Overlay Layer (`0%` to `85%`):**
   - Renders an independent transparent dimming layer (`position: fixed` with `pointer-events: none`) above the entire viewport without intercepting clicks, text selection, or scrolling.
3. **Dimming Method (`method`):**
   - **Smart Hybrid (`hybrid`):** Splits luminance reduction between GPU CSS filters and the viewport overlay layer for balanced text sharpness and embedded-frame coverage.
   - **Overlay Layers Only (`overlay`):** Uses strictly the fixed viewport overlay layers without applying CSS filters to the root element (useful on sites with complex fixed stacking contexts).
   - **Page Filter Only (`filter`):** Applies luminance adjustments exclusively via root `<html>` GPU CSS filters.
4. **White Glare Reduction (`0%` – `60%`) & Text Contrast (`50%` – `150%`):**
   - Softens harsh `#FFFFFF` backgrounds while allowing independent sharpening of text contrast.

---

## 4. Dark Mode Profiles for Webpages and PDF Documents

From the **Dark Mode for Any Page** selector in Tab 1:
- **Disabled (`off`):** Keeps original site colors while applying your brightness and overlay settings.
- **Smart Dark (`smart`):** Inverts bright page surfaces (`invert(0.92) hue-rotate(180deg)`) and counter-inverts media elements (`img`, `video`, `picture`, `canvas`, `[style*="background-image"]`) so photos and videos retain natural colors without negative-image artifacts.
- **Warm Reading Dark (`warm-dark`):** Combines Smart Dark with a warm `sepia` tone for extended reading sessions.
- **Deep AMOLED Dark (`amoled`):** Increases inversion depth and contrast for near-black backgrounds suited to OLED/AMOLED displays.
- **Dedicated PDF Dark (`pdf-dark`):** Calibrates inversion and contrast specifically for white academic papers and e-books while excluding standalone images from double inversion.

---

## 5. Advanced Color Studio (HEX, Color Wheel, EyeDropper & Page Colors)

From Tab 2 (**HEX Colors**):
1. **Enable Color Layer (`Enable Color`):** Activates a full-viewport color tint layer.
2. **Four Synchronized Color Selection Inputs:**
   - **Interactive Canvas Color Wheel:** Click or drag across the wheel to pick hue and saturation in real time.
   - **Hexadecimal Code Input (`HEX`):** Enter any 6-digit or 3-digit hex code (e.g., `#F59E0B` or `#10B981`).
   - **Screen EyeDropper (`💧`):** Samples any pixel color visible anywhere on your screen using the browser `EyeDropper` API.
   - **RGB Channel Sliders (`R`, `G`, `B`):** Adjust Red, Green, and Blue channels numerically from `0` to `255`.
3. **Tint Intensity & Blend Mode (`mix-blend-mode`):** Control tint opacity (`0%` – `80%`) and choose how the color blends with underlying content (`Multiply`, `Soft Light`, `Darken`, `Color`, `Normal`, `Screen`).
4. **Eight Visual-Comfort Swatch Presets:** Pre-calibrated buttons (Warm Amber, Candlelight, Reading Sepia, Soothing Forest, Calm Rose, Lunar Blue, Soft Violet, Cinematic Slate).
5. **Underlying Webpage Element Colors:** Three dedicated sliders for **Warmth & Blue-Light Filter** (`0%` – `100%`), **Color Saturation** (`0%` full grayscale to `150%`), and **Hue Rotation** (`-180°` to `+180°`).

---

## 6. Zero-Storage PDF Dimming and Built-In Reader

Mustaqbalat handles PDF documents through two complementary mechanisms:
1. **Automatic In-Tab PDF Dimming:** Automatically detects `.pdf` URLs and `<embed type="application/pdf">` viewers, applying the extra dimming specified by **Extra Dimming for PDF White Pages** (`0%` – `50%`).
2. **Built-In Zero-Install RAM PDF Viewer (`extension/pages/pdf-viewer.html`):**
   - Accessible via **Open Built-In PDF Dimmer & Reader (No Install)** in the popup or from the main studio navigation bar.
   - Drag and drop any local PDF file onto the page (or select it via the file button). The file is rendered directly in browser RAM via `URL.createObjectURL(file)` with zero server uploads and zero bytes written to disk, complete with dedicated brightness, overlay, PDF dark mode, and `HEX` controls.

---

## 7. Live In-Page System Resource HUD and Days/Weeks Analytics

To verify runtime efficiency empirically:
1. **Live In-Page Resource HUD:**
   - Displayed in the corner of webpages (repositionable across all 4 corners, collapsible to a compact badge via `–`, or toggleable in Tab 3 **Usage**).
   - Reports real-time metrics: extension page footprint (`~18 KB`), CPU apply latency (`~0.20 ms`), and frame rate (`FPS`).
2. **Mini Chart & Full Analytics Dashboard (`extension/pages/dashboard.html`):**
   - Tab 3 (**Usage**) renders a compact `7 Days` or `4 Weeks` bar chart.
   - Clicking **Open Detailed Usage Dashboard (Days & Weeks)** launches the full analytics view featuring 4 KPI cards, dual 2D Canvas charts (Memory KB + CPU ms, and Active Duration vs. Dark/HEX minutes), and a granular period table across `7d`, `14d`, `4w`, and `8w` horizons, plus JSON export and history reset controls.

---

## 8. Reporting Incompatible Websites and Issues via GitHub

When encountering a webpage that resists overlay dimming or exhibits a technical bug:
1. Click **Didn't Work?** in the top site bar (or switch to Tab 4 **GitHub**).
2. The current tab URL is pre-filled automatically, and you can select the report category (**Incompatible Website**, **Technical Bug**, or **Feature Request**).
3. Enter a brief description and choose one of two actions:
   - **Submit to GitHub Issues:** Generates a structured diagnostic issue on `Mohamed7AbdELhalim/Mustaqbalat` containing the target URL, browser restriction notes (if any), your description, and active settings snapshot—either opening the pre-populated GitHub New Issue form directly or posting via the `GitHub REST API` if an optional Personal Access Token is supplied.
   - **Save & Exclude Site:** Logs the website in your local incompatible-sites registry and adds its hostname to `excludedSites` immediately.

---

## 9. Browser-Restricted System Pages and Expected Behavior

All modern browsers (Chrome, Edge, Brave, Firefox) enforce kernel-level security policies blocking third-party extensions from injecting scripts or overlays into internal browser pages, including:
- Internal browser configuration pages: `chrome://*`, `edge://*`, `about:*`
- Official extension web stores: `chromewebstore.google.com` and `addons.mozilla.org`

When the popup is opened on one of these pages, `service-worker.js` detects the restricted scheme and displays an explicit banner explaining that the restriction is enforced by the browser security sandbox rather than an extension malfunction. Normal automatic operation resumes immediately on any standard webpage or PDF document.
